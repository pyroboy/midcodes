<script lang="ts">
	import { page } from '$app/state';
	import { session, LOCATIONS, getCurrentLocation, ELEVATED_ROLES, ADMIN_ROLES } from '$lib/stores/session.svelte';
	import { connectionState, dismissKdsAlert, simulateOffline, simulateOnline, simulateLanOnly, simulateKdsDown, simulateKdsUp } from '$lib/stores/connection.svelte';
	import { getCurrentDeviceId } from '$lib/stores/device.svelte';
	import { isSseMode, isApiFetchMode, needsRxDb } from '$lib/stores/data-mode.svelte';
	import { getSseConnectionState } from '$lib/stores/server-store.svelte';
	import { APP_VERSION, BUILD_DATE } from '$lib/version';
	import { cn } from '$lib/utils';
	import { guardEvents, markAllSeen, clearGuardEvents, type GuardEvent } from '$lib/stores/guard.svelte';
	import { MapPin, ArrowDownUp, Wifi, WifiOff, Radio, Server, Smartphone, RefreshCw, ChevronDown, ChevronUp, X, Rss, Users, Monitor, Tablet, ShieldAlert, Trash2 } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import LocationSelectorModal from './stock/LocationSelectorModal.svelte';

	// ─── Location state ──────────────────────────────────────────────────────
	let isModalOpen = $state(false);

	const currentLocation = $derived(getCurrentLocation());

	const BANNER_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
		'tag':    { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-900',    iconBg: 'bg-blue-100/50' },
		'pgl':    { bg: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-900',  iconBg: 'bg-violet-100/50' },
		'wh-tag': { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-900',   iconBg: 'bg-amber-100/50' },
		'all':    { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-900', iconBg: 'bg-emerald-100/50' },
	};

	const colors = $derived(BANNER_COLORS[session.locationId] ?? BANNER_COLORS['tag']);

	const currentSection = $derived(page.url.pathname.split('/')[1] || '');

	const accessLevel = $derived.by(() => {
		const role = session.role;
		if (ADMIN_ROLES.includes(role)) return 'Full Control';
		if (role === 'manager') return 'Branch Control';
		if (role === 'staff' && currentSection === 'pos') return 'Cashier';
		if (role === 'kitchen' && currentSection === 'kitchen') return 'Kitchen Ops';
		if (role === 'kitchen' && currentSection === 'stock') return 'View Only';
		return 'View Only';
	});

	const canChangeLocation = $derived(!session.isLocked && ELEVATED_ROLES.includes(session.role));

	const locationTypeLabel = $derived(
		session.locationId === 'wh-tag' ? 'Warehouse' :
		session.locationId === 'all' ? 'Global' : 'Retail'
	);

	const locationTypeBadgeClass = $derived(
		session.locationId === 'wh-tag' ? 'bg-amber-500/20 text-amber-900' :
		session.locationId === 'all' ? 'bg-emerald-500/20 text-emerald-900' :
		'bg-gray-500/10 text-gray-700'
	);

	const isAuthenticated = $derived(!!session.userName);

	// ─── Connection / Live pill state ────────────────────────────────────────
	const isAdmin = $derived(session.role === 'owner' || session.role === 'admin');
	const isLoggedIn = $derived(!!session.userName);
	const usesSse = $derived(isSseMode() || isApiFetchMode());
	const sseState = $derived(usesSse ? getSseConnectionState() : 'disconnected');
	let showPanel = $state(false);
	let showCollectionDetail = $state(false);
	let showGuardLog = $state(false);

	const guardCount = $derived(guardEvents.unseenCount);
	const hasGuardEvents = $derived(guardEvents.value.length > 0);

	const tierLabel = $derived(
		connectionState.connectivityTier === 'full' ? 'Online' :
		connectionState.connectivityTier === 'lan' ? 'LAN Only' :
		'Offline'
	);

	// ─── Device identity (self-fetched with retry) ─────────────────────────
	let identity = $state({ ipAddress: '', isServer: false, serverLanIp: '' });
	const deviceId = $derived(getCurrentDeviceId());

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
		'stock_events', 'deductions', 'expenses', 'stock_counts', 'devices',
		'kds_tickets', 'readings', 'audit_logs',
		'floor_elements', 'shifts'
	];

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
		checksumMismatches: string[];
	}>({
		status: 'checking',
		localTotal: 0,
		serverTotal: 0,
		collections: [],
		checkedAt: null,
		serverHostname: '',
		checksumMismatches: []
	});

	let checkInterval: ReturnType<typeof setInterval> | null = null;

	async function checkSync() {
		if (!browser) return;
		if (!needsRxDb()) return;

		try {
			const [statusRes, identifyRes] = await Promise.all([
				fetch('/api/replication/status', { signal: AbortSignal.timeout(5000) }).catch(() => null),
				fetch('/api/device/identify', { signal: AbortSignal.timeout(5000) }).catch(() => null)
			]);

			let hostname = syncInfo.serverHostname;
			if (identifyRes?.ok) {
				try {
					const identifyData = await identifyRes.json();
					hostname = identifyData.serverHostname || '';
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

			// Checksum verification — runs on both server and client devices
			let checksumMismatches: string[] = [];
			try {
				const checksumRes = await fetch('/api/replication/status?checksums=1', {
					signal: AbortSignal.timeout(10_000)
				}).catch(() => null);
				if (checksumRes?.ok) {
					const checksumData = await checksumRes.json();
					const serverChecksums: Record<string, number> = checksumData.checksums ?? {};
					const { computeLocalChecksum } = await import('$lib/utils/sync-checksum');
					// Clients check fewer collections to keep it lightweight
					const CHECKSUM_COLLECTIONS = isRemoteClient
						? ['tables', 'orders', 'kds_tickets']
						: ['tables', 'orders', 'kds_tickets', 'shifts'];
					for (const name of CHECKSUM_COLLECTIONS) {
						const serverCs = serverChecksums[name];
						if (serverCs === undefined) continue;
						const localCs = await computeLocalChecksum(db, name);
						if (localCs !== serverCs) checksumMismatches.push(name);
					}
				}
			} catch { /* checksum verification is best-effort */ }

			syncInfo = {
				status: overallStatus,
				localTotal,
				serverTotal,
				collections,
				checkedAt: new Date(),
				serverHostname: hostname,
				checksumMismatches
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
		fetchIdentity();
		setTimeout(() => checkSync(), 3000);
		checkInterval = setInterval(() => checkSync(), 60_000);
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

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- StatusBar: Location banner (left) + Live pill (right) in one row      -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
{#if isAuthenticated}
<div class={cn('sticky top-0 z-30 relative w-full border-b px-4 sm:px-6 shadow-sm flex items-center justify-between gap-3 h-10 transition-colors safe-x', colors.bg, colors.border)}>
	<!-- Left: Location info -->
	<div class="flex items-center gap-2.5 min-w-0">
		<MapPin class={cn('h-4 w-4 shrink-0', colors.text)} />
		<h2 class={cn('text-base font-black tracking-tight truncate', colors.text)}>
			{currentLocation?.name?.toUpperCase() ?? 'UNKNOWN LOCATION'}
		</h2>
		{#if canChangeLocation}
		<button
			data-testid="location-change-btn"
			onclick={() => isModalOpen = true}
			class="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 shrink-0"
			style="min-height: unset"
		>
			<ArrowDownUp class="h-3.5 w-3.5" />
			<span class="hidden sm:inline">Change Location</span>
		</button>
		{/if}
	</div>

	<!-- Right: Live pill -->
	<button
		onclick={() => { showPanel = !showPanel; if (showPanel) { checkSync(); markAllSeen(); } }}
		class={cn(
			'relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-md transition-all active:scale-95 shrink-0',
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
		{#if guardCount > 0}
			<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-red text-[8px] font-black text-white ring-2 ring-white animate-pulse">
				{guardCount > 9 ? '9+' : guardCount}
			</span>
		{/if}
	</button>

	<!-- ─── Live Status Panel (absolute, anchored to bar) ──────────────── -->
	{#if showPanel}
		<!-- Backdrop -->
		<button
			class="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
			onclick={() => showPanel = false}
			aria-label="Close status panel"
		></button>

		<div class="absolute z-50 w-80 rounded-2xl border border-border bg-white shadow-2xl overflow-hidden right-4" style="top: 100%">
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

			<div class="px-4 py-3 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
				<!-- ─── Connection Info ────────────────────────────────── -->
				<div>
					<h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Connection</h4>
					<div class="flex flex-col gap-1.5">
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
						<div class="flex items-center justify-between pl-5">
							<span class="text-xs text-gray-500">IP address</span>
							<span class="text-xs font-mono font-medium text-gray-900">
								{identity.ipAddress || 'detecting...'}
							</span>
						</div>
						{#if !identity.isServer && identity.serverLanIp}
							<div class="flex items-center justify-between pl-5">
								<span class="text-xs text-gray-500">Server IP</span>
								<span class="text-xs font-mono font-medium text-gray-900">
									{identity.serverLanIp}
								</span>
							</div>
						{/if}
						<div class="flex items-center justify-between pl-5">
							<span class="text-xs text-gray-500">Hostname</span>
							<span class="text-xs font-mono font-medium text-gray-900 truncate max-w-[140px]">
								{syncInfo.serverHostname || 'detecting...'}
							</span>
						</div>
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

					{#if syncInfo.checkedAt}
						<p class="text-[10px] text-gray-400 mb-2">
							Last checked: {formatTimeSince(syncInfo.checkedAt)}
						</p>
					{/if}

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

					{#if syncInfo.checksumMismatches.length === 0}
						<div class="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 mt-2">
							<span class="flex h-5 w-5 items-center justify-center rounded-full bg-status-green text-white text-[10px] font-black shrink-0">&#10003;</span>
							<div>
								<span class="text-xs font-bold text-emerald-800">Integrity Verified</span>
								<p class="text-[10px] text-emerald-600">All critical collections match server</p>
							</div>
						</div>
					{:else}
						<div class="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 mt-2">
							<span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black shrink-0">!</span>
							<div>
								<span class="text-xs font-bold text-amber-800">{syncInfo.checksumMismatches.length} collection{syncInfo.checksumMismatches.length !== 1 ? 's' : ''} diverged</span>
								<p class="text-[10px] text-amber-600 font-medium">{syncInfo.checksumMismatches.join(', ')}</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- ─── Guard Log ─────────────────────────────────── -->
				<div class="border-t border-gray-100"></div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-1.5">
							<h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guard Log</h4>
							{#if guardEvents.value.length > 0}
								<span class={cn(
									'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
									guardCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
								)}>
									{guardEvents.value.length}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-1">
							{#if guardEvents.value.length > 0}
								<button
									onclick={() => clearGuardEvents()}
									class="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-red-500 transition-colors"
									style="min-height: unset"
									title="Clear all guard events"
								>
									<Trash2 class="h-3 w-3" />
								</button>
							{/if}
							<button
								onclick={() => showGuardLog = !showGuardLog}
								class="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-accent transition-colors"
								style="min-height: unset"
							>
								<ShieldAlert class="h-3 w-3" />
								{showGuardLog ? 'Hide' : 'Show'}
							</button>
						</div>
					</div>

					{#if !hasGuardEvents}
						<p class="text-[10px] text-gray-400 italic">No guard events this session</p>
					{:else if showGuardLog}
						<div class="max-h-52 overflow-y-auto rounded-lg border border-gray-100">
							{#each guardEvents.value as event (event.id)}
								{@const layerColor = event.layer === 'replication' ? 'bg-purple-100 text-purple-700'
									: event.layer === 'write-api' ? 'bg-blue-100 text-blue-700'
									: 'bg-amber-100 text-amber-700'}
								{@const typeIcon = event.type === 'duplicate-order' ? '🔁'
									: event.type === 'duplicate-occupancy' ? '🪑'
									: event.type === 'orphan-auto-healed' ? '🧹'
									: event.type === 'stock-negative' ? '📉'
									: event.type === 'table-close-with-open-order' ? '🔒'
									: event.type === 'invalid-order-transition' ? '💳'
									: event.type === 'duplicate-active-shift' ? '💰'
									: event.type === 'duplicate-z-read' ? '📋'
									: '🚫'}
								<div class={cn(
									'border-b border-gray-50 last:border-0 px-2.5 py-2',
									!event.seen && 'bg-red-50/50'
								)}>
									<div class="flex items-start gap-2">
										<span class="text-xs mt-0.5 shrink-0">{typeIcon}</span>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-1.5 flex-wrap">
												<span class={cn('rounded px-1 py-0.5 text-[8px] font-bold uppercase', layerColor)}>
													{event.layer}
												</span>
												<span class="text-[10px] font-bold text-gray-800">{event.tableLabel}</span>
												{#if !event.seen}
													<span class="inline-block h-1.5 w-1.5 rounded-full bg-status-red"></span>
												{/if}
											</div>
											<p class="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{event.reason}</p>
											<div class="flex items-center gap-2 mt-1 text-[9px] text-gray-400">
												<span>{new Date(event.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
												<span>·</span>
												<span>{event.user}</span>
												{#if event.existingOrderId}
													<span>·</span>
													<span class="font-mono">existing:{event.existingOrderId.slice(0, 8)}</span>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<button
							onclick={() => showGuardLog = true}
							class="w-full flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-[11px] text-gray-500 hover:bg-gray-50 transition-colors"
							style="min-height: unset"
						>
							<span class="flex items-center gap-1.5">
								<ShieldAlert class="h-3.5 w-3.5 text-gray-400" />
								{guardEvents.value.length} guard event{guardEvents.value.length !== 1 ? 's' : ''} this session
							</span>
							<ChevronDown class="h-3.5 w-3.5" />
						</button>
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
</div>

{#if isModalOpen}
	<LocationSelectorModal onClose={() => isModalOpen = false} />
{/if}
{/if}
