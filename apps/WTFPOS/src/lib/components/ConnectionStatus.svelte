<script lang="ts">
	import { connectionState, dismissKdsAlert, simulateOffline, simulateOnline, simulateLanOnly, simulateKdsDown, simulateKdsUp } from '$lib/stores/connection.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { getCurrentDeviceId } from '$lib/stores/device.svelte';
	import { isSseMode, isApiFetchMode, needsRxDb } from '$lib/stores/data-mode.svelte';
	import { getSseConnectionState } from '$lib/stores/server-store.svelte';
	import { APP_VERSION, BUILD_DATE } from '$lib/version';
	import { cn } from '$lib/utils';
	import { Wifi, WifiOff, Radio, Server, Smartphone, RefreshCw, ChevronDown, ChevronUp, X, Rss, Users, Monitor, Tablet } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';

	const isAdmin = $derived(session.role === 'owner' || session.role === 'admin');
	const isLoggedIn = $derived(!!session.userName);
	const usesSse = $derived(isSseMode() || isApiFetchMode());
	const sseState = $derived(usesSse ? getSseConnectionState() : 'disconnected');
	let showPanel = $state(false);
	let showCollectionDetail = $state(false);

	const tierLabel = $derived(
		connectionState.connectivityTier === 'full' ? 'Online' :
		connectionState.connectivityTier === 'lan' ? 'LAN Only' :
		'Offline'
	);

	const tierMessage = $derived(
		connectionState.connectivityTier === 'lan'
			? 'LAN ONLY — Local sync active. No internet connection.'
			: 'OFFLINE — Changes saved locally. Reconnect to sync.'
	);

	// ─── Device identity (self-fetched with retry) ─────────────────────────
	let identity = $state({ ipAddress: '', isServer: false, serverLanIp: '' });
	const deviceId = $derived(getCurrentDeviceId());

	/** Fetch device identity directly, with retry. */
	async function fetchIdentity(retries = 3) {
		for (let i = 0; i < retries; i++) {
			try {
				const res = await fetch('/api/device/identify', { signal: AbortSignal.timeout(5000) });
				if (res.ok) {
					const data = await res.json();
					identity.ipAddress = data.ipAddress || '';
					identity.isServer = !!data.isServer;
					identity.serverLanIp = data.serverLanIp || '';
					return;
				}
			} catch { /* retry */ }
			if (i < retries - 1) await new Promise(r => setTimeout(r, 2000 * (i + 1)));
		}
	}

	// ─── Server Ping Test ───────────────────────────────────────────────────
	let pingStatus = $state<'idle' | 'testing' | 'ok' | 'fail'>('idle');
	let pingRoundTripMs = $state<number | null>(null);
	let pingWriteOk = $state<boolean | null>(null);
	let pingError = $state<string | null>(null);

	async function pingServer() {
		pingStatus = 'testing';
		pingError = null;
		const token = `ping-${Date.now()}`;
		const start = performance.now();
		try {
			const res = await fetch('/api/replication/ping', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, collection: 'tables', testWrite: true }),
				signal: AbortSignal.timeout(10_000)
			});
			pingRoundTripMs = Math.round(performance.now() - start);
			if (!res.ok) {
				pingStatus = 'fail';
				pingError = `HTTP ${res.status}`;
				return;
			}
			const data = await res.json();
			pingWriteOk = data.writeOk ?? null;
			pingStatus = data.echo === token ? 'ok' : 'fail';
			if (data.echo !== token) pingError = 'Token mismatch';
		} catch (err: any) {
			pingRoundTripMs = Math.round(performance.now() - start);
			pingStatus = 'fail';
			pingError = err.message || 'Unreachable';
		}
	}

	// ─── Sync status polling ─────────────────────────────────────────────────
	const ALL_COLLECTIONS = [
		'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
		'waste', 'deductions', 'adjustments', 'expenses', 'stock_counts', 'devices',
		'kds_tickets', 'x_reads', 'z_reads', 'audit_logs', 'kitchen_alerts',
		'floor_elements', 'shifts'
	];

	// Thin clients only sync priority collections — compare against those only
	const isRemoteClient = browser
		&& window.location.hostname !== 'localhost'
		&& window.location.hostname !== '127.0.0.1';
	const PRIORITY_COLLECTIONS = ['tables', 'orders', 'menu_items', 'floor_elements', 'kds_tickets', 'devices'];
	const ACTIVE_COLLECTIONS = isRemoteClient ? PRIORITY_COLLECTIONS : ALL_COLLECTIONS;

	interface CollectionSync {
		name: string;
		local: number;
		server: number;
		status: 'synced' | 'behind' | 'ahead';
	}

	let syncInfo = $state<{
		status: 'checking' | 'synced' | 'behind' | 'ahead' | 'unreachable';
		localTotal: number;
		serverTotal: number;
		collections: CollectionSync[];
		checkedAt: Date | null;
		serverHostname: string;
	}>({
		status: 'checking',
		localTotal: 0,
		serverTotal: 0,
		collections: [],
		checkedAt: null,
		serverHostname: ''
	});

	let checkInterval: ReturnType<typeof setInterval> | null = null;

	async function checkSync() {
		if (!browser) return;
		if (!needsRxDb()) return; // No local DB to check sync status for

		try {
			// Fetch server status + hostname in parallel
			const [statusRes, identifyRes] = await Promise.all([
				fetch('/api/replication/status', { signal: AbortSignal.timeout(5000) }).catch(() => null),
				fetch('/api/device/identify', { signal: AbortSignal.timeout(5000) }).catch(() => null)
			]);

			// Always try to extract hostname from identify response, even if status fails
			let hostname = syncInfo.serverHostname;
			if (identifyRes?.ok) {
				try {
					const identifyData = await identifyRes.json();
					hostname = identifyData.serverHostname || '';
					// Also update identity if we got data
					if (identifyData.ipAddress) {
						identity.ipAddress = identifyData.ipAddress;
						identity.isServer = !!identifyData.isServer;
						identity.serverLanIp = identifyData.serverLanIp || '';
					}
				} catch { /* json parse error */ }
			}

			if (!statusRes?.ok) {
				syncInfo = { ...syncInfo, status: 'unreachable', checkedAt: new Date(), serverHostname: hostname };
				return;
			}

			const statusData = await statusRes.json();
			const serverCounts: Record<string, number> = statusData.counts ?? {};

			// Count local docs
			const { getDb } = await import('$lib/db');
			const db = await getDb();
			const collections: CollectionSync[] = [];
			let localTotal = 0;
			let serverTotal = 0;

			for (const name of ACTIVE_COLLECTIONS) {
				const s = serverCounts[name] ?? 0;
				serverTotal += s;
				let l = 0;
				try {
					const col = (db as any).collections?.[name] ?? (db as any)[name];
					if (col) l = await col.count().exec();
				} catch { /* collection might not exist */ }
				localTotal += l;

				let status: CollectionSync['status'] = 'synced';
				if (s > l + 2) status = 'behind';
				else if (l > s + 2) status = 'ahead';

				collections.push({ name, local: l, server: s, status });
			}

			const totalDiff = Math.abs(serverTotal - localTotal);
			const tolerance = Math.max(10, Math.ceil(Math.max(serverTotal, localTotal) * 0.01));
			const hasBehind = collections.some(c => c.status === 'behind');
			const hasAhead = collections.some(c => c.status === 'ahead');

			let overallStatus: typeof syncInfo.status = 'synced';
			if (totalDiff > tolerance || hasBehind || hasAhead) {
				overallStatus = hasBehind ? 'behind' : hasAhead ? 'ahead' : 'synced';
			}

			syncInfo = {
				status: overallStatus,
				localTotal,
				serverTotal,
				collections,
				checkedAt: new Date(),
				serverHostname: hostname
			};
		} catch {
			syncInfo = { ...syncInfo, status: 'unreachable', checkedAt: new Date() };
		}
	}

	// ─── Connected Clients (server only) ────────────────────────────────────
	interface ConnectedClient {
		ip: string;
		isServer: boolean;
		deviceHint: string;
		deviceName: string;
		userName: string;
		role: string;
		locationId: string;
		currentRoute: string;
		lastSeenAt: string;
		isActive: boolean;
		connectionTypes: string[];
		lastSyncAt: string | null;
	}
	let connectedClients = $state<ConnectedClient[]>([]);
	let clientsLoading = $state(false);
	let showClients = $state(false);
	let clientsInterval: ReturnType<typeof setInterval> | null = null;

	async function fetchClients() {
		if (!browser || !identity.isServer) return;
		clientsLoading = true;
		try {
			const res = await fetch('/api/device/clients', { signal: AbortSignal.timeout(5000) });
			if (res.ok) {
				const data = await res.json();
				connectedClients = (data.clients ?? []).filter((c: ConnectedClient) => !c.isServer);
			}
		} catch { /* noop */ }
		clientsLoading = false;
	}

	const activeClients = $derived(connectedClients.filter(c => c.isActive));

	onMount(() => {
		// Fetch identity immediately (with retry) — don't wait for device heartbeat
		fetchIdentity();
		// Delay first sync check to let replication start
		setTimeout(() => checkSync(), 3000);
		checkInterval = setInterval(() => checkSync(), 60_000);
		// Fetch connected clients for server (after identity resolves)
		setTimeout(() => { fetchClients(); }, 2000);
		clientsInterval = setInterval(() => { if (identity.isServer && showClients) fetchClients(); }, 15_000);
	});

	onDestroy(() => {
		if (checkInterval) clearInterval(checkInterval);
		if (clientsInterval) clearInterval(clientsInterval);
	});

	// ─── Helpers ─────────────────────────────────────────────────────────────

	function formatTimeSince(date: Date | null): string {
		if (!date) return 'never';
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 10) return 'just now';
		if (seconds < 60) return `${seconds}s ago`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		return `${Math.floor(seconds / 3600)}h ago`;
	}

	function formatCollectionName(name: string): string {
		return name.replace(/_/g, ' ');
	}

	const syncedCount = $derived(syncInfo.collections.filter(c => c.status === 'synced').length);
	const totalCollections = $derived(syncInfo.collections.length);

	const pillColor = $derived(
		connectionState.connectivityTier === 'full' && (syncInfo.status === 'synced' || syncInfo.status === 'checking')
			? 'bg-status-green'
			: connectionState.connectivityTier === 'lan'
				? 'bg-amber-500'
				: connectionState.connectivityTier === 'offline'
					? 'bg-status-red animate-pulse'
					: syncInfo.status === 'behind' || syncInfo.status === 'ahead'
						? 'bg-amber-500'
						: 'bg-status-green'
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

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- Live Status Indicator — top-right, visible to ALL logged-in users     -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
{#if isLoggedIn}
	<button
		onclick={() => { showPanel = !showPanel; if (showPanel) checkSync(); }}
		class={cn(
			'fixed top-2.5 right-3 z-50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-md transition-all active:scale-95',
			pillColor
		)}
		title="Live Status — {tierLabel}"
		style="min-height: unset"
	>
		<span class={cn(
			'inline-block h-2 w-2 rounded-full bg-white/80',
			connectionState.connectivityTier === 'full' && 'animate-none',
			connectionState.connectivityTier !== 'full' && 'animate-pulse'
		)}></span>
		<span>Live</span>
	</button>

	<!-- ─── Live Status Panel ──────────────────────────────────────────── -->
	{#if showPanel}
		<!-- Backdrop -->
		<button
			class="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]"
			onclick={() => showPanel = false}
			aria-label="Close status panel"
		></button>

		<div class="fixed top-12 right-3 z-50 w-80 rounded-2xl border border-border bg-white shadow-2xl overflow-hidden">
			<!-- Header -->
			<div class={cn(
				'flex items-center justify-between px-4 py-3',
				connectionState.connectivityTier === 'full' ? 'bg-emerald-50' :
				connectionState.connectivityTier === 'lan' ? 'bg-amber-50' :
				'bg-red-50'
			)}>
				<div class="flex items-center gap-2">
					<div class={cn(
						'flex h-8 w-8 items-center justify-center rounded-full',
						pillColor
					)}>
						{#if connectionState.connectivityTier === 'offline'}
							<WifiOff class="h-4 w-4 text-white" />
						{:else if connectionState.connectivityTier === 'lan'}
							<Radio class="h-4 w-4 text-white" />
						{:else}
							<Wifi class="h-4 w-4 text-white" />
						{/if}
					</div>
					<div>
						<p class="text-sm font-bold text-gray-900">{tierLabel}</p>
						<p class="text-[10px] text-gray-500">
							{connectionState.connectivityTier === 'full' ? 'Internet + LAN active' :
							 connectionState.connectivityTier === 'lan' ? 'LAN only — no internet' :
							 'No network connection'}
						</p>
					</div>
				</div>
				<button
					onclick={() => showPanel = false}
					class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
					style="min-height: unset"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="px-4 py-3 flex flex-col gap-3">
				<!-- ─── Connection Info ────────────────────────────────── -->
				<div>
					<h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Connection</h4>
					<div class="flex flex-col gap-1.5">
						<!-- This device role badge -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								{#if identity.isServer}
									<Server class="h-3.5 w-3.5 text-accent" />
									<span class="text-xs font-bold text-accent">This device (Server)</span>
								{:else}
									<Smartphone class="h-3.5 w-3.5 text-gray-500" />
									<span class="text-xs font-bold text-gray-700">This device (Client)</span>
								{/if}
							</div>
							<span class={cn(
								'rounded px-1.5 py-0.5 text-[9px] font-bold',
								identity.isServer
									? 'bg-accent-light text-accent'
									: 'bg-blue-50 text-blue-600'
							)}>
								{identity.isServer ? 'SERVER' : 'CLIENT'}
							</span>
						</div>
						<!-- This device IP -->
						<div class="flex items-center justify-between pl-5">
							<span class="text-xs text-gray-500">IP address</span>
							<span class="text-xs font-mono font-medium text-gray-900">
								{identity.ipAddress || 'detecting...'}
							</span>
						</div>
						<!-- Server LAN IP (for clients: where to find the server) -->
						{#if !identity.isServer && identity.serverLanIp}
							<div class="flex items-center justify-between pl-5">
								<span class="text-xs text-gray-500">Server IP</span>
								<span class="text-xs font-mono font-medium text-gray-900">
									{identity.serverLanIp}
								</span>
							</div>
						{/if}
						<!-- Server hostname -->
						<div class="flex items-center justify-between pl-5">
							<span class="text-xs text-gray-500">Hostname</span>
							<span class="text-xs font-mono font-medium text-gray-900 truncate max-w-[140px]">
								{syncInfo.serverHostname || 'detecting...'}
							</span>
						</div>
						<!-- KDS -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Radio class="h-3.5 w-3.5 text-gray-400" />
								<span class="text-xs text-gray-600">Kitchen (KDS)</span>
							</div>
							<span class={cn(
								'rounded-full px-2 py-0.5 text-[10px] font-bold',
								connectionState.kdsReachable
									? 'bg-emerald-100 text-emerald-700'
									: 'bg-red-100 text-red-700'
							)}>
								{connectionState.kdsReachable ? 'Connected' : 'Offline'}
							</span>
						</div>
						<!-- Server Ping (round-trip test) -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Wifi class="h-3.5 w-3.5 text-gray-400" />
								<span class="text-xs text-gray-600">Server Ping</span>
							</div>
							<div class="flex items-center gap-1.5">
								{#if pingStatus === 'testing'}
									<RefreshCw class="h-3 w-3 text-gray-400 animate-spin" />
								{:else if pingStatus === 'ok'}
									<span class={cn(
										'rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700'
									)}>
										{pingRoundTripMs}ms{pingWriteOk ? ' · W' : ''}
									</span>
								{:else if pingStatus === 'fail'}
									<span class="rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700">
										{pingError || 'Failed'}
									</span>
								{/if}
								<button
									onclick={pingServer}
									disabled={pingStatus === 'testing'}
									class="rounded px-1.5 py-0.5 text-[9px] font-bold text-gray-500 hover:text-accent hover:bg-gray-100 transition-colors disabled:opacity-50"
									style="min-height: unset"
								>
									Ping
								</button>
							</div>
						</div>

						<!-- SSE Stream (only shown for thin clients using SSE/API mode) -->
						{#if usesSse}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Rss class="h-3.5 w-3.5 text-gray-400" />
									<span class="text-xs text-gray-600">Data Stream (SSE)</span>
								</div>
								<span class={cn(
									'rounded-full px-2 py-0.5 text-[10px] font-bold',
									sseState === 'connected'
										? 'bg-emerald-100 text-emerald-700'
										: sseState === 'reconnecting'
											? 'bg-amber-100 text-amber-700'
											: 'bg-red-100 text-red-700'
								)}>
									{sseState === 'connected' ? 'Connected' : sseState === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}
								</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Divider -->
				<div class="border-t border-gray-100"></div>

				<!-- ─── Data Sync ─────────────────────────────────────── -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data Sync</h4>
						<button
							onclick={() => checkSync()}
							class="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-accent transition-colors"
							style="min-height: unset"
						>
							<RefreshCw class="h-3 w-3" />
							Refresh
						</button>
					</div>

					<!-- Overall status -->
					<div class={cn(
						'flex items-center justify-between rounded-lg px-3 py-2 mb-2',
						syncInfo.status === 'synced' ? 'bg-emerald-50' :
						syncInfo.status === 'checking' ? 'bg-gray-50' :
						syncInfo.status === 'unreachable' ? 'bg-red-50' :
						'bg-amber-50'
					)}>
						<div>
							<p class={cn(
								'text-xs font-bold',
								syncInfo.status === 'synced' ? 'text-emerald-700' :
								syncInfo.status === 'checking' ? 'text-gray-600' :
								syncInfo.status === 'unreachable' ? 'text-red-700' :
								'text-amber-700'
							)}>
								{syncInfo.status === 'synced' ? 'All data synced' :
								 syncInfo.status === 'checking' ? 'Checking...' :
								 syncInfo.status === 'unreachable' ? 'Server unreachable' :
								 syncInfo.status === 'behind' ? 'Missing data from server' :
								 'Extra local data'}
							</p>
							<p class="text-[10px] text-gray-500">
								{syncInfo.localTotal.toLocaleString()} local / {syncInfo.serverTotal.toLocaleString()} server
							</p>
						</div>
						{#if syncInfo.status === 'synced'}
							<span class="text-[10px] font-medium text-emerald-600">{syncedCount}/{totalCollections}</span>
						{:else if syncInfo.status === 'behind' || syncInfo.status === 'ahead'}
							<span class="text-[10px] font-medium text-amber-600">
								{syncInfo.collections.filter(c => c.status !== 'synced').length} out of sync
							</span>
						{/if}
					</div>

					<!-- Checked at -->
					{#if syncInfo.checkedAt}
						<p class="text-[10px] text-gray-400 mb-2">
							Last checked: {formatTimeSince(syncInfo.checkedAt)}
						</p>
					{/if}

					<!-- Collection detail toggle -->
					<button
						onclick={() => showCollectionDetail = !showCollectionDetail}
						class="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
						style="min-height: unset"
					>
						<span>{showCollectionDetail ? 'Hide' : 'Show'} collection details</span>
						{#if showCollectionDetail}
							<ChevronUp class="h-3.5 w-3.5" />
						{:else}
							<ChevronDown class="h-3.5 w-3.5" />
						{/if}
					</button>

					<!-- Collection breakdown -->
					{#if showCollectionDetail && syncInfo.collections.length > 0}
						<div class="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-100">
							<table class="w-full text-[10px]">
								<thead>
									<tr class="border-b border-gray-100 bg-gray-50">
										<th class="px-2 py-1.5 text-left font-bold text-gray-500 uppercase">Collection</th>
										<th class="px-2 py-1.5 text-right font-bold text-gray-500 uppercase">Local</th>
										<th class="px-2 py-1.5 text-right font-bold text-gray-500 uppercase">Server</th>
										<th class="px-2 py-1.5 text-center font-bold text-gray-500 uppercase">Status</th>
									</tr>
								</thead>
								<tbody>
									{#each syncInfo.collections as col}
										<tr class="border-b border-gray-50 last:border-0">
											<td class="px-2 py-1.5 font-mono text-gray-700 capitalize">{formatCollectionName(col.name)}</td>
											<td class="px-2 py-1.5 text-right font-mono text-gray-600">{col.local}</td>
											<td class="px-2 py-1.5 text-right font-mono text-gray-600">{col.server}</td>
											<td class="px-2 py-1.5 text-center">
												{#if col.status === 'synced'}
													<span class="inline-block h-2 w-2 rounded-full bg-status-green"></span>
												{:else if col.status === 'behind'}
													<span class="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
												{:else}
													<span class="inline-block h-2 w-2 rounded-full bg-status-red"></span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>

				<!-- ─── Connected Clients (server only) ────────────── -->
				{#if identity.isServer}
					<div class="border-t border-gray-100"></div>
					<div>
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-1.5">
								<h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connected Devices</h4>
								{#if activeClients.length > 0}
									<span class="rounded-full bg-accent-light text-accent px-1.5 py-0.5 text-[9px] font-bold">{activeClients.length}</span>
								{/if}
							</div>
							<button
								onclick={() => { showClients = !showClients; if (showClients) fetchClients(); }}
								class="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-accent transition-colors"
								style="min-height: unset"
							>
								{#if clientsLoading}
									<RefreshCw class="h-3 w-3 animate-spin" />
								{:else}
									<Users class="h-3 w-3" />
								{/if}
								{showClients ? 'Hide' : 'Show'}
							</button>
						</div>

						{#if showClients}
							{#if connectedClients.length === 0}
								<p class="text-[10px] text-gray-400 italic">No client devices connected</p>
							{:else}
								<div class="flex flex-col gap-1.5">
									{#each connectedClients as client}
										<div class={cn(
											'flex items-center justify-between rounded-lg px-2.5 py-2 border',
											client.isActive
												? 'bg-white border-gray-150'
												: 'bg-gray-50 border-gray-100 opacity-60'
										)}>
											<div class="flex items-center gap-2 min-w-0">
												<!-- Device icon + activity dot -->
												<div class="relative shrink-0">
													{#if client.deviceHint?.includes('iPad') || client.deviceHint?.includes('Tablet')}
														<Tablet class="h-3.5 w-3.5 text-gray-400" />
													{:else if client.deviceHint?.includes('Desktop') || client.deviceHint?.includes('Mac')}
														<Monitor class="h-3.5 w-3.5 text-gray-400" />
													{:else}
														<Smartphone class="h-3.5 w-3.5 text-gray-400" />
													{/if}
													<span class={cn(
														'absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-white',
														client.isActive ? 'bg-status-green' : 'bg-gray-300'
													)}></span>
												</div>
												<!-- Info -->
												<div class="min-w-0">
													<p class="text-[11px] font-bold text-gray-800 truncate">
														{client.deviceName || client.userName || client.deviceHint || client.ip}
													</p>
													<p class="text-[9px] text-gray-400 truncate">
														{client.role || '—'}
														{#if client.locationId}
															· {client.locationId}
														{/if}
														{#if client.currentRoute}
															· <span class="font-mono">{client.currentRoute}</span>
														{/if}
													</p>
												</div>
											</div>
											<!-- Right side: IP + sync -->
											<div class="flex flex-col items-end shrink-0 ml-2">
												<span class="text-[9px] font-mono text-gray-400">{client.ip}</span>
												{#if client.lastSyncAt}
													<span class="text-[8px] text-gray-300">sync {formatTimeSince(new Date(client.lastSyncAt))}</span>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				{/if}

				<!-- Divider -->
				<div class="border-t border-gray-100"></div>

				<!-- ─── Device Info ────────────────────────────────────── -->
				<div class="flex items-center justify-between text-[10px] text-gray-400">
					<span>v{APP_VERSION} · {BUILD_DATE}</span>
					<span class="font-mono">{deviceId ? deviceId.slice(0, 12) : '—'}</span>
				</div>

				<!-- ─── Admin Dev Controls ────────────────────────────── -->
				{#if isAdmin && import.meta.env.DEV}
					<div class="border-t border-gray-100 pt-3">
						<h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dev Simulation</h4>
						<div class="flex flex-col gap-2">
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-600">Network</span>
								<div class="flex gap-1">
									<button
										onclick={simulateOnline}
										class={cn('rounded px-2 py-0.5 text-[10px] font-bold', connectionState.connectivityTier === 'full' ? 'bg-status-green text-white' : 'bg-gray-200 text-gray-600')}
										style="min-height: unset"
									>
										Full
									</button>
									<button
										onclick={simulateLanOnly}
										class={cn('rounded px-2 py-0.5 text-[10px] font-bold', connectionState.connectivityTier === 'lan' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600')}
										style="min-height: unset"
									>
										LAN
									</button>
									<button
										onclick={simulateOffline}
										class={cn('rounded px-2 py-0.5 text-[10px] font-bold', connectionState.connectivityTier === 'offline' ? 'bg-status-red text-white' : 'bg-gray-200 text-gray-600')}
										style="min-height: unset"
									>
										Off
									</button>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-600">KDS</span>
								<button
									onclick={() => connectionState.kdsReachable ? simulateKdsDown() : simulateKdsUp()}
									class={cn('rounded px-2 py-0.5 text-[10px] font-bold', connectionState.kdsReachable ? 'bg-status-green text-white' : 'bg-status-red text-white')}
									style="min-height: unset"
								>
									{connectionState.kdsReachable ? 'Reachable' : 'Down'}
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}
