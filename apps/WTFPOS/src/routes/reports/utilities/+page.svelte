<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { session } from '$lib/stores/session.svelte';
	import {
		allUtilityReadings,
		addUtilityReading,
		getLastReading,
		UTILITY_CATEGORIES,
		UTILITY_LABELS,
		UTILITY_UNITS,
		UTILITY_COLORS,
		UTILITY_EMOJI,
		type UtilityCategory,
		type UtilityReading,
	} from '$lib/stores/utilities.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportLineChart from '$lib/components/reports/ReportLineChart.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import type { LineChartSeries } from '$lib/components/reports/ReportLineChart.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { Plus, X } from 'lucide-svelte';

	// ── Period filter ────────────────────────────────────────────────────────
	type Period = '3m' | '6m' | '12m' | 'all';
	let period = $state<Period>('6m');

	const periodMonths: Record<Period, number> = { '3m': 3, '6m': 6, '12m': 12, all: 999 };

	// ── Filtered readings ────────────────────────────────────────────────────
	const filteredReadings = $derived.by(() => {
		const locId = session.locationId;
		let readings = allUtilityReadings.value;

		if (locId !== 'all') {
			readings = readings.filter((r) => r.locationId === locId);
		}

		if (period !== 'all') {
			const cutoff = new Date();
			cutoff.setMonth(cutoff.getMonth() - periodMonths[period]);
			const cutoffIso = cutoff.toISOString();
			readings = readings.filter((r) => r.readingDate >= cutoffIso);
		}

		return readings;
	});

	// ── KPI totals ───────────────────────────────────────────────────────────
	const totalCost = $derived(filteredReadings.reduce((s, r) => s + r.totalCost, 0));
	const waterCost = $derived(filteredReadings.filter((r) => r.category === 'water').reduce((s, r) => s + r.totalCost, 0));
	const gasCost = $derived(filteredReadings.filter((r) => r.category === 'gas').reduce((s, r) => s + r.totalCost, 0));
	const elecCost = $derived(filteredReadings.filter((r) => r.category === 'electricity').reduce((s, r) => s + r.totalCost, 0));

	// ── Chart toggle ─────────────────────────────────────────────────────────
	type ChartMode = 'cost' | 'consumption';
	let chartMode = $state<ChartMode>('cost');

	// ── Chart data: aggregate by billingPeriod ───────────────────────────────
	const chartData = $derived.by(() => {
		const periodsSet = new Set<string>();
		for (const r of filteredReadings) periodsSet.add(r.billingPeriod);
		const periods = [...periodsSet].sort();

		const labels = periods;
		const seriesData: LineChartSeries[] = UTILITY_CATEGORIES.map((cat) => {
			const data = periods.map((p) => {
				const match = filteredReadings.find((r) => r.category === cat && r.billingPeriod === p);
				return match ? (chartMode === 'cost' ? match.totalCost : match.consumption) : 0;
			});
			return {
				key: cat,
				label: UTILITY_LABELS[cat],
				color: UTILITY_COLORS[cat],
				data,
			};
		});

		return { labels, series: seriesData };
	});

	// ── Modal form ───────────────────────────────────────────────────────────
	let formOpen = $state(false);
	let formCategory = $state<UtilityCategory>('water');
	let formPrevReading = $state<number | ''>('');
	let formCurrReading = $state<number | ''>('');
	let formRate = $state<number | ''>('');
	let formBillingPeriod = $state(currentMonth());
	let formError = $state('');
	let formSaving = $state(false);
	let formSaved = $state(false);
	let formSavedCost = $state(0);

	function currentMonth(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	}

	// Auto-open via ?action=open
	$effect(() => {
		if (page.url.searchParams.get('action') === 'open') {
			formOpen = true;
			goto('/reports/utilities', { replaceState: true, noScroll: true });
		}
	});

	// Pre-fill previous reading when category changes
	$effect(() => {
		const locId = session.locationId === 'all' ? 'tag' : session.locationId;
		const last = getLastReading(formCategory, locId);
		formPrevReading = last ? last.currentReading : '';
	});

	const liveConsumption = $derived(
		typeof formCurrReading === 'number' && typeof formPrevReading === 'number' && formCurrReading >= formPrevReading
			? formCurrReading - formPrevReading
			: null
	);

	const liveTotalCost = $derived(
		liveConsumption !== null && typeof formRate === 'number'
			? liveConsumption * formRate
			: null
	);

	function resetForm() {
		formPrevReading = '';
		formCurrReading = '';
		formRate = '';
		formBillingPeriod = currentMonth();
		formError = '';
		formSaved = false;
		formSavedCost = 0;
	}

	async function submitReading() {
		if (typeof formPrevReading !== 'number') { formError = 'Enter previous reading'; return; }
		if (typeof formCurrReading !== 'number') { formError = 'Enter current reading'; return; }
		if (formCurrReading < formPrevReading) { formError = 'Current must be ≥ previous'; return; }
		if (typeof formRate !== 'number' || formRate <= 0) { formError = 'Enter a valid rate'; return; }
		if (!formBillingPeriod) { formError = 'Select billing period'; return; }

		formSaving = true;
		formError = '';

		const result = await addUtilityReading({
			category: formCategory,
			previousReading: formPrevReading,
			currentReading: formCurrReading,
			rate: formRate,
			billingPeriod: formBillingPeriod,
		});

		formSaving = false;

		if (!result.success) {
			formError = result.error ?? 'Failed to save';
			return;
		}

		formSaved = true;
		formSavedCost = result.totalCost ?? 0;
	}

	function formatPeriodLabel(bp: string): string {
		const [y, m] = bp.split('-');
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${months[parseInt(m) - 1]} ${y}`;
	}
</script>

<!-- Modal -->
{#if formOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" transition:fade={{ duration: 150 }}>
		<div class="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
			<button onclick={() => { formOpen = false; resetForm(); }} class="absolute right-4 top-4 text-gray-400 hover:text-gray-700">
				<X size={20} />
			</button>

			{#if formSaved}
				<div class="flex flex-col items-center gap-3 py-8 text-center">
					<div class="rounded-full bg-status-green/10 p-4 text-status-green text-3xl">✓</div>
					<p class="text-lg font-bold text-gray-900">Reading Saved!</p>
					<p class="text-sm text-gray-500">
						{formatPeso(formSavedCost)} expense auto-logged.
					</p>
					<button
						onclick={() => { resetForm(); }}
						class="btn-primary mt-2"
					>
						Add Another
					</button>
				</div>
			{:else}
				<h3 class="mb-4 text-lg font-bold text-gray-900">Log Utility Reading</h3>

				<!-- Category pills -->
				<div class="mb-4 flex gap-2">
					{#each UTILITY_CATEGORIES as cat}
						<button
							onclick={() => { formCategory = cat; formError = ''; }}
							class={cn(
								'flex-1 rounded-xl py-3 text-center text-sm font-semibold transition-all',
								formCategory === cat
									? 'text-white shadow-md'
									: 'border border-border bg-white text-gray-500 hover:bg-gray-50'
							)}
							style={formCategory === cat ? `background: ${UTILITY_COLORS[cat]}` : ''}
						>
							{UTILITY_EMOJI[cat]} {UTILITY_LABELS[cat]}
						</button>
					{/each}
				</div>

				<!-- Form fields -->
				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<label class="block">
							<span class="text-xs font-medium text-gray-500">Previous Reading</span>
							<input
								type="number"
								class="pos-input mt-1 w-full"
								placeholder="0"
								bind:value={formPrevReading}
								min="0"
								step="any"
							/>
						</label>
						<label class="block">
							<span class="text-xs font-medium text-gray-500">Current Reading</span>
							<input
								type="number"
								class="pos-input mt-1 w-full"
								placeholder="0"
								bind:value={formCurrReading}
								min="0"
								step="any"
							/>
						</label>
					</div>

					<label class="block">
						<span class="text-xs font-medium text-gray-500">Rate (₱ per {UTILITY_UNITS[formCategory]})</span>
						<input
							type="number"
							class="pos-input mt-1 w-full"
							placeholder="0.00"
							bind:value={formRate}
							min="0"
							step="any"
						/>
					</label>

					<!-- Live computation -->
					{#if liveConsumption !== null}
						<div class="rounded-xl border border-border bg-surface-secondary p-3">
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-500">Consumption</span>
								<span class="font-mono font-bold text-gray-900">
									{liveConsumption.toLocaleString()} {UTILITY_UNITS[formCategory]}
								</span>
							</div>
							{#if liveTotalCost !== null}
								<div class="mt-1 flex items-center justify-between text-sm">
									<span class="text-gray-500">Total Cost</span>
									<span class="font-mono font-bold text-accent">
										{formatPeso(liveTotalCost)}
									</span>
								</div>
							{/if}
						</div>
					{/if}

					<label class="block">
						<span class="text-xs font-medium text-gray-500">Billing Period</span>
						<input
							type="month"
							class="pos-input mt-1 w-full"
							bind:value={formBillingPeriod}
						/>
					</label>
				</div>

				{#if formError}
					<p class="mt-3 text-sm text-status-red">{formError}</p>
				{/if}

				<button
					onclick={submitReading}
					disabled={formSaving}
					class="btn-primary mt-5 w-full"
				>
					{formSaving ? 'Saving...' : 'Save Reading'}
				</button>
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
				{ value: '3m', label: '3 Months' },
				{ value: '6m', label: '6 Months' },
				{ value: '12m', label: '12 Months' },
				{ value: 'all', label: 'All' },
			]}
			showLive={false}
		>
			{#snippet actions()}
				<button
					onclick={() => { resetForm(); formOpen = true; }}
					class="btn-primary flex items-center gap-2"
				>
					<Plus size={16} />
					Log Utility Reading
				</button>
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4 flex-1">
			<KpiCard label="Total Utility Cost" value={formatPeso(totalCost)} variant="accent" />
			<KpiCard label="💧 Water" value={formatPeso(waterCost)} />
			<KpiCard label="🔥 Gas / LPG" value={formatPeso(gasCost)} />
			<KpiCard label="⚡ Electricity" value={formatPeso(elecCost)} />
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-sm font-bold text-gray-700">Utility Trends</h3>
				<div class="flex rounded-lg border border-border overflow-hidden">
					<button
						onclick={() => (chartMode = 'cost')}
						class={cn(
							'px-3 py-1 text-xs font-medium transition-colors',
							chartMode === 'cost' ? 'bg-accent text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
						)}
						style="min-height: unset"
					>
						Cost (₱)
					</button>
					<button
						onclick={() => (chartMode = 'consumption')}
						class={cn(
							'px-3 py-1 text-xs font-medium transition-colors',
							chartMode === 'consumption' ? 'bg-accent text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
						)}
						style="min-height: unset"
					>
						Consumption
					</button>
				</div>
			</div>
			<ReportLineChart
				labels={chartData.labels.map(formatPeriodLabel)}
				series={chartData.series}
				yUnit={chartMode === 'cost' ? '₱' : ''}
				formatValue={chartMode === 'cost'
					? (v) => formatPeso(v)
					: (v) => v.toLocaleString()
				}
			/>
		</div>
	{/snippet}

	{#snippet content()}
		<div class="rounded-xl border border-border bg-white">
			<div class="border-b border-border px-4 py-3">
				<h3 class="text-sm font-bold text-gray-700">All Readings</h3>
			</div>
			{#if filteredReadings.length === 0}
				<div class="flex items-center justify-center py-12 text-sm text-gray-400">
					No utility readings yet. Tap "Log Utility Reading" to start.
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
								<th class="px-4 py-2">Date</th>
								<th class="px-4 py-2">Category</th>
								<th class="px-4 py-2 text-right">Prev</th>
								<th class="px-4 py-2 text-right">Current</th>
								<th class="px-4 py-2 text-right">Consumption</th>
								<th class="px-4 py-2 text-right">Rate</th>
								<th class="px-4 py-2 text-right">Cost</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredReadings as reading}
								<tr class="border-b border-border last:border-b-0 hover:bg-gray-50">
									<td class="px-4 py-2.5 text-gray-600">
										{formatPeriodLabel(reading.billingPeriod)}
									</td>
									<td class="px-4 py-2.5">
										<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
											style="background: {UTILITY_COLORS[reading.category]}15; color: {UTILITY_COLORS[reading.category]}"
										>
											{UTILITY_EMOJI[reading.category]} {UTILITY_LABELS[reading.category]}
										</span>
									</td>
									<td class="px-4 py-2.5 text-right font-mono text-gray-500">
										{reading.previousReading.toLocaleString()}
									</td>
									<td class="px-4 py-2.5 text-right font-mono text-gray-700">
										{reading.currentReading.toLocaleString()}
									</td>
									<td class="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">
										{reading.consumption.toLocaleString()} {UTILITY_UNITS[reading.category]}
									</td>
									<td class="px-4 py-2.5 text-right font-mono text-gray-500">
										₱{reading.rate}
									</td>
									<td class="px-4 py-2.5 text-right font-mono font-bold text-accent">
										{formatPeso(reading.totalCost)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/snippet}
</ReportShell>
