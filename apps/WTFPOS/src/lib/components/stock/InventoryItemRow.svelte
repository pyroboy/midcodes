<script lang="ts">
	import { cn } from '$lib/utils';
	import { fade, slide } from 'svelte/transition';
	import { Edit3 } from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';
	import type { StockItem, StockStatus } from '$lib/stores/stock.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import StockLevelBar from './StockLevelBar.svelte';

	export interface InventoryItem extends StockItem {
		currentStock: number;
		status: StockStatus;
		image?: string;
	}

	function getStatusDisplay(status: StockStatus, currentStock: number, minLevel: number): { label: string; badgeClass: string; dotClass: string } {
		if (status === 'ok' && currentStock <= 2 * minLevel) {
			return { label: 'Adequate', badgeClass: 'bg-emerald-50 text-emerald-500 border-emerald-200', dotClass: 'bg-emerald-400' };
		}
		const configs: Record<StockStatus, { label: string; badgeClass: string; dotClass: string }> = {
			ok:       { label: 'Well-Stocked', badgeClass: 'bg-status-green-light text-status-green border-status-green/20',    dotClass: 'bg-status-green' },
			low:      { label: 'Low Stock',    badgeClass: 'bg-status-yellow-light text-status-yellow border-status-yellow/30', dotClass: 'bg-status-yellow' },
			critical: { label: 'Critical',     badgeClass: 'bg-status-red-light text-status-red border-status-red/20',          dotClass: 'bg-status-red' },
		};
		return configs[status];
	}

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
	}

	let { item, hoveredItemId = null, onOpenModal, onEditClick, onHover, onToggle86, menuAvailable = true, animate = false, readonly = false }: Props = $props();
	const display = $derived(getStatusDisplay(item.status, item.currentStock, item.minLevel));
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
		{#if item.updatedAt}
			<p class="text-[10px] text-gray-400 mt-0.5">{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</p>
		{/if}
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
		<span class={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', display.badgeClass)}>
			{display.label}
		</span>
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
