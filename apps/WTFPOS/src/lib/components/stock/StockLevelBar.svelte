<script lang="ts">
	import { cn } from '$lib/utils';
	import type { StockStatus } from '$lib/stores/stock.svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	interface Props {
		current: number;
		min: number;
		status: StockStatus;
		class?: string;
	}
	let { current, min, status, class: className = '' }: Props = $props();

	const widthPct = $derived(min <= 0 ? 100 : Math.min(100, Math.max(0, (current / (min * 2)) * 100)));
	
	const animatedWidth = tweened(0, {
		duration: 800,
		easing: cubicOut
	});

	$effect(() => {
		animatedWidth.set(widthPct);
	});

	function gaugeColor(status: StockStatus): string {
		if (status === 'critical') return 'bg-status-red';
		if (status === 'low')      return 'bg-status-yellow';
		if (status === 'ok' && min > 0 && current <= 2 * min) return 'bg-emerald-400';
		return 'bg-status-green';
	}

	const pct = $derived(Math.round(widthPct));
</script>

<div
	class={cn('h-2.5 w-full rounded-full bg-gray-100 overflow-hidden', className)}
	title="{pct}% of max stock ({status})"
	aria-label="Stock level: {pct}% ({status})"
	role="img"
>
	<div class={cn('h-full rounded-full', gaugeColor(status))} style="width: {$animatedWidth}%"></div>
</div>
<span class="sr-only">Stock level {pct}% — {status}</span>
