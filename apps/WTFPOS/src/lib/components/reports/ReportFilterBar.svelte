<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type QuickPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all';

	interface Props {
		period: string;
		onPeriodChange: (p: string) => void;
		/** Show a "Live" indicator */
		showLive?: boolean;
		/** Available period options. Defaults to today/week/month/all */
		options?: { value: string; label: string }[];
		/** Optional right-aligned action buttons/toggles */
		actions?: Snippet;
	}

	let {
		period,
		onPeriodChange,
		showLive = true,
		options = [
			{ value: 'today', label: 'Today' },
			{ value: 'week',  label: 'This Week' },
			{ value: 'month', label: 'This Month' },
			{ value: 'all',   label: 'All' },
		],
		actions,
	}: Props = $props();
</script>

<div class="flex items-center gap-2 flex-wrap">
	{#each options as opt}
		<button
			onclick={() => onPeriodChange(opt.value)}
			class={cn(
				'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
				period === opt.value
					? 'bg-accent text-white'
					: 'border border-border bg-white text-gray-500 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			{opt.label}
		</button>
	{/each}

	{#if showLive}
		<span class="ml-auto flex items-center gap-1.5 text-xs text-status-green">
			<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
			Live
		</span>
	{/if}
	{#if actions}
		<div class={cn('flex items-center gap-2', !showLive && 'ml-auto')}>{@render actions()}</div>
	{/if}
</div>
