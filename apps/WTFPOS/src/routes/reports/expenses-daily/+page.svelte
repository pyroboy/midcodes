<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	interface ExpenseItem {
		category: string;
		icon: string;
		amount: number;
		pctOfSales: number;
	}

	const dailySales = 34696;

	const data: Record<Period, { sales: number; items: ExpenseItem[] }> = {
		today: {
			sales: 34696,
			items: [
				{ category: 'Meat Procurement',  icon: '🥩', amount: 12800, pctOfSales: 36.9 },
				{ category: 'Produce & Sides',   icon: '🥬', amount: 3200,  pctOfSales: 9.2 },
				{ category: 'Utilities',         icon: '💡', amount: 1450,  pctOfSales: 4.2 },
				{ category: 'Wages',             icon: '👷', amount: 4800,  pctOfSales: 13.8 },
				{ category: 'Miscellaneous',     icon: '📦', amount: 850,   pctOfSales: 2.4 }
			]
		},
		week: {
			sales: 198400,
			items: [
				{ category: 'Meat Procurement',  icon: '🥩', amount: 72500,  pctOfSales: 36.5 },
				{ category: 'Produce & Sides',   icon: '🥬', amount: 18200,  pctOfSales: 9.2 },
				{ category: 'Utilities',         icon: '💡', amount: 10150,  pctOfSales: 5.1 },
				{ category: 'Wages',             icon: '👷', amount: 33600,  pctOfSales: 16.9 },
				{ category: 'Miscellaneous',     icon: '📦', amount: 5400,   pctOfSales: 2.7 }
			]
		},
		month: {
			sales: 824000,
			items: [
				{ category: 'Meat Procurement',  icon: '🥩', amount: 298000, pctOfSales: 36.2 },
				{ category: 'Produce & Sides',   icon: '🥬', amount: 74800,  pctOfSales: 9.1 },
				{ category: 'Utilities',         icon: '💡', amount: 45200,  pctOfSales: 5.5 },
				{ category: 'Wages',             icon: '👷', amount: 144000, pctOfSales: 17.5 },
				{ category: 'Miscellaneous',     icon: '📦', amount: 22400,  pctOfSales: 2.7 }
			]
		}
	};

	const current = $derived(data[period]);
	const totalExpenses = $derived(current.items.reduce((s, i) => s + i.amount, 0));
	const netCashFlow = $derived(current.sales - totalExpenses);
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
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Sales</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(current.sales)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Expenses</p>
		<p class="mt-1 text-2xl font-bold text-status-red">{formatPeso(totalExpenses)}</p>
	</div>
	<div class={cn(
		'rounded-xl border p-4',
		netCashFlow >= 0 ? 'border-status-green/20 bg-status-green-light' : 'border-status-red/20 bg-status-red-light'
	)}>
		<p class={cn('text-xs font-medium uppercase tracking-wide', netCashFlow >= 0 ? 'text-status-green' : 'text-status-red')}>Net Cash Flow</p>
		<p class={cn('mt-1 text-2xl font-bold', netCashFlow >= 0 ? 'text-status-green' : 'text-status-red')}>{formatPeso(netCashFlow)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Expense Ratio</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{(totalExpenses / current.sales * 100).toFixed(1)}%</p>
	</div>
</div>

<!-- Expense breakdown table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Category</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">% of Sales</th>
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Proportion</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each current.items as item}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-3 font-medium text-gray-900">
						<span class="mr-2">{item.icon}</span>{item.category}
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-700">{formatPeso(item.amount)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{item.pctOfSales}%</td>
					<td class="px-4 py-3">
						<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
							<div class="h-full rounded-full bg-accent/70" style="width: {Math.min(item.pctOfSales * 2, 100)}%"></div>
						</div>
					</td>
				</tr>
			{/each}
			<!-- Total row -->
			<tr class="border-t-2 border-border bg-gray-50 font-bold">
				<td class="px-4 py-3 text-gray-900">TOTAL</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totalExpenses)}</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{(totalExpenses / current.sales * 100).toFixed(1)}%</td>
				<td></td>
			</tr>
		</tbody>
	</table>
</div>
