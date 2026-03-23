<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { Target, LayoutDashboard, Calendar, Dumbbell, TrendingUp, Settings, User, Menu, X } from 'lucide-svelte';

	let { children }: { children: Snippet } = $props();
	let showMobileMenu = $state(false);

	const navItems = [
		{ href: '/venue/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/venue/bookings', label: 'Bookings', icon: Calendar },
		{ href: '/venue/courts', label: 'Courts', icon: Dumbbell },
		{ href: '/venue/revenue', label: 'Revenue', icon: TrendingUp },
		{ href: '/venue/settings', label: 'Settings', icon: Settings }
	];

	function isActive(href: string): boolean {
		return $page.url.pathname === href;
	}
</script>

<div class="flex h-screen">
	<!-- Desktop Sidebar -->
	<aside class="hidden md:flex w-64 flex-col bg-gray-900 text-white">
		<!-- Venue branding -->
		<div class="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
				<Target class="h-4 w-4 text-primary-foreground" />
			</div>
			<div class="min-w-0">
				<p class="truncate text-sm font-bold">Bohol Pickle Hub</p>
				<p class="text-[10px] text-gray-400">Venue Manager</p>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {isActive(item.href) ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}"
				>
					<item.icon class="h-4 w-4" />
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Player view link -->
		<div class="border-t border-white/10 p-3">
			<a
				href="/"
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
			>
				<User class="h-4 w-4" />
				Player View
			</a>
		</div>
	</aside>

	<!-- Mobile header -->
	<div class="flex flex-1 flex-col">
		<header class="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
			<div class="flex items-center gap-2">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
					<Target class="h-3.5 w-3.5 text-primary-foreground" />
				</div>
				<span class="text-sm font-bold">Bohol Pickle Hub</span>
			</div>
			<button onclick={() => { showMobileMenu = !showMobileMenu; }} class="rounded-lg p-2 hover:bg-muted transition-colors">
				{#if showMobileMenu}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
		</header>

		<!-- Mobile menu overlay -->
		{#if showMobileMenu}
			<div class="fixed inset-0 z-50 bg-black/50 md:hidden" onclick={() => { showMobileMenu = false; }}>
				<div class="absolute right-0 top-0 h-full w-64 bg-gray-900 text-white p-4" onclick={(e) => e.stopPropagation()}>
					<div class="mb-6 flex items-center justify-between">
						<span class="text-sm font-bold">Menu</span>
						<button onclick={() => { showMobileMenu = false; }} class="rounded-lg p-1 hover:bg-white/10">
							<X class="h-5 w-5" />
						</button>
					</div>
					<nav class="space-y-1">
						{#each navItems as item}
							<a
								href={item.href}
								onclick={() => { showMobileMenu = false; }}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {isActive(item.href) ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}"
							>
								<item.icon class="h-4 w-4" />
								{item.label}
							</a>
						{/each}
					</nav>
					<div class="mt-6 border-t border-white/10 pt-4">
						<a
							href="/"
							class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
						>
							<User class="h-4 w-4" />
							Player View
						</a>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main content -->
		<main class="flex-1 overflow-auto bg-muted/30">
			{@render children()}
		</main>
	</div>
</div>
