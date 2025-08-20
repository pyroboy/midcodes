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
	import MobileHeader from '$lib/components/MobileHeader.svelte';
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

	onMount(async () => {
		try {
			await loadGoogleFonts();
		} catch (error) {
			console.error('Failed to load fonts:', error);
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

<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
	{#if data.user}
		<!-- Mobile Header -->
		<MobileHeader user={data.user} onMenuToggle={toggleMenu} />

		<!-- Hamburger Menu -->
		<HamburgerMenu isOpen={isMenuOpen} user={data.user} onClose={closeMenu} />

		<!-- Main Content with proper spacing -->
		<main class="lg:ml-64">
			<!-- Content padding to account for fixed header and bottom nav -->
			<div class="pt-0 pb-20 lg:pb-4 min-h-screen">
				{@render children()}
			</div>
		</main>

		<!-- Bottom Navigation -->
		<BottomNavigation user={data.user} />
	{:else}
		<!-- Unauthenticated layout - simple header -->
		<header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
			<div class="container mx-auto px-4">
				<div class="flex justify-between items-center h-16">
					<a href="/" class="flex items-center gap-2">
						<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"
								/>
							</svg>
						</div>
						<span class="text-xl font-bold text-gray-900 dark:text-white"> ID Generator </span>
					</a>

					<a
						href="/auth"
						class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
					>
						Sign In
					</a>
				</div>
			</div>
		</header>

		<main class="min-h-screen">
			{@render children()}
		</main>
	{/if}
</div>

<!-- Toast notifications -->
<Toaster richColors closeButton />

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
</style>
