<script lang="ts">
	import { cn } from '$lib/utils';
	import { meatReport, PERIOD_LABELS, type MeatReportPeriod, getDateBounds } from '$lib/stores/reports.svelte';
	import { PROTEIN_ORDER } from '$lib/stores/stock.constants';
	import { session, LOCATION_SHORT_NAMES } from '$lib/stores/session.svelte';
	import { deliveries, adjustments } from '$lib/stores/stock.svelte';
	import MeatSalesCard from '$lib/components/reports/MeatSalesCard.svelte';
	import LocationMeatCard from '$lib/components/reports/LocationMeatCard.svelte';
	import MeatFlowBar from '$lib/components/reports/MeatFlowBar.svelte';
	import MeatOntologyGraph from '$lib/components/reports/MeatOntologyGraph.svelte';
	import VarianceBar from '$lib/components/stock/VarianceBar.svelte';
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

	// Transfer log: merge delivery transfers (IN) and adjustment transfers (OUT)
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

		// Inbound transfers (deliveries with "Transfer from ...")
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

		// Outbound transfers (adjustments with "Transfer to ...")
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
</script>

<!-- Header + Period + Tabs -->
<div class="px-6 pt-4 pb-3 flex flex-col gap-3">
	<!-- Title row -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Meat Report</h2>
			{#if period === 'today'}
				<span class="flex items-center gap-1.5 text-xs text-status-green">
					<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
					Live
				</span>
			{/if}
		</div>
		<div class="flex rounded-lg border border-border bg-white p-0.5">
			{#each (['today', 'yesterday', 'week'] as const) as p (p)}
				<button
					class={cn(
						'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
						period === p
							? 'bg-accent text-white shadow-sm'
							: 'text-gray-500 hover:text-gray-700'
					)}
					onclick={() => { period = p; }}
				>
					{PERIOD_LABELS[p]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tab bar -->
	<div class="flex rounded-lg border border-border bg-white p-0.5 self-start">
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
</div>

<!-- Tab Content -->
<div class="flex-1 overflow-auto px-6 pb-6">
	{#if activeTab === 'consumption'}
		<!-- Consumption: MeatSalesCard + Variance Table -->
		<div class="flex flex-col gap-3">
			<MeatSalesCard {report} {period} />

			<div class="overflow-hidden rounded-xl border border-border bg-white">
				<div class="max-h-[calc(100vh-380px)] overflow-y-auto">
					<table class="w-full text-sm">
						<thead class="sticky top-0 z-10">
							<tr class="border-b border-border bg-gray-50">
								<th class="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Cut</th>
								<th class="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Open</th>
								<th class="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">In</th>
								<th class="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Used</th>
								<th class="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Waste</th>
								<th class="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Close</th>
								<th class="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Var%</th>
								<th class="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Drift</th>
								<th class="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each groupedRows as group (group.protein)}
								{@const colors = proteinGroupColors[group.protein] ?? proteinGroupColors.other}
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
										<td class="px-3 py-2 text-right font-mono text-xs text-gray-500">{row.opening.toLocaleString()}g</td>
										<td class="px-3 py-2 text-right font-mono text-xs text-gray-500">
											{row.deliveries > 0 ? `+${row.deliveries.toLocaleString()}g` : '—'}
										</td>
										<td class="px-3 py-2 text-right font-mono text-xs font-semibold text-gray-900">{row.consumed.toLocaleString()}g</td>
										<td class="px-3 py-2 text-right font-mono text-xs text-status-red">
											{row.wasteAmount > 0 ? `${row.wasteAmount.toLocaleString()}g` : '—'}
										</td>
										<td class="px-3 py-2 text-right font-mono text-xs text-gray-600">{row.closing.toLocaleString()}g</td>
										<td class={cn(
											'px-3 py-2 text-right font-mono text-xs font-bold',
											row.variancePct < -15 ? 'text-status-red' : row.variancePct > 10 ? 'text-status-yellow' : 'text-status-green'
										)}>
											{row.variancePct > 0 ? `+${row.variancePct}` : row.variancePct}%
										</td>
										<td class="px-3 py-2">
											<VarianceBar expected={row.opening + row.deliveries} drift={row.variancePct} />
										</td>
										<td class="px-3 py-2 text-center">
											<span class={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', trendConfig[row.trend].class)}>
												{trendConfig[row.trend].label}
											</span>
										</td>
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

	{:else if activeTab === 'transfers'}
		<!-- Transfers: MeatFlowBar + Transfer Log Table + LocationMeatCards -->
		<div class="flex flex-col gap-3">
			<MeatFlowBar rows={report.rows} {period} />

			<!-- Transfer Log Table -->
			<div class="overflow-hidden rounded-xl border border-border bg-white">
				<div class="border-b border-border bg-gray-50 px-4 py-2.5">
					<h3 class="text-xs font-bold uppercase tracking-wide text-gray-500">Transfer Log</h3>
				</div>
				<div class="max-h-[calc(100vh-420px)] overflow-y-auto">
					{#if transferLog.length > 0}
						<table class="w-full text-sm">
							<thead class="sticky top-0 z-10">
								<tr class="border-b border-border bg-gray-50">
									<th class="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Time</th>
									<th class="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">Direction</th>
									<th class="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">From</th>
									<th class="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">To</th>
									<th class="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Item</th>
									<th class="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Qty</th>
									<th class="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">By</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each transferLog as entry (entry.time + entry.direction + entry.item)}
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
										<td class="px-3 py-2 text-right font-mono text-xs font-semibold text-gray-900">{entry.qty.toLocaleString()}{entry.unit}</td>
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

	{:else if activeTab === 'conversion'}
		<!-- Conversion: MeatOntologyGraph full width -->
		<div class="flex flex-col gap-3">
			<MeatOntologyGraph rows={report.rows} />
		</div>
	{/if}
</div>
