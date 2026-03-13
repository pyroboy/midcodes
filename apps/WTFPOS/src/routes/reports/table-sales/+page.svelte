<script lang="ts">
	import { cn, formatPeso } from '$lib/utils';
	import { tableSalesByPeriod, tableSalesComparison } from '$lib/stores/reports.svelte';
	import { session } from '$lib/stores/session.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportHorizBar from '$lib/components/reports/ReportHorizBar.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	// [07] Sortable columns
	type SortKey = 'netSales' | 'sessions' | 'pax' | 'avgPerPax' | 'grossSales';
	let sortKey = $state<SortKey>('netSales');
	let sortAsc = $state(false);

	const rawRows = $derived(tableSalesByPeriod(period));

	// [07] Apply sort
	const rows = $derived.by(() => {
		const sorted = [...rawRows].sort((a, b) => {
			let av: number, bv: number;
			if (sortKey === 'avgPerPax') {
				av = a.pax > 0 ? a.netSales / a.pax : 0;
				bv = b.pax > 0 ? b.netSales / b.pax : 0;
			} else {
				av = a[sortKey];
				bv = b[sortKey];
			}
			return sortAsc ? av - bv : bv - av;
		});
		return sorted;
	});

	// [01] Comparison context for KPIs
	const comparison = $derived(tableSalesComparison(period));

	const totals = $derived({
		sessions:   rawRows.reduce((s, r) => s + r.sessions, 0),
		pax:        rawRows.reduce((s, r) => s + r.pax, 0),
		grossSales: rawRows.reduce((s, r) => s + r.grossSales, 0),
		discounts:  rawRows.reduce((s, r) => s + r.discounts, 0),
		netSales:   rawRows.reduce((s, r) => s + r.netSales, 0),
	});

	// [03] Chart shows revenue-per-pax instead of duplicating net sales
	const chartRows = $derived(
		rows
			.filter(r => r.pax > 0)
			.map(r => ({
				label: r.label,
				value: Math.round(r.netSales / r.pax),
				subLabel: `${r.sessions} session${r.sessions !== 1 ? 's' : ''} · ${r.pax} pax · Net ${formatPeso(r.netSales)}`,
			}))
	);

	// [02] Branch color badges for "all" mode
	const BRANCH_COLORS: Record<string, string> = {
		tag: 'bg-blue-50 text-blue-600',
		pgl: 'bg-violet-50 text-violet-600',
	};
	const isAll = $derived(session.locationId === 'all');

	// [07] Sort handler
	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = false;
		}
	}

	function sortIndicator(key: SortKey): string {
		if (sortKey !== key) return '';
		return sortAsc ? ' ▲' : ' ▼';
	}
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
			showLive={period === 'today'}
		/>
	{/snippet}

	{#snippet kpis()}
		<!-- [01] KPIs with comparison context; [06] Replaced Gross Sales with Avg ₱/Guest -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 flex-1">
			<KpiCard
				label="Total Sessions"
				value={String(comparison.sessions.current)}
				change={comparison.sessions.changePct}
				prevValue={String(comparison.sessions.previous)}
				changeLabel="vs prev period"
			/>
			<KpiCard
				label="Total Pax"
				value={String(comparison.totalPax.current)}
				change={comparison.totalPax.changePct}
				prevValue={String(comparison.totalPax.previous)}
				changeLabel="vs prev period"
			/>
			<KpiCard
				label="Avg ₱/Guest"
				value={formatPeso(comparison.avgPerPax.current)}
				change={comparison.avgPerPax.changePct}
				prevValue={formatPeso(comparison.avgPerPax.previous)}
				changeLabel="vs prev period"
				variant="accent"
			/>
			<KpiCard
				label="Net Sales"
				value={formatPeso(comparison.netSales.current)}
				change={comparison.netSales.changePct}
				prevValue={formatPeso(comparison.netSales.previous)}
				changeLabel="vs prev period"
				variant="success"
			/>
		</div>
	{/snippet}

	{#snippet chart()}
		<!-- [03] Revenue per pax chart instead of duplicate net sales -->
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Revenue per Guest by Table</p>
			<ReportHorizBar
				rows={chartRows}
				formatValue={(v) => formatPeso(v)}
			/>
		</div>
	{/snippet}

	{#snippet content()}
		<div class="overflow-x-auto rounded-xl border border-border bg-white">
			{#if rows.length === 0}
				<div class="flex items-center justify-center p-10 text-center text-gray-400">
					<div><div class="mb-2 text-3xl">📊</div><p class="text-sm">No table sales recorded for this period</p></div>
				</div>
			{:else}
				<table class="w-full text-sm">
					<thead>
						<!-- [04] Zone column removed; [05] Avg Check renamed to ₱/Guest; [07] Sortable headers -->
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Table</th>
							<th
								class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer select-none hover:text-gray-600"
								onclick={() => toggleSort('sessions')}
							>Sessions{sortIndicator('sessions')}</th>
							<th
								class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer select-none hover:text-gray-600"
								onclick={() => toggleSort('pax')}
							>Pax{sortIndicator('pax')}</th>
							<th
								class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer select-none hover:text-gray-600"
								onclick={() => toggleSort('avgPerPax')}
							>₱/Guest{sortIndicator('avgPerPax')}</th>
							<th
								class="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer select-none hover:text-gray-600"
								onclick={() => toggleSort('grossSales')}
							>Gross{sortIndicator('grossSales')}</th>
							<th class="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Disc.</th>
							<th
								class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer select-none hover:text-gray-600"
								onclick={() => toggleSort('netSales')}
							>Net{sortIndicator('netSales')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each rows as row (row.tableId)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<span class="font-bold text-gray-900">{row.label}</span>
										<!-- [02] Branch badge in "all" mode -->
										{#if isAll}
											<span class={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', BRANCH_COLORS[row.locationId] ?? 'bg-gray-100 text-gray-500')}>
												{row.locationId === 'tag' ? 'TAG' : row.locationId === 'pgl' ? 'PGL' : row.locationId.toUpperCase()}
											</span>
										{/if}
									</div>
								</td>
								<td class="px-4 py-3 text-right text-gray-700">{row.sessions}</td>
								<td class="px-4 py-3 text-right text-gray-700">{row.pax}</td>
								<td class="px-4 py-3 text-right font-mono text-gray-600">
									{row.pax > 0 ? formatPeso(Math.round(row.netSales / row.pax)) : '—'}
								</td>
								<td class="hidden sm:table-cell px-4 py-3 text-right font-mono text-gray-700">{formatPeso(row.grossSales)}</td>
								<td class="hidden sm:table-cell px-4 py-3 text-right font-mono text-status-red">
									{row.discounts > 0 ? `−${formatPeso(row.discounts)}` : '—'}
								</td>
								<td class="px-4 py-3 text-right font-mono font-bold text-gray-900">{formatPeso(row.netSales)}</td>
							</tr>
						{/each}
						<tr class="border-t-2 border-border bg-gray-50 font-bold">
							<td class="px-4 py-3 text-gray-900">TOTAL</td>
							<td class="px-4 py-3 text-right text-gray-900">{totals.sessions}</td>
							<td class="px-4 py-3 text-right text-gray-900">{totals.pax}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-600">
								{totals.pax > 0 ? formatPeso(Math.round(totals.netSales / totals.pax)) : '—'}
							</td>
							<td class="hidden sm:table-cell px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.grossSales)}</td>
							<td class="hidden sm:table-cell px-4 py-3 text-right font-mono text-status-red">
								{totals.discounts > 0 ? `−${formatPeso(totals.discounts)}` : '—'}
							</td>
							<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totals.netSales)}</td>
						</tr>
					</tbody>
				</table>
			{/if}
		</div>
	{/snippet}
</ReportShell>
