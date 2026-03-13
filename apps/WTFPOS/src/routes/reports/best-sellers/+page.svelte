<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { bestSellersMeatPeriod, bestSellersAddonsPeriod } from '$lib/stores/reports.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportHorizBar from '$lib/components/reports/ReportHorizBar.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';

	type Tab = 'meat' | 'addons';
	type Period = 'today' | 'week' | 'month';
	let tab = $state<Tab>('meat');
	let period = $state<Period>('today');

	const meatItems  = $derived(bestSellersMeatPeriod(period));
	const addonItems = $derived(bestSellersAddonsPeriod(period));

	const totalMeatWeight  = $derived(meatItems.reduce((s, i) => s + i.weightGrams, 0));
	const totalMeatRevenue = $derived(meatItems.reduce((s, i) => s + i.revenue, 0));
	const totalAddonRevenue = $derived(addonItems.reduce((s, i) => s + i.revenue, 0));

	// Horizontal bar rows
	const meatChartRows = $derived(
		meatItems.map(i => ({
			label: i.name,
			value: i.weightGrams,
			subLabel: `${(i.weightGrams / 1000).toFixed(2)} kg · ${formatPeso(i.revenue)}`,
		}))
	);
	const addonChartRows = $derived(
		addonItems.map(i => ({
			label: i.name,
			value: i.revenue,
			subLabel: `${i.qty} sold`,
		}))
	);
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={period}
			onPeriodChange={(p) => (period = p as Period)}
			options={[
				{ value: 'today', label: 'Today' },
				{ value: 'week',  label: 'This Week' },
				{ value: 'month', label: 'This Month' },
			]}
		>
			{#snippet actions()}
				{#each (['meat', 'addons'] as const) as t}
					<button
						onclick={() => (tab = t)}
						class={cn(
							'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
							tab === t ? 'bg-accent text-white' : 'border border-border bg-white text-gray-600 hover:bg-gray-50'
						)}
						style="min-height: unset"
					>
						{t === 'meat' ? '🥩 Meat Cuts' : '🍚 Add-ons & Drinks'}
					</button>
				{/each}
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
			{#if tab === 'meat'}
				<KpiCard label="Total Weighed Out" value="{(totalMeatWeight / 1000).toFixed(1)} kg" />
				<KpiCard label="Meat Revenue" value={formatPeso(totalMeatRevenue)} />
				<KpiCard label="Top Cut" value={meatItems[0]?.name ?? '—'} variant="success" />
			{:else}
				<KpiCard label="Add-on Revenue" value={formatPeso(totalAddonRevenue)} />
				<KpiCard label="Items Sold" value={String(addonItems.reduce((s, i) => s + i.qty, 0))} />
				<KpiCard label="Top Add-on" value={addonItems[0]?.name ?? '—'} variant="success" />
			{/if}
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
				{tab === 'meat' ? 'Meat by Weight (g)' : 'Add-ons by Revenue'}
			</p>
			<ReportHorizBar
				rows={tab === 'meat' ? meatChartRows : addonChartRows}
				formatValue={tab === 'meat' ? (v) => `${v.toLocaleString()}g` : (v) => formatPeso(v)}
			/>
		</div>
	{/snippet}

	{#snippet content()}
		{#if tab === 'meat' && meatItems.length > 0}
			<div class="overflow-x-auto rounded-xl border border-border bg-white">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">#</th>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Meat Cut</th>
							<th class="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Weight (g)</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Weight (kg)</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each meatItems as item}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-gray-400">{item.rank}</td>
								<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
								<td class="hidden sm:table-cell px-4 py-3 text-right font-mono text-gray-700">{item.weightGrams.toLocaleString()}g</td>
								<td class="px-4 py-3 text-right font-mono text-gray-500">{(item.weightGrams / 1000).toFixed(2)} kg</td>
								<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(item.revenue)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if tab === 'addons' && addonItems.length > 0}
			<div class="overflow-x-auto rounded-xl border border-border bg-white">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">#</th>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qty Sold</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each addonItems as item}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-gray-400">{item.rank}</td>
								<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
								<td class="px-4 py-3 text-right font-mono text-gray-700">{item.qty}</td>
								<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(item.revenue)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/snippet}
</ReportShell>
