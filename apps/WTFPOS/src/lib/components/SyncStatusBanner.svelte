<script lang="ts">
	import '$lib/stores/session.svelte';
	import { getDb } from '$lib/db';
	import { invalidateFingerprintCache } from '$lib/stores/device.svelte';
	import { resetDatabase } from '$lib/db';
	import { needsRxDb } from '$lib/stores/data-mode.svelte';
	import { RefreshCw, AlertTriangle, CheckCircle, XCircle, WifiOff, Clock, Loader2, Upload } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';

	// ─── All replicated collections (must match replication.ts) ────────────────
	const ALL_COLLECTIONS = [
		'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
		'stock_events', 'deductions', 'expenses', 'stock_counts', 'devices',
		'kds_tickets', 'readings', 'audit_logs',
		'floor_elements'
	];

	// Thin clients (memory storage) only sync priority collections — don't count the rest as "missing"
	const isRemoteClient = browser
		&& window.location.hostname !== 'localhost'
		&& window.location.hostname !== '127.0.0.1';
	const PRIORITY_COLLECTIONS = ['tables', 'orders', 'menu_items', 'floor_elements', 'kds_tickets', 'devices'];
	const ACTIVE_COLLECTIONS = isRemoteClient ? PRIORITY_COLLECTIONS : ALL_COLLECTIONS;

	interface CollectionDiff {
		name: string;
		local: number;
		server: number;
	}

	// ─── Sync verification state ────────────────────────────────────────────────

	let syncState: {
		status: 'checking' | 'live' | 'behind' | 'ahead' | 'stale' | 'offline';
		localTotal: number;
		serverTotal: number;
		missing: number;
		extra: number;
		details: CollectionDiff[];
		reason: string;
		checkedAt: Date | null;
	} = $state({
		status: 'checking',
		localTotal: 0,
		serverTotal: 0,
		missing: 0,
		extra: 0,
		details: [],
		reason: '',
		checkedAt: null
	});

	// ─── Background sync activity tracking ──────────────────────────────────────

	let bgSyncActive = $state(false);
	let bgSyncCollections: string[] = $state([]);
	let bgSyncInitialDone = $state(false);
	let bgPrioritySyncDone = $state(false);
	let unsubActivity: (() => void) | null = null;

	// Grace period: don't show "ahead" banner until 30s after initial sync completes
	const AHEAD_GRACE_PERIOD_MS = 30_000;
	let aheadFirstDetectedAt: number | null = $state(null);
	let aheadGraceExpired = $state(false);

	// ─── UI state ───────────────────────────────────────────────────────────────

	let syncing = $state(false);
	let syncStatus = $state('');
	let syncResult: { success: boolean; message: string } | null = $state(null);
	let dismissed = $state(false);
	let showStaleDetail = $state(false);
	let checkInterval: ReturnType<typeof setInterval> | null = null;

	// ─── Direct verification against server ─────────────────────────────────────

	async function fetchServerCounts(): Promise<Record<string, number> | null> {
		try {
			const res = await fetch(`${window.location.origin}/api/replication/status`, {
				signal: AbortSignal.timeout(5000)
			});
			if (!res.ok) return null;
			const data = await res.json();
			return data.counts ?? null;
		} catch {
			return null;
		}
	}

	async function countLocalDocs(): Promise<Record<string, number>> {
		if (!needsRxDb()) return Object.fromEntries(ACTIVE_COLLECTIONS.map(n => [n, 0]));
		const db = await getDb();
		const counts: Record<string, number> = {};
		for (const name of ACTIVE_COLLECTIONS) {
			try {
				const col = (db as any).collections?.[name] ?? (db as any)[name];
				if (!col) { counts[name] = 0; continue; }
				counts[name] = await col.count().exec();
			} catch {
				counts[name] = 0;
			}
		}
		return counts;
	}

	async function verify() {
		if (!browser) return;
		if (!needsRxDb()) return; // No local DB — nothing to verify

		const serverCounts = await fetchServerCounts();

		if (!serverCounts) {
			syncState = {
				status: 'stale',
				localTotal: syncState.localTotal,
				serverTotal: syncState.serverTotal,
				missing: 0,
				extra: 0,
				details: [],
				reason: 'Cannot reach the server. Check your WiFi connection.',
				checkedAt: new Date()
			};
			return;
		}

		const localCounts = await countLocalDocs();

		let serverTotal = 0;
		let localTotal = 0;
		const behindList: CollectionDiff[] = [];
		const aheadList: CollectionDiff[] = [];

		for (const name of ACTIVE_COLLECTIONS) {
			const s = serverCounts[name] ?? 0;
			const l = localCounts[name] ?? 0;
			serverTotal += s;
			localTotal += l;

			if (s > l + 2) {
				behindList.push({ name, local: l, server: s });
			} else if (l > s + 2) {
				aheadList.push({ name, local: l, server: s });
			}
		}

		const now = new Date();
		const totalDiff = Math.abs(serverTotal - localTotal);
		const tolerance = Math.max(10, Math.ceil(Math.max(serverTotal, localTotal) * 0.01));

		if (totalDiff <= tolerance && behindList.length === 0 && aheadList.length === 0) {
			syncState = { status: 'live', localTotal, serverTotal, missing: 0, extra: 0, details: [], reason: '', checkedAt: now };
			if (dismissed) dismissed = false;
			syncResult = null;
			// Reset grace period when sync is healthy
			aheadFirstDetectedAt = null;
			aheadGraceExpired = false;
		} else if (localTotal < serverTotal && behindList.length > 0) {
			const missing = behindList.reduce((sum, d) => sum + (d.server - d.local), 0);
			syncState = { status: 'behind', localTotal, serverTotal, missing, extra: 0, details: behindList, reason: '', checkedAt: now };
		} else if (localTotal > serverTotal && aheadList.length > 0) {
			const extra = aheadList.reduce((sum, d) => sum + (d.local - d.server), 0);

			// During initial sync or grace period, keep status as 'checking' — replication
			// will push the local data to the server automatically
			if (!bgSyncInitialDone) {
				// Initial sync still in progress — don't panic yet
				syncState = { status: 'checking', localTotal, serverTotal, missing: 0, extra, details: aheadList, reason: '', checkedAt: now };
			} else {
				// Track when we first detected "ahead" after sync completed
				if (aheadFirstDetectedAt === null) {
					aheadFirstDetectedAt = Date.now();
				}
				// Check if grace period has expired
				const elapsed = Date.now() - aheadFirstDetectedAt;
				if (elapsed >= AHEAD_GRACE_PERIOD_MS) {
					aheadGraceExpired = true;
					syncState = { status: 'ahead', localTotal, serverTotal, missing: 0, extra, details: aheadList, reason: '', checkedAt: now };
				} else {
					// Still within grace period — show as checking
					syncState = { status: 'checking', localTotal, serverTotal, missing: 0, extra, details: aheadList, reason: '', checkedAt: now };
				}
			}
		} else {
			syncState = { status: 'live', localTotal, serverTotal, missing: 0, extra: 0, details: [], reason: '', checkedAt: now };
			if (dismissed) dismissed = false;
			syncResult = null;
			aheadFirstDetectedAt = null;
			aheadGraceExpired = false;
		}
	}

	onMount(async () => {
		// Subscribe to background replication activity
		try {
			const { subscribeSyncActivity } = await import('$lib/db/replication');
			unsubActivity = subscribeSyncActivity((activity) => {
				bgSyncActive = activity.active;
				bgSyncCollections = activity.activeCollections;
				bgSyncInitialDone = activity.initialSyncDone;
				bgPrioritySyncDone = activity.prioritySyncDone;

				// When initial sync just completed, re-verify
				if (activity.initialSyncDone && syncState.status === 'checking') {
					setTimeout(() => verify(), 1000);
				}
			});
		} catch {
			// replication module might not be loaded yet
		}

		// Initial check after a longer delay (let replication push seed data first)
		setTimeout(() => verify(), 8000);
		// Re-verify every 60 seconds
		checkInterval = setInterval(() => verify(), 60_000);
	});

	onDestroy(() => {
		if (checkInterval) clearInterval(checkInterval);
		if (unsubActivity) unsubActivity();
	});

	// ─── Sync actions ───────────────────────────────────────────────────────────

	async function handleSyncBehind() {
		syncing = true;
		syncStatus = 'Starting sync...';
		syncResult = null;
		dismissed = false;
		try {
			const { forceFullSync } = await import('$lib/db/replication');
			const result = await forceFullSync((status) => {
				syncStatus = status;
			});
			invalidateFingerprintCache();
			syncResult = result;

			syncStatus = 'Verifying...';
			await new Promise(r => setTimeout(r, 2000));
			invalidateFingerprintCache();
			await verify();

			if (syncState.status === 'live') {
				syncResult = { success: true, message: 'All records synced successfully' };
				setTimeout(() => { dismissed = true; syncResult = null; }, 8000);
			} else if (syncState.status === 'behind') {
				syncResult = { success: false, message: `Still missing ${syncState.missing.toLocaleString()} records. Try again or refresh the page.` };
			}
		} catch (err) {
			console.error('[SyncBanner] Full sync failed:', err);
			syncResult = { success: false, message: 'Sync failed. Try refreshing the page.' };
		} finally {
			syncing = false;
			syncStatus = '';
		}
	}

	async function handleForceSyncAhead() {
		syncing = true;
		syncStatus = 'Pushing local data to server...';
		syncResult = null;
		dismissed = false;
		try {
			const { forceFullSync } = await import('$lib/db/replication');
			const result = await forceFullSync((status) => {
				syncStatus = status;
			});
			invalidateFingerprintCache();
			syncResult = result;

			syncStatus = 'Verifying...';
			await new Promise(r => setTimeout(r, 2000));
			invalidateFingerprintCache();
			await verify();

			if (syncState.status === 'live') {
				syncResult = { success: true, message: 'All local data pushed to server successfully' };
				setTimeout(() => { dismissed = true; syncResult = null; }, 8000);
			} else if (syncState.status === 'ahead') {
				syncResult = { success: false, message: `Still ${syncState.extra.toLocaleString()} extra records. You may need to reset this device.` };
			}
		} catch (err) {
			console.error('[SyncBanner] Force sync failed:', err);
			syncResult = { success: false, message: 'Sync failed. Try refreshing the page.' };
		} finally {
			syncing = false;
			syncStatus = '';
		}
	}

	async function handleResetAhead() {
		const ok = confirm(
			`This device has extra records the server doesn't have.\n\n` +
			`If any are real orders, they will be LOST.\n\n` +
			`This will clear all data on THIS device and reload fresh. Continue?`
		);
		if (!ok) return;
		syncing = true;
		syncStatus = 'Resetting device...';
		await resetDatabase();
	}

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
</script>

