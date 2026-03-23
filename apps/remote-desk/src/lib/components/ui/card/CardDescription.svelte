<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, class: className = '', ...restProps }: HTMLAttributes<HTMLParagraphElement> & { children?: Snippet } = $props();
</script>

<p class="text-sm text-muted-foreground {className}" {...restProps}>
	{@render children?.()}
</p>
