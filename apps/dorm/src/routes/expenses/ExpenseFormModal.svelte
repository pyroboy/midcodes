<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { ChevronDown, ChevronUp, Loader2 } from 'lucide-svelte';
	import { expenseTypeEnum, months } from './schema';
	import { humanizeExpenseType } from '$lib/utils/format';

	// Props
	let {
		open = false,
		properties = [],
		editMode = false,
		updatedAt = null,
		form,
		errors,
		enhance,
		constraints,
		submitting
	} = $props<{
		open?: boolean;
		properties?: Array<{ id: number; name: string }>;
		editMode?: boolean;
		updatedAt?: string | null;
		form: any;
		errors: any;
		enhance: any;
		constraints: any;
		submitting: any;
	}>();

	const dispatch = createEventDispatcher<{ close: void; cancel: void }>();

	function handleClose() { dispatch('close'); }
	function handleCancel() { dispatch('cancel'); }

	// [P3-14] Capitalize helper
	function capitalize(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	// Year and month
	const currentYear = new Date().getFullYear();
	let years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
	let selectedYear = $state(currentYear.toString());
	let selectedMonth = $state(months[new Date().getMonth()]);

	// [P1-8 / P2-12] Progressive disclosure for notes/receipt
	let showDetails = $state(false);

	// [P1-5] Auto-focus description field on open
	let descriptionRef = $state<HTMLInputElement | null>(null);
	$effect(() => {
		if (open && descriptionRef) {
			setTimeout(() => descriptionRef?.focus(), 150);
		}
	});

	// Sync year/month from form.expense_date when editing
	$effect(() => {
		if (editMode && form.expense_date) {
			const d = new Date(form.expense_date);
			selectedYear = d.getFullYear().toString();
			selectedMonth = months[d.getMonth()];
		}
		// Show details section if notes or receipt already have content
		if (editMode && (form.notes || form.receipt_url)) {
			showDetails = true;
		}
	});

	// Prepare date before submission
	function prepareSubmission() {
		const monthIndex = months.indexOf(selectedMonth);
		const expenseDate = new Date(parseInt(selectedYear), monthIndex, 1);
		form.expense_date = expenseDate.toISOString().split('T')[0];
	}
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[94%] md:max-w-[500px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto"
		>
			<Dialog.Header>
				<Dialog.Title class="text-xl font-bold">
					{editMode ? 'Edit Expense' : 'Add Expense'}
				</Dialog.Title>
				<Dialog.Description class="text-sm text-muted-foreground">
					{editMode ? 'Update the expense details below.' : 'Fill in the expense details below.'}
				</Dialog.Description>
			</Dialog.Header>

			<form
				method="POST"
				action="?/upsert"
				use:enhance={(e: any) => {
					prepareSubmission();
					return enhance(e);
				}}
				class="space-y-4"
			>
				{#if editMode && form.id}
					<input type="hidden" name="id" bind:value={form.id} />
					<input type="hidden" name="_updated_at" value={updatedAt ?? ''} />
				{/if}
				<input type="hidden" name="expense_date" value={form.expense_date ?? ''} />

				<!-- Row 1: Description (full width, auto-focused) -->
				<div class="space-y-2">
					<Label for="description">Description *</Label>
					<Input
						id="description"
						name="description"
						placeholder="e.g. Plumbing repair, Office supplies"
						bind:value={form.description}
						bind:ref={descriptionRef}
						class={errors.description ? 'border-red-500' : ''}
					/>
					{#if errors.description}
						<p class="text-xs text-red-500">{errors.description}</p>
					{/if}
				</div>

				<!-- Row 2: Amount + Type (paired) -->
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="amount">Amount (₱) *</Label>
						<Input
							type="number"
							id="amount"
							name="amount"
							min="0"
							step="0.01"
							inputmode="decimal"
							placeholder="0.00"
							bind:value={form.amount}
							class={errors.amount ? 'border-red-500' : ''}
						/>
						{#if errors.amount}
							<p class="text-xs text-red-500">{errors.amount}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="type">Type *</Label>
						<Select.Root
							type="single"
							name="type"
							value={form.type || 'OPERATIONAL'}
							onValueChange={(v) => (form.type = v)}
						>
							<Select.Trigger class={errors.type ? 'border-red-500' : ''}>
								{form.type ? humanizeExpenseType(form.type) : 'Select type'}
							</Select.Trigger>
							<Select.Content>
								{#each expenseTypeEnum.options as type}
									<Select.Item value={type}>{humanizeExpenseType(type)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if errors.type}
							<p class="text-xs text-red-500">{errors.type}</p>
						{/if}
					</div>
				</div>

				<!-- Row 3: Year + Month + Property (3-col on sm+) -->
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
					<div class="space-y-2">
						<Label for="year">Year</Label>
						<Select.Root type="single" name="year" value={selectedYear} onValueChange={(v) => (selectedYear = v)}>
							<Select.Trigger>{selectedYear}</Select.Trigger>
							<Select.Content>
								{#each years as year}
									<Select.Item value={year.toString()}>{year}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label for="month">Month</Label>
						<Select.Root type="single" name="month" value={selectedMonth} onValueChange={(v) => { if (months.includes(v as any)) selectedMonth = v as any; }}>
							<Select.Trigger>{capitalize(selectedMonth)}</Select.Trigger>
							<Select.Content>
								{#each months as month}
									<Select.Item value={month}>{capitalize(month)}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2 col-span-2 sm:col-span-1">
						<Label for="property_id">Property</Label>
						<Select.Root
							type="single"
							name="property_id"
							value={form.property_id?.toString() || ''}
							onValueChange={(v) => (form.property_id = v ? Number(v) : null)}
						>
							<Select.Trigger>
								{properties.find((p: { id: number; name: string }) => p.id === form.property_id)?.name || 'None'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">None</Select.Item>
								{#each properties as property}
									<Select.Item value={property.id.toString()}>{property.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<!-- [P1-8 / P2-12] Collapsible Notes & Receipt -->
				<div class="border rounded-lg overflow-hidden">
					<button
						type="button"
						class="flex items-center justify-between w-full px-4 py-2.5 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
						onclick={() => showDetails = !showDetails}
					>
						<span class="text-sm text-muted-foreground">
							Notes & Receipt
							{#if form.notes || form.receipt_url}
								<span class="text-primary">(has content)</span>
							{/if}
						</span>
						{#if showDetails}
							<ChevronUp class="h-4 w-4 text-muted-foreground" />
						{:else}
							<ChevronDown class="h-4 w-4 text-muted-foreground" />
						{/if}
					</button>
					{#if showDetails}
						<div class="p-4 space-y-4">
							<div class="space-y-2">
								<Label for="notes">Notes</Label>
								<Textarea
									id="notes"
									name="notes"
									placeholder="Additional notes..."
									rows={2}
									bind:value={form.notes}
								/>
							</div>
							<div class="space-y-2">
								<Label for="receipt_url">Receipt URL</Label>
								<Input
									type="url"
									id="receipt_url"
									name="receipt_url"
									placeholder="https://example.com/receipt.pdf"
									bind:value={form.receipt_url}
								/>
							</div>
						</div>
					{/if}
				</div>

				{#if errors._errors}
					<div class="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
						{errors._errors}
					</div>
				{/if}

				<!-- [P1-4] Sticky CTA on mobile -->
				<div class="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background pb-1 sm:static sm:pb-0">
					<Button type="button" variant="outline" onclick={handleCancel}>Cancel</Button>
					<div class="flex flex-col items-end gap-1">
						<Button type="submit" disabled={submitting || !form.description || !form.amount}>
							{#if submitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Saving...
							{:else}
								{editMode ? 'Update Expense' : 'Add Expense'}
							{/if}
						</Button>
						{#if !submitting && (!form.description || !form.amount)}
							<span class="text-xs text-muted-foreground">Fill description and amount</span>
						{/if}
					</div>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
