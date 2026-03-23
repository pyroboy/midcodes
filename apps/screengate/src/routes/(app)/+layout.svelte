<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { subscribeToScans } from '$lib/ably';

	let { children, data } = $props();
	let unsubScans: (() => void) | null = null;

	onMount(() => {
		if (typeof window !== 'undefined') {
			unsubScans = subscribeToScans();
		}
	});

	onDestroy(() => {
		unsubScans?.();
	});
</script>

<div class="min-h-screen bg-gray-900">
	<!-- Top nav -->
	<nav class="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
		<div class="flex items-center gap-6">
			<a href="/" class="text-xl font-bold text-emerald-400">ScreenGate</a>
			<a href="/screen" class="text-gray-300 hover:text-white transition">Screen</a>
			<a href="/attendance" class="text-gray-300 hover:text-white transition">Attendance</a>
			<a href="/add" class="text-gray-300 hover:text-white transition">Manage</a>
		</div>
		<div class="text-gray-400 text-sm">
			{data.user?.name ?? 'Guest'}
		</div>
	</nav>

	{@render children()}
</div>
