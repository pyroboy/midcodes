<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	
	onMount(() => {
		theme.init();
	});
</script>

<main class="min-h-screen bg-background text-foreground transition-colors duration-300">
	<slot />
</main>