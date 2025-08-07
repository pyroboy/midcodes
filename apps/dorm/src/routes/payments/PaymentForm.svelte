<script lang="ts">
	import { run } from 'svelte/legacy';

	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { createEventDispatcher } from 'svelte';
	import { paymentSchema, type PaymentSchema } from './formSchema';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	interface Props {
		data: any;
		billings?: any[];
		editMode?: boolean;
		payment?: PaymentSchema | undefined;
	}

	let { data, billings = [], editMode = false, payment = undefined }: Props = $props();

	const dispatch = createEventDispatcher();
	const rows = 3;

	const { form, errors, enhance, submitting, reset } = superForm(data.form, {
		id: 'paymentForm',
		validators: zodClient(paymentSchema),
		resetForm: true,
		taintedMessage: null,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				dispatch('paymentAdded');
				reset();
			}
		}
	});

	function getMethodBadgeVariant(
		method: string
	): 'default' | 'destructive' | 'outline' | 'secondary' {
		switch (method) {
			case 'CASH':
				return 'default';
			case 'BANK':
				return 'secondary';
			case 'GCASH':
				return 'outline';
			default:
				return 'destructive';
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}

	function parseNumberInput(value: string): number {
		return parseFloat(value) || 0;
	}
	run(() => {
		if (payment && editMode) {
			form.set({
				...payment
			});
		}
	});
	let canEdit = $derived(data.isAdminLevel || data.isAccountant || data.isFrontdesk);
	let canUpdateStatus = $derived(data.isAdminLevel || data.isAccountant);
	let selectedBilling = $derived(billings.find((b) => b.id === $form.billing_id));
</script>

<form
	method="POST"
	action={editMode ? '?/update' : '?/create'}
	use:enhance
	class="space-y-4 w-full max-w-xl mx-auto p-4 bg-card rounded-lg border shadow"
>
	{#if editMode}
		<input type="hidden" name="id" bind:value={$form.id} />
	{/if}

	<!-- Billing Selection -->
	<div class="space-y-2">
		<Label for="billing_id">Billing</Label>
		<!-- <Select.Root>
      <Select.Trigger 
        id="billing_id" 
        disabled={!canEdit || editMode}
        class="w-full"
      >
        <Select.Value>
          {#if selectedBilling}
            {selectedBilling.lease.name} - {selectedBilling.type} - {formatCurrency(selectedBilling.balance)}
          {:else}
            Select a billing
          {/if}
        </Select.Value>
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          {#each billings as billing}
            <Select.Item 
              value={billing.id} 
              on:click={() => form.update($form => ({ ...$form, billing_id: billing.id }))}
            >
              {billing.lease.name} - {billing.type} - {formatCurrency(billing.balance)}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root> -->
		{#if $errors.billing_id}
			<p class="text-sm text-destructive">{$errors.billing_id}</p>
		{/if}
	</div>

	<!-- Amount -->
	<div class="space-y-2">
		<Label for="amount">Amount</Label>
		<div class="relative">
			<Input
				type="number"
				id="amount"
				name="amount"
				min="0"
				step="0.01"
				bind:value={$form.amount}
				disabled={!canEdit}
				style={$form.amount > (selectedBilling?.balance || 0)
					? 'border-color: var(--destructive)'
					: ''}
			/>
		</div>
		{#if $errors.amount}
			<p class="text-sm text-destructive">{$errors.amount}</p>
		{/if}
		{#if selectedBilling}
			<p class="text-sm text-muted-foreground">
				Balance: {formatCurrency(selectedBilling.balance)}
				{#if $form.amount > selectedBilling.balance}
					<span class="text-destructive">Amount exceeds balance</span>
				{/if}
			</p>
		{/if}
	</div>

	<!-- Payment Method -->
	<div class="space-y-2">
		<Label for="method">Payment Method</Label>
		<!-- <Select.Root>
      <Select.Trigger 
        id="method"
        disabled={!canEdit}
        class="w-full"
      >
        <Select.Value>
          {#if $form.method}
            <Badge variant={getMethodBadgeVariant($form.method)}>{$form.method}</Badge>
          {:else}
            Select payment method
          {/if}
        </Select.Value>
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          {#each ['CASH', 'BANK', 'GCASH', 'OTHER'] as method}
            <Select.Item 
              value={method}
              on:click={() => form.update($form => ({ ...$form, method }))}
            >
              <Badge variant={getMethodBadgeVariant(method)}>{method}</Badge>
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root> -->
		{#if $errors.method}
			<p class="text-sm text-destructive">{$errors.method}</p>
		{/if}
	</div>

	<!-- Reference Number -->
	<div class="space-y-2">
		<Label for="reference_number">Reference Number</Label>
		<Input
			type="text"
			id="reference_number"
			name="reference_number"
			bind:value={$form.reference_number}
			disabled={!canEdit}
			placeholder="Enter reference number"
		/>
		{#if $errors.reference_number}
			<p class="text-sm text-destructive">{$errors.reference_number}</p>
		{/if}
	</div>

	<!-- Receipt URL -->
	<div class="space-y-2">
		<Label for="receipt_url">Receipt URL</Label>
		<div class="flex gap-2">
			<Input
				type="url"
				id="receipt_url"
				name="receipt_url"
				placeholder="https://example.com/receipt.pdf"
				bind:value={$form.receipt_url}
				disabled={!canEdit}
			/>
			{#if $form.receipt_url}
				<a
					href={$form.receipt_url}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
				>
					View
				</a>
			{/if}
		</div>
		{#if $errors.receipt_url}
			<p class="text-sm text-destructive">{$errors.receipt_url}</p>
		{/if}
	</div>

	<!-- Paid By -->
	<div class="space-y-2">
		<Label for="paid_by">Paid By</Label>
		<Input
			type="text"
			id="paid_by"
			name="paid_by"
			bind:value={$form.paid_by}
			disabled={!canEdit}
			placeholder="Enter payer's name"
		/>
		{#if $errors.paid_by}
			<p class="text-sm text-destructive">{$errors.paid_by}</p>
		{/if}
	</div>

	<!-- Payment Date -->
	<div class="space-y-2">
		<Label for="paid_at">Payment Date</Label>
		<Input
			type="datetime-local"
			id="paid_at"
			name="paid_at"
			bind:value={$form.paid_at}
			disabled={!canEdit}
		/>
		{#if $errors.paid_at}
			<p class="text-sm text-destructive">{$errors.paid_at}</p>
		{/if}
	</div>

	<!-- Notes -->
	<div class="space-y-2">
		<Label for="notes">Notes</Label>
		<Textarea
			id="notes"
			name="notes"
			{rows}
			bind:value={$form.notes}
			disabled={!canEdit}
			placeholder="Enter any additional notes"
		/>
		{#if $errors.notes}
			<p class="text-sm text-destructive">{$errors.notes}</p>
		{/if}
	</div>

	<!-- Submit Button -->
	<div class="flex justify-end">
		<Button type="submit" disabled={!canEdit || $submitting}>
			{#if $submitting}
				Processing...
			{:else if editMode}
				Update Payment
			{:else}
				Create Payment
			{/if}
		</Button>
	</div>
</form>
