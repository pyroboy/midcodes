<script lang="ts">
	import { Loader2, Check, AlertTriangle, RefreshCw, Cloud } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let {
		syncState = 'synced',
		pendingCount = 0,
		onRetry
	}: {
		syncState: 'synced' | 'pending' | 'syncing';
		pendingCount: number;
		onRetry?: () => void;
	} = $props();
</script>

{#if syncState === 'synced'}
	<Tooltip.Root delayDuration={300}>
		<Tooltip.Trigger>
			<div
				class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium"
			>
				<Check class="h-3 w-3" />
				<span>Synced</span>
			</div>
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom">
			<p>All layers uploaded to cloud</p>
		</Tooltip.Content>
	</Tooltip.Root>
{:else if syncState === 'syncing'}
	<div
		class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium"
	>
		<Loader2 class="h-3 w-3 animate-spin" />
		<span>Syncing...</span>
	</div>
{:else if syncState === 'pending'}
	<Tooltip.Root delayDuration={300}>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="sm"
					class="h-7 px-2 gap-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
					onclick={onRetry}
				>
					<AlertTriangle class="h-3 w-3" />
					<span class="text-xs font-medium">{pendingCount} pending</span>
					<RefreshCw class="h-3 w-3" />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom">
			<p>Click to upload {pendingCount} layer{pendingCount !== 1 ? 's' : ''} to cloud</p>
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
