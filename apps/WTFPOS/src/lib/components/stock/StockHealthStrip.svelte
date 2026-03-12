<script lang="ts">
	import { cn } from '$lib/utils';
	import { stockItems, getStockStatus, getCurrentStock, getSpoilageAlerts, type StockStatus } from '$lib/stores/stock.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { Package, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-svelte';

	interface Props {
		activeFilter?: 'all' | StockStatus;
		onFilterClick?: (status: 'all' | StockStatus) => void;
	}
	let { activeFilter = $bindable('all'), onFilterClick }: Props = $props();

	const items = $derived(
		stockItems.value.filter(s => session.locationId === 'all' || s.locationId === session.locationId)
	);

	const itemsWithStatus = $derived(items.map(s => getStockStatus(s.id)));

	const total = $derived(items.length);
	const okCount = $derived(itemsWithStatus.filter(s => s === 'ok').length);
	const lowCount = $derived(itemsWithStatus.filter(s => s === 'low').length);
	const criticalCount = $derived(itemsWithStatus.filter(s => s === 'critical').length);

	/** Items with 'ok' status but currentStock <= 1.5x minLevel — approaching low threshold */
	const approachingLow = $derived(
		items.filter((s, i) => {
			if (itemsWithStatus[i] !== 'ok') return false;
			const current = getCurrentStock(s.id);
			return current <= s.minLevel * 1.5;
		}).length
	);

	/** Total weight of all meat items (unit === 'g') in kg */
	const totalMeatWeightKg = $derived(
		items
			.filter(s => s.unit === 'g')
			.reduce((sum, s) => sum + getCurrentStock(s.id), 0) / 1000
	);

	/** Spoilage alerts (batches expiring within 3 days) */
	const spoilageCount = $derived(getSpoilageAlerts().length);
</script>

<div class="flex items-stretch gap-3 w-full shrink-0">
	<button
		onclick={() => onFilterClick?.('all')}
		class={cn(
			'flex-1 pos-card px-4 py-3 flex items-center justify-between text-left transition-all',
			activeFilter === 'all' ? 'border-gray-400 bg-gray-50 shadow-sm' : 'hover:border-gray-300'
		)}
	>
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
				<Package class="w-5 h-5" />
			</div>
			<div>
				<p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Items</p>
				<p class="text-xl font-black text-gray-900 leading-none mt-1">{total}</p>
				{#if totalMeatWeightKg > 0}
					<p class="text-[10px] text-gray-400 mt-0.5">{totalMeatWeightKg.toFixed(1)} kg meat on hand</p>
				{/if}
			</div>
		</div>
	</button>

	<button
		onclick={() => onFilterClick?.('ok')}
		class={cn(
			'flex-1 pos-card relative overflow-hidden px-4 py-3 flex items-center justify-between text-left transition-all',
			activeFilter === 'ok' ? 'border-status-green bg-status-green-light/30 shadow-sm' : 'hover:border-status-green/30',
			okCount === 0 && 'opacity-40'
		)}
	>
		<div class="absolute inset-y-0 left-0 w-1 bg-status-green"></div>
		<div class="flex items-center gap-3 pl-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-status-green-light text-status-green">
				<CheckCircle class="w-5 h-5" />
			</div>
			<div>
				<p class="text-[10px] font-bold uppercase tracking-wider text-status-green/70">OK</p>
				<p class="text-xl font-black text-status-green leading-none mt-1">{okCount}</p>
				{#if approachingLow > 0}
					<p class="text-[10px] text-status-yellow mt-0.5">{approachingLow} approaching low</p>
				{/if}
			</div>
		</div>
	</button>

	<button
		onclick={() => onFilterClick?.('low')}
		class={cn(
			'flex-1 pos-card relative overflow-hidden px-4 py-3 flex items-center justify-between text-left transition-all',
			activeFilter === 'low' ? 'border-status-yellow bg-status-yellow-light/30 shadow-sm' : 'hover:border-status-yellow/30',
			lowCount === 0 && 'opacity-40'
		)}
	>
		<div class="absolute inset-y-0 left-0 w-1 bg-status-yellow"></div>
		<div class="flex items-center gap-3 pl-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-status-yellow-light text-status-yellow">
				<AlertTriangle class="w-5 h-5" />
			</div>
			<div>
				<p class="text-[10px] font-bold uppercase tracking-wider text-status-yellow/70">Low Stock</p>
				<p class="text-xl font-black text-status-yellow leading-none mt-1">{lowCount}</p>
				{#if lowCount === 0 && approachingLow > 0}
					<p class="text-[10px] text-status-yellow/70 mt-0.5">{approachingLow} nearing threshold</p>
				{:else if lowCount === 0}
					<p class="text-[10px] text-gray-400 mt-0.5">None — all healthy</p>
				{/if}
			</div>
		</div>
	</button>

	<button
		onclick={() => onFilterClick?.('critical')}
		class={cn(
			'flex-1 pos-card relative overflow-hidden px-4 py-3 flex items-center justify-between text-left transition-all',
			activeFilter === 'critical' ? 'border-status-red bg-status-red-light/30 shadow-sm' : 'hover:border-status-red/30',
			criticalCount === 0 && 'opacity-40'
		)}
	>
		<div class="absolute inset-y-0 left-0 w-1 bg-status-red"></div>
		<div class="flex items-center gap-3 pl-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-status-red-light text-status-red">
				<AlertOctagon class="w-5 h-5" />
			</div>
			<div>
				<p class="text-[10px] font-bold uppercase tracking-wider text-status-red/70">Critical</p>
				<p class="text-xl font-black text-status-red leading-none mt-1">{criticalCount}</p>
				{#if spoilageCount > 0}
					<p class="text-[10px] text-status-red/70 mt-0.5">{spoilageCount} batch{spoilageCount > 1 ? 'es' : ''} expiring</p>
				{:else if criticalCount === 0}
					<p class="text-[10px] text-gray-400 mt-0.5">No alerts</p>
				{/if}
			</div>
		</div>
	</button>
</div>
