<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import TopBar from '$lib/components/TopBar.svelte';
	import { session } from '$lib/stores/session.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	let currentRoute = $derived(page.url.pathname);
	const isAllBranches = $derived(session.locationId === 'all');

	const tabs = [
		{ href: '/stock/inventory', label: 'Current Inventory' },
		{ href: '/stock/receive', label: 'Receive Delivery' },
		{ href: '/stock/counts', label: 'Stock Counts' },
		{ href: '/stock/waste', label: 'Waste Log' }
	];
</script>

<div class="flex h-screen flex-col overflow-hidden bg-surface-secondary">
	<TopBar />

	<div class="shrink-0 bg-white border-b border-border px-6 py-3 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-bold text-gray-900 tracking-tight">Stock Management</h1>
			{#if isAllBranches}
				<span class="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
					📊 Aggregated View
				</span>
			{/if}
		</div>
		<nav class="flex space-x-1">
			{#each tabs as tab}
				<a
					href={tab.href}
					class={cn(
						"px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
						currentRoute === tab.href
							? "bg-accent/10 text-accent font-semibold"
							: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					)}
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="flex-1 overflow-auto p-6">
		{@render children()}
	</div>
</div>
