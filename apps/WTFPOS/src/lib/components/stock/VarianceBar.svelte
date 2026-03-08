<script lang="ts">
	import { cn } from '$lib/utils';
	
	interface Props {
		expected: number;
		drift: number | null; // positive = missing, negative = surplus
		class?: string;
	}
	let { expected, drift, class: className = '' }: Props = $props();

	// Calculate percentage drift for the bar
	// Maximum visual drift bounded at ±50% of expected for rendering scale
	const maxVisualDrift = $derived(expected * 0.5);
	
	const pct = $derived(
		drift === null || expected === 0 ? 0 :
		Math.max(-100, Math.min(100, (drift / maxVisualDrift) * 100))
	);

	const driftLabel = $derived(
		drift === null ? 'No count' : drift === 0 ? 'Balanced' : drift > 0 ? `Short ${drift} units` : `Surplus ${Math.abs(drift)} units`
	);
</script>

<div
	class={cn('relative h-2 w-full max-w-[120px] rounded-full bg-gray-100 mx-auto overflow-hidden', className)}
	title={driftLabel}
	aria-label={driftLabel}
	role="img"
>
	<!-- Center baseline indicator -->
	<div class="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 z-10"></div>

	{#if drift !== null && drift !== 0}
		<!--
			If drift > 0 (Missing) => Red bar projecting LEFT of center
			If drift < 0 (Surplus) => Green bar projecting RIGHT of center
		-->
		<div
			class={cn(
				'absolute top-0 bottom-0 transition-all',
				drift > 0 ? 'bg-status-red right-1/2 rounded-l-full' : 'bg-status-green left-1/2 rounded-r-full'
			)}
			style="width: {Math.abs(pct) / 2}%"
		></div>
	{/if}
</div>
<span class="sr-only">{driftLabel}</span>
