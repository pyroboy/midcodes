<script lang="ts">
	import { cn } from '$lib/utils';
	import { meatVarianceToday } from '$lib/stores/reports.svelte';
	import { session } from '$lib/stores/session.svelte';

	const locationLabel: Record<string, string> = {
		'qc': 'Alta Cita', 'mkti': 'Alona', 'wh-qc': 'Warehouse'
	};

	type Trend = 'ok' | 'high' | 'low';

	const trendConfig: Record<Trend, { label: string; class: string }> = {
		ok:   { label: 'Normal',       class: 'bg-status-green-light text-status-green border-status-green/20' },
		high: { label: 'High Loss',    class: 'bg-status-red-light text-status-red border-status-red/20' },
		low:  { label: 'Low Turnover', class: 'bg-status-yellow-light text-status-yellow border-status-yellow/30' },
	};

	const rows = $derived(meatVarianceToday());
	const totalConsumed  = $derived(rows.reduce((s, r) => s + r.consumed, 0));
	const highLossCount  = $derived(rows.filter(r => r.trend === 'high').length);
	const avgVariance    = $derived(rows.length > 0 ? (rows.reduce((s, r) => s + r.variancePct, 0) / rows.length).toFixed(1) : '0.0');
</script>

<!-- Live badge -->
<div class="mb-4 flex items-center gap-2">
	<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Today — Live</h2>
	<span class="flex items-center gap-1.5 text-xs text-status-green">
		<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
		Updating from POS charges
	</span>
</div>

<!-- Summary -->
<div class="mb-5 grid grid-cols-4 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Consumed (Today)</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{totalConsumed.toLocaleString()} g</p>
	</div>
	<div class="rounded-xl border border-status-red/20 bg-status-red-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-red">High Loss Items</p>
		<p class="mt-1 text-2xl font-bold text-status-red">{highLossCount}</p>
	</div>
	<div class="rounded-xl border border-status-yellow/30 bg-status-yellow-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-yellow">Avg Variance</p>
		<p class="mt-1 text-2xl font-bold text-status-yellow">{parseFloat(avgVariance) >= 0 ? '+' : ''}{avgVariance}%</p>
	</div>
	<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-green">Meat Cuts Tracked</p>
		<p class="mt-1 text-2xl font-bold text-status-green">{rows.length}</p>
	</div>
</div>

<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cut</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Opening</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Deliveries</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Consumed</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Closing</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Variance %</th>
				<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Trend</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each rows as row (row.id)}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-3 font-medium text-gray-900">
						{row.cut}
						{#if session.locationId === 'all' && locationLabel[row.locationId]}
							<span class="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{locationLabel[row.locationId]}</span>
						{/if}
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{row.opening.toLocaleString()}g</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">
						{row.deliveries > 0 ? `+${row.deliveries.toLocaleString()}g` : '—'}
					</td>
					<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{row.consumed.toLocaleString()}g</td>
					<td class="px-4 py-3 text-right font-mono text-gray-600">{row.closing.toLocaleString()}g</td>
					<td class={cn(
						'px-4 py-3 text-right font-mono font-bold',
						row.variancePct < -15 ? 'text-status-red' : row.variancePct > 10 ? 'text-status-yellow' : 'text-status-green'
					)}>
						{row.variancePct > 0 ? `+${row.variancePct}` : row.variancePct}%
					</td>
					<td class="px-4 py-3 text-center">
						<span class={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', trendConfig[row.trend].class)}>
							{trendConfig[row.trend].label}
						</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
