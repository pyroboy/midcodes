<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		filter?: Snippet;
		kpis: Snippet;
		chart: Snippet;
		content: Snippet;
		alerts?: Snippet;
	}

	let { filter, kpis, chart, content, alerts }: Props = $props();
</script>

<!-- TOPMOST zone: filter + KPIs — strict height, KPIs stretch to fill unused space -->
<div class="relative h-[200px] shrink-0 flex flex-col print:h-auto print:overflow-visible">
	{#if alerts}
		<div class="absolute inset-x-0 top-0 z-10">{@render alerts()}</div>
	{/if}
	{#if filter}
		<div class="mb-4 shrink-0">{@render filter()}</div>
	{/if}
	<div class="flex-1 flex flex-col">{@render kpis()}</div>
</div>

<!-- CHART zone: min height ensures consistency, but expands naturally for taller charts -->
<div class="mt-4 mb-5 min-h-[280px] flex flex-col print:min-h-0">
	<div class="flex-1 flex flex-col">{@render chart()}</div>
</div>

<!-- CONTENT zone: tables, details — scrollable remainder -->
{@render content()}
