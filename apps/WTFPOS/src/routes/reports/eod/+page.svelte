<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { eodSummary } from '$lib/stores/reports.svelte';
	import { allExpenses } from '$lib/stores/expenses.svelte';

	const summary = $derived(eodSummary());

	let closingActual = $state(0);
	const openingCash    = 5000;
	const cashExpenses   = $derived(
		allExpenses
			.filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString() && e.paidBy === 'Cash from Register')
			.reduce((s, e) => s + e.amount, 0)
	);
	const closingExpected = $derived(openingCash + summary.cash - cashExpenses);
	const cashVariance    = $derived(closingActual - closingExpected);

	let isBlindCloseSubmitted = $state(false);

	const payments = $derived([
		{ label: 'Cash',  amount: summary.cash,  icon: '💵' },
		{ label: 'Card',  amount: summary.card,  icon: '💳' },
		{ label: 'GCash', amount: summary.gcash, icon: '📱' },
	]);

	const salesItems = $derived([
		{ label: 'Gross Sales',      value: summary.grossSales,     style: 'font-bold text-gray-900' },
		{ label: 'Less: Discounts', value: -summary.discounts,     style: 'text-status-red' },
		{ label: 'Net Sales',        value: summary.netSales,       style: 'font-semibold text-gray-900 border-t border-border pt-1' },
		{ label: 'VAT (12%)',        value: summary.vatAmount,      style: 'text-gray-500' },
	]);

	const cashRecon = $derived([
		{ label: 'Opening Cash Float', value: openingCash,            style: '' },
		{ label: 'Cash Collected',     value: summary.cash,           style: '' },
		{ label: 'Less: Cash Expenses',value: -cashExpenses,          style: 'text-status-red' },
		{ label: 'Expected Closing',   value: closingExpected,        style: 'font-semibold border-t border-border pt-1' },
	]);
</script>

<!-- Live indicator -->
<div class="mb-4 flex items-center gap-2">
	<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">{summary.date}</h2>
	<span class="flex items-center gap-1.5 text-xs text-status-green">
		<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
		Live totals
	</span>
</div>

<div class="grid grid-cols-[1fr_380px] gap-6">
	<!-- Left: breakdown -->
	<div class="flex flex-col gap-4">
		{#if isBlindCloseSubmitted}
			<!-- Sales summary -->
			<div class="rounded-xl border border-border bg-white p-5 fadeIn">
				<h2 class="mb-4 font-bold text-gray-900">Sales Summary</h2>
				<div class="flex flex-col gap-2">
					{#each salesItems as item}
						<div class={cn('flex items-center justify-between', item.style)}>
							<span class="text-sm text-gray-600">{item.label}</span>
							<span class={cn('font-mono text-sm', item.value < 0 ? 'text-status-red' : '')}>
								{item.value < 0 ? `−${formatPeso(-item.value)}` : formatPeso(item.value)}
							</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Payment breakdown -->
			<div class="rounded-xl border border-border bg-white p-5 fadeIn">
				<h2 class="mb-4 font-bold text-gray-900">Payment Breakdown</h2>
				<div class="flex gap-4">
					{#each payments as p}
						<div class="flex-1 rounded-lg border border-border bg-gray-50 p-4 text-center">
							<div class="mb-1 text-2xl">{p.icon}</div>
							<p class="text-xs font-medium text-gray-400">{p.label}</p>
							<p class="mt-0.5 font-mono text-lg font-bold text-gray-900">{formatPeso(p.amount)}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Cash reconciliation -->
			<div class="rounded-xl border border-border bg-white p-5 fadeIn">
				<h2 class="mb-4 font-bold text-gray-900">Cash Reconciliation</h2>
				<div class="flex flex-col gap-2">
					{#each cashRecon as item}
						<div class={cn('flex items-center justify-between', item.style)}>
							<span class="text-sm text-gray-600">{item.label}</span>
							<span class={cn('font-mono text-sm', item.value < 0 ? 'text-status-red' : 'text-gray-900')}>
								{item.value < 0 ? `−${formatPeso(-item.value)}` : formatPeso(item.value)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
				<div class="text-4xl mb-3">🙈</div>
				<h3 class="font-bold text-gray-900 mb-2">Detailed Reports Hidden</h3>
				<p class="text-sm text-gray-500 max-w-[280px]">Submit your drawer cash count on the right to unlock today's detailed sales and variance reports.</p>
			</div>
		{/if}
	</div>

	<!-- Right: actual cash input -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<h2 class="mb-1 font-bold text-gray-900">Actual Cash Count</h2>
			{#if !isBlindCloseSubmitted}
				<p class="mb-4 text-xs text-status-red font-bold uppercase tracking-wider">Blind Close Active</p>
				<p class="mb-4 text-xs text-gray-500">You must count and declare your drawer cash before seeing expected totals or variances.</p>
			{:else}
				<p class="mb-4 text-xs text-gray-400">Cash declared. Here is your variance.</p>
			{/if}

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Cash in Drawer (₱)</span>
				<input type="number" bind:value={closingActual} disabled={isBlindCloseSubmitted} class="pos-input font-mono text-lg" min="0" step="100" />
			</div>

			<!-- Variance Display -->
			{#if isBlindCloseSubmitted}
				<div class={cn(
					'mt-4 rounded-lg border px-4 py-3',
					closingActual === 0 ? 'border-gray-200 bg-gray-50'
						: cashVariance === 0 ? 'border-status-green/20 bg-status-green-light'
						: cashVariance > 0  ? 'border-status-yellow/30 bg-status-yellow-light'
						: 'border-status-red/20 bg-status-red-light'
				)}>
					<p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
						{closingActual === 0 ? 'Enter amount to reconcile' : cashVariance === 0 ? 'Balanced ✓' : cashVariance > 0 ? 'Cash Over' : 'Cash Short'}
					</p>
					{#if closingActual !== 0}
						<p class={cn('mt-0.5 font-mono text-2xl font-bold',
							cashVariance === 0 ? 'text-status-green' : cashVariance > 0 ? 'text-status-yellow' : 'text-status-red'
						)}>
							{cashVariance > 0 ? `+${formatPeso(cashVariance)}` : cashVariance < 0 ? `−${formatPeso(-cashVariance)}` : '₱0.00'}
						</p>
					{/if}
				</div>
			{/if}
		</div>

		<div class="rounded-xl border border-border bg-white p-5">
			<h2 class="mb-3 font-bold text-gray-900">Finalize EOD</h2>
			{#if !isBlindCloseSubmitted}
				<p class="mb-4 text-xs text-gray-400">Please declare your actual cash count to unlock today's detailed data.</p>
				<button 
					class="btn-primary w-full"
					onclick={() => isBlindCloseSubmitted = true}
					disabled={closingActual <= 0}
				>Declare Drawer Count</button>
			{:else}
				<p class="mb-4 text-xs text-gray-400">Submitting will lock today's records and generate the EOD report.</p>
				<button class="btn-primary w-full">Submit EOD Report</button>
				<button class="btn-secondary mt-2 w-full">Export to PDF</button>
			{/if}
		</div>

		<div class="rounded-xl border border-border bg-white p-5">
			<h2 class="mb-3 font-bold text-gray-900">Finalize EOD</h2>
			<p class="mb-4 text-xs text-gray-400">Submitting will lock today's records and generate the EOD report.</p>
			<button class="btn-primary w-full">Submit EOD Report</button>
			<button class="btn-secondary mt-2 w-full">Export to PDF</button>
		</div>
	</div>
</div>
