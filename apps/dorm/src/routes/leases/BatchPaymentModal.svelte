<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import { resyncCollection } from '$lib/db/replication';
	import { toast } from 'svelte-sonner';
	import { formatCurrency } from '$lib/utils/format';
	import { markJustPaid } from './just-paid.svelte';
	import type { Billing } from '$lib/types/lease';

	const {
		leases,
		isOpen = false,
		onOpenChange,
		onDataChange
	} = $props<{
		leases: any[];
		isOpen?: boolean;
		onOpenChange: (open: boolean) => void;
		onDataChange?: () => Promise<void>;
	}>();

	type PaymentMethod = {
		value: 'CASH' | 'GCASH' | 'BANK_TRANSFER';
		label: string;
	};

	const paymentTypes: PaymentMethod[] = [
		{ value: 'CASH', label: 'Cash' },
		{ value: 'GCASH', label: 'GCash' },
		{ value: 'BANK_TRANSFER', label: 'Bank Transfer' }
	];

	let selectedPaymentType = $state<PaymentMethod['value']>('CASH');
	let paidAt = $state(new Date().toISOString().split('T')[0]);
	let isSubmitting = $state(false);
	let progress = $state({ current: 0, total: 0, failed: 0 });
	let showSuccessAnimation = $state(false);

	// Compute per-lease totals
	let leaseDetails = $derived.by(() => {
		return leases.map((lease: any) => {
			const unpaid =
				lease.billings?.filter((b: Billing) => b.status !== 'PAID') || [];
			const total = unpaid.reduce(
				(sum: number, b: Billing) =>
					sum + (b.amount + (b.penalty_amount || 0) - (b.paid_amount || 0)),
				0
			);
			return {
				id: lease.id,
				name: lease.name || `Lease #${lease.id}`,
				total,
				billingCount: unpaid.length,
				billingIds: unpaid.map((b: Billing) => b.id),
				paidBy:
					lease.lease_tenants?.[0]?.tenant?.name || 'Unknown'
			};
		});
	});

	let grandTotal = $derived(
		leaseDetails.reduce((sum: number, l: any) => sum + l.total, 0)
	);

	let canSubmit = $derived(
		leaseDetails.length > 0 &&
			grandTotal > 0 &&
			!!paidAt &&
			!isSubmitting
	);

	// Restore last payment method + auto-focus submit
	$effect(() => {
		if (isOpen) {
			const saved = localStorage.getItem('dorm-last-payment-method');
			if (saved && paymentTypes.some((t) => t.value === saved)) {
				selectedPaymentType = saved as PaymentMethod['value'];
			}
			setTimeout(() => {
				document.querySelector<HTMLButtonElement>('[data-batch-submit]')?.focus();
			}, 150);
		}
	});

	let showConfirm = $state(false);

	function handleSubmitClick(event: Event) {
		event.preventDefault();
		if (isSubmitting) return;
		showConfirm = true;
	}

	async function handleConfirmedSubmit() {
		showConfirm = false;
		if (isSubmitting) return;
		isSubmitting = true;
		progress = { current: 0, total: leaseDetails.length, failed: 0 };

		let successCount = 0;
		let totalPaid = 0;

		try {
			for (const lease of leaseDetails) {
				if (lease.total <= 0 || lease.billingIds.length === 0) {
					progress.current++;
					continue;
				}

				const paymentDetails = {
					amount: lease.total,
					method: selectedPaymentType,
					reference_number: '',
					paid_by: lease.paidBy,
					paid_at: new Date(paidAt + 'T00:00:00').toISOString(),
					notes: `Batch payment for ${lease.billingCount} billing(s)`,
					billing_ids: lease.billingIds
				};

				const formData = new FormData();
				formData.append('paymentDetails', JSON.stringify(paymentDetails));

				try {
					const response = await fetch('?/submitPayment', {
						method: 'POST',
						body: formData
					});

					if (response.ok) {
						successCount++;
						totalPaid += lease.total;
						markJustPaid(String(lease.id), lease.total);
					} else {
						progress.failed++;
					}
				} catch {
					progress.failed++;
				}

				progress.current++;
			}

			// Persist payment method
			localStorage.setItem('dorm-last-payment-method', selectedPaymentType);

			// Resync all affected collections
			await Promise.all([
				resyncCollection('payments'),
				resyncCollection('payment_allocations'),
				resyncCollection('billings')
			]);
			if (onDataChange) await onDataChange();

			// Success micro-animation
			showSuccessAnimation = true;
			await new Promise((r) => setTimeout(r, 900));
			showSuccessAnimation = false;
			onOpenChange(false);

			const methodLabel =
				paymentTypes.find((t) => t.value === selectedPaymentType)?.label ??
				selectedPaymentType;

			if (successCount > 0) {
				toast.success(
					`${formatCurrency(totalPaid)} via ${methodLabel}`,
					{
						description: `${successCount} lease${successCount !== 1 ? 's' : ''} paid${progress.failed > 0 ? `, ${progress.failed} failed` : ''}`,
						duration: 6000
					}
				);
			}
			if (progress.failed > 0 && successCount === 0) {
				toast.error('All batch payments failed');
			}
		} catch (error) {
			console.error('Batch payment error:', error);
			toast.error('Batch payment failed', {
				description:
					error instanceof Error ? error.message : 'Unknown error'
			});
		} finally {
			isSubmitting = false;
			progress = { current: 0, total: 0, failed: 0 };
		}
	}
</script>

