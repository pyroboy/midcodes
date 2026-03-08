<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { salesByDay, salesByWeek } from '$lib/stores/reports.svelte';

	type Period = 'daily' | 'weekly';
	let period = $state<Period>('daily');

	// P1-22: Date range filter
	type QuickRange = 'all' | 'today' | 'week' | 'month';
	let quickRange = $state<QuickRange>('all');

	const VAT_RATE = 0.12;

	function withVatBreakdown<T extends { netSales: number }>(row: T) {
		const vatSales = Math.round(row.netSales / (1 + VAT_RATE));
		return { ...row, vatSales, nonVatSales: row.netSales - vatSales, taxCollected: Math.round(vatSales * VAT_RATE) };
	}

	const dailyRows = $derived(
		salesByDay(14).map(r => ({ ...withVatBreakdown(r), date: r.isToday ? 'Today (live)' : r.date, pax: r.totalPax, dateKey: r.dateKey, isToday: r.isToday }))
	);
	const weeklyRows = $derived(
		salesByWeek(8).map(r => ({ ...withVatBreakdown(r), date: r.weekLabel, isToday: false, pax: r.totalPax, dateKey: r.weekKey }))
	);

	const allRows = $derived(period === 'weekly' ? weeklyRows : dailyRows);

	// Apply quick range filter (P1-22)
	const rows = $derived.by(() => {
		if (quickRange === 'all') return allRows;
		const now = new Date();
		const todayKey = now.toISOString().slice(0, 10);
		if (quickRange === 'today') {
			return allRows.filter(r => r.dateKey === todayKey);
		}
		if (quickRange === 'week') {
			const weekAgo = new Date(now);
			weekAgo.setDate(now.getDate() - 7);
			const weekAgoKey = weekAgo.toISOString().slice(0, 10);
			return allRows.filter(r => r.dateKey >= weekAgoKey);
		}
		if (quickRange === 'month') {
			const monthAgo = new Date(now);
			monthAgo.setDate(now.getDate() - 30);
			const monthAgoKey = monthAgo.toISOString().slice(0, 10);
			return allRows.filter(r => r.dateKey >= monthAgoKey);
		}
		return allRows;
	});

	const totals = $derived({
		grossSales:   rows.reduce((s, r) => s + r.grossSales, 0),
		discounts:    rows.reduce((s, r) => s + r.discounts, 0),
		netSales:     rows.reduce((s, r) => s + r.netSales, 0),
		taxCollected: rows.reduce((s, r) => s + r.taxCollected, 0),
		pax:          rows.reduce((s, r) => s + r.pax, 0),
	});
	const avgTicket = $derived(totals.pax > 0 ? Math.round(totals.netSales / totals.pax) : 0);
</script>

<!-- Period toggle + P1-22: Quick date range filter -->
<div class="mb-5 flex items-center gap-2 flex-wrap">
	{#each (['daily', 'weekly'] as const) as p}
		<button
			onclick={() => (period = p)}
			class={cn(
				'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
				period === p ? 'bg-accent text-white' : 'border border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{p === 'daily' ? 'Daily' : 'Weekly'}
		</button>
	{/each}

	<div class="mx-2 h-4 w-px bg-border"></div>

	{#each ([
		{ value: 'all', label: 'All' },
		{ value: 'today', label: 'Today' },
		{ value: 'week', label: 'This Week' },
		{ value: 'month', label: 'This Month' },
	] as const) as opt}
		<button
			onclick={() => (quickRange = opt.value)}
			class={cn(
				'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
				quickRange === opt.value ? 'bg-gray-900 text-white' : 'border border-border bg-white text-gray-500 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{opt.label}
		</button>
	{/each}

	<span class="ml-auto flex items-center gap-1.5 text-xs text-status-green">
		<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
		Live
	</span>
</div>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-5 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Gross Sales</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(totals.grossSales)}</p>
	</div>
	<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-green">Net Sales</p>
		<p class="mt-1 text-2xl font-bold text-status-green">{formatPeso(totals.netSales)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">VAT Collected</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(totals.taxCollected)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Avg Ticket Size</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(avgTicket)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Pax</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{totals.pax}</p>
	</div>
</div>

<!-- Empty state when no rows -->
{#if rows.length === 0}
	<div class="mb-5 flex items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
		<div class="text-2xl">📭</div>
		<div>
			<p class="font-semibold text-gray-700">No sales data for this period</p>
			<p class="text-sm text-gray-500 mt-0.5">
				{period === 'daily' ? 'No paid orders in the last 14 days. Switch to Weekly to see older data, or check that orders have been settled (paid status).' : 'No paid orders in the last 8 weeks.'}
			</p>
		</div>
	</div>
{/if}

<!-- Revenue table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<!-- Always visible: Period, Net, Pax -->
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Period</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Gross</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Disc.</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net</th>
				<!-- Hidden on tablet, visible on large screens -->
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden lg:table-cell">VAT Sales</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden lg:table-cell">Non-VAT</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Tax</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Pax</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each rows as row}
				<tr class={cn('hover:bg-gray-50', row.isToday && period === 'daily' && 'bg-accent/5')}>
					<td class="px-4 py-3 font-medium text-gray-900">
						{row.date}
						{#if row.isToday && period === 'daily'}<span class="ml-2 rounded-full bg-status-green-light px-2 py-0.5 text-[10px] font-semibold text-status-green">LIVE</span>{/if}
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-700 hidden sm:table-cell">{formatPeso(row.grossSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-status-red hidden sm:table-cell">
						{row.discounts > 0 ? `−${formatPeso(row.discounts)}` : '—'}
					</td>
					<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(row.netSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500 hidden lg:table-cell">{formatPeso(row.vatSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500 hidden lg:table-cell">{formatPeso(row.nonVatSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500 hidden sm:table-cell">{formatPeso(row.taxCollected)}</td>
					<td class="px-4 py-3 text-right text-gray-700">{row.pax}</td>
				</tr>
			{/each}
			<tr class="border-t-2 border-border bg-gray-50 font-bold">
				<td class="px-4 py-3 text-gray-900">TOTAL</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900 hidden sm:table-cell">{formatPeso(totals.grossSales)}</td>
				<td class="px-4 py-3 text-right font-mono text-status-red hidden sm:table-cell">−{formatPeso(totals.discounts)}</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.netSales)}</td>
				<td class="hidden lg:table-cell"></td>
				<td class="hidden lg:table-cell"></td>
				<td class="px-4 py-3 text-right font-mono text-gray-900 hidden sm:table-cell">{formatPeso(totals.taxCollected)}</td>
				<td class="px-4 py-3 text-right text-gray-900">{totals.pax}</td>
			</tr>
		</tbody>
	</table>
</div>
