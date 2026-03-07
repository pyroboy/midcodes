<script lang="ts">
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { Edit3 } from 'lucide-svelte';
	import type { StockItem, StockStatus } from '$lib/stores/stock.svelte';
	import type { MeatProtein } from '$lib/stores/stock.constants';
	import CategoryIcon from './CategoryIcon.svelte';
	import StockLevelBar from './StockLevelBar.svelte';

	export interface InventoryItem extends StockItem {
		currentStock: number;
		status: StockStatus;
		description?: string;
		image?: string;
	}

	const statusConfig: Record<StockStatus, { label: string; badgeClass: string; dotClass: string }> = {
		ok:       { label: 'Well-Stocked', badgeClass: 'bg-status-green-light text-status-green border-status-green/20',    dotClass: 'bg-status-green' },
		low:      { label: 'Low Stock',    badgeClass: 'bg-status-yellow-light text-status-yellow border-status-yellow/30', dotClass: 'bg-status-yellow' },
		critical: { label: 'Critical',     badgeClass: 'bg-status-red-light text-status-red border-status-red/20',          dotClass: 'bg-status-red' },
	};

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

	interface Props {
		item: InventoryItem;
		hoveredItemId?: string | null;
		onOpenModal: (item: InventoryItem) => void;
		onEditClick: (item: InventoryItem, e: MouseEvent) => void;
		onHover?: (id: string | null) => void;
		readonly?: boolean;
	}

	let { item, hoveredItemId = null, onOpenModal, onEditClick, onHover, readonly = false }: Props = $props();

	const isHovered = $derived(hoveredItemId === item.id);
</script>

<svelte:element
	this={readonly ? 'div' : 'button'}
	role={readonly ? 'img' : 'button'}
	onclick={readonly ? undefined : () => onOpenModal(item)}
	onmouseenter={() => onHover?.(item.id)}
	onmouseleave={() => onHover?.(null)}
	onfocus={readonly ? undefined : () => onHover?.(item.id)}
	onblur={readonly ? undefined : () => onHover?.(null)}
	tabindex={readonly ? -1 : 0}
	class={cn(
		'pos-card flex flex-col overflow-hidden text-left transition-all',
		readonly ? 'cursor-default' : 'hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.99]',
		getProteinBorderClass(item.proteinType),
		item.status === 'critical' ? 'ring-1 ring-status-red/30' : '',
		isHovered ? 'shadow-md -translate-y-0.5 ring-2 ring-accent/30' : ''
	)}
>
	{#if item.image}
		<div class="w-full h-40 bg-gray-100 relative overflow-hidden">
			<img src={item.image} alt={item.name} class="w-full h-full object-cover" />
			<div class={cn("absolute bottom-0 left-0 right-0 h-1", getProteinStripeClass(item.proteinType))}></div>
		</div>
	{:else}
		<div class={cn("h-1 w-full relative overflow-hidden transition-all", getProteinStripeClass(item.proteinType))}>
			{#if isHovered}
				<div class="absolute inset-0 bg-white/30 animate-pulse"></div>
			{/if}
		</div>
	{/if}

	<div class="flex flex-col gap-2 p-4 pt-3" in:fade={{ duration: 200, delay: 100 }}>
		{#if !item.image}
			<div class="flex flex-wrap items-center gap-2">
				<CategoryIcon category={item.category} class="h-8 w-8" iconClass="w-4 h-4" />
			</div>
		{/if}

		<p class="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 mt-2">{item.name}</p>

		<p class="font-mono text-xl font-bold text-gray-900 mt-1">
			{item.currentStock.toLocaleString()}
			<span class="text-xs font-normal text-gray-400">{item.unit}</span>
		</p>

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

		{#if !readonly}
			<div class="mt-2 flex justify-end">
				<div
					role="button"
					tabindex="0"
					onclick={(e) => onEditClick(item, e)}
					onkeydown={(e) => e.key === 'Enter' && onEditClick(item, e as any)}
					class="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
				>
					<Edit3 class="w-3 h-3" /> Edit Info
				</div>
			</div>
		{/if}
	</div>
</svelte:element>
