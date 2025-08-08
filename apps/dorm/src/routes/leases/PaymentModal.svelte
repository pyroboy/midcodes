<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import { Badge } from '$lib/components/ui/badge';
	import { invalidateAll } from '$app/navigation';
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
	let paidBy = $state(lease.lease_tenants?.[0]?.tenant?.name || '');
	let paidAt = $state(new Date().toISOString().split('T')[0]);

	// Calculate available security deposit amount (based on paid_amount, not balance)
	let availableSecurityDeposit = $derived(() => {
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

		if (selectedBillings.size === 0) {
			paymentAmount = 0;
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
			const availableAmount = availableSecurityDeposit();
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
				if (onDataChange) {
					await onDataChange();
				} else {
					await invalidateAll();
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
	<Dialog.Content class="sm:max-w-[1000px]">
		<Dialog.Header>
			<Dialog.Title>Make Payment</Dialog.Title>
			<Dialog.Description>
				Enter payment details for lease {lease?.name || `#${lease?.id}`}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="grid grid-cols-3 gap-4">
				<!-- Billings List -->
				<div class="border-r pr-4">
					<h3 class="font-medium mb-2">Outstanding Billings</h3>
					<div class="space-y-2 max-h-[400px] overflow-y-auto">
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
									<div class="flex items-start gap-3">
										<input
											type="checkbox"
											checked={selectedBillings.has(billing.id)}
											class="mt-1.5 h-4 w-4"
											tabindex="-1"
										/>
										<div class="flex-grow">
											<div class="flex justify-between items-start">
												<div>
													<span class="font-medium">{billing.type}</span>
													<div class="text-sm text-muted-foreground">
														Due: {formatDate(billing.due_date ?? '')}
														{#if billing.penalty_amount > 0}
															<span class="text-red-500 ml-2"
																>(+ {formatCurrency(billing.penalty_amount)} penalty)</span
															>
														{/if}
													</div>
												</div>
												<Badge
													variant="outline"
													class={`capitalize ${statusColors[displayStatus]}`}
												>
													{displayStatus.toLowerCase()}
												</Badge>
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
							<span>Current Balance:</span>
							<span class="font-semibold text-lg">
								{formatCurrency(lease.balance)}
							</span>
						</div>
						<div class="flex justify-between items-center py-2 px-3 bg-muted rounded-md">
							<span>Selected Amount:</span>
							<span class="font-semibold text-lg">
								{formatCurrency(selectedAmount)}
							</span>
						</div>
						<!-- Payment Type Select -->
						<div>
							<Label for="payment-type">Payment Method</Label>
							<select
								id="payment-type"
								bind:value={selectedPaymentType}
								class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#each availablePaymentTypes as type}
									<option value={type.value}>
										{type.value === 'SECURITY_DEPOSIT' ? 'Security Deposit' : type.label}
									</option>
								{/each}
							</select>
						</div>

						<!-- Security Deposit Info -->
						{#if selectedPaymentType === 'SECURITY_DEPOSIT'}
							<div class="p-3 bg-blue-50 border border-blue-200 rounded-md">
								<div class="text-sm text-blue-800">
									<div class="font-medium">
										Available Security Deposit: {formatCurrency(availableSecurityDeposit())}
									</div>
									<div class="text-xs text-blue-600 mt-1">
										This is the amount you can use to pay other billings
									</div>
									{#if paymentAmount > availableSecurityDeposit()}
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
								<Button
									type="button"
									variant="outline"
									onclick={setExactAmount}
									disabled={!selectedAmount}
								>
									Exact
								</Button>
							</div>
						</div>

						<!-- Reference Number -->
						{#if selectedPaymentType !== 'CASH'}
							<div>
								<Label for="reference">Reference Number</Label>
								<Input
									id="reference"
									bind:value={referenceNumber}
									placeholder="e.g., Transaction ID"
								/>
							</div>
						{/if}
					</div>
				</div>

				<!-- Payment Summary -->
				<div class="border-l pl-4">
					<h3 class="font-medium mb-2">Payment Summary</h3>
					<div class="space-y-4">
						<!-- Total Amount -->
						<div class="p-3 bg-muted rounded-lg space-y-2">
							<div class="flex justify-between items-center">
								<span>Payment Amount:</span>
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
									<div class="p-2 border rounded">
										<div class="flex justify-between items-start">
											<div>
												<div class="font-medium">
													{lease.billings?.find((b: Billing) => b.id === billing_id)?.type}
												</div>
												<div class="text-sm text-muted-foreground">
													Due: {formatDate(
														lease.billings?.find((b: Billing) => b.id === billing_id)?.due_date ??
															''
													)}
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
							{:else}
								<p class="text-sm text-muted-foreground">No billings selected</p>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Submit Button Row -->
			<div class="border-t pt-4 flex justify-end gap-2">
				<Button
					type="submit"
					disabled={!paymentAmount ||
						!selectedBillings.size ||
						!paidAt ||
						(selectedPaymentType === 'SECURITY_DEPOSIT' &&
							paymentAmount > availableSecurityDeposit())}
				>
					Submit Payment
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
