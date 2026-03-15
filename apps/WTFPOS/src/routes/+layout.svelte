<script lang="ts">
	import '../app.css';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import DbHealthBanner from '$lib/components/DbHealthBanner.svelte';
	import SyncStatusBanner from '$lib/components/SyncStatusBanner.svelte';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import MobileTopBar from '$lib/components/MobileTopBar.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar/index.js';
	import { session, isWarehouseSession } from '$lib/stores/session.svelte';
	import { initConnectionMonitor } from '$lib/stores/connection.svelte';
	import { initDeviceHeartbeat, stopDeviceHeartbeat, isThisDeviceServer } from '$lib/stores/device.svelte';
	import { initDbHealthCheck } from '$lib/stores/db-health.svelte';
	import { pruneOldData } from '$lib/db/cleanup';
	import { reconcileDataConsistency } from '$lib/db/reconcile';
	import { needsRxDb, isFullRxDbMode, resolveDataMode } from '$lib/stores/data-mode.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	// Don't show sidebar on the login page
	const isLoginPage = $derived(page.url.pathname === '/');
	const showSidebar = $derived(!isLoginPage);

	// Server reset recovery: show "Preparing Server" overlay until replication finishes pushing
	let serverPreparing = $state(browser && !!localStorage.getItem('wtfpos_server_preparing'));
	let prepProgress = $state(0);
	let prepPhase = $state('Initializing database...');
	let prepCompleted = $state<string[]>([]);
	let prepTotal = $state(0);
	let prepLogs = $state<string[]>(['Starting server preparation...']);
	let prepShowSkip = $state(false); // show skip button after timeout

	function dismissServerPrep() {
		serverPreparing = false;
		try { localStorage.removeItem('wtfpos_server_preparing'); } catch { /* noop */ }
	}

	// P0: Redirect unauthenticated users to login
	$effect(() => {
		if (browser && !isLoginPage && !session.userName) {
			goto('/');
		}
	});

	const RETAIL_ONLY_PREFIXES = ['/pos', '/kitchen'];
	$effect(() => {
		if (browser && isWarehouseSession() && RETAIL_ONLY_PREFIXES.some(p => page.url.pathname === p || page.url.pathname.startsWith(p + '/'))) {
			goto('/stock/inventory');
		}
	});

	// Report route changes to the server so the device route map stays current
	afterNavigate(({ to }) => {
		if (!browser || !to?.url) return;
		const route = to.url.pathname;
		// Skip API/internal paths — only report real page navigations
		if (route.startsWith('/api/') || route.startsWith('/_app/')) return;
		const body = new Blob([JSON.stringify({ route })], { type: 'application/json' });
		if (navigator.sendBeacon) {
			navigator.sendBeacon('/api/device/route', body);
		} else {
			fetch('/api/device/route', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ route }),
				keepalive: true,
			}).catch(() => {});
		}
	});

	// Default sidebar collapsed; read cookie for persisted state
	let sidebarOpen = $state(browser ? document.cookie.match(/sidebar:state=(\w+)/)?.[1] === 'true' : false);

	// ─── Sync Gate (client devices only) ─────────────────────────────────────
	// Blocks the UI with a loading overlay until priority collections sync,
	// preventing stale local data from being shown to the user.
	// Server device skips this — its local data IS the source of truth.
	const SYNC_GATE_TIMEOUT_MS = 8_000; // max wait before showing local data anyway
	let syncGateOpen = $state(false); // true = gate lifted, show app
	let syncGateStatus = $state('Connecting to server...');
	let unsubSyncGate: (() => void) | null = null;
	let syncGateTimer: ReturnType<typeof setTimeout> | null = null;

	// Login page and server device bypass the gate immediately
	const needsSyncGate = $derived(!isLoginPage && !isThisDeviceServer() && !!session.userName);

	function liftSyncGate() {
		syncGateOpen = true;
		if (unsubSyncGate) { unsubSyncGate(); unsubSyncGate = null; }
		if (syncGateTimer) { clearTimeout(syncGateTimer); syncGateTimer = null; }
	}

	// If device identity resolves as server AFTER mount, lift the gate
	$effect(() => {
		if (isThisDeviceServer() && !syncGateOpen) {
			liftSyncGate();
		}
	});

	// ─── Dev Error Overlay ────────────────────────────────────────────────────
	interface CapturedError { message: string; source?: string; stack?: string; type: 'error' | 'rejection' }
	let devErrors = $state<CapturedError[]>([]);
	let showErrors = $state(false);

	onMount(() => {
		initConnectionMonitor();
		initDeviceHeartbeat();
		initDbHealthCheck();
		pruneOldData(); // background cleanup — non-blocking

		// Proactive data reconciliation — server device only, every 5 minutes
		const isRemoteClient = window.location.hostname !== 'localhost'
			&& window.location.hostname !== '127.0.0.1';
		if (!isRemoteClient) {
			const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;
			const reconcileTimer = setTimeout(() => {
				reconcileDataConsistency().catch(() => {});
				setInterval(() => {
					reconcileDataConsistency().catch(() => {});
				}, RECONCILE_INTERVAL_MS);
			}, 30_000); // initial delay: 30s to let stores initialize
			// Note: no cleanup needed — reconcile is best-effort background work
		}

		// Server reset recovery: listen for replication to finish so we can dismiss overlay
		if (serverPreparing) {
			prepLogs = [...prepLogs, 'Waiting for RxDB initialization...'];

			// Fallback: show skip button after 30s, auto-dismiss after 90s
			const skipTimer = setTimeout(() => {
				prepShowSkip = true;
				prepLogs = [...prepLogs, '⚠ Taking longer than expected — you can skip below'];
			}, 30_000);
			const autoSkipTimer = setTimeout(() => {
				if (serverPreparing) {
					console.warn('[ServerPrep] Auto-dismissing after 90s timeout');
					dismissServerPrep();
				}
			}, 90_000);

			import('$lib/db/replication').then(({ subscribeSyncActivity }) => {
				prepLogs = [...prepLogs, 'Replication module loaded'];
				const unsub = subscribeSyncActivity((activity) => {
					prepPhase = activity.phase;
					prepCompleted = activity.completedCollections;
					prepTotal = activity.totalCollections;
					prepProgress = prepTotal > 0
						? Math.round((activity.completedCollections.length / prepTotal) * 100)
						: 0;

					// Add log entries for newly completed collections
					for (const col of activity.completedCollections) {
						const logEntry = `✓ ${col}`;
						if (!prepLogs.includes(logEntry)) {
							prepLogs = [...prepLogs, logEntry];
						}
					}

					if (activity.prioritySyncDone && !prepLogs.includes('★ Priority sync complete')) {
						prepLogs = [...prepLogs, '★ Priority sync complete'];
					}

					if (activity.initialSyncDone) {
						prepLogs = [...prepLogs, '✅ All collections synced — server ready!'];
						clearTimeout(skipTimer);
						clearTimeout(autoSkipTimer);
						setTimeout(() => {
							serverPreparing = false;
							unsub();
						}, 800); // brief pause so user sees 100%
					}
				});
			}).catch(() => {
				clearTimeout(skipTimer);
				clearTimeout(autoSkipTimer);
				serverPreparing = false;
			});
		}

		// Ensure data mode is resolved on every page load (not just login).
		// The sessionStorage cache provides the initial value instantly,
		// but this call re-validates against the device identity endpoint.
		if (session.userName) {
			resolveDataMode();
		}

		// ─── Sync gate: wait for priority sync on client devices ─────────
		if (needsSyncGate && needsRxDb()) {
			// Safety timeout — never block forever
			syncGateTimer = setTimeout(() => {
				console.warn(`[SyncGate] Timeout (${SYNC_GATE_TIMEOUT_MS}ms) — showing local data`);
				liftSyncGate();
			}, SYNC_GATE_TIMEOUT_MS);

			// Subscribe to replication activity
			import('$lib/db/replication').then(({ subscribeSyncActivity }) => {
				unsubSyncGate = subscribeSyncActivity((activity) => {
					if (activity.prioritySyncDone) {
						console.log('[SyncGate] Priority sync done — lifting gate');
						liftSyncGate();
					} else if (activity.active) {
						syncGateStatus = 'Syncing data with server...';
					}
				});
			}).catch(() => {
				// Replication not available — lift gate immediately
				liftSyncGate();
			});
		} else {
			// Server device, login page, or non-RxDB data mode — no gate needed
			syncGateOpen = true;
		}

		// P4: Request persistent storage to prevent IndexedDB eviction
		navigator.storage?.persist?.().then((granted) => {
			if (granted) console.log('[Storage] Persistent storage granted');
		});

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
			stopDeviceHeartbeat();
			if (unsubSyncGate) unsubSyncGate();
			if (syncGateTimer) clearTimeout(syncGateTimer);
		};
	});
