<script lang="ts">
	import { cn } from '$lib/utils';

	type Trend = 'ok' | 'high' | 'low';

	interface VarianceRow {
		date: string;
		cut: string;
		opening: number;
		deliveries: number;
		consumed: number;
		closing: number;
		variance: number;
		trend: Trend;
	}

	const rows: VarianceRow[] = [
		// Mar 3 — Samgyupsal: opening 4200 + delivery 5000 = 9200 available; 9200 - 1350 closing = 7850 consumed
		{ date: 'Mar 3', cut: 'Samgyupsal',        opening: 4200, deliveries: 5000, consumed: 7850, closing: 1350, variance: -9,   trend: 'ok' },
		{ date: 'Mar 3', cut: 'Chadolbaegi',       opening: 3000, deliveries: 0,    consumed: 1800, closing: 1200, variance: -8,   trend: 'ok' },
		{ date: 'Mar 3', cut: 'Galbi',             opening: 2000, deliveries: 0,    consumed: 1580, closing: 420,  variance: -24,  trend: 'high' },
		{ date: 'Mar 3', cut: 'US Beef Belly',     opening: 3000, deliveries: 0,    consumed: 980,  closing: 2020, variance: +15,  trend: 'low' },
		{ date: 'Mar 2', cut: 'Samgyupsal',        opening: 5000, deliveries: 2000, consumed: 2800, closing: 4200, variance: -5,   trend: 'ok' },
		{ date: 'Mar 2', cut: 'Chadolbaegi',       opening: 2500, deliveries: 2000, consumed: 1500, closing: 3000, variance: -3,   trend: 'ok' },
		{ date: 'Mar 2', cut: 'Galbi',             opening: 1500, deliveries: 2000, consumed: 1480, closing: 2020, variance: -21,  trend: 'high' },
		{ date: 'Mar 2', cut: 'US Beef Belly',     opening: 2000, deliveries: 2000, consumed: 1000, closing: 3000, variance: +8,   trend: 'ok' }
	];

	const trendConfig: Record<Trend, { label: string; class: string }> = {
		ok:   { label: 'Normal',       class: 'bg-status-green-light text-status-green border-status-green/20' },
		high: { label: 'High Loss',    class: 'bg-status-red-light text-status-red border-status-red/20' },
		low:  { label: 'Low Turnover', class: 'bg-status-yellow-light text-status-yellow border-status-yellow/30' }
	};

	// Group by date
	const dates = [...new Set(rows.map(r => r.date))];
</script>

<!-- Summary -->
<div class="mb-5 grid grid-cols-4 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Consumed (Today)</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">7,210 g</p>
	</div>
	<div class="rounded-xl border border-status-red/20 bg-status-red-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-red">High Loss Items</p>
		<p class="mt-1 text-2xl font-bold text-status-red">1</p>
	</div>
	<div class="rounded-xl border border-status-yellow/30 bg-status-yellow-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-yellow">Avg Variance</p>
		<p class="mt-1 text-2xl font-bold text-status-yellow">−7.3%</p>
	</div>
	<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-green">Days Tracked</p>
		<p class="mt-1 text-2xl font-bold text-status-green">2</p>
	</div>
</div>

{#each dates as date}
	<div class="mb-6">
		<h2 class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{date}</h2>
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
					{#each rows.filter(r => r.date === date) as row}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">{row.cut}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-500">{row.opening.toLocaleString()}g</td>
							<td class="px-4 py-3 text-right font-mono text-gray-500">
								{row.deliveries > 0 ? `+${row.deliveries.toLocaleString()}g` : '—'}
							</td>
							<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{row.consumed.toLocaleString()}g</td>
							<td class="px-4 py-3 text-right font-mono text-gray-600">{row.closing.toLocaleString()}g</td>
							<td class={cn(
								'px-4 py-3 text-right font-mono font-bold',
								row.variance < -15 ? 'text-status-red' : row.variance > 10 ? 'text-status-yellow' : 'text-status-green'
							)}>
								{row.variance > 0 ? `+${row.variance}` : row.variance}%
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
	</div>
{/each}
