<script lang="ts">
	import { cn } from '$lib/utils';

	// Operating hours 10:00 AM to 11:00 PM (13 hours)
	const hours = ['10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm'];

	// Pax per hour (mock heatmap data)
	const paxPerHour = [4, 6, 14, 18, 12, 8, 6, 10, 22, 28, 24, 16, 8];
	const ordersPerHour = [2, 3, 6, 8, 5, 4, 3, 5, 10, 12, 11, 7, 4];

	const maxPax = Math.max(...paxPerHour);

	// Cell intensity
	function intensity(value: number): string {
		const pct = value / maxPax;
		if (pct >= 0.8) return 'bg-status-red text-white font-bold';
		if (pct >= 0.6) return 'bg-orange-400 text-white font-semibold';
		if (pct >= 0.4) return 'bg-status-yellow text-gray-900 font-medium';
		if (pct >= 0.2) return 'bg-yellow-200 text-gray-700';
		return 'bg-gray-100 text-gray-500';
	}

	// Summary stats
	const totalPax = paxPerHour.reduce((a, b) => a + b, 0);
	const peakHourIdx = paxPerHour.indexOf(maxPax);
	const avgOccupancy = 72; // minutes mock
	const avgResetTime = 8;  // minutes mock
</script>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-4 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Guest Covers</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{totalPax}</p>
	</div>
	<div class="rounded-xl border border-status-red/20 bg-status-red-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-red">Peak Hour</p>
		<p class="mt-1 text-2xl font-bold text-status-red">{hours[peakHourIdx]} ({maxPax} pax)</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Avg Table Duration</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{avgOccupancy} min</p>
	</div>
	<div class="rounded-xl border border-status-yellow/30 bg-status-yellow-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-yellow">Avg Reset Time</p>
		<p class="mt-1 text-2xl font-bold text-status-yellow">{avgResetTime} min</p>
	</div>
</div>

<!-- Heat map -->
<div class="rounded-xl border border-border bg-white p-5 mb-5">
	<h2 class="mb-4 font-bold text-gray-900">Guest Cover Heat Map</h2>
	<div class="grid gap-2" style="grid-template-columns: repeat({hours.length}, 1fr);">
		{#each hours as hour, i}
			<div class="text-center">
				<p class="mb-1 text-xs font-medium text-gray-400">{hour}</p>
				<div class={cn('flex h-16 items-center justify-center rounded-lg text-sm', intensity(paxPerHour[i]))}>
					{paxPerHour[i]}
				</div>
				<p class="mt-1 text-[10px] text-gray-400">{ordersPerHour[i]} orders</p>
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
			{#each hours as hour, i}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-3 font-medium text-gray-900">{hour}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-700">{paxPerHour[i]}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{ordersPerHour[i]}</td>
					<td class="px-4 py-3">
						<div class="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-gray-100">
							<div class={cn('h-full rounded-full', paxPerHour[i] / maxPax >= 0.8 ? 'bg-status-red' : paxPerHour[i] / maxPax >= 0.5 ? 'bg-status-yellow' : 'bg-status-green')}
								style="width: {(paxPerHour[i] / maxPax * 100)}%">
							</div>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
