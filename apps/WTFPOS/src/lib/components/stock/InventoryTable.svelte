<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		stockItems, getCurrentStock, getStockStatus,
		adjustStock, setStock,
		type StockStatus, type StockCategory, type StockItem, type StockLocation,
		type MeatAnimal, type MeatCutType
	} from '$lib/stores/stock.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { LayoutGrid, List, Search, Plus, Minus, X, Pencil, MapPin } from 'lucide-svelte';

	const locationStyle: Record<StockLocation, { badge: string; icon: string }> = {
		'Walk-In Freezer': { badge: 'bg-blue-50 text-blue-700 border border-blue-200',   icon: '🧊' },
		'Chiller':         { badge: 'bg-cyan-50 text-cyan-700 border border-cyan-200',    icon: '❄️' },
		'Dry Storage':     { badge: 'bg-amber-50 text-amber-700 border border-amber-200', icon: '📦' },
		'Bar':             { badge: 'bg-purple-50 text-purple-700 border border-purple-200', icon: '🍺' },
	};

	const isAggregated = $derived(session.locationId === 'all');

	const statusConfig: Record<StockStatus, { label: string; badgeClass: string; dotClass: string }> = {
		ok:       { label: 'Well-Stocked', badgeClass: 'bg-status-green-light text-status-green border-status-green/20',    dotClass: 'bg-status-green' },
		low:      { label: 'Low Stock',    badgeClass: 'bg-status-yellow-light text-status-yellow border-status-yellow/30', dotClass: 'bg-status-yellow' },
		critical: { label: 'Critical',     badgeClass: 'bg-status-red-light text-status-red border-status-red/20',          dotClass: 'bg-status-red' },
	};

	const categoryStyle: Record<StockCategory, { badge: string; thumbBg: string; cardBg: string; emoji: string }> = {
		Meats:  { badge: 'bg-orange-50 text-orange-700',   thumbBg: 'bg-orange-100',  cardBg: 'bg-gradient-to-br from-orange-100 to-orange-200/60', emoji: '🥩' },
		Sides:  { badge: 'bg-blue-50 text-blue-600',       thumbBg: 'bg-blue-100',    cardBg: 'bg-gradient-to-br from-blue-100 to-blue-200/60',     emoji: '🥗' },
		Dishes: { badge: 'bg-emerald-50 text-emerald-700', thumbBg: 'bg-emerald-100', cardBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200/60',emoji: '🍲' },
		Drinks: { badge: 'bg-purple-50 text-purple-600',   thumbBg: 'bg-purple-100',  cardBg: 'bg-gradient-to-br from-purple-100 to-purple-200/60',  emoji: '🍶' },
	};

	// ─── View / Search / Filter ────────────────────────────────────────────────
	let viewMode     = $state<'grid' | 'list'>('list');
	let searchQuery  = $state('');
	let filterStatus = $state<StockStatus | 'all'>('all');

	interface InventoryItem extends StockItem { currentStock: number; status: StockStatus }

	const items = $derived(
		stockItems.map(s => ({
			...s,
			currentStock: getCurrentStock(s.id),
			status: getStockStatus(s.id),
		} as InventoryItem))
	);

	const filtered = $derived(
		items.filter(s => {
			const matchStatus = filterStatus === 'all' || s.status === filterStatus;
			const q = searchQuery.trim().toLowerCase();
			const matchSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
			return matchStatus && matchSearch;
		})
	);

	const criticalCount = $derived(items.filter(s => s.status === 'critical').length);
	const lowCount      = $derived(items.filter(s => s.status === 'low').length);

	// ─── Modal ────────────────────────────────────────────────────────────────
	let selectedItem = $state<InventoryItem | null>(null);
	let modalAction  = $state<'add' | 'deduct' | 'set' | null>(null);
	let adjustQty    = $state('');
	let adjustReason = $state('');
	let meatAnimal   = $state<MeatAnimal>('Pork');
	let meatCut      = $state<MeatCutType>('Bone-Out');

	function openItemModal(item: InventoryItem) {
		selectedItem = item;
		modalAction  = null;
		adjustQty    = '';
		adjustReason = '';
		meatAnimal   = item.name.toLowerCase().includes('beef') ? 'Beef' : 'Pork';
		meatCut      = 'Bone-Out';
	}

	function selectAction(action: 'add' | 'deduct' | 'set') {
		modalAction = action;
		// Pre-fill "Set" with current value so user edits from it
		adjustQty   = action === 'set' ? String(selectedItem?.currentStock ?? 0) : '';
	}

	function closeModal() {
		selectedItem = null;
		modalAction  = null;
	}

	function handleConfirm() {
		if (!selectedItem || !modalAction) return;
		const qty = parseFloat(adjustQty);
		if (isNaN(qty) || qty < 0) return;
		if (modalAction !== 'set' && qty <= 0) return;

		const isMeat = selectedItem.category === 'Meats';
		const animal = isMeat ? meatAnimal : undefined;
		const cut    = isMeat ? meatCut : undefined;

		if (modalAction === 'set') {
			setStock(selectedItem.id, selectedItem.name, qty, selectedItem.unit, adjustReason, animal, cut);
		} else {
			adjustStock(selectedItem.id, selectedItem.name, modalAction, qty, selectedItem.unit, adjustReason, animal, cut);
		}
		closeModal();
	}

	const confirmDisabled = $derived(
		!adjustQty ||
		isNaN(parseFloat(adjustQty)) ||
		parseFloat(adjustQty) < 0 ||
		(modalAction !== 'set' && parseFloat(adjustQty) <= 0)
	);
</script>

<!-- ─── Summary Cards ─────────────────────────────────────────────────────── -->
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

<!-- ─── Toolbar ───────────────────────────────────────────────────────────── -->
<div class="mb-4 flex items-center gap-3">
	<!-- Search -->
	<div class="relative flex-1">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search items or category…"
			class="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
		/>
		{#if searchQuery}
			<button
				onclick={() => (searchQuery = '')}
				class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
				style="min-height: unset"
			>
				<X class="w-3.5 h-3.5" />
			</button>
		{/if}
	</div>

	<!-- Filter chips -->
	<div class="flex items-center gap-1">
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
				{f === 'all' ? 'All' : f === 'ok' ? 'OK' : f === 'low' ? 'Low' : 'Critical'}
			</button>
		{/each}
	</div>

	<!-- View toggle -->
	<div class="flex items-center gap-0.5 rounded-lg border border-border bg-white p-1">
		<button
			onclick={() => (viewMode = 'list')}
			class={cn(
				'rounded p-1.5 transition-colors',
				viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-100'
			)}
			title="List view"
			style="min-height: unset"
		>
			<List class="w-4 h-4" />
		</button>
		<button
			onclick={() => (viewMode = 'grid')}
			class={cn(
				'rounded p-1.5 transition-colors',
				viewMode === 'grid' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-100'
			)}
			title="Grid view"
			style="min-height: unset"
		>
			<LayoutGrid class="w-4 h-4" />
		</button>
	</div>
</div>

<!-- ─── Grid View ─────────────────────────────────────────────────────────── -->
{#if viewMode === 'grid'}
	{#if filtered.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-gray-400">
			<Search class="w-10 h-10 mb-3 opacity-25" />
			<p class="font-medium text-gray-500">No items match your search</p>
			<p class="text-sm mt-1">Try a different term or remove the filter</p>
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-4 pb-32">
			{#each filtered as item (item.id)}
				<button
					onclick={() => openItemModal(item)}
					class={cn(
						'pos-card flex flex-col overflow-hidden text-left transition-all hover:shadow-md hover:border-accent/30 focus:outline-none focus:ring-2 focus:ring-accent/40',
						item.status === 'critical' && 'ring-1 ring-status-red/30'
					)}
				>
					<!-- Image placeholder -->
					<div class={cn('flex h-28 items-center justify-center', categoryStyle[item.category].cardBg)}>
						<span class="text-5xl select-none">{categoryStyle[item.category].emoji}</span>
					</div>

					<!-- Info -->
					<div class="flex flex-col gap-1.5 p-3">
						<div class="flex flex-wrap items-center gap-1">
							<span class={cn('rounded-full px-2 py-0.5 text-xs font-medium', categoryStyle[item.category].badge)}>
								{item.category}
							</span>
							{#if isAggregated}
								<span class={cn('flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium', locationStyle[item.location].badge)}>
									<span class="text-[10px] leading-none">{locationStyle[item.location].icon}</span>
									{item.location}
								</span>
							{/if}
						</div>
						<p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{item.name}</p>
						<p class="font-mono text-base font-bold text-gray-900">
							{item.currentStock.toLocaleString()}
							<span class="text-xs font-normal text-gray-400">{item.unit}</span>
						</p>
						<div class="flex items-center gap-1.5">
							<span class={cn('h-2 w-2 flex-shrink-0 rounded-full', statusConfig[item.status].dotClass)}></span>
							<span class={cn(
								'text-xs font-semibold',
								item.status === 'ok' ? 'text-status-green' : item.status === 'low' ? 'text-status-yellow' : 'text-status-red'
							)}>
								{statusConfig[item.status].label}
							</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}

<!-- ─── List View ─────────────────────────────────────────────────────────── -->
{:else}
	<div class="overflow-hidden rounded-xl border border-border bg-white pb-32">
		{#if filtered.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-gray-400">
				<Search class="w-10 h-10 mb-3 opacity-25" />
				<p class="font-medium text-gray-500">No items match your search</p>
				<p class="text-sm mt-1">Try a different term or remove the filter</p>
			</div>
		{:else}
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-gray-50">
						<th class="w-12 px-4 py-3"></th>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item</th>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Current Stock</th>
						<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each filtered as item (item.id)}
						<tr
							onclick={() => openItemModal(item)}
							class={cn(
								'cursor-pointer transition-colors hover:bg-gray-50 group',
								item.status === 'critical' && 'bg-status-red-light/30'
							)}
						>
							<!-- Thumbnail -->
							<td class="px-4 py-3">
								<div class={cn('h-9 w-9 flex-shrink-0 rounded-lg flex items-center justify-center text-xl select-none', categoryStyle[item.category].thumbBg)}>
									{categoryStyle[item.category].emoji}
								</div>
							</td>
							<td class="px-4 py-3">
								<p class="font-medium text-gray-900">{item.name}</p>
								{#if isAggregated}
									<span class={cn('mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', locationStyle[item.location].badge)}>
										<MapPin class="w-2.5 h-2.5 flex-shrink-0" />
										{item.location}
									</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<span class={cn('rounded-full px-2 py-0.5 text-xs font-medium', categoryStyle[item.category].badge)}>
									{item.category}
								</span>
							</td>
							<td class="px-4 py-3 text-right">
								<span class="font-mono font-semibold text-gray-900">{item.currentStock.toLocaleString()} {item.unit}</span>
								<br />
								<span class="text-xs text-gray-400">Min: {item.minLevel.toLocaleString()}</span>
							</td>
							<td class="px-4 py-3 text-center">
								<span class={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusConfig[item.status].badgeClass)}>
									{statusConfig[item.status].label}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{/if}

<!-- ─── Item Action Modal ──────────────────────────────────────────────────── -->
{#if selectedItem}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl flex flex-col">

			<!-- Modal header -->
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<div class="flex items-center gap-3">
					<div class={cn('h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl select-none', categoryStyle[selectedItem.category].thumbBg)}>
						{categoryStyle[selectedItem.category].emoji}
					</div>
					<div>
						<h3 class="font-bold text-gray-900 leading-tight">{selectedItem.name}</h3>
						<p class="text-xs text-gray-500 mt-0.5">
							Current stock:
							<span class="font-mono font-bold text-gray-900">{selectedItem.currentStock.toLocaleString()} {selectedItem.unit}</span>
						</p>
					</div>
				</div>
				<button onclick={closeModal} class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Action selector -->
			<div class="px-5 pt-4 pb-3">
				<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Select Action</p>
				<div class="grid grid-cols-3 gap-2">

					<!-- Add -->
					<button
						onclick={() => selectAction('add')}
						class={cn(
							'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
							modalAction === 'add'
								? 'border-green-500 bg-green-50'
								: 'border-border bg-white hover:border-green-300 hover:bg-green-50/50'
						)}
						style="min-height: unset"
					>
						<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'add' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500')}>
							<Plus class="w-4 h-4" />
						</div>
						<span class={cn('text-xs font-semibold', modalAction === 'add' ? 'text-green-700' : 'text-gray-600')}>Add</span>
					</button>

					<!-- Deduct -->
					<button
						onclick={() => selectAction('deduct')}
						class={cn(
							'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
							modalAction === 'deduct'
								? 'border-red-500 bg-red-50'
								: 'border-border bg-white hover:border-red-300 hover:bg-red-50/50'
						)}
						style="min-height: unset"
					>
						<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'deduct' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500')}>
							<Minus class="w-4 h-4" />
						</div>
						<span class={cn('text-xs font-semibold', modalAction === 'deduct' ? 'text-red-700' : 'text-gray-600')}>Deduct</span>
					</button>

					<!-- Set Level -->
					<button
						onclick={() => selectAction('set')}
						class={cn(
							'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
							modalAction === 'set'
								? 'border-blue-500 bg-blue-50'
								: 'border-border bg-white hover:border-blue-300 hover:bg-blue-50/50'
						)}
						style="min-height: unset"
					>
						<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'set' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>
							<Pencil class="w-4 h-4" />
						</div>
						<span class={cn('text-xs font-semibold', modalAction === 'set' ? 'text-blue-700' : 'text-gray-600')}>Set Level</span>
					</button>

				</div>
			</div>

			<!-- Form (only shown once action selected) -->
			{#if modalAction}
				<div class="px-5 pb-2 flex flex-col gap-4">

					<!-- Meat-specific options -->
					{#if selectedItem.category === 'Meats'}
						<div class="rounded-lg border border-orange-100 bg-orange-50/50 p-4 flex flex-col gap-4">
							<div class="flex flex-col gap-1.5">
								<span class="text-xs font-semibold uppercase tracking-wide text-orange-800">Meat Type</span>
								<div class="grid grid-cols-2 gap-2">
									{#each ['Pork', 'Beef'] as animal}
										<button
											onclick={() => (meatAnimal = animal as MeatAnimal)}
											class={cn('rounded border py-1.5 text-sm font-medium transition-colors', meatAnimal === animal ? 'border-orange-500 bg-orange-100 text-orange-900' : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300')}
											style="min-height: unset"
										>{animal}</button>
									{/each}
								</div>
							</div>
							<div class="flex flex-col gap-1.5">
								<span class="text-xs font-semibold uppercase tracking-wide text-orange-800">Cut Category</span>
								<div class="grid grid-cols-2 gap-2">
									{#each ['Bone-In', 'Bone-Out', 'Bones', 'Trimmings'] as cut}
										<button
											onclick={() => (meatCut = cut as MeatCutType)}
											class={cn('rounded border py-1.5 text-sm font-medium transition-colors', meatCut === cut ? 'border-orange-500 bg-orange-100 text-orange-900' : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300')}
											style="min-height: unset"
										>{cut}</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					<!-- Quantity -->
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">
							{modalAction === 'add' ? 'Quantity to Add' : modalAction === 'deduct' ? 'Quantity to Deduct' : 'Set Stock Level'}
							({selectedItem.unit}) *
						</span>
						<div class="relative">
							<input
								type="number"
								bind:value={adjustQty}
								placeholder={modalAction === 'set' ? String(selectedItem.currentStock) : '0'}
								min="0"
								class={cn(
									'w-full pl-4 pr-16 py-2.5 text-lg font-mono rounded-lg border focus:ring-2 focus:outline-none transition-shadow',
									modalAction === 'add'    ? 'border-green-200 focus:border-green-500 focus:ring-green-500/20' :
									modalAction === 'deduct' ? 'border-red-200 focus:border-red-500 focus:ring-red-500/20' :
									                          'border-blue-200 focus:border-blue-500 focus:ring-blue-500/20'
								)}
							/>
							<span class="absolute right-4 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-gray-400">
								{selectedItem.unit}
							</span>
						</div>
					</div>

					<!-- Reason -->
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Reason (Optional)</span>
						<input type="text" bind:value={adjustReason} placeholder="e.g. Audit correction, spoilage…" class="pos-input" />
					</div>

				</div>
			{:else}
				<div class="flex items-center justify-center px-5 py-6 text-sm text-gray-400">
					Select an action above to continue
				</div>
			{/if}

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 rounded-b-2xl border-t border-border bg-gray-50 p-4">
				<button onclick={closeModal} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
					Cancel
				</button>
				{#if modalAction}
					<button
						onclick={handleConfirm}
						disabled={confirmDisabled}
						class={cn(
							'rounded-lg px-5 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
							modalAction === 'add'    ? 'bg-green-600 hover:bg-green-700' :
							modalAction === 'deduct' ? 'bg-red-600 hover:bg-red-700' :
							                          'bg-blue-600 hover:bg-blue-700'
						)}
					>
						{modalAction === 'add' ? 'Confirm Addition' : modalAction === 'deduct' ? 'Confirm Deduction' : 'Set Stock Level'}
					</button>
				{/if}
			</div>

		</div>
	</div>
{/if}
