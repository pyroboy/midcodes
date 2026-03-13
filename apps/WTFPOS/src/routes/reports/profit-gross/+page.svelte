<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { netSalesByPeriod, inPeriod, salesByDayForChart, salesSummaryWithComparison } from '$lib/stores/reports.svelte';
	import { allExpenses } from '$lib/stores/expenses.svelte';
	import { session } from '$lib/stores/session.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	const COGS_CATEGORIES = ['Meat & Protein', 'Sides & Supplies'];

	function cogsByPeriod(p: Period) {
		const filtered = allExpenses.value.filter(e =>
			COGS_CATEGORIES.includes(e.category) &&
			(session.locationId === 'all' || e.locationId === session.locationId) &&
			inPeriod(e.createdAt, p)
		);
		const total = filtered.reduce((s, e) => s + e.amount, 0);
		const breakdown = COGS_CATEGORIES
			.map(cat => ({ label: cat, amount: filtered.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) }))
			.filter(b => b.amount > 0);
		return { total, breakdown };
	}

	const revenue      = $derived(netSalesByPeriod(period));
	const cogs         = $derived(cogsByPeriod(period));
	const grossProfit  = $derived(revenue - cogs.total);
	const grossMarginPct = $derived(revenue > 0 ? grossProfit / revenue * 100 : 0);
	const comparison   = $derived(salesSummaryWithComparison(period));
	const chartData    = $derived(salesByDayForChart(14));
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={period}
			onPeriodChange={(p) => (period = p as Period)}
			options={[
				{ value: 'today', label: 'Today' },
				{ value: 'week',  label: 'This Week' },
				{ value: 'month', label: 'This Month' },
			]}
		/>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 flex-1">
			<KpiCard
				label="Net Revenue"
				value={formatPeso(revenue)}
				change={comparison.netSales.changePct}
				changeLabel="vs prev period"
			/>
			<KpiCard label="Food COGS" value={formatPeso(cogs.total)} variant="danger" />
			<KpiCard label="Gross Profit" value={formatPeso(grossProfit)} variant="success" />
			<KpiCard label="Gross Margin" value="{grossMarginPct.toFixed(1)}%" />
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Net Revenue — Last 14 Days</p>
			<div class="relative">
				<ReportBarChart data={chartData} yUnit="₱" height={200} showSecondary={false} primaryColor="#EA580C" />
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
			<!-- COGS breakdown table -->
			<div class="overflow-x-auto rounded-xl border border-border bg-white">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cost Component</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">% of Revenue</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#if cogs.breakdown.length === 0}
							<tr><td colspan="3" class="px-4 py-6 text-center text-sm text-gray-400">No food expenses logged for this period.</td></tr>
						{:else}
							{#each cogs.breakdown as item}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 pl-8 text-gray-600">{item.label}</td>
									<td class="px-4 py-3 text-right font-mono text-gray-700">{formatPeso(item.amount)}</td>
									<td class="px-4 py-3 text-right font-mono text-gray-500">{revenue > 0 ? (item.amount / revenue * 100).toFixed(1) : '0.0'}%</td>
								</tr>
							{/each}
						{/if}
						<tr class="border-t-2 border-border bg-gray-50 font-bold">
							<td class="px-4 py-3 text-gray-900">Total COGS</td>
							<td class="px-4 py-3 text-right font-mono text-status-red">{formatPeso(cogs.total)}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-900">{revenue > 0 ? (cogs.total / revenue * 100).toFixed(1) : '0.0'}%</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Visual summary -->
			<div class="flex flex-col gap-4">
				<div class="rounded-xl border border-border bg-white p-5">
					<h3 class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Profit Waterfall</h3>
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Revenue</span>
							<span class="font-mono text-sm font-semibold text-gray-900">{formatPeso(revenue)}</span>
						</div>
						<div class="h-3 w-full overflow-hidden rounded-full bg-gray-100">
							<div class="h-full rounded-full bg-accent" style="width: 100%"></div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Food COGS</span>
							<span class="font-mono text-sm font-semibold text-status-red">−{formatPeso(cogs.total)}</span>
						</div>
						<div class="h-3 w-full overflow-hidden rounded-full bg-gray-100">
							<div class="h-full rounded-full bg-status-red" style="width: {revenue > 0 ? cogs.total / revenue * 100 : 0}%"></div>
						</div>
						<div class="mt-2 flex items-center justify-between border-t border-border pt-2">
							<span class="text-sm font-bold text-gray-900">= Gross Profit</span>
							<span class="font-mono text-lg font-bold text-status-green">{formatPeso(grossProfit)}</span>
						</div>
					</div>
				</div>
				<div class="rounded-xl border border-border bg-white p-5 text-center">
					<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Live from RxDB</p>
					<p class="mt-1 text-xs text-gray-500">COGS = logged Meat & Protein + Sides & Supplies expenses for the period</p>
				</div>
			</div>
		</div>
	{/snippet}
</ReportShell>
