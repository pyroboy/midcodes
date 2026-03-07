<script lang="ts">
	import { cn, formatKg, formatTime } from '$lib/utils';
	import type { MeatReportRow } from '$lib/stores/reports.svelte';
	import { deliveries, adjustments } from '$lib/stores/stock.svelte';
	import { LOCATION_SHORT_NAMES } from '$lib/stores/session.svelte';
	import { PROTEIN_ORDER } from '$lib/stores/stock.constants';
	import { proteinConfig } from '$lib/stores/stock.svelte';

	interface Props {
		locationId: string;
		locationLabel: string;
		rows: MeatReportRow[];
	}

	let { locationId, locationLabel, rows }: Props = $props();

	const totalStock = $derived(rows.reduce((s, r) => s + r.closing, 0));
	const totalConsumed = $derived(rows.reduce((s, r) => s + r.consumed, 0));
	const totalAvailable = $derived(rows.reduce((s, r) => s + r.opening + r.deliveries, 0));
	const remainingPct = $derived(totalAvailable > 0 ? Math.round((totalStock / totalAvailable) * 100) : 0);

	const statusCounts = $derived({
		ok: rows.filter(r => r.stockStatus === 'ok').length,
		low: rows.filter(r => r.stockStatus === 'low').length,
		critical: rows.filter(r => r.stockStatus === 'critical').length,
	});

	// Protein breakdown as text
	const proteinBreakdown = $derived(
		PROTEIN_ORDER
			.filter(p => p !== 'other')
			.map(p => {
				const pRows = rows.filter(r => r.proteinType === p);
				const total = pRows.reduce((s, r) => s + r.closing, 0);
				return { label: proteinConfig[p].label, total };
			})
			.filter(p => p.total > 0)
	);

	// Build movements timeline
	interface Movement {
		id: string;
		type: 'in' | 'out';
		time: string;
		label: string;   // "IN from Warehouse" or "OUT to Alona Beach"
		items: { name: string; qty: number }[];
		loggedBy: string;
		batchNo?: string;
	}

	const stockItemIds = $derived(new Set(rows.map(r => r.id)));

	const movements = $derived.by(() => {
		const result: Movement[] = [];

		// Inbound: deliveries to this location's stock items
		// Group by supplier + time proximity (5 min)
		const inbound = deliveries.value
			.filter(d => stockItemIds.has(d.stockItemId))
			.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

		const inGroups: Movement[] = [];
		for (const d of inbound) {
			const isTransfer = d.supplier.startsWith('Transfer from');
			const fromLocId = isTransfer ? d.supplier.replace('Transfer from ', '') : '';
			const fromName = isTransfer ? (LOCATION_SHORT_NAMES[fromLocId] ?? fromLocId) : d.supplier;
			const label = isTransfer ? `IN from ${fromName}` : `IN from ${fromName}`;
			const dTime = new Date(d.receivedAt).getTime();

			// Cross-reference for loggedBy
			let loggedBy = '';
			if (isTransfer) {
				const matchingAdj = adjustments.value.find(a =>
					a.reason.startsWith(`Transfer to ${locationId}`) &&
					Math.abs(new Date(a.loggedAt).getTime() - dTime) < 60000 &&
					a.itemName.replace(' (Bulk)', '') === d.itemName
				);
				loggedBy = matchingAdj?.loggedBy ?? '';
			}

			// Group by same source + time proximity
			const existing = inGroups.find(g =>
				g.label === label &&
				Math.abs(new Date(g.time).getTime() - dTime) < 300000
			);

			if (existing) {
				existing.items.push({ name: d.itemName, qty: d.qty });
				if (!existing.loggedBy && loggedBy) existing.loggedBy = loggedBy;
				if (!existing.batchNo && d.batchNo) existing.batchNo = d.batchNo;
			} else {
				inGroups.push({
					id: d.id,
					type: 'in',
					time: d.receivedAt,
					label,
					items: [{ name: d.itemName, qty: d.qty }],
					loggedBy,
					batchNo: d.batchNo,
				});
			}
		}
		result.push(...inGroups);

		// Outbound: adjustments from this location's stock items (Transfer to ...)
		const outbound = adjustments.value
			.filter(a => stockItemIds.has(a.stockItemId) && a.reason.startsWith('Transfer to'))
			.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

		const outGroups: Movement[] = [];
		for (const a of outbound) {
			const toLocId = a.reason.replace(/Transfer to (\S+).*/, '$1');
			const toName = LOCATION_SHORT_NAMES[toLocId] ?? toLocId;
			const label = `OUT to ${toName}`;
			const aTime = new Date(a.loggedAt).getTime();

			const existing = outGroups.find(g =>
				g.label === label &&
				Math.abs(new Date(g.time).getTime() - aTime) < 300000
			);

			if (existing) {
				existing.items.push({ name: a.itemName, qty: a.qty });
			} else {
				outGroups.push({
					id: a.id,
					type: 'out',
					time: a.loggedAt,
					label,
					items: [{ name: a.itemName, qty: a.qty }],
					loggedBy: a.loggedBy,
				});
			}
		}
		result.push(...outGroups);

		// Sort by time descending (most recent first)
		return result.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
	});
