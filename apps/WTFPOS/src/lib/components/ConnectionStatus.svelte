<script lang="ts">
	import { connectionState, dismissKdsAlert, simulateOffline, simulateOnline, simulateKdsDown, simulateKdsUp } from '$lib/stores/connection.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';

	const isAdmin = $derived(session.role === 'owner' || session.role === 'admin');
	let showDevPanel = $state(false);
</script>

<!-- Offline Banner -->
{#if !connectionState.isOnline}
	<div class="shrink-0 flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-bold text-white">
		<span class="inline-block h-2 w-2 rounded-full bg-white animate-pulse"></span>
		OFFLINE — Changes saved locally. Reconnect to sync.
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

<!-- Dev panel for simulating states (admin only) -->
{#if isAdmin}
	<button
		onclick={() => showDevPanel = !showDevPanel}
		class={cn(
			'fixed bottom-4 left-4 z-50 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-colors',
			connectionState.isOnline && connectionState.kdsReachable
				? 'bg-status-green text-white'
				: 'bg-status-red text-white animate-pulse'
		)}
		title="Connection Status"
	>
		📡
	</button>

	{#if showDevPanel}
		<div class="fixed bottom-14 left-4 z-50 rounded-xl border border-border bg-white shadow-xl p-4 w-56">
			<h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Connection Sim</h4>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Network</span>
					<button
						onclick={() => connectionState.isOnline ? simulateOffline() : simulateOnline()}
						class={cn('rounded px-2 py-0.5 text-[10px] font-bold', connectionState.isOnline ? 'bg-status-green text-white' : 'bg-status-red text-white')}
					>
						{connectionState.isOnline ? 'Online' : 'Offline'}
					</button>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">KDS</span>
					<button
						onclick={() => connectionState.kdsReachable ? simulateKdsDown() : simulateKdsUp()}
						class={cn('rounded px-2 py-0.5 text-[10px] font-bold', connectionState.kdsReachable ? 'bg-status-green text-white' : 'bg-status-red text-white')}
					>
						{connectionState.kdsReachable ? 'Reachable' : 'Down'}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
