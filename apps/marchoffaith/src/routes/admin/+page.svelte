<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const cards = $derived([
		{ label: 'Articles', value: data.stats.articles, href: '/admin/articles', color: 'bg-blue-500' },
		{ label: 'Churches', value: data.stats.churches, href: '/admin/churches', color: 'bg-emerald-500' },
		{ label: 'Pastors', value: data.stats.pastors, href: '/admin/pastors', color: 'bg-purple-500' },
		{ label: 'Unread Messages', value: data.stats.unread, href: '/admin/inbox', color: 'bg-orange-500' }
	]);
</script>

<svelte:head>
	<title>Dashboard - MOFI Admin</title>
</svelte:head>

<h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

<!-- Stats -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
	{#each cards as card}
		<a href={card.href} class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
			<div class="text-3xl font-bold text-gray-900">{card.value}</div>
			<div class="text-sm text-gray-500 mt-1">{card.label}</div>
			<div class="mt-3 h-1 w-12 rounded {card.color}"></div>
		</a>
	{/each}
</div>

<!-- Recent Messages -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100">
	<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
		<h2 class="font-semibold text-gray-900">Recent Messages</h2>
		<a href="/admin/inbox" class="text-sm text-blue-600 hover:underline">View all</a>
	</div>

	{#if data.recentMessages.length === 0}
		<div class="px-5 py-8 text-center text-gray-400 text-sm">No messages yet</div>
	{:else}
		<div class="divide-y divide-gray-50">
			{#each data.recentMessages as msg}
				<div class="px-5 py-3 flex items-start gap-3">
					<div class="w-2 h-2 rounded-full mt-2 shrink-0 {msg.isRead ? 'bg-gray-200' : 'bg-orange-500'}"></div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline gap-2">
							<span class="font-medium text-sm text-gray-900">{msg.name}</span>
							<span class="text-xs text-gray-400">{msg.email}</span>
						</div>
						<p class="text-sm text-gray-500 truncate">{msg.message}</p>
					</div>
					<span class="text-xs text-gray-400 shrink-0">
						{new Date(msg.createdAt).toLocaleDateString()}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
