<script lang="ts">
	import { cn, formatKg, formatTime } from '$lib/utils';
	import type { MeatReportRow, MeatReportPeriod } from '$lib/stores/reports.svelte';
	import { getDateBounds, isInRange } from '$lib/stores/reports.svelte';
	import { deliveries, adjustments, wasteEntries } from '$lib/stores/stock.svelte';
	import { LOCATION_SHORT_NAMES } from '$lib/stores/session.svelte';

	interface Props {
		rows: MeatReportRow[];
		period: MeatReportPeriod;
	}

	let { rows, period }: Props = $props();

	// Totals
	const totalOpening = $derived(rows.reduce((s, r) => s + r.opening, 0));
	const totalConsumed = $derived(rows.reduce((s, r) => s + r.consumed, 0));
	const totalWaste = $derived(rows.reduce((s, r) => s + r.wasteAmount, 0));
	const totalRemaining = $derived(rows.reduce((s, r) => s + r.closing, 0));
	const totalAvailable = $derived(totalOpening + rows.reduce((s, r) => s + r.deliveries, 0));
	const remainingPct = $derived(totalAvailable > 0 ? Math.round((totalRemaining / totalAvailable) * 100) : 0);

	// Pax count from report rows (consumed / avg ~350g per head as rough estimate)
	const stockItemIds = $derived(new Set(rows.map(r => r.id)));

	// Period-filtered deliveries split into supplier vs transfer
	const periodBounds = $derived(getDateBounds(period));

	const periodDeliveries = $derived(
		deliveries.value.filter(d =>
			stockItemIds.has(d.stockItemId) &&
			isInRange(d.receivedAt, periodBounds.start, periodBounds.end)
		)
	);

	// Supplier deliveries grouped by supplier name
	const supplierGroups = $derived.by(() => {
		const groups: Record<string, { supplier: string; totalQty: number; items: { name: string; qty: number }[]; time: string }> = {};
		for (const d of periodDeliveries.filter(d => !d.supplier.startsWith('Transfer from'))) {
			if (!groups[d.supplier]) {
				groups[d.supplier] = { supplier: d.supplier, totalQty: 0, items: [], time: d.receivedAt };
			}
			groups[d.supplier].totalQty += d.qty;
			groups[d.supplier].items.push({ name: d.itemName, qty: d.qty });
			// Use earliest time
			if (d.receivedAt < groups[d.supplier].time) groups[d.supplier].time = d.receivedAt;
		}
		return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
	});

	// Transfer deliveries grouped by source location + time proximity (within 5 min = same dispatch)
	interface TransferGroup {
		fromLocId: string;
		fromName: string;
		toLocId: string;
		toName: string;
		totalQty: number;
		items: { name: string; qty: number }[];
		time: string;
		loggedBy: string;
	}

	const transferGroups = $derived.by(() => {
		const transfers = periodDeliveries
			.filter(d => d.supplier.startsWith('Transfer from'))
			.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));

		const groups: TransferGroup[] = [];
		for (const d of transfers) {
			const fromLocId = d.supplier.replace('Transfer from ', '');
			const fromName = LOCATION_SHORT_NAMES[fromLocId] ?? fromLocId;
			// Determine destination from the stock item's location
			const row = rows.find(r => r.id === d.stockItemId);
			const toLocId = row?.locationId ?? '?';
			const toName = LOCATION_SHORT_NAMES[toLocId] ?? toLocId;

			// Try to find loggedBy from matching adjustment (same item type, within 60s)
			const dTime = new Date(d.receivedAt).getTime();
			const matchingAdj = adjustments.value.find(a =>
				a.reason.startsWith(`Transfer to ${toLocId}`) &&
				Math.abs(new Date(a.loggedAt).getTime() - dTime) < 60000 &&
				a.itemName.replace(' (Bulk)', '') === d.itemName
			);
			const loggedBy = matchingAdj?.loggedBy ?? '';

			// Group by fromLoc + toLoc + time proximity (5 min)
			const existing = groups.find(g =>
				g.fromLocId === fromLocId &&
				g.toLocId === toLocId &&
				Math.abs(new Date(g.time).getTime() - dTime) < 300000
			);

			if (existing) {
				existing.totalQty += d.qty;
				existing.items.push({ name: d.itemName, qty: d.qty });
				if (!existing.loggedBy && loggedBy) existing.loggedBy = loggedBy;
			} else {
				groups.push({
					fromLocId, fromName, toLocId, toName,
					totalQty: d.qty,
					items: [{ name: d.itemName, qty: d.qty }],
					time: d.receivedAt,
					loggedBy,
				});
			}
		}
		return groups;
	});

	// Period waste entry count
	const wasteCount = $derived(
		wasteEntries.value.filter(w =>
			stockItemIds.has(w.stockItemId) &&
			isInRange(w.loggedAt, periodBounds.start, periodBounds.end)
		).length
	);
