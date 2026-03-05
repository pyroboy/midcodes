<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import TopBar from '$lib/components/TopBar.svelte';
	import { session, ADMIN_ROLES } from '$lib/stores/session.svelte';
	import { goto } from '$app/navigation';

	let { children }: { children: import('svelte').Snippet } = $props();

	// Guard: non-admin roles get redirected
	$effect(() => {
		if (!ADMIN_ROLES.includes(session.role)) goto('/pos');
	});

	let currentRoute = $derived(page.url.pathname);

	const tabs = [
		{ href: '/admin/users', label: '👤 Users' },
		{ href: '/admin/menu',  label: '📋 Menu Editor' },
		{ href: '/admin/logs',  label: '📋 Activity Logs' },
		{ href: '/admin/floor-editor', label: '🪑 Floor Editor' },
		{ href: '/admin/devices', label: '💻 Devices' }
	];
</script>

<div class="flex h-screen flex-col overflow-hidden bg-surface-secondary">
	<TopBar />

	<div class="shrink-0 bg-white border-b border-border px-6 py-3 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
			<span class="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
				{session.locationId === 'all' ? '🌐 All Locations' : session.locationId.toUpperCase()}
			</span>
		</div>
		<nav class="flex space-x-1">
			{#each tabs as tab}
				<a
					href={tab.href}
					class={cn(
						"px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
						currentRoute === tab.href
							? "bg-accent/10 text-accent font-semibold"
							: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					)}
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="flex-1 overflow-auto p-6">
		{@render children()}
	</div>
</div>
