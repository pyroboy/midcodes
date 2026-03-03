<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		stockItems, getCurrentStock, getStockStatus,
		adjustStock,
		type StockStatus, type StockCategory, type StockItem,
		type MeatAnimal, type MeatCutType
	} from '$lib/stores/stock.svelte';
	import { Plus, Minus, Settings2, X } from 'lucide-svelte';

	const statusConfig: Record<StockStatus, { label: string; class: string }> = {
		ok:       { label: 'Well-Stocked', class: 'bg-status-green-light text-status-green border-status-green/20' },
		low:      { label: 'Low Stock',    class: 'bg-status-yellow-light text-status-yellow border-status-yellow/30' },
		critical: { label: 'Critical',     class: 'bg-status-red-light text-status-red border-status-red/20' },
	};

	const categoryColors: Record<StockCategory, string> = {
		Meats:  'bg-orange-50 text-orange-700',
		Sides:  'bg-blue-50 text-blue-600',
		Dishes: 'bg-emerald-50 text-emerald-700',
		Drinks: 'bg-purple-50 text-purple-600',
	};

	let filterStatus = $state<StockStatus | 'all'>('all');

	const items = $derived(
		stockItems.map(s => ({
			...s,
			currentStock: getCurrentStock(s.id),
			status: getStockStatus(s.id),
		}))
	);

	const filtered = $derived(
		filterStatus === 'all' ? items : items.filter(s => s.status === filterStatus)
	);

	const criticalCount = $derived(items.filter(s => s.status === 'critical').length);
	const lowCount      = $derived(items.filter(s => s.status === 'low').length);

	interface InventoryItem extends StockItem { currentStock: number; status: StockStatus }

	// Modal State
	let adjustItem = $state<InventoryItem | null>(null);
	let adjustType = $state<'add' | 'deduct'>('add');
	let adjustQty  = $state('');
	let adjustReason = $state('');
	let meatAnimal = $state<MeatAnimal>('Pork');
	let meatCut    = $state<MeatCutType>('Bone-Out');

	function openAdjustModal(item: InventoryItem, type: 'add' | 'deduct') {
		adjustItem = item;
		adjustType = type;
		adjustQty = '';
		adjustReason = '';
		// Default assumptions for meat
		meatAnimal = item.name.toLowerCase().includes('beef') ? 'Beef' : 'Pork';
		meatCut = 'Bone-Out';
	}

	function closeAdjustModal() {
		adjustItem = null;
	}

	function handleAdjust() {
		if (!adjustItem) return;
		const qty = parseFloat(adjustQty);
		if (isNaN(qty) || qty <= 0) return;

		if (adjustItem.category === 'Meats') {
			adjustStock(adjustItem.id, adjustItem.name, adjustType, qty, adjustItem.unit, adjustReason, meatAnimal, meatCut);
		} else {
			adjustStock(adjustItem.id, adjustItem.name, adjustType, qty, adjustItem.unit, adjustReason);
		}
		
		closeAdjustModal();
	}

</script>

