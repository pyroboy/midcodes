<script lang="ts">
	import { cn } from '$lib/utils';
	import { slide, fade } from 'svelte/transition';
	import {
		stockItems, getCurrentStock, getStockStatus,
		adjustStock, setStock,
		type StockStatus, type StockCategory, type StockItem
	} from '$lib/stores/stock.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { LayoutGrid, List, Search, Plus, Minus, X, Pencil, MapPin, Edit3 } from 'lucide-svelte';
	
	import StockHealthStrip from './StockHealthStrip.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import StockLevelBar from './StockLevelBar.svelte';
	import ProteinGroupHeader from './ProteinGroupHeader.svelte';
	import ProteinDonutChart from './ProteinDonutChart.svelte';
	import { proteinConfig, getProteinType, type MeatProtein } from '$lib/stores/stock.svelte';

	const statusConfig: Record<StockStatus, { label: string; badgeClass: string; dotClass: string }> = {
		ok:       { label: 'Well-Stocked', badgeClass: 'bg-status-green-light text-status-green border-status-green/20',    dotClass: 'bg-status-green' },
		low:      { label: 'Low Stock',    badgeClass: 'bg-status-yellow-light text-status-yellow border-status-yellow/30', dotClass: 'bg-status-yellow' },
		critical: { label: 'Critical',     badgeClass: 'bg-status-red-light text-status-red border-status-red/20',          dotClass: 'bg-status-red' },
	};



	// ─── View / Search / Filter ────────────────────────────────────────────────
	let viewMode     = $state<'grid' | 'list'>('list');
	let searchQuery  = $state('');
	let filterStatus = $state<'all' | 'ok' | 'low' | 'critical'>('all');
	
	type SortColumn = 'name' | 'stock' | 'status';
	let sortColumn = $state<SortColumn>('name');
	let sortDesc   = $state(false);

	// Reset filter when branch changes
	$effect(() => {
		session.locationId; // track dependency
		filterStatus = 'all';
		searchQuery  = '';
	});

	interface InventoryItem extends StockItem { currentStock: number; status: StockStatus; description?: string; image?: string; }

	const items = $derived(
		stockItems.value
			.filter(s => session.locationId === 'all' || s.locationId === session.locationId)
			.map(s => ({
				...s,
				currentStock: getCurrentStock(s.id),
				status: getStockStatus(s.id),
			} as InventoryItem))
	);

	const filteredAndSorted = $derived.by(() => {
		const filtered = items.filter(s => {
			const matchStatus = filterStatus === 'all' || s.status === filterStatus;
			const q = searchQuery.trim().toLowerCase();
			const matchSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
			return matchStatus && matchSearch;
		});

		return filtered.sort((a, b) => {
			let cmp = 0;
			if (sortColumn === 'name') cmp = a.name.localeCompare(b.name);
			else if (sortColumn === 'stock') cmp = a.currentStock - b.currentStock;
			else if (sortColumn === 'status') {
				const map = { critical: 0, low: 1, ok: 2 };
				cmp = map[a.status] - map[b.status];
			}
			return sortDesc ? -cmp : cmp;
		});
	});

	interface ProteinGroup {
		protein: MeatProtein;
		items: InventoryItem[];
		totalStock: number;
		criticalCount: number;
		lowCount: number;
	}

	const expandedGroups = $state<Record<string, boolean>>({
		beef: true,
		pork: true,
		chicken: true,
		other: true,
	});

	let hoveredItemId = $state<string | null>(null);

	function toggleGroup(key: string) {
		expandedGroups[key] = !expandedGroups[key];
	}

	function handleExpandAll() {
		for (let key in expandedGroups) expandedGroups[key] = true;
	}

	function handleCollapseAll() {
		for (let key in expandedGroups) expandedGroups[key] = false;
	}

	const gridGroups = $derived.by(() => {
		const groups: Record<MeatProtein, ProteinGroup> = {
			beef: { protein: 'beef', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			pork: { protein: 'pork', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			chicken: { protein: 'chicken', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			other: { protein: 'other', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
		};
		const nonMeatItems: InventoryItem[] = [];
		
		for (const item of filteredAndSorted) {
			if (item.category === 'Meats') {
				const protein = item.proteinType || 'other';
				groups[protein].items.push(item);
				groups[protein].totalStock += item.currentStock;
				if (item.status === 'critical') groups[protein].criticalCount++;
				if (item.status === 'low') groups[protein].lowCount++;
			} else {
				nonMeatItems.push(item);
			}
		}
		
		return {
			meatGroups: ['beef', 'pork', 'chicken', 'other']
				.map(p => groups[p as MeatProtein])
				.filter(g => g.items.length > 0),
			nonMeatItems
		};
	});

	// For list view, group by category, and subgroup Meats by protein
	const listGroups = $derived.by(() => {
		const categories: {
			category: string;
			items: InventoryItem[];
			isMeat: boolean;
			proteinGroups: ProteinGroup[];
		}[] = [];
		
		const catMap = new Map<string, InventoryItem[]>();
		for (const item of filteredAndSorted) {
			if (!catMap.has(item.category)) catMap.set(item.category, []);
			catMap.get(item.category)!.push(item);
		}
		
		for (const [category, items] of catMap) {
			if (category === 'Meats') {
				const pGroups: Record<MeatProtein, ProteinGroup> = {
					beef: { protein: 'beef', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
					pork: { protein: 'pork', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
					chicken: { protein: 'chicken', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
					other: { protein: 'other', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
				};
				for (const item of items) {
					const protein = item.proteinType || 'other';
					pGroups[protein].items.push(item);
					pGroups[protein].totalStock += item.currentStock;
					if (item.status === 'critical') pGroups[protein].criticalCount++;
					if (item.status === 'low') pGroups[protein].lowCount++;
				}
				categories.push({
					category,
					items: [],
					isMeat: true,
					proteinGroups: ['beef', 'pork', 'chicken', 'other']
						.map(p => pGroups[p as MeatProtein])
						.filter(g => g.items.length > 0)
				});
			} else {
				categories.push({ category, items, isMeat: false, proteinGroups: [] });
			}
		}
		
		// Sort so Meats are always first, followed by other categories alphabetically.
		return categories.sort((a, b) => {
			if (a.isMeat) return -1;
			if (b.isMeat) return 1;
			return a.category.localeCompare(b.category);
		});
	});

	function getProteinBorderClass(protein?: MeatProtein) {
		if (protein === 'beef') return 'hover:border-red-300';
		if (protein === 'pork') return 'hover:border-orange-300';
		if (protein === 'chicken') return 'hover:border-yellow-300';
		return 'hover:border-accent/30';
	}

	function getProteinStripeClass(protein?: MeatProtein) {
		if (protein === 'beef') return 'bg-red-500';
		if (protein === 'pork') return 'bg-orange-500';
		if (protein === 'chicken') return 'bg-yellow-500';
		return 'bg-transparent';
	}

	function toggleSort(col: SortColumn) {
		if (sortColumn === col) sortDesc = !sortDesc;
		else { sortColumn = col; sortDesc = false; }
	}

	// Constants are no longer needed here since StockLevelBar handles it

	// ─── Modal ────────────────────────────────────────────────────────────────
	let selectedItem = $state<InventoryItem | null>(null);
	let modalAction  = $state<'add' | 'deduct' | 'set' | null>(null);
	let adjustQty    = $state('');
	let adjustReason = $state('');

	function openItemModal(item: InventoryItem) {
		selectedItem = item;
		modalAction  = null;
		adjustQty    = '';
		adjustReason = '';
	}

	function selectAction(action: 'add' | 'deduct' | 'set') {
		modalAction  = action;
		adjustReason = '';
		adjustQty    = action === 'set' ? String(selectedItem?.currentStock ?? 0) : '';
	}

	function closeModal() {
		selectedItem = null;
		modalAction  = null;
	}

	async function handleConfirm() {
		if (!selectedItem || !modalAction) return;
		const qty = parseFloat(adjustQty);
		if (isNaN(qty) || qty < 0) return;
		if (modalAction !== 'set' && qty <= 0) return;
		// Reason required for deduct and set (audit compliance)
		if ((modalAction === 'deduct' || modalAction === 'set') && !adjustReason.trim()) return;

		if (modalAction === 'set') {
			await setStock(selectedItem.id, selectedItem.name, qty, selectedItem.unit, adjustReason);
		} else {
			await adjustStock(selectedItem.id, selectedItem.name, modalAction, qty, selectedItem.unit, adjustReason);
		}
		closeModal();
	}

	const reasonRequired = $derived(modalAction === 'deduct' || modalAction === 'set');
	const confirmDisabled = $derived(
		!adjustQty ||
		isNaN(parseFloat(adjustQty)) ||
		parseFloat(adjustQty) < 0 ||
		(modalAction !== 'set' && parseFloat(adjustQty) <= 0) ||
		(reasonRequired && !adjustReason.trim())
	);

	// ─── Edit Modal ────────────────────────────────────────────────────────────
	let showEditModal = $state(false);
	let editItem = $state<InventoryItem | null>(null);
	let editName = $state('');
	let editDesc = $state('');
	let editImage = $state<File | null>(null);
	let editImageUrl = $state<string | undefined>(undefined);

	function openEditModalClick(item: InventoryItem, e: MouseEvent) {
		e.stopPropagation();
		editItem = item;
		editName = item.name;
		editDesc = item.description || '';
		editImage = null;
		editImageUrl = item.image;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editItem = null;
	}

	async function handleEditConfirm() {
		if (!editItem || !editName.trim()) return;
		
		const updates = {
			name: editName.trim(),
			description: editDesc,
			...(editImageUrl !== undefined && { image: editImageUrl })
		};

		import('$lib/stores/stock.svelte').then(async m => {
			await m.updateStockItem(editItem!.id, updates as any);
			closeEditModal();
		});
	}
</script>

<div class="mb-5">
	<StockHealthStrip bind:activeFilter={filterStatus} onFilterClick={(s) => filterStatus = s} />
</div>

<!-- ─── Toolbar ───────────────────────────────────────────────────────────── -->
<div class="mb-4 flex flex-col md:flex-row md:items-center gap-3">
	<!-- Search -->
	<div class="relative flex-1">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search items or category…"
			class="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
		/>
		{#if searchQuery}
			<button
				onclick={() => (searchQuery = '')}
				class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700 transition-colors"
			>
				<X class="w-3.5 h-3.5" />
			</button>
		{/if}
	</div>

	<!-- Expand/Collapse all -->
	<div class="flex items-center gap-2">
		<button onclick={handleExpandAll} class="text-xs font-semibold px-3 py-2 bg-gray-50 border border-border text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
			Expand All
		</button>
		<button onclick={handleCollapseAll} class="text-xs font-semibold px-3 py-2 bg-gray-50 border border-border text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
			Collapse All
		</button>
	</div>

	<!-- View toggle -->
	<div class="flex items-center gap-0.5 rounded-lg border border-border bg-white p-1">
		<button
			onclick={() => (viewMode = 'list')}
			class={cn('rounded p-2 transition-colors', viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-100')}
			title="List view"
		>
			<List class="w-4 h-4" />
		</button>
		<button
			onclick={() => (viewMode = 'grid')}
			class={cn('rounded p-2 transition-colors', viewMode === 'grid' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-100')}
			title="Grid view"
		>
			<LayoutGrid class="w-4 h-4" />
		</button>
	</div>
</div>

<!-- ─── Grid View ─────────────────────────────────────────────────────────── -->
{#if viewMode === 'grid'}
	{#if filteredAndSorted.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-gray-400">
			<Search class="w-10 h-10 mb-3 opacity-25" />
			<p class="font-medium text-gray-500">No items match your search</p>
			<p class="text-sm mt-1">Try a different term or remove the filter</p>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#each gridGroups.meatGroups as group}
				<div class="flex flex-col gap-4">
					<ProteinGroupHeader 
						protein={group.protein} 
						itemCount={group.items.length} 
						criticalCount={group.criticalCount} 
						lowCount={group.lowCount} 
						expanded={expandedGroups[group.protein]} 
						onToggle={() => toggleGroup(group.protein)}
						chartData={group.items.map(i => ({ id: i.id, label: i.name, value: i.currentStock }))}
						hoveredItemId={hoveredItemId}
						onHover={(id: string | null) => hoveredItemId = id}
					/>
					
					{#if expandedGroups[group.protein]}
						<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" transition:slide={{ duration: 300 }}>
							{#each group.items as item (item.id)}
								<button
									onclick={() => openItemModal(item)}
									onmouseenter={() => hoveredItemId = item.id}
									onmouseleave={() => hoveredItemId = null}
									onfocus={() => hoveredItemId = item.id}
									onblur={() => hoveredItemId = null}
									class={cn(
										'pos-card flex flex-col overflow-hidden text-left transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.99]',
										getProteinBorderClass(item.proteinType),
										item.status === 'critical' ? 'ring-1 ring-status-red/30' : '',
										hoveredItemId === item.id ? 'shadow-md -translate-y-0.5 ring-2 ring-accent/30' : ''
									)}
								>
									<div class={cn("h-1 w-full relative overflow-hidden transition-all", getProteinStripeClass(item.proteinType))}>
										{#if hoveredItemId === item.id}
											<div class="absolute inset-0 bg-white/30 animate-pulse"></div>
										{/if}
									</div>
									
									<!-- Info -->
									<div class="flex flex-col gap-2 p-4 pt-3" in:fade={{ duration: 200, delay: 100 }}>
										<div class="flex flex-wrap items-center gap-2">
											<CategoryIcon category={item.category} class="h-8 w-8" iconClass="w-4 h-4" />
										</div>
										
										<p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 mt-2">{item.name}</p>
										
										<p class="font-mono text-xl font-bold text-gray-900 mt-1">
											{item.currentStock.toLocaleString()}
											<span class="text-xs font-normal text-gray-400">{item.unit}</span>
										</p>
										<!-- Stock gauge -->
										<StockLevelBar current={item.currentStock} min={item.minLevel} status={item.status} class="mt-1" />
										
										<div class="flex items-center gap-1.5 mt-1 text-xs">
											<span class={cn('h-2 w-full flex-shrink-0 rounded-full w-2', statusConfig[item.status].dotClass)}></span>
											<span class={cn(
												'font-semibold',
												item.status === 'ok' ? 'text-status-green' : item.status === 'low' ? 'text-status-yellow' : 'text-status-red'
											)}>
												{statusConfig[item.status].label}
											</span>
											<span class="text-gray-400 ml-auto">Min: {item.minLevel.toLocaleString()}</span>
										</div>

										<div class="mt-2 flex justify-end">
											<div 
												role="button"
												tabindex="0"
												onclick={(e) => openEditModalClick(item, e)}
												onkeydown={(e) => e.key === 'Enter' && openEditModalClick(item, e as any)}
												class="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
											>
												<Edit3 class="w-3 h-3" /> Edit Info
											</div>
										</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			{#if gridGroups.nonMeatItems.length > 0}
					<div class="flex flex-col gap-4">
						{#if gridGroups.meatGroups.length > 0}
						<div class="flex items-center gap-2 mt-2 mb-2">
							<div class="h-px bg-border flex-1"></div>
							<span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Other Items</span>
							<div class="h-px bg-border flex-1"></div>
						</div>
					{/if}
					<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{#each gridGroups.nonMeatItems as item (item.id)}
							<button
								onclick={() => openItemModal(item)}
								class={cn(
									'pos-card flex flex-col overflow-hidden text-left transition-all hover:shadow-md hover:border-accent/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.99]',
									item.status === 'critical' && 'ring-1 ring-status-red/30'
								)}
							>
								<!-- Info -->
								<div class="flex flex-col gap-2 p-4 pt-4">
									<div class="flex flex-wrap items-center gap-2">
										<CategoryIcon category={item.category} class="h-8 w-8" iconClass="w-4 h-4" />
									</div>
									
									<p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 mt-2">{item.name}</p>
									
									<p class="font-mono text-xl font-bold text-gray-900 mt-1">
										{item.currentStock.toLocaleString()}
										<span class="text-xs font-normal text-gray-400">{item.unit}</span>
									</p>
									<!-- Stock gauge -->
									<StockLevelBar current={item.currentStock} min={item.minLevel} status={item.status} class="mt-1" />
									
									<div class="flex items-center gap-1.5 mt-1 text-xs">
										<span class={cn('h-2 w-full flex-shrink-0 rounded-full w-2', statusConfig[item.status].dotClass)}></span>
										<span class={cn(
											'font-semibold',
											item.status === 'ok' ? 'text-status-green' : item.status === 'low' ? 'text-status-yellow' : 'text-status-red'
										)}>
											{statusConfig[item.status].label}
										</span>
										<span class="text-gray-400 ml-auto">Min: {item.minLevel.toLocaleString()}</span>
									</div>

									<div class="mt-2 flex justify-end">
										<div 
											role="button"
											tabindex="0"
											onclick={(e) => openEditModalClick(item, e)}
											onkeydown={(e) => e.key === 'Enter' && openEditModalClick(item, e as any)}
											class="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
										>
											<Edit3 class="w-3 h-3" /> Edit Info
										</div>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

<!-- ─── List View ─────────────────────────────────────────────────────────── -->
{:else}
	<div class="overflow-hidden rounded-xl border border-border bg-white">
		{#if filteredAndSorted.length === 0}
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
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-100/50 transition-colors group" onclick={() => toggleSort('name')}>
							Item
							<span class="ml-1 inline-block w-2 text-gray-400">{sortColumn === 'name' ? (sortDesc ? '↓' : '↑') : ''}</span>
						</th>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Stock Level</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-100/50 transition-colors group" onclick={() => toggleSort('stock')}>
							Current / Min
							<span class="ml-1 inline-block w-2 text-gray-400">{sortColumn === 'stock' ? (sortDesc ? '↓' : '↑') : ''}</span>
						</th>
						<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-100/50 transition-colors group" onclick={() => toggleSort('status')}>
							Status
							<span class="ml-1 inline-block w-2 text-gray-400">{sortColumn === 'status' ? (sortDesc ? '↓' : '↑') : ''}</span>
						</th>
						<th class="w-16 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each listGroups as catGroup}
						{#if catGroup.isMeat}
							{#each catGroup.proteinGroups as group}
								{@const config = proteinConfig[group.protein]}
								<tr class="{config.bgLight} border-l-4 {config.borderColor}">
									<td colspan="6" class="p-0">
										<ProteinGroupHeader 
											protein={group.protein}
											itemCount={group.items.length}
											criticalCount={group.criticalCount}
											lowCount={group.lowCount}
											expanded={expandedGroups[group.protein]}
											onToggle={() => toggleGroup(group.protein)}
											chartData={group.items.map(i => ({ id: i.id, label: i.name, value: i.currentStock }))}
											hoveredItemId={hoveredItemId}
											onHover={(id: string | null) => hoveredItemId = id}
											noBorder={true}
											noBg={true}
										/>
									</td>
								</tr>
								{#if expandedGroups[group.protein]}
									{#each group.items as item (item.id)}
										<tr
											onclick={() => openItemModal(item)}
											onmouseenter={() => hoveredItemId = item.id}
											onmouseleave={() => hoveredItemId = null}
											class={cn(
												'cursor-pointer transition-colors hover:bg-gray-50',
												item.status === 'critical' ? 'bg-status-red-light/20' : '',
												hoveredItemId === item.id ? 'bg-accent/5 shadow-[inset_2px_0_0_0_rgba(14,165,233,0.5)]' : ''
											)}
											transition:slide={{ duration: 300 }}
										>
											<!-- Category icon -->
											<td class="px-4 py-3" in:fade={{ duration: 200 }}>
												<div class="flex items-center gap-2 w-max">
													<CategoryIcon category={item.category} class="h-9 w-9" iconClass="w-4 h-4" />
												</div>
											</td>
											<td class="px-4 py-3">
												<p class="font-medium text-gray-900">{item.name}</p>
											</td>
											<td class="px-4 py-3 text-gray-500 font-medium">
												{item.category}
											</td>
											<td class="px-4 py-3 w-36">
												<StockLevelBar current={item.currentStock} min={item.minLevel} status={item.status} />
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
											<td class="px-4 py-3 text-right">
												<button 
													class="text-gray-400 hover:text-accent transition-colors"
													onclick={(e) => openEditModalClick(item, e)}
													aria-label="Edit Info"
												>
													<Edit3 class="w-4 h-4" />
												</button>
											</td>
										</tr>
									{/each}
								{/if}
							{/each}
						{:else}
							<tr class="bg-gray-50/50">
								<td colspan="6" class="px-4 py-1.5">
									<span class="text-xs font-bold uppercase tracking-wide text-gray-400">{catGroup.category}</span>
								</td>
							</tr>
							{#each catGroup.items as item (item.id)}
								<tr
									onclick={() => openItemModal(item)}
									class={cn(
										'cursor-pointer transition-colors hover:bg-gray-50',
										item.status === 'critical' && 'bg-status-red-light/20'
									)}
								>
									<!-- Category icon -->
									<td class="px-4 py-3">
										<CategoryIcon category={item.category} class="h-9 w-9" iconClass="w-4 h-4" />
									</td>
									<td class="px-4 py-3">
										<p class="font-medium text-gray-900">{item.name}</p>
									</td>
									<td class="px-4 py-3 text-gray-500 font-medium">
										{item.category}
									</td>
									<td class="px-4 py-3 w-36">
										<StockLevelBar current={item.currentStock} min={item.minLevel} status={item.status} />
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
									<td class="px-4 py-3 text-right">
										<button 
											class="text-gray-400 hover:text-accent transition-colors"
											onclick={(e) => openEditModalClick(item, e)}
											aria-label="Edit Info"
										>
											<Edit3 class="w-4 h-4" />
										</button>
									</td>
								</tr>
							{/each}
						{/if}
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
					<CategoryIcon category={selectedItem.category} class="h-12 w-12" iconClass="w-6 h-6" />
					<div>
						<h3 class="font-bold text-gray-900 leading-tight">{selectedItem.name}</h3>
						<p class="text-xs text-gray-500 mt-0.5">
							Current:
							<span class="font-mono font-bold text-gray-900">{selectedItem.currentStock.toLocaleString()} {selectedItem.unit}</span>
							<span class="mx-1 text-gray-300">·</span>
							Min: <span class="font-mono font-semibold text-gray-600">{selectedItem.minLevel.toLocaleString()}</span>
						</p>
					</div>
				</div>
				<button onclick={closeModal} class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Action selector -->
			<div class="px-5 pt-4 pb-3">
				<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Select Action</p>
				<div class="grid grid-cols-3 gap-2">
					<button
						onclick={() => selectAction('add')}
						class={cn(
							'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
							modalAction === 'add' ? 'border-green-500 bg-green-50' : 'border-border bg-white hover:border-green-300 hover:bg-green-50/50'
						)}
					>
						<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'add' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500')}>
							<Plus class="w-4 h-4" />
						</div>
						<span class={cn('text-xs font-semibold', modalAction === 'add' ? 'text-green-700' : 'text-gray-600')}>Add</span>
					</button>
					<button
						onclick={() => selectAction('deduct')}
						class={cn(
							'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
							modalAction === 'deduct' ? 'border-red-500 bg-red-50' : 'border-border bg-white hover:border-red-300 hover:bg-red-50/50'
						)}
					>
						<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'deduct' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500')}>
							<Minus class="w-4 h-4" />
						</div>
						<span class={cn('text-xs font-semibold', modalAction === 'deduct' ? 'text-red-700' : 'text-gray-600')}>Deduct</span>
					</button>
					<button
						onclick={() => selectAction('set')}
						class={cn(
							'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
							modalAction === 'set' ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:border-blue-300 hover:bg-blue-50/50'
						)}
					>
						<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'set' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>
							<Pencil class="w-4 h-4" />
						</div>
						<span class={cn('text-xs font-semibold', modalAction === 'set' ? 'text-blue-700' : 'text-gray-600')}>Set Level</span>
					</button>
				</div>
			</div>

			<!-- Form -->
			{#if modalAction}
				<div class="px-5 pb-2 flex flex-col gap-4">

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
								step="any"
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
						<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">
							Reason {reasonRequired ? '*' : '(Optional)'}
						</span>
						<input
							type="text"
							bind:value={adjustReason}
							placeholder={modalAction === 'deduct' ? 'e.g. Spoilage, manual correction…' : modalAction === 'set' ? 'e.g. Physical count result…' : 'e.g. New delivery received…'}
							class="pos-input"
						/>
						{#if reasonRequired && adjustReason.trim() === '' && adjustQty}
							<p class="text-xs text-status-red">Reason is required for {modalAction === 'deduct' ? 'deductions' : 'stock level overrides'}.</p>
						{/if}
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
							'rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40',
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

<!-- ─── Edit Details Modal ──────────────────────────────────────────────────── -->
{#if showEditModal && editItem}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
		<div class="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl flex flex-col">
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<h3 class="font-bold text-gray-900 leading-tight">Edit Item Info</h3>
				<button onclick={closeEditModal} class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="px-5 py-4 flex flex-col gap-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Name *</span>
					<input type="text" bind:value={editName} class="pos-input" />
				</label>
				
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Description (Optional)</span>
					<textarea bind:value={editDesc} class="pos-input resize-none h-20" placeholder="e.g. For cooking use"></textarea>
				</label>

				<!-- Image Upload -->
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Picture</span>
					{#if editImageUrl}
						<div class="mb-2 relative w-32 h-32 rounded-lg overflow-hidden border border-border">
							<img src={editImageUrl} alt="Preview" class="w-full h-full object-cover bg-gray-50" />
							<button 
								onclick={(e) => { e.preventDefault(); editImageUrl = undefined; editImage = null; }}
								class="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
								title="Remove image"
							>
								✕
							</button>
						</div>
					{/if}
					<input 
						type="file" 
						accept="image/*" 
						onchange={(e) => {
							const target = e.currentTarget;
							const file = target?.files?.[0];
							if (file) {
								editImage = file;
								editImageUrl = URL.createObjectURL(file);
							}
						}}
						class="pos-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
					/>
				</label>
			</div>

			<div class="flex items-center justify-end gap-3 rounded-b-2xl border-t border-border bg-gray-50 p-4">
				<button onclick={closeEditModal} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
					Cancel
				</button>
				<button 
					onclick={handleEditConfirm}
					disabled={!editName.trim()}
					class="rounded-lg px-5 py-2.5 text-sm font-bold text-white bg-accent hover:bg-accent-light hover:text-accent transition-colors disabled:cursor-not-allowed disabled:opacity-40"
				>
					Save Changes
				</button>
			</div>
		</div>
	</div>
{/if}
