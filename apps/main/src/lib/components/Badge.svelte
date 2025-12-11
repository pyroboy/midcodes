<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	
	interface Props {
		class?: string;
		children: Snippet;
	}
	
	let { class: className, children }: Props = $props();
</script>

<span class={cn("inline-flex items-center rounded-full font-medium", className)}>
	{@render children()}
</span>