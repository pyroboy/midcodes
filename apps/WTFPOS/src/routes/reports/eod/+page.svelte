<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';

	// Mock EOD summary
	const summary = {
		date: 'March 3, 2026',
		branch: 'Quezon City Branch',
		grossSales: 34696,
		discounts: 948,
		netSales: 33748,
		vatAmount: 3618,
		cash: 18000,
		card: 13748,
		gcash: 2000,
		cashExpenses: 1250,
		openingCash: 5000,
		closingExpected: 21750  // 5000 + 18000 - 1250
	};

	let closingActual = $state(21500);
	const cashVariance = $derived(closingActual - summary.closingExpected);

	const payments = [
		{ label: 'Cash',   amount: summary.cash,   icon: '💵' },
		{ label: 'Card',   amount: summary.card,   icon: '💳' },
		{ label: 'GCash',  amount: summary.gcash,  icon: '📱' }
	];

	const salesItems = [
		{ label: 'Gross Sales',        value: summary.grossSales,  style: 'font-bold text-gray-900' },
		{ label: 'Less: Discounts',    value: -summary.discounts,  style: 'text-status-red' },
		{ label: 'Net Sales',          value: summary.netSales,    style: 'font-semibold text-gray-900 border-t border-border pt-1' },
		{ label: 'VAT (12%)',          value: summary.vatAmount,   style: 'text-gray-500' }
	];

	const cashRecon = [
		{ label: 'Opening Cash Float', value: summary.openingCash,     style: '' },
		{ label: 'Cash Collected',     value: summary.cash,            style: '' },
		{ label: 'Less: Cash Expenses',value: -summary.cashExpenses,   style: 'text-status-red' },
		{ label: 'Expected Closing',   value: summary.closingExpected, style: 'font-semibold border-t border-border pt-1' }
	];
</script>

<div class="grid grid-cols-[1fr_380px] gap-6">
	<!-- Left: breakdown -->
	<div class="flex flex-col gap-4">
		<!-- Sales summary card -->
		<div class="rounded-xl border border-border bg-white p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-bold text-gray-900">Sales Summary</h2>
				<div class="text-right">
					<p class="text-xs text-gray-400">{summary.date}</p>
					<p class="text-xs font-medium text-gray-500">{summary.branch}</p>
				</div>
			</div>
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
		<div class="rounded-xl border border-border bg-white p-5">
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
		<div class="rounded-xl border border-border bg-white p-5">
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
	</div>

	<!-- Right: actual cash input + status -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<h2 class="mb-1 font-bold text-gray-900">Actual Cash Count</h2>
			<p class="mb-4 text-xs text-gray-400">Enter the physical cash you counted at end of shift</p>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Cash in Drawer (₱)</label>
				<input
					type="number"
					bind:value={closingActual}
					class="pos-input font-mono text-lg"
					min="0"
					step="100"
				/>
			</div>

			<div class={cn(
				'mt-4 rounded-lg border px-4 py-3',
				cashVariance === 0
					? 'border-status-green/20 bg-status-green-light'
					: cashVariance > 0
						? 'border-status-yellow/30 bg-status-yellow-light'
						: 'border-status-red/20 bg-status-red-light'
			)}>
				<p class="text-xs font-semibold uppercase tracking-wide" class:text-status-green={cashVariance === 0} class:text-status-yellow={cashVariance > 0} class:text-status-red={cashVariance < 0}>
					{cashVariance === 0 ? 'Balanced ✓' : cashVariance > 0 ? 'Cash Over' : 'Cash Short'}
				</p>
				<p class={cn('mt-0.5 font-mono text-2xl font-bold',
					cashVariance === 0 ? 'text-status-green' : cashVariance > 0 ? 'text-status-yellow' : 'text-status-red'
				)}>
					{cashVariance > 0 ? `+${formatPeso(cashVariance)}` : cashVariance < 0 ? `−${formatPeso(-cashVariance)}` : '₱0.00'}
				</p>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-white p-5">
			<h2 class="mb-3 font-bold text-gray-900">Finalize EOD</h2>
			<p class="mb-4 text-xs text-gray-400">Submitting will lock today's records and generate the EOD report.</p>
			<button class="btn-primary w-full">Submit EOD Report</button>
			<button class="btn-secondary mt-2 w-full">Export to PDF</button>
		</div>
	</div>
</div>
