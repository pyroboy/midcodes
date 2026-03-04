<script lang="ts">
	import '../app.css';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import { initConnectionMonitor } from '$lib/stores/connection.svelte';
	import { onMount } from 'svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	onMount(() => {
		initConnectionMonitor();
	});
</script>

<ConnectionStatus />
{@render children()}
