<script lang="ts">
	import { cn } from '$lib/utils';

	type StockStatus = 'ok' | 'low' | 'critical';

	interface StockItem {
		id: string;
		name: string;
		category: string;
		stock: number;
		unit: string;
		minLevel: number;
		lastUpdated: string;
		status: StockStatus;
	}

	const STOCK: StockItem[] = [
		// Meats: stock = closing values from Meat Variance report (end-of-day after deliveries + consumption)
		// Samgyupsal: opened 4200g + received 5000g − 7850g consumed = 1350g remaining
		{ id: 's1',  name: 'Samgyupsal (Pork Belly)',  category: 'Meats',  stock: 1350, unit: 'g',       minLevel: 2000, lastUpdated: '10:00 PM', status: 'critical' },
		// Chadolbaegi: opened 3000g − 1800g consumed = 1200g remaining
		{ id: 's2',  name: 'Chadolbaegi (Beef Brisket)',category: 'Meats',  stock: 1200, unit: 'g',       minLevel: 2000, lastUpdated: '10:00 PM', status: 'critical' },
		// Galbi: opened 2000g − 1580g consumed = 420g remaining
		{ id: 's3',  name: 'Galbi (Short Ribs)',        category: 'Meats',  stock: 420,  unit: 'g',       minLevel: 1500, lastUpdated: '10:00 PM', status: 'critical' },
		// US Beef Belly: opened 3000g − 980g consumed = 2020g remaining
		{ id: 's4',  name: 'US Beef Belly',             category: 'Meats',  stock: 2020, unit: 'g',       minLevel: 1000, lastUpdated: '10:00 PM', status: 'ok' },
		{ id: 's5',  name: 'Kimchi',                    category: 'Sides',  stock: 18,   unit: 'portions', minLevel: 10,  lastUpdated: '8:00 AM', status: 'ok' },
		{ id: 's6',  name: 'Japchae',                   category: 'Sides',  stock: 6,    unit: 'portions', minLevel: 8,   lastUpdated: '8:00 AM', status: 'low' },
		{ id: 's7',  name: 'Steamed Rice',              category: 'Sides',  stock: 30,   unit: 'portions', minLevel: 15,  lastUpdated: '8:00 AM', status: 'ok' },
		{ id: 's8',  name: 'Doenjang Jjigae',           category: 'Dishes', stock: 12,   unit: 'bowls',   minLevel: 5,   lastUpdated: '8:30 AM', status: 'ok' },
		{ id: 's9',  name: 'Bibimbap',                  category: 'Dishes', stock: 3,    unit: 'bowls',   minLevel: 5,   lastUpdated: '8:30 AM', status: 'critical' },
		{ id: 's10', name: 'Soju (Original)',            category: 'Drinks', stock: 24,   unit: 'bottles', minLevel: 12,  lastUpdated: '9:00 AM', status: 'ok' },
		{ id: 's11', name: 'San Miguel Beer',            category: 'Drinks', stock: 18,   unit: 'bottles', minLevel: 12,  lastUpdated: '9:00 AM', status: 'ok' },
		{ id: 's12', name: 'Iced Tea',                   category: 'Drinks', stock: 8,    unit: 'liters',  minLevel: 5,   lastUpdated: '9:00 AM', status: 'ok' }
	];

	const statusConfig: Record<StockStatus, { label: string; class: string }> = {
		ok:       { label: 'Well-Stocked', class: 'bg-status-green-light text-status-green border-status-green/20' },
		low:      { label: 'Low Stock',    class: 'bg-status-yellow-light text-status-yellow border-status-yellow/30' },
		critical: { label: 'Critical',     class: 'bg-status-red-light text-status-red border-status-red/20' }
	};

	const categoryColors: Record<string, string> = {
		Meats:  'bg-orange-50 text-orange-700',
		Sides:  'bg-blue-50 text-blue-600',
		Dishes: 'bg-emerald-50 text-emerald-700',
		Drinks: 'bg-purple-50 text-purple-600'
	};

	let filterStatus = $state<StockStatus | 'all'>('all');

	const filtered = $derived(
		filterStatus === 'all' ? STOCK : STOCK.filter((s) => s.status === filterStatus)
	);

	const criticalCount = $derived(STOCK.filter((s) => s.status === 'critical').length);
	const lowCount      = $derived(STOCK.filter((s) => s.status === 'low').length);
</script>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-3 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Items</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{STOCK.length}</p>
	</div>
	<div class="rounded-xl border border-status-red/20 bg-status-red-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-red">Critical</p>
		<p class="mt-1 text-2xl font-bold text-status-red">{criticalCount}</p>
	</div>
	<div class="rounded-xl border border-status-yellow/30 bg-status-yellow-light p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-status-yellow">Low Stock</p>
		<p class="mt-1 text-2xl font-bold text-status-yellow">{lowCount}</p>
	</div>
</div>

<!-- Filter bar -->
<div class="mb-4 flex items-center gap-2">
	<span class="text-sm font-medium text-gray-500">Filter:</span>
	{#each (['all', 'ok', 'low', 'critical'] as const) as f}
		<button
			onclick={() => (filterStatus = f)}
			class={cn(
				'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
				filterStatus === f
					? 'bg-accent text-white'
					: 'border border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{f === 'all' ? 'All Items' : f === 'ok' ? 'Well-Stocked' : f === 'low' ? 'Low Stock' : 'Critical'}
		</button>
	{/each}
</div>

<!-- Table -->
<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item</th>
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Current Stock</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Min Level</th>
				<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Last Count</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each filtered as item (item.id)}
				<tr class={cn('transition-colors hover:bg-gray-50', item.status === 'critical' && 'bg-status-red-light/30')}>
					<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
					<td class="px-4 py-3">
						<span class={cn('rounded-full px-2 py-0.5 text-xs font-medium', categoryColors[item.category])}>
							{item.category}
						</span>
					</td>
					<td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">
						{item.stock.toLocaleString()} {item.unit}
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-400">
						{item.minLevel.toLocaleString()} {item.unit}
					</td>
					<td class="px-4 py-3 text-center">
						<span class={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusConfig[item.status].class)}>
							{statusConfig[item.status].label}
						</span>
					</td>
					<td class="px-4 py-3 text-right text-xs text-gray-400">{item.lastUpdated}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
