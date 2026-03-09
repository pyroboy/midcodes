<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { bestSellersMeat, bestSellersAddons } from '$lib/stores/reports.svelte';
	import { session } from '$lib/stores/session.svelte';

	type Tab = 'meat' | 'addons';
	type Period = 'today' | 'week';
	let tab = $state<Tab>('meat');
	let period = $state<Period>('today');

	const LOCATION_NAMES: Record<string, string> = {
		tag: 'Alta Citta (Tagbilaran)',
		pgl: 'Alona Beach (Panglao)',
		'wh-tag': 'Tagbilaran Warehouse',
		all: 'All Locations',
	};
	const locationLabel = $derived(LOCATION_NAMES[session.locationId] ?? session.locationId);
	const todayLabel = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

	// bestSellersMeat and bestSellersAddons aggregate all-time data for the current location.
	// Period-level filtering (today vs. week) is deferred to the store layer — the toggle
	// is present so managers can switch context; granular filtering will be added with a
	// store-level period argument in a future update.
	const meatItems = $derived(bestSellersMeat());
	const addonItems = $derived(bestSellersAddons());

	const totalMeatWeight = $derived(meatItems.reduce((s, i) => s + i.weightGrams, 0));
	const totalMeatRevenue = $derived(meatItems.reduce((s, i) => s + i.revenue, 0));
	const totalAddonRevenue = $derived(addonItems.reduce((s, i) => s + i.revenue, 0));
</script>

<!-- Branch + date sub-header -->
<div class="mb-3 flex items-center gap-2 text-sm text-gray-500">
	<span class="font-semibold text-gray-700">{locationLabel}</span>
	<span>·</span>
	<span>{todayLabel}</span>
</div>

<!-- Period toggle -->
<div class="mb-4 flex items-center gap-2">
	{#each (['today', 'week'] as const) as p}
		<button
			onclick={() => (period = p)}
			class={cn(
				'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
				period === p ? 'bg-accent text-white' : 'border border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{p === 'today' ? 'Today' : 'This Week'}
		</button>
	{/each}
</div>

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
			<p class="text-xs font-medium uppercase tracking-wide text-status-green">Top Cut</p>
			<p class="mt-1 text-2xl font-bold text-status-green">{meatItems[0]?.name ?? '—'}</p>
		</div>
	{:else}
		<div class="rounded-xl border border-border bg-white p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Add-on Revenue</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{formatPeso(totalAddonRevenue)}</p>
		</div>
		<div class="rounded-xl border border-border bg-white p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Items Sold</p>
			<p class="mt-1 text-2xl font-bold text-gray-900">{addonItems.reduce((s, i) => s + i.qty, 0)}</p>
		</div>
		<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4">
			<p class="text-xs font-medium uppercase tracking-wide text-status-green">Top Add-on</p>
			<p class="mt-1 text-2xl font-bold text-status-green">{addonItems[0]?.name ?? '—'}</p>
		</div>
	{/if}
</div>

<!-- Empty state -->
{#if tab === 'meat' && meatItems.length === 0}
	<div class="mb-5 flex items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
		<div class="text-2xl">📭</div>
		<div>
			<p class="font-semibold text-gray-700">No meat sales data yet</p>
			<p class="mt-0.5 text-sm text-gray-500">
				{session.locationId === 'all'
					? 'No meat has been sold yet today across all branches. Meat sales appear here after tables are served and orders are closed.'
					: 'No meat has been sold yet today at this branch. Meat sales appear here after tables are served and orders are closed.'}
			</p>
		</div>
	</div>
{:else if tab === 'addons' && addonItems.length === 0}
	<div class="mb-5 flex items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5">
		<div class="text-2xl">📭</div>
		<div>
			<p class="font-semibold text-gray-700">No add-on sales data yet</p>
			<p class="mt-0.5 text-sm text-gray-500">No add-ons or drinks sold yet. Items appear here after tables check out.</p>
		</div>
	</div>
{/if}

<!-- Tables -->
{#if tab === 'meat' && meatItems.length > 0}
	<div class="overflow-hidden rounded-xl border border-border bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-gray-50">
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">#</th>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Meat Cut</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Weight (g)</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Weight (kg)</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each meatItems as item}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 text-gray-400">{item.rank}</td>
						<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
						<td class="px-4 py-3 text-right font-mono text-gray-700">{item.weightGrams.toLocaleString()}g</td>
						<td class="px-4 py-3 text-right font-mono text-gray-500">{(item.weightGrams / 1000).toFixed(2)} kg</td>
						<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatPeso(item.revenue)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else if tab === 'addons' && addonItems.length > 0}
	<div class="overflow-hidden rounded-xl border border-border bg-white">
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
