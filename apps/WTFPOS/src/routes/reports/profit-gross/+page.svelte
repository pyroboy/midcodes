<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	interface ProfitRow {
		label: string;
		amount: number;
		style?: string;
		indent?: boolean;
	}

	const data: Record<Period, { revenue: number; cogs: number; cogsBreakdown: { label: string; amount: number }[] }> = {
		today: {
			revenue: 33748,
			cogs: 14580,
			cogsBreakdown: [
				{ label: 'Samgyupsal',    amount: 4980 },
				{ label: 'Chadolbaegi',   amount: 3180 },
				{ label: 'US Beef Belly', amount: 3420 },
				{ label: 'Galbi',         amount: 1800 },
				{ label: 'Sides & Produce', amount: 1200 }
			]
		},
		week: {
			revenue: 175020,
			cogs: 72400,
			cogsBreakdown: [
				{ label: 'Samgyupsal',    amount: 24800 },
				{ label: 'Chadolbaegi',   amount: 16200 },
				{ label: 'US Beef Belly', amount: 15400 },
				{ label: 'Galbi',         amount: 9200 },
				{ label: 'Sides & Produce', amount: 6800 }
			]
		},
		month: {
			revenue: 722000,
			cogs: 298000,
			cogsBreakdown: [
				{ label: 'Samgyupsal',    amount: 102000 },
				{ label: 'Chadolbaegi',   amount: 68400 },
				{ label: 'US Beef Belly', amount: 62000 },
				{ label: 'Galbi',         amount: 38200 },
				{ label: 'Sides & Produce', amount: 27400 }
			]
		}
	};

	const current = $derived(data[period]);
	const grossProfit = $derived(current.revenue - current.cogs);
	const grossMarginPct = $derived(current.revenue > 0 ? (grossProfit / current.revenue * 100) : 0);
</script>

<!-- Period toggle -->
<div class="mb-5 flex items-center gap-2">
	{#each (['today', 'week', 'month'] as const) as p}
		<button
			onclick={() => (period = p)}
			class={cn(
				'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
				period === p ? 'bg-accent text-white' : 'border border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
		</button>
	{/each}
</div>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-4 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Net Revenue</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(current.revenue)}</p>
	</div>
	<div class="rounded-xl border border-status-red/20 bg-status-red-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-red">COGS (Weighed)</p>
		<p class="mt-1 text-2xl font-bold text-status-red">{formatPeso(current.cogs)}</p>
	</div>
	<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-green">Gross Profit</p>
		<p class="mt-1 text-2xl font-bold text-status-green">{formatPeso(grossProfit)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Gross Margin</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{grossMarginPct.toFixed(1)}%</p>
	</div>
</div>

<!-- Profit breakdown -->
<div class="grid grid-cols-[1fr_380px] gap-6">
	<!-- COGS breakdown table -->
	<div class="overflow-hidden rounded-xl border border-border bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-gray-50">
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cost Component</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">% of Revenue</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each current.cogsBreakdown as item}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 pl-8 text-gray-600">{item.label}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-700">{formatPeso(item.amount)}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-500">{(item.amount / current.revenue * 100).toFixed(1)}%</td>
					</tr>
				{/each}
				<tr class="border-t-2 border-border bg-gray-50 font-bold">
					<td class="px-4 py-3 text-gray-900">Total COGS</td>
					<td class="px-4 py-3 text-right font-mono text-status-red">{formatPeso(current.cogs)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-900">{(current.cogs / current.revenue * 100).toFixed(1)}%</td>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- Visual summary -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<h3 class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Profit Waterfall</h3>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Revenue</span>
					<span class="font-mono text-sm font-semibold text-gray-900">{formatPeso(current.revenue)}</span>
				</div>
				<div class="h-3 w-full overflow-hidden rounded-full bg-gray-100">
					<div class="h-full rounded-full bg-accent" style="width: 100%"></div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">COGS</span>
					<span class="font-mono text-sm font-semibold text-status-red">−{formatPeso(current.cogs)}</span>
				</div>
				<div class="h-3 w-full overflow-hidden rounded-full bg-gray-100">
					<div class="h-full rounded-full bg-status-red" style="width: {(current.cogs / current.revenue * 100)}%"></div>
				</div>
				<div class="mt-2 flex items-center justify-between border-t border-border pt-2">
					<span class="text-sm font-bold text-gray-900">= Gross Profit</span>
					<span class="font-mono text-lg font-bold text-status-green">{formatPeso(grossProfit)}</span>
				</div>
			</div>
		</div>
		<div class="rounded-xl border border-border bg-white p-5 text-center">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Dynamically calculated</p>
			<p class="mt-1 text-xs text-gray-500">COGS derived from exact weighed meat deductions × declared purchasing costs</p>
		</div>
	</div>
</div>