<Dialog.Root open={isOpen} {onOpenChange}>
	<Dialog.Content class="sm:max-w-[520px] max-h-[90dvh] flex flex-col overflow-hidden p-0">
		<!-- Success micro-animation overlay -->
		{#if showSuccessAnimation}
			<div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 animate-in fade-in duration-200">
				<svg class="w-16 h-16 text-green-500" viewBox="0 0 52 52" fill="none">
					<circle class="stroke-green-500/20" cx="26" cy="26" r="24" stroke-width="3" />
					<circle class="stroke-green-500 success-circle" cx="26" cy="26" r="24" stroke-width="3" stroke-linecap="round" />
					<path class="stroke-green-500 success-check" d="M14 27l8 8 16-16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
				</svg>
				<p class="text-sm font-medium text-green-700 mt-3">Batch Payment Complete</p>
			</div>
		{/if}
		<!-- Confirmation overlay -->
		{#if showConfirm}
			<div class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/95 animate-in fade-in duration-150 p-6">
				<p class="text-base font-semibold text-center">Confirm Batch Payment</p>
				<p class="text-sm text-muted-foreground text-center mt-2">
					Pay <span class="font-semibold tabular-nums text-foreground">{formatCurrency(grandTotal)}</span> for
					<span class="font-semibold text-foreground">{leaseDetails.length}</span> lease{leaseDetails.length !== 1 ? 's' : ''} via
					<span class="font-semibold text-foreground">{paymentTypes.find(t => t.value === selectedPaymentType)?.label}</span>?
				</p>
				<div class="flex gap-3 mt-5">
					<Button variant="outline" onclick={() => { showConfirm = false; }} class="h-9 px-4 min-h-[44px] sm:min-h-0">Cancel</Button>
					<Button onclick={handleConfirmedSubmit} class="bg-green-600 hover:bg-green-700 text-white h-9 px-6 min-h-[44px] sm:min-h-0">
						Confirm & Pay
					</Button>
				</div>
			</div>
		{/if}
		<Dialog.Header class="px-4 pt-3 pb-1.5 sm:px-5 sm:pt-4 flex-shrink-0 border-b">
			<Dialog.Title class="text-base">Batch Payment</Dialog.Title>
			<Dialog.Description class="text-xs">
				Pay {leaseDetails.length} lease{leaseDetails.length !== 1 ? 's' : ''} at once
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmitClick} class="flex flex-col flex-1 min-h-0">
			<div class="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3">
				<!-- Lease list -->
				<div class="space-y-1 max-h-[200px] overflow-y-auto">
					<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Selected Leases
					</span>
					{#each leaseDetails as lease (lease.id)}
						<div class="flex items-center justify-between py-1.5 px-2.5 rounded-md border text-sm">
							<div class="truncate min-w-0">
								<span class="text-xs font-medium">{lease.name}</span>
								<span class="text-[10px] text-muted-foreground ml-1">({lease.paidBy})</span>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0 ml-2">
								<span class="text-[11px] text-muted-foreground">
									{lease.billingCount} bill{lease.billingCount !== 1 ? 's' : ''}
								</span>
								<span class="font-semibold tabular-nums text-xs">
									{formatCurrency(lease.total)}
								</span>
							</div>
						</div>
					{/each}
				</div>

				<!-- Grand total -->
				<div class="flex justify-between items-center py-2 px-3 bg-primary/5 border border-primary/20 rounded text-sm font-semibold">
					<span>Total</span>
					<span class="tabular-nums">{formatCurrency(grandTotal)}</span>
				</div>

				<!-- Payment method -->
				<div>
					<Label class="text-xs">Method</Label>
					<div class="grid grid-cols-3 gap-1 mt-1">
						{#each paymentTypes as type}
							<button
								type="button"
								class="px-2 py-2 text-xs rounded border transition-colors text-center {selectedPaymentType === type.value
									? 'bg-primary text-primary-foreground border-primary'
									: 'bg-background border-input hover:bg-muted'}"
								onclick={() => {
									selectedPaymentType = type.value;
								}}
							>
								{type.label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Payment date -->
				<DatePicker
					bind:value={paidAt}
					label="Date"
					placeholder="Payment date"
					required={true}
					id="batch-paid-at"
					name="batch-paid-at"
				/>
			</div>

			<!-- Footer -->
			<div class="border-t flex-shrink-0">
				{#if isSubmitting && progress.total > 0}
					<div class="h-1 bg-muted">
						<div
							class="h-1 bg-green-500 transition-all duration-300"
							style="width: {(progress.current / progress.total) * 100}%"
						></div>
					</div>
				{/if}
			<div class="py-2.5 px-5 flex items-center justify-between gap-2">
				{#if isSubmitting}
					<div class="text-xs text-muted-foreground">
						Processing {progress.current}/{progress.total}...
						{#if progress.failed > 0}
							<span class="text-red-500">({progress.failed} failed)</span>
						{/if}
					</div>
				{:else}
					<div class="text-xs text-muted-foreground">
						{leaseDetails.length} lease{leaseDetails.length !== 1 ? 's' : ''}
					</div>
				{/if}
				<Button type="submit" disabled={!canSubmit} class="h-8 px-4 text-sm min-h-[44px] sm:min-h-0" data-batch-submit>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						{progress.current}/{progress.total}
					{:else}
						Pay {formatCurrency(grandTotal)}
					{/if}
				</Button>
			</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<style>
	.success-circle {
		stroke-dasharray: 151;
		stroke-dashoffset: 151;
		animation: circle-draw 0.4s ease-out 0.1s forwards;
	}
	.success-check {
		stroke-dasharray: 40;
		stroke-dashoffset: 40;
		animation: check-draw 0.3s ease-out 0.4s forwards;
	}
	@keyframes circle-draw {
		to { stroke-dashoffset: 0; }
	}
	@keyframes check-draw {
		to { stroke-dashoffset: 0; }
	}
</style>
