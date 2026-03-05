<script lang="ts">
	import { cn } from '$lib/utils';
	import { stockItems, getStockStatus, type StockStatus } from '$lib/stores/stock.svelte';
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
			</div>
		</div>
	</button>

	<button
		onclick={() => onFilterClick?.('ok')}
		class={cn(
			'flex-1 pos-card relative overflow-hidden px-4 py-3 flex items-center justify-between text-left transition-all',
			activeFilter === 'ok' ? 'border-status-green bg-status-green-light/30 shadow-sm' : 'hover:border-status-green/30'
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
			</div>
		</div>
	</button>

	<button
		onclick={() => onFilterClick?.('low')}
		class={cn(
			'flex-1 pos-card relative overflow-hidden px-4 py-3 flex items-center justify-between text-left transition-all',
			activeFilter === 'low' ? 'border-status-yellow bg-status-yellow-light/30 shadow-sm' : 'hover:border-status-yellow/30'
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
			</div>
		</div>
	</button>

	<button
		onclick={() => onFilterClick?.('critical')}
		class={cn(
			'flex-1 pos-card relative overflow-hidden px-4 py-3 flex items-center justify-between text-left transition-all',
			activeFilter === 'critical' ? 'border-status-red bg-status-red-light/30 shadow-sm' : 'hover:border-status-red/30'
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
			</div>
		</div>
	</button>
</div>
