<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, class: className = '', ...restProps }: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props();
</script>

<div class="flex flex-col space-y-1.5 p-6 {className}" {...restProps}>
	{@render children?.()}
</div>
