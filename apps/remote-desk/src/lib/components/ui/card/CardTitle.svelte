<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, class: className = '', ...restProps }: HTMLAttributes<HTMLHeadingElement> & { children?: Snippet } = $props();
</script>

<h3 class="text-2xl font-semibold leading-none tracking-tight {className}" {...restProps}>
	{@render children?.()}
</h3>
