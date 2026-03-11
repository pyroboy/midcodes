<script lang="ts">
	import '../app.css';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import DbHealthBanner from '$lib/components/DbHealthBanner.svelte';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import MobileTopBar from '$lib/components/MobileTopBar.svelte';
	import LocationBanner from '$lib/components/stock/LocationBanner.svelte';
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar/index.js';
	import { initConnectionMonitor } from '$lib/stores/connection.svelte';
	import { initDeviceHeartbeat } from '$lib/stores/device.svelte';
	import { initDbHealthCheck } from '$lib/stores/db-health.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isWarehouseSession } from '$lib/stores/session.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	// Don't show sidebar on the login page
	const showSidebar = $derived(page.url.pathname !== '/');

	const RETAIL_ONLY_PREFIXES = ['/pos', '/kitchen'];
	$effect(() => {
		if (browser && isWarehouseSession() && RETAIL_ONLY_PREFIXES.some(p => page.url.pathname === p || page.url.pathname.startsWith(p + '/'))) {
			goto('/stock/inventory');
		}
	});

	// Default sidebar collapsed; read cookie for persisted state
	let sidebarOpen = $state(browser ? document.cookie.match(/sidebar:state=(\w+)/)?.[1] === 'true' : false);

	// ─── Dev Error Overlay ────────────────────────────────────────────────────
	interface CapturedError { message: string; source?: string; stack?: string; type: 'error' | 'rejection' }
	let devErrors = $state<CapturedError[]>([]);
	let showErrors = $state(false);

	onMount(() => {
		initConnectionMonitor();
		initDeviceHeartbeat();
		initDbHealthCheck();

		if (!import.meta.env.DEV) return;

		const handleError = (e: ErrorEvent) => {
			devErrors = [{ message: e.message, source: `${e.filename}:${e.lineno}:${e.colno}`, stack: e.error?.stack, type: 'error' as const }, ...devErrors].slice(0, 20);
			showErrors = true;
		};
		const handleRejection = (e: PromiseRejectionEvent) => {
			const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
			const stack = e.reason instanceof Error ? e.reason.stack : undefined;
			devErrors = [{ message: msg, stack, type: 'rejection' as const }, ...devErrors].slice(0, 20);
			showErrors = true;
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);
		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
		};
	});
</script>

<ConnectionStatus />
<DbHealthBanner />

{#if showSidebar}
	<SidebarProvider bind:open={sidebarOpen}>
		<AppSidebar />
		<SidebarInset class="h-svh overflow-hidden">
			<MobileTopBar />
			<LocationBanner />
			{@render children()}
		</SidebarInset>
	</SidebarProvider>
{:else}
	{@render children()}
{/if}

{#if import.meta.env.DEV && devErrors.length > 0}
	<!-- Dev error badge -->
	<button
		onclick={() => (showErrors = !showErrors)}
		class="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-lg"
		style="min-height: unset"
	>
		⚠ {devErrors.length} error{devErrors.length !== 1 ? 's' : ''}
	</button>

	{#if showErrors}
		<div class="fixed inset-0 z-[10000] flex items-end justify-end p-4 pointer-events-none">
			<div class="pointer-events-auto flex max-h-[70vh] w-[520px] flex-col overflow-hidden rounded-xl bg-gray-950 text-white shadow-2xl">
				<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
					<span class="font-mono text-sm font-bold text-red-400">⚠ Dev Errors ({devErrors.length})</span>
					<div class="flex gap-2">
						<button onclick={() => { devErrors = []; showErrors = false; }} class="text-[10px] font-semibold text-gray-400 hover:text-white" style="min-height: unset">Clear</button>
						<button onclick={() => (showErrors = false)} class="text-gray-400 hover:text-white" style="min-height: unset">✕</button>
					</div>
				</div>
				<div class="flex flex-col gap-0 overflow-y-auto">
					{#each devErrors as err, i}
						<div class="border-b border-white/5 px-4 py-3">
							<div class="flex items-start gap-2">
								<span class="mt-0.5 shrink-0 rounded bg-red-600/30 px-1.5 py-0.5 font-mono text-[10px] text-red-400">{err.type}</span>
								<p class="font-mono text-xs text-red-300 leading-relaxed">{err.message}</p>
							</div>
							{#if err.source}
								<p class="mt-1 font-mono text-[10px] text-gray-500">{err.source}</p>
							{/if}
							{#if err.stack}
								<pre class="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[9px] text-gray-600 leading-relaxed">{err.stack}</pre>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
{/if}
