<script lang="ts">
	import { cn, formatPeso } from '$lib/utils';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	interface TableSaleRow {
		table: string;
		zone: string;
		sessions: number;
		pax: number;
		grossSales: number;
		discounts: number;
		netSales: number;
	}

	const data: Record<Period, TableSaleRow[]> = {
		today: [
			{ table: 'T1', zone: 'Main',  sessions: 2, pax: 8,  grossSales: 4820,  discounts: 0,    netSales: 4820 },
			{ table: 'T2', zone: 'Main',  sessions: 1, pax: 4,  grossSales: 2960,  discounts: 592,  netSales: 2368 },
			{ table: 'T3', zone: 'Main',  sessions: 2, pax: 7,  grossSales: 3580,  discounts: 0,    netSales: 3580 },
			{ table: 'T4', zone: 'Main',  sessions: 1, pax: 3,  grossSales: 1780,  discounts: 356,  netSales: 1424 },
			{ table: 'T5', zone: 'Main',  sessions: 3, pax: 10, grossSales: 5420,  discounts: 0,    netSales: 5420 },
			{ table: 'T6', zone: 'Main',  sessions: 1, pax: 4,  grossSales: 2240,  discounts: 0,    netSales: 2240 },
			{ table: 'VIP1', zone: 'VIP', sessions: 1, pax: 6,  grossSales: 12056, discounts: 0,    netSales: 12056 },
			{ table: 'BAR1', zone: 'Bar', sessions: 2, pax: 4,  grossSales: 1840,  discounts: 0,    netSales: 1840 }
		],
		week: [
			{ table: 'T1',   zone: 'Main', sessions: 14, pax: 52,  grossSales: 34020,  discounts: 2100, netSales: 31920 },
			{ table: 'T2',   zone: 'Main', sessions: 12, pax: 44,  grossSales: 28460,  discounts: 3200, netSales: 25260 },
			{ table: 'VIP1', zone: 'VIP',  sessions: 5,  pax: 30,  grossSales: 58200,  discounts: 0,    netSales: 58200 }
		],
		month: [
			{ table: 'T1',   zone: 'Main', sessions: 60, pax: 220, grossSales: 142000, discounts: 8500, netSales: 133500 },
			{ table: 'VIP1', zone: 'VIP',  sessions: 22, pax: 132, grossSales: 248600, discounts: 0,    netSales: 248600 }
		]
	};

	const rows = $derived(data[period]);
	const totals = $derived({
		sessions:   rows.reduce((s, r) => s + r.sessions, 0),
		pax:        rows.reduce((s, r) => s + r.pax, 0),
		grossSales: rows.reduce((s, r) => s + r.grossSales, 0),
		discounts:  rows.reduce((s, r) => s + r.discounts, 0),
		netSales:   rows.reduce((s, r) => s + r.netSales, 0)
	});

	const zoneColor: Record<string, string> = {
		Main: 'bg-blue-50 text-blue-600',
		VIP:  'bg-purple-50 text-purple-600',
		Bar:  'bg-amber-50 text-amber-600'
	};
</script>

<!-- Period toggle -->
<div class="mb-5 flex items-center gap-2">
	{#each (['today', 'week', 'month'] as const) as p}
		<button
			onclick={() => (period = p)}
			class={cn(
				'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
				period === p ? 'bg-accent text-white' : 'border border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
		</button>
	{/each}
</div>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-4 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Sessions</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{totals.sessions}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Pax</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{totals.pax}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Gross Sales</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(totals.grossSales)}</p>
	</div>
	<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-green">Net Sales</p>
		<p class="mt-1 text-2xl font-bold text-status-green">{formatPeso(totals.netSales)}</p>
	</div>
</div>

<!-- Table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Table</th>
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Zone</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Sessions</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Pax</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Avg Check</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Gross</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Disc.</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each rows as row (row.table)}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-3 font-bold text-gray-900">{row.table}</td>
					<td class="px-4 py-3">
						<span class={cn('rounded-full px-2 py-0.5 text-xs font-medium', zoneColor[row.zone] ?? 'bg-gray-100 text-gray-500')}>
							{row.zone}
						</span>
					</td>
					<td class="px-4 py-3 text-right text-gray-700">{row.sessions}</td>
					<td class="px-4 py-3 text-right text-gray-700">{row.pax}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-600">
						{row.pax > 0 ? formatPeso(Math.round(row.netSales / row.pax)) : '—'}
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-700">{formatPeso(row.grossSales)}</td>
					<td class="px-4 py-3 text-right font-mono text-status-red">
						{row.discounts > 0 ? `−${formatPeso(row.discounts)}` : '—'}
					</td>
					<td class="px-4 py-3 text-right font-mono font-bold text-gray-900">{formatPeso(row.netSales)}</td>
				</tr>
			{/each}
			<!-- Total row -->
			<tr class="border-t-2 border-border bg-gray-50 font-bold">
				<td class="px-4 py-3 text-gray-900" colspan="2">TOTAL</td>
				<td class="px-4 py-3 text-right text-gray-900">{totals.sessions}</td>
				<td class="px-4 py-3 text-right text-gray-900">{totals.pax}</td>
				<td class="px-4 py-3 text-right font-mono text-gray-600">
					{totals.pax > 0 ? formatPeso(Math.round(totals.netSales / totals.pax)) : '—'}
				</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.grossSales)}</td>
				<td class="px-4 py-3 text-right font-mono text-status-red">
					{totals.discounts > 0 ? `−${formatPeso(totals.discounts)}` : '—'}
				</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.netSales)}</td>
			</tr>
		</tbody>
	</table>
</div>
