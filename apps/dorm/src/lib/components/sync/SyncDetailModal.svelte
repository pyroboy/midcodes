<script lang="ts">
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import { mutationQueue } from '$lib/stores/mutation-queue.svelte';
	import {
		resyncAll,
		resyncCollection,
		pauseSync,
		resumeSync,
		reconcile,
		refreshLocalCounts,
		type ResyncResult,
		type ReconcileResult
	} from '$lib/db/replication';
	import { getStorageTrend } from '$lib/db/storage-monitor';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		CheckCircle,
		AlertCircle,
		Loader2,
		RefreshCw,
		Database,
		HardDrive,
		Cloud,
		XCircle,
		Circle,
		Info,
		AlertTriangle,
		ExternalLink,
		Copy,
		Check,
		Trash2,
		RotateCcw,
		ArrowLeft,
		ArrowRight,
		ArrowLeftRight,
		X,
		ChevronDown,
		Pause,
		Play,
		TrendingUp,
		TrendingDown,
		Minus,
		Pencil,
		Plus
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false) } = $props();
	let isResyncing = $state(false);
	let isReconciling = $state(false);
	let lastReconcileResult = $state<ReconcileResult | null>(null);
	// W5: Per-collection retry state
	let resyncingCollections = $state<Set<string>>(new Set());

	async function handleResyncCollection(name: string) {
		resyncingCollections = new Set([...resyncingCollections, name]);
		try {
			const result = await resyncCollection(name);
			const label = collectionLabels[name] || name;
			if (result.status === 'skipped' && result.reason === 'neon_down') {
				toast.error(`Cannot resync ${label} — server is unreachable`);
			} else if (result.status === 'skipped' && result.reason === 'not_started') {
				toast.warning(`${label} sync not started yet — visit its page first`);
			} else {
				toast.success(`${label} resynced`);
			}
		} catch {
			toast.error(`Failed to resync ${collectionLabels[name] || name}`);
		} finally {
			const next = new Set(resyncingCollections);
			next.delete(name);
			resyncingCollections = next;
		}
	}

	const collectionLabels: Record<string, string> = {
		tenants: 'Tenants',
		leases: 'Leases',
		lease_tenants: 'Lease Assignments',
		rental_units: 'Rental Units',
		properties: 'Properties',
		floors: 'Floors',
		meters: 'Meters',
		readings: 'Meter Readings',
		billings: 'Billings',
		payments: 'Payments',
		payment_allocations: 'Payment Allocations',
		expenses: 'Expenses',
		budgets: 'Budgets',
		penalty_configs: 'Penalty Rules',
		floor_layout_items: 'Floor Plan Items'
	};

	const collectionGroups: { label: string; names: string[] }[] = [
		{ label: 'Structure', names: ['properties', 'floors', 'rental_units', 'floor_layout_items'] },
		{ label: 'Tenants & Leases', names: ['tenants', 'leases', 'lease_tenants'] },
		{ label: 'Utilities', names: ['meters', 'readings', 'billings'] },
		{ label: 'Finance', names: ['payments', 'payment_allocations', 'expenses', 'budgets', 'penalty_configs'] }
	];

	function getStatusIcon(status: string) {
		switch (status) {
			case 'synced': return CheckCircle;
			case 'syncing': return Loader2;
			case 'error': return AlertCircle;
			default: return Database;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'synced': return 'text-emerald-500';
			case 'syncing': return 'text-blue-500';
			case 'error': return 'text-red-500';
			default: return 'text-muted-foreground';
		}
	}

	function getBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'synced': return 'secondary';
			case 'syncing': return 'default';
			case 'error': return 'destructive';
			default: return 'outline';
		}
	}

	function getHealthIcon(health: string) {
		switch (health) {
			case 'ok': return CheckCircle;
			case 'checking': return Loader2;
			case 'error': return XCircle;
			default: return Circle;
		}
	}

	function getHealthColor(health: string) {
		switch (health) {
			case 'ok': return 'text-emerald-500';
			case 'checking': return 'text-blue-500';
			case 'error': return 'text-red-500';
			default: return 'text-muted-foreground';
		}
	}

	function getLogIcon(level: string) {
		switch (level) {
			case 'success': return CheckCircle;
			case 'error': return XCircle;
			case 'warn': return AlertTriangle;
			default: return Info;
		}
	}

	function getLogColor(level: string) {
		switch (level) {
			case 'success': return 'text-emerald-500';
			case 'error': return 'text-red-500';
			case 'warn': return 'text-amber-500';
			default: return 'text-muted-foreground';
		}
	}

	// Deduplicated error summary — group by error code
	let errorSummary = $derived.by(() => {
		const errors = syncStatus.collections.filter((c) => c.parsedError);
		const grouped = new Map<string, { code: string | null; summary: string; url: string | null; collections: string[] }>();
		for (const col of errors) {
			const pe = col.parsedError!;
			const key = pe.code || pe.summary;
			if (grouped.has(key)) {
				grouped.get(key)!.collections.push(collectionLabels[col.name] || col.name);
			} else {
				grouped.set(key, {
					code: pe.code,
					summary: pe.summary,
					url: pe.url,
					collections: [collectionLabels[col.name] || col.name]
				});
			}
		}
		return Array.from(grouped.values());
	});

	let errorCollectionsList = $derived(
		syncStatus.collections.filter((c) => c.status === 'error')
	);
	let isRetryingAllFailed = $state(false);

	async function handleRetryAllFailed() {
		isRetryingAllFailed = true;
		try {
			const results = await Promise.all(errorCollectionsList.map((c) => resyncCollection(c.name)));
			const synced = results.filter((r) => r.status === 'ok').length;
			const skipped = results.filter((r) => r.status === 'skipped').length;
			if (skipped === results.length && results[0]?.reason === 'neon_down') {
				toast.error('Cannot retry — server is unreachable');
			} else if (skipped > 0) {
				toast.warning(`Retried ${synced} collection(s), ${skipped} skipped`);
			} else {
				toast.success(`Retried ${synced} failed collection(s)`);
			}
		} catch {
			toast.error('Some retries failed');
		} finally {
			isRetryingAllFailed = false;
		}
	}

	async function handleResyncAll() {
		isResyncing = true;
		try {
			syncStatus.addLog('Manual resync started', 'info');
			const result = await resyncAll();
			if (result.status === 'skipped' && result.reason === 'neon_down') {
				toast.error('Cannot resync — server is unreachable');
			} else if (result.status === 'partial') {
				toast.warning(`Partial resync: ${result.synced} synced, ${result.skipped} skipped`);
			} else {
				toast.success('All collections resynced');
			}
		} catch (err) {
			toast.error('Resync failed');
		} finally {
			isResyncing = false;
		}
	}

	async function handleReconcile() {
		isReconciling = true;
		lastReconcileResult = null;
		try {
			const result = await reconcile();
			lastReconcileResult = result;

			// Refresh Neon counts so the side-by-side display updates post-fix
			await syncStatus.fetchNeonCounts(true, refreshLocalCounts);

			if (result.status === 'skipped') {
				toast.error(result.reason || 'Cannot reconcile');
			} else if (result.status === 'error') {
				toast.error(result.reason || 'Reconciliation failed');
			} else if (result.verified && result.totalOrphansRemoved === 0 && result.totalMissingFetched === 0) {
				toast.success('All collections verified — true mirror of server ✓');
			} else if (result.verified) {
				toast.success(
					`Fixed ${result.totalOrphansRemoved} orphan(s), fetched ${result.totalMissingFetched} missing — verified ✓`
				);
			} else {
				const unverified = result.collections.filter((c) => !c.verified).length;
				toast.warning(
					`Fixed ${result.totalOrphansRemoved} orphan(s), fetched ${result.totalMissingFetched} missing — ${unverified} still mismatched`
				);
			}
		} catch {
			toast.error('Reconciliation failed');
		} finally {
			isReconciling = false;
		}
	}

	function formatTime(iso: string | null) {
		if (!iso) return '—';
		const d = new Date(iso);
		return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	let activeTab = $state<'collections' | 'logs' | 'system'>('collections');
	let copied = $state(false);
	let expandedCollection = $state<string | null>(null);

	// Collapsible groups — track which are manually toggled
	let manualGroupToggles = $state<Record<string, boolean>>({});

	type GroupStatus = {
		state: 'error' | 'syncing' | 'mismatch' | 'synced' | 'idle';
		errorCount: number;
		mismatchCount: number;
		syncingCount: number;
		localTotal: number;
		serverTotal: number | null;
		hasServerCounts: boolean;
	};

	let groupStatuses = $derived.by(() => {
		const map: Record<string, GroupStatus> = {};
		for (const group of collectionGroups) {
			let errorCount = 0;
			let mismatchCount = 0;
			let syncingCount = 0;
			let idleCount = 0;
			let localTotal = 0;
			let serverTotal = 0;
			let hasServerCounts = false;

			for (const name of group.names) {
				const col = syncStatus.collections.find((c) => c.name === name);
				if (!col) continue;
				localTotal += col.docCount;
				const neon = syncStatus.neonCounts?.[name];
				if (neon !== undefined && neon !== null) {
					hasServerCounts = true;
					serverTotal += neon;
				}
				if (col.status === 'error') errorCount++;
				else if (col.status === 'syncing') syncingCount++;
				else if (col.status === 'idle') idleCount++;
				// Check mismatch even for synced collections
				if (col.status === 'synced' && neon !== undefined && neon !== null && col.docCount !== neon) {
					mismatchCount++;
				}
			}

			let state: GroupStatus['state'];
			if (errorCount > 0) state = 'error';
			else if (syncingCount > 0) state = 'syncing';
			else if (mismatchCount > 0) state = 'mismatch';
			else if (idleCount === group.names.length) state = 'idle';
			else state = 'synced';

			map[group.label] = {
				state,
				errorCount,
				mismatchCount,
				syncingCount,
				localTotal,
				serverTotal: hasServerCounts ? serverTotal : null,
				hasServerCounts
			};
		}
		return map;
	});

	// Default all collapsed — expand only via manual toggle
	function isGroupExpanded(label: string): boolean {
		if (label in manualGroupToggles) return manualGroupToggles[label];
		return false;
	}

	function toggleGroup(label: string) {
		manualGroupToggles = { ...manualGroupToggles, [label]: !isGroupExpanded(label) };
	}

	// Live "since" timer — only ticks when modal is open
	let now = $state(Date.now());
	$effect(() => {
		if (!open) return;
		now = Date.now(); // immediate update on open
		const interval = setInterval(() => { now = Date.now(); }, 30000);
		return () => clearInterval(interval);
	});

	let lastNeonAge = $derived.by(() => {
		const ts = syncStatus.neonUsage.lastInteraction?.timestamp;
		if (!ts) return null;
		const seconds = Math.floor((now - ts) / 1000);
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	});

	let lastNeonLabel = $derived.by(() => {
		const last = syncStatus.neonUsage.lastInteraction;
		if (!last) return '';
		if (last.type === 'health') return 'health check';
		return `${last.type}: ${last.collection}`;
	});

	// System diagnostics
	let storageEstimate = $state<{ usage: string; quota: string; percent: string } | null>(null);
	let onlineStatus = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);

	// B3: Storage usage trend
	let storageTrend = $state<'growing' | 'stable' | 'shrinking' | null>(null);

	// Update online status reactively
	if (typeof window !== 'undefined') {
		window.addEventListener('online', () => (onlineStatus = true));
		window.addEventListener('offline', () => (onlineStatus = false));
	}

	$effect(() => {
		if (open && typeof navigator !== 'undefined' && navigator.storage?.estimate) {
			navigator.storage.estimate().then((est) => {
				const usage = est.usage ? (est.usage / 1024 / 1024).toFixed(1) : '?';
				const quota = est.quota ? (est.quota / 1024 / 1024).toFixed(0) : '?';
				const percent = est.usage && est.quota ? ((est.usage / est.quota) * 100).toFixed(1) : '?';
				storageEstimate = { usage: `${usage} MB`, quota: `${quota} MB`, percent: `${percent}%` };
			});
			// B3: Compute storage trend when modal opens
			storageTrend = getStorageTrend();
		}
	});

	// Fetch real Neon billing when System tab opens
	$effect(() => {
		if (open && activeTab === 'system') {
			syncStatus.fetchNeonBilling();
		}
	});

	// Flow direction — uses single source of truth from syncStatus.statusLabel
	let flowArrow = $derived.by(() => {
		const s = syncStatus.statusLabel;
		switch (s.state) {
			case 'paused': return { icon: Pause, label: s.label, color: 'text-amber-500', animate: false };
			case 'in-sync': return { icon: CheckCircle, label: s.label, color: 'text-emerald-500', animate: false };
			case 'syncing': return { icon: ArrowLeft, label: s.label, color: 'text-blue-500', animate: true };
			case 'saving': return { icon: ArrowRight, label: s.label, color: 'text-amber-500', animate: true };
			case 'error': return { icon: XCircle, label: s.label, color: 'text-red-500', animate: false };
			case 'errors': return { icon: AlertCircle, label: s.label, color: 'text-amber-500', animate: false };
			case 'unsaved': return { icon: Circle, label: s.label, color: 'text-orange-500', animate: false };
			default: return { icon: Circle, label: s.label, color: 'text-muted-foreground/50', animate: false };
		}
	});

	let hasSchemaError = $derived(
		syncStatus.rxdbError?.includes('DB6') ||
		syncStatus.rxdbError?.includes('schema') ||
		errorSummary.some((e) => e.code === 'DB6' || e.code === 'SC36')
	);

	async function clearSiteData() {
		if (!confirm('This will delete all local data (IndexedDB) and reload. Continue?')) return;
		// Delete all IndexedDB databases
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			if (db.name) indexedDB.deleteDatabase(db.name);
		}
		// Clear caches
		if ('caches' in window) {
			const keys = await caches.keys();
			await Promise.all(keys.map((k) => caches.delete(k)));
		}
		location.reload();
	}

	async function copyLogs() {
		const flowLabels: Record<string, string> = {
			pull: 'Neon → IndexedDB',
			push: 'IndexedDB → Neon',
			error: 'disconnected',
			idle: 'idle'
		};
		const errCollections = syncStatus.collections.filter((c) => c.status === 'error');
		const lines = [
			`Dorm Sync Diagnostics — ${new Date().toLocaleString()}`,
			``,
			`=== Environment ===`,
			`Route: ${$page.url.pathname}`,
			`User-Agent: ${navigator.userAgent}`,
			`Network: ${navigator.onLine ? 'online' : 'offline'}`,
			`RxDB: v${syncStatus.rxdbVersion || 'unknown'}`,
			`App: v${syncStatus.appVersion}`,
			...(storageEstimate ? [`Storage: ${storageEstimate.usage} / ${storageEstimate.quota} (${storageEstimate.percent})`] : []),
			`Multi-tab: ${typeof BroadcastChannel !== 'undefined' ? 'supported' : 'unavailable'}`,
			``,
			`=== System ===`,
			`RxDB: ${syncStatus.rxdbHealth}${syncStatus.rxdbError ? ` — ${syncStatus.rxdbError}` : ''}`,
			`Neon: ${syncStatus.neonHealth}${syncStatus.neonLatency ? ` (${syncStatus.neonLatency}ms)` : ''}${syncStatus.neonError ? ` — ${syncStatus.neonError}` : ''}`,
			`Phase: ${syncStatus.phase} — ${syncStatus.syncedCount}/${syncStatus.totalCount} synced`,
			`Flow: ${syncStatus.flowDirection} (${flowLabels[syncStatus.flowDirection] || 'unknown'})`,
			`Pending mutations: ${syncStatus.pendingMutations}`,
			`Paused: ${syncStatus.paused ? 'yes' : 'no'}`,
			`Total cached docs: ${syncStatus.totalDocs}`,
			`Last sync: ${syncStatus.dataAge || 'never'}`,
			`Schema: v1 (14 collections)`,
			`Replication: pull-only, batch 200, checkpoint-based`,
			``,
			`=== Neon Usage (Session) ===`,
			`Last interaction: ${syncStatus.neonUsage.lastInteraction ? `${lastNeonAge} (${lastNeonLabel})` : 'none'}`,
			`Session queries: ${syncStatus.totalNeonQueries} (${syncStatus.neonUsage.pullCount} pulls + ${syncStatus.neonUsage.pushCount} pushes + ${syncStatus.neonUsage.healthCheckCount} health)`,
			`Docs received: ${syncStatus.neonUsage.totalDocsReceived.toLocaleString()}`,
			`Data received: ~${syncStatus.estimatedTransferKB.toFixed(1)} KB`,
			`Est. compute: ~${syncStatus.estimatedComputeSeconds.toFixed(2)}s`,
			`Session started: ${new Date(syncStatus.neonUsage.sessionStartedAt).toLocaleString()}`,
			``,
			...(syncStatus.neonBilling ? [
				`=== Neon Billing (This Period) ===`,
				`Compute: ${syncStatus.neonBilling.compute.used} / ${syncStatus.neonBilling.compute.limit} ${syncStatus.neonBilling.compute.unit}`,
				`Storage: ${syncStatus.neonBilling.storage.used} / ${syncStatus.neonBilling.storage.limit} ${syncStatus.neonBilling.storage.unit}`,
				`Transfer: ${syncStatus.neonBilling.transfer.used} / ${syncStatus.neonBilling.transfer.limit} ${syncStatus.neonBilling.transfer.unit}`,
				``
			] : []),
			`=== Collections ===`,
			`Last synced: ${syncStatus.dataAge || 'never'}${syncStatus.neonCountsFetchedAt ? ` | Last counted: ${new Date(syncStatus.neonCountsFetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}`,
			`  ${'Collection'.padEnd(22)} ${'RxDB'.padStart(5)}  ${'Neon'.padStart(5)}  Status`,
			`  ${'─'.repeat(22)} ${'─'.repeat(5)}  ${'─'.repeat(5)}  ${'─'.repeat(20)}`,
			...syncStatus.collections.map((c) => {
				const neon = syncStatus.neonCounts?.[c.name];
				const rxdb = String(c.docCount).padStart(5);
				const neonStr = neon !== undefined ? String(neon).padStart(5) : '    —';
				let status: string = c.status;
				if (c.status === 'synced' && neon !== undefined) {
					const diff = c.docCount - neon;
					status = diff === 0 ? '✓ synced' : `⚠ ${diff > 0 ? `+${diff} extra` : `${diff} missing`}`;
				}
				if (c.parsedError) {
					status = `ERROR [${c.parsedError.code || '?'}] ${c.parsedError.summary}`;
				}
				return `  ${(collectionLabels[c.name] || c.name).padEnd(22)} ${rxdb}  ${neonStr}  ${status}`;
			}),
			...(errCollections.length > 0 ? [
				``,
				`=== Error Details (${errCollections.length} failed) ===`,
				...errCollections.flatMap((c) => [
					`  [${c.name}]`,
					`    Code: ${c.parsedError?.code || 'none'}`,
					`    Summary: ${c.parsedError?.summary || 'unknown'}`,
					`    RxDB error: ${c.parsedError?.isRxdb ? 'yes' : 'no'}`,
					...(c.parsedError?.url ? [`    Docs: ${c.parsedError.url}`] : []),
					...(c.error ? [`    Raw: ${c.error.slice(0, 500)}`] : []),
					``
				])
			] : []),
			`=== Log (${syncStatus.logs.length} entries) ===`,
			...syncStatus.logs.map((l) => `[${l.time}] ${l.level.toUpperCase().padEnd(7)} ${l.message}`)
		];
		await navigator.clipboard.writeText(lines.join('\n'));
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[520px] max-h-[85vh] h-[85vh] sm:h-auto flex flex-col overflow-hidden p-3 sm:p-6 gap-1.5 sm:gap-4">
		<DialogHeader class="flex-shrink-0">
			<DialogTitle class="flex items-center gap-2 text-base sm:text-lg">
				<Database class="w-4 h-4 sm:w-5 sm:h-5" />
				Data Sync Status
			</DialogTitle>
			<DialogDescription class="text-xs sm:text-sm">
				Local-first data powered by RxDB + Neon PostgreSQL
			</DialogDescription>
		</DialogHeader>

		<!-- Service Health -->
		<div class="py-2 sm:py-3 px-2 sm:px-4 bg-muted/30 rounded-lg flex-shrink-0">
			<!-- Mobile: two rows. Desktop: single row -->
			<!-- Row 1: Health pipeline visualization — always centered with labels -->
			<div class="flex items-center justify-center gap-3 sm:gap-4">
				{#if true}
					{@const RxIcon = getHealthIcon(syncStatus.rxdbHealth)}
					<div class="flex items-center gap-1.5">
						<RxIcon class="w-3.5 h-3.5 {getHealthColor(syncStatus.rxdbHealth)} {syncStatus.rxdbHealth === 'checking' ? 'animate-spin' : ''}" />
						<HardDrive class="w-4 h-4 text-muted-foreground" />
						<span class="text-[11px] sm:text-xs font-medium">Local</span>
					</div>
				{/if}
				{#if true}
					{@const FlowIcon = flowArrow.icon}
					<div class="flex flex-col items-center min-w-[40px]">
						<FlowIcon class="w-4 h-4 {flowArrow.color} {flowArrow.animate ? 'animate-pulse' : ''}" />
						<span class="text-[9px] {flowArrow.color} leading-none mt-0.5">{flowArrow.label}</span>
					</div>
				{/if}
				{#if true}
					{@const NeonIcon = getHealthIcon(syncStatus.neonHealth)}
					<div class="flex items-center gap-1.5">
						<Cloud class="w-4 h-4 text-muted-foreground" />
						<span class="text-[11px] sm:text-xs font-medium">Cloud</span>
						<NeonIcon class="w-3.5 h-3.5 {getHealthColor(syncStatus.neonHealth)} {syncStatus.neonHealth === 'checking' ? 'animate-spin' : ''}" />
						{#if syncStatus.neonLatency !== null && syncStatus.neonHealth === 'ok'}
							<span class="text-[10px] text-muted-foreground tabular-nums">{syncStatus.neonLatency}ms</span>
						{/if}
					</div>
				{/if}
			</div>
			<!-- Row 2: Controls — badges + action buttons -->
			<div class="flex items-center justify-center gap-2 mt-2">
				{#if syncStatus.paused}
					<Badge variant="outline" class="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">Paused</Badge>
				{/if}
				<Badge variant={syncStatus.phase === 'complete' && !syncStatus.hasErrors ? 'secondary' : syncStatus.phase === 'error' ? 'destructive' : 'default'} class="text-[10px] sm:text-xs">
					{syncStatus.syncedCount}/{syncStatus.totalCount} synced
				</Badge>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => syncStatus.paused ? resumeSync() : pauseSync()}
					class="h-7 px-2"
					title={syncStatus.paused ? 'Resume sync' : 'Pause sync'}
				>
					{#if syncStatus.paused}
						<Play class="w-3.5 h-3.5 text-emerald-500" />
					{:else}
						<Pause class="w-3.5 h-3.5" />
					{/if}
				</Button>
				<Button variant="ghost" size="sm" onclick={handleResyncAll} disabled={isResyncing || syncStatus.paused} class="h-7 px-2">
					<RefreshCw class="w-3.5 h-3.5 {isResyncing ? 'animate-spin' : ''}" />
				</Button>
			</div>
		</div>

		<!-- Pending Mutations Queue -->
		{#if mutationQueue.items.length > 0}
			<div class="flex-shrink-0 space-y-1">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-muted-foreground">
						Pending Updates ({mutationQueue.items.length}){#if mutationQueue.paused} <Badge variant="outline" class="text-[10px] px-1 py-0 border-amber-300 text-amber-600 ml-1">paused</Badge>{/if}
					</span>
					{#if mutationQueue.items.some((m) => m.status === 'confirmed')}
						<button
							onclick={() => mutationQueue.clearConfirmed()}
							class="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
						>
							Clear confirmed
						</button>
					{/if}
				</div>
				{#each mutationQueue.items as mutation (mutation.id)}
					<div class="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 bg-muted/40 rounded-md">
						<!-- Type icon -->
						{#if mutation.type === 'update'}
							<Pencil class="w-3 h-3 text-blue-500 flex-shrink-0" />
						{:else if mutation.type === 'create'}
							<Plus class="w-3 h-3 text-emerald-500 flex-shrink-0" />
						{:else}
							<Trash2 class="w-3 h-3 text-red-500 flex-shrink-0" />
						{/if}
						<!-- Label -->
						<span class="text-[11px] sm:text-xs truncate flex-1">{mutation.label}</span>
						<!-- Status badge -->
						{#if mutation.status === 'queued'}
							<Badge variant="outline" class="text-[10px] px-1.5 py-0">queued</Badge>
						{:else if mutation.status === 'syncing'}
							<Badge variant="default" class="text-[10px] px-1.5 py-0 animate-pulse">syncing</Badge>
						{:else if mutation.status === 'confirmed'}
							<Badge variant="secondary" class="text-[10px] px-1.5 py-0 text-emerald-600">confirmed</Badge>
						{:else if mutation.status === 'failed'}
							<Badge variant="destructive" class="text-[10px] px-1.5 py-0">failed</Badge>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => mutationQueue.retry(mutation.id)}
								class="h-5 px-1.5"
								title="Retry"
							>
								<RotateCcw class="w-3 h-3" />
							</Button>
						{/if}
						<!-- Dismiss -->
						{#if mutation.status === 'confirmed' || mutation.status === 'failed'}
							<button
								onclick={() => mutationQueue.dismiss(mutation.id)}
								class="text-muted-foreground hover:text-foreground cursor-pointer"
								title="Dismiss"
							>
								<X class="w-3 h-3" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Error Summary (deduplicated by code) -->
		{#if errorSummary.length > 0 || (syncStatus.rxdbHealth === 'error' && syncStatus.rxdbError) || (syncStatus.neonHealth === 'error' && syncStatus.neonError)}
			<div class="flex-shrink-0 space-y-1.5">
				{#if syncStatus.rxdbHealth === 'error' && syncStatus.rxdbError}
					<div class="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 bg-red-50 dark:bg-red-950/20 rounded-md">
						<XCircle class="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
						<Badge variant="destructive" class="text-[10px] px-1.5 py-0 font-mono flex-shrink-0">RxDB</Badge>
						<span class="text-[11px] sm:text-xs text-red-600 dark:text-red-400 truncate">{syncStatus.rxdbError}</span>
					</div>
				{/if}
				{#if syncStatus.neonHealth === 'error' && syncStatus.neonError}
					<div class="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 bg-red-50 dark:bg-red-950/20 rounded-md">
						<XCircle class="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
						<Badge variant="destructive" class="text-[10px] px-1.5 py-0 font-mono flex-shrink-0">NEON</Badge>
						<span class="text-[11px] sm:text-xs text-red-600 dark:text-red-400 truncate">{syncStatus.neonError}</span>
					</div>
				{/if}
				{#each errorSummary as err}
					<div class="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-md">
						<AlertCircle class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
						{#if err.code}
							<Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono border-amber-300 text-amber-700 dark:text-amber-400 flex-shrink-0">{err.code}</Badge>
						{/if}
						<span class="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 truncate flex-1" title={err.summary}>{err.summary}</span>
						{#if err.url}
							<a href={err.url} target="_blank" rel="noopener" class="flex-shrink-0" title="View docs">
								<ExternalLink class="w-3 h-3 text-amber-500 hover:text-amber-700" />
							</a>
						{/if}
						{#if err.collections.length > 1}
							<span class="text-[10px] text-amber-600 flex-shrink-0">×{err.collections.length}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Tabs -->
		<div class="flex border-b flex-shrink-0 items-end">
			<button
				onclick={() => (activeTab = 'collections')}
				class="flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer {activeTab === 'collections' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Collections
			</button>
			<button
				onclick={() => (activeTab = 'logs')}
				class="flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer {activeTab === 'logs' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Log
				{#if syncStatus.logs.length > 0}
					<span class="ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] text-muted-foreground tabular-nums">({syncStatus.logs.length})</span>
				{/if}
			</button>
			<button
				onclick={() => (activeTab = 'system')}
				class="flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer {activeTab === 'system' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				System
			</button>
			{#if syncStatus.logs.length > 0}
				<button
					onclick={copyLogs}
					class="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 mb-0.5 rounded text-[11px] sm:text-xs hover:bg-muted/50 transition-colors cursor-pointer {copied ? 'text-emerald-500' : 'text-muted-foreground'}"
					title="Copy full diagnostics to clipboard"
				>
					{#if copied}
						<Check class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
						<span class="hidden sm:inline">Copied</span>
					{:else}
						<Copy class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
						<span class="hidden sm:inline">Copy</span>
					{/if}
				</button>
			{/if}
		</div>

		<!-- Tab content — min-h-0 is critical for flex overflow scroll -->
		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if activeTab === 'collections'}
				<!-- Actions toolbar + timestamps — centered on all screen sizes -->
				<div class="py-2 space-y-2">
					<!-- Action buttons row — centered -->
					<div class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
						<Button
							variant="outline"
							size="sm"
							class="h-7 text-[11px] gap-1.5 px-2.5"
							onclick={() => syncStatus.fetchNeonCounts(true, refreshLocalCounts)}
							disabled={syncStatus.neonCountsLoading}
							title="Compare local doc counts against Neon server"
						>
							{#if syncStatus.neonCountsLoading}
								<Loader2 class="w-3 h-3 animate-spin" />
							{:else}
								<Cloud class="w-3 h-3" />
							{/if}
							Check Counts
						</Button>
						<Button
							variant="outline"
							size="sm"
							class="h-7 text-[11px] gap-1.5 px-2.5"
							onclick={handleReconcile}
							disabled={isReconciling || syncStatus.paused}
							title="Compare local data against server and fix any mismatches"
						>
							{#if isReconciling}
								<Loader2 class="w-3 h-3 animate-spin" />
							{:else}
								<ArrowLeftRight class="w-3 h-3" />
							{/if}
							Reconcile
						</Button>
						{#if errorCollectionsList.length > 1}
							<Button
								variant="outline"
								size="sm"
								class="h-7 text-[11px] gap-1.5 px-2.5"
								onclick={handleRetryAllFailed}
								disabled={isRetryingAllFailed}
							>
								<RefreshCw class="w-3 h-3 {isRetryingAllFailed ? 'animate-spin' : ''}" />
								Retry ({errorCollectionsList.length})
							</Button>
						{/if}
					</div>
					{#if syncStatus.neonCountsError}
						<p class="text-[10px] text-red-500 text-center truncate" title={syncStatus.neonCountsError}>{syncStatus.neonCountsError}</p>
					{/if}
					<!-- Timestamp row — centered -->
					<div class="flex items-center justify-center gap-4 sm:gap-6 text-[10px]">
						<div class="flex items-center gap-1.5">
							<HardDrive class="w-3 h-3 text-muted-foreground/60" />
							<div class="flex flex-col leading-none">
								<span class="tabular-nums text-foreground font-medium">{syncStatus.lastSuccessfulSyncAt ? syncStatus.lastSuccessfulSyncAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</span>
								<span class="text-muted-foreground">synced</span>
							</div>
						</div>
						<div class="flex items-center gap-1.5">
							<Cloud class="w-3 h-3 text-muted-foreground/60" />
							<div class="flex flex-col leading-none">
								<span class="tabular-nums text-foreground font-medium">{syncStatus.neonCountsFetchedAt ? new Date(syncStatus.neonCountsFetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</span>
								<span class="text-muted-foreground">server</span>
							</div>
						</div>
					</div>
				</div>
				{#if lastReconcileResult && lastReconcileResult.status === 'ok'}
					{@const r = lastReconcileResult}
					{@const drifted = r.collections.filter((c) => !c.inSync)}
					{@const unverified = r.collections.filter((c) => !c.verified)}
					{@const isFullyVerified = r.verified && unverified.length === 0}
					<div class="mb-2 px-2 sm:px-3 py-2 rounded-md border space-y-1 {isFullyVerified ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'}">
						<div class="flex items-start gap-1.5">
							{#if isFullyVerified && drifted.length === 0}
								<CheckCircle class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
								<span class="text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400">All {r.collections.length} collections verified — true mirror of server</span>
							{:else if isFullyVerified && drifted.length > 0}
								<CheckCircle class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
								<span class="text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400">
									Fixed {drifted.length} collection(s) — {r.totalOrphansRemoved} orphan(s) removed, {r.totalMissingFetched} missing fetched
								</span>
							{:else}
								<AlertTriangle class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
								<span class="text-[11px] sm:text-xs font-medium text-amber-700 dark:text-amber-400">
									{#if drifted.length > 0}
										Fixed {drifted.length} collection(s): {r.totalOrphansRemoved} orphan(s) removed, {r.totalMissingFetched} missing fetched —
									{/if}
									{unverified.length} collection(s) still mismatched
								</span>
							{/if}
						</div>
						{#if drifted.length > 0}
							{#each drifted as d}
								<div class="text-[10px] pl-5 {d.verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
									{collectionLabels[d.name] || d.name}: server {d.serverCount}, local had {d.localCount}
									{#if d.orphansRemoved > 0} — removed {d.orphansRemoved}{/if}
									{#if d.missingFetched > 0} — fetched {d.missingFetched}{/if}
									{#if d.verified} — verified ✓{:else} — still mismatched ({d.verifiedLocalCount}/{d.verifiedServerCount}){/if}
								</div>
							{/each}
						{/if}
						{#if unverified.length > 0 && drifted.length === 0}
							{#each unverified as u}
								<div class="text-[10px] text-amber-600 dark:text-amber-400 pl-5">
									{collectionLabels[u.name] || u.name}: local {u.verifiedLocalCount ?? u.localCount} vs server {u.verifiedServerCount ?? u.serverCount}
								</div>
							{/each}
						{/if}
					</div>
				{/if}
				<div class="space-y-1">
					{#each collectionGroups as group}
						{@const gs = groupStatuses[group.label]}
						{@const expanded = isGroupExpanded(group.label)}
						<!-- Group header — clickable to collapse/expand -->
						<button
							type="button"
							onclick={() => toggleGroup(group.label)}
							class="w-full flex items-center justify-between py-1.5 px-1 sm:px-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer text-left"
						>
							<div class="flex items-center gap-1.5 min-w-0">
								<ChevronDown class="w-3 h-3 text-muted-foreground transition-transform flex-shrink-0 {expanded ? '' : '-rotate-90'}" />
								<!-- Group status icon -->
								{#if gs.state === 'error'}
									<AlertCircle class="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
								{:else if gs.state === 'syncing'}
									<Loader2 class="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-spin" />
								{:else if gs.state === 'mismatch'}
									<AlertTriangle class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
								{:else if gs.state === 'synced'}
									<CheckCircle class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
								{:else}
									<Circle class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
								{/if}
								<span class="text-xs font-semibold uppercase tracking-wider {gs.state === 'error' ? 'text-red-600 dark:text-red-400' : gs.state === 'mismatch' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}">{group.label}</span>
								<span class="text-[10px] text-muted-foreground/60">({group.names.length})</span>
							</div>
							<div class="flex items-center gap-1.5 flex-shrink-0">
								<!-- Inline problem badges when collapsed -->
								{#if !expanded && gs.errorCount > 0}
									<Badge variant="destructive" class="text-[9px] px-1.5 py-0">{gs.errorCount} error{gs.errorCount > 1 ? 's' : ''}</Badge>
								{/if}
								{#if !expanded && gs.mismatchCount > 0 && gs.errorCount === 0}
									<Badge variant="outline" class="text-[9px] px-1.5 py-0 border-amber-300 text-amber-600">{gs.mismatchCount} drift</Badge>
								{/if}
								<!-- Aggregate counts -->
								{#if gs.hasServerCounts}
									{@const match = gs.localTotal === gs.serverTotal}
									<span class="text-[10px] tabular-nums {match ? 'text-emerald-500' : 'text-amber-600'} font-medium">
										{gs.localTotal}<span class="text-muted-foreground/50">/</span>{gs.serverTotal}
									</span>
								{:else}
									<span class="text-[10px] text-muted-foreground tabular-nums">{gs.localTotal}</span>
								{/if}
							</div>
						</button>
						<!-- Expanded: individual collections -->
						{#if expanded}
							<div class="pl-3 sm:pl-4 space-y-0">
								{#each group.names as name (name)}
									{@const col = syncStatus.collections.find((c) => c.name === name)}
									{#if col}
									{@const Icon = getStatusIcon(col.status)}
									{@const isExpanded = expandedCollection === col.name}
									{@const hasError = col.status === 'error' && (col.parsedError || col.error)}
									{@const hasMismatch = syncStatus.neonCounts !== null && syncStatus.neonCounts[col.name] !== undefined && col.docCount !== syncStatus.neonCounts[col.name]}
									<div>
										<button
											type="button"
											onclick={() => expandedCollection = isExpanded ? null : col.name}
											class="w-full flex items-center justify-between py-1 px-1 sm:px-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer text-left"
										>
											<div class="flex items-center gap-1.5 min-w-0">
												{#if hasMismatch && col.status === 'synced'}
													<AlertTriangle class="w-3 h-3 flex-shrink-0 text-amber-500" />
												{:else}
													<Icon class="w-3 h-3 flex-shrink-0 {getStatusColor(col.status)} {col.status === 'syncing' ? 'animate-spin' : ''}" />
												{/if}
												<span class="text-[11px] sm:text-xs truncate">{collectionLabels[col.name] || col.name}</span>
											</div>
											<div class="flex items-center gap-1.5 flex-shrink-0">
												{#if col.parsedError?.code}
													<Badge variant="outline" class="text-[9px] px-1 py-0 font-mono border-red-300 text-red-600">{col.parsedError.code}</Badge>
												{/if}
												{#if col.status === 'syncing' && (syncStatus.pulledDocs[col.name] || 0) > 0}
													<span class="text-[10px] text-blue-500 tabular-nums font-medium">↓ {syncStatus.pulledDocs[col.name]}</span>
												{:else}
													{@const neonCount = syncStatus.neonCounts?.[col.name]}
													{#if neonCount !== undefined && neonCount !== null}
														{@const match = col.docCount === neonCount}
														<span class="text-[10px] tabular-nums {match ? 'text-emerald-500' : 'text-amber-600'} font-medium">
															{col.docCount}<span class="text-muted-foreground/50">/</span>{neonCount}
														</span>
													{:else}
														<span class="text-[10px] text-muted-foreground tabular-nums">{col.docCount}</span>
													{/if}
												{/if}
												{#if col.status === 'error'}
													<span
														role="button"
														tabindex="0"
														onclick={(e) => { e.stopPropagation(); handleResyncCollection(col.name); }}
														onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); handleResyncCollection(col.name); } }}
														aria-disabled={resyncingCollections.has(col.name)}
														class="p-0.5 rounded hover:bg-muted/50 transition-colors cursor-pointer {resyncingCollections.has(col.name) ? 'opacity-50 pointer-events-none' : ''}"
														title="Retry {collectionLabels[col.name] || col.name}"
													>
														<RefreshCw class="w-3 h-3 text-red-500 hover:text-red-700 {resyncingCollections.has(col.name) ? 'animate-spin' : ''}" />
													</span>
												{/if}
												{#if hasError}
													<ChevronDown class="w-3 h-3 text-muted-foreground transition-transform {isExpanded ? 'rotate-180' : ''}" />
												{/if}
											</div>
										</button>
										{#if isExpanded && hasError}
											<div class="ml-1 sm:ml-2 mb-1 px-2 sm:px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800 space-y-1.5">
												{#if col.parsedError}
													<div class="flex items-start gap-1.5 sm:gap-2">
														<span class="text-[10px] text-red-400 uppercase font-semibold w-10 sm:w-12 flex-shrink-0 pt-0.5">Code</span>
														<div class="flex items-center gap-1.5">
															<code class="text-[11px] sm:text-xs font-mono text-red-600 dark:text-red-400">{col.parsedError.code || 'none'}</code>
															{#if col.parsedError.isRxdb}
																<Badge variant="outline" class="text-[9px] px-1 py-0 border-red-300 text-red-500">RxDB</Badge>
															{:else}
																<Badge variant="outline" class="text-[9px] px-1 py-0 border-amber-300 text-amber-600">HTTP</Badge>
															{/if}
														</div>
													</div>
													<div class="flex items-start gap-1.5 sm:gap-2">
														<span class="text-[10px] text-red-400 uppercase font-semibold w-10 sm:w-12 flex-shrink-0 pt-0.5">What</span>
														<span class="text-[11px] sm:text-xs text-red-700 dark:text-red-300">{col.parsedError.summary}</span>
													</div>
													{#if col.parsedError.url}
														<div class="flex items-start gap-1.5 sm:gap-2">
															<span class="text-[10px] text-red-400 uppercase font-semibold w-10 sm:w-12 flex-shrink-0 pt-0.5">Docs</span>
															<a href={col.parsedError.url} target="_blank" rel="noopener" class="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 break-all">
																{col.parsedError.url}
																<ExternalLink class="w-3 h-3 flex-shrink-0" />
															</a>
														</div>
													{/if}
												{/if}
												{#if col.error}
													<div class="flex items-start gap-1.5 sm:gap-2">
														<span class="text-[10px] text-red-400 uppercase font-semibold w-10 sm:w-12 flex-shrink-0 pt-0.5">Raw</span>
														<pre class="text-[10px] text-red-600/80 dark:text-red-400/80 font-mono break-all whitespace-pre-wrap">{col.error}</pre>
													</div>
												{/if}
											</div>
										{/if}
									</div>
									{/if}
								{/each}
							</div>
						{/if}
					{/each}
				</div>
			{:else if activeTab === 'logs'}
				{#if syncStatus.logs.length > 0}
					<div class="flex justify-end py-1">
						<Button
							variant="ghost"
							size="sm"
							class="h-6 text-[11px] gap-1 text-muted-foreground"
							onclick={() => syncStatus.clearLogs()}
						>
							<Trash2 class="w-3 h-3" />
							Clear logs
						</Button>
					</div>
				{/if}
				{#if syncStatus.logs.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
						<Info class="w-8 h-8 mb-2 opacity-40" />
						<span class="text-sm">No logs yet</span>
					</div>
				{:else}
					<div class="space-y-0.5">
						{#each syncStatus.logs as log, i (i)}
							{@const LogIcon = getLogIcon(log.level)}
							<div class="flex items-start gap-1.5 sm:gap-2 py-1 sm:py-1.5 px-1 sm:px-2 rounded-md hover:bg-muted/20 transition-colors">
								<LogIcon class="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 flex-shrink-0 {getLogColor(log.level)}" />
								<span class="text-[10px] sm:text-xs text-muted-foreground tabular-nums whitespace-nowrap">{log.time}</span>
								<span class="text-[10px] sm:text-xs break-all {log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-amber-600' : 'text-foreground'}" title={log.message}>{log.message}</span>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<!-- System diagnostics tab -->
				<div class="space-y-3 py-1">
					<!-- Overview (compact — replaces redundant RxDB/Neon/Sync sections) -->
					<div class="bg-muted/20 rounded-lg px-2.5 sm:px-3 py-2 space-y-1">
						<div class="flex justify-between text-[11px] sm:text-xs gap-2">
							<span class="text-muted-foreground flex-shrink-0">Versions</span>
							<span class="text-right">RxDB {syncStatus.rxdbVersion ? `v${syncStatus.rxdbVersion}` : '—'} · App v{syncStatus.appVersion}</span>
						</div>
						<div class="flex justify-between text-[11px] sm:text-xs gap-2">
							<span class="text-muted-foreground flex-shrink-0">Cached</span>
							<span class="tabular-nums text-right">{syncStatus.totalDocs.toLocaleString()} docs · {syncStatus.totalCount} collections</span>
						</div>
						{#if syncStatus.lastSuccessfulSyncAt}
							<div class="flex justify-between text-[11px] sm:text-xs gap-2">
								<span class="text-muted-foreground flex-shrink-0">Last Sync</span>
								<span class="text-right">{syncStatus.dataAge} ({syncStatus.lastSuccessfulSyncAt.toLocaleTimeString()})</span>
							</div>
						{/if}
					</div>

					<!-- Neon Usage (Session) -->
					<div class="space-y-1.5">
						<h4 class="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Neon Usage (Session)</h4>
						<div class="bg-muted/20 rounded-lg px-2.5 sm:px-3 py-2 space-y-1">
							<div class="flex justify-between text-[11px] sm:text-xs gap-2">
								<span class="text-muted-foreground flex-shrink-0">Last Interaction</span>
								{#if syncStatus.neonUsage.lastInteraction}
									<span class="text-right">{lastNeonAge} ({lastNeonLabel})</span>
								{:else}
									<span class="text-muted-foreground">none</span>
								{/if}
							</div>
							<div class="flex flex-col sm:flex-row sm:justify-between text-[11px] sm:text-xs gap-0 sm:gap-2">
								<span class="text-muted-foreground flex-shrink-0">Session Queries</span>
								<span class="tabular-nums sm:text-right">{syncStatus.totalNeonQueries} ({syncStatus.neonUsage.pullCount}p + {syncStatus.neonUsage.pushCount}w + {syncStatus.neonUsage.healthCheckCount}h)</span>
							</div>
							<div class="flex justify-between text-[11px] sm:text-xs gap-2">
								<span class="text-muted-foreground flex-shrink-0">Docs Received</span>
								<span class="tabular-nums">{syncStatus.neonUsage.totalDocsReceived.toLocaleString()}</span>
							</div>
							<div class="flex justify-between text-[11px] sm:text-xs gap-2">
								<span class="text-muted-foreground flex-shrink-0">Data Received</span>
								<span class="tabular-nums">~{syncStatus.estimatedTransferKB.toFixed(1)} KB</span>
							</div>
							<div class="flex justify-between text-[11px] sm:text-xs gap-2">
								<span class="text-muted-foreground flex-shrink-0">Est. Compute</span>
								<span class="tabular-nums">~{syncStatus.estimatedComputeSeconds.toFixed(2)}s</span>
							</div>
						</div>
					</div>

					<!-- Neon Billing (Real — from Management API) -->
					<div class="space-y-1.5">
						<h4 class="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Neon Billing (This Period)</h4>
						<div class="bg-muted/20 rounded-lg px-2.5 sm:px-3 py-2 space-y-1.5">
							{#if syncStatus.neonBillingLoading}
								<div class="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
									<Loader2 class="w-3 h-3 animate-spin" />
									<span>Fetching billing data...</span>
								</div>
							{:else if syncStatus.neonBillingError}
								<div class="text-[11px] sm:text-xs text-red-500">{syncStatus.neonBillingError}</div>
							{:else if syncStatus.neonBilling}
								{@const b = syncStatus.neonBilling}
								<!-- Compute -->
								<div class="space-y-0.5">
									<div class="flex justify-between text-[11px] sm:text-xs gap-2">
										<span class="text-muted-foreground">Compute</span>
										<span class="tabular-nums font-medium text-right">{b.compute.used} / {b.compute.limit} {b.compute.unit}</span>
									</div>
									<div class="w-full bg-muted rounded-full h-1.5">
										<div
											class="h-1.5 rounded-full transition-all {(b.compute.used / b.compute.limit) > 0.9 ? 'bg-red-500' : (b.compute.used / b.compute.limit) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}"
											style="width: {Math.min((b.compute.used / b.compute.limit) * 100, 100)}%"
										></div>
									</div>
								</div>
								<!-- Storage -->
								<div class="space-y-0.5">
									<div class="flex justify-between text-[11px] sm:text-xs gap-2">
										<span class="text-muted-foreground">Storage</span>
										<span class="tabular-nums font-medium text-right">{b.storage.used} / {b.storage.limit} {b.storage.unit}</span>
									</div>
									<div class="w-full bg-muted rounded-full h-1.5">
										<div
											class="h-1.5 rounded-full transition-all {(b.storage.used / b.storage.limit) > 0.9 ? 'bg-red-500' : (b.storage.used / b.storage.limit) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}"
											style="width: {Math.min((b.storage.used / b.storage.limit) * 100, 100)}%"
										></div>
									</div>
								</div>
								<!-- Network Transfer -->
								<div class="space-y-0.5">
									<div class="flex justify-between text-[11px] sm:text-xs gap-2">
										<span class="text-muted-foreground">Transfer</span>
										<span class="tabular-nums font-medium text-right">{b.transfer.used} / {b.transfer.limit} {b.transfer.unit}</span>
									</div>
									<div class="w-full bg-muted rounded-full h-1.5">
										<div
											class="h-1.5 rounded-full transition-all {(b.transfer.used / b.transfer.limit) > 0.9 ? 'bg-red-500' : (b.transfer.used / b.transfer.limit) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}"
											style="width: {Math.min((b.transfer.used / b.transfer.limit) * 100, 100)}%"
										></div>
									</div>
								</div>
								<div class="text-[9px] sm:text-[10px] text-muted-foreground text-right">
									Cached {new Date(b.fetchedAt).toLocaleTimeString()} · refreshes after 5 min
								</div>
							{:else}
								<div class="text-[11px] sm:text-xs text-muted-foreground">No billing data yet</div>
							{/if}
						</div>
					</div>


					<!-- Device/Network Section -->
					<div class="space-y-1.5">
						<h4 class="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Device & Storage</h4>
						<div class="bg-muted/20 rounded-lg px-2.5 sm:px-3 py-2 space-y-1">
							<div class="flex justify-between text-[11px] sm:text-xs">
								<span class="text-muted-foreground">Network</span>
								<span class="{onlineStatus ? 'text-emerald-500' : 'text-red-500'} font-medium">{onlineStatus ? 'Online' : 'Offline'}</span>
							</div>
							{#if storageEstimate}
								<div class="flex justify-between text-[11px] sm:text-xs gap-2">
									<span class="text-muted-foreground flex-shrink-0">Storage</span>
									<span class="tabular-nums text-right">{storageEstimate.usage} / {storageEstimate.quota} ({storageEstimate.percent})</span>
								</div>
								<div class="w-full bg-muted rounded-full h-1.5 mt-1">
									<div
										class="h-1.5 rounded-full transition-all {parseFloat(storageEstimate.percent) > 90 ? 'bg-red-500' : parseFloat(storageEstimate.percent) > 70 ? 'bg-amber-500' : 'bg-emerald-500'}"
										style="width: {Math.min(parseFloat(storageEstimate.percent), 100)}%"
									></div>
								</div>
							{/if}
							{#if storageTrend}
								<div class="flex justify-between text-[11px] sm:text-xs">
									<span class="text-muted-foreground">Trend</span>
									<span class="flex items-center gap-1">
										{#if storageTrend === 'growing'}
											<TrendingUp class="w-3 h-3 text-amber-500" />
											<span class="text-amber-500">Growing</span>
										{:else if storageTrend === 'shrinking'}
											<TrendingDown class="w-3 h-3 text-emerald-500" />
											<span class="text-emerald-500">Shrinking</span>
										{:else}
											<Minus class="w-3 h-3 text-muted-foreground" />
											<span>Stable</span>
										{/if}
									</span>
								</div>
							{/if}
							<div class="flex justify-between text-[11px] sm:text-xs">
								<span class="text-muted-foreground">Multi-tab</span>
								<span>{typeof BroadcastChannel !== 'undefined' ? 'Active' : 'Unavailable'}</span>
							</div>
						</div>
					</div>

					<!-- Recovery Section -->
					<div class="space-y-1.5">
						<h4 class="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recovery Options</h4>
						<div class="bg-muted/20 rounded-lg px-2.5 sm:px-3 py-2 space-y-1.5">
							<p class="text-[10px] sm:text-[11px] text-muted-foreground">
								If data appears stale or sync is stuck, try these in order:
							</p>
							<ol class="text-[10px] sm:text-[11px] text-muted-foreground space-y-0.5 list-decimal pl-4">
								<li>Click <strong>Resync</strong> (refresh icon above)</li>
								<li>Click <strong>Clear Data</strong> then <strong>Reload</strong></li>
								<li>Append <code class="bg-muted px-1 rounded text-[10px]">?reset-db=1</code> to URL</li>
							</ol>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Actions footer -->
		{#if syncStatus.hasErrors || syncStatus.rxdbHealth === 'error' || hasSchemaError}
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t flex-shrink-0">
				<span class="text-[10px] sm:text-[11px] text-muted-foreground">
					{hasSchemaError ? 'Schema mismatch — clear local data' : 'Sync errors detected'}
				</span>
				<div class="flex items-center gap-2 w-full sm:w-auto">
					<Button variant="outline" size="sm" class="h-7 text-xs gap-1.5 flex-1 sm:flex-initial" onclick={clearSiteData}>
						<Trash2 class="w-3 h-3" />
						Clear Data
					</Button>
					<Button variant="outline" size="sm" class="h-7 text-xs gap-1.5 flex-1 sm:flex-initial" onclick={() => location.reload()}>
						<RotateCcw class="w-3 h-3" />
						Reload
					</Button>
				</div>
			</div>
		{/if}
	</DialogContent>
</Dialog>
