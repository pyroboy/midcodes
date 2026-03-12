<script lang="ts">
	import { cn, formatWeight } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import { ChevronDown, ChevronRight, Search, AlertTriangle } from 'lucide-svelte';

	import {
		stockItems, getCurrentStock, getStockStatus, proteinConfig,
		type StockStatus, type StockItem,
	} from '$lib/stores/stock.svelte';
	import type { MeatProtein } from '$lib/stores/stock.constants';
	import { menuItems } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';

	import StockHealthStrip from './StockHealthStrip.svelte';
	import InventoryToolbar from './InventoryToolbar.svelte';

	// ─── Types ────────────────────────────────────────────────────────────────
	const SECTION_LOCATIONS = ['tag', 'pgl', 'wh-tag'] as const;
	type SectionLocId = 'tag' | 'pgl' | 'wh-tag';

	interface LocStock { currentStock: number; status: StockStatus; unit: string; minLevel: number; }
	interface ComparisonItem {
		menuItemId: string;
		name: string;
		category: string;
		proteinType?: MeatProtein;
		stocks: Partial<Record<SectionLocId, LocStock>>;
		worstStatus: StockStatus;
		hasImbalance: boolean;
	}
	interface ProteinGroup { protein: MeatProtein; items: ComparisonItem[]; expanded: boolean; }
	interface CategoryGroup { category: string; items: ComparisonItem[]; isMeat: boolean; proteinGroups: ProteinGroup[]; }
	interface LocationSummary { itemCount: number; criticalCount: number; lowCount: number; totalMeatGrams: number; }

	// ─── Location config ──────────────────────────────────────────────────────
	const LOC_CONFIG: Record<SectionLocId, { name: string; shortName: string; bg: string; border: string; borderLeft: string; text: string; dot: string; typeBadge: string; headerBg: string }> = {
		'tag':    { name: 'Alta Citta',  shortName: 'AC',  bg: 'bg-blue-50',   border: 'border-blue-200',   borderLeft: 'border-l-blue-400',   text: 'text-blue-900',   dot: 'bg-blue-500',   typeBadge: 'Retail',    headerBg: 'bg-blue-50/70'   },
		'pgl':    { name: 'Panglao',     shortName: 'PGL', bg: 'bg-violet-50', border: 'border-violet-200', borderLeft: 'border-l-violet-400', text: 'text-violet-900', dot: 'bg-violet-500', typeBadge: 'Retail',    headerBg: 'bg-violet-50/70' },
		'wh-tag': { name: 'Warehouse',   shortName: 'WH',  bg: 'bg-amber-50',  border: 'border-amber-200',  borderLeft: 'border-l-amber-400',  text: 'text-amber-900',  dot: 'bg-amber-500',  typeBadge: 'Warehouse', headerBg: 'bg-amber-50/70'  },
	};

	const STATUS_DOT: Record<StockStatus, string> = {
		ok:       'bg-status-green',
		low:      'bg-status-yellow',
		critical: 'bg-status-red',
	};
	const STATUS_ORDER: Record<StockStatus, number> = { critical: 0, low: 1, ok: 2 };

	// ─── State ────────────────────────────────────────────────────────────────
	let viewMode      = $state<'grid' | 'list'>('list');
	let searchQuery   = $state('');
	let filterStatus  = $state<'all' | StockStatus>('all');

	const expandedGroups = $state<Record<string, boolean>>({
		beef: true, pork: true, chicken: true, other: true,
	});

	$effect(() => { session.locationId; filterStatus = 'all'; searchQuery = ''; });

	// ─── Helpers ──────────────────────────────────────────────────────────────
	function getWorstStatus(stocks: Partial<Record<SectionLocId, LocStock>>): StockStatus {
		let worst: StockStatus = 'ok';
		for (const loc of SECTION_LOCATIONS) {
			const s = stocks[loc];
			if (s && STATUS_ORDER[s.status] < STATUS_ORDER[worst]) worst = s.status;
		}
		return worst;
	}

	function checkImbalance(stocks: Partial<Record<SectionLocId, LocStock>>): boolean {
		const retailLocs: SectionLocId[] = ['tag', 'pgl'];
		const vals = retailLocs.map(l => stocks[l]?.currentStock ?? 0).filter(v => v > 0);
		if (vals.length < 2) return false;
		const max = Math.max(...vals);
		const min = Math.min(...vals);
		if (max === 0) return false;
		return (max - min) / max > 0.3;
	}

	function formatStockDisplay(value: number, unit: string): string {
		const w = formatWeight(value, unit);
		return `${w.display} ${w.unit}`;
	}

	// ─── Derived: per-location summaries ──────────────────────────────────────
	const allStockItems = $derived(
		stockItems.value.map(s => ({
			...s,
			currentStock: getCurrentStock(s.id),
			status: getStockStatus(s.id),
		}))
	);

	const locationSummaries = $derived.by<Record<SectionLocId, LocationSummary>>(() => {
		const result = {} as Record<SectionLocId, LocationSummary>;
		for (const locId of SECTION_LOCATIONS) {
			const items = allStockItems.filter(i => i.locationId === locId);
			result[locId] = {
				itemCount:      items.length,
				criticalCount:  items.filter(i => i.status === 'critical').length,
				lowCount:       items.filter(i => i.status === 'low').length,
				totalMeatGrams: items.filter(i => i.category === 'Meats').reduce((s, i) => s + i.currentStock, 0),
			};
		}
		return result;
	});

	// ─── Derived: unified comparison items ────────────────────────────────────
	const comparisonItems = $derived.by<ComparisonItem[]>(() => {
		const q = searchQuery.trim().toLowerCase();

		// Group all stock items by menuItemId
		const itemMap = new Map<string, ComparisonItem>();
		for (const si of allStockItems) {
			if (!itemMap.has(si.menuItemId)) {
				itemMap.set(si.menuItemId, {
					menuItemId: si.menuItemId,
					name: si.name,
					category: si.category,
					proteinType: si.proteinType,
					stocks: {},
					worstStatus: 'ok',
					hasImbalance: false,
				});
			}
			const entry = itemMap.get(si.menuItemId)!;
			const locId = si.locationId as SectionLocId;
			if (SECTION_LOCATIONS.includes(locId)) {
				entry.stocks[locId] = {
					currentStock: si.currentStock,
					status: si.status,
					unit: si.unit,
					minLevel: si.minLevel,
				};
			}
		}

		// Compute worst status and imbalance
		for (const item of itemMap.values()) {
			item.worstStatus = getWorstStatus(item.stocks);
			item.hasImbalance = checkImbalance(item.stocks);
		}

		// Filter
		let items = [...itemMap.values()];
		if (q) {
			items = items.filter(i =>
				i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
			);
		}
		if (filterStatus !== 'all') {
			items = items.filter(i => {
				// Show item if ANY location has the filtered status
				return Object.values(i.stocks).some(s => s.status === filterStatus);
			});
		}

		// Sort: worst status first, then alphabetical
		items.sort((a, b) => {
			const sa = STATUS_ORDER[a.worstStatus];
			const sb = STATUS_ORDER[b.worstStatus];
			if (sa !== sb) return sa - sb;
			return a.name.localeCompare(b.name);
		});

		return items;
	});

	// ─── Derived: grouped for display ─────────────────────────────────────────
	const categoryGroups = $derived.by<CategoryGroup[]>(() => {
		const catMap = new Map<string, ComparisonItem[]>();
		for (const item of comparisonItems) {
			if (!catMap.has(item.category)) catMap.set(item.category, []);
			catMap.get(item.category)!.push(item);
		}

		const groups: CategoryGroup[] = [];
		for (const [category, items] of catMap) {
			if (category === 'Meats') {
				const proteinMap: Record<MeatProtein, ComparisonItem[]> = { beef: [], pork: [], chicken: [], other: [] };
				for (const item of items) {
					const p = item.proteinType || 'other';
					proteinMap[p].push(item);
				}
				const proteinGroups: ProteinGroup[] = (['beef', 'pork', 'chicken', 'other'] as MeatProtein[])
					.filter(p => proteinMap[p].length > 0)
					.map(p => ({ protein: p, items: proteinMap[p], expanded: true }));

				groups.push({ category, items: [], isMeat: true, proteinGroups });
			} else {
				groups.push({ category, items, isMeat: false, proteinGroups: [] });
			}
		}

		// Meats first, then alphabetical
		return groups.sort((a, b) => {
			if (a.isMeat) return -1;
			if (b.isMeat) return 1;
			return a.category.localeCompare(b.category);
		});
	});

	// ─── Expand / Collapse ────────────────────────────────────────────────────
	function toggleGroup(key: string) { expandedGroups[key] = !expandedGroups[key]; }

	function handleExpandAll() {
		for (const k in expandedGroups) expandedGroups[k] = true;
	}
	function handleCollapseAll() {
		for (const k in expandedGroups) expandedGroups[k] = false;
	}
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
	{#each SECTION_LOCATIONS as locId}
		{@const cfg = LOC_CONFIG[locId]}
		{@const summary = locationSummaries[locId]}
		<div class={cn('rounded-xl border border-l-4 px-4 py-3', cfg.border, cfg.borderLeft, cfg.bg)}>
			<div class="flex items-center gap-2 mb-2">
				<span class={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', cfg.dot)}></span>
				<span class={cn('font-bold text-sm', cfg.text)}>{cfg.name}</span>
				<span class="ml-auto text-xs px-1.5 py-0.5 rounded font-medium bg-white/70 text-gray-500">{cfg.typeBadge}</span>
			</div>
			<p class="text-2xl font-bold font-mono text-gray-900">{summary.itemCount}</p>
			<p class="text-xs text-gray-500 mb-2">items tracked</p>
			<div class="flex flex-wrap gap-1.5">
				{#if summary.criticalCount > 0}
					<span class="text-xs px-2 py-0.5 rounded-full bg-status-red-light text-status-red font-semibold border border-status-red/20">
						{summary.criticalCount} critical
					</span>
				{/if}
				{#if summary.lowCount > 0}
					<span class="text-xs px-2 py-0.5 rounded-full bg-status-yellow-light text-status-yellow font-semibold border border-status-yellow/30">
						{summary.lowCount} low
					</span>
				{/if}
				{#if summary.criticalCount === 0 && summary.lowCount === 0}
					<span class="text-xs px-2 py-0.5 rounded-full bg-status-green-light text-status-green font-semibold border border-status-green/20">
						All stocked
					</span>
				{/if}
			</div>
			{#if summary.totalMeatGrams > 0}
				<p class="text-xs text-gray-400 mt-2 font-mono">
					{(summary.totalMeatGrams / 1000).toFixed(1)} kg meat total
				</p>
			{/if}
		</div>
	{/each}
</div>

<!-- ─── Cross-Branch Comparison Table ──────────────────────────────────────── -->
{#if comparisonItems.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-gray-400">
		<Search class="w-8 h-8 mb-2 opacity-25" />
		<p class="text-sm font-medium text-gray-500">No items match your search</p>
	</div>
{:else}
	<div class="border border-border rounded-xl overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="sticky top-0 z-10">
					<tr class="border-b border-border bg-gray-50">
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 min-w-[180px]">Item</th>
						<th class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">Category</th>
						{#each SECTION_LOCATIONS as locId}
							{@const cfg = LOC_CONFIG[locId]}
							<th class={cn('px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide min-w-[110px]', cfg.text, cfg.headerBg)}>
								<div class="flex items-center justify-end gap-1.5">
									<span class={cn('h-2 w-2 rounded-full flex-shrink-0', cfg.dot)}></span>
									<span class="hidden lg:inline">{cfg.name}</span>
									<span class="lg:hidden">{cfg.shortName}</span>
								</div>
							</th>
						{/each}
						<th class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 w-[70px]">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each categoryGroups as catGroup}
						{#if catGroup.isMeat}
							{#each catGroup.proteinGroups as group}
								{@const config = proteinConfig[group.protein]}
								{@const isExpanded = expandedGroups[group.protein] ?? true}
								<!-- Protein group header -->
								<tr class={cn(config.bgLight, 'border-l-4', config.borderColor)}>
									<td colspan={6} class="p-0">
										<button
											class="w-full flex items-center gap-2 px-4 py-2 text-left select-none"
											onclick={() => toggleGroup(group.protein)}
										>
											{#if isExpanded}
												<ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
											{:else}
												<ChevronRight class="w-4 h-4 text-gray-400 flex-shrink-0" />
											{/if}
											<span class={cn('text-xs font-bold uppercase tracking-wider', config.color)}>
												{config.label}
											</span>
											<span class="text-xs text-gray-400 font-medium">
												({group.items.length} items)
											</span>
										</button>
									</td>
								</tr>
								{#if isExpanded}
									{#each group.items as item (item.menuItemId)}
										{@render comparisonRow(item)}
									{/each}
								{/if}
							{/each}
						{:else}
							<!-- Non-meat category header -->
							<tr class="bg-gray-50/50">
								<td colspan={6} class="px-4 py-1.5">
									<span class="text-xs font-bold uppercase tracking-wide text-gray-400">{catGroup.category}</span>
								</td>
							</tr>
							{#each catGroup.items as item (item.menuItemId)}
								{@render comparisonRow(item)}
							{/each}
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}

{#snippet comparisonRow(item: ComparisonItem)}
	<tr class={cn(
		'hover:bg-gray-50/50 transition-colors',
		item.hasImbalance && 'bg-amber-50/40',
	)}>
		<!-- Item name -->
		<td class="px-4 py-2.5">
			<div class="flex items-center gap-2">
				<span class="font-medium text-gray-900 text-sm">{item.name}</span>
				{#if item.hasImbalance}
					<span title="Large stock imbalance between branches (>30% difference)">
						<AlertTriangle class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
					</span>
				{/if}
			</div>
		</td>

		<!-- Category (hidden on mobile) -->
		<td class="px-3 py-2.5 hidden md:table-cell">
			<span class="text-xs text-gray-500">{item.category}</span>
		</td>

		<!-- Location stock cells -->
		{#each SECTION_LOCATIONS as locId}
			{@const locStock = item.stocks[locId]}
			<td class="px-3 py-2.5 text-right">
				{#if locStock}
					<div class="flex items-center justify-end gap-1.5">
						<span class={cn(
							'font-mono text-sm',
							locStock.status === 'critical' ? 'text-status-red font-semibold' :
							locStock.status === 'low' ? 'text-status-yellow font-semibold' :
							'text-gray-700'
						)}>
							{formatStockDisplay(locStock.currentStock, locStock.unit)}
						</span>
						<span class={cn('h-2 w-2 rounded-full flex-shrink-0', STATUS_DOT[locStock.status])} title={locStock.status}></span>
					</div>
				{:else}
					<span class="text-xs text-gray-300 italic">--</span>
				{/if}
			</td>
		{/each}

		<!-- Overall status -->
		<td class="px-3 py-2.5 text-center">
			<span class={cn('text-xs px-2 py-0.5 rounded-full font-semibold border',
				item.worstStatus === 'critical' ? 'bg-status-red-light text-status-red border-status-red/20'
				: item.worstStatus === 'low' ? 'bg-status-yellow-light text-status-yellow border-status-yellow/30'
				: 'bg-status-green-light text-status-green border-status-green/20'
			)}>
				{item.worstStatus === 'critical' ? 'Critical' : item.worstStatus === 'low' ? 'Low' : 'OK'}
			</span>
		</td>
	</tr>
{/snippet}