<!-- Non-RxDB devices have no local DB to sync — hide entirely -->
{#if needsRxDb()}
<!-- ============================================================ -->
<!-- Priority 1: Force sync in progress (user triggered) -->
<!-- ============================================================ -->
{#if syncing}
	<div class="relative z-50 border-b-2 border-blue-300 bg-blue-50 px-4 py-3 sm:px-6">
		<div class="mx-auto flex max-w-5xl flex-row items-center gap-3">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
				<RefreshCw class="h-5 w-5 text-blue-600 animate-spin" />
			</div>
			<div>
				<p class="text-sm font-bold text-blue-900">Syncing with server...</p>
				{#if syncStatus}
					<p class="text-xs text-blue-700">{syncStatus}</p>
				{/if}
			</div>
		</div>
	</div>

<!-- ============================================================ -->
<!-- Priority 2: Sync result (success or failure) -->
<!-- ============================================================ -->
{:else if syncResult && !dismissed}
	<div class="relative z-50 border-b-2 px-4 py-3 sm:px-6 {syncResult.success ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}">
		<div class="mx-auto flex max-w-5xl flex-row items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {syncResult.success ? 'bg-emerald-100' : 'bg-red-100'}">
					{#if syncResult.success}
						<CheckCircle class="h-5 w-5 text-emerald-600" />
					{:else}
						<XCircle class="h-5 w-5 text-red-600" />
					{/if}
				</div>
				<div>
					<p class="text-sm font-bold {syncResult.success ? 'text-emerald-900' : 'text-red-900'}">
						{syncResult.success ? 'Sync complete' : 'Sync incomplete'}
					</p>
					<p class="text-xs {syncResult.success ? 'text-emerald-700' : 'text-red-700'}">
						{syncResult.message}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if !syncResult.success}
					<button
						onclick={handleSyncBehind}
						class="text-xs font-bold text-red-700 hover:text-red-900 underline"
					>
						Retry
					</button>
				{/if}
				<button
					onclick={() => { dismissed = true; syncResult = null; }}
					class="text-xs font-bold {syncResult.success ? 'text-emerald-700 hover:text-emerald-900' : 'text-red-700 hover:text-red-900'}"
				>
					Dismiss
				</button>
			</div>
		</div>
	</div>

<!-- ============================================================ -->
<!-- Priority 3: Background sync active (on page load / reconnect) -->
<!-- ============================================================ -->
{:else if bgSyncActive && !bgSyncInitialDone}
	<div class="relative z-50 border-b border-indigo-200 bg-indigo-50 px-4 py-2.5 sm:px-6">
		<div class="mx-auto flex max-w-5xl flex-row items-center gap-3">
			<Loader2 class="h-4 w-4 text-indigo-500 animate-spin shrink-0" />
			<div class="flex items-center gap-2">
				<p class="text-xs font-bold text-indigo-800">
					{bgPrioritySyncDone ? 'Core data loaded, syncing history...' : 'Syncing data with server'}
				</p>
				{#if bgSyncCollections.length > 0 && bgSyncCollections.length <= 3}
					<span class="text-[10px] text-indigo-500">
						({bgSyncCollections.map(formatCollectionName).join(', ')})
					</span>
				{:else if bgSyncCollections.length > 3}
					<span class="text-[10px] text-indigo-500">
						({bgSyncCollections.length} collections)
					</span>
				{/if}
			</div>
		</div>
	</div>

<!-- ============================================================ -->
<!-- Priority 4: Behind — device is missing data -->
<!-- ============================================================ -->
{:else if syncState.status === 'behind' && !dismissed}
	<div class="relative z-50 border-b-2 border-amber-300 bg-amber-50 px-4 py-3 sm:px-6">
		<div class="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
					<AlertTriangle class="h-5 w-5 text-amber-600" />
				</div>
				<div>
					<p class="text-sm font-bold text-amber-900">This device is missing data</p>
					<p class="mt-0.5 text-xs text-amber-700 leading-relaxed max-w-xl">
						Missing {syncState.missing.toLocaleString()} records across {syncState.details.length} collection{syncState.details.length !== 1 ? 's' : ''}.
						This device has {syncState.localTotal.toLocaleString()} / {syncState.serverTotal.toLocaleString()} records.
					</p>
					<p class="mt-0.5 text-[10px] text-amber-500">
						Verified {formatTimeSince(syncState.checkedAt)}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={handleSyncBehind}
					class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-700"
				>
					<RefreshCw class="h-4 w-4" />
					Sync Now
				</button>
				<button
					onclick={() => dismissed = true}
					class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
				>
					Later
				</button>
			</div>
		</div>
	</div>

<!-- ============================================================ -->
<!-- Priority 5: Ahead — device has extra data (blue/informational) -->
<!-- ============================================================ -->
{:else if syncState.status === 'ahead' && !dismissed}
	<div class="relative z-50 border-b-2 border-blue-300 bg-blue-50 px-4 py-3 sm:px-6">
		<div class="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
					<Upload class="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<p class="text-sm font-bold text-blue-900">Pushing local data to server...</p>
					<p class="mt-0.5 text-xs text-blue-700 leading-relaxed max-w-xl">
						This device has {syncState.extra.toLocaleString()} records the server doesn't have yet.
						They should sync automatically, or you can force it.
					</p>
					<p class="mt-0.5 text-[10px] text-blue-500">
						Verified {formatTimeSince(syncState.checkedAt)}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={handleForceSyncAhead}
					class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
				>
					<RefreshCw class="h-4 w-4" />
					Force Sync
				</button>
				<button
					onclick={handleResetAhead}
					class="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
				>
					Reset device
				</button>
				<button
					onclick={() => dismissed = true}
					class="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
				>
					Later
				</button>
			</div>
		</div>
	</div>

<!-- ============================================================ -->
<!-- Priority 6: Stale/Offline — subtle pill in corner -->
<!-- ============================================================ -->
{:else if syncState.status === 'stale' || syncState.status === 'offline'}
	<button
		onclick={() => showStaleDetail = !showStaleDetail}
		class="fixed top-2 right-2 z-50 flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50 fixed-safe-top fixed-safe-right"
	>
		{#if syncState.status === 'offline'}
			<WifiOff class="h-3.5 w-3.5 text-red-500" />
			<span class="text-[10px] font-bold text-red-600">Offline</span>
		{:else}
			<Clock class="h-3.5 w-3.5 text-gray-400" />
			<span class="text-[10px] font-bold text-gray-500">Stale</span>
		{/if}
	</button>

	{#if showStaleDetail}
		<div class="fixed top-10 right-2 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg fixed-safe-right">
			<div class="flex items-start gap-2">
				{#if syncState.status === 'offline'}
					<WifiOff class="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
					<div>
						<p class="text-xs font-bold text-gray-900">Server unreachable</p>
						<p class="mt-1 text-[11px] text-gray-500 leading-relaxed">{syncState.reason}</p>
						{#if syncState.checkedAt}
							<p class="mt-1 text-[10px] text-gray-400">Last attempt: {formatTimeSince(syncState.checkedAt)}</p>
						{/if}
					</div>
				{:else}
					<Clock class="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p class="text-xs font-bold text-gray-900">Sync status is stale</p>
						<p class="mt-1 text-[11px] text-gray-500 leading-relaxed">{syncState.reason}</p>
						{#if syncState.checkedAt}
							<p class="mt-1 text-[10px] text-gray-400">Last checked: {formatTimeSince(syncState.checkedAt)}</p>
						{/if}
					</div>
				{/if}
			</div>
			<button
				onclick={() => { showStaleDetail = false; verify(); }}
				class="mt-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
			>
				Check now
			</button>
		</div>
	{/if}
{/if}
{/if}
