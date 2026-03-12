<script lang="ts">
	import { cn, formatWeightStr, formatTimeAgo } from '$lib/utils';
	import { slide, fade } from 'svelte/transition';
	import {
		stockItems, getCurrentStock, getStockStatus, getSpoilageAlerts, getApproachingLowItems,
		type StockStatus, type StockCategory, type StockItem
	} from '$lib/stores/stock.svelte';
	import { menuItems, toggleMenuItemAvailability } from '$lib/stores/pos.svelte';
	import { session, isWarehouseSession } from '$lib/stores/session.svelte';
	import { Search, AlertTriangle, Clock } from 'lucide-svelte';
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

	// Kitchen staff can make stock adjustments (Add/Deduct) but cannot edit item details or toggle 86
	// Warehouse staff (role=staff at wh-tag) also cannot toggle 86 — it only affects the POS menu
	const isReadonly = $derived(false);
	const canEditDetails = $derived(session.role !== 'kitchen');
	const can86 = $derived(canEditDetails && !(isWarehouseSession() && session.role === 'staff'));

	// ─── 86 Toast ─────────────────────────────────────────────────────────────
	let toast86Msg = $state<string | null>(null);
	let toast86Timer: ReturnType<typeof setTimeout> | null = null;

	function handle86Toggle(menuItemId: string, itemName: string, currentlyAvailable: boolean) {
		toggleMenuItemAvailability(menuItemId);
		if (toast86Timer) clearTimeout(toast86Timer);
		toast86Msg = currentlyAvailable
			? `${itemName} marked sold out (86'd)`
			: `${itemName} restored to menu`;
		toast86Timer = setTimeout(() => { toast86Msg = null; toast86Timer = null; }, 3000);
	}

	// ─── View / Search / Filter ───────────────────────────────────────────────
	let viewMode     = $state<'grid' | 'list'>('list');
	let searchQuery  = $state('');
	let filterStatus = $state<'all' | 'ok' | 'low' | 'critical'>('all');

	type SortColumn = 'name' | 'stock';
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

	// ─── [06] Spoilage alerts ──────────────────────────────────────────────────
	const spoilageAlerts = $derived(getSpoilageAlerts());

	// ─── [10] Needs Attention items ────────────────────────────────────────────
	const lowItems = $derived(items.filter(i => i.status === 'low'));
	const criticalItems = $derived(items.filter(i => i.status === 'critical'));
	const approachingLow = $derived(getApproachingLowItems());
	const hasAttentionItems = $derived(lowItems.length > 0 || criticalItems.length > 0 || spoilageAlerts.length > 0 || approachingLow.length > 0);
	let attentionExpanded = $state(true);

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

	// ─── [04] Default groups collapsed; auto-expand only those with low/critical ──
	const expandedGroups = $state<Record<string, boolean>>({
		beef: false, pork: false, chicken: false, other: false,
	});

	// Auto-expand groups with low/critical items on data change
	$effect(() => {
		const allGrouped = items.filter(i => i.category === 'Meats');
		for (const protein of ['beef', 'pork', 'chicken', 'other'] as MeatProtein[]) {
			const groupItems = allGrouped.filter(i => (i.proteinType || 'other') === protein);
			const hasIssues = groupItems.some(i => i.status === 'low' || i.status === 'critical');
			if (hasIssues) expandedGroups[protein] = true;
		}
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

<!-- ─── [06][10] Needs Attention Section ──────────────────────────────────── -->
{#if hasAttentionItems}
	<div class="mb-5 rounded-xl border border-status-yellow/30 bg-status-yellow-light/20 overflow-hidden" transition:slide={{ duration: 250 }}>
		<button
			class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-status-yellow-light/30 transition-colors"
			onclick={() => attentionExpanded = !attentionExpanded}
		>
			<div class="flex items-center gap-2">
				<AlertTriangle class="w-4 h-4 text-status-yellow" />
				<span class="text-sm font-bold text-gray-900">Needs Attention</span>
				<span class="text-xs text-gray-500">
					{criticalItems.length + lowItems.length + spoilageAlerts.length + approachingLow.length} item{criticalItems.length + lowItems.length + spoilageAlerts.length + approachingLow.length !== 1 ? 's' : ''}
				</span>
			</div>
			<span class="text-xs text-gray-400">{attentionExpanded ? 'Hide' : 'Show'}</span>
		</button>

		{#if attentionExpanded}
			<div class="px-4 pb-3 flex flex-col gap-2" transition:slide={{ duration: 200 }}>
				{#each criticalItems as item}
					<button
						class="flex items-center justify-between rounded-lg bg-status-red-light/40 border border-status-red/20 px-3 py-2 text-left hover:bg-status-red-light/60 transition-colors"
						onclick={() => openItemModal(item)}
					>
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-status-red"></span>
							<span class="text-sm font-semibold text-gray-900">{item.name}</span>
							<span class="text-xs font-bold text-status-red">CRITICAL</span>
						</div>
						<span class="text-sm font-mono text-gray-700">{formatWeightStr(item.currentStock, item.unit)}</span>
					</button>
				{/each}

				{#each lowItems as item}
					<button
						class="flex items-center justify-between rounded-lg bg-status-yellow-light/40 border border-status-yellow/20 px-3 py-2 text-left hover:bg-status-yellow-light/60 transition-colors"
						onclick={() => openItemModal(item)}
					>
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-status-yellow"></span>
							<span class="text-sm font-semibold text-gray-900">{item.name}</span>
							<span class="text-xs font-bold text-status-yellow">LOW</span>
						</div>
						<span class="text-sm font-mono text-gray-700">{formatWeightStr(item.currentStock, item.unit)}</span>
					</button>
				{/each}

				{#each spoilageAlerts as alert}
					<div class="flex items-center justify-between rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
						<div class="flex items-center gap-2">
							<Clock class="w-3.5 h-3.5 text-orange-500" />
							<span class="text-sm font-semibold text-gray-900">{alert.itemName}</span>
							<span class="text-xs font-bold text-orange-600">
								{alert.daysLeft <= 0 ? 'EXPIRED' : `Expires in ${alert.daysLeft}d`}
							</span>
						</div>
						{#if alert.batchNo}
							<span class="text-xs text-gray-500">Batch {alert.batchNo}</span>
						{/if}
					</div>
				{/each}

				{#each approachingLow as item}
					<button
						class="flex items-center justify-between rounded-lg bg-amber-50/50 border border-amber-200/50 px-3 py-2 text-left hover:bg-amber-50 transition-colors"
						onclick={() => openItemModal(item)}
					>
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-amber-400"></span>
							<span class="text-sm text-gray-700">{item.name}</span>
							<span class="text-[10px] text-amber-600 font-medium">Near threshold ({Math.round(item.pctAboveMin)}% above min)</span>
						</div>
						<span class="text-sm font-mono text-gray-500">{formatWeightStr(item.currentStock, item.unit)}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div class="mb-5 rounded-xl border border-status-green/20 bg-status-green-light/10 px-4 py-3 flex items-center gap-2">
		<span class="h-2 w-2 rounded-full bg-status-green"></span>
		<span class="text-sm text-gray-600">All items within healthy ranges.</span>
	</div>
{/if}

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
									readonly={!canEditDetails}
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
								readonly={!canEditDetails}
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
						<th class="w-16 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each listGroups as catGroup}
						{#if catGroup.isMeat}
							{#each catGroup.proteinGroups as group}
								{@const config = proteinConfig[group.protein]}
								<tr class="{config.bgLight} border-l-4 {config.borderColor}">
									<td colspan="5" class="p-0">
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
											readonly={!canEditDetails}
											onHover={(id) => hoveredItemId = id}
											animate={true}
											hideCategory={true}
											menuAvailable={menuItemsById.get(item.menuItemId)?.available ?? true}
											onToggle86={can86 ? () => handle86Toggle(item.menuItemId, item.name, menuItemsById.get(item.menuItemId)?.available ?? true) : undefined}
										/>
									{/each}
								{/if}
							{/each}
						{:else}
							<tr class="bg-gray-50/50">
								<td colspan="5" class="px-4 py-1.5">
									<span class="text-xs font-bold uppercase tracking-wide text-gray-400">{catGroup.category}</span>
								</td>
							</tr>
							{#each catGroup.items as item (item.id)}
								<InventoryItemRow
									{item}
									onOpenModal={openItemModal}
									onEditClick={openEditModalClick}
									readonly={!canEditDetails}
									menuAvailable={menuItemsById.get(item.menuItemId)?.available ?? true}
									onToggle86={can86 ? () => handle86Toggle(item.menuItemId, item.name, menuItemsById.get(item.menuItemId)?.available ?? true) : undefined}
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

<!-- ─── 86 Toast ─────────────────────────────────────────────────────────────── -->
{#if toast86Msg}
	<div
		class="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl bg-gray-900 px-5 py-3.5 text-white shadow-xl"
		transition:fade={{ duration: 200 }}
	>
		<svg class="w-5 h-5 shrink-0 text-status-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
		</svg>
		<span class="text-sm font-semibold">{toast86Msg}</span>
	</div>
{/if}
