<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, class: className = '', ...restProps }: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props();
</script>

<div class="rounded-lg border bg-card text-card-foreground shadow-sm {className}" {...restProps}>
	{@render children?.()}
</div>
