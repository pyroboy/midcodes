<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { allExpenses, expenseCategories, addExpense, getCategoryIcon } from '$lib/stores/expenses.svelte';
	import { session } from '$lib/stores/session.svelte';
	import {
		inPeriod,
		expensesByDayForChart,
		expensesByMonthForChart,
		expenseSummaryWithComparison,
	} from '$lib/stores/reports.svelte';
	import PhotoCapture from '$lib/components/PhotoCapture.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import ReportHorizBar from '$lib/components/reports/ReportHorizBar.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	type Period = 'today' | 'week' | 'month' | 'all';
	let period = $state<Period>('today');

	// ── Expense entry form ────────────────────────────────────────────────────
	const paymentMethods = ['Cash from Register', 'GCash', 'Maya', 'Personal Cash'] as const;

	let formOpen      = $state(false);
	let entryCategory = $state('');
	let entryAmount   = $state<number | ''>('');
	let entryDesc     = $state('');
	let entryPaidBy   = $state<string>('Cash from Register');
	let entryError    = $state('');
	let entrySaving   = $state(false);
	let entrySaved    = $state(false);
	let entryPhotos   = $state<string[]>([]);

	$effect(() => {
		if (page.url.searchParams.get('action') === 'open') {
			formOpen = true;
			goto('/reports/expenses-daily', { replaceState: true, noScroll: true });
		}
	});

	function resetForm() {
		entryCategory = '';
		entryAmount   = '';
		entryDesc     = '';
		entryPaidBy   = 'Cash from Register';
		entryError    = '';
		entrySaved    = false;
		entryPhotos   = [];
	}

	async function submitExpense() {
		if (!entryCategory)                           { entryError = 'Pick a category'; return; }
		if (!entryAmount || Number(entryAmount) <= 0) { entryError = 'Enter a valid amount'; return; }
		if (!entryDesc.trim())                        { entryError = 'Add a description'; return; }

		entrySaving = true;
		entryError  = '';
		const result = await addExpense(entryCategory, Number(entryAmount), entryDesc.trim(), entryPaidBy);
		entrySaving = false;

		if (result.success) {
			entrySaved = true;
			setTimeout(() => { resetForm(); formOpen = false; }, 1200);
		} else {
			entryError = result.error ?? 'Failed to save';
		}
	}

	// ── Data derivations ──────────────────────────────────────────────────────

	const filteredExpenses = $derived(
		allExpenses.value.filter(e => {
			const locId = session.locationId;
			if (locId !== 'all' && e.locationId !== locId) return false;
			if (period === 'all') return true;
			return inPeriod(e.createdAt, period);
		})
	);

	const kpiData = $derived(
		period !== 'all' ? expenseSummaryWithComparison(period as 'today' | 'week' | 'month') : null
	);

	const totalExpenses = $derived(filteredExpenses.reduce((s, e) => s + e.amount, 0));
	const currentSales  = $derived(kpiData?.sales ?? 0);
	const netCashFlow   = $derived(currentSales - totalExpenses);

	const filteredItems = $derived(
		expenseCategories.map(cat => {
			const amount = filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
			const pctOfSales = currentSales > 0 ? Number(((amount / currentSales) * 100).toFixed(1)) : 0;
			return { category: cat, icon: getCategoryIcon(cat), amount, pctOfSales };
		}).filter(i => i.amount > 0)
	);

	// [04] Max category amount for proportional bar scaling
	const maxCategoryAmount = $derived(
		filteredItems.length > 0 ? Math.max(...filteredItems.map(i => i.amount)) : 1
	);

	// [07] Trim leading zeros for "All" period chart
	const chartData = $derived(
		period === 'month' || period === 'all'
			? expensesByMonthForChart(period === 'all' ? 12 : 6, period === 'all')
			: expensesByDayForChart(14)
	);

	// [06] Payment method breakdown
	const paymentBreakdown = $derived.by(() => {
		const map = new Map<string, number>();
		for (const e of filteredExpenses) {
			map.set(e.paidBy, (map.get(e.paidBy) ?? 0) + e.amount);
		}
		return [...map.entries()]
			.map(([method, amount]) => ({ method, amount }))
			.sort((a, b) => b.amount - a.amount);
	});

	// [05] Recent expense entries (most recent 15)
	const recentEntries = $derived(
		[...filteredExpenses]
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
			.slice(0, 15)
	);
	let showRecentEntries = $state(false);

	// [02] Expense ratio benchmark
	const EXPENSE_RATIO_TARGET = 0.65; // 65% target

	function ratioVariant(ratio: number | null): 'success' | 'danger' | 'default' {
		if (ratio === null) return 'default';
		if (ratio <= 0.60) return 'success';
		if (ratio > 0.80) return 'danger';
		return 'default';
	}

	// ── Month-over-Month (only when period === 'month') ───────────────────────
	const now = new Date();
	const thisMonthInfo = { month: now.getMonth(), year: now.getFullYear() };
	const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const prevMonthInfo = { month: prevMonthDate.getMonth(), year: prevMonthDate.getFullYear() };

	const currentMonthExpenses = $derived(
		allExpenses.value.filter(e => {
			if (session.locationId !== 'all' && e.locationId !== session.locationId) return false;
			const d = new Date(e.createdAt);
			return d.getMonth() === thisMonthInfo.month && d.getFullYear() === thisMonthInfo.year;
		})
	);

	const prevMonthExpenses = $derived(
		allExpenses.value.filter(e => {
			if (session.locationId !== 'all' && e.locationId !== session.locationId) return false;
			const d = new Date(e.createdAt);
			return d.getMonth() === prevMonthInfo.month && d.getFullYear() === prevMonthInfo.year;
		})
	);

	// [01] Detect empty previous month
	const hasPrevMonthData = $derived(prevMonthExpenses.length > 0);

	const momRows = $derived(
		expenseCategories.map(cat => {
			const current  = currentMonthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
			const previous = prevMonthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
			const rawVariance = previous > 0 ? ((current - previous) / previous) * 100 : 0;
			const variance = isNaN(rawVariance) ? 0 : rawVariance;
			return { category: cat, icon: getCategoryIcon(cat), current, previous, variance, flagged: variance > 15 };
		}).filter(r => r.current > 0 || r.previous > 0)
	);

	const momTotalCurrent  = $derived(momRows.reduce((s, r) => s + r.current, 0));
	const momTotalPrevious = $derived(momRows.reduce((s, r) => s + r.previous, 0));
	const momTotalVariance = $derived(
		momTotalPrevious > 0 ? ((momTotalCurrent - momTotalPrevious) / momTotalPrevious * 100) : 0
	);
	const momFlaggedCount = $derived(momRows.filter(r => r.flagged).length);
