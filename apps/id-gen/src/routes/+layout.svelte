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
	import { Toaster } from '$lib/components/ui/sonner';

	let { data, children }: LayoutProps = $props();

	// State for mobile menu
	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

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
	{#if data.user}
		<!-- Mobile Header -->
		<MobileHeader user={data.user} onMenuToggle={toggleMenu} class="lg:hidden" />

		<!-- Desktop Header (hidden on mobile) -->
		<DesktopHeader user={data.user} class="hidden lg:block" />

		<!-- Hamburger Menu -->
		<HamburgerMenu isOpen={isMenuOpen} user={data.user} onClose={closeMenu} />

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
