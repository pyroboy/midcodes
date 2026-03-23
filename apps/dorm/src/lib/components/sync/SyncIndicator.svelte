<script lang="ts">
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import { CheckCircle, AlertCircle, Loader2, ArrowUpFromLine, ChevronDown, Pause, CircleDot } from 'lucide-svelte';
	import SyncDetailModal from './SyncDetailModal.svelte';

	let showModal = $state(false);

	// Use the single source of truth from syncStatus store
	let status = $derived(syncStatus.statusLabel);
</script>

<button
	onclick={() => (showModal = true)}
	class="relative flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
	title={status.label}
	aria-label="Open sync status details"
	aria-haspopup="dialog"
>
	{#if status.state === 'in-sync'}
		<CheckCircle class="w-3.5 h-3.5 text-emerald-600" />
		<span class="text-xs text-emerald-600 hidden sm:inline">{status.label}</span>
	{:else if status.state === 'saving'}
		<ArrowUpFromLine class="w-3.5 h-3.5 text-amber-700 animate-pulse" />
		<span class="text-xs text-amber-700 hidden sm:inline">{status.label}</span>
	{:else if status.state === 'syncing'}
		<Loader2 class="w-3.5 h-3.5 text-blue-500 animate-spin" />
		<span class="text-xs text-blue-500 hidden sm:inline">{status.label}</span>
		{#if status.detail}
			<span class="text-xs text-muted-foreground hidden sm:inline">{status.detail}</span>
		{/if}
	{:else if status.state === 'paused'}
		<Pause class="w-3.5 h-3.5 text-amber-700" />
		<span class="text-xs text-amber-700 hidden sm:inline">{status.label}</span>
	{:else if status.state === 'error'}
		<AlertCircle class="w-3.5 h-3.5 text-red-600" />
		<span class="text-xs text-red-600 hidden sm:inline">{status.label}</span>
	{:else if status.state === 'unsaved'}
		<CircleDot class="w-3.5 h-3.5 text-orange-500" />
		<span class="text-xs text-orange-500 hidden sm:inline">{status.label}</span>
		{#if status.detail}
			<span class="text-xs text-muted-foreground hidden sm:inline">{status.detail}</span>
		{/if}
	{:else if status.state === 'errors'}
		<AlertCircle class="w-3.5 h-3.5 text-amber-700" />
		<span class="text-xs text-amber-700 hidden sm:inline">{status.label}</span>
	{:else}
		<Loader2 class="w-3.5 h-3.5 text-muted-foreground" />
		<span class="text-xs text-muted-foreground hidden sm:inline">{status.label}</span>
	{/if}
	<ChevronDown class="w-3 h-3 text-muted-foreground" />
</button>

<SyncDetailModal bind:open={showModal} />
