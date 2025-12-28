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
	import HeroSection from '$lib/components/marketing/sections/HeroSection.svelte';
	import VerificationFlowSection from '$lib/components/marketing/sections/VerificationFlowSection.svelte';
	import ArchitectureSection from '$lib/components/marketing/sections/ArchitectureSection.svelte';
	import UseCasesSection from '$lib/components/marketing/sections/UseCasesSection.svelte';
	import PhysicalEcosystemSection from '$lib/components/marketing/sections/PhysicalEcosystemSection.svelte';
	import {
		createBaybaninNormalMap,
		createHeroCardTexture,
		createCardBackTexture,
		getCachedTexture,
		disposeCachedTextures
	} from '$lib/marketing/textures/MarketingTextureManager';
	import FooterSection from '$lib/components/marketing/sections/FooterSection.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Reactive scroll state
	const scrollState = getScrollState();

	// Loading state
	let isLoading = $state(true);
	let loadingProgress = $state(0);

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

	// Handle scene ready callback
	function onSceneReady() {
		// Scene is loaded, finish loading animation
		loadingProgress = 100;
		setTimeout(() => {
			isLoading = false;
			initLenis();
			connectScrollState();
		}, 300);
	}

	// Initialize - defer 3D scene to avoid blocking hydration
	onMount(() => {
		// Don't init if user will be redirected
		if (data.user) return;

		// Start loading animation
		loadingProgress = 10;

		// Defer 3D scene loading until after hydration completes
		// Using requestIdleCallback or setTimeout as fallback
		const startScene = () => {
			loadingProgress = 30;
			show3DScene = true;
		};

		// Wait for idle time or 100ms, whichever comes first
		if ('requestIdleCallback' in window) {
			const idleId = requestIdleCallback(startScene, { timeout: 100 });
			// Cleanup handled below
		} else {
			setTimeout(startScene, 50);
		}

		// Simulate progress while textures load
		const progressInterval = setInterval(() => {
			if (loadingProgress < 80 && show3DScene) {
				loadingProgress += Math.random() * 8;
			}
		}, 150);

		// Timeout fallback - if scene doesn't report ready in 4s, show anyway
		const timeout = setTimeout(() => {
			if (isLoading) {
				onSceneReady();
			}
		}, 4000);

		return () => {
			clearInterval(progressInterval);
			clearTimeout(timeout);
			destroyLenis();
			disposeCachedTextures();
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
		<MarketingScene templateAssets={data.templateAssets} {onSceneReady} />
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
<div class="relative z-10 min-h-screen bg-transparent text-foreground">
	<HeroSection />

	<!-- Section 2: Verification Flow (Encode, Scan, Tap) -->
	<VerificationFlowSection />

	<!-- Section 3: Architecture -->
	<ArchitectureSection />

	<!-- Section 4-6: Use Cases & Segments -->
	<UseCasesSection />

	<!-- Section 7: The Physical Ecosystem (Replaces Shop) -->
	<PhysicalEcosystemSection />

	<!-- Footer -->
	<FooterSection />
</div>
