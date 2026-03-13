<script lang="ts">
	import { cn, formatPeso, formatKg } from '$lib/utils';
	import { meatReport, PERIOD_LABELS, type MeatReportPeriod, getDateBounds } from '$lib/stores/reports.svelte';
	import { PROTEIN_ORDER } from '$lib/stores/stock.constants';
	import { session, LOCATION_SHORT_NAMES } from '$lib/stores/session.svelte';
	import { deliveries, adjustments } from '$lib/stores/stock.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import MeatSalesCard from '$lib/components/reports/MeatSalesCard.svelte';
	import ReportHorizBar from '$lib/components/reports/ReportHorizBar.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import LocationMeatCard from '$lib/components/reports/LocationMeatCard.svelte';
	import MeatFlowBar from '$lib/components/reports/MeatFlowBar.svelte';
	import MeatOntologyGraph from '$lib/components/reports/MeatOntologyGraph.svelte';
	import VarianceBar from '$lib/components/stock/VarianceBar.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import { ArrowDownLeft, ArrowUpRight } from 'lucide-svelte';
	import { format } from 'date-fns';

	type MeatTab = 'consumption' | 'transfers' | 'conversion';
	type Trend = 'ok' | 'high' | 'low';

	const trendConfig: Record<Trend, { label: string; class: string }> = {
		ok:   { label: 'Normal',       class: 'bg-status-green-light text-status-green border-status-green/20' },
		high: { label: 'High Loss',    class: 'bg-status-red-light text-status-red border-status-red/20' },
		low:  { label: 'Low Turnover', class: 'bg-status-yellow-light text-status-yellow border-status-yellow/30' },
	};

	const proteinGroupColors: Record<string, { bg: string; border: string; text: string }> = {
		pork:    { bg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-600' },
		beef:    { bg: 'bg-red-50/50',    border: 'border-red-100',    text: 'text-red-600' },
		chicken: { bg: 'bg-yellow-50/50', border: 'border-yellow-100', text: 'text-yellow-600' },
		other:   { bg: 'bg-gray-50/50',   border: 'border-gray-100',   text: 'text-gray-600' },
	};

	const TAB_LABELS: Record<MeatTab, string> = {
		consumption: 'Consumption',
		transfers: 'Transfers',
		conversion: 'Conversion',
	};

	let period: MeatReportPeriod = $state('today');
	let activeTab: MeatTab = $state('consumption');

	const report = $derived(meatReport(period));

	const groupedRows = $derived.by(() => {
		const groups: { protein: string; rows: typeof report.rows }[] = [];
		for (const p of PROTEIN_ORDER) {
			const pRows = report.rows.filter(r => r.proteinType === p);
			if (pRows.length > 0) groups.push({ protein: p, rows: pRows });
		}
		return groups;
	});

	// [05] Subtotals per protein group and grand total
	const groupSubtotals = $derived.by(() => {
		const subs: Record<string, { opening: number; deliveries: number; consumed: number; waste: number; closing: number }> = {};
		for (const g of groupedRows) {
			subs[g.protein] = {
				opening: g.rows.reduce((s, r) => s + r.opening, 0),
				deliveries: g.rows.reduce((s, r) => s + r.deliveries, 0),
				consumed: g.rows.reduce((s, r) => s + r.consumed, 0),
				waste: g.rows.reduce((s, r) => s + r.wasteAmount, 0),
				closing: g.rows.reduce((s, r) => s + r.closing, 0),
			};
		}
		return subs;
	});

	const grandTotal = $derived({
		opening: report.rows.reduce((s, r) => s + r.opening, 0),
		deliveries: report.rows.reduce((s, r) => s + r.deliveries, 0),
		consumed: report.rows.reduce((s, r) => s + r.consumed, 0),
		waste: report.rows.reduce((s, r) => s + r.wasteAmount, 0),
		closing: report.rows.reduce((s, r) => s + r.closing, 0),
	});

	const locations = $derived.by(() => {
		if (session.locationId !== 'all') return [];
		const locIds = [...new Set(report.rows.map(r => r.locationId))];
		return locIds.map(id => ({
			id,
			label: LOCATION_SHORT_NAMES[id] ?? id,
			rows: report.rows.filter(r => r.locationId === id),
		}));
	});

	const statusDotClass: Record<string, string> = {
		ok: 'bg-status-green',
		low: 'bg-status-yellow',
		critical: 'bg-status-red',
	};

	// Transfer log
	const transferLog = $derived.by(() => {
		const { start, end } = getDateBounds(period);
		const locId = session.locationId;

		type TransferEntry = {
			time: string;
			direction: 'IN' | 'OUT';
			from: string;
			to: string;
			item: string;
			qty: number;
			unit: string;
			by: string;
		};

		const entries: TransferEntry[] = [];

		for (const d of deliveries.value) {
			if (!d.supplier.startsWith('Transfer from')) continue;
			const t = new Date(d.receivedAt);
			if (t < start || t > end) continue;
			const matchingRow = report.rows.find(r => r.id === d.stockItemId);
			const destLocId = matchingRow?.locationId ?? '';
			if (locId !== 'all' && destLocId !== locId) continue;
			const fromLoc = d.supplier.replace('Transfer from ', '');
			entries.push({
				time: d.receivedAt,
				direction: 'IN',
				from: LOCATION_SHORT_NAMES[fromLoc] ?? fromLoc,
				to: LOCATION_SHORT_NAMES[destLocId] ?? destLocId,
				item: d.itemName,
				qty: d.qty,
				unit: d.unit,
				by: d.notes ?? '',
			});
		}

		for (const a of adjustments.value) {
			if (!a.reason.startsWith('Transfer to')) continue;
			const t = new Date(a.loggedAt);
			if (t < start || t > end) continue;
			const reasonParts = a.reason.replace('Transfer to ', '').split(' — ');
			const toLocId = reasonParts[0].trim();
			const fromLocId = 'wh-tag';
			if (locId !== 'all' && locId !== fromLocId && locId !== toLocId) continue;
			entries.push({
				time: a.loggedAt,
				direction: 'OUT',
				from: LOCATION_SHORT_NAMES[fromLocId] ?? fromLocId,
				to: LOCATION_SHORT_NAMES[toLocId] ?? toLocId,
				item: a.itemName,
				qty: a.qty,
				unit: a.unit,
				by: a.loggedBy,
			});
		}

		entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
		return entries;
	});

	const totalTransferIn = $derived(
		transferLog.filter(e => e.direction === 'IN').reduce((s, e) => s + e.qty, 0)
	);
	const totalTransferOut = $derived(
		transferLog.filter(e => e.direction === 'OUT').reduce((s, e) => s + e.qty, 0)
	);
	const totalMeatRevenue = $derived(
		report.rows.reduce((s, r) => s + r.soldRevenue, 0)
	);

	const consumptionRows = $derived(
		report.rows
			.filter(r => r.consumed > 0)
			.sort((a, b) => b.consumed - a.consumed)
			.slice(0, 8)
			.map(r => ({ label: r.cut, value: r.consumed, subLabel: formatKg(r.consumed) }))
	);

	const consumptionChartData = $derived(
		PROTEIN_ORDER
			.filter(p => report.byProtein[p] && (report.byProtein[p].totalSold > 0 || report.byProtein[p].totalWaste > 0))
			.map(p => ({
				label: p.charAt(0).toUpperCase() + p.slice(1),
				primary: report.byProtein[p].totalSold,
				secondary: report.byProtein[p].totalWaste,
			}))
	);

	// [01] Fix: use full item name, abbreviate if too long
	function shortCutName(name: string): string {
		// Remove " (Bulk)" suffix, then take last 2 words if still long
		const clean = name.replace(/\s*\(Bulk\)$/i, '');
		if (clean.length <= 14) return clean;
		const words = clean.split(' ');
		return words.length > 1 ? words.slice(-2).join(' ') : clean;
	}

	const transferChartData = $derived(
		(() => {
			const byItem: Record<string, { in: number; out: number }> = {};
			for (const entry of transferLog) {
				if (!byItem[entry.item]) byItem[entry.item] = { in: 0, out: 0 };
				if (entry.direction === 'IN') byItem[entry.item].in += entry.qty;
				else byItem[entry.item].out += entry.qty;
			}
			return Object.entries(byItem)
				.sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out))
				.slice(0, 8)
				.map(([cut, v]) => ({
					label: shortCutName(cut),
					primary: v.in,
					secondary: v.out,
				}));
		})()
	);

	// [08] Fix: only show chart when >= 3 cuts have revenue
	const revenueChartData = $derived(
		report.rows
			.filter(r => r.soldRevenue > 0)
			.sort((a, b) => b.soldRevenue - a.soldRevenue)
			.slice(0, 8)
			.map(r => ({
				label: shortCutName(r.cut),
				primary: r.soldRevenue,
			}))
	);

	const revenueListData = $derived(
		report.rows
			.filter(r => r.soldRevenue > 0)
			.sort((a, b) => b.soldRevenue - a.soldRevenue)
	);

	// [07] Check if it's a live "Today" view for zero-consumption handling
	const isLiveToday = $derived(period === 'today');
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={period}
			onPeriodChange={(p) => (period = p as MeatReportPeriod)}
			options={[
				{ value: 'today',     label: 'Today' },
				{ value: 'yesterday', label: 'Yesterday' },
				{ value: 'week',      label: 'This Week' },
			]}
			showLive={period === 'today'}
		>
			{#snippet actions()}
				<div class="flex rounded-lg border border-border bg-white p-0.5">
					{#each (['consumption', 'transfers', 'conversion'] as const) as tab (tab)}
						<button
							class={cn(
								'rounded-md px-4 py-2 text-sm font-semibold transition-colors',
								activeTab === tab
									? 'bg-gray-900 text-white shadow-sm'
									: 'text-gray-500 hover:text-gray-700'
							)}
							onclick={() => { activeTab = tab; }}
						>
							{TAB_LABELS[tab]}
						</button>
					{/each}
				</div>
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		{#if activeTab === 'consumption'}
			<MeatSalesCard {report} {period} />
		{:else if activeTab === 'transfers'}
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
				<KpiCard label="Total IN" value={formatKg(totalTransferIn)} variant="success" />
				<KpiCard label="Total OUT" value={formatKg(totalTransferOut)} variant="danger" />
				<KpiCard label="Net Flow" value={formatKg(totalTransferIn - totalTransferOut)} />
				<KpiCard label="Transfers" value={String(transferLog.length)} />
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
				<KpiCard label="Total Revenue" value={formatPeso(totalMeatRevenue)} variant="accent" />
				<KpiCard label="Top Cut" value={report.rows.sort((a, b) => b.soldRevenue - a.soldRevenue)[0]?.cut ?? '—'} variant="success" />
				<KpiCard label="Cuts Tracked" value={String(report.rows.length)} />
			</div>
		{/if}
	{/snippet}

	{#snippet chart()}
		{#if activeTab === 'consumption'}
			<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<p class="text-xs font-bold uppercase tracking-wide text-gray-400">Consumed vs Waste by Protein</p>
					<div class="flex items-center gap-3 text-[10px] text-gray-400">
						<span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-accent opacity-75"></span> Consumed</span>
						<span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-status-red opacity-65"></span> Waste</span>
					</div>
				</div>
				<ReportBarChart
					data={consumptionChartData}
					showSecondary={true}
					primaryColor="#EA580C"
					secondaryColor="#EF4444"
					yUnit="g"
					height={200}
					formatValue={(v) => formatKg(v)}
				/>
			</div>
		{:else if activeTab === 'transfers'}
			<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<p class="text-xs font-bold uppercase tracking-wide text-gray-400">Transfer Volume by Item — IN vs OUT</p>
					<div class="flex items-center gap-3 text-[10px] text-gray-400">
						<span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-status-green opacity-75"></span> IN</span>
						<span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-status-red opacity-65"></span> OUT</span>
					</div>
				</div>
				<ReportBarChart
					data={transferChartData}
					showSecondary={true}
					primaryColor="#10B981"
					secondaryColor="#EF4444"
					yUnit="g"
					height={200}
					formatValue={(v) => formatKg(v)}
				/>
			</div>
		{:else}
			<!-- [08] Show chart only when >= 3 cuts have revenue, otherwise compact list -->
			<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<p class="text-xs font-bold uppercase tracking-wide text-gray-400">Revenue by Cut ({@html '&#x20B1;'})</p>
					<span class="flex items-center gap-1 text-[10px] text-gray-400"><span class="inline-block h-2 w-2 rounded-sm bg-status-green opacity-75"></span> Revenue</span>
				</div>
				{#if revenueChartData.length >= 3}
					<ReportBarChart
						data={revenueChartData}
						primaryColor="#10B981"
						yUnit="₱"
						height={200}
						formatValue={(v) => formatPeso(v)}
					/>
				{:else if revenueListData.length > 0}
					<div class="space-y-2">
						{#each revenueListData as r (r.id)}
							<div class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
								<span class="text-sm font-medium text-gray-900">{r.cut}</span>
								<span class="font-mono text-sm font-bold text-status-green">{formatPeso(r.soldRevenue)}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex items-center justify-center py-8 text-sm text-gray-400">No revenue data for this period</div>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet content()}
		{#if activeTab === 'consumption'}
			<div class="flex flex-col gap-3">
				{#if consumptionRows.length > 0}
					<div class="rounded-xl border border-border bg-white p-4">
						<p class="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">Consumed by Cut</p>
						<ReportHorizBar
							rows={consumptionRows}
							formatValue={(v) => formatKg(v)}
						/>
					</div>
				{/if}

				<div class="overflow-x-auto overflow-hidden rounded-xl border border-border bg-white">
					<div class="max-h-[calc(100vh-380px)] overflow-y-auto">
						<table class="min-w-[700px] w-full text-sm">
							<thead class="sticky top-0 z-10">
								<tr class="border-b border-border bg-gray-50">
									<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cut</th>
									<th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Open</th>
									<th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">In</th>
									<th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Used</th>
									<th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Waste</th>
									<th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Close</th>
									<th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Var%</th>
									<th class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Drift</th>
									<th class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each groupedRows as group (group.protein)}
									{@const colors = proteinGroupColors[group.protein] ?? proteinGroupColors.other}
									{@const sub = groupSubtotals[group.protein]}
									<tr class={cn(colors.bg)}>
										<td colspan="9" class="px-3 py-1">
											<span class={cn('text-[10px] font-bold uppercase tracking-wider', colors.text)}>
												{group.protein}
											</span>
											<span class="ml-1.5 text-[10px] text-gray-400">{group.rows.length} cuts</span>
										</td>
									</tr>
									{#each group.rows as row (row.id)}
										<tr class="hover:bg-gray-50">
											<td class="px-3 py-2 font-medium text-gray-900">
												<div class="flex items-center gap-1.5">
													<span class={cn('inline-block h-1.5 w-1.5 rounded-full', statusDotClass[row.stockStatus])}></span>
													<span class="text-xs">{row.cut}</span>
													{#if session.locationId === 'all' && LOCATION_SHORT_NAMES[row.locationId]}
														<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">{LOCATION_SHORT_NAMES[row.locationId]}</span>
													{/if}
												</div>
											</td>
											<td class="px-3 py-2 text-right font-mono text-xs text-gray-500">{formatKg(row.opening)}</td>
											<td class="px-3 py-2 text-right font-mono text-xs text-gray-500">
												{row.deliveries > 0 ? `+${formatKg(row.deliveries)}` : '—'}
											</td>
											<td class="px-3 py-2 text-right font-mono text-xs font-semibold text-gray-900">
												{#if row.consumed === 0 && isLiveToday}
													<span class="text-gray-400 font-normal">Not yet</span>
												{:else}
													{formatKg(row.consumed)}
												{/if}
											</td>
											<td class="px-3 py-2 text-right font-mono text-xs text-status-red">
												{row.wasteAmount > 0 ? formatKg(row.wasteAmount) : '—'}
											</td>
											<td class="px-3 py-2 text-right font-mono text-xs text-gray-600">{formatKg(row.closing)}</td>
											<td class={cn(
												'px-3 py-2 text-right font-mono text-xs font-bold',
												row.consumed === 0 && row.wasteAmount === 0 ? 'text-gray-400' :
												row.variancePct < -15 ? 'text-status-red' : row.variancePct > 15 ? 'text-status-yellow' : 'text-status-green'
											)}>
												{#if row.consumed === 0 && row.wasteAmount === 0}
													—
												{:else}
													{row.variancePct > 0 ? `+${row.variancePct}` : row.variancePct}%
												{/if}
											</td>
											<td class="px-3 py-2">
												{#if row.consumed > 0 || row.wasteAmount > 0}
													<VarianceBar expected={row.opening + row.deliveries} drift={row.variancePct} />
												{/if}
											</td>
											<td class="px-3 py-2 text-center">
												{#if row.consumed === 0 && row.wasteAmount === 0 && isLiveToday}
													<span class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-400">Pending</span>
												{:else}
													<span class={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', trendConfig[row.trend].class)}>
														{trendConfig[row.trend].label}
													</span>
												{/if}
											</td>
										</tr>
									{/each}
									<!-- [05] Subtotal row per protein group -->
									{#if sub}
										<tr class={cn('font-semibold', colors.bg)}>
											<td class="px-3 py-1.5 text-xs text-gray-600">Subtotal</td>
											<td class="px-3 py-1.5 text-right font-mono text-xs text-gray-600">{formatKg(sub.opening)}</td>
											<td class="px-3 py-1.5 text-right font-mono text-xs text-gray-600">{sub.deliveries > 0 ? `+${formatKg(sub.deliveries)}` : '—'}</td>
											<td class="px-3 py-1.5 text-right font-mono text-xs text-gray-900">{formatKg(sub.consumed)}</td>
											<td class="px-3 py-1.5 text-right font-mono text-xs text-status-red">{sub.waste > 0 ? formatKg(sub.waste) : '—'}</td>
											<td class="px-3 py-1.5 text-right font-mono text-xs text-gray-600">{formatKg(sub.closing)}</td>
											<td colspan="3"></td>
										</tr>
									{/if}
								{/each}
								<!-- [05] Grand total row -->
								<tr class="border-t-2 border-border bg-gray-50 font-bold">
									<td class="px-3 py-2 text-xs text-gray-900">TOTAL</td>
									<td class="px-3 py-2 text-right font-mono text-xs text-gray-900">{formatKg(grandTotal.opening)}</td>
									<td class="px-3 py-2 text-right font-mono text-xs text-gray-900">{grandTotal.deliveries > 0 ? `+${formatKg(grandTotal.deliveries)}` : '—'}</td>
									<td class="px-3 py-2 text-right font-mono text-xs text-gray-900">{formatKg(grandTotal.consumed)}</td>
									<td class="px-3 py-2 text-right font-mono text-xs text-status-red">{grandTotal.waste > 0 ? formatKg(grandTotal.waste) : '—'}</td>
									<td class="px-3 py-2 text-right font-mono text-xs text-gray-900">{formatKg(grandTotal.closing)}</td>
									<td colspan="3"></td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

		{:else if activeTab === 'transfers'}
			<div class="flex flex-col gap-3">
				<MeatFlowBar rows={report.rows} {period} />

				<!-- Transfer Log Table -->
				<div class="overflow-x-auto overflow-hidden rounded-xl border border-border bg-white">
					<div class="border-b border-border bg-gray-50 px-4 py-2.5">
						<h3 class="text-xs font-bold uppercase tracking-wide text-gray-500">Transfer Log</h3>
					</div>
					<div class="max-h-[calc(100vh-420px)] overflow-y-auto">
						{#if transferLog.length > 0}
							<table class="min-w-[550px] w-full text-sm">
								<thead class="sticky top-0 z-10">
									<tr class="border-b border-border bg-gray-50">
										<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
										<th class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Direction</th>
										<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">From</th>
										<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">To</th>
										<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
										<th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qty</th>
										<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">By</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each transferLog as entry, i (entry.time + entry.direction + entry.item + i)}
										<tr class="hover:bg-gray-50">
											<td class="px-3 py-2 font-mono text-xs text-gray-500">{format(new Date(entry.time), 'h:mm a')}</td>
											<td class="px-3 py-2 text-center">
												{#if entry.direction === 'IN'}
													<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
														<ArrowDownLeft class="h-3 w-3" />
														IN
													</span>
												{:else}
													<span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
														<ArrowUpRight class="h-3 w-3" />
														OUT
													</span>
												{/if}
											</td>
											<td class="px-3 py-2 text-xs text-gray-700">{entry.from}</td>
											<td class="px-3 py-2 text-xs text-gray-700">{entry.to}</td>
											<td class="px-3 py-2 text-xs font-medium text-gray-900">{entry.item}</td>
											<td class="px-3 py-2 text-right font-mono text-xs font-semibold text-gray-900">{formatKg(entry.qty)}</td>
											<td class="px-3 py-2 text-xs text-gray-500">{entry.by}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{:else}
							<div class="px-4 py-8 text-center text-sm text-gray-400">
								No transfers recorded for this period.
							</div>
						{/if}
					</div>
				</div>

				{#if locations.length > 0}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
						{#each locations as loc (loc.id)}
							<LocationMeatCard locationId={loc.id} locationLabel={loc.label} rows={loc.rows} />
						{/each}
					</div>
				{/if}
			</div>

		{:else}
			<MeatOntologyGraph rows={report.rows} />
		{/if}
	{/snippet}
</ReportShell>
