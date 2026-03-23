<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { createEventDispatcher } from 'svelte';
	import { propertyStore } from '$lib/stores/property';
	import { locationStatusEnum, rentalUnitTypeEnum } from './formSchema';
	import type { Floor } from './formSchema';
	import { X, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { browser } from '$app/environment';

	const LS_TYPE_KEY = 'dorm:rental-unit:lastType';
	const LS_STATUS_KEY = 'dorm:rental-unit:lastStatus';

	let { data, editMode = false, updatedAt = null, form, errors, enhance, constraints, actionCreate = '?/create', actionUpdate = '?/update' }: { data: any; editMode?: boolean; updatedAt?: string | null; form: any; errors: any; enhance: any; constraints: any; actionCreate?: string; actionUpdate?: string } = $props();

	const dispatch = createEventDispatcher();
	let selectedProperty = $derived($propertyStore.selectedProperty);

	// [P0-1] Format type enum to human-readable labels
	function formatType(type: string): string {
		const map: Record<string, string> = {
			'BEDSPACER': 'Bed Spacer',
			'PRIVATEROOM': 'Private Room',
			'DORMITORY': 'Dormitory',
			'STUDIO': 'Studio',
			'SHARED': 'Shared',
		};
		return map[type] || type.charAt(0) + type.slice(1).toLowerCase();
	}

	// [P1-5] Format status enum to title case
	function formatStatus(status: string): string {
		return status.charAt(0) + status.slice(1).toLowerCase();
	}

	// Floor Logic
	let derivedFloors = $derived(
		selectedProperty
			? data.floors
					.filter((f: Floor) => String(f.property_id) === String(selectedProperty?.id) && f.status === 'ACTIVE')
					.map((f: Floor) => ({
						value: f.id.toString(),
						label: `Floor ${f.floor_number}${f.wing ? ` (${f.wing})` : ''}`
					}))
			: []
	);

	// Helper to handle select bindings safely
	function getSelectValue(val: number | undefined | null) {
		return val ? val.toString() : '';
	}

	// Amenities Logic
	let currentAmenity = $state('');
	// [P2-11] Collapsible amenities — expanded by default in edit mode or when amenities exist
	let showAmenities = $state(false);

	$effect(() => {
		if (editMode && $form.amenities?.length > 0) {
			showAmenities = true;
		}
	});

	function addAmenity(e?: Event) {
		e?.preventDefault();
		if (currentAmenity.trim()) {
			$form.amenities = [...($form.amenities || []), currentAmenity.trim()];
			currentAmenity = '';
		}
	}

	function removeAmenity(idx: number) {
		$form.amenities = ($form.amenities || []).filter((_: any, i: number) => i !== idx);
	}

	// Restore last used type/status for new units
	$effect(() => {
		if (!editMode && browser) {
			const savedType = localStorage.getItem(LS_TYPE_KEY);
			if (savedType && rentalUnitTypeEnum.options.includes(savedType as any) && !$form.type) {
				$form.type = savedType;
			}
			const savedStatus = localStorage.getItem(LS_STATUS_KEY);
			if (savedStatus && locationStatusEnum.options.includes(savedStatus as any) && !$form.rental_unit_status) {
				$form.rental_unit_status = savedStatus;
			}
		}
	});

	// Submission state
	let isSubmitting = $derived($form.submitting);

	// [P1-6] Auto-focus first field on mount
	let nameInputRef = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (nameInputRef) {
			setTimeout(() => nameInputRef?.focus(), 150);
		}
	});
</script>

