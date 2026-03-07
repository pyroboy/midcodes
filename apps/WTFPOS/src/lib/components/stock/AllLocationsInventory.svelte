<script lang="ts">
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import { ChevronDown, ChevronRight, Search } from 'lucide-svelte';

	import {
		stockItems, getCurrentStock, getStockStatus, proteinConfig,
		type StockStatus, type StockItem,
	} from '$lib/stores/stock.svelte';
	import type { MeatProtein } from '$lib/stores/stock.constants';
	import { menuItems } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { STOCK_IMAGES } from '$lib/stores/stock.images';

	import StockHealthStrip from './StockHealthStrip.svelte';
	import InventoryToolbar from './InventoryToolbar.svelte';
	import ProteinGroupHeader from './ProteinGroupHeader.svelte';
	import InventoryItemCard from './InventoryItemCard.svelte';
	import InventoryItemRow from './InventoryItemRow.svelte';

	// ─── Types ────────────────────────────────────────────────────────────────
	const SECTION_LOCATIONS = ['tag', 'pgl', 'wh-tag'] as const;
	type SectionLocId = 'tag' | 'pgl' | 'wh-tag';

	interface InventoryItem extends StockItem { currentStock: number; status: StockStatus; image?: string; description?: string; }
	interface ProteinGroup { protein: MeatProtein; items: InventoryItem[]; totalStock: number; criticalCount: number; lowCount: number; }
	interface CategoryGroup { category: string; items: InventoryItem[]; isMeat: boolean; proteinGroups: ProteinGroup[]; }
	interface LocationSummary { itemCount: number; criticalCount: number; lowCount: number; totalMeatGrams: number; }
	interface LocationSection { locId: SectionLocId; summary: LocationSummary; listGroups: CategoryGroup[]; gridGroups: { meatGroups: ProteinGroup[]; nonMeatItems: InventoryItem[] }; }

	// ─── Location config ──────────────────────────────────────────────────────
	const LOC_CONFIG: Record<SectionLocId, { name: string; bg: string; border: string; borderLeft: string; text: string; dot: string; typeBadge: string }> = {
		'tag':    { name: 'Alta Citta',  bg: 'bg-blue-50',   border: 'border-blue-200',   borderLeft: 'border-l-blue-400',   text: 'text-blue-900',   dot: 'bg-blue-500',   typeBadge: 'Retail'    },
		'pgl':    { name: 'Panglao',     bg: 'bg-violet-50', border: 'border-violet-200', borderLeft: 'border-l-violet-400', text: 'text-violet-900', dot: 'bg-violet-500', typeBadge: 'Retail'    },
		'wh-tag': { name: 'Warehouse',   bg: 'bg-amber-50',  border: 'border-amber-200',  borderLeft: 'border-l-amber-400',  text: 'text-amber-900',  dot: 'bg-amber-500',  typeBadge: 'Warehouse' },
	};

	// ─── State ────────────────────────────────────────────────────────────────
	let viewMode      = $state<'grid' | 'list'>('list');
	let searchQuery   = $state('');
	let filterStatus  = $state<'all' | StockStatus>('all');
	let hoveredItemId = $state<string | null>(null);

	const expandedLocations = $state<Record<SectionLocId, boolean>>({
		'tag': true, 'pgl': true, 'wh-tag': true,
	});
	const expandedGroups = $state<Record<SectionLocId, Record<string, boolean>>>({
		'tag':    { beef: true, pork: true, chicken: true, other: true },
		'pgl':    { beef: true, pork: true, chicken: true, other: true },
		'wh-tag': { beef: true, pork: true, chicken: true, other: true },
	});

	$effect(() => { session.locationId; filterStatus = 'all'; searchQuery = ''; });

	// ─── Helpers ──────────────────────────────────────────────────────────────
	function fallbackImage(name: string): string {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#6B7280"/><text x="100" y="108" font-family="Inter,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${name.substring(0, 15)}</text></svg>`;
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}

	function buildProteinGroups(): Record<MeatProtein, ProteinGroup> {
		return {
			beef:    { protein: 'beef',    items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			pork:    { protein: 'pork',    items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			chicken: { protein: 'chicken', items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
			other:   { protein: 'other',   items: [], totalStock: 0, criticalCount: 0, lowCount: 0 },
		};
	}

	function populateProteinGroup(groups: Record<MeatProtein, ProteinGroup>, item: InventoryItem) {
		const protein = item.proteinType || 'other';
		groups[protein].items.push(item);
		groups[protein].totalStock += item.currentStock;
		if (item.status === 'critical') groups[protein].criticalCount++;
		if (item.status === 'low') groups[protein].lowCount++;
	}

	function buildListGroups(items: InventoryItem[]): CategoryGroup[] {
		const catMap = new Map<string, InventoryItem[]>();
		for (const item of items) {
			if (!catMap.has(item.category)) catMap.set(item.category, []);
			catMap.get(item.category)!.push(item);
		}
		const categories: CategoryGroup[] = [];
		for (const [category, catItems] of catMap) {
			if (category === 'Meats') {
				const pGroups = buildProteinGroups();
				for (const item of catItems) populateProteinGroup(pGroups, item);
				categories.push({
					category, items: [], isMeat: true,
					proteinGroups: (['beef', 'pork', 'chicken', 'other'] as MeatProtein[])
						.map(p => pGroups[p]).filter(g => g.items.length > 0),
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
	}

	function buildGridGroups(items: InventoryItem[]): { meatGroups: ProteinGroup[]; nonMeatItems: InventoryItem[] } {
		const groups = buildProteinGroups();
		const nonMeatItems: InventoryItem[] = [];
		for (const item of items) {
			if (item.category === 'Meats') populateProteinGroup(groups, item);
			else nonMeatItems.push(item);
		}
		return {
			meatGroups: (['beef', 'pork', 'chicken', 'other'] as MeatProtein[])
				.map(p => groups[p]).filter(g => g.items.length > 0),
			nonMeatItems,
		};
	}

	// ─── Derived data ─────────────────────────────────────────────────────────
	const menuItemsById = $derived(new Map(menuItems.value.map(m => [m.id, m])));

	const allItems = $derived(
		stockItems.value.map(s => ({
			...s,
			currentStock: getCurrentStock(s.id),
			status: getStockStatus(s.id),
			image: STOCK_IMAGES[s.menuItemId] || s.image || menuItemsById.get(s.menuItemId)?.image || fallbackImage(s.name),
		} as InventoryItem))
	);

	const sections = $derived.by<LocationSection[]>(() => {
		const q = searchQuery.trim().toLowerCase();
		return SECTION_LOCATIONS.map(locId => {
			const allLoc = allItems.filter(i => i.locationId === locId);
			const filtered = allLoc.filter(i => {
				const matchStatus = filterStatus === 'all' || i.status === filterStatus;
				const matchSearch = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
				return matchStatus && matchSearch;
			});
			const summary: LocationSummary = {
				itemCount:      allLoc.length,
				criticalCount:  allLoc.filter(i => i.status === 'critical').length,
				lowCount:       allLoc.filter(i => i.status === 'low').length,
				totalMeatGrams: allLoc.filter(i => i.category === 'Meats').reduce((s, i) => s + i.currentStock, 0),
			};
			return {
				locId,
				summary,
				listGroups: buildListGroups(filtered),
				gridGroups: buildGridGroups(filtered),
			};
		});
	});

	// ─── Expand / Collapse ────────────────────────────────────────────────────
	function toggleLocation(locId: SectionLocId) { expandedLocations[locId] = !expandedLocations[locId]; }
	function toggleGroup(locId: SectionLocId, key: string) { expandedGroups[locId][key] = !expandedGroups[locId][key]; }

	function handleExpandAll() {
		for (const l of SECTION_LOCATIONS) {
			expandedLocations[l] = true;
			for (const k in expandedGroups[l]) expandedGroups[l][k] = true;
		}
	}
	function handleCollapseAll() {
		for (const l of SECTION_LOCATIONS) {
			expandedLocations[l] = false;
			for (const k in expandedGroups[l]) expandedGroups[l][k] = false;
		}
	}

	// No-op for readonly — required by item row/card props
	function noop(_item: InventoryItem) {}
	function noopEdit(_item: InventoryItem, _e: MouseEvent) {}
</script>

<!-- ─── Health Strip ───────────────────────────────────────────────────────── -->
<div class="mb-5">
	<StockHealthStrip bind:activeFilter={filterStatus} onFilterClick={(s) => filterStatus = s} />
</div>

<InventoryToolbar
	bind:searchQuery
	bind:viewMode
	onExpandAll={handleExpandAll}
	onCollapseAll={handleCollapseAll}
/>

<!-- ─── Branch Summary Cards ─────────────────────────────────────────────── -->
<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
	{#each sections as s}
		{@const cfg = LOC_CONFIG[s.locId]}
		<div class={cn('rounded-xl border border-l-4 px-4 py-3', cfg.border, cfg.borderLeft, cfg.bg)}>
			<div class="flex items-center gap-2 mb-2">
				<span class={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', cfg.dot)}></span>
				<span class={cn('font-bold text-sm', cfg.text)}>{cfg.name}</span>
				<span class="ml-auto text-xs px-1.5 py-0.5 rounded font-medium bg-white/70 text-gray-500">{cfg.typeBadge}</span>
			</div>
			<p class="text-2xl font-bold font-mono text-gray-900">{s.summary.itemCount}</p>
			<p class="text-xs text-gray-500 mb-2">items tracked</p>
			<div class="flex flex-wrap gap-1.5">
				{#if s.summary.criticalCount > 0}
					<span class="text-xs px-2 py-0.5 rounded-full bg-status-red-light text-status-red font-semibold border border-status-red/20">
						{s.summary.criticalCount} critical
					</span>
				{/if}
				{#if s.summary.lowCount > 0}
					<span class="text-xs px-2 py-0.5 rounded-full bg-status-yellow-light text-status-yellow font-semibold border border-status-yellow/30">
						{s.summary.lowCount} low
					</span>
				{/if}
				{#if s.summary.criticalCount === 0 && s.summary.lowCount === 0}
					<span class="text-xs px-2 py-0.5 rounded-full bg-status-green-light text-status-green font-semibold border border-status-green/20">
						All stocked
					</span>
				{/if}
			</div>
			{#if s.summary.totalMeatGrams > 0}
				<p class="text-xs text-gray-400 mt-2 font-mono">
					{(s.summary.totalMeatGrams / 1000).toFixed(1)} kg meat total
				</p>
			{/if}
		</div>
	{/each}
</div>

<!-- ─── Location Sections ─────────────────────────────────────────────────── -->
{#each sections as s}
	{@const cfg = LOC_CONFIG[s.locId]}
	{@const isOpen = expandedLocations[s.locId]}

	<!-- Section header -->
	<div class={cn('border border-l-4 mb-px rounded-t-xl flex items-center justify-between px-4 py-3 cursor-pointer select-none', cfg.border, cfg.borderLeft, cfg.bg, isOpen ? '' : 'rounded-b-xl mb-4')}
		role="button"
		tabindex="0"
		onclick={() => toggleLocation(s.locId)}
		onkeydown={(e) => e.key === 'Enter' && toggleLocation(s.locId)}
	>
		<div class="flex items-center gap-2 flex-wrap">
			<span class={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', cfg.dot)}></span>
			<span class={cn('font-bold text-sm', cfg.text)}>{cfg.name}</span>
			<span class="text-xs px-1.5 py-0.5 rounded font-medium bg-white/70 text-gray-500">{cfg.typeBadge}</span>
			{#if s.summary.criticalCount > 0}
				<span class="text-xs px-2 py-0.5 rounded-full bg-status-red-light text-status-red font-semibold border border-status-red/20">
					{s.summary.criticalCount} critical
				</span>
			{/if}
			{#if s.summary.lowCount > 0}
				<span class="text-xs px-2 py-0.5 rounded-full bg-status-yellow-light text-status-yellow font-semibold border border-status-yellow/30">
					{s.summary.lowCount} low
				</span>
			{/if}
			{#if s.summary.totalMeatGrams > 0}
				<span class="text-xs text-gray-400 font-mono ml-1">
					{(s.summary.totalMeatGrams / 1000).toFixed(1)} kg meat
				</span>
			{/if}
		</div>
		<div class={cn('flex-shrink-0 ml-2', cfg.text)}>
			{#if isOpen}
				<ChevronDown class="w-4 h-4" />
			{:else}
				<ChevronRight class="w-4 h-4" />
			{/if}
		</div>
	</div>

	{#if isOpen}
		<div class={cn('border border-t-0 rounded-b-xl mb-6 overflow-hidden', cfg.border)} transition:slide={{ duration: 250 }}>
			{#if viewMode === 'grid'}
				<!-- Grid view -->
				{#if s.gridGroups.meatGroups.length === 0 && s.gridGroups.nonMeatItems.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-gray-400">
						<Search class="w-8 h-8 mb-2 opacity-25" />
						<p class="text-sm font-medium text-gray-500">No items match your search</p>
					</div>
				{:else}
					<div class="p-4 flex flex-col gap-6">
						{#each s.gridGroups.meatGroups as group}
							<div class="flex flex-col gap-4">
								<ProteinGroupHeader
									protein={group.protein}
									itemCount={group.items.length}
									criticalCount={group.criticalCount}
									lowCount={group.lowCount}
									expanded={expandedGroups[s.locId][group.protein]}
									onToggle={() => toggleGroup(s.locId, group.protein)}
									chartData={group.items.map(i => ({ id: i.id, label: i.name, value: i.currentStock }))}
									hoveredItemId={hoveredItemId}
									onHover={(id: string | null) => hoveredItemId = id}
								/>
								{#if expandedGroups[s.locId][group.protein]}
									<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" transition:slide={{ duration: 300 }}>
										{#each group.items as item (item.id)}
											<InventoryItemCard
												{item}
												{hoveredItemId}
												onOpenModal={noop}
												onEditClick={noopEdit}
												onHover={(id) => hoveredItemId = id}
												readonly={true}
											/>
										{/each}
									</div>
								{/if}
							</div>
						{/each}

						{#if s.gridGroups.nonMeatItems.length > 0}
							<div class="flex flex-col gap-4">
								{#if s.gridGroups.meatGroups.length > 0}
									<div class="flex items-center gap-2 mt-2 mb-2">
										<div class="h-px bg-border flex-1"></div>
										<span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Other Items</span>
										<div class="h-px bg-border flex-1"></div>
									</div>
								{/if}
								<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
									{#each s.gridGroups.nonMeatItems as item (item.id)}
										<InventoryItemCard
											{item}
											onOpenModal={noop}
											onEditClick={noopEdit}
											readonly={true}
										/>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

			{:else}
				<!-- List view -->
				{#if s.listGroups.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-gray-400">
						<Search class="w-8 h-8 mb-2 opacity-25" />
						<p class="text-sm font-medium text-gray-500">No items match your search</p>
					</div>
				{:else}
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border bg-gray-50/70">
								<th class="w-12 px-4 py-3"></th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item</th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Stock Level</th>
								<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Current / Min</th>
								<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
								<th class="w-8 px-4 py-3"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each s.listGroups as catGroup}
								{#if catGroup.isMeat}
									{#each catGroup.proteinGroups as group}
										{@const config = proteinConfig[group.protein]}
										<tr class="{config.bgLight} border-l-4 {config.borderColor}">
											<td colspan="7" class="p-0">
												<ProteinGroupHeader
													protein={group.protein}
													itemCount={group.items.length}
													criticalCount={group.criticalCount}
													lowCount={group.lowCount}
													expanded={expandedGroups[s.locId][group.protein]}
													onToggle={() => toggleGroup(s.locId, group.protein)}
													chartData={group.items.map(i => ({ id: i.id, label: i.name, value: i.currentStock }))}
													hoveredItemId={hoveredItemId}
													onHover={(id: string | null) => hoveredItemId = id}
													noBorder={true}
													noBg={true}
												/>
											</td>
										</tr>
										{#if expandedGroups[s.locId][group.protein]}
											{#each group.items as item (item.id)}
												<InventoryItemRow
													{item}
													{hoveredItemId}
													onOpenModal={noop}
													onEditClick={noopEdit}
													onHover={(id) => hoveredItemId = id}
													animate={true}
													readonly={true}
												/>
											{/each}
										{/if}
									{/each}
								{:else}
									<tr class="bg-gray-50/50">
										<td colspan="7" class="px-4 py-1.5">
											<span class="text-xs font-bold uppercase tracking-wide text-gray-400">{catGroup.category}</span>
										</td>
									</tr>
									{#each catGroup.items as item (item.id)}
										<InventoryItemRow
											{item}
											onOpenModal={noop}
											onEditClick={noopEdit}
											readonly={true}
										/>
									{/each}
								{/if}
							{/each}
						</tbody>
					</table>
				{/if}
			{/if}
		</div>
	{/if}
{/each}
