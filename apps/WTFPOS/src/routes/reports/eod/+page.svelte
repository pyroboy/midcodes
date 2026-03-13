<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import {
		eodSummary, salesSummary, utilitySettings, getPreviousUtilityReading, saveUtilityReading,
		zReadHistory, saveZRead
	} from '$lib/stores/reports.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import { allExpenses, addExpense, allTemplates, getCategoryIcon } from '$lib/stores/expenses.svelte';
	import type { ExpenseTemplate } from '$lib/stores/expenses.svelte';
	import { tables } from '$lib/stores/pos.svelte';
	import { session, getCurrentLocation } from '$lib/stores/session.svelte';
	import { getActiveShift, closeShift } from '$lib/stores/pos/shifts.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { X, AlertTriangle, CheckCircle2, History, Lock } from 'lucide-svelte';

	let showModal = $state(false);
	// P1-23: Confirmation state before opening the EOD modal
	let showEodConfirm = $state(false);

	// Auto-open from quick action
	$effect(() => {
		if (page.url.searchParams.get('action') === 'open') {
			showModal = true;
			goto('/reports/eod', { replaceState: true, noScroll: true });
		}
	});

	const summary = $derived(eodSummary());
	const sales = $derived(salesSummary());

	// ─── Open-table guard ───────────────────────────────────────────────────────
	const openTablesCount = $derived(
		tables.value.filter(t =>
			(session.locationId === 'all' || t.locationId === session.locationId) &&
			t.status !== 'available' && t.status !== 'maintenance'
		).length
	);

	// ─── Stale-shift detection ──────────────────────────────────────────────────
	const yesterdayKey = (() => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return d.toISOString().slice(0, 10);
	})();

	const hasYesterdayZRead = $derived(
		zReadHistory.value.some(z =>
			z.date === yesterdayKey &&
			(session.locationId === 'all' || z.locationId === session.locationId)
		)
	);

	const todayKey = $derived(new Date().toISOString().slice(0, 10));
	const todayZRead = $derived(
		zReadHistory.value.find(z =>
			z.date === todayKey &&
			(session.locationId === 'all' || z.locationId === session.locationId)
		)
	);

	let closingActual = $state(0);
	const activeShift = $derived(getActiveShift());
	const openingCash = $derived(activeShift?.openingFloat ?? 0);
	const cashExpenses   = $derived(
		allExpenses.value
			.filter(e =>
				(session.locationId === 'all' || e.locationId === session.locationId) &&
				new Date(e.createdAt).toDateString() === new Date().toDateString() &&
				e.paidBy === 'Cash from Register'
			)
			.reduce((s, e) => s + e.amount, 0)
	);
	const closingExpected = $derived(openingCash + summary.cash - cashExpenses);
	const cashVariance    = $derived(closingActual - closingExpected);

	let isBlindCloseSubmitted = $state(false);

	const payments = $derived([
		{ label: 'Cash',          amount: summary.cash,  icon: '💵' },
		{ label: 'GCash',         amount: summary.gcash, icon: '📱' },
		{ label: 'Maya',          amount: summary.maya,  icon: '🟢' },
		{ label: 'Credit/Debit',  amount: summary.card,  icon: '💳' },
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

	// ─── Utilities ─────────────────────────────────────────────────────────────
	const previousReading = $derived(getPreviousUtilityReading());
	let currentElec  = $state<number | ''>('');
	let currentGas   = $state<number | ''>('');
	let currentWater = $state<number | ''>('');

	// P1-1: Editable utility rates (defaults from utilitySettings)
	let showRateSettings = $state(false);
	let rateElec  = $state(utilitySettings.electricityPerKwh);
	let rateGas   = $state(utilitySettings.gasPerKg);
	let rateWater = $state(utilitySettings.waterPerM3 ?? 50);

	const elecUsed = $derived(
		typeof currentElec === 'number' && previousReading
			? Math.max(0, currentElec - previousReading.electricity)
			: 0
	);
	const gasUsed = $derived(
		typeof currentGas === 'number' && previousReading
			? Math.max(0, currentGas - previousReading.gas)
			: 0
	);
	const waterUsed = $derived(
		typeof currentWater === 'number' && previousReading
			? Math.max(0, currentWater - (previousReading.water ?? 0))
			: 0
	);

	const elecCost  = $derived(elecUsed  * rateElec);
	const gasCost   = $derived(gasUsed   * rateGas);
	const waterCost = $derived(waterUsed * rateWater);
	const totalUtilCost = $derived(elecCost + gasCost + waterCost);

	// ─── Daily Fixed Costs ─────────────────────────────────────────────────────
	const dailyTemplates = $derived(
		allTemplates.value.filter(t =>
			t.isActive &&
			(t.recurrence === 'daily' || t.recurrence === 'monthly') &&
			(session.locationId === 'all' || t.locationId === session.locationId)
		)
	);

	// Track checked state and editable amounts for each template
	let fixedCostChecks = $state<Record<string, boolean>>({});
	let fixedCostAmounts = $state<Record<string, number>>({});

	// Initialize checks/amounts when templates change
	$effect(() => {
		const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
		for (const tpl of dailyTemplates) {
			if (!(tpl.id in fixedCostChecks)) fixedCostChecks[tpl.id] = true;
			if (!(tpl.id in fixedCostAmounts)) {
				fixedCostAmounts[tpl.id] = tpl.recurrence === 'monthly'
					? Math.round(tpl.defaultAmount / daysInMonth * 100) / 100
					: tpl.defaultAmount;
			}
		}
	});

	const totalFixedCosts = $derived(
		dailyTemplates.reduce((sum, tpl) =>
			sum + (fixedCostChecks[tpl.id] ? (fixedCostAmounts[tpl.id] ?? 0) : 0), 0)
	);

	let eodSubmitted = $state(false);
	let submitError = $state('');

	// 7-day Z-read trend chart
	const zReadTrendChart = $derived.by(() => {
		const todayIso = new Date().toISOString().slice(0, 10);
		const days: { key: string; label: string }[] = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const key = d.toISOString().slice(0, 10);
			days.push({ key, label: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) });
		}
		const locId = session.locationId;
		return days.map(({ key, label }) => {
			const zread = zReadHistory.value.find(z =>
				z.date === key && (locId === 'all' || z.locationId === locId)
			);
			return {
				label,
				primary: zread?.grossSales ?? 0,
				highlight: key === todayIso,
			};
		});
	});

	async function submitEOD() {
		if (openTablesCount > 0) {
			submitError = `${openTablesCount} table${openTablesCount > 1 ? 's are' : ' is'} still open. Close all tables before submitting the Z-Read.`;
			return;
		}
		submitError = '';
		if (typeof currentElec === 'number' || typeof currentGas === 'number' || typeof currentWater === 'number') {
			const elec  = typeof currentElec   === 'number' ? currentElec   : (previousReading?.electricity ?? 0);
			const gas   = typeof currentGas    === 'number' ? currentGas    : (previousReading?.gas         ?? 0);
			const water = typeof currentWater  === 'number' ? currentWater  : (previousReading?.water       ?? 0);
			saveUtilityReading(elec, gas, water);
			// P0-1: Auto-create expense records so utility costs appear in expense reports
			const paidBy = session.userName || 'Manager';
			if (elecCost  > 0) await addExpense('Electricity', elecCost,  `EOD Electricity (${elecUsed} kWh × ₱${rateElec}/kWh)`,  paidBy);
			if (gasCost   > 0) await addExpense('Gas / LPG',   gasCost,   `EOD Gas/LPG (${gasUsed} kg × ₱${rateGas}/kg)`,           paidBy);
			if (waterCost > 0) await addExpense('Water',        waterCost, `EOD Water (${waterUsed} m³ × ₱${rateWater}/m³)`,          paidBy);
		}
		// Auto-log checked daily fixed costs as expenses
		const fixedPaidBy = session.userName || 'Manager';
		for (const tpl of dailyTemplates) {
			if (fixedCostChecks[tpl.id] && (fixedCostAmounts[tpl.id] ?? 0) > 0) {
				const amt = fixedCostAmounts[tpl.id];
				const suffix = tpl.recurrence === 'monthly' ? ' (daily prorate)' : '';
				await addExpense(tpl.category, amt, `EOD: ${tpl.description}${suffix}`, tpl.paidBy || fixedPaidBy);
			}
		}
		await saveZRead({
			date: todayKey,
			locationId: session.locationId,
			submittedAt: new Date().toISOString(),
			submittedBy: session.userName || 'Manager',
			grossSales: summary.grossSales,
			discounts: summary.discounts,
			netSales: summary.netSales,
			vatAmount: summary.vatAmount,
			totalPax: 0,
			cash: summary.cash,
			gcash: summary.gcash,
			maya: summary.maya,
			card: summary.card,
			cashExpenses,
			openingCash,
			closingActual,
			cashVariance,
		});
		await closeShift(closingActual);
		eodSubmitted = true;
	}
