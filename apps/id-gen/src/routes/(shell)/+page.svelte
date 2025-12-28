<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { browser, dev } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		initLenis,
		destroyLenis,
		connectScrollState,
		getScrollState
	} from '$lib/marketing/scroll';
	import ClientOnly from '$lib/components/ClientOnly.svelte';
	import { MarketingScene } from '$lib/components/marketing';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Reactive scroll state
	const scrollState = getScrollState();

	// Track if 3D scene should be shown
	let show3DScene = $state(false);

	// Show debug UI only in dev mode (can be toggled with ?debug=true in production)
	let showDebugUI = $derived(
		dev || (browser && new URLSearchParams(window.location.search).has('debug'))
	);

	// If user is logged in, redirect to dashboard
	$effect(() => {
		if (browser && data.user) {
			goto('/dashboard', { replaceState: true });
		}
	});

	// Initialize smooth scroll
	onMount(() => {
		// Don't init Lenis if user will be redirected
		if (data.user) return;

		initLenis();
		const disconnectScroll = connectScrollState();

		// Delay 3D scene slightly for smooth page load
		setTimeout(() => {
			show3DScene = true;
		}, 100);

		return () => {
			disconnectScroll();
			destroyLenis();
		};
	});
</script>

<svelte:head>
	<title>Kanaya - Identity, Encoded.</title>
	<meta
		name="description"
		content="The comprehensive ID ecosystem for Schools, Government, and Events. Secure verification, instant issuance, and live attendance tracking."
	/>
</svelte:head>

<!-- Marketing Homepage - Scroll-Triggered 3D Experience -->