</script>

<div class="rounded-xl border border-border bg-white p-4">
	<div class="flex items-baseline justify-between mb-3">
		<h3 class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Meat Ledger</h3>
		<span class="font-mono text-xs font-semibold text-gray-500">{formatKg(totalAvailable)} total</span>
	</div>

	<!-- INFLOWS -->
	<div class="mb-3">
		<p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-500">Where It Came From</p>
		<div class="space-y-2.5 pl-1">
			<!-- Opening Stock -->
			{#if totalOpening > 0}
				<div class="flex items-start gap-2.5">
					<span class="mt-0.5 text-blue-500 text-sm leading-none">&#9673;</span>
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline justify-between">
							<span class="text-xs font-semibold text-gray-800">Opening Stock</span>
							<span class="font-mono text-xs font-bold text-gray-700">{formatKg(totalOpening)}</span>
						</div>
						<p class="text-[10px] text-gray-400">Start of day carry-over</p>
					</div>
				</div>
			{/if}

			<!-- Supplier Deliveries -->
			{#each supplierGroups as sg (sg.supplier)}
				<div class="flex items-start gap-2.5">
					<span class="mt-0.5 text-emerald-500 text-sm leading-none">&darr;</span>
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline justify-between">
							<span class="text-xs font-semibold text-gray-800">{sg.supplier}</span>
							<span class="font-mono text-xs font-bold text-gray-700">{formatKg(sg.totalQty)}</span>
						</div>
						<p class="text-[10px] text-gray-400">
							Supplier delivery &middot; {formatTime(sg.time)}
						</p>
					</div>
				</div>
			{/each}

			<!-- Transfer Deliveries -->
			{#each transferGroups as tg (tg.fromLocId + tg.toLocId + tg.time)}
				<div class="flex items-start gap-2.5">
					<span class="mt-0.5 text-violet-500 text-sm leading-none">&rArr;</span>
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline justify-between">
							<span class="text-xs font-semibold text-gray-800">{tg.fromName} &rarr; {tg.toName}</span>
							<span class="font-mono text-xs font-bold text-gray-700">{formatKg(tg.totalQty)}</span>
						</div>
						<p class="text-[10px] text-gray-400 truncate">
							{tg.items.map(i => `${i.name} ${formatKg(i.qty)}`).join(' \u00B7 ')}
						</p>
						{#if tg.loggedBy}
							<p class="text-[10px] text-gray-400">
								Dispatched by {tg.loggedBy} &middot; {formatTime(tg.time)}
							</p>
						{:else}
							<p class="text-[10px] text-gray-400">{formatTime(tg.time)}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Divider -->
	<div class="border-t border-border my-3"></div>

	<!-- OUTFLOWS -->
	<div>
		<p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-500">Where It Went</p>
		<div class="space-y-2.5 pl-1">
			<!-- Served -->
			{#if totalConsumed > 0}
				<div class="flex items-start gap-2.5">
					<span class="mt-0.5 text-orange-500 text-sm leading-none">&#9679;</span>
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline justify-between">
							<span class="text-xs font-semibold text-gray-800">Served to tables</span>
							<span class="font-mono text-xs font-bold text-gray-700">{formatKg(totalConsumed)}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Waste -->
			{#if totalWaste > 0}
				<div class="flex items-start gap-2.5">
					<span class="mt-0.5 text-red-400 text-sm leading-none">&times;</span>
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline justify-between">
							<span class="text-xs font-semibold text-gray-800">Waste / Trim{#if wasteCount > 0} ({wasteCount} {wasteCount === 1 ? 'entry' : 'entries'}){/if}</span>
							<span class="font-mono text-xs font-bold text-gray-700">{formatKg(totalWaste)}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Remaining -->
			<div class="flex items-start gap-2.5">
				<span class="mt-0.5 text-gray-400 text-sm leading-none">&#9642;</span>
				<div class="flex-1 min-w-0">
					<div class="flex items-baseline justify-between mb-1">
						<span class="text-xs font-semibold text-gray-800">Remaining On Hand</span>
						<span class="font-mono text-xs font-bold text-gray-700">{formatKg(totalRemaining)}</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
							<div
								class={cn(
									'h-full rounded-full transition-all',
									remainingPct > 50 ? 'bg-emerald-400' : remainingPct > 25 ? 'bg-yellow-400' : 'bg-red-400'
								)}
								style="width: {Math.max(remainingPct, 2)}%"
							></div>
						</div>
						<span class="text-[10px] font-mono font-semibold text-gray-400">{remainingPct}% left</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
