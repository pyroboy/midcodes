<script lang="ts">
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-svelte';
	import SyncDetailModal from './SyncDetailModal.svelte';

	let showModal = $state(false);

	let indicatorColor = $derived.by(() => {
		switch (syncStatus.phase) {
			case 'syncing':
			case 'initializing':
				return 'text-blue-500';
			case 'complete':
				return syncStatus.hasErrors ? 'text-amber-500' : 'text-emerald-500';
			case 'error':
				return 'text-red-500';
			default:
				return 'text-muted-foreground';
		}
	});

	let pulseClass = $derived(
		syncStatus.phase === 'syncing' || syncStatus.phase === 'initializing' ? 'animate-pulse' : ''
	);

	let tooltipText = $derived.by(() => {
		switch (syncStatus.phase) {
			case 'syncing':
				return `Syncing ${syncStatus.syncedCount}/${syncStatus.totalCount}...`;
			case 'complete':
				return syncStatus.hasErrors
					? `Synced with ${syncStatus.errorCollections.length} error(s)`
					: 'All data synced';
			case 'error':
				return 'Sync error — click for details';
			default:
				return 'Offline data status';
		}
	});

	let showDataAge = $derived(
		syncStatus.dataAge !== null &&
		syncStatus.dataAge !== 'just now' &&
		(syncStatus.phase === 'error' || syncStatus.hasErrors)
	);
</script>

<button
	onclick={() => (showModal = true)}
	class="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
	title={tooltipText}
>
	{#if syncStatus.phase === 'syncing' || syncStatus.phase === 'initializing'}
		<Loader2 class="w-3.5 h-3.5 {indicatorColor} animate-spin" />
		<span class="text-xs text-muted-foreground hidden sm:inline">
			{syncStatus.syncedCount}/{syncStatus.totalCount}
		</span>
	{:else if syncStatus.phase === 'complete' && !syncStatus.hasErrors}
		<CheckCircle class="w-3.5 h-3.5 {indicatorColor}" />
	{:else if syncStatus.hasErrors || syncStatus.phase === 'error'}
		<AlertCircle class="w-3.5 h-3.5 {indicatorColor}" />
		{#if showDataAge}
			<span class="text-xs text-muted-foreground hidden sm:inline">
				Last sync: {syncStatus.dataAge}
			</span>
		{/if}
	{:else}
		<Database class="w-3.5 h-3.5 {indicatorColor} {pulseClass}" />
	{/if}
</button>

<SyncDetailModal bind:open={showModal} />
