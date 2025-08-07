<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import {
		AlertTriangle,
		TrendingUp,
		FileText,
		CheckCircle,
		XCircle,
		AlertCircle,
		Receipt
	} from 'lucide-svelte';
	import type { Lease, Billing } from '$lib/types/lease';
	import {
		formatCurrency,
		formatDate,
		getBillingStatusColor,
		getDisplayStatus
	} from '$lib/utils/format';

	interface Props {
		lease: Lease;
	}

	let { lease }: Props = $props();

	let selectedBillingType = $state<'RENT' | 'UTILITY' | 'PENALTY' | 'SECURITY_DEPOSIT'>('RENT');

	function getBillingSummary(
		billings: Billing[] = []
	): Record<string, { total: number; unpaid: number; count: number }> {
		return billings.reduce(
			(acc, billing) => {
				const type = billing.type || 'Other';
				if (!acc[type]) {
					acc[type] = { total: 0, unpaid: 0, count: 0 };
				}
				const totalAmount = billing.amount + (billing.penalty_amount || 0);
				acc[type].total += totalAmount;
				acc[type].unpaid += totalAmount - billing.paid_amount;
				acc[type].count += 1;
				return acc;
			},
			{} as Record<string, { total: number; unpaid: number; count: number }>
		);
	}

	function sortBillingsByDueDate(billings: Billing[]): Billing[] {
		if (!billings) return [];
		return [...billings].sort(
			(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
		);
	}

	function getOverdueBillings(billings: Billing[] = []): Billing[] {
		const today = new Date();
		return billings.filter((billing) => {
			const dueDate = new Date(billing.due_date);
			const totalDue = billing.amount + (billing.penalty_amount || 0);
			const isFullyPaid = billing.paid_amount >= totalDue;
			return !isFullyPaid && dueDate < today;
		});
	}

	let sortedBillings = $derived(sortBillingsByDueDate(lease.billings || []));
	let overdueBillings = $derived(getOverdueBillings(lease.billings || []));

	let totalPenalty = $derived.by(() => {
		return (
			lease.billings?.reduce((acc, b) => {
				const totalDue = b.amount + (b.penalty_amount || 0);
				const isFullyPaid = b.paid_amount >= totalDue;
				return acc + (isFullyPaid ? 0 : b.penalty_amount || 0);
			}, 0) || 0
		);
	});

	let paymentStats = $derived.by(() => {
		const billings = lease.billings || [];
		const totalBillings = billings.length;
		const paidBillings = billings.filter((b) => {
			const totalDue = b.amount + (b.penalty_amount || 0);
			return b.paid_amount >= totalDue;
		}).length;

		return {
			totalBillings,
			paidBillings,
			paymentRate: totalBillings > 0 ? (paidBillings / totalBillings) * 100 : 0
		};
	});

	function isBillingFullyPaid(billing: Billing): boolean {
		const totalDue = billing.amount + (billing.penalty_amount || 0);
		return billing.paid_amount >= totalDue;
	}

	function getBillingStatusIcon(billing: Billing) {
		if (isBillingFullyPaid(billing)) return CheckCircle;

		const dueDate = new Date(billing.due_date);
		const today = new Date();

		if (dueDate < today) return XCircle;
		return AlertCircle;
	}
</script>

<div class="space-y-8">
	<!-- Balance Overview -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 tracking-tight">Financial Summary</h2>

		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="space-y-1">
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Balance</dt>
				<dd
					class={`text-2xl font-bold ${
						lease.balance > 0
							? 'text-gray-900'
							: lease.balance < 0
								? 'text-gray-700'
								: 'text-gray-600'
					}`}
				>
					{formatCurrency(lease.balance)}
				</dd>
			</div>

			<div class="space-y-1">
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Penalties</dt>
				<dd class="text-2xl font-bold text-gray-900">
					{formatCurrency(totalPenalty)}
				</dd>
			</div>

			<div class="space-y-1">
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Payment Rate</dt>
				<dd class="text-2xl font-bold text-gray-900">
					{paymentStats.paymentRate.toFixed(0)}%
				</dd>
			</div>

			<div class="space-y-1">
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Overdue</dt>
				<dd class="text-2xl font-bold text-gray-900">
					{overdueBillings.length}
				</dd>
				<div class="text-sm text-gray-600">
					{formatCurrency(
						overdueBillings.reduce(
							(sum, b) => sum + (b.amount + (b.penalty_amount || 0) - b.paid_amount),
							0
						)
					)}
				</div>
			</div>
		</div>
	</div>

	<!-- Billing Type Summary -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 tracking-tight">Billing Categories</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each Object.entries(getBillingSummary(lease.billings)) as [type, amounts] (type)}
				<button
					type="button"
					class="p-4 border text-left transition-all duration-200"
					class:bg-gray-100={selectedBillingType === type}
					class:border-gray-900={selectedBillingType === type}
					class:bg-white={selectedBillingType !== type}
					class:border-gray-200={selectedBillingType !== type}
					class:hover:border-gray-400={selectedBillingType !== type}
					onclick={() =>
						(selectedBillingType = type as 'RENT' | 'UTILITY' | 'PENALTY' | 'SECURITY_DEPOSIT')}
				>
					<div class="space-y-2">
						<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">{type}</dt>
						<dd class="text-xl font-bold text-gray-900">
							{formatCurrency(amounts.total)}
						</dd>
						<div class="text-sm text-gray-600">
							{amounts.count} billing{amounts.count !== 1 ? 's' : ''}
						</div>

						{#if amounts.unpaid > 0}
							<div class="text-sm font-semibold text-gray-900">
								Outstanding: {formatCurrency(amounts.unpaid)}
							</div>
						{:else}
							<div class="text-sm font-medium text-gray-600">All paid</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Billing Details -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 tracking-tight">{selectedBillingType} Details</h2>

		<div>
			{#if lease.billings?.filter((b) => b.type === selectedBillingType).length}
				<div class="space-y-4 max-h-[400px] overflow-y-auto">
					{#each sortedBillings.filter((b) => b.type === selectedBillingType) as billing}
						{@const displayStatus = getDisplayStatus(billing)}
						{@const StatusIcon = getBillingStatusIcon(billing)}

						<div class="border border-gray-200 p-4">
							<div class="flex items-start justify-between mb-4">
								<div class="flex items-start gap-3">
									<StatusIcon
										class={`w-5 h-5 mt-0.5 ${
											isBillingFullyPaid(billing)
												? 'text-gray-600'
												: new Date(billing.due_date) < new Date()
													? 'text-gray-900'
													: 'text-gray-600'
										}`}
									/>
									<div>
										<div class="text-xl font-bold text-gray-900">
											{formatCurrency(
												billing.amount + (billing.penalty_amount || 0) - billing.paid_amount
											)}
										</div>
										<div class="text-sm text-gray-500">
											Due: {formatDate(billing.due_date)}
										</div>
									</div>
								</div>
								<div class="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium">
									{displayStatus}
								</div>
							</div>

							<!-- Amount Breakdown -->
							<div class="bg-gray-50 p-3 space-y-3">
								<div class="grid grid-cols-1 gap-3 text-sm">
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span class="text-gray-500">Base Amount</span>
										<span class="font-semibold text-gray-900">{formatCurrency(billing.amount)}</span
										>
									</div>
									{#if billing.penalty_amount > 0}
										<div class="flex justify-between py-2 border-b border-gray-200">
											<span class="text-gray-500">Penalty</span>
											<span class="font-semibold text-gray-900"
												>+{formatCurrency(billing.penalty_amount)}</span
											>
										</div>
									{/if}
									<div class="flex justify-between py-2 border-b border-gray-200">
										<span class="text-gray-500">Paid</span>
										<span class="font-semibold text-gray-900"
											>{formatCurrency(billing.paid_amount)}</span
										>
									</div>
									<div class="flex justify-between pt-2">
										<span class="font-medium text-gray-700">Balance</span>
										<span class="font-bold text-gray-900">
											{formatCurrency(
												billing.amount + (billing.penalty_amount || 0) - billing.paid_amount
											)}
										</span>
									</div>
								</div>
							</div>

							<!-- Payment History -->
							{#if billing.allocations && billing.allocations.length > 0}
								<div class="border-t border-gray-200 pt-4">
									<div class="text-sm font-semibold text-gray-700 mb-3">Payment History</div>
									<div class="space-y-2">
										{#each billing.allocations as allocation}
											<div class="flex justify-between items-center text-sm bg-gray-50 p-3">
												<div class="flex items-center gap-2">
													<Receipt class="w-4 h-4 text-gray-600" />
													<span class="font-medium text-gray-900"
														>{formatCurrency(allocation.amount)}</span
													>
													{#if allocation.payment?.method === 'SECURITY_DEPOSIT'}
														<span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium">
															Security Deposit
														</span>
													{/if}
												</div>
												<span class="text-gray-500"
													>{formatDate(allocation.payment?.paid_at || '')}</span
												>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if billing.notes}
								<div class="border-t border-gray-200 pt-4">
									<div class="text-sm font-semibold text-gray-700 mb-2">Notes</div>
									<div class="text-sm text-gray-600 bg-gray-50 p-3">{billing.notes}</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12 text-gray-500">
					<FileText class="w-12 h-12 mx-auto mb-4 text-gray-300" />
					<p class="text-lg font-semibold text-gray-600 mb-2">
						No {selectedBillingType.toLowerCase()} billings
					</p>
					<p class="text-sm text-gray-500">No billing records found for this category</p>
				</div>
			{/if}
		</div>
	</div>
</div>
