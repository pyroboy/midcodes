<script lang="ts">
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import { resyncAll } from '$lib/db/replication';
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
		RotateCcw
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false) } = $props();
	let isResyncing = $state(false);

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
		penalty_configs: 'Penalty Rules'
	};

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

	async function handleResyncAll() {
		isResyncing = true;
		try {
			syncStatus.addLog('Manual resync started', 'info');
			syncStatus.checkNeonHealth();
			await resyncAll();
			toast.success('All collections resynced');
		} catch (err) {
			toast.error('Resync failed');
		} finally {
			isResyncing = false;
		}
	}

	function formatTime(iso: string | null) {
		if (!iso) return '—';
		const d = new Date(iso);
		return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	let activeTab = $state<'collections' | 'logs' | 'system'>('collections');
	let copied = $state(false);

	// System diagnostics
	let storageEstimate = $state<{ usage: string; quota: string; percent: string } | null>(null);
	let onlineStatus = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);

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
		const lines = [
			`Dorm Sync Diagnostics — ${new Date().toLocaleString()}`,
			``,
			`=== System ===`,
			`RxDB: ${syncStatus.rxdbHealth}${syncStatus.rxdbError ? ` (${syncStatus.rxdbError})` : ''}`,
			`Neon: ${syncStatus.neonHealth}${syncStatus.neonLatency ? ` ${syncStatus.neonLatency}ms` : ''}${syncStatus.neonError ? ` (${syncStatus.neonError})` : ''}`,
			`Phase: ${syncStatus.phase} — ${syncStatus.syncedCount}/${syncStatus.totalCount} synced`,
			`Total cached docs: ${syncStatus.totalDocs}`,
			`Network: ${navigator.onLine ? 'online' : 'offline'}`,
			`Last sync: ${syncStatus.dataAge || 'never'}`,
			...(storageEstimate ? [`Storage: ${storageEstimate.usage} / ${storageEstimate.quota} (${storageEstimate.percent})`] : []),
			`Schema: v1 (14 collections)`,
			`Replication: pull-only, batch 200, checkpoint-based`,
			``,
			`=== Collections ===`,
			...syncStatus.collections.map((c) => {
				const parts = [`  ${c.name}: ${c.status}`];
				if (c.docCount > 0) parts.push(`${c.docCount} docs`);
				if (c.lastSyncedAt) parts.push(`synced ${formatTime(c.lastSyncedAt)}`);
				if (c.parsedError) parts.push(`ERROR [${c.parsedError.code}] ${c.parsedError.summary}`);
				return parts.join(' | ');
			}),
			``,
			`=== Log (${syncStatus.logs.length} entries) ===`,
			...syncStatus.logs.map((l) => `[${l.time}] ${l.level.toUpperCase().padEnd(7)} ${l.message}`)
		];
		await navigator.clipboard.writeText(lines.join('\n'));
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
		<DialogHeader class="flex-shrink-0">
			<DialogTitle class="flex items-center gap-2">
				<Database class="w-5 h-5" />
				Data Sync Status
			</DialogTitle>
			<DialogDescription>
				Local-first data powered by RxDB + Neon PostgreSQL
			</DialogDescription>
		</DialogHeader>

		<!-- Service Health -->
		<div class="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg flex-shrink-0">
			<div class="flex items-center gap-4">
				{#if true}
					{@const RxIcon = getHealthIcon(syncStatus.rxdbHealth)}
					<div class="flex items-center gap-1.5">
						<RxIcon class="w-3.5 h-3.5 {getHealthColor(syncStatus.rxdbHealth)} {syncStatus.rxdbHealth === 'checking' ? 'animate-spin' : ''}" />
						<HardDrive class="w-4 h-4 text-muted-foreground" />
						<span class="text-sm font-medium">IndexedDB</span>
					</div>
				{/if}
				<span class="text-muted-foreground">→</span>
				{#if true}
					{@const NeonIcon = getHealthIcon(syncStatus.neonHealth)}
					<div class="flex items-center gap-1.5">
						<NeonIcon class="w-3.5 h-3.5 {getHealthColor(syncStatus.neonHealth)} {syncStatus.neonHealth === 'checking' ? 'animate-spin' : ''}" />
						<Cloud class="w-4 h-4 text-muted-foreground" />
						<span class="text-sm font-medium">Neon</span>
						{#if syncStatus.neonLatency !== null && syncStatus.neonHealth === 'ok'}
							<span class="text-[10px] text-muted-foreground tabular-nums">{syncStatus.neonLatency}ms</span>
						{/if}
					</div>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<Badge variant={syncStatus.phase === 'complete' && !syncStatus.hasErrors ? 'secondary' : syncStatus.phase === 'error' ? 'destructive' : 'default'}>
					{syncStatus.syncedCount}/{syncStatus.totalCount} synced
				</Badge>
				<Button variant="ghost" size="sm" onclick={handleResyncAll} disabled={isResyncing} class="h-7 px-2">
					<RefreshCw class="w-3.5 h-3.5 {isResyncing ? 'animate-spin' : ''}" />
				</Button>
			</div>
		</div>

		<!-- Error Summary (deduplicated by code) -->
		{#if errorSummary.length > 0 || (syncStatus.rxdbHealth === 'error' && syncStatus.rxdbError) || (syncStatus.neonHealth === 'error' && syncStatus.neonError)}
			<div class="flex-shrink-0 space-y-1.5">
				{#if syncStatus.rxdbHealth === 'error' && syncStatus.rxdbError}
					<div class="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-md">
						<XCircle class="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
						<Badge variant="destructive" class="text-[10px] px-1.5 py-0 font-mono flex-shrink-0">RxDB</Badge>
						<span class="text-xs text-red-600 dark:text-red-400 truncate">{syncStatus.rxdbError}</span>
					</div>
				{/if}
				{#if syncStatus.neonHealth === 'error' && syncStatus.neonError}
					<div class="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-md">
						<XCircle class="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
						<Badge variant="destructive" class="text-[10px] px-1.5 py-0 font-mono flex-shrink-0">NEON</Badge>
						<span class="text-xs text-red-600 dark:text-red-400 truncate">{syncStatus.neonError}</span>
					</div>
				{/if}
				{#each errorSummary as err}
					<div class="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
						<AlertCircle class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
						{#if err.code}
							<Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono border-amber-300 text-amber-700 dark:text-amber-400 flex-shrink-0">{err.code}</Badge>
						{/if}
						<span class="text-xs text-amber-800 dark:text-amber-300 truncate flex-1" title={err.summary}>{err.summary}</span>
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
				class="flex-1 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer {activeTab === 'collections' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Collections
			</button>
			<button
				onclick={() => (activeTab = 'logs')}
				class="flex-1 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer {activeTab === 'logs' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Log
				{#if syncStatus.logs.length > 0}
					<span class="ml-1 text-[10px] text-muted-foreground tabular-nums">({syncStatus.logs.length})</span>
				{/if}
			</button>
			<button
				onclick={() => (activeTab = 'system')}
				class="flex-1 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer {activeTab === 'system' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				System
			</button>
			{#if syncStatus.logs.length > 0}
				<button
					onclick={copyLogs}
					class="flex items-center gap-1 px-2 py-1.5 mb-0.5 rounded text-xs hover:bg-muted/50 transition-colors cursor-pointer {copied ? 'text-emerald-500' : 'text-muted-foreground'}"
					title="Copy full diagnostics to clipboard"
				>
					{#if copied}
						<Check class="w-3.5 h-3.5" />
						Copied
					{:else}
						<Copy class="w-3.5 h-3.5" />
						Copy
					{/if}
				</button>
			{/if}
		</div>

		<!-- Tab content — min-h-0 is critical for flex overflow scroll -->
		<div class="min-h-0 flex-1 overflow-y-auto pr-1">
			{#if activeTab === 'collections'}
				<div class="space-y-1">
					{#each syncStatus.collections as col (col.name)}
						{@const Icon = getStatusIcon(col.status)}
						<div class="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
							<div class="flex items-center gap-2.5 min-w-0">
								<Icon class="w-4 h-4 flex-shrink-0 {getStatusColor(col.status)} {col.status === 'syncing' ? 'animate-spin' : ''}" />
								<span class="text-sm truncate">{collectionLabels[col.name] || col.name}</span>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								{#if col.parsedError?.code}
									<Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono border-red-300 text-red-600">{col.parsedError.code}</Badge>
								{:else if col.error}
									<span class="text-xs text-red-500 max-w-[100px] truncate" title={col.error}>{col.error}</span>
								{:else if col.lastSyncedAt}
									<span class="text-xs text-muted-foreground tabular-nums">{formatTime(col.lastSyncedAt)}</span>
								{/if}
								<Badge variant={getBadgeVariant(col.status)} class="text-[10px] px-1.5 py-0">
									{col.status}
								</Badge>
							</div>
						</div>
					{/each}
				</div>
			{:else if activeTab === 'logs'}
				{#if syncStatus.logs.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
						<Info class="w-8 h-8 mb-2 opacity-40" />
						<span class="text-sm">No logs yet</span>
					</div>
				{:else}
					<div class="space-y-0.5">
						{#each syncStatus.logs as log, i (i)}
							{@const LogIcon = getLogIcon(log.level)}
							<div class="flex items-start gap-2 py-1.5 px-3 rounded-md hover:bg-muted/20 transition-colors">
								<LogIcon class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 {getLogColor(log.level)}" />
								<span class="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{log.time}</span>
								<span class="text-xs break-all {log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-amber-600' : 'text-foreground'}">{log.message}</span>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<!-- System diagnostics tab -->
				<div class="space-y-3 py-1">
					<!-- RxDB Section -->
					<div class="space-y-1.5">
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">RxDB (Client Database)</h4>
						<div class="bg-muted/20 rounded-lg px-3 py-2 space-y-1">
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Status</span>
								<span class="{getHealthColor(syncStatus.rxdbHealth)} font-medium">{syncStatus.rxdbHealth}</span>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Storage Engine</span>
								<span>IndexedDB (Dexie)</span>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Schema Version</span>
								<span>v1</span>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Collections</span>
								<span>{syncStatus.totalCount}</span>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Total Cached Docs</span>
								<span class="tabular-nums">{syncStatus.totalDocs.toLocaleString()}</span>
							</div>
							{#if syncStatus.rxdbError}
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Error</span>
									<span class="text-red-500 truncate max-w-[200px]" title={syncStatus.rxdbError}>{syncStatus.rxdbError}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Neon Section -->
					<div class="space-y-1.5">
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Neon PostgreSQL (Server)</h4>
						<div class="bg-muted/20 rounded-lg px-3 py-2 space-y-1">
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Status</span>
								<span class="{getHealthColor(syncStatus.neonHealth)} font-medium">{syncStatus.neonHealth}</span>
							</div>
							{#if syncStatus.neonLatency !== null}
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Latency</span>
									<span class="tabular-nums">{syncStatus.neonLatency}ms</span>
								</div>
							{/if}
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Replication</span>
								<span>Pull-only (checkpoint)</span>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Batch Size</span>
								<span>200</span>
							</div>
							{#if syncStatus.neonError}
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Error</span>
									<span class="text-red-500 truncate max-w-[200px]" title={syncStatus.neonError}>{syncStatus.neonError}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Sync Section -->
					<div class="space-y-1.5">
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Sync Status</h4>
						<div class="bg-muted/20 rounded-lg px-3 py-2 space-y-1">
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Phase</span>
								<Badge variant={syncStatus.phase === 'complete' ? 'secondary' : syncStatus.phase === 'error' ? 'destructive' : 'default'} class="text-[10px] px-1.5 py-0">
									{syncStatus.phase}
								</Badge>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Collections Synced</span>
								<span class="tabular-nums">{syncStatus.syncedCount} / {syncStatus.totalCount}</span>
							</div>
							{#if syncStatus.lastSuccessfulSyncAt}
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Last Sync</span>
									<span>{syncStatus.dataAge} ({syncStatus.lastSuccessfulSyncAt.toLocaleTimeString()})</span>
								</div>
							{/if}
							{#if syncStatus.errorCollections.length > 0}
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Failed</span>
									<span class="text-red-500">{syncStatus.errorCollections.map(c => collectionLabels[c.name] || c.name).join(', ')}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Device/Network Section -->
					<div class="space-y-1.5">
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Device & Storage</h4>
						<div class="bg-muted/20 rounded-lg px-3 py-2 space-y-1">
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Network</span>
								<span class="{onlineStatus ? 'text-emerald-500' : 'text-red-500'} font-medium">{onlineStatus ? 'Online' : 'Offline'}</span>
							</div>
							{#if storageEstimate}
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">Storage Used</span>
									<span class="tabular-nums">{storageEstimate.usage} / {storageEstimate.quota} ({storageEstimate.percent})</span>
								</div>
								<div class="w-full bg-muted rounded-full h-1.5 mt-1">
									<div
										class="h-1.5 rounded-full transition-all {parseFloat(storageEstimate.percent) > 90 ? 'bg-red-500' : parseFloat(storageEstimate.percent) > 70 ? 'bg-amber-500' : 'bg-emerald-500'}"
										style="width: {Math.min(parseFloat(storageEstimate.percent), 100)}%"
									></div>
								</div>
							{/if}
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">Multi-tab Sync</span>
								<span>{typeof BroadcastChannel !== 'undefined' ? 'Active' : 'Unavailable'}</span>
							</div>
						</div>
					</div>

					<!-- Recovery Section -->
					<div class="space-y-1.5">
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Recovery Options</h4>
						<div class="bg-muted/20 rounded-lg px-3 py-2 space-y-1.5">
							<p class="text-[11px] text-muted-foreground">
								If data appears stale or sync is stuck, try these in order:
							</p>
							<ol class="text-[11px] text-muted-foreground space-y-0.5 list-decimal pl-4">
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
			<div class="flex items-center justify-between pt-3 border-t flex-shrink-0">
				<span class="text-[11px] text-muted-foreground">
					{hasSchemaError ? 'Schema mismatch — clear local data to fix' : 'Sync errors detected'}
				</span>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" class="h-7 text-xs gap-1.5" onclick={clearSiteData}>
						<Trash2 class="w-3 h-3" />
						Clear Data
					</Button>
					<Button variant="outline" size="sm" class="h-7 text-xs gap-1.5" onclick={() => location.reload()}>
						<RotateCcw class="w-3 h-3" />
						Reload
					</Button>
				</div>
			</div>
		{/if}
	</DialogContent>
</Dialog>
