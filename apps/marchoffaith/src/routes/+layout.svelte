<script>
	import Header from '$lib/components/Header.svelte';
	import '../app.css';
</script>

<div class="flex flex-col min-h-screen">
	<Header />

	<main class="flex-1 flex flex-col p-4 w-full max-w-[64rem] mx-auto box-border">
		<slot />
	</main>

	<footer class="flex flex-col justify-center items-center py-3 px-0">
		<p>visit <a href="https://kit.svelte.dev" class="font-bold hover:text-purple-600 transition-colors">kit.svelte.dev</a> to learn SvelteKit</p>
	</footer>
</div>
