<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('month');

	interface BranchData {
		name: string;
		grossRevenue: number;
		netRevenue: number;
		totalExpenses: number;
		grossProfit: number;
		netProfit: number;
		grossMarginPct: number;
		netMarginPct: number;
		pax: number;
		avgTicket: number;
	}

	const data: Record<Period, BranchData[]> = {
		today: [
			{ name: 'Alta Cita', grossRevenue: 34696, netRevenue: 33748, totalExpenses: 8767, grossProfit: 19168, netProfit: 10401, grossMarginPct: 56.8, netMarginPct: 30.8, pax: 46, avgTicket: 734 },
			{ name: 'Alona',     grossRevenue: 28400, netRevenue: 27200, totalExpenses: 7200, grossProfit: 15600, netProfit: 8400,  grossMarginPct: 57.4, netMarginPct: 30.9, pax: 38, avgTicket: 716 }
		],
		week: [
			{ name: 'Alta Cita', grossRevenue: 198400, netRevenue: 175020, totalExpenses: 60817, grossProfit: 102620, netProfit: 41803, grossMarginPct: 58.6, netMarginPct: 23.9, pax: 232, avgTicket: 754 },
			{ name: 'Alona',     grossRevenue: 172600, netRevenue: 158400, totalExpenses: 55200, grossProfit: 92400,  netProfit: 37200, grossMarginPct: 58.3, netMarginPct: 23.5, pax: 210, avgTicket: 754 }
		],
		month: [
			{ name: 'Alta Cita', grossRevenue: 824000, netRevenue: 722000, totalExpenses: 261600, grossProfit: 424000, netProfit: 162400, grossMarginPct: 58.7, netMarginPct: 22.5, pax: 960, avgTicket: 752 },
			{ name: 'Alona',     grossRevenue: 716000, netRevenue: 648000, totalExpenses: 238400, grossProfit: 380000, netProfit: 141600, grossMarginPct: 58.6, netMarginPct: 21.9, pax: 880, avgTicket: 736 }
		]
	};

	const branches = $derived(data[period]);

	interface CompareRow {
		label: string;
		key: keyof BranchData;
		format: 'peso' | 'pct' | 'number';
		highlight?: boolean;
	}

	const compareRows: CompareRow[] = [
		{ label: 'Gross Revenue',    key: 'grossRevenue',    format: 'peso' },
		{ label: 'Net Revenue',      key: 'netRevenue',      format: 'peso' },
		{ label: 'Total Expenses',   key: 'totalExpenses',   format: 'peso' },
		{ label: 'Gross Profit',     key: 'grossProfit',     format: 'peso', highlight: true },
		{ label: 'Net Profit',       key: 'netProfit',       format: 'peso', highlight: true },
		{ label: 'Gross Margin',     key: 'grossMarginPct',  format: 'pct' },
		{ label: 'Net Margin',       key: 'netMarginPct',    format: 'pct' },
		{ label: 'Total Pax',        key: 'pax',             format: 'number' },
		{ label: 'Avg Ticket',       key: 'avgTicket',       format: 'peso' }
	];

	function fmt(value: number, format: string) {
		if (format === 'peso') return formatPeso(value);
		if (format === 'pct') return `${value.toFixed(1)}%`;
		return value.toLocaleString();
	}

	function winner(row: CompareRow): number | null {
		if (branches.length < 2) return null;
		const a = branches[0][row.key] as number;
		const b = branches[1][row.key] as number;
		if (row.key === 'totalExpenses') return a < b ? 0 : a > b ? 1 : null;
		return a > b ? 0 : a < b ? 1 : null;
	}
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

<!-- Branch headers -->
<div class="mb-5 grid grid-cols-2 gap-4">
	{#each branches as branch, i}
		<div class={cn(
			'rounded-xl border p-5 text-center',
			i === 0 ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'
		)}>
			<p class={cn('text-sm font-bold', i === 0 ? 'text-blue-700' : 'text-purple-700')}>{branch.name}</p>
			<p class={cn('mt-1 text-3xl font-bold', i === 0 ? 'text-blue-900' : 'text-purple-900')}>{formatPeso(branch.netProfit)}</p>
			<p class={cn('text-xs', i === 0 ? 'text-blue-500' : 'text-purple-500')}>Net Profit</p>
		</div>
	{/each}
</div>

<!-- Side-by-side comparison table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Metric</th>
				{#each branches as branch, i}
					<th class={cn(
						'px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide',
						i === 0 ? 'text-blue-500' : 'text-purple-500'
					)}>{branch.name}</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each compareRows as row}
				{@const w = winner(row)}
				<tr class={cn('hover:bg-gray-50', row.highlight && 'bg-gray-50/50')}>
					<td class={cn('px-4 py-3 text-gray-600', row.highlight && 'font-semibold text-gray-900')}>{row.label}</td>
					{#each branches as branch, i}
						<td class={cn(
							'px-4 py-3 text-right font-mono',
							w === i ? 'font-bold text-status-green' : 'text-gray-700',
							row.highlight && 'font-semibold'
						)}>
							{fmt(branch[row.key] as number, row.format)}
							{#if w === i}
								<span class="ml-1 text-xs">✓</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