<!-- Summary cards -->
<div class="mb-5 grid grid-cols-3 gap-4">
	<div class="rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Items</p>
		<p class="mt-1 text-2xl font-bold text-gray-900">{items.length}</p>
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
<div class="overflow-hidden rounded-xl border border-border bg-white pb-32">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item</th>
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Current Stock</th>
				<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each filtered as item (item.id)}
				<tr class={cn('transition-colors hover:bg-gray-50 group', item.status === 'critical' && 'bg-status-red-light/30')}>
					<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
					<td class="px-4 py-3">
						<span class={cn('rounded-full px-2 py-0.5 text-xs font-medium', categoryColors[item.category])}>
							{item.category}
						</span>
					</td>
					<td class="px-4 py-3 text-right font-mono text-gray-900 flex flex-col items-end">
						<span class="font-semibold">{item.currentStock.toLocaleString()} {item.unit}</span>
						<span class="text-xs text-gray-400">Min: {item.minLevel.toLocaleString()}</span>
					</td>
					<td class="px-4 py-3 text-center">
						<span class={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusConfig[item.status].class)}>
							{statusConfig[item.status].label}
						</span>
					</td>
					<td class="px-4 py-3 text-right">
						<div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<button 
								onclick={() => openAdjustModal(item, 'add')}
								class="p-1.5 rounded text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
								title="Add to stock"
							>
								<Plus class="w-4 h-4" />
							</button>
							<button 
								onclick={() => openAdjustModal(item, 'deduct')}
								class="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
								title="Deduct from stock (e.g. damages)"
							>
								<Minus class="w-4 h-4" />
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<!-- Manual Adjustment Modal -->
{#if adjustItem}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
		<!-- Header -->
		<div class="flex items-center justify-between px-6 py-4 border-b border-border bg-gray-50/50">
			<div class="flex items-center gap-3">
				<div class={cn(
					"w-8 h-8 rounded-full flex items-center justify-center",
					adjustType === 'add' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
				)}>
					<Settings2 class="w-4 h-4" />
				</div>
				<div>
					<h3 class="font-bold text-gray-900 text-sm">
						{adjustType === 'add' ? 'Add to Stock' : 'Deduct from Stock'}
					</h3>
					<p class="text-xs text-gray-500">{adjustItem.name}</p>
				</div>
			</div>
			<button onclick={closeAdjustModal} class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
				<X class="w-5 h-5"/>
			</button>
		</div>

		<!-- Body -->
		<div class="p-6 flex flex-col gap-5">
			
			<div class="flex items-baseline justify-between">
				<span class="text-sm text-gray-500">Current Stock</span>
				<span class="font-mono font-bold text-lg text-gray-900">{(adjustItem as InventoryItem).currentStock.toLocaleString()} {(adjustItem as InventoryItem).unit}</span>
			</div>

			<!-- Meat Specific Configurations -->
			{#if adjustItem.category === 'Meats'}
				<div class="bg-orange-50/50 border border-orange-100 rounded-lg p-4 flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wide text-orange-800">Meat Type</span>
						<div class="grid grid-cols-2 gap-2">
							{#each ['Pork', 'Beef'] as animal}
								<button 
									class={cn(
										"py-1.5 text-sm font-medium rounded border transition-colors",
										meatAnimal === animal ? "border-orange-500 bg-orange-100 text-orange-900" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300"
									)}
									onclick={() => meatAnimal = animal as MeatAnimal}
								>
									{animal}
								</button>
							{/each}
						</div>
					</div>
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wide text-orange-800">Cut Category</span>
						<div class="grid grid-cols-2 gap-2">
							{#each ['Bone-In', 'Bone-Out', 'Bones', 'Trimmings'] as cut}
								<button 
									class={cn(
										"py-1.5 text-sm font-medium rounded border transition-colors",
										meatCut === cut ? "border-orange-500 bg-orange-100 text-orange-900" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300"
									)}
									onclick={() => meatCut = cut as MeatCutType}
								>
									{cut}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">
					{adjustType === 'add' ? 'Quantity to Add' : 'Quantity to Deduct'} ({adjustItem.unit}) *
				</span>
				<div class="relative">
					<input 
						type="number" 
						bind:value={adjustQty} 
						placeholder="0" 
						min="0" 
						class={cn(
							"w-full pl-4 pr-12 py-2.5 text-lg font-mono rounded-lg border focus:ring-2 focus:outline-none transition-shadow",
							adjustType === 'add' 
								? "border-green-200 focus:border-green-500 focus:ring-green-500/20" 
								: "border-red-200 focus:border-red-500 focus:ring-red-500/20"
						)} 
					/>
					<span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 select-none">
						{adjustItem.unit}
					</span>
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Reason (Optional)</span>
				<input type="text" bind:value={adjustReason} placeholder="e.g. Audit correction, spoilage..." class="pos-input" />
			</div>

		</div>

		<!-- Footer -->
		<div class="p-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl border-t border-border">
			<button onclick={closeAdjustModal} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
				Cancel
			</button>
			<button 
				onclick={handleAdjust} 
				disabled={!adjustQty || isNaN(parseFloat(adjustQty)) || parseFloat(adjustQty) <= 0}
				class={cn(
					"px-5 py-2 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
					adjustType === 'add' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
				)}
			>
				Confirm {adjustType === 'add' ? 'Addition' : 'Deduction'}
			</button>
		</div>
	</div>
</div>
{/if}

