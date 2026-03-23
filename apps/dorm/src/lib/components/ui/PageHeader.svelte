<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle = '',
		actions,
		filters
	}: {
		title: string;
		subtitle?: string;
		actions?: Snippet;
		filters?: Snippet;
	} = $props();
</script>

<div class="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-4 border-b">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<div>
			<h1 class="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
				{title}
			</h1>
			{#if subtitle}
				<p class="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex items-center gap-2 shrink-0">
				{@render actions()}
			</div>
		{/if}
	</div>
	{#if filters}
		<div class="mt-3">
			{@render filters()}
		</div>
	{/if}
</div>
