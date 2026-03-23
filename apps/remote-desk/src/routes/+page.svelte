<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/dashboard', { replaceState: true });
	});
</script>

<div class="flex h-full items-center justify-center">
	<p class="text-muted-foreground">Redirecting...</p>
</div>
