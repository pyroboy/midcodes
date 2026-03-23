<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { Target, Search, Calendar, Zap, MessageSquare, User, Building2, Menu, X } from 'lucide-svelte';

	let { children }: { children: Snippet } = $props();
	let showMobileMenu = $state(false);

	// Auto-login with mock user for demo
	onMount(() => {
		if (!authStore.isAuthenticated) {
			authStore.setUser({
				id: 'usr-demo12345',
				email: 'juan@courtsniper.ph',
				name: 'Juan Dela Cruz',
				role: 'player',
				skillLevel: 'intermediate',
				phone: '+63 917 123 4567',
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}
	});

	const navItems = [
		{ href: '/', label: 'Find Courts', icon: Search },
		{ href: '/bookings', label: 'My Bookings', icon: Calendar },
		{ href: '/snipes', label: 'My Snipes', icon: Zap },
		{ href: '/community', label: 'Community', icon: MessageSquare },
		{ href: '/profile', label: 'Profile', icon: User }
	];

	function isActive(href: string): boolean {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="flex h-screen">
	<!-- Desktop Sidebar -->
	<aside class="hidden md:flex w-64 flex-col border-r border-border bg-background">
		<div class="flex h-16 items-center gap-2 border-b border-border px-6">
			<div class="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
				<Target class="h-3.5 w-3.5 text-primary-foreground" />
			</div>
			<span class="text-sm font-bold">Court Sniper</span>
		</div>

		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<item.icon class="h-4 w-4" />
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Venue link + user info -->
		<div class="border-t border-border p-3 space-y-1">
			<a
				href="/venue/dashboard"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
			>
				<Building2 class="h-4 w-4" />
				Venue Dashboard
			</a>
		</div>

		{#if authStore.user}
			<div class="border-t border-border p-4">
				<a href="/profile" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
						{authStore.user.name.charAt(0).toUpperCase()}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{authStore.user.name}</p>
						<p class="truncate text-xs text-muted-foreground">{authStore.user.email}</p>
					</div>
				</a>
			</div>
		{/if}
	</aside>

	<!-- Mobile bottom nav -->
	<div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden">
		<nav class="flex items-center justify-around px-2 py-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors {isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}"
				>
					<item.icon class="h-5 w-5" />
					{item.label.split(' ').pop()}
				</a>
			{/each}
		</nav>
	</div>

	<!-- Main Content -->
	<main class="flex-1 overflow-auto bg-muted/30 pb-16 md:pb-0">
		{@render children()}
	</main>
</div>
