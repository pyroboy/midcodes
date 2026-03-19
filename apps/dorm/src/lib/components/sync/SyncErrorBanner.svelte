<script lang="ts">
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import { AlertTriangle, ExternalLink, RefreshCw, Clock } from 'lucide-svelte';
	import { resyncCollection, resyncAll } from '$lib/db/replication';

	/**
	 * Per-page sync error banner. Pass the collection name(s) this page depends on.
	 * Shows an inline warning when any have sync errors, or a subtle freshness
	 * indicator when data is stale (> 5 min since last sync). (W9)
	 *
	 * Usage: <SyncErrorBanner collections={['tenants', 'leases']} />
	 */
	let { collections: watchedCollections }: { collections: string[] } = $props();

	let isResyncing = $state(false);

	let failedCollections = $derived(
		syncStatus.collections.filter(
			(c) => watchedCollections.includes(c.name) && c.status === 'error'
		)
	);

	let show = $derived(failedCollections.length > 0);

	// W9: Per-page data freshness
	let freshness = $derived(syncStatus.getCollectionAge(watchedCollections));
	let showFreshness = $derived(!show && freshness?.stale);

	// Escalate to amber if data is > 15 minutes stale
	let isVeryStale = $derived(
		freshness !== null && freshness.oldestMs > 15 * 60 * 1000
	);

	async function handleRefresh() {
		isResyncing = true;
		try {
			await Promise.all(watchedCollections.map((name) => resyncCollection(name)));
		} finally {
			isResyncing = false;
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
		penalty_configs: 'Penalty Rules'
	};

	async function handleRetry() {
		isResyncing = true;
		try {
			await Promise.all(
				failedCollections.map((c) => resyncCollection(c.name))
			);
		} finally {
			isResyncing = false;
		}
	}
</script>

{#if show}
	<div class="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
		<AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
		<div class="flex-1 min-w-0 space-y-1">
			<p class="text-sm font-medium text-amber-800 dark:text-amber-300">
				Sync failed — showing cached data
			</p>
			<div class="space-y-0.5">
				{#each failedCollections as col (col.name)}
					<div class="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
						<span class="font-medium">{collectionLabels[col.name] || col.name}</span>
						{#if col.parsedError?.code}
							<code class="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded text-[10px] font-mono">{col.parsedError.code}</code>
						{/if}
						<span class="truncate">{col.parsedError?.summary || col.error || 'Unknown error'}</span>
						{#if col.parsedError?.url}
							<a
								href={col.parsedError.url}
								target="_blank"
								rel="noopener"
								class="flex-shrink-0 hover:text-amber-900 dark:hover:text-amber-200"
								title="View error docs"
							>
								<ExternalLink class="w-3 h-3" />
							</a>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		<button
			onclick={handleRetry}
			disabled={isResyncing}
			class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors cursor-pointer disabled:opacity-50"
		>
			<RefreshCw class="w-3 h-3 {isResyncing ? 'animate-spin' : ''}" />
			Retry
		</button>
	</div>
{:else if showFreshness}
	<!-- W9: Stale data freshness indicator — escalates to amber after 15 min -->
	<div class="flex items-center gap-3 px-4 py-2.5 {isVeryStale ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'} border rounded-lg mb-4">
		<div class="relative flex-shrink-0">
			<Clock class="w-3.5 h-3.5 {isVeryStale ? 'text-amber-500' : 'text-blue-500'}" />
			{#if isVeryStale}
				<span class="absolute -top-0.5 -right-0.5 flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
				</span>
			{/if}
		</div>
		<span class="text-xs {isVeryStale ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'} flex-1">
			Data last synced: {freshness?.age}
		</span>
		<button
			onclick={handleRefresh}
			disabled={isResyncing}
			class="flex items-center gap-1 px-2 py-1 text-xs font-medium {isVeryStale ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50' : 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'} rounded transition-colors cursor-pointer disabled:opacity-50"
		>
			<RefreshCw class="w-3 h-3 {isResyncing ? 'animate-spin' : ''}" />
			Refresh
		</button>
	</div>
{/if}
