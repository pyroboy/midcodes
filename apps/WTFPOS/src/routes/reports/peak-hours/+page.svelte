<script lang="ts">
	import { cn } from '$lib/utils';
	import { orders as allOrders } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { inPeriod } from '$lib/stores/reports.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';

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
	const totalPax = $derived(hourly.pax.reduce((a: number, b: number) => a + b, 0));
	const peakHourIdx = $derived(hourly.pax.indexOf(Math.max(...hourly.pax)));

	const hourlyChart = $derived(
		HOURS.map((label, i) => ({
			label,
			primary: hourly.pax[i],
			highlight: i === peakHourIdx && hourly.pax[i] > 0,
		}))
	);

	function intensity(value: number): string {
		const pct = value / maxPax;
		if (pct >= 0.8) return 'bg-status-red text-white font-bold';
		if (pct >= 0.6) return 'bg-orange-400 text-white font-semibold';
		if (pct >= 0.4) return 'bg-status-yellow text-gray-900 font-medium';
		if (pct >= 0.2) return 'bg-yellow-200 text-gray-700';
		return 'bg-gray-100 text-gray-500';
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
			]}
			showLive={period === 'today'}
		/>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
			<KpiCard label="Total Guest Covers" value={totalPax.toLocaleString()} />
			<KpiCard
				label="Peak Hour"
				value={maxPax > 0 ? `${HOURS[peakHourIdx]} (${maxPax} pax)` : '—'}
				variant="danger"
			/>
			<KpiCard
				label="Avg Table Duration"
				value={hourly.avgDurationMin > 0 ? `${hourly.avgDurationMin} min` : '—'}
			/>
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Guest Covers by Hour</p>
			<ReportBarChart
				data={hourlyChart}
				yUnit=""
				height={200}
				showSecondary={false}
				primaryColor="#EA580C"
				formatValue={(v) => `${v} pax`}
			/>
		</div>
	{/snippet}

	{#snippet content()}
		<!-- Heat map -->
		<div class="mb-5 rounded-xl border border-border bg-white p-5">
			<h2 class="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">Guest Cover Heat Map</h2>
			<div class="overflow-x-auto">
			<div class="grid gap-2 min-w-[650px]" style="grid-template-columns: repeat({HOURS.length}, 1fr);">
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
		<div class="overflow-x-auto rounded-xl border border-border bg-white">
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
	{/snippet}
</ReportShell>
