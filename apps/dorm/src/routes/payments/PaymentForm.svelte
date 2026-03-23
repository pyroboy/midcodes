<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Loader2 } from 'lucide-svelte';
	import { paymentSchema, type PaymentSchema } from './formSchema';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { toast } from 'svelte-sonner';
	import { formatCurrency } from '$lib/utils/format';
	import { resyncCollection } from '$lib/db/replication';
	import { paymentsStore } from '$lib/stores/collections.svelte';

	let showNotes = $state(false);

	// Format due_date as short month/year for billing context
	function formatBillingPeriod(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		try {
			const d = new Date(dateStr);
			if (isNaN(d.getTime())) return '';
			return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
		} catch {
			return '';
		}
	}

	const PAYMENT_METHOD_KEY = 'dorm-last-payment-method';
	const VALID_METHODS = ['CASH', 'BANK', 'GCASH', 'SECURITY_DEPOSIT', 'OTHER'];

	interface Props {
		data: any;
		billings?: any[];
		editMode?: boolean;
		payment?: PaymentSchema | undefined;
		onPaymentAdded?: () => void;
	}

	let { data, billings = [], editMode = false, payment = undefined, onPaymentAdded = () => {} }: Props = $props();
	const rows = 3;

	const { form, errors, enhance, submitting, reset } = superForm(defaults(zod(paymentSchema)), {
		id: 'paymentForm',
		validators: zodClient(paymentSchema),
		resetForm: true,
		taintedMessage: null,
		invalidateAll: false,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				// Capture values before reset for toast + localStorage
				const paidAmount = $form.amount;
				const paidMethod = $form.method;
				const leaseName = selectedBilling?.lease?.name ?? 'Payment';

				// Persist last payment method
				if (paidMethod) {
					localStorage.setItem(PAYMENT_METHOD_KEY, paidMethod);
				}

				onPaymentAdded();
				resyncCollection('payments');
				resyncCollection('payment_allocations');
				resyncCollection('billings');
				reset();

				// Rich success toast
				toast.success(`${formatCurrency(paidAmount)} via ${paidMethod}`, {
					description: `Payment for ${leaseName}`,
					duration: 6000,
					action: {
						label: 'Undo',
						onClick: () => toast.info('Contact admin to reverse this payment', { duration: 5000 })
					}
				});
			}
		}
	});

	const METHOD_LABELS: Record<string, string> = {
		CASH: 'Cash',
		BANK: 'Bank',
		GCASH: 'GCash',
		OTHER: 'Other',
		SECURITY_DEPOSIT: 'Security Deposit'
	};

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

	function parseNumberInput(value: string): number {
		return parseFloat(value) || 0;
	}
	$effect(() => {
		if (payment && editMode) {
			form.set({
				...payment
			});
			if (payment.notes) showNotes = true;
		}
	});
	let canEdit = $derived(data.isAdminLevel || data.isAccountant || data.isFrontdesk);
	let canUpdateStatus = $derived(data.isAdminLevel || data.isAccountant);
	let selectedBilling = $derived(billings.find((b) => b.id === $form.billing_id));

	// Restore last payment method from localStorage
	$effect(() => {
		if (!editMode && !$form.method) {
			const saved = localStorage.getItem(PAYMENT_METHOD_KEY);
			if (saved && VALID_METHODS.includes(saved)) {
				$form.method = saved as typeof $form.method;
			}
		}
	});

	// Auto-fill intelligent defaults when a billing is selected
	$effect(() => {
		if (!selectedBilling || editMode) return;

		// Auto-fill amount if still at default (0 or empty)
		if (!$form.amount || $form.amount === 0) {
			$form.amount = selectedBilling.balance ?? 0;
		}

		// Auto-fill paid_by if empty
		if (!$form.paid_by) {
			$form.paid_by = selectedBilling.lease?.name ?? '';
		}

		// Auto-fill paid_at if empty
		if (!$form.paid_at) {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			$form.paid_at = `${year}-${month}-${day}T${hours}:${minutes}`;
		}
	});

	// Duplicate detection + overpayment prevention
	function handleFormSubmit(event: Event) {
		// Duplicate payment guard — warn if similar payment in last 24h
		if ($form.billing_id && $form.amount > 0) {
			const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
			const currentBillingId = String($form.billing_id);
			const recentSimilar = paymentsStore.value.filter((p: any) => {
				if (!p.paid_at || p.paid_at < twentyFourHoursAgo) return false;
				const pAmount = parseFloat(p.amount) || 0;
				if (pAmount === 0) return false;
				const ratio = pAmount / $form.amount;
				if (ratio < 0.9 || ratio > 1.1) return false;
				const pBillingIds: string[] = p.billing_ids || (p.billing_id ? [p.billing_id] : []);
				return pBillingIds.some((id: string) => String(id) === currentBillingId);
			});

			if (recentSimilar.length > 0) {
				const dup = recentSimilar[0];
				const ago = Math.round((Date.now() - new Date(dup.paid_at).getTime()) / 60000);
				const timeStr = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;
				if (!confirm(`A ${formatCurrency(parseFloat(dup.amount))} payment was recorded ${timeStr}. Submit another?`)) {
					event.preventDefault();
					return;
				}
			}
		}

		// Overpayment prevention
		if (selectedBilling && $form.amount > selectedBilling.balance) {
			event.preventDefault();
			toast.error('Amount exceeds billing balance', {
				description: `Maximum payable: ${formatCurrency(selectedBilling.balance)}`
			});
		}
	}
