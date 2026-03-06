<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { allExpenses, expenseCategories } from '$lib/stores/expenses.svelte';

	interface MonthlyRow {
		category: string;
		icon: string;
		current: number;
		previous: number;
		variance: number;
		flagged: boolean;
	}

	const categoryIcons: Record<string, string> = {
		'Meat Procurement': '🥩',
		'Produce & Sides': '🥬',
		'Utilities': '💡',
		'Wages': '👷',
		'Rent': '🏠',
		'Miscellaneous': '📦'
	};

	const now = new Date();
	const thisMonth = { month: now.getMonth(), year: now.getFullYear() };
	const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const prevMonth = { month: prevMonthDate.getMonth(), year: prevMonthDate.getFullYear() };

	const currentMonthExpenses = $derived(
		allExpenses.value.filter(e => {
			const d = new Date(e.createdAt);
			return d.getMonth() === thisMonth.month && d.getFullYear() === thisMonth.year;
		})
	);

	const prevMonthExpenses = $derived(
		allExpenses.value.filter(e => {
			const d = new Date(e.createdAt);
			return d.getMonth() === prevMonth.month && d.getFullYear() === prevMonth.year;
		})
	);

	const rows = $derived(expenseCategories.map(cat => {
		const current  = currentMonthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
		const previous = prevMonthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
		const rawVariance = previous > 0 ? ((current - previous) / previous) * 100 : 0;
		const variance = isNaN(rawVariance) ? 0 : rawVariance;
		return {
			category: cat,
			icon: categoryIcons[cat] || '📦',
			current,
			previous,
			variance,
			flagged: variance > 15
		};
	}).filter(r => r.current > 0 || r.previous > 0));

	const totalCurrent  = $derived(rows.reduce((s, r) => s + r.current, 0));
	const totalPrevious = $derived(rows.reduce((s, r) => s + r.previous, 0));
	const totalVariance = $derived(totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious * 100) : 0);
	const flaggedCount  = $derived(rows.filter(r => r.flagged).length);
</script>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-4 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total This Month</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(totalCurrent)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Last Month</p>
		<p class="mt-1 text-2xl font-bold text-gray-500">{formatPeso(totalPrevious)}</p>
	</div>
	<div class={cn(
		'rounded-xl border p-4',
		totalVariance > 10 ? 'border-status-red/20 bg-status-red-light' : totalVariance > 0 ? 'border-status-yellow/30 bg-status-yellow-light' : 'border-status-green/20 bg-status-green-light'
	)}>
		<p class={cn('text-xs font-medium uppercase tracking-wide', totalVariance > 10 ? 'text-status-red' : totalVariance > 0 ? 'text-status-yellow' : 'text-status-green')}>Month-over-Month</p>
		<p class={cn('mt-1 text-2xl font-bold', totalVariance > 10 ? 'text-status-red' : totalVariance > 0 ? 'text-status-yellow' : 'text-status-green')}>
			{totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}%
		</p>
	</div>
	<div class={cn(
		'rounded-xl border p-4',
		flaggedCount > 0 ? 'border-status-red/20 bg-status-red-light' : 'border-status-green/20 bg-status-green-light'
	)}>
		<p class={cn('text-xs font-medium uppercase tracking-wide', flaggedCount > 0 ? 'text-status-red' : 'text-status-green')}>Cost Spikes</p>
		<p class={cn('mt-1 text-2xl font-bold', flaggedCount > 0 ? 'text-status-red' : 'text-status-green')}>{flaggedCount}</p>
	</div>
</div>

<!-- Monthly trend table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Category</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">This Month</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Last Month</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Change %</th>
				<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each rows as row}
				<tr class={cn('hover:bg-gray-50', row.flagged && 'bg-status-red-light/30')}>
					<td class="px-4 py-3 font-medium text-gray-900">
						<span class="mr-2">{row.icon}</span>{row.category}
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(row.current)}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{formatPeso(row.previous)}</td>
					<td class={cn(
						'px-4 py-3 text-right font-mono font-bold',
						row.variance > 15 ? 'text-status-red' : row.variance > 0 ? 'text-status-yellow' : 'text-status-green'
					)}>
						{row.variance > 0 ? `+${row.variance.toFixed(1)}` : row.variance.toFixed(1)}%
					</td>
					<td class="px-4 py-3 text-center">
						{#if row.flagged}
							<span class="rounded-full border border-status-red/20 bg-status-red-light px-2.5 py-0.5 text-xs font-semibold text-status-red">⚠ Spike</span>
						{:else if row.variance === 0}
							<span class="rounded-full border border-status-green/20 bg-status-green-light px-2.5 py-0.5 text-xs font-semibold text-status-green">Stable</span>
						{:else}
							<span class="rounded-full border border-border bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500">Normal</span>
						{/if}
					</td>
				</tr>
			{/each}
			<tr class="border-t-2 border-border bg-gray-50 font-bold">
				<td class="px-4 py-3 text-gray-900">TOTAL</td>
				<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totalCurrent)}</td>
				<td class="px-4 py-3 text-right font-mono text-gray-500">{formatPeso(totalPrevious)}</td>
				<td class={cn(
					'px-4 py-3 text-right font-mono font-bold',
					totalVariance > 10 ? 'text-status-red' : totalVariance > 0 ? 'text-status-yellow' : 'text-status-green'
				)}>
					{totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}%
				</td>
				<td></td>
			</tr>
		</tbody>
	</table>
</div>