</script>

<div class="rounded-xl border border-border bg-white p-3">
	<!-- Header -->
	<div class="mb-2 flex items-center justify-between">
		<h3 class="text-xs font-bold text-gray-900">{locationLabel}</h3>
		<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{locationId.toUpperCase()}</span>
	</div>

	<!-- Status dots -->
	<div class="flex items-center gap-1.5 mb-2 text-[10px]">
		{#if statusCounts.ok > 0}
			<span class="inline-block h-1.5 w-1.5 rounded-full bg-status-green"></span>
			<span class="text-gray-500">{statusCounts.ok} ok</span>
		{/if}
		{#if statusCounts.low > 0}
			<span class="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-status-yellow"></span>
			<span class="text-status-yellow">{statusCounts.low} low</span>
		{/if}
		{#if statusCounts.critical > 0}
			<span class="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-status-red"></span>
			<span class="text-status-red">{statusCounts.critical} critical</span>
		{/if}
	</div>

	<!-- Stats bar -->
	<div class="mb-1.5 flex items-baseline gap-4 text-[10px]">
		<div>
			<span class="text-gray-400">On Hand</span>
			<span class="ml-1 font-mono font-semibold text-gray-900">{formatKg(totalStock)}</span>
		</div>
		<div>
			<span class="text-gray-400">Consumed</span>
			<span class="ml-1 font-mono font-semibold text-gray-900">{formatKg(totalConsumed)}</span>
		</div>
	</div>

	<!-- Remaining bar -->
	<div class="mb-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
		<div
			class={cn(
				'h-full rounded-full',
				remainingPct > 50 ? 'bg-emerald-400' : remainingPct > 25 ? 'bg-yellow-400' : 'bg-red-400'
			)}
			style="width: {Math.max(remainingPct, 2)}%"
		></div>
	</div>

	<!-- Protein breakdown -->
	{#if proteinBreakdown.length > 0}
		<p class="text-[10px] text-gray-400 mb-3">
			{proteinBreakdown.map(p => `${p.label} ${formatKg(p.total)}`).join(' \u00B7 ')}
		</p>
	{/if}

	<!-- Movements Timeline -->
	{#if movements.length > 0}
		<div class="border-t border-border pt-2">
			<p class="mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Today's Movements</p>
			<div class="space-y-2">
				{#each movements as mv (mv.id)}
					<div class="flex gap-2">
						<div class="flex flex-col items-center">
							<span class={cn(
								'text-[10px] font-bold leading-none',
								mv.type === 'in' ? 'text-emerald-500' : 'text-red-400'
							)}>
								{mv.type === 'in' ? '\u2193' : '\u2191'}
							</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-baseline gap-1.5">
								<span class="text-[10px] font-mono text-gray-400">{formatTime(mv.time)}</span>
								<span class={cn(
									'text-[10px] font-semibold',
									mv.type === 'in' ? 'text-emerald-600' : 'text-red-500'
								)}>{mv.label}</span>
							</div>
							<div class="mt-0.5 rounded-md border border-gray-100 bg-gray-50/50 px-2 py-1">
								{#each mv.items as item (item.name)}
									<div class="flex justify-between text-[10px]">
										<span class="text-gray-600">{item.name}</span>
										<span class="font-mono font-semibold text-gray-700">{formatKg(item.qty)}</span>
									</div>
								{/each}
								{#if mv.loggedBy}
									<p class="text-[9px] text-gray-400 mt-0.5">Dispatched by {mv.loggedBy}</p>
								{/if}
								{#if mv.batchNo}
									<p class="text-[9px] text-gray-400">Batch #{mv.batchNo}</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
