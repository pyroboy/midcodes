<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { orders as allOrders } from '$lib/stores/pos.svelte';
	import { allExpenses } from '$lib/stores/expenses.svelte';
	import { inPeriod } from '$lib/stores/reports.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import type { ChartDataPoint } from '$lib/components/reports/ReportBarChart.svelte';

	// filterPeriod drives ReportFilterBar; period derives from it unless custom dates are set
	type FilterPeriod = 'today' | 'week' | 'month';
	type Period = FilterPeriod | 'custom';
	let filterPeriod = $state<FilterPeriod>('today');

	// Custom date range
	let customFrom = $state('');
	let customTo   = $state('');

	const period = $derived<Period>(customFrom && customTo ? 'custom' : filterPeriod);

	const BRANCHES = [
		{ id: 'tag', name: 'Tagbilaran Branch' },
		{ id: 'pgl', name: 'Panglao Branch' },
	];
	const FOOD_COGS = new Set(['Meat & Protein', 'Sides & Supplies']);

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

	function inCustomRange(isoDate: string, from: Date, to: Date): boolean {
		const d = new Date(isoDate);
		return d >= from && d <= to;
	}

	function computeBranches(p: Period): BranchData[] {
		const fromDate = p === 'custom' && customFrom ? new Date(customFrom) : null;
		const toDate   = p === 'custom' && customTo   ? new Date(customTo + 'T23:59:59') : null;

		return BRANCHES.map(({ id, name }) => {
			const os = allOrders.value.filter(o => {
				if (o.status !== 'paid' || o.locationId !== id) return false;
				if (p === 'custom') {
					return fromDate && toDate ? inCustomRange(o.createdAt, fromDate, toDate) : false;
				}
				return inPeriod(o.createdAt, p);
			});
			const ex = allExpenses.value.filter(e => {
				if (e.locationId !== id) return false;
				if (p === 'custom') {
					return fromDate && toDate ? inCustomRange(e.createdAt, fromDate, toDate) : false;
				}
				return inPeriod(e.createdAt, p);
			});

			const grossRevenue  = os.reduce((s, o) => s + o.subtotal, 0);
			const netRevenue    = os.reduce((s, o) => s + o.total, 0);
			const totalExpenses = ex.reduce((s, e) => s + e.amount, 0);
			const cogs          = ex.filter(e => FOOD_COGS.has(e.category)).reduce((s, e) => s + e.amount, 0);
			const grossProfit   = netRevenue - cogs;
			const netProfit     = netRevenue - totalExpenses;
			const pax           = os.reduce((s, o) => s + (o.pax ?? 0), 0);

			return {
				name,
				grossRevenue,
				netRevenue,
				totalExpenses,
				grossProfit,
				netProfit,
				grossMarginPct: grossRevenue > 0 ? grossProfit / grossRevenue * 100 : 0,
				netMarginPct:   grossRevenue > 0 ? netProfit   / grossRevenue * 100 : 0,
				pax,
				avgTicket: pax > 0 ? Math.round(netRevenue / pax) : 0,
			};
		});
	}

	const branches = $derived(computeBranches(period));

	// Combined KPI totals
	const combined = $derived({
		revenue:  branches.reduce((s, b) => s + b.netRevenue, 0),
		expenses: branches.reduce((s, b) => s + b.totalExpenses, 0),
		profit:   branches.reduce((s, b) => s + b.netProfit, 0),
		pax:      branches.reduce((s, b) => s + b.pax, 0),
	});

	const leadingBranch = $derived(() => {
		if (branches.length < 2) return null;
		if (branches[0].netProfit === branches[1].netProfit) return null;
		return branches[0].netProfit > branches[1].netProfit ? branches[0].name : branches[1].name;
	});

	// Chart: net revenue side-by-side per branch
	const branchChart = $derived.by((): ChartDataPoint[] => {
		const metrics = ['Gross Sales', 'Net Sales', 'Gross Profit', 'Net Profit'];
		return metrics.map((label, i) => {
			const keys: (keyof BranchData)[] = ['grossRevenue', 'netRevenue', 'grossProfit', 'netProfit'];
			return {
				label,
				primary: (branches[0]?.[keys[i]] ?? 0) as number,
				secondary: (branches[1]?.[keys[i]] ?? 0) as number,
			};
		});
	});

	interface CompareRow {
		label: string;
		key: keyof BranchData;
		format: 'peso' | 'pct' | 'number';
		highlight?: boolean;
		lowerIsBetter?: boolean;
	}

	const compareRows: CompareRow[] = [
		{ label: 'Gross Sales',    key: 'grossRevenue',  format: 'peso' },
		{ label: 'Net Sales',      key: 'netRevenue',    format: 'peso' },
		{ label: 'Total Expenses', key: 'totalExpenses', format: 'peso', lowerIsBetter: true },
		{ label: 'Gross Profit',   key: 'grossProfit',   format: 'peso', highlight: true },
		{ label: 'Net Profit',     key: 'netProfit',     format: 'peso', highlight: true },
		{ label: 'Gross Margin',   key: 'grossMarginPct',format: 'pct' },
		{ label: 'Net Margin',     key: 'netMarginPct',  format: 'pct' },
		{ label: 'Total Pax',      key: 'pax',           format: 'number' },
		{ label: 'Avg Ticket',     key: 'avgTicket',     format: 'peso' },
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
		if (a === b) return null;
		return row.lowerIsBetter ? (a < b ? 0 : 1) : (a > b ? 0 : 1);
	}
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={filterPeriod}
			onPeriodChange={(p) => { filterPeriod = p as FilterPeriod; customFrom = ''; customTo = ''; }}
			options={[
				{ value: 'today', label: 'Today' },
				{ value: 'week',  label: 'This Week' },
				{ value: 'month', label: 'This Month' },
			]}
			showLive={false}
		>
			{#snippet actions()}
				<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Custom range:</span>
				<input
					type="date"
					bind:value={customFrom}
					class={cn('pos-input text-sm py-1.5', period === 'custom' ? 'border-accent ring-1 ring-accent/20' : '')}
					style="min-height: unset; width: 120px"
				/>
				<span class="text-xs text-gray-400">to</span>
				<input
					type="date"
					bind:value={customTo}
					min={customFrom}
					class={cn('pos-input text-sm py-1.5', period === 'custom' ? 'border-accent ring-1 ring-accent/20' : '')}
					style="min-height: unset; width: 120px"
				/>
				{#if period === 'custom'}
					<span class="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent">Custom range active</span>
				{/if}
				</div>
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 flex-1">
			<KpiCard label="Combined Revenue" value={formatPeso(combined.revenue)} />
			<KpiCard label="Combined Expenses" value={formatPeso(combined.expenses)} variant="danger" />
			<KpiCard
				label="Combined Net Profit"
				value={formatPeso(combined.profit)}
				variant={combined.profit >= 0 ? 'success' : 'danger'}
			/>
			<KpiCard
				label="Leading Branch"
				value={leadingBranch() ?? '—'}
				variant="accent"
				sub={combined.profit > 0 ? 'by net profit' : undefined}
			/>
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<div class="mb-3 flex items-center gap-4">
				<p class="text-xs font-bold uppercase tracking-wide text-gray-400">Branch Comparison</p>
				<div class="flex items-center gap-3 text-[10px]">
					<span class="flex items-center gap-1"><span class="inline-block h-2 w-4 rounded-sm bg-blue-400/75"></span> {branches[0]?.name ?? 'Branch 1'}</span>
					<span class="flex items-center gap-1"><span class="inline-block h-2 w-4 rounded-sm bg-purple-400/65"></span> {branches[1]?.name ?? 'Branch 2'}</span>
				</div>
			</div>
			<ReportBarChart
				data={branchChart}
				yUnit="₱"
				height={200}
				showSecondary={true}
				primaryColor="#60A5FA"
				secondaryColor="#A78BFA"
			/>
		</div>
	{/snippet}

	{#snippet content()}
		<!-- Branch net profit header cards -->
		<div class="mb-5 grid grid-cols-2 gap-4">
			{#each branches as branch, i}
				<div class={cn(
					'rounded-xl border p-5 text-center',
					i === 0 ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'
				)}>
					<p class={cn('text-sm font-bold', i === 0 ? 'text-blue-700' : 'text-purple-700')}>{branch.name}</p>
					<p class={cn('mt-1 text-xl sm:text-3xl font-bold', i === 0 ? 'text-blue-900' : 'text-purple-900')}>{formatPeso(branch.netProfit)}</p>
					<p class={cn('text-xs', i === 0 ? 'text-blue-500' : 'text-purple-500')}>Net Profit</p>
				</div>
			{/each}
		</div>

		<!-- Empty state -->
		{#if branches.every(b => b.grossRevenue === 0)}
			<div class="mb-5 flex items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
				<div class="text-2xl">📭</div>
				<div>
					<p class="font-semibold text-gray-700">No orders found for this period</p>
					<p class="text-sm text-gray-500 mt-0.5">
						{period === 'today' ? "No paid orders today yet. Try 'This Week' or 'This Month' to see historical data." :
						 period === 'week'  ? "No paid orders this week. Try 'This Month' to see more data." :
						 period === 'custom' ? "No paid orders in the selected date range. Adjust the from/to dates." :
						                     "No paid orders this month. Check that orders have been settled (paid status)."}
					</p>
				</div>
			</div>
		{/if}

		<!-- Side-by-side comparison table -->
		<div class="overflow-x-auto rounded-xl border border-border bg-white">
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
	{/snippet}
</ReportShell>
