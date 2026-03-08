<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { allExpenses, expenseCategories, addExpense } from '$lib/stores/expenses.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { netSalesByPeriod } from '$lib/stores/reports.svelte';
	import PhotoCapture from '$lib/components/PhotoCapture.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	type Period = 'today' | 'week' | 'month';
	let period = $state<Period>('today');

	// ── Expense entry form ────────────────────────────────────────────────────
	const categoryIcons: Record<string, string> = {
		'Meat Procurement': '🥩',
		'Produce & Sides':  '🥬',
		'Utilities':        '💡',
		'Wages':            '👷',
		'Rent':             '🏠',
		'Miscellaneous':    '📦',
		'Labor Budget':     '💼',
		'Petty Cash':       '💰',
	};
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

	// Auto-open from quick action
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
		if (!entryCategory)                        { entryError = 'Pick a category'; return; }
		if (!entryAmount || Number(entryAmount) <= 0) { entryError = 'Enter a valid amount'; return; }
		if (!entryDesc.trim())                     { entryError = 'Add a description'; return; }

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

	interface ExpenseItem {
		category: string;
		icon: string;
		amount: number;
		pctOfSales: number;
	}

	const salesData = $derived({
		today: netSalesByPeriod('today'),
		week:  netSalesByPeriod('week'),
		month: netSalesByPeriod('month'),
	});

	function getISOWeekMonday(d: Date): Date {
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
	}

	function filterExpensesByPeriod(p: Period) {
		const now = new Date();
		const todayStr = now.toDateString();
		const weekStart = getISOWeekMonday(now);
		const locId = session.locationId;
		return allExpenses.value.filter(e => {
			if (locId !== 'all' && e.locationId !== locId) return false;
			const d = new Date(e.createdAt);
			if (p === 'today') return d.toDateString() === todayStr;
			if (p === 'week')  return d >= weekStart;
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

<!-- ── Log Expense trigger button ───────────────────────────────────────── -->
<div class="mb-5">
	<button
		onclick={() => { formOpen = true; }}
		class="btn-primary flex items-center gap-2 shadow-sm"
	>
		<span class="flex h-5 w-5 items-center justify-center rounded text-sm font-bold">+</span>
		Log New Expense
	</button>
</div>

<!-- ── Expense entry modal ─────────────────────────────────────────────── -->
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
						>
							<span class="text-lg leading-none">{categoryIcons[cat] ?? '📦'}</span>
							<span class="text-center leading-tight">{cat}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Amount -->
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

				<!-- Payment method -->
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

			<!-- Description -->
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

			<!-- Receipt photo -->
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
		<p class="mt-1 text-2xl font-bold text-gray-900">{current.sales > 0 ? (totalExpenses / current.sales * 100).toFixed(1) + '%' : '—'}</p>
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
