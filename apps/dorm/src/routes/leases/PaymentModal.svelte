<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import { Badge } from '$lib/components/ui/badge';
	import { resyncCollection } from '$lib/db/replication';
	import { toast } from 'svelte-sonner';
	import type { Billing } from '$lib/types/lease';
	import DatePicker from '$lib/components/ui/date-picker.svelte';

	const {
		lease,
		isOpen = false,
		onOpenChange,
		onDataChange
	} = $props<{
		lease: {
			id: string;
			name?: string;
			balance: number;
			billings?: Billing[];
			lease_tenants?: any[]; // For paid_by field
		};
		isOpen?: boolean;
		onOpenChange: (open: boolean) => void;
		onDataChange?: () => Promise<void>;
	}>();

	type PaymentMethod = {
		value: 'CASH' | 'GCASH' | 'BANK_TRANSFER' | 'SECURITY_DEPOSIT';
		label: string;
	};

	const paymentTypes: PaymentMethod[] = [
		{ value: 'CASH', label: 'Cash' },
		{ value: 'GCASH', label: 'GCash' },
		{ value: 'BANK_TRANSFER', label: 'Bank Transfer' },
		{ value: 'SECURITY_DEPOSIT', label: 'Security Deposit' }
	];

	// Filter out security deposit payment method if any selected billing is a security deposit
	let availablePaymentTypes = $derived.by(() => {
		const hasSecurityDepositBilling = Array.from(selectedBillings).some((billingId) => {
			const billing = lease.billings?.find((b: Billing) => b.id === billingId);
			return billing?.type === 'SECURITY_DEPOSIT';
		});

		if (hasSecurityDepositBilling) {
			return paymentTypes.filter((type) => type.value !== 'SECURITY_DEPOSIT');
		}

		return paymentTypes;
	});

	let selectedPaymentType = $state<PaymentMethod['value']>('CASH');
	let paymentAmount = $state(0);
	let selectedAmount = $state(0);
	let selectedBillings = $state<Set<number>>(new Set());
	let referenceNumber = $state('');
	let paidBy = $state((() => lease.lease_tenants?.[0]?.tenant?.name || '')());
	let paidAt = $state(new Date().toISOString().split('T')[0]);
	let isSubmitting = $state(false);
	let mobileBillingsExpanded = $state(true);

	// Human-friendly billing type labels
	const billingTypeLabels: Record<string, string> = {
		RENT: 'Monthly Rent',
		UTILITY: 'Utility Bill',
		SECURITY_DEPOSIT: 'Security Deposit',
		PENALTY: 'Penalty Fee'
	};

	// Calculate available security deposit amount (based on paid_amount, not balance)
	let availableSecurityDeposit = $derived.by(() => {
		const securityBillings =
			lease.billings?.filter((b: Billing) => b.type === 'SECURITY_DEPOSIT') || [];
		const totalPaid = securityBillings.reduce((sum: number, b: Billing) => sum + b.paid_amount, 0);

		// Calculate amount already used from security deposit
		const allBillings = lease.billings || [];
		let amountUsed = 0;

		allBillings.forEach((billing: any) => {
			if (billing.type !== 'SECURITY_DEPOSIT' && billing.allocations) {
				billing.allocations.forEach((allocation: any) => {
					if (allocation.payment.method === 'SECURITY_DEPOSIT') {
						amountUsed += allocation.amount;
					}
				});
			}
		});

		return totalPaid - amountUsed;
	});

	let canSubmit = $derived(
		paymentAmount > 0 &&
		selectedBillings.size > 0 &&
		!!paidAt &&
		!(selectedPaymentType === 'SECURITY_DEPOSIT' && paymentAmount > availableSecurityDeposit) &&
		!isSubmitting
	);

	function toggleBilling(billingId: number) {
		const newSelected = new Set(selectedBillings);
		if (newSelected.has(billingId)) {
			newSelected.delete(billingId);
		} else {
			newSelected.add(billingId);
		}
		selectedBillings = newSelected;
		updateSelectedAmount();
		resetInvalidPaymentType();
	}

	function updateSelectedAmount() {
		selectedAmount =
			lease.billings
				?.filter((b: Billing) => selectedBillings.has(b.id) && b.status !== 'PAID')
				.reduce(
					(sum: number, b: Billing) =>
						sum + (b.amount + (b.penalty_amount || 0) - (b.paid_amount || 0)),
					0
				) || 0;

		// P0-1 fix: Auto-fill amount to match selected billing total
		paymentAmount = selectedAmount;

		// Auto-collapse billings on mobile after first selection to reveal form
		if (selectedBillings.size > 0 && window.innerWidth < 1024) {
			mobileBillingsExpanded = false;
		}
	}

	function handlePaymentTypeChange(value: string | undefined) {
		if (value) {
			selectedPaymentType = value as PaymentMethod['value'];
		}
	}

	// Add validation for security deposit payments
	function validateSecurityDepositPayment() {
		if (selectedPaymentType === 'SECURITY_DEPOSIT') {
			const availableAmount = availableSecurityDeposit;
			if (paymentAmount > availableAmount) {
				throw new Error(
					`Payment amount exceeds available security deposit (${formatCurrency(availableAmount)})`
				);
			}
		}
	}

	// Reset payment type if it becomes invalid due to billing selection
	function resetInvalidPaymentType() {
		const hasSecurityDepositBilling = Array.from(selectedBillings).some((billingId) => {
			const billing = lease.billings?.find((b: Billing) => b.id === billingId);
			return billing?.type === 'SECURITY_DEPOSIT';
		});

		if (hasSecurityDepositBilling && selectedPaymentType === 'SECURITY_DEPOSIT') {
			selectedPaymentType = 'CASH';
			toast.error(
				'Security deposit cannot be used to pay security deposit billings. Payment method reset to Cash.'
			);
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (isSubmitting) return;
		isSubmitting = true;
		try {
			if (!paymentAmount || paymentAmount <= 0)
				throw new Error('Payment amount must be greater than zero.');
			if (!selectedPaymentType) throw new Error('Payment method is required.');
			if (!selectedBillings.size) throw new Error('No billings selected.');
			if (!paidAt) throw new Error('Payment date is required.');

			// Validate security deposit payment
			validateSecurityDepositPayment();

			const paymentDetails = {
				amount: paymentAmount,
				method: selectedPaymentType,
				reference_number: referenceNumber,
				paid_by: paidBy.trim() || lease.lease_tenants?.[0]?.tenant?.name || 'Unknown',
				paid_at: new Date(paidAt + 'T00:00:00').toISOString(),
				notes: `Payment for ${selectedBillings.size} billing(s)`,
				billing_ids: Array.from(selectedBillings)
			};

			const formData = new FormData();
			formData.append('paymentDetails', JSON.stringify(paymentDetails));

			const response = await fetch('?/submitPayment', {
				method: 'POST',
				body: formData
			});

			// It's safer to check for a successful response status before parsing JSON
			if (response.ok) {
				toast.success('Payment submitted successfully!');
				await Promise.all([
					resyncCollection('payments'),
					resyncCollection('payment_allocations'),
					resyncCollection('billings')
				]);
				if (onDataChange) {
					await onDataChange();
				}
				onOpenChange(false);
			} else {
				// Try to parse error from JSON, but have a fallback
				let errorMessage = 'Payment failed due to a server error.';
				try {
					const result = await response.json();
					errorMessage = result.error || errorMessage;
				} catch (e) {
					// The response was not valid JSON, use the status text
					errorMessage = response.statusText;
				}
				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error('Payment submission error:', error);

			let errorMessage = 'Failed to process payment';
			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			} else if (error && typeof error === 'object' && 'message' in error) {
				errorMessage = String(error.message);
			}

			toast.error('Payment Failed', {
				description: errorMessage
			});
		} finally {
			isSubmitting = false;
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
			amount || 0
		);
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function calculatePaymentAllocation(
		amount: number,
		billings: Billing[],
		selectedIds: Set<number>
	) {
		let remainingPayment = amount;
		return billings
			.filter((billing) => selectedIds.has(billing.id) && billing.status !== 'PAID')
			.map((billing) => {
				const due = billing.amount + (billing.penalty_amount || 0) - (billing.paid_amount || 0);
				const allocatedAmount = Math.min(remainingPayment, due);
				remainingPayment -= allocatedAmount;

				const newStatus =
					(billing.paid_amount || 0) + allocatedAmount >=
					billing.amount + (billing.penalty_amount || 0)
						? 'PAID'
						: 'PARTIAL';

				return {
					billing_id: billing.id,
					amount: allocatedAmount,
					new_status: newStatus
				};
			})
			.filter((item) => item.amount > 0);
	}

	function getTotalAllocationsNeeded(): number {
		return (
			lease.billings
				?.filter((b: Billing) => selectedBillings.has(b.id) && b.status !== 'PAID')
				.reduce(
					(total: number, b: Billing) =>
						total + (b.amount + (b.penalty_amount || 0) - (b.paid_amount || 0)),
					0
				) || 0
		);
	}

	function getPaymentAmountStyle(amount: number, totalNeeded: number): string {
		if (amount <= 0) return '';
		if (amount >= totalNeeded) return 'text-green-600 dark:text-green-400';
		return 'text-yellow-600 dark:text-yellow-400';
	}

	function sortBillingsByDueDate(billings: Billing[]): Billing[] {
		return [...(billings || [])].sort(
			(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
		);
	}

	let sortedBillings = $derived.by(() => {
		if (!isOpen) return [];
		return sortBillingsByDueDate(lease.billings);
	});

	// P2-3: Check if all unpaid billings share the same status — suppress individual badges when redundant
	let allSameStatus = $derived.by(() => {
		const unpaid = sortedBillings.filter((b: Billing) => b.status !== 'PAID');
		if (unpaid.length <= 1) return false;
		const statuses = new Set(unpaid.map((b: Billing) => getDisplayStatus(b)));
		return statuses.size === 1;
	});
	let paymentAllocation = $derived.by(() => {
		if (!isOpen) return [];
		return calculatePaymentAllocation(paymentAmount, lease.billings || [], selectedBillings);
	});

	function setExactAmount() {
		paymentAmount = selectedAmount;
	}

	const statusColors: { [key: string]: string } = {
		PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-400',
		PENALIZED: 'bg-red-100 text-red-800 border-red-400',
		PARTIAL: 'bg-blue-100 text-blue-800 border-blue-400',
		PAID: 'bg-green-100 text-green-800 border-green-400',
		OVERDUE: 'bg-orange-100 text-orange-800 border-orange-400',
		'OVERDUE-PARTIAL': 'bg-orange-200 text-orange-900 border-orange-500'
	};

	function getDisplayStatus(billing: Billing): string {
		if (billing.balance <= 0) {
			return 'PAID';
		}
		if (billing.penalty_amount > 0) {
			return 'PENALIZED';
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const isOverdue = new Date(billing.due_date) < today;

		if (isOverdue) {
			if (billing.status === 'PARTIAL') {
				return 'OVERDUE-PARTIAL';
			}
			return 'OVERDUE';
		}

		return billing.status; // PENDING or PARTIAL
	}
</script>

<Dialog.Root open={isOpen} {onOpenChange}>
	<Dialog.Content class="sm:max-w-[1000px] max-h-[90dvh] flex flex-col overflow-hidden p-0">
		<Dialog.Header class="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 flex-shrink-0">
			<Dialog.Title>Make Payment</Dialog.Title>
			<Dialog.Description>
				Enter payment details for lease {lease?.name || `#${lease?.id}`}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="flex flex-col flex-1 min-h-0">
			<!-- Scrollable content area -->
			<div class="flex-1 overflow-y-auto px-4 sm:px-6 pb-2">
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<!-- Billings List -->
				<div class="lg:border-r lg:pr-4">
					<!-- Mobile: collapsible billings header -->
					<div class="flex items-center justify-between mb-2">
						<button
							type="button"
							class="font-medium flex items-center gap-1.5 lg:pointer-events-none"
							onclick={() => { mobileBillingsExpanded = !mobileBillingsExpanded; }}
						>
							<svg class="w-4 h-4 transition-transform lg:hidden {mobileBillingsExpanded ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
							Outstanding Billings
							{#if selectedBillings.size > 0}
								<span class="text-xs text-primary font-normal lg:hidden">({selectedBillings.size} selected)</span>
							{/if}
						</button>
						{#if sortedBillings.filter((b: Billing) => b.status !== 'PAID').length > 1}
							<button
								type="button"
								class="text-xs text-primary hover:underline font-medium"
								onclick={() => {
									const unpaid = sortedBillings.filter((b: Billing) => b.status !== 'PAID');
									if (selectedBillings.size === unpaid.length) {
										selectedBillings = new Set();
									} else {
										selectedBillings = new Set(unpaid.map((b: Billing) => b.id));
									}
									updateSelectedAmount();
									resetInvalidPaymentType();
								}}
							>
								{selectedBillings.size === sortedBillings.filter((b: Billing) => b.status !== 'PAID').length ? 'Deselect All' : 'Select All'}
							</button>
						{/if}
					</div>

					<!-- Mobile: collapsed summary when billings are selected and section is collapsed -->
					{#if !mobileBillingsExpanded && selectedBillings.size > 0}
						<div class="lg:hidden p-2.5 rounded-lg bg-primary/5 border border-primary/20 mb-2">
							<div class="flex justify-between items-center text-sm">
								<span>{selectedBillings.size} billing{selectedBillings.size > 1 ? 's' : ''} selected</span>
								<span class="font-semibold">{formatCurrency(selectedAmount)}</span>
							</div>
						</div>
					{/if}

					<div class="space-y-2 max-h-[300px] lg:max-h-[400px] overflow-y-auto {!mobileBillingsExpanded ? 'hidden lg:block' : ''}">
						{#if sortedBillings.filter((b: Billing) => b.status !== 'PAID').length > 0}
							{#each sortedBillings.filter((b: Billing) => b.status !== 'PAID') as billing (billing.id)}
								{@const displayStatus = getDisplayStatus(billing)}
								<div
									class="p-3 rounded-lg border cursor-pointer transition-all duration-200 {selectedBillings.has(
										billing.id
									)
										? 'bg-primary/10 border-primary'
										: 'hover:bg-muted/50'}"
									onclick={() => toggleBilling(billing.id)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											toggleBilling(billing.id);
										}
									}}
									role="checkbox"
									aria-checked={selectedBillings.has(billing.id)}
									tabindex="0"
								>
									<!-- Mobile: compact billing row -->
									<div class="flex items-center gap-3 lg:hidden">
										<input
											type="checkbox"
											checked={selectedBillings.has(billing.id)}
											class="h-5 w-5 flex-shrink-0"
											tabindex="-1"
										/>
										<div class="flex-1 min-w-0">
											<div class="flex justify-between items-center">
												<span class="font-medium text-sm truncate">{billingTypeLabels[billing.type] || billing.type}</span>
												<span class="font-semibold text-sm ml-2 flex-shrink-0">{formatCurrency(billing.amount + (billing.penalty_amount || 0) - billing.paid_amount)}</span>
											</div>
											<div class="flex justify-between items-center mt-0.5">
												<span class="text-xs text-muted-foreground">Due: {formatDate(billing.due_date ?? '')}</span>
												{#if !allSameStatus}
													<span class="text-[10px] px-1.5 py-0.5 rounded {statusColors[displayStatus]}">{displayStatus.toLowerCase()}</span>
												{/if}
											</div>
										</div>
									</div>
									<!-- Desktop: full billing detail -->
									<div class="hidden lg:flex items-start gap-3">
										<input
											type="checkbox"
											checked={selectedBillings.has(billing.id)}
											class="mt-1.5 h-4 w-4"
											tabindex="-1"
										/>
										<div class="flex-grow">
											<div class="flex justify-between items-start">
												<div>
													<span class="font-medium">{billingTypeLabels[billing.type] || billing.type}</span>
													<div class="text-sm text-muted-foreground">
														Due: {formatDate(billing.due_date ?? '')}
														{#if billing.penalty_amount > 0}
															<span class="text-red-500 ml-2"
																>(+ {formatCurrency(billing.penalty_amount)} penalty)</span
															>
														{/if}
													</div>
												</div>
												{#if !allSameStatus}
													<Badge
														variant="outline"
														class={`capitalize ${statusColors[displayStatus]}`}
													>
														{displayStatus.toLowerCase()}
													</Badge>
												{/if}
											</div>

											<div class="mt-2 space-y-1 text-sm">
												<div class="flex justify-between">
													<span>Amount:</span>
													<span>{formatCurrency(billing.amount)}</span>
												</div>
												{#if billing.penalty_amount}
													<div class="flex justify-between text-red-600">
														<span>Penalty:</span>
														<span>{formatCurrency(billing.penalty_amount)}</span>
													</div>
												{/if}
												{#if billing.paid_amount > 0}
													<div class="flex justify-between text-green-600">
														<span>Paid:</span>
														<span>-{formatCurrency(billing.paid_amount)}</span>
													</div>
												{/if}
												<div class="flex justify-between font-semibold border-t pt-1 mt-1">
													<span>Balance:</span>
													<span
														>{formatCurrency(
															billing.amount + (billing.penalty_amount || 0) - billing.paid_amount
														)}</span
													>
												</div>
											</div>

											{#if billing.notes}
												<div class="text-xs text-gray-500 pt-2 border-t mt-2">
													Notes: {billing.notes}
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{:else}
							<div class="text-center text-muted-foreground p-4">No outstanding billings.</div>
						{/if}
					</div>
				</div>

				<!-- Payment Form -->
				<div class="space-y-4">
					<div class="space-y-4">
						<!-- Balance Display -->
						<div class="flex justify-between items-center py-2 px-3 bg-muted rounded-md">
							<span class="text-sm text-muted-foreground">Lease Balance</span>
							<span class="font-semibold text-lg">
								{formatCurrency(lease.balance)}
							</span>
						</div>
						{#if selectedBillings.size > 0}
							<div class="flex justify-between items-center py-2 px-3 bg-primary/5 border border-primary/20 rounded-md">
								<span class="text-sm">Outstanding Total <span class="text-muted-foreground">({selectedBillings.size} selected)</span></span>
								<span class="font-semibold text-lg">
									{formatCurrency(selectedAmount)}
								</span>
							</div>
						{/if}
						<!-- Payment Method Button Group -->
						<div>
							<Label>Payment Method</Label>
							<div class="grid grid-cols-2 gap-1.5 mt-1.5">
								{#each availablePaymentTypes as type}
									<button
										type="button"
										class="px-3 py-2 text-sm rounded-md border transition-colors {selectedPaymentType === type.value
											? 'bg-primary text-primary-foreground border-primary'
											: 'bg-background border-input hover:bg-muted'}"
										onclick={() => { selectedPaymentType = type.value; }}
									>
										{type.label}
									</button>
								{/each}
							</div>
						</div>

						<!-- Security Deposit Info -->
						{#if selectedPaymentType === 'SECURITY_DEPOSIT'}
							<div class="p-3 bg-blue-50 border border-blue-200 rounded-md">
								<div class="text-sm text-blue-800">
									<div class="font-medium">
										Available Security Deposit: {formatCurrency(availableSecurityDeposit)}
									</div>
									<div class="text-xs text-blue-600 mt-1">
										This is the amount you can use to pay other billings
									</div>
									{#if paymentAmount > availableSecurityDeposit}
										<div class="text-red-600 mt-1">
											⚠️ Payment amount exceeds available security deposit
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Security Deposit Billing Warning -->
						{#if Array.from(selectedBillings).some((billingId) => {
							const billing = lease.billings?.find((b: Billing) => b.id === billingId);
							return billing?.type === 'SECURITY_DEPOSIT';
						})}
							<div class="p-3 bg-red-50 border border-red-200 rounded-md">
								<div class="text-sm text-red-800">
									<div class="font-medium">⚠️ Security Deposit Billing Selected</div>
									<div class="text-xs text-red-600 mt-1">
										Security deposit billings cannot be paid using security deposit funds. Please
										use cash, GCash, or bank transfer.
									</div>
								</div>
							</div>
						{/if}

						<!-- Paid By Input -->
						<div>
							<Label for="paid-by">Paid By</Label>
							<Input id="paid-by" bind:value={paidBy} placeholder="Enter payer name" />
						</div>

						<!-- Paid At Input -->
						<DatePicker
							bind:value={paidAt}
							label="Payment Date"
							placeholder="Select payment date"
							required={true}
							id="paid-at"
							name="paid-at"
						/>

						<!-- Amount Input -->
						<div>
							<Label for="amount">Amount</Label>
							<div class="flex items-center gap-2">
								<Input
									id="amount"
									type="number"
									bind:value={paymentAmount}
									min="0.01"
									step="0.01"
								/>
								{#if selectedAmount > 0 && paymentAmount !== selectedAmount}
									<Button
										type="button"
										variant="outline"
										size="sm"
										onclick={setExactAmount}
										title="Reset to selected billing total ({formatCurrency(selectedAmount)})"
									>
										Fill Total
									</Button>
								{/if}
							</div>
							{#if paymentAmount > 0 && selectedAmount > 0 && paymentAmount !== selectedAmount}
								<p class="text-xs text-muted-foreground mt-1">
									{paymentAmount < selectedAmount
										? `Partial payment — ${formatCurrency(selectedAmount - paymentAmount)} will remain unpaid`
										: `Overpayment — ${formatCurrency(paymentAmount - selectedAmount)} change`}
								</p>
							{/if}
						</div>

						<!-- Reference Number -->
						<div>
							<Label for="reference">Reference Number</Label>
							<Input
								id="reference"
								bind:value={referenceNumber}
								placeholder={selectedPaymentType === 'CASH' ? 'N/A for cash payments' : 'e.g., Transaction ID'}
								disabled={selectedPaymentType === 'CASH'}
							/>
						</div>
					</div>
				</div>

				<!-- Payment Summary — hidden on mobile (shown in sticky footer), visible on desktop -->
				<div class="hidden lg:block lg:border-l lg:pl-4">
					<h3 class="font-medium mb-2">Payment Summary</h3>
					<div class="space-y-4">
						<!-- Total Amount -->
						<div class="p-3 bg-muted rounded-lg space-y-2">
							<div class="flex justify-between items-center">
								<span>You're Paying:</span>
								<span
									class="font-semibold text-lg {getPaymentAmountStyle(
										paymentAmount,
										getTotalAllocationsNeeded()
									)}"
								>
									{formatCurrency(paymentAmount)}
								</span>
							</div>
							{#if paymentAmount > 0 && getTotalAllocationsNeeded() > 0}
								<div class="flex justify-between items-center text-sm">
									<span>Total Selected:</span>
									<span class="font-medium">{formatCurrency(getTotalAllocationsNeeded())}</span>
								</div>
								{#if paymentAmount >= getTotalAllocationsNeeded()}
									<div
										class="flex justify-between items-center text-sm text-green-600 dark:text-green-400"
									>
										<span>Change:</span>
										<span class="font-medium"
											>{formatCurrency(paymentAmount - getTotalAllocationsNeeded())}</span
										>
									</div>
								{:else}
									<div
										class="flex justify-between items-center text-sm text-yellow-600 dark:text-yellow-400"
									>
										<span>Remaining Unpaid:</span>
										<span class="font-medium"
											>{formatCurrency(getTotalAllocationsNeeded() - paymentAmount)}</span
										>
									</div>
								{/if}
							{/if}
						</div>

						<!-- Allocation Preview -->
						<div class="space-y-2">
							<h4 class="text-sm font-medium">Payment Allocation:</h4>
							{#if paymentAllocation.length > 0}
								{#each paymentAllocation as { billing_id, amount, new_status }}
									{@const matchedBilling = lease.billings?.find((b: Billing) => b.id === billing_id)}
									<div class="p-2 border rounded">
										<div class="flex justify-between items-start">
											<div>
												<div class="font-medium">
													{billingTypeLabels[matchedBilling?.type || ''] || matchedBilling?.type || ''}
												</div>
												<div class="text-sm text-muted-foreground">
													Due: {formatDate(matchedBilling?.due_date ?? '')}
												</div>
											</div>
											<div class="text-right">
												<div>{formatCurrency(amount)}</div>
												<Badge variant={new_status === 'PAID' ? 'default' : 'secondary'}>
													{new_status}
												</Badge>
											</div>
										</div>
									</div>
								{/each}
							{:else if selectedBillings.size > 0}
								<p class="text-sm text-muted-foreground">Enter an amount to see allocation preview</p>
							{:else}
								<p class="text-sm text-muted-foreground">Select billings to get started</p>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Mobile: inline allocation preview (before sticky footer, inside scroll area) -->
			<div class="lg:hidden">
				{#if paymentAllocation.length > 0}
					<div class="space-y-1.5 mt-3">
						<h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Allocation Preview</h4>
						{#each paymentAllocation as { billing_id, amount, new_status }}
							{@const matchedBilling = lease.billings?.find((b: Billing) => b.id === billing_id)}
							<div class="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
								<span class="truncate">{billingTypeLabels[matchedBilling?.type || ''] || matchedBilling?.type || ''}</span>
								<div class="flex items-center gap-2 flex-shrink-0">
									<span class="font-medium">{formatCurrency(amount)}</span>
									<span class="text-[10px] px-1.5 py-0.5 rounded {new_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">{new_status}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			</div><!-- end scrollable content -->

			<!-- Desktop: Submit Button Row -->
			<div class="hidden lg:flex border-t pt-4 pb-4 px-6 items-center justify-between gap-2 flex-shrink-0">
				{#if !canSubmit && !isSubmitting}
					<p class="text-xs text-muted-foreground">
						{#if !selectedBillings.size}
							Select at least one billing
						{:else if !paymentAmount || paymentAmount <= 0}
							Enter a payment amount
						{:else if !paidAt}
							Select a payment date
						{:else if selectedPaymentType === 'SECURITY_DEPOSIT' && paymentAmount > availableSecurityDeposit}
							Amount exceeds available security deposit
						{/if}
					</p>
				{:else}
					<div></div>
				{/if}
				<Button
					type="submit"
					disabled={!canSubmit}
				>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Submitting...
					{:else}
						Submit Payment
					{/if}
				</Button>
			</div>

			<!-- Mobile: Sticky footer with amount + submit -->
			<div class="lg:hidden flex-shrink-0 border-t bg-background px-4 py-3 safe-area-bottom">
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						{#if !canSubmit && !isSubmitting}
							<p class="text-xs text-muted-foreground truncate">
								{#if !selectedBillings.size}
									Select billings
								{:else if !paymentAmount || paymentAmount <= 0}
									Enter amount
								{:else if !paidAt}
									Select date
								{:else if selectedPaymentType === 'SECURITY_DEPOSIT' && paymentAmount > availableSecurityDeposit}
									Exceeds deposit
								{/if}
							</p>
						{:else}
							<div class="text-sm font-semibold {getPaymentAmountStyle(paymentAmount, getTotalAllocationsNeeded())}">
								{formatCurrency(paymentAmount)}
							</div>
							{#if paymentAmount > 0 && paymentAmount < getTotalAllocationsNeeded()}
								<p class="text-[10px] text-yellow-600">Partial — {formatCurrency(getTotalAllocationsNeeded() - paymentAmount)} remains</p>
							{:else if paymentAmount > 0 && paymentAmount > getTotalAllocationsNeeded() && getTotalAllocationsNeeded() > 0}
								<p class="text-[10px] text-green-600">{formatCurrency(paymentAmount - getTotalAllocationsNeeded())} change</p>
							{/if}
						{/if}
					</div>
					<Button
						type="submit"
						disabled={!canSubmit}
						class="min-h-[44px] px-6 flex-shrink-0"
					>
						{#if isSubmitting}
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Submitting...
						{:else}
							Submit Payment
						{/if}
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
