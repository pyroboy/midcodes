<script lang="ts">
	import '../app.postcss';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<meta name="description" content="Tattoo AI - Booking Agent & CRM" />
</svelte:head>

<div class="min-h-screen bg-background">
	{@render children()}
</div>
