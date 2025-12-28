<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
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

<!-- Scroll Progress Indicator (dev helper) -->
<div
	class="fixed top-0 left-0 h-1 bg-gradient-to-r from-white to-gray-500 z-50 transition-all duration-100"
	style="width: {scrollState.progress * 100}%"
></div>

<!-- Section Indicator (dev helper) -->
<div
	class="fixed top-4 right-4 z-50 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs font-mono text-gray-400"
>
	{scrollState.currentSection} ({(scrollState.sectionProgress * 100).toFixed(0)}%)
</div>

<!-- Content layer (scrollable, above 3D scene) -->
<div class="relative z-10 min-h-screen bg-transparent text-white">
	<!-- Hero Section Placeholder -->
	<section class="min-h-screen flex flex-col items-center justify-center px-4">
		<div class="text-center max-w-4xl mx-auto">
			<!-- Baybayin Ka Symbol -->
			<div class="text-8xl md:text-9xl font-light text-white/80 mb-8">ᜃ</div>

			<h1 class="text-5xl md:text-7xl font-black tracking-tight mb-6">
				Identity, <span class="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500">Encoded.</span>
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
			<svg
				class="w-6 h-6 text-gray-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</div>
	</section>

	<!-- Placeholder sections for scroll-triggered content -->
	<section class="min-h-screen flex items-center justify-center px-4 border-t border-gray-800">
		<div class="text-center">
			<h2 class="text-4xl md:text-5xl font-bold mb-4">Kill the Spreadsheet.</h2>
			<p class="text-xl text-gray-400 max-w-2xl mx-auto">
				Manual entry is error-prone. Kanaya offers offline-first live verification.
			</p>
		</div>
	</section>

	<section class="min-h-screen flex items-center justify-center px-4 border-t border-gray-800">
		<div class="text-center">
			<h2 class="text-4xl md:text-5xl font-bold mb-4">Engineered, Not Just Printed.</h2>
			<p class="text-xl text-gray-400 max-w-2xl mx-auto">
				Our Dynamic Layer engine separates design from data.
			</p>
		</div>
	</section>

	<section class="min-h-screen flex items-center justify-center px-4 border-t border-gray-800">
		<div class="text-center">
			<h2 class="text-4xl md:text-5xl font-bold mb-4">One Platform, Many Use Cases.</h2>
			<p class="text-xl text-gray-400 max-w-2xl mx-auto">
				Schools, Dorms, Events - all unified under one system.
			</p>
		</div>
	</section>

	<section class="min-h-screen flex items-center justify-center px-4 border-t border-gray-800">
		<div class="text-center">
			<h2 class="text-4xl md:text-5xl font-bold mb-4">System Scale.</h2>
			<p class="text-xl text-gray-400 max-w-2xl mx-auto">
				1,240,592 verifications logged. 24 active partners.
			</p>
		</div>
	</section>

	<section class="min-h-screen flex items-center justify-center px-4 border-t border-gray-800">
		<div class="text-center">
			<h2 class="text-4xl md:text-5xl font-bold mb-4">Digital Brain. Physical Beauty.</h2>
			<p class="text-xl text-gray-400 max-w-2xl mx-auto">
				We handle the hardware. You handle the data.
			</p>
		</div>
	</section>

	<!-- Footer -->
	<footer class="py-16 px-4 border-t border-gray-800">
		<div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
			<div class="flex items-center gap-3">
				<span class="text-3xl font-light text-white/80">ᜃ</span>
				<span class="text-2xl font-black">Kanaya</span>
			</div>

			<nav class="flex gap-8 text-gray-400">
				<a href="/pricing" class="hover:text-white transition-colors">Pricing</a>
				<a href="/docs" class="hover:text-white transition-colors">API Docs</a>
				<a href="/shop" class="hover:text-white transition-colors">Shop</a>
				<a href="/auth" class="hover:text-white transition-colors">Login</a>
			</nav>

			<p class="text-gray-600 text-sm">© 2025 Kanaya. Tagbilaran City, Bohol.</p>
		</div>
	</footer>
</div>
