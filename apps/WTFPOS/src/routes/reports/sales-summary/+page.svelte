<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { salesSummary } from '$lib/stores/reports.svelte';

	type Period = 'daily' | 'weekly';
	let period = $state<Period>('daily');

	// Today's live row — derived from the store
	const todayRow = $derived(salesSummary());
	// VAT rate is 12% - calculate VAT-exclusive amount properly
	const VAT_RATE = 0.12;
	const vatSales = $derived(Math.round(todayRow.netSales / (1 + VAT_RATE)));
	const nonVatSales = $derived(todayRow.netSales - vatSales);
	const taxCollected = $derived(Math.round(vatSales * VAT_RATE));

	// Historical seed rows (past days) augmented with today's live data
	const historicalDaily = [
		{ date: 'Mar 2', grossSales: 28400, discounts: 1200, netSales: 27200, vatSales: 24800, nonVatSales: 2400, taxCollected: 2976, pax: 38 },
		{ date: 'Mar 1', grossSales: 42100, discounts: 600,  netSales: 41500, vatSales: 37800, nonVatSales: 3700, taxCollected: 4536, pax: 52 },
		{ date: 'Feb 28', grossSales: 31200, discounts: 1500, netSales: 29700, vatSales: 27000, nonVatSales: 2700, taxCollected: 3240, pax: 41 },
		{ date: 'Feb 27', grossSales: 38900, discounts: 780,  netSales: 38120, vatSales: 34800, nonVatSales: 3320, taxCollected: 4176, pax: 48 },
		{ date: 'Feb 26', grossSales: 26500, discounts: 400,  netSales: 26100, vatSales: 23600, nonVatSales: 2500, taxCollected: 2832, pax: 33 },
		{ date: 'Feb 25', grossSales: 44200, discounts: 1100, netSales: 43100, vatSales: 39200, nonVatSales: 3900, taxCollected: 4704, pax: 55 },
	];

	const weeklyData = [
		{ date: 'Week 9 (Mar 1-3)', grossSales: 105196, discounts: 2748, netSales: 102448, vatSales: 92768, nonVatSales: 9680, taxCollected: 11130, pax: 136 },
		{ date: 'Week 8 (Feb 22-28)', grossSales: 180300, discounts: 5280, netSales: 175020, vatSales: 159200, nonVatSales: 15820, taxCollected: 19104, pax: 232 },
	];

	const rows = $derived(period === 'weekly' ? weeklyData : [
		{ date: 'Today (live)', grossSales: todayRow.grossSales, discounts: todayRow.discounts, netSales: todayRow.netSales, vatSales, nonVatSales, taxCollected, pax: todayRow.totalPax },
		...historicalDaily,
	]);

	const totals = $derived({
		grossSales:   rows.reduce((s, r) => s + r.grossSales, 0),
		discounts:    rows.reduce((s, r) => s + r.discounts, 0),
		netSales:     rows.reduce((s, r) => s + r.netSales, 0),
		taxCollected: rows.reduce((s, r) => s + r.taxCollected, 0),
		pax:          rows.reduce((s, r) => s + r.pax, 0),
	});
	const avgTicket = $derived(totals.pax > 0 ? Math.round(totals.netSales / totals.pax) : 0);
</script>

<!-- Period toggle -->
<div class="mb-5 flex items-center gap-2">
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

<!-- Revenue table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Period</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Gross</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Disc.</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">VAT Sales</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Non-VAT</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Tax</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Pax</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each rows as row, i}
				<tr class={cn('hover:bg-gray-50', i === 0 && period === 'daily' && 'bg-accent/5')}>
					<td class="px-4 py-3 font-medium text-gray-900">
						{row.date}
						{#if i === 0 && period === 'daily'}<span class="ml-2 rounded-full bg-status-green-light px-2 py-0.5 text-[10px] font-semibold text-status-green">LIVE</span>{/if}
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-700">{formatPeso(row.grossSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-status-red">
						{row.discounts > 0 ? `−${formatPeso(row.discounts)}` : '—'}
					</td>
					<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(row.netSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{formatPeso(row.vatSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{formatPeso(row.nonVatSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{formatPeso(row.taxCollected)}</td>
					<td class="px-4 py-3 text-right text-gray-700">{row.pax}</td>
				</tr>
			{/each}
			<tr class="border-t-2 border-border bg-gray-50 font-bold">
				<td class="px-4 py-3 text-gray-900">TOTAL</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.grossSales)}</td>
				<td class="px-4 py-3 text-right font-mono text-status-red">−{formatPeso(totals.discounts)}</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.netSales)}</td>
				<td colspan="2"></td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.taxCollected)}</td>
				<td class="px-4 py-3 text-right text-gray-900">{totals.pax}</td>
			</tr>
		</tbody>
	</table>
</div>
