<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Menu, X, Sparkles } from 'lucide-svelte';

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	const navigation = [
		{ name: 'Features', href: '/features' },
		{ name: 'Pricing', href: '/pricing' },
		{ name: 'Templates', href: '/templates' },
		{ name: 'Support', href: '/support' }
	];
</script>

<header class="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
	<nav class="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
		<div class="flex w-full items-center justify-between py-4">
			<!-- Logo -->
			<div class="flex items-center">
				<a href="/" class="flex items-center space-x-2">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"
					>
						<Sparkles class="h-6 w-6 text-white" />
					</div>
					<div>
						<div class="text-xl font-bold text-gray-900">ID-Gen</div>
						<div class="text-xs text-gray-500">Professional ID Cards</div>
					</div>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden md:block">
				<div class="flex items-center space-x-8">
					{#each navigation as item}
						<a
							href={item.href}
							class="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
						>
							{item.name}
						</a>
					{/each}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center space-x-4">
				<div class="hidden sm:flex items-center space-x-3">
					<Button variant="ghost" href="/auth">Sign In</Button>
					<Button href="/auth?mode=signup">Start Free Trial</Button>
				</div>

				<!-- Mobile menu button -->
				<div class="md:hidden">
					<Button variant="ghost" size="sm" onclick={toggleMenu}>
						{#if isMenuOpen}
							<X class="h-5 w-5" />
						{:else}
							<Menu class="h-5 w-5" />
						{/if}
					</Button>
				</div>
			</div>
		</div>

		<!-- Mobile Navigation -->
		{#if isMenuOpen}
			<div class="md:hidden border-t border-gray-200 bg-white py-4">
				<div class="space-y-3">
					{#each navigation as item}
						<a
							href={item.href}
							class="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
							onclick={toggleMenu}
						>
							{item.name}
						</a>
					{/each}
					<div class="border-t border-gray-200 pt-3 mt-3 px-4 space-y-2">
						<Button variant="ghost" class="w-full justify-start" href="/auth">Sign In</Button>
						<Button class="w-full" href="/auth?mode=signup">Start Free Trial</Button>
					</div>
				</div>
			</div>
		{/if}
	</nav>
</header>
