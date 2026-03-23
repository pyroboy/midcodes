<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Flame } from 'lucide-svelte';

	onMount(async () => {
		await goto('/dashboard');
	});
</script>

<div class="flex flex-col items-center justify-center min-h-screen gap-4">
	<Flame class="w-10 h-10 text-primary animate-pulse" />
	<p class="text-muted-foreground font-display text-lg tracking-wide uppercase">Loading...</p>
</div>
