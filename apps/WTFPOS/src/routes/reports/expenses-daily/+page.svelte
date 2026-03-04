<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { allExpenses, expenseCategories } from '$lib/stores/expenses.svelte';
	import { eodSummary } from '$lib/stores/reports.svelte';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	interface ExpenseItem {
		category: string;
		icon: string;
		amount: number;
		pctOfSales: number;
	}

	const categoryIcons: Record<string, string> = {
		'Meat Procurement': '🥩',
		'Produce & Sides': '🥬',
		'Utilities': '💡',
		'Wages': '👷',
		'Rent': '🏠',
		'Miscellaneous': '📦'
	};

	const salesData = {
		get today() { return eodSummary().netSales || 34696; },
		week: 198400,
		month: 824000
	};

	function filterExpensesByPeriod(p: Period) {
		const now = new Date();
		return allExpenses.filter(e => {
			const d = new Date(e.createdAt);
			if (p === 'today') return d.toDateString() === now.toDateString();
			if (p === 'week') return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
			if (p === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
			return false;
		});
	}

	function getExpenseItems(p: Period): ExpenseItem[] {
		const sales = salesData[p];
		const exp = filterExpensesByPeriod(p);
		
		return expenseCategories.map(cat => {
			const amount = exp.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
			const pctOfSales = sales > 0 ? Number(((amount / sales) * 100).toFixed(1)) : 0;
			return {
				category: cat,
				icon: categoryIcons[cat] || '📦',
				amount,
				pctOfSales
			};
		}).filter(i => i.amount > 0);
	}

	const current = $derived({
		sales: salesData[period],
		items: getExpenseItems(period)
	});
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