<!-- 3D Scene (fixed canvas behind content) -->
{#if show3DScene}
	<ClientOnly>
		<MarketingScene templateAssets={data.templateAssets} />
	</ClientOnly>
{/if}

<!-- Debug UI (dev mode only, or ?debug=true in URL) -->
{#if showDebugUI}
	<!-- Scroll Progress Indicator -->
	<div
		class="fixed top-0 left-0 h-1 bg-gradient-to-r from-white to-gray-500 z-50 transition-all duration-100"
		style="width: {scrollState.progress * 100}%"
	></div>

	<!-- Section Indicator -->
	<div
		class="fixed top-4 right-4 z-50 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs font-mono text-gray-400"
	>
		{scrollState.currentSection} ({(scrollState.sectionProgress * 100).toFixed(0)}%)
	</div>
{/if}

<!-- Content layer (scrollable, above 3D scene) -->
<div class="relative z-10 min-h-screen bg-transparent text-white">
	<!-- Hero Section Placeholder -->
	<section class="min-h-screen flex flex-col items-center justify-center px-4">
		<div class="text-center max-w-4xl mx-auto">
			<!-- Baybayin Ka Symbol -->
			<div class="text-8xl md:text-9xl font-light text-white/80 mb-8">ᜃ</div>

			<h1 class="text-5xl md:text-7xl font-black tracking-tight mb-6">
				Identity, <span
					class="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500"
					>Encoded.</span
				>
			</h1>

			<p class="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
				The comprehensive ID ecosystem for Schools, Government, and Events. Secure verification,
				instant issuance, and live attendance tracking.
			</p>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="/auth"
					class="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
				>
					Initialize Organization
				</a>
				<a
					href="/auth"
					class="px-8 py-4 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:border-gray-400 hover:text-white transition-colors"
				>
					Get Personal Card
				</a>
			</div>
		</div>

		<!-- Scroll indicator -->
		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
			<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</div>
	</section>

	<!-- Section 2a: Encode (Manual Entry vs Automation) -->
	<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
		<div
			class="text-center max-w-3xl mx-auto backdrop-blur-sm bg-black/30 p-8 rounded-3xl border border-white/5"
		>
			<span
				class="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium mb-6"
			>
				Encode
			</span>
			<h2 class="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
				Kill the Spreadsheet.
			</h2>
			<p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
				Manual entry is error-prone and slow. Eliminate typos and sync issues by encoding data
				directly into the card.
			</p>
		</div>
	</section>

	<!-- Section 2b: Scan (Visual Verification) -->
	<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
		<div class="text-center max-w-3xl mx-auto pointer-events-none">
			<span
				class="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6 backdrop-blur-md"
			>
				Verification
			</span>
			<h2
				class="text-7xl md:text-9xl font-black mb-6 tracking-tighter mix-blend-overlay text-white/50"
			>
				Scan.
			</h2>
			<p
				class="text-lg md:text-xl text-gray-300 max-w-xl mx-auto backdrop-blur-sm bg-black/20 p-4 rounded-xl"
			>
				Instant optical verification with any smartphone.
			</p>
		</div>
	</section>

	<!-- Section 2c: Tap (NFC Verification) -->
	<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
		<div class="text-center max-w-3xl mx-auto pointer-events-none">
			<span
				class="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6 backdrop-blur-md"
			>
				NFC
			</span>
			<h2
				class="text-7xl md:text-9xl font-black mb-6 tracking-tighter mix-blend-overlay text-white/50"
			>
				Tap.
			</h2>
			<p
				class="text-lg md:text-xl text-gray-300 max-w-xl mx-auto backdrop-blur-sm bg-black/20 p-4 rounded-xl"
			>
				Secure cryptographic challenge-response via NFC.
			</p>
		</div>
	</section>

	<!-- Section 3: Architecture -->
	<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
		<div class="text-center max-w-3xl mx-auto">
			<span
				class="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6"
			>
				Architecture
			</span>
			<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
				Engineered, Not Just Printed.
			</h2>
			<p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
				Our Dynamic Layer engine separates design from data. Update templates without regenerating
				thousands of cards.
			</p>
		</div>
	</section>

	<!-- Section 4: Use Cases (swapped up) -->
	<section class="min-h-[150vh] flex items-center justify-center px-6 md:px-8">
		<div class="text-center max-w-3xl mx-auto">
			<span
				class="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-6"
			>
				Applications
			</span>
			<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
				One Platform, Many Use Cases.
			</h2>
			<p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
				Schools, Dorms, Events - all unified under one flexible system.
			</p>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
				<div class="p-6 bg-white/5 rounded-xl border border-white/10">
					<div class="text-2xl mb-3">🎓</div>
					<h3 class="font-semibold mb-2">Student IDs</h3>
					<p class="text-sm text-gray-500">Library access, cafeteria, attendance tracking</p>
				</div>
				<div class="p-6 bg-white/5 rounded-xl border border-white/10">
					<div class="text-2xl mb-3">🏠</div>
					<h3 class="font-semibold mb-2">Dormitory Keys</h3>
					<p class="text-sm text-gray-500">Room access, curfew logging, visitor management</p>
				</div>
				<div class="p-6 bg-white/5 rounded-xl border border-white/10">
					<div class="text-2xl mb-3">🎪</div>
					<h3 class="font-semibold mb-2">Event Passes</h3>
					<p class="text-sm text-gray-500">VIP zones, session tracking, networking</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 5: Testimonials / Scale -->
	<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
		<div class="text-center max-w-3xl mx-auto">
			<span
				class="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6"
			>
				Impact
			</span>
			<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">System Scale.</h2>
			<div class="grid grid-cols-2 gap-8 mb-8">
				<div>
					<div class="text-4xl md:text-5xl font-black text-white mb-2">1.2M+</div>
					<p class="text-gray-500">Verifications Logged</p>
				</div>
				<div>
					<div class="text-4xl md:text-5xl font-black text-white mb-2">24</div>
					<p class="text-gray-500">Active Partners</p>
				</div>
			</div>
			<p class="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
				Trusted by schools, government offices, and event organizers across the Philippines.
			</p>
		</div>
	</section>

	<!-- Section 6: Segmentation (moved here) -->
	<section class="min-h-screen flex items-center justify-center px-0">
		<div class="flex flex-col md:flex-row w-full min-h-screen">
			<!-- Organization Side -->
			<div
				class="flex-1 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5 bg-gradient-to-br from-blue-900/10 to-transparent hover:from-blue-900/20 transition-all duration-500 group"
			>
				<div
					class="max-w-md text-center md:text-right md:pr-12 md:mr-auto w-full transition-transform duration-500 group-hover:-translate-x-2"
				>
					<h3 class="text-3xl font-bold mb-4">For Organizations</h3>
					<p class="text-gray-400 mb-8 text-lg">
						Secure your campus or company. Unified attendance and access control.
					</p>
					<a
						href="/enterprise"
						class="text-blue-400 font-semibold hover:text-blue-300 flex items-center gap-2 justify-center md:justify-end"
					>
						Explore Enterprise Solutions
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 8l4 4m0 0l-4 4m4-4H3"
							/></svg
						>
					</a>
				</div>
			</div>

			<!-- Individual Side -->
			<div
				class="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-bl from-purple-900/10 to-transparent hover:from-purple-900/20 transition-all duration-500 group"
			>
				<div
					class="max-w-md text-center md:text-left md:pl-12 md:ml-auto w-full transition-transform duration-500 group-hover:translate-x-2"
				>
					<h3 class="text-3xl font-bold mb-4">For Individuals</h3>
					<p class="text-gray-400 mb-8 text-lg">
						Upgrade your networking. One card to share your entire professional portfolio.
					</p>
					<a
						href="/personal"
						class="text-purple-400 font-semibold hover:text-purple-300 flex items-center gap-2 justify-center md:justify-start"
					>
						Get Your Personal Card
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 8l4 4m0 0l-4 4m4-4H3"
							/></svg
						>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 7: The Physical Ecosystem (Replaces Shop) -->
	<section class="min-h-screen flex items-center justify-center px-6 md:px-8">
		<div
			class="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-12"
		>
			<!-- Text Content (Left aligned) -->
			<div class="md:w-1/2 text-left z-20">
				<span
					class="inline-block px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium mb-6"
				>
					Physical Ecosystem
				</span>
				<h2 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
					Digital Brain.<br />Physical Beauty.
				</h2>
				<p class="text-xl text-gray-400 mb-8 leading-relaxed">
					We don’t just host your ID; we craft it. Order print-ready PVC cards and premium lanyards
					directly through the app.
				</p>

				<div class="space-y-4 mb-8">
					<div class="flex items-center gap-3 text-gray-300">
						<div class="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
						<span>Premium PVC Card Stock</span>
					</div>
					<div class="flex items-center gap-3 text-gray-300">
						<div class="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
						<span>Custom Branded Lanyards</span>
					</div>
					<div class="flex items-center gap-3 text-gray-300">
						<div class="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
						<span>Batch Printing Services</span>
					</div>
				</div>

				<a
					href="/shop"
					class="inline-block px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
				>
					Visit Hardware Shop
				</a>
			</div>

			<!-- Space for 3D Asset (Rigth side) -->
			<div class="md:w-1/2 h-[50vh]">
				<!-- 3D CardStack appears here via fixed canvas background -->
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer
		class="relative py-20 px-4 border-t border-gray-800 bg-gradient-to-b from-transparent to-black/50"
	>
		<div class="max-w-6xl mx-auto">
			<!-- Main Footer Content -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
				<!-- Brand Column -->
				<div class="md:col-span-2">
					<div class="flex items-center gap-3 mb-4">
						<span class="text-4xl font-light text-white/80">ᜃ</span>
						<span class="text-3xl font-black">Kanaya</span>
					</div>
					<p class="text-gray-400 max-w-sm mb-6">
						The comprehensive ID ecosystem for organizations of all sizes. Secure, scalable, and
						beautifully designed.
					</p>
					<div class="flex gap-4">
						<a
							href="https://github.com/midcodes"
							target="_blank"
							rel="noopener"
							class="text-gray-500 hover:text-white transition-colors"
							aria-label="GitHub"
						>
							<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"
								><path
									d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
								/></svg
							>
						</a>
						<a
							href="mailto:hello@kanaya.app"
							class="text-gray-500 hover:text-white transition-colors"
							aria-label="Email"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/></svg
							>
						</a>
					</div>
				</div>

				<!-- Product Links -->
				<div>
					<h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
					<nav class="flex flex-col gap-3 text-gray-400">
						<a href="/pricing" class="hover:text-white transition-colors">Pricing</a>
						<a href="/shop" class="hover:text-white transition-colors">Shop Cards</a>
						<a href="/docs" class="hover:text-white transition-colors">API Documentation</a>
						<a href="/auth" class="hover:text-white transition-colors">Login / Sign Up</a>
					</nav>
				</div>

				<!-- Company Links -->
				<div>
					<h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
					<nav class="flex flex-col gap-3 text-gray-400">
						<a href="/about" class="hover:text-white transition-colors">About Us</a>
						<a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
						<a href="/terms" class="hover:text-white transition-colors">Terms of Service</a>
						<a href="/contact" class="hover:text-white transition-colors">Contact</a>
					</nav>
				</div>
			</div>

			<!-- Bottom Bar -->
			<div
				class="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4"
			>
				<p class="text-gray-600 text-sm">
					© 2025 Kanaya / Midcodes Inc. Tagbilaran City, Bohol, Philippines.
				</p>
				<p class="text-gray-700 text-xs">Built with Svelte, Three.js, and Neon.</p>
			</div>
		</div>
	</footer>
</div>
