<script lang="ts">
	import { cn } from '$lib/utils';
	import type { StockCategory } from '$lib/stores/stock.svelte';
	import { Package, Drumstick, GlassWater, Utensils, Wheat } from 'lucide-svelte';

	interface Props {
		category: StockCategory;
		class?: string;
		iconClass?: string;
	}
	let { category, class: className = '', iconClass = 'w-5 h-5' }: Props = $props();

	const categoryStyle: Record<StockCategory, { thumbBg: string; colorClass: string }> = {
		Meats:  { thumbBg: 'bg-orange-100',  colorClass: 'text-orange-600' },
		Sides:  { thumbBg: 'bg-blue-100',    colorClass: 'text-blue-500' },
		Dishes: { thumbBg: 'bg-emerald-100', colorClass: 'text-emerald-600' },
		Drinks: { thumbBg: 'bg-purple-100',  colorClass: 'text-purple-500' },
		Pantry: { thumbBg: 'bg-amber-100',   colorClass: 'text-amber-600' },
	};
</script>

<div class={cn('flex items-center justify-center rounded-lg flex-shrink-0', categoryStyle[category].thumbBg, className)}>
	{#if category === 'Meats'}
		<Drumstick class={cn(categoryStyle[category].colorClass, iconClass)} />
	{:else if category === 'Drinks'}
		<GlassWater class={cn(categoryStyle[category].colorClass, iconClass)} />
	{:else if category === 'Dishes'}
		<Utensils class={cn(categoryStyle[category].colorClass, iconClass)} />
	{:else if category === 'Pantry'}
		<Wheat class={cn(categoryStyle[category].colorClass, iconClass)} />
	{:else}
		<Package class={cn(categoryStyle[category].colorClass, iconClass)} />
	{/if}
</div>
