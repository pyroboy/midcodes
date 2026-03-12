<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import {
		salesByDay, salesByWeek,
		salesSummaryWithComparison,
		salesByDayForChart, salesByWeekForChart,
	} from '$lib/stores/reports.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';

	type QuickRange = 'today' | 'week' | 'month' | 'all';
	type Granularity = 'daily' | 'weekly';
	let quickRange = $state<QuickRange>('today');
	let granularity = $state<Granularity>('daily');

	const VAT_RATE = 0.12;

	function withVatBreakdown<T extends { netSales: number }>(row: T) {
		const vatSales = Math.round(row.netSales / (1 + VAT_RATE));
		return { ...row, vatSales, vatAmount: row.netSales - vatSales, taxCollected: Math.round(vatSales * VAT_RATE) };
	}

	const dailyRows = $derived(
		salesByDay(14).map(r => ({ ...withVatBreakdown(r), date: r.isToday ? 'Today (live)' : r.date, pax: r.totalPax, dateKey: r.dateKey, isToday: r.isToday }))
	);
	const weeklyRows = $derived(
		salesByWeek(8).map(r => ({ ...withVatBreakdown(r), date: r.weekLabel, isToday: false, pax: r.totalPax, dateKey: r.weekKey }))
	);

	const allRows = $derived(granularity === 'weekly' ? weeklyRows : dailyRows);

	const rows = $derived.by(() => {
		if (quickRange === 'all') return allRows;
		const now = new Date();
		const todayKey = now.toISOString().slice(0, 10);
		if (quickRange === 'today') return allRows.filter(r => r.dateKey === todayKey);
		if (quickRange === 'week') {
			const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
			return allRows.filter(r => r.dateKey >= weekAgo.toISOString().slice(0, 10));
		}
		if (quickRange === 'month') {
			const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);
			return allRows.filter(r => r.dateKey >= monthAgo.toISOString().slice(0, 10));
		}
		return allRows;
	});

	const totals = $derived({
		grossSales:   rows.reduce((s, r) => s + r.grossSales, 0),
		discounts:    rows.reduce((s, r) => s + r.discounts, 0),
		netSales:     rows.reduce((s, r) => s + r.netSales, 0),
		vatSales:     rows.reduce((s, r) => s + r.vatSales, 0),
		vatAmount:    rows.reduce((s, r) => s + r.vatAmount, 0),
		taxCollected: rows.reduce((s, r) => s + r.taxCollected, 0),
		pax:          rows.reduce((s, r) => s + r.pax, 0),
	});
	const avgTicket = $derived(totals.pax > 0 ? Math.round(totals.netSales / totals.pax) : 0);

	// KPI comparison — null for 'all' (no meaningful previous period)
	const hasComparison = $derived(quickRange !== 'all');
	const comparison = $derived(
		hasComparison ? salesSummaryWithComparison(quickRange as 'today' | 'week' | 'month') : null
	);

	// Chart data — syncs with granularity toggle (D1 fix)
	const chartData = $derived(
		granularity === 'weekly' ? salesByWeekForChart(8) : salesByDayForChart(14)
	);

	// Highlight the selected period range in the chart (D6 fix)
	const chartDataWithHighlight = $derived.by(() => {
		if (quickRange === 'all') return chartData;
		const now = new Date();
		const todayKey = now.toISOString().slice(0, 10);
		if (quickRange === 'today') {
			return chartData.map(d => ({ ...d, highlight: d.label === 'Today' }));
		}
		if (quickRange === 'week') {
			const weekAgo = new Date(now);
			weekAgo.setDate(now.getDate() - 7);
			const weekAgoKey = weekAgo.toISOString().slice(0, 10);
			// For daily: highlight bars within last 7 days. For weekly: highlight current week.
			if (granularity === 'daily') {
				const dayRows = salesByDay(14);
				const inRange = new Set(
					dayRows.filter(r => r.dateKey >= weekAgoKey).map(r => r.isToday ? 'Today' : r.date)
				);
				return chartData.map(d => ({ ...d, highlight: inRange.has(d.label) }));
			}
			return chartData.map((d, i) => ({ ...d, highlight: i === chartData.length - 1 }));
		}
		if (quickRange === 'month') {
			// Highlight all bars (month covers most of the 14-day / 8-week range)
			return chartData.map(d => ({ ...d, highlight: true }));
		}
		return chartData;
	});
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={quickRange}
			onPeriodChange={(p) => (quickRange = p as QuickRange)}
			showLive={true}
		>
			{#snippet actions()}
				<span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">View</span>
				{#each (['daily', 'weekly'] as const) as g}
					<button
						onclick={() => (granularity = g)}
						class={cn(
							'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
							granularity === g ? 'bg-accent text-white' : 'border border-border bg-white text-gray-500 hover:bg-gray-50'
						)}
						style="min-height: unset"
					>
						{g === 'daily' ? 'Daily' : 'Weekly'}
					</button>
				{/each}
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
			<KpiCard
				label="Gross Sales"
				value={formatPeso(hasComparison && comparison ? comparison.grossSales.current : totals.grossSales)}
				change={hasComparison && comparison ? comparison.grossSales.changePct : null}
				prevValue={hasComparison && comparison ? formatPeso(comparison.grossSales.previous) : null}
				changeLabel="vs prev period"
			/>
			<KpiCard
				label="Net Sales"
				value={formatPeso(hasComparison && comparison ? comparison.netSales.current : totals.netSales)}
				change={hasComparison && comparison ? comparison.netSales.changePct : null}
				prevValue={hasComparison && comparison ? formatPeso(comparison.netSales.previous) : null}
				changeLabel="vs prev period"
				variant="success"
			/>
			<KpiCard
				label="VAT Collected"
				value={formatPeso(totals.taxCollected)}
			/>
			<KpiCard
				label="Avg Ticket"
				value={formatPeso(hasComparison && comparison ? comparison.avgTicket.current : avgTicket)}
				change={hasComparison && comparison ? comparison.avgTicket.changePct : null}
				prevValue={hasComparison && comparison ? formatPeso(comparison.avgTicket.previous) : null}
				changeLabel="vs prev period"
			/>
			<KpiCard
				label="Total Pax"
				value={String(hasComparison && comparison ? comparison.totalPax.current : totals.pax)}
				change={hasComparison && comparison ? comparison.totalPax.changePct : null}
				prevValue={hasComparison && comparison ? String(comparison.totalPax.previous) : null}
				changeLabel="vs prev period"
			/>
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<div class="mb-3 flex items-center gap-4">
				<p class="text-xs font-bold uppercase tracking-wide text-gray-400">
					{granularity === 'daily' ? 'Last 14 Days' : 'Last 8 Weeks'}
				</p>
				<div class="flex items-center gap-3 text-[10px]">
					<span class="flex items-center gap-1"><span class="inline-block h-2 w-4 rounded-sm bg-accent/75"></span> Gross</span>
					<span class="flex items-center gap-1"><span class="inline-block h-2 w-4 rounded-sm bg-status-green/65"></span> Net</span>
				</div>
			</div>
			<div class="relative">
				<ReportBarChart
					data={chartDataWithHighlight}
					yUnit="₱"
					height={200}
					showSecondary={true}
					primaryColor="#EA580C"
					secondaryColor="#10B981"
				/>
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<!-- Empty state -->
		{#if rows.length === 0}
			<div class="mb-5 flex items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
				<div class="text-2xl">📭</div>
				<div>
					<p class="font-semibold text-gray-700">No sales data for this period</p>
					<p class="text-sm text-gray-500 mt-0.5">
						{granularity === 'daily' ? 'No paid orders in the last 14 days.' : 'No paid orders in the last 8 weeks.'}
					</p>
				</div>
			</div>
		{/if}

		<!-- Revenue table -->
		<div class="overflow-hidden rounded-xl border border-border bg-white">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-gray-50">
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Period</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Gross</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Disc.</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden lg:table-cell">VAT Sales</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden lg:table-cell">VAT Amount</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Tax</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Pax</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each rows as row}
						<tr class={cn('hover:bg-gray-50', row.isToday && granularity === 'daily' && 'bg-accent/5')}>
							<td class="px-4 py-3 font-medium text-gray-900">
								{row.date}
								{#if row.isToday && granularity === 'daily'}<span class="ml-2 rounded-full bg-status-green-light px-2 py-0.5 text-[10px] font-semibold text-status-green">LIVE</span>{/if}
							</td>
							<td class="px-4 py-3 text-right font-mono text-gray-700 hidden sm:table-cell">{formatPeso(row.grossSales)}</td>
							<td class="px-4 py-3 text-right font-mono text-status-red hidden sm:table-cell">
								{row.discounts > 0 ? `−${formatPeso(row.discounts)}` : '—'}
							</td>
							<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(row.netSales)}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-500 hidden lg:table-cell">{formatPeso(row.vatSales)}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-500 hidden lg:table-cell">{formatPeso(row.vatAmount)}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-500 hidden sm:table-cell">{formatPeso(row.taxCollected)}</td>
							<td class="px-4 py-3 text-right text-gray-700">{row.pax}</td>
						</tr>
					{/each}
					<tr class="border-t-2 border-border bg-gray-50 font-bold">
						<td class="px-4 py-3 text-gray-900">TOTAL</td>
						<td class="px-4 py-3 text-right font-mono text-gray-900 hidden sm:table-cell">{formatPeso(totals.grossSales)}</td>
						<td class="px-4 py-3 text-right font-mono text-status-red hidden sm:table-cell">−{formatPeso(totals.discounts)}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.netSales)}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-900 hidden lg:table-cell">{formatPeso(totals.vatSales)}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-900 hidden lg:table-cell">{formatPeso(totals.vatAmount)}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-900 hidden sm:table-cell">{formatPeso(totals.taxCollected)}</td>
						<td class="px-4 py-3 text-right text-gray-900">{totals.pax}</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/snippet}
</ReportShell>
