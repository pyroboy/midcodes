<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	interface NetProfitData {
		grossProfit: number;
		expenses: { label: string; icon: string; amount: number }[];
	}

	const data: Record<Period, NetProfitData> = {
		today: {
			grossProfit: 19168,
			expenses: [
				{ label: 'Wages',         icon: '👷', amount: 4800 },
				{ label: 'Utilities',     icon: '💡', amount: 1450 },
				{ label: 'Rent (pro-rated)', icon: '🏠', amount: 1667 },
				{ label: 'Supplies',      icon: '📦', amount: 850 }
			]
		},
		week: {
			grossProfit: 102620,
			expenses: [
				{ label: 'Wages',         icon: '👷', amount: 33600 },
				{ label: 'Utilities',     icon: '💡', amount: 10150 },
				{ label: 'Rent (pro-rated)', icon: '🏠', amount: 11667 },
				{ label: 'Supplies',      icon: '📦', amount: 5400 }
			]
		},
		month: {
			grossProfit: 424000,
			expenses: [
				{ label: 'Wages',         icon: '👷', amount: 144000 },
				{ label: 'Utilities',     icon: '💡', amount: 45200 },
				{ label: 'Rent',          icon: '🏠', amount: 50000 },
				{ label: 'Supplies',      icon: '📦', amount: 22400 }
			]
		}
	};

	const current = $derived(data[period]);
	const totalOpex = $derived(current.expenses.reduce((s, e) => s + e.amount, 0));
	const netProfit = $derived(current.grossProfit - totalOpex);
	const netMarginPct = $derived(current.grossProfit > 0 ? (netProfit / current.grossProfit * 100) : 0);
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
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Gross Profit</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(current.grossProfit)}</p>
	</div>
	<div class="rounded-xl border border-status-red/20 bg-status-red-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-red">Operating Expenses</p>
		<p class="mt-1 text-2xl font-bold text-status-red">{formatPeso(totalOpex)}</p>
	</div>
	<div class={cn(
		'rounded-xl border p-4',
		netProfit >= 0 ? 'border-status-green/20 bg-status-green-light' : 'border-status-red/20 bg-status-red-light'
	)}>
		<p class={cn('text-xs font-medium uppercase tracking-wide', netProfit >= 0 ? 'text-status-green' : 'text-status-red')}>Net Profit</p>
		<p class={cn('mt-1 text-2xl font-bold', netProfit >= 0 ? 'text-status-green' : 'text-status-red')}>{formatPeso(netProfit)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Profit Margin</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{netMarginPct.toFixed(1)}%</p>
	</div>
</div>

<!-- Breakdown -->
<div class="grid grid-cols-[1fr_380px] gap-6">
	<div class="overflow-hidden rounded-xl border border-border bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-gray-50">
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Line Item</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Share</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				<tr class="bg-status-green-light/30">
					<td class="px-4 py-3 font-bold text-gray-900">Gross Profit</td>
					<td class="px-4 py-3 text-right font-mono font-bold text-status-green">{formatPeso(current.grossProfit)}</td>
					<td></td>
				</tr>
				{#each current.expenses as exp}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 pl-8 text-gray-600">
							<span class="mr-2">{exp.icon}</span>{exp.label}
						</td>
						<td class="px-4 py-3 text-right font-mono text-status-red">−{formatPeso(exp.amount)}</td>
						<td class="px-4 py-3">
							<div class="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-gray-100">
								<div class="h-full rounded-full bg-status-red/60" style="width: {(exp.amount / current.grossProfit * 100)}%"></div>
							</div>
						</td>
					</tr>
				{/each}
				<tr class="border-t-2 border-border bg-gray-50 font-bold">
					<td class="px-4 py-3 text-gray-900">= Net Profit</td>
					<td class={cn('px-4 py-3 text-right font-mono', netProfit >= 0 ? 'text-status-green' : 'text-status-red')}>{formatPeso(netProfit)}</td>
					<td></td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="flex flex-col gap-4">
		<div class={cn(
			'rounded-xl border p-6 text-center',
			netProfit >= 0 ? 'border-status-green/20 bg-status-green-light' : 'border-status-red/20 bg-status-red-light'
		)}>
			<p class={cn('text-xs font-bold uppercase tracking-wide', netProfit >= 0 ? 'text-status-green' : 'text-status-red')}>
				Take-Home Profit
			</p>
			<p class={cn('mt-2 text-4xl font-bold', netProfit >= 0 ? 'text-status-green' : 'text-status-red')}>
				{formatPeso(netProfit)}
			</p>
			<p class={cn('mt-1 text-sm', netProfit >= 0 ? 'text-status-green/60' : 'text-status-red/60')}>
				{netMarginPct.toFixed(1)}% margin
			</p>
		</div>
		<div class="rounded-xl border border-border bg-white p-5 text-center">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Calculation</p>
			<p class="mt-1 text-xs text-gray-500">Gross Profit − All Logged Operating Expenses (labor, rent, utilities, supplies)</p>
		</div>
	</div>
</div>
