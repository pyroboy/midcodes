<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { createEventDispatcher, tick, onMount } from 'svelte';
	import { propertyStatus, propertyType } from './formSchema';
	import type { propertySchema } from './formSchema';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { z } from 'zod/v3';
	import { formatEnumLabel } from '$lib/utils/format';
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		editMode?: boolean;
		updatedAt?: string | null;
		submitting?: boolean;
		form: SuperForm<z.infer<typeof propertySchema>>['form'];
		errors: SuperForm<z.infer<typeof propertySchema>>['errors'];
		enhance: SuperForm<z.infer<typeof propertySchema>>['enhance'];
		constraints: SuperForm<z.infer<typeof propertySchema>>['constraints'];
		actionCreate?: string;
		actionUpdate?: string;
	}

	let { editMode = false, updatedAt = null, submitting = false, form, errors, enhance, constraints, actionCreate = '?/create', actionUpdate = '?/update' }: Props = $props();

	const dispatch = createEventDispatcher();

	// PATTERN FOR ENUM BASED SELECTION ITEMS
	let triggerStatus = $derived($form.status ? formatEnumLabel($form.status) : 'Select a Status');
	let triggerType = $derived($form.type ? formatEnumLabel($form.type) : 'Select a Type');
	// PATTERN FOR ENUM BASED SELECTION ITEMS

	// After-blur validation tracking
	let touched: Record<string, boolean> = $state({});
	function markTouched(field: string) {
		touched[field] = true;
	}

	// Derived: is form valid for submit?
	let canSubmit = $derived(
		!!$form.name?.trim() && !!$form.address?.trim() && !!$form.type && !!$form.status && !submitting
	);

	// Auto-focus first field on modal open (runs once)
	onMount(() => {
		setTimeout(() => {
			const el = document.getElementById('name');
			if (el) el.focus();
		}, 100);
	});

	function handleCancel() {
		dispatch('cancel');
	}
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

	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="name">Name</Label>
			<Input
				type="text"
				id="name"
				name="name"
				bind:value={$form.name}
				class="w-full"
				data-error={touched.name && !!$errors.name}
				aria-invalid={touched.name && !!$errors.name}
				onblur={() => markTouched('name')}
				{...$constraints.name}
			/>
			{#if touched.name && $errors.name}
				<p class="text-sm font-medium text-destructive">{$errors.name}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="address">Address</Label>
			<Input
				type="text"
				id="address"
				name="address"
				bind:value={$form.address}
				class="w-full"
				data-error={touched.address && !!$errors.address}
				aria-invalid={touched.address && !!$errors.address}
				onblur={() => markTouched('address')}
				{...$constraints.address}
			/>
			{#if touched.address && $errors.address}
				<p class="text-sm font-medium text-destructive">{$errors.address}</p>
			{/if}
		</div>

		<!-- Type + Status paired on same row -->
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-2">
				<Label for="type">Type</Label>
				<Select.Root type="single" name="type" bind:value={$form.type}>
					<Select.Trigger class="w-full" data-error={!!$errors.type} {...$constraints.type}>
						{triggerType}
					</Select.Trigger>
					<Select.Content>
						{#each propertyType.options as type}
							<Select.Item value={type}>
								{formatEnumLabel(type)}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				{#if $errors.type}
					<p class="text-sm font-medium text-destructive">{$errors.type}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="status">Status</Label>
				<Select.Root type="single" name="status" bind:value={$form.status}>
					<Select.Trigger class="w-full" data-error={!!$errors.status} {...$constraints.status}>
						{triggerStatus}
					</Select.Trigger>
					<Select.Content>
						{#each propertyStatus.options as status}
							<Select.Item value={status}>
								{formatEnumLabel(status)}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				{#if $errors.status}
					<p class="text-sm font-medium text-destructive">{$errors.status}</p>
				{/if}
			</div>
		</div>

		<div class="flex justify-end space-x-2 sticky bottom-0 bg-background pb-1 sm:static sm:pb-0 pt-2">
			<Button type="button" variant="outline" class="min-h-[44px] sm:min-h-0" onclick={handleCancel}>Cancel</Button>
			<Button type="submit" class="min-h-[44px] sm:min-h-0" disabled={!canSubmit}>
				{#if submitting}
					<Loader2 class="w-4 h-4 mr-2 animate-spin" />
					Saving...
				{:else}
					{editMode ? 'Update' : 'Create'} Property
				{/if}
			</Button>
		</div>
		{#if !canSubmit && !submitting}
			<p class="text-xs text-muted-foreground text-right">Fill in name and address to continue</p>
		{/if}
	</div>
</form>

<style>
	:global([data-error='true']) {
		border-color: hsl(var(--destructive)) !important;
		--tw-ring-color: hsl(var(--destructive)) !important;
		outline: none !important;
	}
</style>
