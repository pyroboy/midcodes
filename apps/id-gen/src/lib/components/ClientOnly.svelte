<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { children } = $props<{ children: any }>();
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

{#if browser && mounted}
	{@render children?.()}
{/if}
