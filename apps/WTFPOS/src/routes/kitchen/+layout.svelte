<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import SubNav from '$lib/components/SubNav.svelte';
	import { session } from '$lib/stores/session.svelte';
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	const links = [
		{ href: '/kitchen/all-orders',    label: '🧾 All Orders' },
		{ href: '/kitchen/orders',        label: '📋 Order Queue' },
		{ href: '/kitchen/weigh-station', label: '⚖️ Weigh Station' }
	];
</script>

<div class="flex h-screen flex-col overflow-hidden bg-surface-secondary">
	<TopBar />
	<SubNav {links} />

	{#if session.locationId === 'all'}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50 border-t border-border">
			<span class="text-5xl">🔒</span>
			<h2 class="text-xl font-bold text-gray-700">Select a specific location to view the Kitchen Queue</h2>
			<p class="text-sm text-gray-400">Use the location selector in the top bar to choose a branch.</p>
		</div>
	{:else}
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	{/if}
</div>
