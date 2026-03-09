<script lang="ts">
	import SubNav from '$lib/components/SubNav.svelte';
	import BluetoothScaleStatus from '$lib/components/BluetoothScaleStatus.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { startKitchenPush } from '$lib/stores/kitchen-push';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	// In aggregate mode, only All Orders is meaningful (Queue/Weigh are branch-specific ops)
	const links = $derived(
		session.locationId === 'all'
			? [{ href: '/kitchen/all-orders', label: '🧾 All Orders' }]
			: [
					{ href: '/kitchen/all-orders', label: '🧾 All Orders' },
					{ href: '/kitchen/orders', label: '📋 Order Queue' },
					{ href: '/kitchen/weigh-station', label: '⚖️ Weigh Station' }
				]
	);

	// P0-1: Staff role is not allowed on kitchen pages — redirect to POS.
	$effect(() => {
		if (browser && session.role === 'staff') goto('/pos');
	});

	// Push active orders to local server whenever RxDB changes.
	// Re-runs when locationId changes (reactive dependency via session read).
	// No-op when locationId === 'all' or 'wh-tag' (handled inside startKitchenPush).
	$effect(() => {
		void session.locationId;
		return startKitchenPush();
	});
</script>

<div class="flex h-full flex-col overflow-hidden bg-surface-secondary">
	<div class="flex items-center border-b border-border bg-surface">
		<div class="flex-1">
			<SubNav {links} />
		</div>
		<div class="pr-3">
			<BluetoothScaleStatus />
		</div>
	</div>
	<main class="flex-1 overflow-y-auto p-6">
		{@render children()}
	</main>
</div>
