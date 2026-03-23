<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, class: className = '', ...restProps }: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props();
</script>

<div class="p-6 pt-0 {className}" {...restProps}>
	{@render children?.()}
</div>
