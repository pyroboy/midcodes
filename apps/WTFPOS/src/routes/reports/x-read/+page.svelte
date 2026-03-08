<script lang="ts">
	import { formatPeso } from '$lib/utils';
	import { salesSummary, eodSummary, generateXRead, xReadHistory } from '$lib/stores/reports.svelte';
	import { orders } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Auto-generate X-Read when arriving from quick action
	$effect(() => {
		if (page.url.searchParams.get('action') === 'open') {
			goto('/reports/x-read', { replaceState: true, noScroll: true });
		}
	});

	const summary = $derived(salesSummary());
	const eod = $derived(eodSummary());
	const liveOrders = $derived(
		(session.locationId === 'all' ? orders.value : orders.value.filter(o => o.locationId === session.locationId))
	);
	const openOrders = $derived(liveOrders.filter(o => o.status === 'open' || o.status === 'pending_payment').length);
	const paidOrders = $derived(liveOrders.filter(o => o.status === 'paid').length);
	const voidedOrders = $derived(liveOrders.filter(o => o.status === 'cancelled').length);

	let justGenerated = $state(false);

	function handleGenerate() {
		generateXRead();
		justGenerated = true;
		setTimeout(() => justGenerated = false, 2500);
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="mb-4 flex items-center justify-between">
	<div class="flex items-center gap-2">
		<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">{summary.date}</h2>
		<span class="flex items-center gap-1.5 text-xs text-status-green">
			<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
			Live — shift still open
		</span>
	</div>
	<button
		onclick={handleGenerate}
		class="btn-primary gap-2 text-sm"
		style="min-height: 40px"
	>
		{justGenerated ? '✓ Generated!' : '📋 Generate X-Read'}
	</button>
</div>

<!-- Live Stats Grid -->
<div class="grid grid-cols-4 gap-4 mb-6">
	<div class="rounded-xl border border-border bg-white p-4 text-center">
		<p class="text-xs font-medium text-gray-400">Gross Sales</p>
		<p class="mt-1 font-mono text-xl font-bold text-gray-900">{formatPeso(summary.grossSales)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4 text-center">
		<p class="text-xs font-medium text-gray-400">Net Sales</p>
		<p class="mt-1 font-mono text-xl font-bold text-status-green">{formatPeso(summary.netSales)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4 text-center">
		<p class="text-xs font-medium text-gray-400">Total Pax</p>
		<p class="mt-1 font-mono text-xl font-bold text-gray-900">{summary.totalPax}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4 text-center">
		<p class="text-xs font-medium text-gray-400">Avg Ticket</p>
		<p class="mt-1 font-mono text-xl font-bold text-gray-900">{formatPeso(summary.avgTicket)}</p>
	</div>
</div>

<div class="grid grid-cols-[1fr_380px] gap-6">
	<!-- Left: Payment breakdown + order stats -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<h3 class="mb-4 font-bold text-gray-900">Payment Breakdown (Live)</h3>
			<div class="flex gap-4">
				{#each [
					{ label: 'Cash', amount: eod.cash, icon: '💵' },
					{ label: 'Card', amount: eod.card, icon: '💳' },
					{ label: 'GCash', amount: eod.gcash, icon: '📱' },
				] as p}
					<div class="flex-1 rounded-lg border border-border bg-gray-50 p-4 text-center">
						<div class="mb-1 text-2xl">{p.icon}</div>
						<p class="text-xs font-medium text-gray-400">{p.label}</p>
						<p class="mt-0.5 font-mono text-lg font-bold text-gray-900">{formatPeso(p.amount)}</p>
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-xl border border-border bg-white p-5">
			<h3 class="mb-4 font-bold text-gray-900">Order Status</h3>
			<div class="grid grid-cols-3 gap-4">
				<div class="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
					<p class="text-xs font-medium text-blue-500">Open</p>
					<p class="font-mono text-2xl font-bold text-blue-700">{openOrders}</p>
				</div>
				<div class="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
					<p class="text-xs font-medium text-emerald-500">Paid</p>
					<p class="font-mono text-2xl font-bold text-emerald-700">{paidOrders}</p>
				</div>
				<div class="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
					<p class="text-xs font-medium text-red-500">Voided</p>
					<p class="font-mono text-2xl font-bold text-red-700">{voidedOrders}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Right: X-Read History -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<h3 class="mb-3 font-bold text-gray-900">X-Read History</h3>
			{#if xReadHistory.value.length === 0}
				<div class="text-center py-6">
					<div class="text-3xl mb-2">📋</div>
					<p class="text-sm text-gray-400">No X-Reads generated yet this shift.</p>
					<p class="text-xs text-gray-300 mt-1">Click "Generate X-Read" to snapshot current totals.</p>
				</div>
			{:else}
				<div class="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
					{#each xReadHistory.value as xr, idx (xr.id)}
						<div class="rounded-lg border border-border bg-gray-50 p-3">
							<div class="flex items-center justify-between mb-2">
								<span class="text-xs font-bold text-gray-700">X-Read #{xReadHistory.value.length - idx}</span>
								<span class="text-xs text-gray-400">{formatTime(xr.timestamp ?? '')} · {xr.generatedBy}</span>
							</div>
							<div class="grid grid-cols-2 gap-1.5 text-xs">
								<div class="flex justify-between">
									<span class="text-gray-500">Gross</span>
									<span class="font-mono font-semibold">{formatPeso(xr.grossSales)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Net</span>
									<span class="font-mono font-semibold text-status-green">{formatPeso(xr.netSales)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Cash</span>
									<span class="font-mono">{formatPeso(xr.cash)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">GCash</span>
									<span class="font-mono">{formatPeso(xr.gcash)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Pax</span>
									<span class="font-mono">{xr.totalPax}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Voids</span>
									<span class="font-mono {(xr.voidCount ?? 0) > 0 ? 'text-status-red font-semibold' : ''}">{xr.voidCount}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
			<p class="text-xs text-gray-400">X-Reads do NOT close the shift. Use End of Day report to finalize.</p>
		</div>
	</div>
</div>
