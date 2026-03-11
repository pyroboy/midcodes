<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { voidsAndDiscountsSummary } from '$lib/stores/reports.svelte';
	import type { OrderItem } from '$lib/types';

	type VoidPeriod = 'today' | 'week' | 'all';
	let period = $state<VoidPeriod>('today');

	const summary = $derived(voidsAndDiscountsSummary(period));

	const headingLabel = $derived(
		period === 'today' ? "Today's Voids & Discounts" :
		period === 'week'  ? "This Week's Voids & Discounts" :
		                     "All Voids & Discounts"
	);

	// P1-25: Map cancel reason codes to readable labels
	function reasonLabel(cancelReason: string | undefined | null): string {
		if (!cancelReason) return 'Mistake';
		const map: Record<string, string> = {
			mistake: 'Mistake',
			walkout: 'Walkout',
			write_off: 'Write-off',
		};
		return map[cancelReason] ?? cancelReason;
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
	}

	// Build item summary string from order items array
	function itemsSummary(order: { items?: Pick<OrderItem, 'menuItemName' | 'quantity'>[] }): string {
		if (!order.items || order.items.length === 0) return '—';
		return order.items
			.map(i => `${i.quantity ?? 1}x ${i.menuItemName ?? 'Item'}`)
			.join(', ');
	}
</script>

<!-- Period filter + Live indicator -->
<div class="mb-4 flex items-center justify-between flex-wrap gap-3">
	<div class="flex items-center gap-2">
		<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">{headingLabel}</h2>
		<span class="flex items-center gap-1.5 text-xs text-status-green">
			<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
			Live totals
		</span>
	</div>
	<div class="flex items-center gap-1.5">
		{#each ([
			{ value: 'today', label: 'Today' },
			{ value: 'week',  label: 'This Week' },
			{ value: 'all',   label: 'All Time' },
		] as const) as opt}
			<button
				onclick={() => (period = opt.value)}
				class={cn(
					'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
					period === opt.value ? 'bg-accent text-white' : 'border border-border bg-white text-gray-600 hover:bg-gray-50'
				)}
				style="min-height: unset"
			>
				{opt.label}
			</button>
		{/each}
	</div>
</div>

<div class="grid grid-cols-2 gap-6">
	<!-- Voids Section -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-bold text-gray-900">Voided Orders</h2>
				<span class="rounded-lg bg-status-red/10 px-2.5 py-1 text-xs font-bold text-status-red">
					{summary.voids.count} Orders
				</span>
			</div>

			<div class="mb-6 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-status-red font-mono">{formatPeso(summary.voids.value)}</span>
				<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Lost</span>
			</div>

			<h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Reason Breakdown</h3>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
					<span class="text-sm font-semibold text-gray-700">Mistakes</span>
					<span class="font-mono text-sm font-bold">{summary.voids.mistake}</span>
				</div>
				<div class="flex items-center justify-between rounded-lg border border-status-red/30 bg-status-red/5 px-4 py-3">
					<span class="text-sm font-semibold text-status-red">Walkouts</span>
					<span class="font-mono text-sm font-bold text-status-red">{summary.voids.walkout}</span>
				</div>
				<div class="flex items-center justify-between rounded-lg border border-status-yellow/30 bg-status-yellow/5 px-4 py-3">
					<span class="text-sm font-semibold text-status-yellow">Write-offs (Spoilage, etc)</span>
					<span class="font-mono text-sm font-bold text-status-yellow">{summary.voids.writeOff}</span>
				</div>
			</div>
		</div>

		<!-- P2-17 + P1-25: Per-order voids detail table with cashier, items, and reason -->
		{#if summary.voids.items.length > 0}
			<div class="rounded-xl border border-border bg-white overflow-hidden">
				<div class="px-5 py-3 border-b border-border">
					<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Void Detail</h3>
				</div>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date / Table</th>
							<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Items</th>
							<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cashier</th>
							<th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
							<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Reason</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each summary.voids.items as order (order.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-2.5 text-gray-700 font-medium">
									<div class="flex flex-col gap-0.5">
										<span>{order.tableId ?? 'Takeout'}</span>
										{#if order.createdAt}
											<span class="text-[10px] text-gray-400 font-mono">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span>
										{/if}
									</div>
								</td>
								<td class="px-4 py-2.5 text-xs text-gray-500 max-w-[140px]">
									<span class="line-clamp-2">{itemsSummary(order)}</span>
								</td>
								<td class="px-4 py-2.5 text-xs text-gray-600">
									{#if order.closedBy}
										{order.closedBy}
									{:else}
										<span class="text-gray-400">—</span>
									{/if}
								</td>
								<td class="px-4 py-2.5 text-right font-mono text-status-red">
									{formatPeso(order.subtotal)}
								</td>
								<td class="px-4 py-2.5">
									<!-- P1-25: Display reason or fallback to em dash -->
									{#if order.cancelReason}
										<span class={cn(
											'rounded-full px-2.5 py-0.5 text-xs font-medium',
											order.cancelReason === 'walkout' ? 'bg-status-red/10 text-status-red' :
											order.cancelReason === 'write_off' ? 'bg-status-yellow/10 text-status-yellow' :
											'bg-gray-100 text-gray-600'
										)}>
											{reasonLabel(order.cancelReason)}
										</span>
									{:else}
										<!-- void reason not stored on this record -->
										<span class="text-gray-400">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Discounts Section -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-bold text-gray-900">Discounts Applied</h2>
				<span class="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
					{summary.discounts.count} Orders
				</span>
			</div>

			<div class="mb-6 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-accent font-mono">{formatPeso(summary.discounts.value)}</span>
				<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Given</span>
			</div>

			<h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Type Breakdown</h3>
			<div class="flex flex-col gap-2">
				{#each summary.discounts.breakdown as row}
					<div class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
						<span class="text-sm font-semibold text-gray-700">{row.label}</span>
						<span class={cn('font-mono text-sm font-bold', row.amount > 0 ? 'text-gray-900' : 'text-gray-400')}>
							{formatPeso(row.amount)}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
