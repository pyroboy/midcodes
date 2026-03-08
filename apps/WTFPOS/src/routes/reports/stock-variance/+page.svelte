<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import {
		stockItems,
		stockCounts,
		deliveries,
		deductions,
		stockEvents,
		getDrift,
		getExpectedStock,
		type StockItem,
		type CountPeriod
	} from '$lib/stores/stock.svelte';
	import { formatPeso } from '$lib/utils';
	import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-svelte';

	type DriftPeriod = CountPeriod;

	let selectedPeriod = $state<DriftPeriod>('am10');

	const PERIOD_LABELS: Record<DriftPeriod, string> = {
		am10: 'AM 10:00',
		pm4:  'PM 4:00',
		pm10: 'PM 10:00'
	};

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
		const locItems = stockItems.value.filter(s => s.locationId === session.locationId);

		return locItems.map((item): VarianceRow => {
			// Total delivered today (all time for now — aligned with getCurrentStock)
			const delivered = deliveries.value
				.filter(d => d.stockItemId === item.id)
				.reduce((s, d) => s + d.qty, 0);

			// Sold = auto-deductions from POS orders
			const sold = deductions.value
				.filter(d => d.stockItemId === item.id)
				.reduce((s, d) => s + d.qty, 0);

			// Waste = stock events with type 'waste'
			const waste = stockEvents.value
				.filter(e => e.stockItemId === item.id && e.type === 'waste')
				.reduce((s, e) => s + e.qty, 0);

			const expected = getExpectedStock(item.id);

			const countDoc = stockCounts.value.find(c => c.stockItemId === item.id);
			const counted = countDoc?.counted[selectedPeriod] ?? null;

			const drift = getDrift(item.id, selectedPeriod);
			const driftPct = drift !== null && item.openingStock + delivered > 0
				? (drift / (item.openingStock + delivered)) * 100
				: null;

			return { item, delivered, sold, waste, expected, counted, drift, driftPct };
		}).sort((a, b) => {
			// Positive drift (missing) first; nulls last
			if (a.drift === null && b.drift === null) return 0;
			if (a.drift === null) return 1;
			if (b.drift === null) return -1;
			return b.drift - a.drift;
		});
	});

	const summary = $derived.by(() => {
		const withDrift = rows.filter(r => r.drift !== null);
		const missing   = withDrift.filter(r => (r.drift ?? 0) > 0);
		const totalMissing = missing.reduce((s, r) => s + (r.drift ?? 0), 0);
		return { itemsWithDrift: withDrift.length, missingCount: missing.length, totalMissing };
	});

	function driftClass(drift: number | null): string {
		if (drift === null) return 'text-gray-400';
		if (drift > 0)  return 'text-status-red font-bold';
		if (drift < 0)  return 'text-status-green font-semibold';
		return 'text-gray-500';
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Header -->
	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-bold text-gray-900">Stock Variance & Drift</h2>
		<p class="text-sm text-gray-500">
			Compares expected on-hand stock vs. physically counted quantities.
			Positive drift = unaccounted inventory.
		</p>
	</div>

	<!-- Controls + Summary -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<!-- Period picker -->
		<div class="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
			{#each Object.entries(PERIOD_LABELS) as [period, label]}
				<button
					onclick={() => selectedPeriod = period as DriftPeriod}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {selectedPeriod === period
						? 'bg-accent text-white'
						: 'text-gray-600 hover:bg-gray-100'}"
				>
					{label}
				</button>
			{/each}
		</div>

		<!-- Summary pill -->
		{#if summary.missingCount > 0}
			<div class="flex items-center gap-2 rounded-lg border border-status-red/20 bg-red-50 px-3 py-2">
				<AlertTriangle class="h-4 w-4 text-status-red" />
				<span class="text-sm font-semibold text-status-red">
					{summary.missingCount} item{summary.missingCount !== 1 ? 's' : ''} with missing stock
					— {summary.totalMissing.toFixed(2)} {rows.find(r => (r.drift ?? 0) > 0)?.item.unit ?? ''} unaccounted
				</span>
			</div>
		{:else if summary.itemsWithDrift > 0}
			<div class="flex items-center gap-2 rounded-lg border border-status-green/20 bg-green-50 px-3 py-2">
				<span class="text-sm font-semibold text-status-green">All counted items within expected range</span>
			</div>
		{/if}
	</div>

	<!-- Table -->
	<div class="overflow-x-auto rounded-xl border border-border bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-surface-secondary text-left">
					<th class="px-4 py-3 font-semibold text-gray-600">Item</th>
					<th class="px-4 py-3 text-right font-semibold text-gray-600">Delivered</th>
					<th class="px-4 py-3 text-right font-semibold text-gray-600">Sold</th>
					<th class="px-4 py-3 text-right font-semibold text-gray-600">Waste</th>
					<th class="px-4 py-3 text-right font-semibold text-gray-600">Expected</th>
					<th class="px-4 py-3 text-right font-semibold text-gray-600">Counted ({PERIOD_LABELS[selectedPeriod]})</th>
					<th class="px-4 py-3 text-right font-semibold text-gray-600">Drift</th>
					<th class="px-4 py-3 text-right font-semibold text-gray-600">Drift %</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.item.id)}
					<tr class="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors {row.drift !== null && row.drift > 0 ? 'bg-red-50/30' : ''}">
						<!-- Item name + category -->
						<td class="px-4 py-3">
							<div class="flex flex-col">
								<span class="font-medium text-gray-900">{row.item.name}</span>
								<span class="text-xs capitalize text-gray-400">{row.item.category}{row.item.proteinType ? ` · ${row.item.proteinType}` : ''}</span>
							</div>
						</td>
						<!-- Delivered -->
						<td class="px-4 py-3 text-right font-mono text-gray-700">
							{row.delivered.toFixed(2)} <span class="text-xs text-gray-400">{row.item.unit}</span>
						</td>
						<!-- Sold -->
						<td class="px-4 py-3 text-right font-mono text-gray-700">
							{row.sold.toFixed(2)} <span class="text-xs text-gray-400">{row.item.unit}</span>
						</td>
						<!-- Waste -->
						<td class="px-4 py-3 text-right font-mono text-gray-700">
							{row.waste.toFixed(2)} <span class="text-xs text-gray-400">{row.item.unit}</span>
						</td>
						<!-- Expected -->
						<td class="px-4 py-3 text-right font-mono text-gray-700">
							{row.expected.toFixed(2)} <span class="text-xs text-gray-400">{row.item.unit}</span>
						</td>
						<!-- Counted -->
						<td class="px-4 py-3 text-right font-mono">
							{#if row.counted === null}
								<span class="text-gray-400 italic">—</span>
							{:else}
								<span class="text-gray-700">{row.counted.toFixed(2)} <span class="text-xs text-gray-400">{row.item.unit}</span></span>
							{/if}
						</td>
						<!-- Drift -->
						<td class="px-4 py-3 text-right font-mono {driftClass(row.drift)}">
							{#if row.drift === null}
								<span class="text-gray-400 italic">—</span>
							{:else if row.drift > 0}
								<span class="flex items-center justify-end gap-1">
									<TrendingUp class="h-3.5 w-3.5" />
									+{row.drift.toFixed(2)} {row.item.unit}
								</span>
							{:else if row.drift < 0}
								<span class="flex items-center justify-end gap-1">
									<TrendingDown class="h-3.5 w-3.5" />
									{row.drift.toFixed(2)} {row.item.unit}
								</span>
							{:else}
								<span class="flex items-center justify-end gap-1">
									<Minus class="h-3.5 w-3.5" />
									0.00 {row.item.unit}
								</span>
							{/if}
						</td>
						<!-- Drift % -->
						<td class="px-4 py-3 text-right font-mono {driftClass(row.drift)}">
							{#if row.driftPct === null}
								<span class="text-gray-400 italic">—</span>
							{:else}
								{row.driftPct > 0 ? '+' : ''}{row.driftPct.toFixed(1)}%
							{/if}
						</td>
					</tr>
				{/each}

				{#if rows.length === 0}
					<tr>
						<td colspan="8" class="px-4 py-10 text-center text-gray-400 italic">
							No stock items found for this location.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<p class="text-xs text-gray-400">
		Positive drift (red) = inventory expected but not found — investigate spoilage, theft, or logging gaps.
		Negative drift (green) = surplus vs. expected — may indicate uncounted deliveries.
	</p>
</div>