</script>

<!-- ── Expense entry modal ─────────────────────────────────────────────────── -->
{#if formOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
		<div class="pos-card w-[560px] max-h-[90vh] overflow-y-auto flex flex-col gap-5">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Log New Expense</h3>
				<button onclick={() => { formOpen = false; resetForm(); }} class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
					<span class="text-lg leading-none">&times;</span>
				</button>
			</div>

			<!-- Category pills -->
			<div>
				<span class="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Category</span>
				<div class="grid grid-cols-4 gap-2">
					{#each expenseCategories as cat}
						<button
							onclick={() => (entryCategory = cat)}
							class={cn(
								'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
								entryCategory === cat
									? 'border-accent bg-accent-light text-accent'
									: 'border-border bg-white text-gray-600 hover:bg-gray-50'
							)}
							aria-pressed={entryCategory === cat}
						>
							<span class="text-lg leading-none" aria-hidden="true">{getCategoryIcon(cat)}</span>
							<span class="text-center leading-tight">{cat}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="expense-amount" class="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Amount (₱)</label>
					<input
						id="expense-amount"
						type="number"
						bind:value={entryAmount}
						min="0"
						step="1"
						placeholder="0.00"
						class="pos-input w-full font-mono text-xl font-bold"
					/>
				</div>

				<div>
					<span class="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Paid By</span>
					<div class="grid grid-cols-2 gap-1.5">
						{#each paymentMethods as method}
							<button
								onclick={() => (entryPaidBy = method)}
								class={cn(
									'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors leading-tight',
									entryPaidBy === method
										? 'border-accent bg-accent-light text-accent'
										: 'border-border bg-white text-gray-600 hover:bg-gray-50'
								)}
							>
								{method}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div>
				<label for="expense-desc" class="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Description</label>
				<input
					id="expense-desc"
					type="text"
					bind:value={entryDesc}
					placeholder="e.g. Bought 5kg liempo from market"
					class="pos-input w-full text-sm"
				/>
			</div>

			<PhotoCapture
				photos={entryPhotos}
				onchange={(p) => (entryPhotos = p)}
				label="Receipt Photo (optional)"
			/>

			{#if entryError}
				<p class="rounded-lg border border-status-red/20 bg-status-red-light px-3 py-2 text-sm font-medium text-status-red">
					{entryError}
				</p>
			{/if}

			{#if entrySaved}
				<div class="rounded-lg border border-status-green/20 bg-status-green-light px-4 py-3 text-center text-sm font-bold text-status-green">
					Expense saved!
				</div>
			{:else}
				<div class="flex gap-3 mt-2">
					<button onclick={() => { formOpen = false; resetForm(); }} class="btn-ghost flex-1">Cancel</button>
					<button onclick={submitExpense} disabled={entrySaving} class="btn-primary flex-1">
						{entrySaving ? 'Saving…' : 'Save Expense'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={period}
			onPeriodChange={(p) => (period = p as Period)}
			options={[
				{ value: 'today', label: 'Today' },
				{ value: 'week',  label: 'This Week' },
				{ value: 'month', label: 'This Month' },
				{ value: 'all',   label: 'All' },
			]}
			showLive={false}
		>
			{#snippet actions()}
				<button onclick={() => { formOpen = true; }} class="btn-primary flex items-center gap-2 shadow-sm">
					<span class="flex h-5 w-5 items-center justify-center rounded text-sm font-bold">+</span>
					Log New Expense
				</button>
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
			<KpiCard
				label="Total Expenses"
				value={formatPeso(totalExpenses)}
				change={kpiData?.total.changePct ?? null}
				prevValue={kpiData ? formatPeso(kpiData.total.previous) : null}
				changeLabel="vs prev period"
				variant="danger"
			/>
			<KpiCard
				label="Total Sales"
				value={period !== 'all' ? formatPeso(currentSales) : '—'}
				sub={period === 'all' ? 'No baseline for all-time' : undefined}
				change={kpiData?.salesComparison.changePct ?? null}
				prevValue={kpiData ? formatPeso(kpiData.salesComparison.previous) : null}
				changeLabel="vs prev period"
			/>
			<KpiCard
				label="Net Cash Flow"
				value={period !== 'all' ? formatPeso(netCashFlow) : '—'}
				variant={period !== 'all' ? (netCashFlow >= 0 ? 'success' : 'danger') : 'default'}
				change={kpiData?.cashFlowComparison.changePct ?? null}
				prevValue={kpiData ? formatPeso(kpiData.cashFlowComparison.previous) : null}
				changeLabel="vs prev period"
			/>
			<KpiCard
				label="Expense Ratio"
				value={kpiData?.expenseRatio != null ? (kpiData.expenseRatio * 100).toFixed(1) + '%' : '—'}
				sub={currentSales > 0 ? `of net sales (target ≤${(EXPENSE_RATIO_TARGET * 100).toFixed(0)}%)` : undefined}
				variant={ratioVariant(kpiData?.expenseRatio ?? null)}
				change={kpiData?.ratioComparison?.changePct ?? null}
				prevValue={kpiData?.ratioComparison ? kpiData.ratioComparison.previous.toFixed(1) + '%' : null}
				changeLabel="vs prev period"
			/>
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
				{period === 'today' || period === 'week' ? 'Daily Expenses — Last 14 Days' : 'Monthly Expenses'}
			</p>
			<ReportBarChart
				data={chartData}
				primaryColor="#EF4444"
				formatValue={(v) => formatPeso(v)}
				height={200}
			/>
		</div>
	{/snippet}

	{#snippet content()}
		<!-- Category breakdown chart -->
		<div class="mb-5 rounded-xl border border-border bg-white p-5">
			<p class="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">Category Breakdown</p>
			<ReportHorizBar
				rows={filteredItems.map(i => ({
					label: `${i.icon} ${i.category}`,
					value: i.amount,
					subLabel: currentSales > 0 ? `${i.pctOfSales}% of sales` : formatPeso(i.amount),
				}))}
				formatValue={(v) => formatPeso(v)}
				barColor="bg-status-red/70"
			/>
		</div>

		<!-- Category table -->
		<div class="mb-5 overflow-hidden rounded-xl border border-border bg-white">
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
					{#each filteredItems as item}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">
								<span class="mr-2" aria-hidden="true">{item.icon}</span>{item.category}
							</td>
							<td class="px-4 py-3 text-right font-mono text-gray-700">{formatPeso(item.amount)}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-500">
								{currentSales > 0 ? item.pctOfSales + '%' : '—'}
							</td>
							<td class="px-4 py-3">
								<!-- [04] Scale relative to max category amount -->
								<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100" aria-label="{item.category}: {formatPeso(item.amount)}">
									<div class="h-full rounded-full bg-status-red/60" style="width: {(item.amount / maxCategoryAmount) * 100}%"></div>
								</div>
							</td>
						</tr>
					{/each}
					{#if filteredItems.length > 0}
						<tr class="border-t-2 border-border bg-gray-50 font-bold">
							<td class="px-4 py-3 text-gray-900">TOTAL</td>
							<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(totalExpenses)}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-900">
								{currentSales > 0 ? (totalExpenses / currentSales * 100).toFixed(1) + '%' : '—'}
							</td>
							<td></td>
						</tr>
					{/if}
				</tbody>
			</table>
			{#if filteredItems.length === 0}
				<div class="px-4 py-10 text-center text-sm text-gray-400">No expenses recorded for this period.</div>
			{/if}
		</div>

		<!-- [06] Payment method breakdown -->
		{#if paymentBreakdown.length > 0}
			<div class="mb-5 rounded-xl border border-border bg-white p-5">
				<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Payment Method Breakdown</p>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{#each paymentBreakdown as pm}
						<div class="rounded-lg border border-border px-3 py-2.5">
							<p class="text-xs text-gray-400 font-medium">{pm.method}</p>
							<p class="text-sm font-bold font-mono text-gray-900">{formatPeso(pm.amount)}</p>
							{#if totalExpenses > 0}
								<p class="text-[10px] text-gray-400 font-mono">{((pm.amount / totalExpenses) * 100).toFixed(1)}% of total</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- [05] Recent expense entries -->
		{#if recentEntries.length > 0}
			<div class="mb-5 rounded-xl border border-border bg-white overflow-hidden">
				<button
					onclick={() => (showRecentEntries = !showRecentEntries)}
					class="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-border text-left hover:bg-gray-100 transition-colors"
					style="min-height: unset"
				>
					<p class="text-xs font-bold uppercase tracking-wide text-gray-400">Recent Entries ({recentEntries.length})</p>
					{#if showRecentEntries}
						<ChevronDown class="h-4 w-4 text-gray-400" />
					{:else}
						<ChevronRight class="h-4 w-4 text-gray-400" />
					{/if}
				</button>

				{#if showRecentEntries}
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border bg-gray-50">
								<th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
								<th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Category</th>
								<th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Description</th>
								<th class="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
								<th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Paid By</th>
								<th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Logged By</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each recentEntries as entry (entry.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-2 text-xs text-gray-500 font-mono whitespace-nowrap">
										{new Date(entry.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
									</td>
									<td class="px-4 py-2 text-gray-700 whitespace-nowrap">
										<span aria-hidden="true">{getCategoryIcon(entry.category)}</span> {entry.category}
									</td>
									<td class="px-4 py-2 text-gray-600 max-w-[200px] truncate">{entry.description}</td>
									<td class="px-4 py-2 text-right font-mono font-semibold text-gray-900">{formatPeso(entry.amount)}</td>
									<td class="px-4 py-2 text-xs text-gray-500">{entry.paidBy}</td>
									<td class="px-4 py-2 text-xs text-gray-500">{entry.createdBy}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		{/if}

		<!-- Month-over-Month section (only for 'This Month') -->
		{#if period === 'month'}
			<div class="rounded-xl border border-border bg-white overflow-hidden">
				<div class="border-b border-border bg-gray-50 px-5 py-3 flex items-center gap-3">
					<p class="text-xs font-bold uppercase tracking-wide text-gray-400">Month-over-Month</p>
					{#if !hasPrevMonthData}
						<!-- [01] No prior data banner -->
						<span class="rounded-full border border-status-yellow/30 bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-status-yellow">
							No prior month data
						</span>
					{:else if momFlaggedCount > 0}
						<span class="rounded-full border border-status-red/20 bg-status-red-light px-2 py-0.5 text-xs font-semibold text-status-red">
							⚠ {momFlaggedCount} spike{momFlaggedCount !== 1 ? 's' : ''}
						</span>
					{/if}
				</div>

				{#if !hasPrevMonthData}
					<!-- [01] Empty previous month — show informative message -->
					<div class="px-5 py-8 text-center">
						<p class="text-sm text-gray-500">No expense data for the previous month.</p>
						<p class="text-xs text-gray-400 mt-1">Month-over-month comparison will be available once two months of data exist.</p>
						<div class="mt-4 grid grid-cols-2 gap-4 max-w-sm mx-auto">
							<KpiCard label="This Month" value={formatPeso(momTotalCurrent)} />
							<KpiCard label="Entries Logged" value={String(currentMonthExpenses.length)} sub="this month" />
						</div>
					</div>
				{:else}
					<!-- MoM KPI row -->
					<div class="grid grid-cols-3 gap-4 p-5 border-b border-border">
						<KpiCard label="This Month" value={formatPeso(momTotalCurrent)} />
						<KpiCard label="Last Month" value={formatPeso(momTotalPrevious)} />
						<KpiCard
							label="MoM Change"
							value="{momTotalVariance > 0 ? '+' : ''}{momTotalVariance.toFixed(1)}%"
							change={momTotalVariance}
							changeLabel="vs last month"
							variant={momTotalVariance > 10 ? 'danger' : momTotalVariance > 0 ? 'default' : 'success'}
						/>
					</div>

					<!-- MoM table -->
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
							{#each momRows as row}
								<tr class={cn('hover:bg-gray-50', row.flagged && 'bg-status-red-light/30')}>
									<td class="px-4 py-3 font-medium text-gray-900">
										<span class="mr-2" aria-hidden="true">{row.icon}</span>{row.category}
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
								<td class="px-4 py-3 text-right font-mono text-gray-900">{formatPeso(momTotalCurrent)}</td>
								<td class="px-4 py-3 text-right font-mono text-gray-500">{formatPeso(momTotalPrevious)}</td>
								<td class={cn(
									'px-4 py-3 text-right font-mono font-bold',
									momTotalVariance > 10 ? 'text-status-red' : momTotalVariance > 0 ? 'text-status-yellow' : 'text-status-green'
								)}>
									{momTotalVariance > 0 ? '+' : ''}{momTotalVariance.toFixed(1)}%
								</td>
								<td></td>
							</tr>
						</tbody>
					</table>
				{/if}
			</div>
		{/if}
	{/snippet}
</ReportShell>
