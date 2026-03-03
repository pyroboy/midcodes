<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';

	type Tab = 'meat' | 'addons';
	let tab = $state<Tab>('meat');

	interface MeatItem {
		rank: number;
		name: string;
		weightGrams: number;
		unitCost: number;
		totalCost: number;
		revenue: number;
		grossMargin: number;
	}

	interface AddonItem {
		rank: number;
		name: string;
		qtySold: number;
		revenue: number;
		grossMargin: number;
	}

	const meatItems: MeatItem[] = [
		{ rank: 1, name: 'Samgyupsal',        weightGrams: 28400, unitCost: 350, totalCost: 9940,  revenue: 18200, grossMargin: 45.4 },
		{ rank: 2, name: 'Chadolbaegi',       weightGrams: 18200, unitCost: 420, totalCost: 7644,  revenue: 14800, grossMargin: 48.4 },
		{ rank: 3, name: 'US Beef Belly',     weightGrams: 12600, unitCost: 580, totalCost: 7308,  revenue: 16400, grossMargin: 55.4 },
		{ rank: 4, name: 'Galbi',             weightGrams: 9800,  unitCost: 480, totalCost: 4704,  revenue: 9200,  grossMargin: 48.9 },
		{ rank: 5, name: 'Woo Samgyup',       weightGrams: 7400,  unitCost: 390, totalCost: 2886,  revenue: 6800,  grossMargin: 57.6 }
	];

	const addonItems: AddonItem[] = [
		{ rank: 1, name: 'Steamed Rice',       qtySold: 128, revenue: 5120,  grossMargin: 72.0 },
		{ rank: 2, name: 'Soju (Bottle)',      qtySold: 86,  revenue: 10320, grossMargin: 58.2 },
		{ rank: 3, name: 'Iced Tea (Pitcher)', qtySold: 64,  revenue: 5760,  grossMargin: 65.4 },
		{ rank: 4, name: 'Egg Ramen',          qtySold: 52,  revenue: 5200,  grossMargin: 55.8 },
		{ rank: 5, name: 'Cheese Fondue',      qtySold: 38,  revenue: 4940,  grossMargin: 48.6 }
	];

	const totalMeatWeight = meatItems.reduce((s, i) => s + i.weightGrams, 0);
	const totalMeatRevenue = meatItems.reduce((s, i) => s + i.revenue, 0);
	const totalAddonRevenue = addonItems.reduce((s, i) => s + i.revenue, 0);
</script>

<!-- Tab toggle -->
<div class="mb-5 flex items-center gap-2">
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
</div>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-3 gap-4">
	{#if tab === 'meat'}
		<div class="rounded-xl border border-border bg-white p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Weighed Out</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{(totalMeatWeight / 1000).toFixed(1)} kg</p>
		</div>
		<div class="rounded-xl border border-border bg-white p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Meat Revenue</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(totalMeatRevenue)}</p>
		</div>
		<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-status-green">Top Item</p>
			<p class="mt-1 text-2xl font-bold text-status-green">{meatItems[0].name}</p>
		</div>
	{:else}
		<div class="rounded-xl border border-border bg-white p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Add-on Revenue</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(totalAddonRevenue)}</p>
		</div>
		<div class="rounded-xl border border-border bg-white p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Items Sold</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{addonItems.reduce((s, i) => s + i.qtySold, 0)}</p>
		</div>
		<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-status-green">Top Add-on</p>
			<p class="mt-1 text-2xl font-bold text-status-green">{addonItems[0].name}</p>
		</div>
	{/if}
</div>

<!-- Tables -->
{#if tab === 'meat'}
	<div class="overflow-hidden rounded-xl border border-border bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-gray-50">
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">#</th>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Meat Cut</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Weight (g)</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">COGS</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Margin</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each meatItems as item}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 text-gray-400">{item.rank}</td>
						<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-700">{item.weightGrams.toLocaleString()}g</td>
						<td class="px-4 py-3 text-right font-mono text-gray-500">{formatPeso(item.totalCost)}</td>
						<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(item.revenue)}</td>
						<td class={cn(
							'px-4 py-3 text-right font-mono font-bold',
							item.grossMargin >= 50 ? 'text-status-green' : 'text-status-yellow'
						)}>
							{item.grossMargin.toFixed(1)}%
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="overflow-hidden rounded-xl border border-border bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-gray-50">
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">#</th>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qty Sold</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Margin</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each addonItems as item}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 text-gray-400">{item.rank}</td>
						<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-700">{item.qtySold}</td>
						<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(item.revenue)}</td>
						<td class={cn(
							'px-4 py-3 text-right font-mono font-bold',
							item.grossMargin >= 60 ? 'text-status-green' : 'text-status-yellow'
						)}>
							{item.grossMargin.toFixed(1)}%
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
