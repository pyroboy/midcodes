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
	import { untrack } from 'svelte';
	import { markJustPaid } from './just-paid.svelte';
	import { paymentsStore } from '$lib/stores/collections.svelte';

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
	let mobileAllocationExpanded = $state(false);
	let amountTouched = $state(false);
	let editingPaidByDate = $state(false);
	let editingAmount = $state(false);
	let showSuccessAnimation = $state(false);
	let scrollContainerRef = $state<HTMLDivElement | null>(null);
	// P2-3: Collapsed billing type summary (e.g., "Rent + Utility")
	let selectedBillingTypeSummary = $derived.by(() => {
		if (selectedBillings.size === 0) return '';
		const types = (lease.billings || [])
			.filter((b: Billing) => selectedBillings.has(b.id) && b.status !== 'PAID')
			.map((b: Billing) => billingTypeLabels[b.type] || b.type);
		const unique = [...new Set(types)];
		return unique.join(' + ');
	});

	// P0-NEW-1: Pre-select all unpaid billings when modal opens
	$effect(() => {
		if (isOpen) {
			untrack(() => {
				const unpaid = (lease.billings || []).filter((b: Billing) => b.status !== 'PAID');
				if (unpaid.length > 0) {
					selectedBillings = new Set(unpaid.map((b: Billing) => b.id));
					updateSelectedAmount();
					// On mobile, start with billings collapsed since they're pre-selected
					if (typeof window !== 'undefined' && window.innerWidth < 1024) {
						mobileBillingsExpanded = false;
					}
				}
				// #4: Remember last payment method
				const saved = localStorage.getItem('dorm-last-payment-method');
				if (saved && paymentTypes.some((t) => t.value === saved)) {
					selectedPaymentType = saved as PaymentMethod['value'];
				}
				// P1-2: Auto-focus Submit — setTimeout(150) fires after dialog focus trap settles
				setTimeout(() => {
					document.querySelector<HTMLButtonElement>('[data-payment-submit]')?.focus();
				}, 150);
			});
		}
	});

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

	// True when every unpaid billing is selected — hides redundant "Outstanding Total" row
	let allUnpaidSelected = $derived.by(() => {
		const unpaid = (lease.billings || []).filter((b: Billing) => b.status !== 'PAID');
		return unpaid.length > 0 && selectedBillings.size === unpaid.length;
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

			// #3: Duplicate payment guard — warn if similar payment in last 24h
			// Payments don't have lease_id; match by billing_ids overlap + similar amount
			const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
			const currentBillingIds = Array.from(selectedBillings).map(String);
			const recentSimilar = paymentsStore.value.filter((p: any) => {
				if (!p.paid_at || p.paid_at < twentyFourHoursAgo) return false;
				const pAmount = parseFloat(p.amount) || 0;
				const ratio = pAmount / paymentAmount;
				if (ratio < 0.9 || ratio > 1.1) return false;
				// Check billing_ids overlap
				const pBillingIds: string[] = p.billing_ids || (p.billing_id ? [p.billing_id] : []);
				if (pBillingIds.length === 0) return false;
				return pBillingIds.some((id: string) => currentBillingIds.includes(String(id)));
			});

			if (recentSimilar.length > 0) {
				const dup = recentSimilar[0];
				const ago = Math.round(
					(Date.now() - new Date(dup.paid_at).getTime()) / 60000
				);
				const timeStr = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;
				if (
					!confirm(
						`A ${formatCurrency(parseFloat(dup.amount))} payment was recorded ${timeStr}. Submit another?`
					)
				) {
					isSubmitting = false;
					return;
				}
			}

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
				// Capture values before modal closes and state resets
				const paidAmount = paymentAmount;
				const paidMethod =
					paymentTypes.find((t) => t.value === selectedPaymentType)?.label ??
					selectedPaymentType;
				const billingCount = selectedBillings.size;

				// #4: Persist payment method preference
				localStorage.setItem('dorm-last-payment-method', selectedPaymentType);

				// #5: Mark lease as "just paid" for transient badge
				markJustPaid(String(lease.id), paidAmount);

				// Resync collections
				await Promise.all([
					resyncCollection('payments'),
					resyncCollection('payment_allocations'),
					resyncCollection('billings')
				]);
				if (onDataChange) {
					await onDataChange();
				}

				// Feature 3: Success micro-animation before close
				showSuccessAnimation = true;
				await new Promise((r) => setTimeout(r, 900));
				showSuccessAnimation = false;
				onOpenChange(false);

				// #1: Rich success toast with undo hint
				toast.success(`${formatCurrency(paidAmount)} via ${paidMethod}`, {
					description: `${billingCount} billing${billingCount !== 1 ? 's' : ''} paid`,
					duration: 6000,
					action: {
						label: 'Undo',
						onClick: () => {
							toast.info('Contact admin to reverse this payment', { duration: 5000 });
						}
					}
				});
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

	// Feature 2: Dismiss keyboard on scroll (mobile)
	function handleScrollDismiss() {
		const active = document.activeElement;
		if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
			(active as HTMLElement).blur();
		}
	}

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
	<Dialog.Content class="sm:max-w-[900px] max-h-[90dvh] flex flex-col overflow-hidden p-0">
		<!-- Feature 3: Success micro-animation overlay -->
		{#if showSuccessAnimation}
			<div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 animate-in fade-in duration-200">
				<svg class="w-16 h-16 text-green-500" viewBox="0 0 52 52" fill="none">
					<circle class="stroke-green-500/20" cx="26" cy="26" r="24" stroke-width="3" />
					<circle class="stroke-green-500 success-circle" cx="26" cy="26" r="24" stroke-width="3" stroke-linecap="round" />
					<path class="stroke-green-500 success-check" d="M14 27l8 8 16-16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
				</svg>
				<p class="text-sm font-medium text-green-700 mt-3">Payment Recorded</p>
			</div>
		{/if}
		<Dialog.Header class="px-4 pt-3 pb-1.5 sm:px-5 sm:pt-4 flex-shrink-0 border-b">
			<Dialog.Title class="text-base">Make Payment</Dialog.Title>
			<Dialog.Description class="text-xs">
				{lease?.name || `Lease #${lease?.id}`}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="flex flex-col flex-1 min-h-0">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="flex-1 overflow-y-auto px-4 sm:px-5 py-3" bind:this={scrollContainerRef} onscroll={handleScrollDismiss}>
				<div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-3 lg:gap-4">

				<!-- Column 1: Billings -->
				<div class="lg:border-r lg:pr-3">
					<div class="flex items-center justify-between mb-1.5">
						<button
							type="button"
							class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 lg:pointer-events-none"
							onclick={() => { mobileBillingsExpanded = !mobileBillingsExpanded; }}
						>
							<svg class="w-3.5 h-3.5 transition-transform lg:hidden {mobileBillingsExpanded ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
							Billings
							{#if selectedBillings.size > 0}
								<span class="text-primary font-medium lg:hidden">({selectedBillings.size})</span>
								{#if !mobileBillingsExpanded && selectedBillingTypeSummary}
									<span class="text-[10px] text-muted-foreground font-normal lg:hidden truncate max-w-[160px]">— {selectedBillingTypeSummary}</span>
								{/if}
							{/if}
						</button>
						{#if sortedBillings.filter((b: Billing) => b.status !== 'PAID').length > 1}
							<button
								type="button"
								class="text-[11px] text-primary hover:underline font-medium"
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
								{selectedBillings.size === sortedBillings.filter((b: Billing) => b.status !== 'PAID').length ? 'Clear' : 'All'}
							</button>
						{/if}
					</div>

					{#if !mobileBillingsExpanded && selectedBillings.size > 0 && !allUnpaidSelected}
						<div class="lg:hidden py-1.5 px-2.5 rounded bg-primary/5 border border-primary/20 mb-2 text-xs flex justify-between items-center">
							<span>{selectedBillings.size}/{(lease.billings || []).filter((b: Billing) => b.status !== 'PAID').length} selected</span>
							<span class="font-semibold">{formatCurrency(selectedAmount)}</span>
						</div>
					{/if}

					<div class="space-y-1 max-h-[240px] lg:max-h-[340px] overflow-y-auto {!mobileBillingsExpanded ? 'hidden lg:block' : ''}">
						{#if sortedBillings.filter((b: Billing) => b.status !== 'PAID').length > 0}
							{#each sortedBillings.filter((b: Billing) => b.status !== 'PAID') as billing (billing.id)}
								{@const displayStatus = getDisplayStatus(billing)}
								{@const balance = billing.amount + (billing.penalty_amount || 0) - billing.paid_amount}
								<div
									class="py-2 px-2.5 rounded-md border cursor-pointer transition-all {selectedBillings.has(billing.id)
										? 'bg-primary/5 border-primary/40'
										: 'hover:bg-muted/50 border-transparent'}"
									onclick={() => toggleBilling(billing.id)}
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleBilling(billing.id); }}
									role="checkbox"
									aria-checked={selectedBillings.has(billing.id)}
									tabindex="0"
								>
									<div class="flex items-center gap-2">
										<input type="checkbox" checked={selectedBillings.has(billing.id)} class="h-4 w-4 flex-shrink-0 lg:h-3.5 lg:w-3.5" tabindex="-1" />
										<div class="flex-1 min-w-0 flex items-center justify-between gap-1">
											<div class="min-w-0">
												<span class="text-sm font-medium truncate block lg:text-xs">{billingTypeLabels[billing.type] || billing.type}</span>
												<span class="text-[11px] text-muted-foreground">
													{formatDate(billing.due_date ?? '')}
													{#if billing.penalty_amount > 0}
														<span class="text-red-500">+{formatCurrency(billing.penalty_amount)}</span>
													{/if}
												</span>
											</div>
											<div class="flex items-center gap-1.5 flex-shrink-0">
												<span class="text-sm font-semibold tabular-nums lg:text-xs">{formatCurrency(balance)}</span>
												{#if !allSameStatus}
													<span class="text-[9px] px-1 py-0.5 rounded leading-none {statusColors[displayStatus]}">{displayStatus.toLowerCase()}</span>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{/each}
						{:else}
							<p class="text-center text-muted-foreground text-sm py-4">No outstanding billings.</p>
						{/if}
					</div>
				</div>

				<!-- Column 2: Form -->
				<div class="space-y-2.5">
					<!-- Total Due banner -->
					{#if !allUnpaidSelected}
						<div class="flex justify-between items-center py-1.5 px-2.5 bg-muted rounded text-sm">
							<span class="text-muted-foreground text-xs">Lease Balance</span>
							<span class="font-semibold tabular-nums">{formatCurrency(lease.balance)}</span>
						</div>
					{/if}
					{#if selectedBillings.size > 0}
						<div class="flex justify-between items-center py-1.5 px-2.5 bg-primary/5 border border-primary/20 rounded text-sm">
							<span class="text-xs">
								{allUnpaidSelected ? 'Total Due' : 'Selected'}
								<span class="text-muted-foreground">
									({selectedBillings.size} billing{selectedBillings.size !== 1 ? 's' : ''})
								</span>
							</span>
							<span class="font-semibold tabular-nums">{formatCurrency(selectedAmount)}</span>
						</div>
					{/if}

					<!-- Payment Method — 4 inline on desktop, 2x2 on mobile -->
					<div>
						<Label class="text-xs">Method</Label>
						<div class="grid grid-cols-2 lg:grid-cols-4 gap-1 mt-1">
							{#each availablePaymentTypes as type}
								<button
									type="button"
									class="px-2 py-2 text-xs rounded border transition-colors text-center leading-tight {selectedPaymentType === type.value
										? 'bg-primary text-primary-foreground border-primary'
										: 'bg-background border-input hover:bg-muted'}"
									onclick={() => { selectedPaymentType = type.value; }}
								>
									{type.label}{#if type.value === 'SECURITY_DEPOSIT' && availableSecurityDeposit > 0}
									<span class="text-[9px] opacity-70 block leading-none mt-0.5">{formatCurrency(availableSecurityDeposit)}</span>
								{/if}
								</button>
							{/each}
						</div>
					</div>

					<!-- SD warnings -->
					{#if selectedPaymentType === 'SECURITY_DEPOSIT'}
						<div class="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
							Available: {formatCurrency(availableSecurityDeposit)}
							{#if paymentAmount > availableSecurityDeposit}
								<span class="text-red-600 block mt-0.5">Exceeds available deposit</span>
							{/if}
						</div>
					{/if}
					{#if Array.from(selectedBillings).some((billingId) => {
						const billing = lease.billings?.find((b: Billing) => b.id === billingId);
						return billing?.type === 'SECURITY_DEPOSIT';
					})}
						<div class="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
							SD billings can't be paid with SD funds.
						</div>
					{/if}

					<!-- Row: Paid By + Date — collapsed read-only on mobile when pre-filled, always editable on desktop -->
					{#if !editingPaidByDate && paidBy && paidAt}
						<!-- Mobile: read-only summary -->
						<div class="lg:hidden flex items-center justify-between py-1.5 px-2.5 bg-muted/50 rounded text-xs">
							<span class="truncate"><span class="text-muted-foreground">By</span> {paidBy} <span class="text-muted-foreground">on</span> {new Date(paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
							<button type="button" class="text-primary hover:underline flex-shrink-0 ml-2" onclick={() => { editingPaidByDate = true; }}>Edit</button>
						</div>
						<!-- Desktop: always show inputs -->
						<div class="hidden lg:grid grid-cols-2 gap-2">
							<div>
								<Label for="paid-by" class="text-xs">Paid By</Label>
								{#if lease.lease_tenants && lease.lease_tenants.length > 1}
									<div class="flex flex-wrap gap-0.5 mb-1">
										{#each lease.lease_tenants as lt}
											{@const name = lt.tenant?.name || ''}
											<button
												type="button"
												class="text-[10px] px-1.5 py-0.5 rounded border transition-colors {paidBy === name ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted'}"
												onclick={() => { paidBy = name; }}
											>{name || '?'}</button>
										{/each}
									</div>
								{/if}
								<Input id="paid-by" bind:value={paidBy} placeholder="Payer name" class="h-8 text-sm" />
							</div>
							<div>
								<DatePicker
									bind:value={paidAt}
									label="Date"
									placeholder="Payment date"
									required={true}
									id="paid-at"
									name="paid-at"
								/>
							</div>
						</div>
					{:else}
						<!-- Expanded: full inputs (both viewports) -->
						<div class="grid grid-cols-2 gap-2">
							<div>
								<Label for="paid-by" class="text-xs">Paid By</Label>
								{#if lease.lease_tenants && lease.lease_tenants.length > 1}
									<div class="flex flex-wrap gap-0.5 mb-1">
										{#each lease.lease_tenants as lt}
											{@const name = lt.tenant?.name || ''}
											<button
												type="button"
												class="text-[10px] px-1.5 py-0.5 rounded border transition-colors {paidBy === name ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted'}"
												onclick={() => { paidBy = name; }}
											>{name || '?'}</button>
										{/each}
									</div>
								{/if}
								<Input id="paid-by" bind:value={paidBy} placeholder="Payer name" class="h-8 text-sm" />
							</div>
							<div>
								<DatePicker
									bind:value={paidAt}
									label="Date"
									placeholder="Payment date"
									required={true}
									id="paid-at"
									name="paid-at"
								/>
							</div>
						</div>
					{/if}

					<!-- Amount + Reference -->
					{#if !editingAmount && paymentAmount > 0 && paymentAmount === selectedAmount}
						<!-- Read-only amount (mobile) — tap Edit to change -->
						<div class="lg:hidden flex items-center justify-between py-1.5 px-2.5 bg-muted/50 rounded text-xs">
							<span><span class="text-muted-foreground">Amount</span> <span class="font-semibold tabular-nums text-sm">{formatCurrency(paymentAmount)}</span></span>
							<button type="button" class="text-primary hover:underline flex-shrink-0 ml-2" onclick={() => { editingAmount = true; }}>Edit</button>
						</div>
						<!-- Desktop: always show input -->
						<div class="hidden lg:grid {selectedPaymentType !== 'CASH' ? 'grid-cols-2' : 'grid-cols-1'} gap-2">
							<div>
								<Label for="amount" class="text-xs">Amount</Label>
								<div class="flex items-center gap-1">
									<Input id="amount" type="number" inputmode="decimal" bind:value={paymentAmount} min="0.01" step="0.01" class="h-8 text-sm tabular-nums" onblur={() => { amountTouched = true; }} />
								</div>
							</div>
							{#if selectedPaymentType !== 'CASH'}
								<div>
									<Label for="reference" class="text-xs">Reference #</Label>
									<Input id="reference" bind:value={referenceNumber} placeholder="Transaction ID" class="h-8 text-sm" />
								</div>
							{/if}
						</div>
					{:else}
						<!-- Editable amount (both viewports, or when amount differs from selected) -->
						<div class="grid {selectedPaymentType !== 'CASH' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2">
							<div>
								<Label for="amount" class="text-xs">Amount</Label>
								<div class="flex items-center gap-1">
									<Input
										id="amount"
										type="number"
										inputmode="decimal"
										bind:value={paymentAmount}
										min="0.01"
										step="0.01"
										class="h-8 text-sm tabular-nums {amountTouched && (!paymentAmount || paymentAmount <= 0) ? 'border-red-400 focus-visible:ring-red-400' : ''}"
										onblur={() => { amountTouched = true; }}
									/>
									{#if selectedAmount > 0 && paymentAmount !== selectedAmount}
										<Button type="button" variant="outline" size="sm" onclick={setExactAmount} title="Reset to {formatCurrency(selectedAmount)}" class="h-8 px-2 text-[10px] flex-shrink-0">
											Reset
										</Button>
									{/if}
								</div>
								{#if amountTouched && (!paymentAmount || paymentAmount <= 0)}
									<p class="text-[10px] text-red-500 mt-0.5">Amount must be greater than zero</p>
								{:else if amountTouched && selectedPaymentType === 'SECURITY_DEPOSIT' && paymentAmount > availableSecurityDeposit}
									<p class="text-[10px] text-red-500 mt-0.5">Exceeds available deposit ({formatCurrency(availableSecurityDeposit)})</p>
								{:else if paymentAmount > 0 && selectedAmount > 0 && paymentAmount !== selectedAmount}
									<p class="text-[10px] text-muted-foreground mt-0.5">
										{paymentAmount < selectedAmount
											? `Partial — ${formatCurrency(selectedAmount - paymentAmount)} remaining`
											: `${formatCurrency(paymentAmount - selectedAmount)} change`}
									</p>
								{/if}
							</div>
							{#if selectedPaymentType !== 'CASH'}
								<div>
									<Label for="reference" class="text-xs">Reference #</Label>
									<Input id="reference" bind:value={referenceNumber} placeholder="Transaction ID" class="h-8 text-sm" />
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Column 3: Summary (desktop only) -->
				<div class="hidden lg:block lg:border-l lg:pl-3">
					<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</span>
					<div class="mt-1.5 space-y-2">
						<div class="p-2 bg-muted rounded space-y-1">
							<div class="flex justify-between items-center text-sm">
								<span class="text-muted-foreground text-xs">Paying</span>
								<span class="font-semibold tabular-nums {getPaymentAmountStyle(paymentAmount, getTotalAllocationsNeeded())}">
									{formatCurrency(paymentAmount)}
								</span>
							</div>
							{#if paymentAmount > 0 && getTotalAllocationsNeeded() > 0 && paymentAmount !== getTotalAllocationsNeeded()}
								{#if paymentAmount > getTotalAllocationsNeeded()}
									<div class="flex justify-between text-[11px] text-green-600">
										<span>Change</span>
										<span class="tabular-nums">{formatCurrency(paymentAmount - getTotalAllocationsNeeded())}</span>
									</div>
								{:else}
									<div class="flex justify-between text-[11px] text-yellow-600">
										<span>Remaining</span>
										<span class="tabular-nums">{formatCurrency(getTotalAllocationsNeeded() - paymentAmount)}</span>
									</div>
								{/if}
							{/if}
						</div>

						<!-- Allocation rows -->
						{#if paymentAllocation.length > 0}
							<div class="space-y-1">
								{#each paymentAllocation as { billing_id, amount, new_status }}
									{@const matchedBilling = lease.billings?.find((b: Billing) => b.id === billing_id)}
									<div class="flex justify-between items-center text-[11px] py-1 px-1.5 border rounded">
										<div class="min-w-0 truncate text-muted-foreground">{billingTypeLabels[matchedBilling?.type || ''] || matchedBilling?.type || ''}</div>
										<div class="flex items-center gap-1 flex-shrink-0 ml-1">
											<span class="tabular-nums font-medium">{formatCurrency(amount)}</span>
											<span class="text-[9px] px-1 py-0.5 rounded leading-none {new_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">{new_status}</span>
										</div>
									</div>
								{/each}
							</div>
						{:else if selectedBillings.size > 0}
							<p class="text-[11px] text-muted-foreground">Enter amount to preview</p>
						{:else}
							<p class="text-[11px] text-muted-foreground">Select billings to start</p>
						{/if}
					</div>
				</div>
			</div>
			</div><!-- end scrollable -->

			<!-- Desktop footer -->
			<div class="hidden lg:flex border-t py-2.5 px-5 items-center justify-between gap-2 flex-shrink-0">
				{#if !canSubmit && !isSubmitting}
					<p class="text-xs text-muted-foreground">
						{#if !selectedBillings.size}Select at least one billing
						{:else if !paymentAmount || paymentAmount <= 0}Enter a payment amount
						{:else if !paidAt}Select a payment date
						{:else if selectedPaymentType === 'SECURITY_DEPOSIT' && paymentAmount > availableSecurityDeposit}Amount exceeds available security deposit{/if}
					</p>
				{:else}<div></div>{/if}
				<Button type="submit" disabled={!canSubmit} class="h-8 px-4 text-sm" data-payment-submit>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
						Submitting...
					{:else}Submit Payment{/if}
				</Button>
			</div>

			<!-- Mobile footer -->
			<div class="lg:hidden flex-shrink-0 border-t bg-background px-4 safe-area-bottom">
				{#if paymentAllocation.length > 0}
					<button type="button" class="w-full flex items-center justify-between py-1.5 text-[11px] text-muted-foreground" onclick={() => { mobileAllocationExpanded = !mobileAllocationExpanded; }}>
						<span>{paymentAllocation.length} billing{paymentAllocation.length > 1 ? 's' : ''} → {paymentAllocation.every(a => a.new_status === 'PAID') ? 'All PAID' : 'Partial'}</span>
						<svg class="w-3 h-3 transition-transform {mobileAllocationExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
					</button>
					{#if mobileAllocationExpanded}
						<div class="space-y-0.5 pb-1.5 border-b mb-1.5">
							{#each paymentAllocation as { billing_id, amount, new_status }}
								{@const matchedBilling = lease.billings?.find((b: Billing) => b.id === billing_id)}
								<div class="flex justify-between items-center text-[11px]">
									<span class="truncate text-muted-foreground">{billingTypeLabels[matchedBilling?.type || ''] || matchedBilling?.type || ''}</span>
									<div class="flex items-center gap-1 flex-shrink-0 ml-2">
										<span class="tabular-nums">{formatCurrency(amount)}</span>
										<span class="text-[9px] px-1 py-0.5 rounded {new_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">{new_status}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
				<div class="flex items-center justify-between gap-3 py-2.5">
					<div class="min-w-0">
						{#if !canSubmit && !isSubmitting}
							<p class="text-xs text-muted-foreground truncate">
								{#if !selectedBillings.size}Select billings{:else if !paymentAmount || paymentAmount <= 0}Enter amount{:else if !paidAt}Select date{:else if selectedPaymentType === 'SECURITY_DEPOSIT' && paymentAmount > availableSecurityDeposit}Exceeds deposit{/if}
							</p>
						{:else}
							<div class="text-sm font-semibold tabular-nums {getPaymentAmountStyle(paymentAmount, getTotalAllocationsNeeded())}">{formatCurrency(paymentAmount)}</div>
							{#if paymentAmount > 0 && paymentAmount < getTotalAllocationsNeeded()}
								<p class="text-[10px] text-yellow-600">Partial — {formatCurrency(getTotalAllocationsNeeded() - paymentAmount)} remains</p>
							{:else if paymentAmount > 0 && paymentAmount > getTotalAllocationsNeeded() && getTotalAllocationsNeeded() > 0}
								<p class="text-[10px] text-green-600">{formatCurrency(paymentAmount - getTotalAllocationsNeeded())} change</p>
							{/if}
						{/if}
					</div>
					<Button type="submit" disabled={!canSubmit} class="min-h-[44px] px-5 flex-shrink-0">
						{#if isSubmitting}
							<svg class="animate-spin -ml-1 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
							Submitting...
						{:else}Submit Payment{/if}
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Success checkmark animation */
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