</script>

<!-- ═══ Server Preparing: blocks UI after reset until data is pushed to store ═══ -->
{#if serverPreparing}
	<div id="wtfpos-reset-overlay" class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gray-900 text-white p-6">
		<div class="flex flex-col items-center w-full max-w-md gap-6">
			<!-- Header -->
			<div class="text-center">
				<div class="text-5xl sm:text-6xl mb-3">🔧</div>
				<div class="text-2xl sm:text-3xl font-black tracking-wider">PREPARING SERVER</div>
			</div>

			<!-- Progress bar -->
			<div class="w-full">
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-mono text-gray-400">{prepPhase}</span>
					<span class="text-xs font-mono font-bold text-accent">{prepProgress}%</span>
				</div>
				<div class="h-3 w-full rounded-full bg-gray-800 overflow-hidden">
					<div
						class="h-full rounded-full bg-accent transition-all duration-300 ease-out"
						style="width: {prepProgress}%"
					></div>
				</div>
				{#if prepTotal > 0}
					<div class="mt-1.5 text-[10px] font-mono text-gray-500 text-right">
						{prepCompleted.length} / {prepTotal} collections
					</div>
				{/if}
			</div>

			<!-- Live log -->
			<div class="w-full rounded-lg bg-gray-800/80 border border-gray-700 p-3 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed">
				{#each prepLogs as log}
					<div class={log.startsWith('✅') ? 'text-status-green font-bold' : log.startsWith('★') ? 'text-accent font-bold' : log.startsWith('✓') ? 'text-gray-300' : 'text-gray-500'}>
						{log}
					</div>
				{/each}
			</div>

			<!-- Spinner -->
			{#if prepProgress < 100}
				<div class="h-8 w-8 rounded-full border-3 border-gray-700 border-t-accent animate-spin"></div>
			{/if}

			<!-- Skip button — appears after 30s timeout -->
			{#if prepShowSkip}
				<button
					onclick={dismissServerPrep}
					class="mt-2 rounded-lg bg-gray-700 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
					style="min-height: unset"
				>
					Skip — Continue Anyway
				</button>
			{/if}
		</div>
	</div>
{/if}

<!-- ═══ Sync Gate: blocks client devices until server data arrives ═══ -->
{#if needsSyncGate && !syncGateOpen}
	<div class="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-white">
		<div class="flex flex-col items-center gap-4">
			<!-- Animated logo/spinner -->
			<div class="relative flex h-16 w-16 items-center justify-center">
				<div class="absolute inset-0 rounded-full border-4 border-gray-100"></div>
				<div class="absolute inset-0 rounded-full border-4 border-t-accent animate-spin"></div>
				<span class="text-xl font-black text-accent">W</span>
			</div>
			<div class="flex flex-col items-center gap-1">
				<p class="text-sm font-bold text-gray-900">{syncGateStatus}</p>
				<p class="text-xs text-gray-400">Fetching latest data from server</p>
			</div>
		</div>
	</div>
{/if}

<ConnectionStatus />
<DbHealthBanner />
{#if !isThisDeviceServer()}
	<SyncStatusBanner />
{/if}

{#if showSidebar}
	<SidebarProvider bind:open={sidebarOpen}>
		<AppSidebar />
		<SidebarInset class="h-svh overflow-hidden">
			<MobileTopBar />
			<StatusBar />
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
		class="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-lg fixed-safe-bottom fixed-safe-right"
		style="min-height: unset"
	>
		⚠ {devErrors.length} error{devErrors.length !== 1 ? 's' : ''}
	</button>

	{#if showErrors}
		<div class="fixed inset-0 z-[10000] flex items-end justify-end p-4 pointer-events-none">
			<div class="pointer-events-auto flex max-h-[70vh] w-full max-w-[520px] flex-col overflow-hidden rounded-xl bg-gray-950 text-white shadow-2xl">
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
