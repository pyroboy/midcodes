<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { connectionState, dismissKdsAlert } from '$lib/stores/connection.svelte';
	import { cn } from '$lib/utils';

	const tierMessage = $derived(
		connectionState.connectivityTier === 'lan'
			? 'LAN ONLY — Local sync active. No internet connection.'
			: 'OFFLINE — Changes saved locally. Reconnect to sync.'
	);
</script>

<!-- Offline / LAN-Only Banner -->
{#if connectionState.connectivityTier !== 'full'}
	<div class={cn(
		'shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white',
		connectionState.connectivityTier === 'lan' ? 'bg-amber-500' : 'bg-yellow-500'
	)}>
		<span class="inline-block h-2 w-2 rounded-full bg-white animate-pulse"></span>
		{tierMessage}
	</div>
{/if}

<!-- KDS Critical Alert -->
{#if !connectionState.kdsReachable && !connectionState.kdsAlertDismissed}
	<div class="fixed inset-0 z-[80] flex items-center justify-center bg-red-900/90 backdrop-blur-sm">
		<div class="flex flex-col items-center gap-6 text-center max-w-md">
			<div class="text-6xl">🚨</div>
			<h1 class="text-3xl font-extrabold text-white uppercase tracking-wider">Kitchen Offline</h1>
			<p class="text-lg text-red-200">
				REVERT TO PAPER TICKETS / MANUAL PROCESS
			</p>
			<p class="text-sm text-red-300">
				The connection to the Kitchen Display System has been lost. Orders will NOT appear on kitchen screens until connection is restored.
			</p>
			<button
				onclick={dismissKdsAlert}
				class="rounded-xl bg-white px-8 py-3 text-base font-bold text-red-700 hover:bg-red-50 transition-colors"
				style="min-height: 48px"
			>
				I Understand — Continue
			</button>
		</div>
	</div>
{/if}

<!-- Persistent KDS warning banner after dismissal -->
{#if !connectionState.kdsReachable && connectionState.kdsAlertDismissed}
	<div class="shrink-0 flex items-center justify-center gap-2 bg-status-red px-4 py-1.5 text-xs font-bold text-white">
		🚨 KITCHEN OFFLINE — Using paper tickets
	</div>
{/if}