</script>

<!-- ─── EOD Modal ───────────────────────────────────────────────────────────── -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
		<div class="pos-card w-full max-w-[460px] mx-3 max-h-[90vh] overflow-y-auto flex flex-col gap-5">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">End of Day</h3>
				<button onclick={() => (showModal = false)} class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Step 1: Actual Cash Count -->
			<div class="rounded-xl border border-border bg-surface-secondary p-4 flex flex-col gap-3">
				<div>
					<h4 class="font-bold text-gray-900">Actual Cash Count</h4>
					{#if !isBlindCloseSubmitted}
						<p class="text-xs text-status-red font-bold uppercase tracking-wider mt-0.5">Blind Close Active</p>
						<p class="text-xs text-gray-500 mt-1">Count and declare your drawer cash before seeing expected totals.</p>
					{:else}
						<p class="text-xs text-gray-400 mt-0.5">Cash declared. Variance shown below.</p>
					{/if}
				</div>

				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Cash in Drawer (₱)</span>
					<input type="number" bind:value={closingActual} disabled={isBlindCloseSubmitted} class="pos-input font-mono text-lg" min="0" step="100" />
				</div>

				{#if !isBlindCloseSubmitted}
					<button
						class="btn-primary w-full"
						onclick={() => (isBlindCloseSubmitted = true)}
						disabled={closingActual <= 0}
					>Declare Drawer Count</button>
				{:else}
					<div class={cn(
						'rounded-lg border px-4 py-3',
						closingActual === 0 ? 'border-gray-200 bg-gray-50'
							: cashVariance === 0 ? 'border-status-green/20 bg-status-green-light'
							: cashVariance > 0  ? 'border-status-yellow/30 bg-status-yellow-light'
							: 'border-status-red/20 bg-status-red-light'
					)}>
						<p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
							{closingActual === 0 ? 'Enter amount' : cashVariance === 0 ? 'Balanced' : cashVariance > 0 ? 'Cash Over' : 'Cash Short'}
						</p>
						{#if closingActual !== 0}
							<p class={cn('mt-0.5 font-mono text-lg sm:text-2xl font-bold',
								cashVariance === 0 ? 'text-status-green' : cashVariance > 0 ? 'text-status-yellow' : 'text-status-red'
							)}>
								{cashVariance > 0 ? `+${formatPeso(cashVariance)}` : cashVariance < 0 ? `−${formatPeso(-cashVariance)}` : '₱0.00'}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Daily Fixed Costs (enabled after blind close) -->
			{#if dailyTemplates.length > 0}
				<div class={cn(
					'rounded-xl border border-border bg-surface-secondary p-4 flex flex-col gap-3 transition-opacity',
					!isBlindCloseSubmitted && 'opacity-40 pointer-events-none'
				)}>
					<div>
						<h4 class="font-bold text-gray-900">Daily Fixed Costs</h4>
						<p class="text-xs text-gray-500 mt-0.5">Confirm recurring costs. Uncheck to skip. Amounts are editable.</p>
					</div>
					<div class="flex flex-col gap-2">
						{#each dailyTemplates as tpl (tpl.id)}
							<div class="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
								<input
									type="checkbox"
									bind:checked={fixedCostChecks[tpl.id]}
									disabled={eodSubmitted}
									class="h-5 w-5 rounded border-gray-300 text-accent accent-accent"
								/>
								<span class="text-sm flex-1">
									<span class="mr-1.5">{getCategoryIcon(tpl.category)}</span>
									{tpl.description}
									{#if tpl.recurrence === 'monthly'}
										<span class="text-[10px] text-gray-400 ml-1">(prorated)</span>
									{/if}
								</span>
								<input
									type="number"
									bind:value={fixedCostAmounts[tpl.id]}
									disabled={eodSubmitted || !fixedCostChecks[tpl.id]}
									class="pos-input w-24 text-right font-mono text-sm py-1.5"
									min="0"
									step="1"
								/>
							</div>
						{/each}
					</div>
					{#if totalFixedCosts > 0}
						<div class="flex justify-between text-sm font-semibold border-t border-border pt-2">
							<span class="text-gray-600">Fixed Costs Total</span>
							<span class="font-mono text-status-red">{formatPeso(totalFixedCosts)}</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Step 2: Utility Readings (enabled after blind close) -->
			<div class={cn(
				'rounded-xl border border-border bg-surface-secondary p-4 flex flex-col gap-3 transition-opacity',
				!isBlindCloseSubmitted && 'opacity-40 pointer-events-none'
			)}>
				<div>
					<h4 class="font-bold text-gray-900">Utility Readings</h4>
					<p class="text-xs text-gray-500 mt-0.5">Record today's meter readings to estimate daily utility usage.</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Electricity (kWh)</span>
						<input type="number" bind:value={currentElec} class="pos-input font-mono" min="0" disabled={eodSubmitted} placeholder={previousReading ? String(previousReading.electricity) : '0'} />
						<span class="text-[10px] text-gray-400">Prev: {previousReading ? previousReading.electricity : '—'}</span>
					</div>
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Gas (kg)</span>
						<input type="number" bind:value={currentGas} class="pos-input font-mono" min="0" disabled={eodSubmitted} placeholder={previousReading ? String(previousReading.gas) : '0'} />
						<span class="text-[10px] text-gray-400">Prev: {previousReading ? previousReading.gas : '—'}</span>
					</div>
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Water (m³)</span>
						<input type="number" bind:value={currentWater} class="pos-input font-mono" min="0" disabled={eodSubmitted} placeholder={previousReading ? String(previousReading.water ?? '0') : '0'} />
						<span class="text-[10px] text-gray-400">Prev: {previousReading ? (previousReading.water ?? '—') : '—'}</span>
					</div>
				</div>

				<!-- P1-1: Editable utility rates -->
				<button
					type="button"
					onclick={() => (showRateSettings = !showRateSettings)}
					class="text-[10px] text-gray-400 hover:text-gray-600 self-start underline underline-offset-2"
				>
					{showRateSettings ? 'Hide' : 'Edit'} rates (₱{rateElec}/kWh · ₱{rateGas}/kg · ₱{rateWater}/m³)
				</button>
				{#if showRateSettings}
					<div class="grid grid-cols-3 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-semibold uppercase text-gray-400">₱ / kWh</span>
							<input type="number" bind:value={rateElec} class="pos-input text-sm font-mono py-1.5" min="0" step="0.5" />
						</div>
						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-semibold uppercase text-gray-400">₱ / kg gas</span>
							<input type="number" bind:value={rateGas} class="pos-input text-sm font-mono py-1.5" min="0" step="1" />
						</div>
						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-semibold uppercase text-gray-400">₱ / m³ water</span>
							<input type="number" bind:value={rateWater} class="pos-input text-sm font-mono py-1.5" min="0" step="1" />
						</div>
					</div>
				{/if}

				{#if (typeof currentElec === 'number' || typeof currentGas === 'number' || typeof currentWater === 'number') && previousReading}
					<div class="rounded-lg bg-white p-3 border border-gray-100">
						{#if elecUsed > 0}
						<div class="flex justify-between text-sm mb-1">
							<span class="text-gray-500">⚡ Electricity ({elecUsed} kWh)</span>
							<span class="font-mono text-gray-700">{formatPeso(elecCost)}</span>
						</div>
						{/if}
						{#if gasUsed > 0}
						<div class="flex justify-between text-sm mb-1">
							<span class="text-gray-500">🔥 Gas ({gasUsed} kg)</span>
							<span class="font-mono text-gray-700">{formatPeso(gasCost)}</span>
						</div>
						{/if}
						{#if waterUsed > 0}
						<div class="flex justify-between text-sm mb-1">
							<span class="text-gray-500">💧 Water ({waterUsed} m³)</span>
							<span class="font-mono text-gray-700">{formatPeso(waterCost)}</span>
						</div>
						{/if}
						<div class="flex justify-between text-sm font-bold border-t border-gray-200 pt-1 mt-1">
							<span class="text-gray-900">Total Est. Cost</span>
							<span class="font-mono text-status-red">{formatPeso(totalUtilCost)}</span>
						</div>
						<p class="text-[10px] text-gray-400 mt-1">Will auto-log as Expenses on submit.</p>
					</div>
				{/if}
			</div>

			<!-- Step 3: Finalize -->
			{#if isBlindCloseSubmitted}
				{#if eodSubmitted}
					<div class="rounded-lg border border-status-green/20 bg-status-green-light px-4 py-3 text-center text-sm font-bold text-status-green">
						Z-Read Saved! EOD Report Submitted.
					</div>
				{:else}
					<div class="flex flex-col gap-2 mt-2">
						{#if openTablesCount > 0}
							<div class="flex items-start gap-2 rounded-lg border border-status-red/20 bg-status-red-light px-3 py-2">
								<AlertTriangle class="w-4 h-4 text-status-red flex-shrink-0 mt-0.5" />
								<p class="text-xs text-status-red font-medium">{openTablesCount} table{openTablesCount > 1 ? 's' : ''} still open. Close all tables first.</p>
							</div>
						{/if}
						{#if submitError}
							<p class="text-xs text-status-red text-center">{submitError}</p>
						{/if}
						<p class="text-xs text-gray-400 text-center">Submitting saves a permanent Z-Read record for BIR compliance.</p>
						<button
							class="btn-primary w-full disabled:opacity-40"
							disabled={openTablesCount > 0}
							onclick={async () => { await submitEOD(); if (eodSubmitted) setTimeout(() => (showModal = false), 1500); }}
						>
							Submit EOD Z-Read
						</button>
					</div>
				{/if}
			{/if}

			{#if !eodSubmitted}
				<button onclick={() => (showModal = false)} class="btn-ghost w-full">Close</button>
			{/if}
		</div>
	</div>
{/if}

<ReportShell>
	{#snippet alerts()}
		<div class="flex flex-col gap-2">
			{#if session.locationId === 'all'}
				<div class="flex items-start gap-3 rounded-xl border border-status-red/30 bg-status-red-light px-4 py-3">
					<AlertTriangle class="w-4 h-4 text-status-red flex-shrink-0 mt-0.5" />
					<div>
						<p class="text-sm font-bold text-status-red">Select a Branch First</p>
						<p class="text-xs text-red-700 mt-0.5">End of Day must be run per branch. Use the location switcher to select Alta Citta or Alona Beach.</p>
					</div>
				</div>
			{/if}

			{#if !hasYesterdayZRead && zReadHistory.value.length === 0}
				<!-- No Z-Read history at all — first day, no warning needed -->
			{:else if !hasYesterdayZRead}
				<div class="flex items-start gap-3 rounded-xl border border-status-yellow/30 bg-status-yellow-light px-4 py-3">
					<AlertTriangle class="w-4 h-4 text-status-yellow flex-shrink-0 mt-0.5" />
					<div>
						<p class="text-sm font-bold text-status-yellow">Stale Shift Detected</p>
						<p class="text-xs text-yellow-700 mt-0.5">No Z-Read was submitted yesterday ({yesterdayKey}). Verify yesterday's records before closing today.</p>
					</div>
				</div>
			{/if}

			{#if openTablesCount > 0}
				<div class="flex items-start gap-3 rounded-xl border border-status-red/20 bg-status-red-light px-4 py-3">
					<AlertTriangle class="w-4 h-4 text-status-red flex-shrink-0 mt-0.5" />
					<div>
						<p class="text-sm font-bold text-status-red">{openTablesCount} Table{openTablesCount > 1 ? 's' : ''} Still Open</p>
						<p class="text-xs text-red-700 mt-0.5">All tables must be closed before submitting the EOD Z-Read.</p>
					</div>
				</div>
			{/if}

			{#if todayZRead}
				<div class="flex items-center gap-3 rounded-xl border border-status-green/20 bg-status-green-light px-4 py-3">
					<CheckCircle2 class="w-4 h-4 text-status-green flex-shrink-0" />
					<div>
						<p class="text-sm font-bold text-status-green">Z-Read Submitted for {todayZRead.date}</p>
						<p class="text-xs text-green-700">By {todayZRead.submittedBy} at {new Date(todayZRead.submittedAt ?? '').toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</p>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet filter()}
		<div class="flex items-center gap-2">
			<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">{summary.date}</h2>
			<span class="flex items-center gap-1.5 text-xs text-status-green">
				<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
				Live totals
			</span>
			{#if !eodSubmitted && !todayZRead}
				<div class="ml-auto flex items-center gap-2">
					{#if showEodConfirm}
						<span class="text-xs font-semibold text-status-red">Close day?</span>
						<button
							onclick={() => { showEodConfirm = false; showModal = true; }}
							class="btn-danger flex items-center gap-2 text-sm"
							disabled={openTablesCount > 0 || session.locationId === 'all'}
						>
							Close Day
						</button>
						<button onclick={() => (showEodConfirm = false)} class="btn-ghost text-sm">
							Cancel
						</button>
					{:else}
						<button
							onclick={() => (showEodConfirm = true)}
							class="btn-primary flex items-center gap-2 shadow-sm"
							disabled={openTablesCount > 0 || session.locationId === 'all'}
						>
							Start End of Day
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 flex-1">
			<KpiCard label="Gross Sales" value={isBlindCloseSubmitted ? formatPeso(summary.grossSales) : '—'} variant="accent" />
			<KpiCard label="Net Sales" value={isBlindCloseSubmitted ? formatPeso(summary.netSales) : '—'} variant="success" />
			<KpiCard label="Cash Variance" value={isBlindCloseSubmitted && closingActual > 0 ? formatPeso(cashVariance) : '—'} variant={cashVariance === 0 ? 'success' : cashVariance > 0 ? 'default' : 'danger'} />
			<KpiCard label="Today's Pax" value={isBlindCloseSubmitted ? String(sales.totalPax ?? 0) : '—'} />
		</div>
	{/snippet}

	{#snippet chart()}
		<!-- 7-day Z-read trend -->
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">7-Day Gross Sales Trend (Z-Reads)</p>
			<div class="relative">
				<ReportBarChart
					data={zReadTrendChart}
					yUnit="₱"
					height={200}
					showSecondary={false}
					primaryColor="#EA580C"
					formatValue={(v) => v === 0 ? 'No Z-Read' : `₱${v.toLocaleString()}`}
				/>
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<!-- Page background: Sales data (always visible once blind close is done) -->
		<div class="flex flex-col gap-4">
			{#if isBlindCloseSubmitted}
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<!-- Sales summary -->
					<div class="rounded-xl border border-border bg-white p-5">
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
					<div class="rounded-xl border border-border bg-white p-5">
						<h2 class="mb-4 font-bold text-gray-900">Payment Breakdown</h2>
						<div class="flex flex-col gap-3">
							{#each payments as p}
								<div class="flex items-center gap-3 rounded-lg border border-border bg-gray-50 px-4 py-3">
									<span class="text-xl">{p.icon}</span>
									<div class="flex-1">
										<p class="text-xs font-medium text-gray-400">{p.label}</p>
										<p class="font-mono text-lg font-bold text-gray-900">{formatPeso(p.amount)}</p>
									</div>
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

						<!-- Variance inline -->
						<div class={cn(
							'mt-4 rounded-lg border px-4 py-3',
							closingActual === 0 ? 'border-gray-200 bg-gray-50'
								: cashVariance === 0 ? 'border-status-green/20 bg-status-green-light'
								: cashVariance > 0  ? 'border-status-yellow/30 bg-status-yellow-light'
								: 'border-status-red/20 bg-status-red-light'
						)}>
							<p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
								{closingActual === 0 ? 'No cash declared' : cashVariance === 0 ? 'Balanced' : cashVariance > 0 ? 'Cash Over' : 'Cash Short'}
							</p>
							{#if closingActual !== 0}
								<p class={cn('mt-0.5 font-mono text-lg sm:text-2xl font-bold',
									cashVariance === 0 ? 'text-status-green' : cashVariance > 0 ? 'text-status-yellow' : 'text-status-red'
								)}>
									{cashVariance > 0 ? `+${formatPeso(cashVariance)}` : cashVariance < 0 ? `−${formatPeso(-cashVariance)}` : '₱0.00'}
								</p>
							{/if}
						</div>
					</div>
				</div>

				{#if eodSubmitted}
					<div class="rounded-xl border border-status-green/30 bg-status-green-light p-4 text-center">
						<p class="text-sm font-bold text-status-green">EOD Report Submitted</p>
					</div>
				{/if}
			{:else}
				<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
					<Lock class="w-8 h-8 text-gray-400 mb-3 mx-auto" />
					<h3 class="font-bold text-gray-900 mb-2">Reports Locked — Blind Count Mode</h3>
					<p class="text-sm text-gray-500 max-w-[280px]">Click "Start End of Day" to begin your blind cash count and unlock today's detailed sales and variance reports.</p>
				</div>
			{/if}
		</div>

		<!-- ─── Z-Read History ────────────────────────────────────────────────────── -->
		{#if zReadHistory.value.length > 0}
			<div class="mt-6">
				<div class="flex items-center gap-2 mb-3">
					<History class="w-4 h-4 text-gray-400" />
					<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Z-Read History</h2>
				</div>
				<div class="overflow-x-auto rounded-xl border border-border bg-white">
					<table class="w-full text-sm min-w-[500px]">
						<thead>
							<tr class="border-b border-border bg-gray-50">
								<th class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
								<th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Gross</th>
								<th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Disc.</th>
								<th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Net</th>
								<th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">VAT</th>
								<th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Cash Var.</th>
								<th class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">By</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each zReadHistory.value.slice(0, 30) as z (z.id)}
								{@const variance = z.cashVariance ?? 0}
								<tr class="hover:bg-gray-50">
									<td class="px-3 py-3 font-mono text-xs text-gray-700">{z.date}</td>
									<td class="px-3 py-3 text-right font-mono text-xs text-gray-700">{formatPeso(z.grossSales)}</td>
									<td class="px-3 py-3 text-right font-mono text-xs text-status-red hidden sm:table-cell">−{formatPeso(z.discounts)}</td>
									<td class="px-3 py-3 text-right font-mono text-xs font-semibold text-gray-900">{formatPeso(z.netSales)}</td>
									<td class="px-3 py-3 text-right font-mono text-xs text-gray-500 hidden md:table-cell">{formatPeso(z.vatAmount)}</td>
									<td class="px-3 py-3 text-right font-mono text-xs {variance === 0 ? 'text-status-green' : variance > 0 ? 'text-status-yellow' : 'text-status-red'}">
										{variance > 0 ? `+${formatPeso(variance)}` : variance < 0 ? `−${formatPeso(-variance)}` : '₱0.00'}
									</td>
									<td class="px-3 py-3 text-right text-xs text-gray-400 hidden sm:table-cell">{z.submittedBy}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/snippet}
</ReportShell>
