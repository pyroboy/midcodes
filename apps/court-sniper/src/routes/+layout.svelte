<script lang="ts">
	import '../app.postcss';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Court Sniper - Find & Book Pickleball Courts</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-background text-foreground font-sans">
	{#if mounted}
		{@render children()}
	{/if}
</div>
