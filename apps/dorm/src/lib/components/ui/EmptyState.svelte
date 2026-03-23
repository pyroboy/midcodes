<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentType } from 'svelte';

	let {
		icon,
		title,
		description = '',
		compact = false,
		action
	}: {
		icon?: ComponentType;
		title: string;
		description?: string;
		compact?: boolean;
		action?: Snippet;
	} = $props();
</script>

<div
	class="flex flex-col items-center justify-center text-center {compact
		? 'py-6 px-4'
		: 'py-12 px-6'} bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20"
>
	{#if icon}
		{@const Icon = icon}
		<Icon class="h-12 w-12 text-muted-foreground/50 mb-4" />
	{/if}
	<h3 class="text-lg font-medium text-foreground mb-1">{title}</h3>
	{#if description}
		<p class="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
	{/if}
	{#if action}
		<div class="mt-2">
			{@render action()}
		</div>
	{/if}
</div>
