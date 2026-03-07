<script lang="ts">
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import {
		stockItems, getCurrentStock, getStockStatus,
		type StockStatus, type StockCategory, type StockItem
	} from '$lib/stores/stock.svelte';
	import { menuItems } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { Search } from 'lucide-svelte';
	import { STOCK_IMAGES } from '$lib/stores/stock.images';
	import AllLocationsInventory from './AllLocationsInventory.svelte';

	function fallbackImage(name: string): string {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#6B7280"/><text x="100" y="108" font-family="Inter,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${name.substring(0, 15)}</text></svg>`;
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}

	import StockHealthStrip from './StockHealthStrip.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import ProteinGroupHeader from './ProteinGroupHeader.svelte';
	import { proteinConfig, getProteinType, type MeatProtein } from '$lib/stores/stock.svelte';

	import InventoryToolbar from './InventoryToolbar.svelte';
	import InventoryActionModal from './InventoryActionModal.svelte';
	import InventoryEditModal from './InventoryEditModal.svelte';
	import InventoryItemCard from './InventoryItemCard.svelte';
	import InventoryItemRow from './InventoryItemRow.svelte';

	// ─── View / Search / Filter ───────────────────────────────────────────────
	let viewMode     = $state<'grid' | 'list'>('list');
	let searchQuery  = $state('');
	let filterStatus = $state<'all' | 'ok' | 'low' | 'critical'>('all');

	type SortColumn = 'name' | 'stock' | 'status';
	let sortColumn = $state<SortColumn>('name');
	let sortDesc   = $state(false);

	$effect(() => {
		session.locationId;
		filterStatus = 'all';
		searchQuery  = '';
	});

	interface InventoryItem extends StockItem { currentStock: number; status: StockStatus; description?: string; image?: string; }

	const menuItemsById = $derived(new Map(menuItems.value.map(m => [m.id, m])));

	const items = $derived(
		stockItems.value
			.filter(s => session.locationId === 'all' || s.locationId === session.locationId)
			.map(s => {
				const menuItem = menuItemsById.get(s.menuItemId);
				return {
					...s,
					currentStock: getCurrentStock(s.id),
					status: getStockStatus(s.id),
					image: STOCK_IMAGES[s.menuItemId] || s.image || menuItem?.image || fallbackImage(s.name),
				} as InventoryItem;
			})
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
		beef: true, pork: true, chicken: true, other: true,
	});

	let hoveredItemId = $state<string | null>(null);

	function toggleGroup(key: string) { expandedGroups[key] = !expandedGroups[key]; }
	function handleExpandAll() { for (let key in expandedGroups) expandedGroups[key] = true; }
	function handleCollapseAll() { for (let key in expandedGroups) expandedGroups[key] = false; }

	function buildProteinGroups(itemList: InventoryItem[]): Record<MeatProtein, ProteinGroup> {
		return {
			beef:    { protein: 'beef',    items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			pork:    { protein: 'pork',    items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			chicken: { protein: 'chicken', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			other:   { protein: 'other',   items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
		};
	}

	function populateGroups(groups: Record<MeatProtein, ProteinGroup>, item: InventoryItem) {
		const protein = item.proteinType || 'other';
		groups[protein].items.push(item);
		groups[protein].totalStock += item.currentStock;
		if (item.status === 'critical') groups[protein].criticalCount++;
		if (item.status === 'low') groups[protein].lowCount++;
	}

	const gridGroups = $derived.by(() => {
		const groups = buildProteinGroups([]);
		const nonMeatItems: InventoryItem[] = [];
		for (const item of filteredAndSorted) {
			if (item.category === 'Meats') populateGroups(groups, item);
			else nonMeatItems.push(item);
		}
		return {
			meatGroups: (['beef', 'pork', 'chicken', 'other'] as MeatProtein[])
				.map(p => groups[p])
				.filter(g => g.items.length > 0),
			nonMeatItems
		};
	});

	const listGroups = $derived.by(() => {
		const catMap = new Map<string, InventoryItem[]>();
		for (const item of filteredAndSorted) {
			if (!catMap.has(item.category)) catMap.set(item.category, []);
			catMap.get(item.category)!.push(item);
		}

		const categories: { category: string; items: InventoryItem[]; isMeat: boolean; proteinGroups: ProteinGroup[] }[] = [];

		for (const [category, catItems] of catMap) {
			if (category === 'Meats') {
				const pGroups = buildProteinGroups([]);
				for (const item of catItems) populateGroups(pGroups, item);
				categories.push({
					category,
					items: [],
					isMeat: true,
					proteinGroups: (['beef', 'pork', 'chicken', 'other'] as MeatProtein[])
						.map(p => pGroups[p])
						.filter(g => g.items.length > 0)
				});
			} else {
				categories.push({ category, items: catItems, isMeat: false, proteinGroups: [] });
			}
		}

		return categories.sort((a, b) => {
			if (a.isMeat) return -1;
			if (b.isMeat) return 1;
			return a.category.localeCompare(b.category);
		});
	});

	function toggleSort(col: SortColumn) {
		if (sortColumn === col) sortDesc = !sortDesc;
		else { sortColumn = col; sortDesc = false; }
	}

	// ─── Modals ───────────────────────────────────────────────────────────────
	let selectedItem = $state<InventoryItem | null>(null);
	let editingItem  = $state<InventoryItem | null>(null);

	function openItemModal(item: InventoryItem) {
		selectedItem = item;
	}

	function openEditModalClick(item: InventoryItem, e: MouseEvent) {
		e.stopPropagation();
		editingItem = item;
	}
</script>

{#if session.locationId === 'all'}
	<AllLocationsInventory />
{:else}

<div class="mb-5">
	<StockHealthStrip bind:activeFilter={filterStatus} onFilterClick={(s) => filterStatus = s} />
</div>

<InventoryToolbar
	bind:searchQuery
	bind:viewMode
	onExpandAll={handleExpandAll}
	onCollapseAll={handleCollapseAll}
/>

<!-- ─── Grid View ──────────────────────────────────────────────────────────── -->
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
								<InventoryItemCard
									{item}
									{hoveredItemId}
									onOpenModal={openItemModal}
									onEditClick={openEditModalClick}
									onHover={(id) => hoveredItemId = id}
								/>
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
							<InventoryItemCard
								{item}
								onOpenModal={openItemModal}
								onEditClick={openEditModalClick}
							/>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

<!-- ─── List View ──────────────────────────────────────────────────────────── -->
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
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-100/50 transition-colors" onclick={() => toggleSort('name')}>
							Item
							<span class="ml-1 inline-block w-2 text-gray-400">{sortColumn === 'name' ? (sortDesc ? '↓' : '↑') : ''}</span>
						</th>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Stock Level</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-100/50 transition-colors" onclick={() => toggleSort('stock')}>
							Current / Min
							<span class="ml-1 inline-block w-2 text-gray-400">{sortColumn === 'stock' ? (sortDesc ? '↓' : '↑') : ''}</span>
						</th>
						<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-100/50 transition-colors" onclick={() => toggleSort('status')}>
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
										<InventoryItemRow
											{item}
											{hoveredItemId}
											onOpenModal={openItemModal}
											onEditClick={openEditModalClick}
											onHover={(id) => hoveredItemId = id}
											animate={true}
										/>
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
								<InventoryItemRow
									{item}
									onOpenModal={openItemModal}
									onEditClick={openEditModalClick}
								/>
							{/each}
						{/if}
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{/if}

<!-- ─── Modals ─────────────────────────────────────────────────────────────── -->
{#if selectedItem}
	<InventoryActionModal
		selectedItem={selectedItem}
		onClose={() => selectedItem = null}
	/>
{/if}

{#if editingItem}
	<InventoryEditModal
		editItem={editingItem}
		onClose={() => editingItem = null}
	/>
{/if}

{/if}
