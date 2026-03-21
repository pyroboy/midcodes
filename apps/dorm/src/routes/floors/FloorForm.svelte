<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Loader2 } from 'lucide-svelte';
	import { floorStatusEnum } from './formSchema';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { z } from 'zod/v3';
	import type { floorSchema } from './formSchema';
	import { propertyStore } from '$lib/stores/property';
	import { browser } from '$app/environment';

	const LS_KEY = 'dorm:floors:lastStatus';

	interface Props {
		editMode?: boolean;
		updatedAt?: string | null;
		isSubmitting?: boolean;
		form: SuperForm<z.infer<typeof floorSchema>>['form'];
		errors: SuperForm<z.infer<typeof floorSchema>>['errors'];
		enhance: SuperForm<z.infer<typeof floorSchema>>['enhance'];
		constraints: SuperForm<z.infer<typeof floorSchema>>['constraints'];
		oncancel?: () => void;
		actionCreate?: string;
		actionUpdate?: string;
	}

	let { editMode = false, updatedAt = null, isSubmitting = false, form, errors, enhance, constraints, oncancel, actionCreate = '?/create', actionUpdate = '?/update' }: Props = $props();

	$effect(() => {
		if ($propertyStore.selectedProperty) {
			$form.property_id = $propertyStore.selectedProperty.id;
		}
	});

	// Remember last used status for new floors
	$effect(() => {
		if (!editMode && browser) {
			const saved = localStorage.getItem(LS_KEY);
			if (saved && Object.values(floorStatusEnum.Values).includes(saved as any)) {
				$form.status = saved as any;
			}
		}
	});

	/** Humanize raw enum labels: "ACTIVE" → "Active", "MAINTENANCE" → "Maintenance" */
	function humanize(s: string): string {
		return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\B\w+/g, (w) => w.toLowerCase());
	}

	// START: PATTERN FOR ENUM BASED SELECTION ITEMS
	let derivedStatuses = $derived(
		Object.values(floorStatusEnum.Values).map((status) => ({
			value: status,
			label: humanize(status)
		}))
	);
	let selectedStatus = {
		get value() {
			return $form.status as keyof typeof floorStatusEnum.Values;
		},
		set value(status: keyof typeof floorStatusEnum.Values) {
			$form.status = status || 'ACTIVE';
			if (browser) localStorage.setItem(LS_KEY, $form.status);
		}
	};
	let triggerStatus = $derived(
		selectedStatus.value ? humanize(selectedStatus.value) : 'Select a Status'
	);
	// END: PATTERN FOR ENUM BASED SELECTION ITEMS
</script>

<form
	method="POST"
	action={editMode ? actionUpdate : actionCreate}
	use:enhance
	class="space-y-4"
	novalidate
>
	{#if editMode && $form.id}
		<input type="hidden" name="id" bind:value={$form.id} />
		<input type="hidden" name="_updated_at" value={updatedAt ?? ''} />
	{/if}

	<input type="hidden" name="property_id" bind:value={$form.property_id} />

	<div class="grid grid-cols-2 gap-3">
		<div class="space-y-2">
			<Label for="floor_number">Floor Number</Label>
			<Input
				type="number"
				id="floor_number"
				name="floor_number"
				min="1"
				inputmode="numeric"
				autofocus
				bind:value={$form.floor_number}
				class="w-full min-h-[44px]"
				data-error={!!$errors.floor_number}
				aria-invalid={!!$errors.floor_number}
				{...$constraints.floor_number}
			/>
			{#if $errors.floor_number}
				<p class="text-sm font-medium text-destructive">{$errors.floor_number}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="wing">Wing <span class="text-muted-foreground font-normal">(optional)</span></Label>
			<Input
				type="text"
				id="wing"
				name="wing"
				bind:value={$form.wing}
				class="w-full min-h-[44px]"
				data-error={!!$errors.wing}
				aria-invalid={!!$errors.wing}
				{...$constraints.wing}
				placeholder="e.g. A, West"
			/>
			{#if $errors.wing}
				<p class="text-sm font-medium text-destructive">{$errors.wing}</p>
			{/if}
		</div>
	</div>

	<div class="space-y-2">
		<Label for="status">Status</Label>
		<Select.Root type="single" name="status" bind:value={selectedStatus.value}>
			<Select.Trigger class="w-full min-h-[44px]" data-error={!!$errors.status} {...$constraints.status}>
				{triggerStatus}
			</Select.Trigger>
			<Select.Content>
				{#each derivedStatuses as status}
					<Select.Item value={status.value}>
						{status.label}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		{#if $errors.status}
			<p class="text-sm font-medium text-destructive">{$errors.status}</p>
		{/if}
	</div>

	<div class="flex justify-end space-x-2 sticky bottom-0 bg-background pt-4 pb-2">
		<Button type="button" variant="outline" class="min-h-[44px]" onclick={() => oncancel?.()}>Cancel</Button>
		<Button type="submit" class="min-h-[44px]" disabled={isSubmitting}>
			{#if isSubmitting}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Saving...
			{:else}
				{editMode ? 'Update' : 'Add'} Floor
			{/if}
		</Button>
	</div>
</form>

<style>
	:global([data-error='true']) {
		border-color: hsl(var(--destructive)) !important;
		--tw-ring-color: hsl(var(--destructive)) !important;
		outline: none !important;
	}
</style>
