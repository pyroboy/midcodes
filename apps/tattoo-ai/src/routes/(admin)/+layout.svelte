<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, Calendar, Users, Settings, LogOut, Flame, MessageSquare, Bot, Workflow, Hash, FileText, Sliders, MessageCircle } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const navigation = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/calendar', label: 'Calendar', icon: Calendar },
		{ href: '/clients', label: 'Clients', icon: Users },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	const chatbotNavigation = [
		{ href: '/chatbot', label: 'Chatbot', icon: Bot },
		{ href: '/chatbot/flows/booking', label: 'Flow Editor', icon: Workflow },
		{ href: '/chatbot/keywords', label: 'Keywords', icon: Hash },
		{ href: '/chatbot/templates', label: 'Templates', icon: FileText },
		{ href: '/chatbot/settings', label: 'Bot Settings', icon: Sliders },
		{ href: '/chatbot/preview', label: 'Chat Preview', icon: MessageCircle }
	];

	let mobileMenuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === '/chatbot') return page.url.pathname === '/chatbot';
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="flex min-h-screen bg-background">
	<!-- Sidebar (desktop) -->
	<aside class="hidden lg:flex lg:w-64 flex-col bg-card border-r border-border">
		<div class="p-6 border-b border-border">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
					<Flame class="w-5 h-5 text-primary" />
				</div>
				<div>
					<h2 class="text-lg font-display font-bold text-foreground tracking-wide uppercase">Tattoo AI</h2>
					<p class="text-xs text-muted-foreground font-mono">CRM & Booking</p>
				</div>
			</div>
		</div>

		<nav class="flex-1 p-4 space-y-1 overflow-y-auto">
			{#each navigation as item (item.href)}
				<a
					href={item.href}
					class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium {isActive(item.href)
						? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
				>
					<item.icon class="w-4 h-4" />
					<span>{item.label}</span>
				</a>
			{/each}

			<div class="pt-4 pb-2">
				<p class="px-4 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">Chatbot Builder</p>
			</div>

			{#each chatbotNavigation as item (item.href)}
				<a
					href={item.href}
					class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium {isActive(item.href)
						? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
				>
					<item.icon class="w-4 h-4" />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="p-4 border-t border-border">
			<button
				class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition text-sm font-medium"
			>
				<LogOut class="w-4 h-4" />
				<span>Logout</span>
			</button>
		</div>
	</aside>

	<!-- Mobile top bar -->
	<div class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Flame class="w-5 h-5 text-primary" />
			<span class="font-display font-bold text-foreground uppercase text-sm tracking-wide">Tattoo AI</span>
		</div>
		<button
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			class="p-2 rounded-lg hover:bg-muted transition"
		>
			<MessageSquare class="w-5 h-5 text-foreground" />
		</button>
	</div>

	{#if mobileMenuOpen}
		<!-- Mobile menu overlay -->
		<div class="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
			<div class="pt-16 p-6 space-y-2 overflow-y-auto max-h-screen">
				{#each navigation as item (item.href)}
					<a
						href={item.href}
						onclick={() => (mobileMenuOpen = false)}
						class="flex items-center gap-3 px-4 py-4 rounded-lg transition text-sm font-medium {isActive(item.href)
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
					>
						<item.icon class="w-5 h-5" />
						<span>{item.label}</span>
					</a>
				{/each}

				<div class="pt-4 pb-2">
					<p class="px-4 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">Chatbot Builder</p>
				</div>

				{#each chatbotNavigation as item (item.href)}
					<a
						href={item.href}
						onclick={() => (mobileMenuOpen = false)}
						class="flex items-center gap-3 px-4 py-4 rounded-lg transition text-sm font-medium {isActive(item.href)
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
					>
						<item.icon class="w-5 h-5" />
						<span>{item.label}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 overflow-auto lg:pt-0 pt-14">
		{@render children()}
	</main>
</div>
