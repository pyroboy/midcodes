<script lang="ts">
	import { Clock, Receipt } from 'lucide-svelte';
	import type { Lease, Billing } from '$lib/types/lease';
	import { formatCurrency, formatDate } from '$lib/utils/format';

	interface Props {
		lease: Lease;
	}

	let { lease }: Props = $props();

	function sortBillingsByDueDate(billings: Billing[]): Billing[] {
		if (!billings) return [];
		return [...billings].sort(
			(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
		);
	}

	let sortedBillings = $derived(sortBillingsByDueDate(lease.billings || []));
</script>

<div class="space-y-8">
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 tracking-tight">Payment History</h2>

		<div>
			{#if lease.billings && lease.billings.some((b) => b.allocations && b.allocations.length > 0)}
				<div class="space-y-4 max-h-[500px] overflow-y-auto">
					{#each sortedBillings.filter((b) => b.allocations && b.allocations.length > 0) as billing}
						{#each billing.allocations || [] as allocation}
							<div class="flex items-start justify-between p-4 border border-gray-200">
								<div class="flex items-start gap-4">
									<div class="p-2 bg-gray-200 rounded-full mt-1">
										<Receipt class="w-4 h-4 text-gray-600" />
									</div>
									<div class="space-y-1">
										<div class="text-xl font-bold text-gray-900">
											{formatCurrency(allocation.amount)}
										</div>
										<div class="text-sm text-gray-500">
											Payment for {billing.type} • {formatDate(allocation.payment.paid_at)}
										</div>
										{#if allocation.payment.method === 'SECURITY_DEPOSIT'}
											<span
												class="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium"
											>
												Security Deposit
											</span>
										{:else}
											<span
												class="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium"
											>
												{allocation.payment.method || 'Payment'}
											</span>
										{/if}
									</div>
								</div>
								<div class="text-right space-y-1">
									<div class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
										{billing.type}
									</div>
									<div class="text-xs text-gray-500">
										Due: {formatDate(billing.due_date)}
									</div>
								</div>
							</div>
						{/each}
					{/each}
				</div>
			{:else}
				<div class="text-center py-12 text-gray-500">
					<Clock class="w-12 h-12 mx-auto mb-4 text-gray-300" />
					<p class="text-lg font-semibold text-gray-600 mb-2">No payment history</p>
					<p class="text-sm text-gray-500">No payments have been recorded for this lease</p>
				</div>
			{/if}
		</div>
	</div>
</div>
