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
		<div class="flex items-center justify-between px-6 pt-3 pb-2">
			<div class="flex items-center gap-3">
				<h1 class="text-xl font-bold text-gray-900 tracking-tight">Stock Management</h1>
			</div>
		</div>

		<!-- Tab row -->
		<nav class="flex items-end gap-0.5 px-4">
			{#each tabs as tab}
				{@const isActive = currentRoute === tab.href}
				<a
					href={tab.href}
					class={cn(
						'relative flex items-center gap-2 min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2',
						isActive
							? 'border-accent text-accent bg-accent/5'
							: 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
					)}
				>
					<tab.Icon class="w-4 h-4 flex-shrink-0" />
					{tab.label}
					{#if tab.badge && tab.badge > 0}
						<span class="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-red px-1 text-[10px] font-bold text-white leading-none">
							{tab.badge}
						</span>
					{/if}
				</a>
			{/each}
		</nav>
	</div>

	<div class="flex-1 overflow-auto p-6">
		{@render children()}
	</div>
</div>