</script>

<form
	method="POST"
	action={editMode ? '?/update' : '?/create'}
	use:enhance
	onsubmit={handleFormSubmit}
	class="space-y-4 w-full max-w-xl mx-auto p-4 bg-card rounded-lg border shadow"
>
	{#if editMode}
		<input type="hidden" name="id" bind:value={$form.id} />
	{/if}

	<!-- Billing Selection -->
	<div class="space-y-2">
		<Label for="billing_id">Billing</Label>
		<Select.Root type="single" name="billing_id" value={String($form.billing_id ?? '')} onValueChange={(v) => { $form.billing_id = Number(v); }} disabled={!canEdit || editMode}>
			<Select.Trigger id="billing_id" class="w-full">
				{#if selectedBilling}
					{selectedBilling.lease?.name ?? 'Unknown'} - {selectedBilling.type}{#if formatBillingPeriod(selectedBilling.due_date)}{' '}({formatBillingPeriod(selectedBilling.due_date)}){/if} - {formatCurrency(selectedBilling.balance)}
				{:else}
					Select a billing
				{/if}
			</Select.Trigger>
			<Select.Content>
				{#each billings as billing}
					<Select.Item value={String(billing.id)}>
						{billing.lease?.name ?? 'Unknown'} - {billing.type}{#if formatBillingPeriod(billing.due_date)}{' '}({formatBillingPeriod(billing.due_date)}){/if} - {formatCurrency(billing.balance)}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		{#if $errors.billing_id}
			<p class="text-sm text-destructive">{$errors.billing_id}</p>
		{/if}
	</div>

	<!-- Row 1: Amount + Method (paired at sm+) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
					inputmode="decimal"
					data-payment-amount
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
			<Select.Root type="single" name="method" bind:value={$form.method} disabled={!canEdit}>
				<Select.Trigger id="method" class="w-full">
					{#if $form.method}
						<Badge variant={getMethodBadgeVariant($form.method)}>{METHOD_LABELS[$form.method] ?? $form.method}</Badge>
					{:else}
						Select payment method
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each ['CASH', 'BANK', 'GCASH', 'OTHER'] as method}
						<Select.Item value={method}>
							<Badge variant={getMethodBadgeVariant(method)}>{METHOD_LABELS[method] ?? method}</Badge>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if $errors.method}
				<p class="text-sm text-destructive">{$errors.method}</p>
			{/if}
		</div>
	</div>

	<!-- Row 2: Reference + Receipt (hidden for CASH — progressive disclosure) -->
	{#if $form.method && $form.method !== 'CASH'}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
		</div>
	{/if}

	<!-- Row 3: Paid By + Date (paired at sm+) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
	</div>

	<!-- Notes (collapsible) -->
	{#if showNotes}
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
	{:else}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="text-muted-foreground"
			onclick={() => { showNotes = true; }}
		>
			+ Add notes
		</Button>
	{/if}

	<!-- Submit Button (sticky on mobile) -->
	<div class="flex justify-end sticky bottom-0 bg-card pt-3 pb-1 border-t sm:static sm:border-0 sm:pt-0 sm:pb-0">
		<Button type="submit" class="min-h-[44px] sm:min-h-0" disabled={!canEdit || $submitting}>
			{#if $submitting}
				<Loader2 class="w-4 h-4 mr-2 animate-spin" />
				Processing...
			{:else if editMode}
				Update Payment
			{:else}
				Create Payment
			{/if}
		</Button>
	</div>
</form>
