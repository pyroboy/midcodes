<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { getSpoilageAlerts, countPeriods } from '$lib/stores/stock.svelte';
	import { Package, Truck, ArrowLeftRight, ClipboardCheck, Trash2 } from 'lucide-svelte';
	let { children }: { children: import('svelte').Snippet } = $props();

	let currentRoute = $derived(page.url.pathname);

	const spoilageCount = $derived(getSpoilageAlerts().length);
	const pendingCount  = $derived(countPeriods.filter(p => p.status === 'pending').length);

	const tabs = $derived([
		{ href: '/stock/inventory',  label: 'Inventory',   Icon: Package },
		{ href: '/stock/deliveries', label: 'Deliveries',  Icon: Truck,          badge: spoilageCount },
		{ href: '/stock/transfers',  label: 'Transfers',   Icon: ArrowLeftRight },
		{ href: '/stock/counts',     label: 'Counts',      Icon: ClipboardCheck, badge: pendingCount },
		{ href: '/stock/waste',      label: 'Waste Log',   Icon: Trash2 },
	]);
</script>

<div class="flex h-full flex-col overflow-hidden bg-surface-secondary">
	<!-- Section header -->
	<div class="shrink-0 bg-white border-b border-border">
		<div class="flex items-center justify-between px-3 sm:px-4 md:px-6 pt-2 sm:pt-3 pb-1 sm:pb-2">
			<div class="flex items-center gap-3">
				<h1 class="text-sm sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight">Stock</h1>
			</div>
		</div>

		<!-- Tab row — horizontally scrollable on mobile -->
		<nav class="flex items-end gap-0 sm:gap-0.5 px-1 sm:px-3 md:px-4 overflow-x-auto scrollbar-hide">
			{#each tabs as tab}
				{@const isActive = currentRoute === tab.href}
				<a
					href={tab.href}
					class={cn(
						'relative flex items-center gap-1 sm:gap-2 min-h-[40px] sm:min-h-[44px] px-2 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap shrink-0',
						isActive
							? 'border-accent text-accent bg-accent/5'
							: 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
					)}
				>
					<tab.Icon class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
					<span class="hidden sm:inline">{tab.label}</span>
					<span class="sm:hidden">{tab.label.length > 6 ? tab.label.slice(0, 5) + '.' : tab.label}</span>
					{#if tab.badge && tab.badge > 0}
						<span class="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-red px-1 text-[10px] font-bold text-white leading-none">
							{tab.badge}
						</span>
					{/if}
				</a>
			{/each}
		</nav>
	</div>

	<div class="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
		{@render children()}
	</div>
</div>
