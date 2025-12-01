<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { createEventDispatcher } from 'svelte';
	import { propertyStore } from '$lib/stores/property';
	import { locationStatusEnum, rentalUnitTypeEnum } from './formSchema';
	import type { Floor } from './formSchema';
	import { X, Plus, Loader2 } from 'lucide-svelte';

	let { data, editMode = false, form, errors, enhance, constraints } = $props();

	const dispatch = createEventDispatcher();
	let selectedProperty = $derived($propertyStore.selectedProperty);

	// Floor Logic
	let derivedFloors = $derived(
		selectedProperty
			? data.floors
					.filter((f: Floor) => f.property_id === selectedProperty?.id && f.status === 'ACTIVE')
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

	// Submission state (Superforms handles this via the store, but visual state for button)
	let isSubmitting = $derived($form.submitting);
</script>

<form method="POST" action={editMode ? '?/update' : '?/create'} use:enhance class="space-y-6">
	{#if editMode}
		<input type="hidden" name="id" value={$form.id || ''} />
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
				<Select.Trigger class={$errors.floor_id ? 'border-red-500' : ''}>
					{#if !selectedProperty}
						Select a property first
					{:else if derivedFloors.length === 0}
						No floors available
					{:else}
						{derivedFloors.find((f) => f.value === getSelectValue($form.floor_id))?.label ||
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
				class={$errors.name ? 'border-red-500' : ''}
				{...constraints.name}
			/>
			{#if $errors.name}
				<p class="text-xs text-red-500">{$errors.name}</p>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<!-- Number Input -->
		<div class="space-y-2">
			<Label for="number">Unit Number *</Label>
			<Input
				type="number"
				id="number"
				name="number"
				min="1"
				bind:value={$form.number}
				class={$errors.number ? 'border-red-500' : ''}
				{...constraints.number}
			/>
			{#if $errors.number}
				<p class="text-xs text-red-500">{$errors.number}</p>
			{/if}
		</div>

		<!-- Type Select -->
		<div class="space-y-2">
			<Label for="type">Type *</Label>
			<Select.Root type="single" value={$form.type} onValueChange={(v) => ($form.type = v)}>
				<Select.Trigger class={$errors.type ? 'border-red-500' : ''}>
					{$form.type || 'Select type'}
				</Select.Trigger>
				<Select.Content>
					{#each rentalUnitTypeEnum.options as type}
						<Select.Item value={type}>{type}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if $errors.type}
				<p class="text-xs text-red-500">{$errors.type}</p>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<!-- Capacity -->
		<div class="space-y-2">
			<Label for="capacity">Capacity *</Label>
			<Input
				type="number"
				id="capacity"
				name="capacity"
				min="1"
				bind:value={$form.capacity}
				class={$errors.capacity ? 'border-red-500' : ''}
				{...constraints.capacity}
			/>
			{#if $errors.capacity}
				<p class="text-xs text-red-500">{$errors.capacity}</p>
			{/if}
		</div>

		<!-- Base Rate -->
		<div class="space-y-2">
			<Label for="base_rate">Base Rate (₱) *</Label>
			<Input
				type="number"
				id="base_rate"
				name="base_rate"
				min="0"
				step="0.01"
				bind:value={$form.base_rate}
				class={$errors.base_rate ? 'border-red-500' : ''}
				{...constraints.base_rate}
			/>
			{#if $errors.base_rate}
				<p class="text-xs text-red-500">{$errors.base_rate}</p>
			{/if}
		</div>
	</div>

	<!-- Status -->
	<div class="space-y-2">
		<Label for="rental_unit_status">Occupancy Status</Label>
		<Select.Root
			type="single"
			value={$form.rental_unit_status}
			onValueChange={(v) => ($form.rental_unit_status = v)}
		>
			<Select.Trigger>
				{$form.rental_unit_status || 'VACANT'}
			</Select.Trigger>
			<Select.Content>
				{#each locationStatusEnum.options as status}
					<Select.Item value={status}>{status}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Amenities -->
	<div class="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
		<Label>Amenities</Label>
		<div class="flex gap-2">
			<Input
				type="text"
				bind:value={currentAmenity}
				placeholder="e.g. Aircon, Heater, Cabinet"
				onkeydown={(e) => e.key === 'Enter' && addAmenity(e)}
			/>
			<Button type="button" variant="secondary" onclick={addAmenity}>
				<Plus class="h-4 w-4" />
			</Button>
		</div>

		{#if $form.amenities?.length}
			<div class="flex flex-wrap gap-2 mt-3">
				{#each $form.amenities as amenity, i}
					<div
						class="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-sm text-gray-700 shadow-sm"
					>
						<span>{amenity}</span>
						<button
							type="button"
							class="text-gray-400 hover:text-red-500 transition-colors ml-1"
							onclick={() => removeAmenity(i)}
						>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-xs text-muted-foreground mt-2 italic">No amenities added yet.</p>
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

	<!-- Actions -->
	<div class="flex justify-end gap-3 pt-4 border-t">
		<Button type="button" variant="outline" onclick={() => dispatch('cancel')}>Cancel</Button>
		<Button type="submit" disabled={isSubmitting}>
			{#if isSubmitting}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Saving...
			{:else}
				{editMode ? 'Update Unit' : 'Create Unit'}
			{/if}
		</Button>
	</div>
</form>
