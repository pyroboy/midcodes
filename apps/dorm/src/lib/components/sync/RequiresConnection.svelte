<script lang="ts">
	import { onlineStatus } from '$lib/utils/offline.svelte';
	import { WifiOff } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		fallback = 'Requires internet connection',
		children
	}: {
		fallback?: string;
		children: Snippet;
	} = $props();
</script>

{#if onlineStatus.value}
	{@render children()}
{:else}
	<div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-dashed border-muted-foreground/30 rounded-md opacity-60 cursor-not-allowed select-none">
		<WifiOff class="w-3.5 h-3.5 text-muted-foreground" />
		<span class="text-xs text-muted-foreground">{fallback}</span>
	</div>
{/if}
