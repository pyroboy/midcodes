<script>
	import Header from './Header.svelte';
	import '../app.css';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>
		{@render children?.()}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		/* Remove margin-top since Header is not being used */
	}
</style>