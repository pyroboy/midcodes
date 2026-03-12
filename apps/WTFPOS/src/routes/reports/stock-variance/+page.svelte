<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import {
		stockItems,
		getPeriodVariance,
		stockVarianceComparison,
		type StockItem,
		type VariancePeriod
	} from '$lib/stores/stock.svelte';
	import { cn } from '$lib/utils';
	import { TrendingDown, TrendingUp, Minus, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import VarianceChart from '$lib/components/stock/VarianceChart.svelte';
	import type { VariancePoint } from '$lib/components/stock/VarianceChart.svelte';

	let selectedPeriod = $state<VariancePeriod>('today');
	let selectedCategory = $state<string>('all');
	let collapsedGroups = $state<Set<string>>(new Set());

	const PERIOD_LABELS: Record<VariancePeriod, string> = {
		today: 'Today',
		week:  'This Week',
		month: 'This Month',
	};

	const CATEGORY_ORDER = ['Meats', 'Sides', 'Pantry', 'Drinks', 'Dishes'];

	interface VarianceRow {
		item: StockItem;
		delivered: number;
		sold: number;
		waste: number;
		expected: number;
		counted: number | null;
		drift: number | null;
		driftPct: number | null;
	}

	const rows = $derived.by(() => {
		const locItems = session.locationId === 'all'
			? stockItems.value.filter(s => s.locationId !== 'wh-tag')
			: stockItems.value.filter(s => s.locationId === session.locationId);

		return locItems.map((item): VarianceRow => {
			const v = getPeriodVariance(item.id, selectedPeriod);
			return { item, ...v };
		}).sort((a, b) => {
			if (a.drift === null && b.drift === null) return 0;
			if (a.drift === null) return 1;
			if (b.drift === null) return -1;
			return Math.abs(b.drift) - Math.abs(a.drift);
		});
	});

	// [02] Category-filtered rows
	const filteredRows = $derived(
		selectedCategory === 'all' ? rows : rows.filter(r => r.item.category === selectedCategory)
	);

	// [02] Group rows by category
	const groupedRows = $derived.by(() => {
		const groups: { category: string; rows: VarianceRow[] }[] = [];
		for (const cat of CATEGORY_ORDER) {
			const catRows = filteredRows.filter(r => r.item.category === cat);
			if (catRows.length > 0) groups.push({ category: cat, rows: catRows });
		}
		// Catch any categories not in CATEGORY_ORDER
		const known = new Set(CATEGORY_ORDER);
		const others = filteredRows.filter(r => !known.has(r.item.category));
		if (others.length > 0) groups.push({ category: 'Other', rows: others });
		return groups;
	});

	// [06] Category subtotals (only for same-unit categories)
	function categorySubtotal(catRows: VarianceRow[]): { delivered: number; sold: number; waste: number; expected: number; counted: number; drift: number; unit: string } | null {
		if (catRows.length === 0) return null;
		const units = new Set(catRows.map(r => r.item.unit));
		if (units.size > 1) return null; // mixed units — can't sum
		const unit = catRows[0].item.unit;
		const delivered = catRows.reduce((s, r) => s + r.delivered, 0);
		const sold = catRows.reduce((s, r) => s + r.sold, 0);
		const waste = catRows.reduce((s, r) => s + r.waste, 0);
		const expected = catRows.reduce((s, r) => s + r.expected, 0);
		const counted = catRows.filter(r => r.counted !== null).reduce((s, r) => s + (r.counted ?? 0), 0);
		const drift = catRows.filter(r => r.drift !== null).reduce((s, r) => s + (r.drift ?? 0), 0);
		return { delivered, sold, waste, expected, counted, drift, unit };
	}

	const summary = $derived.by(() => {
		const withDrift = rows.filter(r => r.drift !== null);
		const shortage  = withDrift.filter(r => (r.drift ?? 0) > 0);
		const worstDriftPct = withDrift.length > 0
			? Math.max(...withDrift.map(r => Math.abs(r.driftPct ?? 0)))
			: 0;
		return {
			tracked: rows.length,
			counted: withDrift.length,
			shortageCount: shortage.length,
			worstDriftPct,
		};
	});

	// [04] Summary pill — separate totals by unit type
	const shortageSummaryByUnit = $derived.by(() => {
		const shortage = rows.filter(r => r.drift !== null && r.drift > 0);
		const unitMap = new Map<string, number>();
		for (const r of shortage) {
			const unit = r.item.unit;
			unitMap.set(unit, (unitMap.get(unit) ?? 0) + (r.drift ?? 0));
		}
		const parts: string[] = [];
		for (const [unit, total] of unitMap) {
			parts.push(fmtQty(total, unit));
		}
		return parts;
	});

	// [01] Comparison data
	const comparison = $derived(
		selectedPeriod !== 'month' ? stockVarianceComparison(selectedPeriod) : null
	);

	// [07] Last updated timestamp
	const lastUpdated = $derived(
		new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
	);

	// Chart data for VarianceChart
	const chartData = $derived<VariancePoint[]>(
		rows
			.filter(r => r.drift !== null && r.drift !== 0)
			.map(r => ({
				label: r.item.name,
				drift: r.drift!,
				expected: r.expected,
				unit: r.item.unit,
				category: r.item.category,
			}))
	);

	// Available categories for filter
	const availableCategories = $derived(
		CATEGORY_ORDER.filter(cat => rows.some(r => r.item.category === cat))
	);

	function toggleGroup(cat: string) {
		const next = new Set(collapsedGroups);
		if (next.has(cat)) next.delete(cat);
		else next.add(cat);
		collapsedGroups = next;
	}

	function driftClass(drift: number | null): string {
		if (drift === null) return 'text-gray-400';
		if (drift > 0)  return 'text-status-red font-bold';
		if (drift < 0)  return 'text-status-green font-semibold';
		return 'text-gray-500';
	}

	function fmtQty(qty: number, unit: string): string {
		if (unit === 'g' && Math.abs(qty) >= 1000) return `${(qty / 1000).toFixed(2)} kg`;
		if (unit === 'ml' && Math.abs(qty) >= 1000) return `${(qty / 1000).toFixed(2)} L`;
		return `${qty.toFixed(qty % 1 === 0 ? 0 : 2)} ${unit}`;
	}
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={selectedPeriod}
			onPeriodChange={(p) => (selectedPeriod = p as VariancePeriod)}
			options={[
				{ value: 'today', label: 'Today' },
				{ value: 'week',  label: 'This Week' },
				{ value: 'month', label: 'This Month' },
			]}
			showLive={selectedPeriod === 'today'}
		>
			{#snippet actions()}
				<!-- [07] Last updated timestamp -->
				<span class="text-[10px] text-gray-400 font-mono">Updated {lastUpdated}</span>
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
			<KpiCard label="Items Tracked" value={String(summary.tracked)} />
			<KpiCard
				label="Items Counted"
				value={String(summary.counted)}
				sub={summary.counted < summary.tracked ? `${summary.tracked - summary.counted} uncounted` : 'all counted'}
			/>
			<KpiCard
				label="Shortage Items"
				value={String(summary.shortageCount)}
				variant={summary.shortageCount > 0 ? 'danger' : 'success'}
				change={comparison?.shortageCount.changePct ?? null}
				prevValue={comparison ? String(comparison.shortageCount.previous) : null}
				changeLabel="vs prev period"
			/>
			<KpiCard
				label="Worst Drift"
				value={summary.worstDriftPct > 0 ? `${summary.worstDriftPct.toFixed(1)}%` : '0%'}
				variant={summary.worstDriftPct > 10 ? 'danger' : summary.worstDriftPct > 5 ? 'default' : 'success'}
				change={comparison?.worstDrift.changePct ?? null}
				prevValue={comparison ? `${comparison.worstDrift.previous.toFixed(1)}%` : null}
				changeLabel="vs prev period"
			/>
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="rounded-xl border border-border bg-white p-4 flex-1 flex flex-col">
			<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Variance Overview — {PERIOD_LABELS[selectedPeriod]}</p>
			<div class="flex-1 flex flex-col justify-center">
				<VarianceChart data={chartData} />
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<!-- [04] Summary pill with separate totals by unit type -->
		{#if summary.shortageCount > 0}
			<div class="mb-4 flex items-center gap-2 rounded-lg border border-status-red/20 bg-red-50 px-3 py-2" role="status">
				<AlertTriangle class="h-4 w-4 text-status-red shrink-0" />
				<span class="text-sm font-semibold text-status-red">
					{summary.shortageCount} item{summary.shortageCount !== 1 ? 's' : ''} with missing stock
					{#if shortageSummaryByUnit.length > 0}
						— {shortageSummaryByUnit.join(' + ')} unaccounted
					{/if}
				</span>
			</div>
		{:else if summary.counted > 0}
			<div class="mb-4 flex items-center gap-2 rounded-lg border border-status-green/20 bg-green-50 px-3 py-2" role="status">
				<span class="text-sm font-semibold text-status-green">All counted items within expected range</span>
			</div>
		{/if}

		<!-- [02] Category filter bar -->
		{#if availableCategories.length > 1}
			<div class="mb-3 flex items-center gap-1.5 flex-wrap">
				<button
					onclick={() => (selectedCategory = 'all')}
					class={cn(
						'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
						selectedCategory === 'all'
							? 'bg-gray-800 text-white'
							: 'border border-border bg-white text-gray-500 hover:bg-gray-50'
					)}
					style="min-height: unset"
				>All ({rows.length})</button>
				{#each availableCategories as cat}
					{@const count = rows.filter(r => r.item.category === cat).length}
					<button
						onclick={() => (selectedCategory = cat)}
						class={cn(
							'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
							selectedCategory === cat
								? 'bg-gray-800 text-white'
								: 'border border-border bg-white text-gray-500 hover:bg-gray-50'
						)}
						style="min-height: unset"
					>{cat} ({count})</button>
				{/each}
			</div>
		{/if}

		<!-- [02] Grouped table -->
		<div class="overflow-x-auto rounded-xl border border-border bg-white">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-surface-secondary text-left">
						<th class="px-4 py-3 font-semibold text-gray-600">Item</th>
						<th class="px-4 py-3 text-right font-semibold text-gray-600">Delivered</th>
						<th class="px-4 py-3 text-right font-semibold text-gray-600">Sold</th>
						<th class="px-4 py-3 text-right font-semibold text-gray-600">Waste</th>
						<th class="px-4 py-3 text-right font-semibold text-gray-600">Expected</th>
						<th class="px-4 py-3 text-right font-semibold text-gray-600">Counted</th>
						<th class="px-4 py-3 text-right font-semibold text-gray-600">Drift</th>
						<th class="px-4 py-3 text-right font-semibold text-gray-600">Drift %</th>
					</tr>
				</thead>
				<tbody>
					{#each groupedRows as group}
						<!-- [02] Category group header -->
						{@const shortageInGroup = group.rows.filter(r => (r.drift ?? 0) > 0).length}
						<tr class="bg-gray-50 border-b border-border">
							<td colspan="8" class="px-4 py-2">
								<button
									onclick={() => toggleGroup(group.category)}
									class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors w-full text-left"
									style="min-height: unset"
								>
									{#if collapsedGroups.has(group.category)}
										<ChevronRight class="h-3.5 w-3.5" />
									{:else}
										<ChevronDown class="h-3.5 w-3.5" />
									{/if}
									{group.category} — {group.rows.length} item{group.rows.length !== 1 ? 's' : ''}
									{#if shortageInGroup > 0}
										<span class="text-status-red font-semibold normal-case">({shortageInGroup} shortage)</span>
									{/if}
								</button>
							</td>
						</tr>

						{#if !collapsedGroups.has(group.category)}
							{#each group.rows as row (row.item.id)}
								<tr class={cn(
									'border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors',
									row.drift !== null && row.drift > 0 ? 'bg-red-50/30' : ''
								)}>
									<td class="px-4 py-3">
										<div class="flex flex-col">
											<span class="font-medium text-gray-900">{row.item.name}</span>
											<span class="text-xs capitalize text-gray-400">{row.item.category}{row.item.proteinType ? ` · ${row.item.proteinType}` : ''}</span>
										</div>
									</td>
									<td class="px-4 py-3 text-right font-mono text-gray-700">{fmtQty(row.delivered, row.item.unit)}</td>
									<td class="px-4 py-3 text-right font-mono text-gray-700">{fmtQty(row.sold, row.item.unit)}</td>
									<td class="px-4 py-3 text-right font-mono text-gray-700">{fmtQty(row.waste, row.item.unit)}</td>
									<td class="px-4 py-3 text-right font-mono text-gray-700">{fmtQty(row.expected, row.item.unit)}</td>
									<td class="px-4 py-3 text-right font-mono">
										{#if row.counted === null}
											<span class="text-gray-400 italic">—</span>
										{:else}
											<span class="text-gray-700">{fmtQty(row.counted, row.item.unit)}</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-right font-mono {driftClass(row.drift)}">
										{#if row.drift === null}
											<span class="text-gray-400 italic">—</span>
										{:else if row.drift > 0}
											<span class="flex items-center justify-end gap-1">
												<TrendingUp class="h-3.5 w-3.5" />
												+{fmtQty(row.drift, row.item.unit)}
											</span>
										{:else if row.drift < 0}
											<span class="flex items-center justify-end gap-1">
												<TrendingDown class="h-3.5 w-3.5" />
												{fmtQty(row.drift, row.item.unit)}
											</span>
										{:else}
											<span class="flex items-center justify-end gap-1">
												<Minus class="h-3.5 w-3.5" />
												0 {row.item.unit}
											</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-right font-mono {driftClass(row.drift)}">
										{#if row.driftPct === null}
											<span class="text-gray-400 italic">—</span>
										{:else}
											{row.driftPct > 0 ? '+' : ''}{row.driftPct.toFixed(1)}%
										{/if}
									</td>
								</tr>
							{/each}

							<!-- [06] Category subtotal row -->
							{@const sub = categorySubtotal(group.rows)}
							{#if sub}
								<tr class="border-b border-border bg-gray-50/80 font-semibold text-gray-700">
									<td class="px-4 py-2 text-xs uppercase tracking-wide">Total {group.category}</td>
									<td class="px-4 py-2 text-right font-mono text-xs">{fmtQty(sub.delivered, sub.unit)}</td>
									<td class="px-4 py-2 text-right font-mono text-xs">{fmtQty(sub.sold, sub.unit)}</td>
									<td class="px-4 py-2 text-right font-mono text-xs">{fmtQty(sub.waste, sub.unit)}</td>
									<td class="px-4 py-2 text-right font-mono text-xs">{fmtQty(sub.expected, sub.unit)}</td>
									<td class="px-4 py-2 text-right font-mono text-xs">{fmtQty(sub.counted, sub.unit)}</td>
									<td class="px-4 py-2 text-right font-mono text-xs {driftClass(sub.drift)}">
										{#if sub.drift > 0}+{/if}{fmtQty(sub.drift, sub.unit)}
									</td>
									<td class="px-4 py-2"></td>
								</tr>
							{/if}
						{/if}
					{/each}

					{#if filteredRows.length === 0}
						<tr>
							<td colspan="8" class="px-4 py-10 text-center text-gray-400 italic">
								No stock items found for this location.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>

		<p class="mt-4 text-xs text-gray-400">
			Positive drift (red) = inventory expected but not found — investigate spoilage, theft, or logging gaps.
			Negative drift (green) = surplus vs. expected — may indicate uncounted deliveries.
		</p>
	{/snippet}
</ReportShell>
