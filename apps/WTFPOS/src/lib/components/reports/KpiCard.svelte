<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		label: string;
		value: string;
		/** Percentage change vs. previous period. Positive = up, negative = down, null = no comparison. */
		change?: number | null;
		/** Label for the change badge, e.g. "vs yesterday" */
		changeLabel?: string;
		/** Formatted previous-period value shown as anchor (e.g. "prev: ₱6,740") */
		prevValue?: string | null;
		/** Visual variant: 'default' | 'success' | 'danger' | 'accent' */
		variant?: 'default' | 'success' | 'danger' | 'accent';
		/** Optional sub-label below the value */
		sub?: string;
	}

	let { label, value, change = null, changeLabel = 'vs prev period', prevValue = null, variant = 'default', sub }: Props = $props();

	const containerClass = $derived(cn(
		'rounded-xl border p-4',
		variant === 'success' ? 'border-status-green/20 bg-status-green-light' :
		variant === 'danger'  ? 'border-status-red/20 bg-status-red-light' :
		variant === 'accent'  ? 'border-accent/20 bg-accent-light' :
		'border-border bg-white'
	));

	const labelClass = $derived(cn(
		'text-xs font-medium uppercase tracking-wide',
		variant === 'success' ? 'text-status-green' :
		variant === 'danger'  ? 'text-status-red' :
		variant === 'accent'  ? 'text-accent' :
		'text-gray-400'
	));

	const valueClass = $derived(cn(
		'mt-1 text-2xl font-bold',
		variant === 'success' ? 'text-status-green' :
		variant === 'danger'  ? 'text-status-red' :
		variant === 'accent'  ? 'text-accent' :
		'text-gray-900'
	));

	const isUp   = $derived(change !== null && change > 0);
	const isDown = $derived(change !== null && change < 0);
	const changeAbs = $derived(change !== null ? Math.abs(change) : 0);
</script>

<div class={containerClass}>
	<p class={labelClass}>{label}</p>
	<p class={valueClass}>{value}</p>
	{#if sub}
		<p class="mt-0.5 text-xs text-gray-400">{sub}</p>
	{/if}
	{#if change !== null}
		<div class="mt-2 flex flex-col gap-0.5">
			<div class="flex items-center gap-1">
				<span class={cn(
					'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
					isUp   ? 'bg-status-green/10 text-status-green' :
					isDown ? 'bg-status-red/10 text-status-red' :
					         'bg-gray-100 text-gray-500'
				)} aria-label="{isUp ? 'Up' : isDown ? 'Down' : 'No change'} {changeAbs.toFixed(1)} percent">
					{#if isUp}▲{:else if isDown}▼{:else}—{/if}
					{changeAbs.toFixed(1)}%
				</span>
				<span class="text-[10px] text-gray-400">{changeLabel}</span>
			</div>
			{#if prevValue}
				<span class="text-[10px] text-gray-400 font-mono">prev: {prevValue}</span>
			{/if}
		</div>
	{/if}
</div>
