<script lang="ts">
	// Define our own LayoutProps interface since the $types import is missing
	interface LayoutProps {
		data: any;
		children: any;
	}

	import '$lib/utils/setup-logging';
	import '../app.css';
	import { onMount } from 'svelte';
	import { loadGoogleFonts } from '$lib/config/fonts';
	import { setupGlobalErrorHandlers } from '$lib/utils/errorHandling';
	import { theme } from '$lib/stores/theme';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import DesktopHeader from '$lib/components/DesktopHeader.svelte';
	import BottomNavigation from '$lib/components/BottomNavigation.svelte';
	import HamburgerMenu from '$lib/components/HamburgerMenu.svelte';
	import { initPreloadService, updateCurrentPath } from '$lib/services/preloadService';

	import NavigationLoader from '$lib/components/NavigationLoader.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	// Remote-function + route snapshot caches should be scoped per (user+org)
	// and cleared when those change (sign-out / org switch).
	import { clearRemoteFunctionCacheForScope } from '$lib/remote/remoteFunctionCache';
	import { clearAllIdsCache } from './all-ids/allIdsCache';

	let { data, children }: LayoutProps = $props();

	// State for mobile menu
	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	// Stop role emulation
	async function stopEmulation() {
		try {
			const res = await fetch('/api/admin/stop-emulation', { method: 'POST' });
			if (res.ok) {
				window.location.reload();
			} else {
				console.error('Failed to stop emulation');
				alert('Failed to stop emulation. Please try again.');
			}
		} catch (e) {
			console.error('Error stopping emulation:', e);
			alert('Error stopping emulation.');
		}
	}

	function formatRoleName(role: string) {
		return role
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Initialize services
	$effect(() => {
		if (browser) {
			// initAnalytics(); // Not in original, not adding
			// initLogging(); // Not in original, not adding
			
			// Initialize smart preloading
			const cleanupPreload = initPreloadService();
			
			return () => {
				cleanupPreload?.();
			};
		}
	});
	
	// Track current path for preload service
	$effect(() => {
		if (browser) {
			updateCurrentPath($page.url.pathname);
		}
	});

	// Clear caches on (user+org) change to avoid cross-tenant leakage and stale state.
	let lastScopeKey: string | null = null;

	$effect(() => {
		if (!browser) return;

		const d = $page.data as any;
		const userId = d?.user?.id ?? null;
		const orgId = d?.org_id ?? null;

		// No scope when unauthenticated or missing org.
		const scopeKey = userId && orgId ? `${userId}:${orgId}` : null;

		// On any change, clear previous scope's caches.
		if (lastScopeKey && lastScopeKey !== scopeKey) {
			clearRemoteFunctionCacheForScope(lastScopeKey);
			clearAllIdsCache(lastScopeKey);
		}

		lastScopeKey = scopeKey;
	});

	// Initialize theme on mount
	onMount(async () => {
		try {
			setupGlobalErrorHandlers();
			await loadGoogleFonts();

			// Initialize theme store (this will apply stored theme or default)
			// The theme store already handles DOM application in its initialization
			const currentTheme = theme.getCurrentTheme();
			console.log('Theme initialized:', currentTheme);
		} catch (error) {
			console.error('Failed to initialize app:', error);
		}
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com" rel="preconnect" />
	<link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Playfair+Display:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-background text-foreground theme-transition">
	<!-- Navigation Loading Overlay -->
	<NavigationLoader />
	
	{#if data.user}
		<!-- Mobile Header -->
		<MobileHeader user={data.user} onMenuToggle={toggleMenu} class="lg:hidden" />

		<!-- Desktop Header (hidden on mobile) -->
		<DesktopHeader user={data.user} class="hidden lg:block" />

		<!-- Hamburger Menu -->
		<HamburgerMenu isOpen={isMenuOpen} user={data.user} onClose={closeMenu} />

		<!-- Role Emulation Banner (Global) -->
		{#if data.roleEmulation?.active}
			<div class="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg lg:ml-64">
				<div class="px-4 py-2 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
						<span class="text-sm font-medium">
							<span class="opacity-75">{formatRoleName(data.roleEmulation.originalRole || 'Admin')}</span>
							<span class="mx-2">→</span>
							<span class="font-bold">{formatRoleName(data.roleEmulation.emulatedRole || '')}</span>
						</span>
					</div>
					<button
						onclick={stopEmulation}
						class="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-full transition-colors"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
						Stop Emulating
					</button>
				</div>
			</div>
		{/if}



		<!-- Main Content with proper spacing -->
		<main class="lg:ml-64 lg:pt-16">
			<!-- Content padding to account for fixed header and bottom nav -->
			<div class="pt-0 pb-20 lg:pb-4 min-h-screen">
				{@render children()}
			</div>
		</main>

		<!-- Sidebar integration for desktop -->
		<div
			class="hidden lg:flex lg:fixed lg:top-16 lg:left-0 lg:w-64 lg:h-[calc(100vh-4rem)] border-r border-border bg-background"
		>
			<BottomNavigation
				user={data.user}
				class="lg:flex lg:flex-col lg:w-full lg:relative lg:top-0"
			/>
		</div>

		<!-- Bottom Navigation -->
		<BottomNavigation user={data.user} />
	{:else}
		<!-- Unauthenticated layout - simple header -->
		<header class="bg-background border-b border-border sticky top-0 z-50">
			<div class="container mx-auto px-4">
				<div class="flex justify-between items-center h-16">
					<a href="/" class="flex items-center gap-2">
						<span class="text-2xl font-normal text-foreground/80">ᜃ</span>
						<span class="text-xl font-black tracking-tight text-foreground">KINATAO</span>
					</a>

					<div class="flex items-center gap-6">
					<a href="/how-it-works" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
						How It Works
					</a>
					<a href="/pricing" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
						Rates
					</a>
					<a
						href="/auth"
						class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
					>
						> Sign In
					</a>
				</div>
			</div>
			</div>
		</header>

		<main class="min-h-screen bg-background">
			{@render children()}
		</main>
	{/if}
</div>

<!-- Toast notifications -->
<Toaster richColors closeButton theme={$theme} />

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
</style>