<form method="POST" action={editMode ? actionUpdate : actionCreate} use:enhance class="space-y-4">
	{#if editMode}
		<input type="hidden" name="id" value={$form.id || ''} />
		<input type="hidden" name="_updated_at" value={updatedAt ?? ''} />
	{/if}

	<!-- Ensure property ID is submitted -->
	<input type="hidden" name="property_id" value={selectedProperty?.id || $form.property_id} />

	<div class="grid grid-cols-2 gap-4">
		<!-- Floor Selection -->
		<div class="space-y-2">
			<Label for="floor_id">Floor *</Label>
			<Select.Root
				type="single"
				value={getSelectValue($form.floor_id)}
				onValueChange={(v) => ($form.floor_id = Number(v))}
				disabled={!selectedProperty || derivedFloors.length === 0}
			>
				<Select.Trigger class="min-h-[44px] {$errors.floor_id ? 'border-red-500' : ''}">
					{#if !selectedProperty}
						Select a property first
					{:else if derivedFloors.length === 0}
						No floors available
					{:else}
						{derivedFloors.find((f: any) => f.value === getSelectValue($form.floor_id))?.label ||
							'Select a floor'}
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each derivedFloors as floor}
						<Select.Item value={floor.value}>{floor.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if $errors.floor_id}
				<p class="text-xs text-red-500">{$errors.floor_id}</p>
			{/if}
		</div>

		<!-- Name Input -->
		<div class="space-y-2">
			<Label for="name">Unit Name *</Label>
			<Input
				id="name"
				name="name"
				placeholder="e.g. Room 101"
				bind:value={$form.name}
				bind:ref={nameInputRef}
				class="min-h-[44px] {$errors.name ? 'border-red-500' : ''}"
				{...constraints.name}
			/>
			{#if $errors.name}
				<p class="text-xs text-red-500">{$errors.name}</p>
			{/if}
		</div>
	</div>

	<!-- [P2-10] Number + Type paired on all viewports -->
	<div class="grid grid-cols-2 gap-4">
		<!-- Number Input [P0-2] inputmode="numeric" -->
		<div class="space-y-2">
			<Label for="number">Unit Number *</Label>
			<Input
				type="number"
				id="number"
				name="number"
				min="1"
				inputmode="numeric"
				placeholder="e.g. 101"
				value={$form.number || ''}
				oninput={(e) => { const v = (e.target as HTMLInputElement).value; $form.number = v === '' ? 0 : Number(v); }}
				class="min-h-[44px] {$errors.number ? 'border-red-500' : ''}"
				{...constraints.number}
			/>
			{#if $errors.number}
				<p class="text-xs text-red-500">{$errors.number}</p>
			{/if}
		</div>

		<!-- [P0-1] Type Select with formatted labels -->
		<div class="space-y-2">
			<Label for="type">Type *</Label>
			<Select.Root type="single" value={$form.type} onValueChange={(v) => ($form.type = v)}>
				<Select.Trigger class="min-h-[44px] {$errors.type ? 'border-red-500' : ''}">
					{$form.type ? formatType($form.type) : 'Select type'}
				</Select.Trigger>
				<Select.Content>
					{#each rentalUnitTypeEnum.options as type}
						<Select.Item value={type}>{formatType(type)}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if $errors.type}
				<p class="text-xs text-red-500">{$errors.type}</p>
			{/if}
		</div>
	</div>

	<!-- [P2-10] Capacity + Base Rate + Status in one row on sm+ -->
	<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
		<!-- Capacity [P0-2] inputmode="numeric" -->
		<div class="space-y-2">
			<Label for="capacity">Capacity *</Label>
			<Input
				type="number"
				id="capacity"
				name="capacity"
				min="1"
				inputmode="numeric"
				bind:value={$form.capacity}
				class="min-h-[44px] {$errors.capacity ? 'border-red-500' : ''}"
				{...constraints.capacity}
			/>
			{#if $errors.capacity}
				<p class="text-xs text-red-500">{$errors.capacity}</p>
			{/if}
		</div>

		<!-- Base Rate [P0-2] inputmode="decimal" -->
		<div class="space-y-2">
			<Label for="base_rate">Base Rate (₱) *</Label>
			<Input
				type="number"
				id="base_rate"
				name="base_rate"
				min="0"
				step="0.01"
				inputmode="decimal"
				placeholder="e.g. 3500.00"
				value={$form.base_rate || ''}
				oninput={(e) => { const v = (e.target as HTMLInputElement).value; $form.base_rate = v === '' ? 0 : Number(v); }}
				class="min-h-[44px] {$errors.base_rate ? 'border-red-500' : ''}"
				{...constraints.base_rate}
			/>
			{#if $errors.base_rate}
				<p class="text-xs text-red-500">{$errors.base_rate}</p>
			{/if}
		</div>

		<!-- [P1-5] Status with formatted labels, paired with capacity/rate row on sm+ -->
		<div class="space-y-2 col-span-2 sm:col-span-1">
			<Label for="rental_unit_status">Status</Label>
			<Select.Root
				type="single"
				value={$form.rental_unit_status}
				onValueChange={(v) => ($form.rental_unit_status = v)}
			>
				<Select.Trigger class="min-h-[44px]">
					{$form.rental_unit_status ? formatStatus($form.rental_unit_status) : 'Vacant'}
				</Select.Trigger>
				<Select.Content>
					{#each locationStatusEnum.options as status}
						<Select.Item value={status}>{formatStatus(status)}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- [P2-11] Collapsible Amenities -->
	<div class="border border-gray-100 rounded-lg overflow-hidden">
		<button
			type="button"
			class="flex items-center justify-between w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
			onclick={() => showAmenities = !showAmenities}
		>
			<span class="text-sm font-medium">
				Amenities
				{#if $form.amenities?.length}
					<span class="text-muted-foreground">({$form.amenities.length})</span>
				{/if}
			</span>
			{#if showAmenities}
				<ChevronUp class="h-4 w-4 text-muted-foreground" />
			{:else}
				<ChevronDown class="h-4 w-4 text-muted-foreground" />
			{/if}
		</button>

		{#if showAmenities}
			<div class="p-4 space-y-2">
				<div class="flex gap-2">
					<Input
						type="text"
						class="min-h-[44px]"
						bind:value={currentAmenity}
						placeholder="e.g. Aircon, Heater, Cabinet"
						onkeydown={(e) => e.key === 'Enter' && addAmenity(e)}
					/>
					<Button type="button" variant="secondary" class="min-h-[44px]" onclick={addAmenity} aria-label="Add amenity">
						<Plus class="h-4 w-4" />
					</Button>
				</div>

				{#if $form.amenities?.length}
					<div class="flex flex-wrap gap-2 mt-2">
						{#each $form.amenities as amenity, i}
							<!-- [P1-4] Amenity chip with 44px touch target on remove button -->
							<div
								class="flex items-center gap-1 bg-white border border-gray-200 pl-2.5 pr-1 py-0.5 rounded text-sm text-gray-700 shadow-sm"
							>
								<span>{amenity}</span>
								<button
									type="button"
									class="min-w-[28px] min-h-[28px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
									onclick={() => removeAmenity(i)}
									aria-label="Remove {amenity}"
								>
									<X class="h-3.5 w-3.5" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-xs text-muted-foreground italic">No amenities added yet.</p>
				{/if}
			</div>
		{/if}

		<!-- Hidden input for amenities array -->
		{#each $form.amenities || [] as amenity}
			<input type="hidden" name="amenities" value={amenity} />
		{/each}
	</div>

	{#if $errors._errors}
		<div class="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
			{$errors._errors}
		</div>
	{/if}

	<!-- [P0-3] Sticky footer on mobile -->
	<div class="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background pb-1 sm:static sm:pb-0">
		<Button type="button" variant="outline" class="min-h-[44px]" onclick={() => dispatch('cancel')}>Cancel</Button>
		<Button type="submit" class="min-h-[44px]" disabled={isSubmitting}>
			{#if isSubmitting}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Saving...
			{:else}
				{editMode ? 'Update Unit' : 'Create Unit'}
			{/if}
		</Button>
	</div>
</form>
