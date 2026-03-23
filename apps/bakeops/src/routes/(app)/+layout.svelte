<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { initAbly } from '$lib/ably';

	let { children, data } = $props();

	const nav = [
		{ href: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/ingredients', label: 'Ingredients', icon: '🧈' },
		{ href: '/recipes', label: 'Recipes', icon: '📋' },
		{ href: '/batches', label: 'Batches', icon: '🍪' },
		{ href: '/pricing', label: 'Pricing', icon: '💰' }
	];

	let sidebarOpen = $state(false);

	onMount(() => {
		initAbly().catch(console.error);
	});

	async function logout() {
		await fetch('/api/auth/sign-out', { method: 'POST' });
		window.location.href = '/login';
	}
</script>

<div class="min-h-screen bg-amber-50 flex">
	<!-- Sidebar -->
	<aside class="hidden md:flex md:w-64 bg-amber-900 text-white flex-col">
		<div class="p-6">
			<h1 class="text-2xl font-bold">BakeOps</h1>
			<p class="text-amber-300 text-sm mt-1">{data.user.name}</p>
		</div>
		<nav class="flex-1 px-4 space-y-1">
			{#each nav as item}
				<a href={item.href}
					class="flex items-center gap-3 px-4 py-3 rounded-lg transition
						{$page.url.pathname.startsWith(item.href) ? 'bg-amber-800 text-white' : 'text-amber-200 hover:bg-amber-800'}">
					<span>{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
		<div class="p-4">
			<button onclick={logout} class="w-full px-4 py-2 text-amber-200 hover:text-white hover:bg-amber-800 rounded-lg transition text-left">
				Sign Out
			</button>
		</div>
	</aside>

	<!-- Mobile header -->
	<div class="md:hidden fixed top-0 left-0 right-0 bg-amber-900 text-white p-4 flex items-center justify-between z-50">
		<h1 class="text-xl font-bold">BakeOps</h1>
		<button onclick={() => sidebarOpen = !sidebarOpen} class="text-2xl">☰</button>
	</div>

	{#if sidebarOpen}
		<div class="md:hidden fixed inset-0 z-40">
			<div class="absolute inset-0 bg-black/50" onclick={() => sidebarOpen = false}></div>
			<aside class="absolute left-0 top-0 bottom-0 w-64 bg-amber-900 text-white flex flex-col">
				<div class="p-6">
					<h1 class="text-2xl font-bold">BakeOps</h1>
				</div>
				<nav class="flex-1 px-4 space-y-1">
					{#each nav as item}
						<a href={item.href} onclick={() => sidebarOpen = false}
							class="flex items-center gap-3 px-4 py-3 rounded-lg transition
								{$page.url.pathname.startsWith(item.href) ? 'bg-amber-800' : 'text-amber-200 hover:bg-amber-800'}">
							<span>{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/each}
				</nav>
			</aside>
		</div>
	{/if}

	<!-- Main content -->
	<main class="flex-1 md:p-8 p-4 md:pt-8 pt-20 overflow-auto">
		{@render children()}
	</main>
</div>
