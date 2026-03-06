<script lang="ts">
	import { cn } from '$lib/utils';
	import { fade, slide } from 'svelte/transition';
	import { Edit3 } from 'lucide-svelte';
	import type { StockItem, StockStatus } from '$lib/stores/stock.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import StockLevelBar from './StockLevelBar.svelte';

	export interface InventoryItem extends StockItem {
		currentStock: number;
		status: StockStatus;
		image?: string;
	}

	const statusConfig: Record<StockStatus, { label: string; badgeClass: string; dotClass: string }> = {
		ok:       { label: 'Well-Stocked', badgeClass: 'bg-status-green-light text-status-green border-status-green/20',    dotClass: 'bg-status-green' },
		low:      { label: 'Low Stock',    badgeClass: 'bg-status-yellow-light text-status-yellow border-status-yellow/30', dotClass: 'bg-status-yellow' },
		critical: { label: 'Critical',     badgeClass: 'bg-status-red-light text-status-red border-status-red/20',          dotClass: 'bg-status-red' },
	};

	interface Props {
		item: InventoryItem;
		hoveredItemId?: string | null;
		onOpenModal: (item: InventoryItem) => void;
		onEditClick: (item: InventoryItem, e: MouseEvent) => void;
		onHover?: (id: string | null) => void;
		animate?: boolean;
	}

	let { item, hoveredItemId = null, onOpenModal, onEditClick, onHover, animate = false }: Props = $props();
</script>

<tr
	onclick={() => onOpenModal(item)}
	onmouseenter={() => onHover?.(item.id)}
	onmouseleave={() => onHover?.(null)}
	class={cn(
		'cursor-pointer transition-colors hover:bg-gray-50',
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
			onclick={(e) => onEditClick(item, e)}
			aria-label="Edit Info"
		>
			<Edit3 class="w-4 h-4" />
		</button>
	</td>
</tr>
