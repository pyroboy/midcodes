<script lang="ts">
	import { cn } from '$lib/utils';
	import { orders as allOrders } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { inPeriod } from '$lib/stores/reports.svelte';

	type Period = 'today' | 'week';
	let period = $state<Period>('today');

	const HOURS = ['10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm'];

	function computeHourly(p: Period) {
		const pax = new Array(13).fill(0);
		const orderCount = new Array(13).fill(0);
		let totalDurationMs = 0;
		let durationCount = 0;

		for (const o of allOrders.value) {
			if (o.status === 'cancelled') continue;
			if (session.locationId !== 'all' && o.locationId !== session.locationId) continue;
			if (!inPeriod(o.createdAt, p)) continue;

			const idx = new Date(o.createdAt).getHours() - 10;
			if (idx >= 0 && idx < 13) {
				pax[idx] += o.pax ?? 0;
				orderCount[idx]++;
			}
			if (o.status === 'paid' && o.closedAt) {
				totalDurationMs += new Date(o.closedAt).getTime() - new Date(o.createdAt).getTime();
				durationCount++;
			}
		}

		return { pax, orders: orderCount, avgDurationMin: durationCount > 0 ? Math.round(totalDurationMs / durationCount / 60000) : 0 };
	}

	const hourly = $derived(computeHourly(period));
	const maxPax = $derived(Math.max(...hourly.pax, 1));
	const totalPax = $derived(hourly.pax.reduce((a, b) => a + b, 0));
	const peakHourIdx = $derived(hourly.pax.indexOf(Math.max(...hourly.pax)));

	function intensity(value: number): string {
		const pct = value / maxPax;
		if (pct >= 0.8) return 'bg-status-red text-white font-bold';
		if (pct >= 0.6) return 'bg-orange-400 text-white font-semibold';
		if (pct >= 0.4) return 'bg-status-yellow text-gray-900 font-medium';
		if (pct >= 0.2) return 'bg-yellow-200 text-gray-700';
		return 'bg-gray-100 text-gray-500';
	}

	const LOCATION_NAMES: Record<string, string> = {
		tag: 'Alta Citta (Tagbilaran)',
		pgl: 'Alona Beach (Panglao)',
		'wh-tag': 'Tagbilaran Warehouse',
		all: 'All Locations',
	};
	const locationLabel = $derived(LOCATION_NAMES[session.locationId] ?? session.locationId);
	const todayLabel = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<!-- Branch + date sub-header -->
<div class="mb-3 flex items-center gap-2 text-sm text-gray-500">
	<span class="font-semibold text-gray-700">{locationLabel}</span>
	<span>·</span>
	<span>{todayLabel}</span>
</div>

<!-- Period toggle -->
<div class="mb-5 flex items-center gap-2">
	{#each (['today', 'week'] as const) as p}
		<button
			onclick={() => (period = p)}
			class={cn(
				'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
				period === p ? 'bg-accent text-white' : 'border border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{p === 'today' ? 'Today' : 'This Week'}
		</button>
	{/each}
</div>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-3 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Guest Covers</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{totalPax}</p>
	</div>
	<div class="rounded-xl border border-status-red/20 bg-status-red-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-red">Peak Hour</p>
		<p class="mt-1 text-2xl font-bold text-status-red">{maxPax > 0 ? `${HOURS[peakHourIdx]} (${maxPax} pax)` : '—'}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Avg Table Duration</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{hourly.avgDurationMin > 0 ? `${hourly.avgDurationMin} min` : '—'}</p>
	</div>
</div>

<!-- Heat map -->
<div class="rounded-xl border border-border bg-white p-5 mb-5">
	<h2 class="mb-4 font-bold text-gray-900">Guest Cover Heat Map</h2>
	<div class="grid gap-2" style="grid-template-columns: repeat({HOURS.length}, 1fr);">
		{#each HOURS as hour, i}
			<div class="text-center">
				<p class="mb-1 text-xs font-medium text-gray-400">{hour}</p>
				<div class={cn('flex h-16 items-center justify-center rounded-lg text-sm', intensity(hourly.pax[i]))}>
					{hourly.pax[i]}
				</div>
				<p class="mt-1 text-[10px] text-gray-400">{hourly.orders[i]} orders</p>
			</div>
		{/each}
	</div>
	<div class="mt-4 flex items-center gap-4 text-xs text-gray-400">
		<span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-gray-100"></span> Low</span>
		<span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-yellow-200"></span> Moderate</span>
		<span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-status-yellow"></span> Busy</span>
		<span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-orange-400"></span> High</span>
		<span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-status-red"></span> Peak</span>
	</div>
</div>

<!-- Hourly breakdown table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Hour</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Pax</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Orders</th>
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Load</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each HOURS as hour, i}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-3 font-medium text-gray-900">{hour}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-700">{hourly.pax[i]}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{hourly.orders[i]}</td>
					<td class="px-4 py-3">
						<div class="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-gray-100">
							<div class={cn('h-full rounded-full', hourly.pax[i] / maxPax >= 0.8 ? 'bg-status-red' : hourly.pax[i] / maxPax >= 0.5 ? 'bg-status-yellow' : 'bg-status-green')}
								style="width: {hourly.pax[i] / maxPax * 100}%">
							</div>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
