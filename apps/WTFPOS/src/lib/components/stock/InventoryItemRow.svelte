<script lang="ts">
	import { cn, formatWeight, formatTimeAgo } from '$lib/utils';
	import { fade, slide } from 'svelte/transition';
	import { Edit3 } from 'lucide-svelte';
	import type { StockItem, StockStatus } from '$lib/stores/stock.svelte';
	import { getLastStockEvent } from '$lib/stores/stock.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import StockLevelBar from './StockLevelBar.svelte';

	export interface InventoryItem extends StockItem {
		currentStock: number;
		status: StockStatus;
		image?: string;
	}

	const EVENT_LABELS: Record<string, string> = {
		delivery: 'Delivery',
		deduction: 'Sold',
		waste: 'Waste',
	};

	interface Props {
		item: InventoryItem;
		hoveredItemId?: string | null;
		onOpenModal: (item: InventoryItem) => void;
		onEditClick: (item: InventoryItem, e: MouseEvent) => void;
		onHover?: (id: string | null) => void;
		onToggle86?: () => void;
		menuAvailable?: boolean;
		animate?: boolean;
		readonly?: boolean;
		/** When true, suppress category column (already shown in group header) */
		hideCategory?: boolean;
	}

	let { item, hoveredItemId = null, onOpenModal, onEditClick, onHover, onToggle86, menuAvailable = true, animate = false, readonly = false, hideCategory = false }: Props = $props();

	const lastEvent = $derived(getLastStockEvent(item.id));
	const weight = $derived(formatWeight(item.currentStock, item.unit));
</script>

<tr
	onclick={readonly ? undefined : () => onOpenModal(item)}
	onmouseenter={() => onHover?.(item.id)}
	onmouseleave={() => onHover?.(null)}
	class={cn(
		'transition-colors hover:bg-gray-50',
		readonly ? 'cursor-default' : 'cursor-pointer',
		item.status === 'critical' ? 'bg-status-red-light/20' : '',
		hoveredItemId === item.id ? 'bg-accent/5 shadow-[inset_2px_0_0_0_rgba(14,165,233,0.5)]' : ''
	)}
	transition:slide={animate ? { duration: 300 } : undefined}
>
	<td class="px-4 py-3" in:fade={{ duration: 200 }}>
		<div class="flex items-center gap-2 w-max">
			{#if item.image}
				<div class="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-border">
					<img src={item.image} alt={item.name} class="w-full h-full object-cover" />
				</div>
			{:else}
				<CategoryIcon category={item.category} class="h-9 w-9" iconClass="w-4 h-4" />
			{/if}
		</div>
	</td>
	<td class="px-4 py-3">
		<p class="font-medium text-gray-900">{item.name}</p>
		{#if lastEvent}
			<p class="text-[10px] text-gray-400 mt-0.5">{EVENT_LABELS[lastEvent.type]}: {formatTimeAgo(lastEvent.timestamp)}</p>
		{/if}
	</td>
	{#if !hideCategory}
		<td class="px-4 py-3 text-gray-500 font-medium">
			{item.category}
		</td>
	{/if}
	<td class="px-4 py-3 w-36">
		<StockLevelBar current={item.currentStock} min={item.minLevel} status={item.status} />
	</td>
	<td class="px-4 py-3 text-right">
		<span class="font-mono font-semibold text-gray-900">{weight.display} {weight.unit}</span>
		<br />
		<span class="text-xs text-gray-400">Min: {item.minLevel.toLocaleString()}</span>
	</td>
	<td class="px-4 py-3 text-right">
		{#if !readonly}
			<div class="flex items-center justify-end gap-1">
				{#if onToggle86}
					<button
						onclick={(e) => { e.stopPropagation(); onToggle86!(); }}
						class={cn(
							'rounded px-2 py-0.5 text-[10px] font-bold border transition-colors flex items-center justify-center',
							menuAvailable
								? 'border-gray-200 text-gray-400 hover:border-status-red/40 hover:text-status-red hover:bg-status-red-light'
								: 'border-status-red/40 bg-status-red-light text-status-red'
						)}
						style="min-height: 44px; min-width: 44px"
						title={menuAvailable ? 'Mark as sold out (86)' : 'Unmark — restore to menu'}
					>
						{menuAvailable ? '86' : '86\'d'}
					</button>
				{/if}
				<button
					class="text-gray-400 hover:text-accent transition-colors flex items-center justify-center"
					onclick={(e) => onEditClick(item, e)}
					aria-label="Edit Info"
					style="min-height: 44px; min-width: 44px"
				>
					<Edit3 class="w-4 h-4" />
				</button>
			</div>
		{/if}
	</td>
</tr>
