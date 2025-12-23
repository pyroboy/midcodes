<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { NoToneMapping } from 'three';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import DigitalCard3D from '$lib/components/DigitalCard3D.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as Icons from 'lucide-svelte';
	import type { PageData } from './$types';
	import { getNetworkStatus } from '$lib/utils/network';
	import { Loader2 } from 'lucide-svelte';
	import {
		calculateCardDisplayDimensions,
		isMobileViewport,
		DEFAULT_CARD_ASPECT_RATIO
	} from '$lib/utils/cardDisplayDimensions';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Derive status-related values
	const status = $derived(data.status);
	const isActive = $derived(status === 'active');
	const isUnclaimed = $derived(status === 'unclaimed');
	const isExpired = $derived(status === 'expired');
	const isBannedOrSuspended = $derived(status === 'banned' || status === 'suspended');

	// Profile data (may be null for unclaimed/banned)
	const socials = $derived(data.profile?.socials || []);
	const displayName = $derived(data.profile?.displayName || 'Unnamed Profile');
	const bio = $derived(data.profile?.bio || '');
	const jobTitle = $derived(data.profile?.jobTitle || '');

	const frontUrl = $derived(data.cardImages?.front);
	const backUrl = $derived(data.cardImages?.back);
	const frontLowRes = $derived(data.cardImages?.frontLowRes);

	// Card aspect ratio from server or default
	const cardAspectRatio = $derived(data.cardAspectRatio ?? DEFAULT_CARD_ASPECT_RATIO);

	// Viewport dimensions for responsive sizing
	let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 375);
	let viewportHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 667);
	let isMobile = $derived(isMobileViewport(viewportWidth));

	// Calculate card display dimensions based on viewport
	// Card fills screen with ~1cm (40px) horizontal padding and 180px bottom for footer
	const cardDimensions = $derived(
		calculateCardDisplayDimensions({
			aspectRatio: cardAspectRatio,
			viewportWidth,
			viewportHeight,
			horizontalPadding: 40, // ~1cm on each side
			bottomPadding: 180,    // Space for footer/chevron
			topPadding: 40         // Small top margin
		})
	);

	// Pixel dimensions for CSS
	const cardWidth = $derived(cardDimensions.width);
	const cardHeight = $derived(cardDimensions.height);

	// Container sizing config
	const CONTAINER_WIDTH_PERCENT = 0.90;  // 90% of parent width
	const CONTAINER_MAX_WIDTH_PX = 700;    // Maximum width in pixels
	const CONTAINER_MAX_HEIGHT_PERCENT = 0.85; // 85% of parent height
	
	// 3D Scene Scale: Make 3D canvas larger than 2D container
	const SCENE_3D_SCALE = 1.3;
	
	// Calculate actual container dimensions in pixels
	// YELLOW container: min(90% * viewport, 700px)
	const yellowContainerWidth = $derived(
		Math.min(viewportWidth * CONTAINER_WIDTH_PERCENT, CONTAINER_MAX_WIDTH_PX)
	);
	const yellowContainerHeight = $derived(yellowContainerWidth / cardAspectRatio);
	
	// PURPLE container: min(90% * scale * viewport, 700 * scale px)
	// But also respect the actual viewport constraints
	const purpleMaxWidth = CONTAINER_MAX_WIDTH_PX * SCENE_3D_SCALE;
	const purpleContainerWidth = $derived(
		Math.min(viewportWidth * CONTAINER_WIDTH_PERCENT * SCENE_3D_SCALE, purpleMaxWidth, viewportWidth * 0.95)
	);
	const purpleContainerHeight = $derived(purpleContainerWidth / cardAspectRatio);
	
	// Calculate the ACTUAL ratio between purple and yellow containers
	// This accounts for max-width constraints on either container
	const actualSceneScale = $derived(purpleContainerWidth / yellowContainerWidth);

	function scrollToProfile() {
		document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' });
	}

	function getIcon(platform: string) {
		const p = platform.toLowerCase();
		if (p.includes('twitter') || p.includes('x.com')) return Icons.Twitter;
		if (p.includes('linkedin')) return Icons.Linkedin;
		if (p.includes('github')) return Icons.Github;
		if (p.includes('instagram')) return Icons.Instagram;
		if (p.includes('facebook')) return Icons.Facebook;
		if (p.includes('globe') || p.includes('website')) return Icons.Globe;
		return Icons.Link;
	}

	function downloadVCard() {
		// TODO: Implement VCard generation
		console.log('Downloading VCard...');
	}

	function handleClaim() {
		// Navigate to claim flow
		if (data.claimToken) {
			window.location.href = `/claim/${data.claimToken}`;
		}
	}

	// Progressive loading state
	let is3DReady = $state(false);
	let load3D = $state(false);

	onMount(() => {
		// Update viewport dimensions on mount and resize
		const updateViewport = () => {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
		};

		// Initial update
		updateViewport();

		// Listen for resize events
		window.addEventListener('resize', updateViewport);

		// Progressive Loading Logic
		const { isSlow } = getNetworkStatus();

		// If fast, load 3D shortly. If slow, give more time for 2D to settle.
		setTimeout(
			() => {
				load3D = true;
			},
			isSlow ? 1500 : 200
		);

		return () => {
			window.removeEventListener('resize', updateViewport);
		};
	});

	function on3DLoad() {
		// 3D assets loaded. Mark as ready - opacity transitions handle the rest.
		// No DOM removal needed, just opacity crossfade.
		is3DReady = true;
	}
</script>

<svelte:head>
	<title>{isActive ? displayName : 'Digital ID'} | Digital ID</title>
</svelte:head>

{#if isBannedOrSuspended}
	<!-- Banned/Suspended State - No 3D card -->
	<div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
		<div
			class="max-w-md w-full bg-slate-800 rounded-xl p-8 text-center border border-slate-700"
			transition:fade={{ duration: 300 }}
		>
			<div
				class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
			>
				<Icons.ShieldX class="w-8 h-8 text-red-400" />
			</div>
			<h1 class="text-xl font-bold text-white mb-2">Profile Unavailable</h1>
			<p class="text-slate-400 text-sm">
				{data.statusMessage}
			</p>
		</div>
	</div>
{:else}
	<!-- Main Container -->
	<div class="min-h-screen bg-neutral-950 overflow-x-hidden">
		<!-- Hero Section -->
		<!-- DEBUG: RED border = section -->
		<section
			data-debug-name="HERO-SECTION-RED"
			class="relative h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden border-4 border-red-500"
		>
			<!-- LAYER 1: Static Placeholder (2D Image) -->
			<!-- DEBUG: GREEN border = Layer 1 container -->
			<div
				data-debug-name="LAYER1-PLACEHOLDER-GREEN"
				class="absolute inset-0 flex items-center justify-center z-10 border-4 border-green-500"
				style="opacity: {is3DReady ? 0 : 1}; transition: opacity 700ms ease-out; pointer-events: {is3DReady ? 'none' : 'auto'};"
			>
				<!-- Card Image Container -->
				<!-- DEBUG: YELLOW border = 2D card container -->
				<div
					data-debug-name="CARD2D-CONTAINER-YELLOW"
					class="overflow-hidden rounded-xl shadow-2xl border-4 border-yellow-500 flex items-center justify-center"
					style="width: {yellowContainerWidth}px; height: {yellowContainerHeight}px;"
				>
					{#if frontLowRes || frontUrl}
						<!-- DEBUG: CYAN border = actual image -->
						<!-- Image with 5% padding to match 3D card's 90% fill -->
						<img
							data-debug-name="IMAGE-CYAN"
							src={frontLowRes || frontUrl}
							alt="Digital ID"
							class="object-contain rounded-xl"
							style="width: 90%; height: 90%; border-radius: 4%;"
						/>
					{/if}
				</div>
			</div>

			<!-- Loading Indicator - separate from layers, doesn't affect layout -->
			{#if !is3DReady}
				<div
					data-debug-name="LOADING-INDICATOR"
					class="absolute bottom-48 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-medium z-30"
				>
					<Loader2 class="w-3 h-3 animate-spin" />
					<span>Loading 3D Experience...</span>
				</div>
			{/if}

			<!-- LAYER 2: 3D Canvas (overlaps when ready) -->
			<!-- DEBUG: BLUE border = Layer 2 container -->
			{#if load3D && frontUrl && backUrl}
				<div
					data-debug-name="LAYER2-3D-BLUE"
					class="absolute inset-0 flex items-center justify-center z-20 border-4 border-blue-500"
					style="opacity: {is3DReady ? 1 : 0}; transition: opacity 700ms ease-out;"
				>
					<!-- DEBUG: PURPLE border = 3D canvas container (scaled larger for orbit room) -->
					<div
						data-debug-name="CARD3D-CONTAINER-PURPLE"
						class="overflow-hidden rounded-xl shadow-2xl border-4 border-purple-500"
						style="width: {purpleContainerWidth}px; height: {purpleContainerHeight}px;"
					>
						<Canvas toneMapping={NoToneMapping}>
							<T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45}>
								<OrbitControls
									enableZoom={false}
									enablePan={false}
									enableRotate={true}
									autoRotate={false}
								/>
							</T.PerspectiveCamera>
							<T.AmbientLight intensity={1.5} />
							<T.DirectionalLight position={[5, 5, 5]} intensity={1} castShadow />
							<T.DirectionalLight position={[-5, 5, -5]} intensity={0.5} />

							<DigitalCard3D
								{frontUrl}
								{backUrl}
								stage="profile"
								onLoad={on3DLoad}
								{cardAspectRatio}
								sceneScale={actualSceneScale}
							/>
						</Canvas>
					</div>
				</div>
			{/if}

			<!-- View Profile Trigger Button -->
			<button
				onclick={scrollToProfile}
				class="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer group z-50"
			>
				<span
					class="text-xs font-medium tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					>View Profile</span
				>
				<div
					class="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
				>
					<Icons.ChevronDown class="w-6 h-6 animate-bounce" />
				</div>
			</button>

			<!-- Footer (Legal) -->
			<div
				class="absolute bottom-0 left-0 w-full pb-8 pt-12 bg-gradient-to-t from-neutral-950 to-transparent text-center z-20 pointer-events-auto"
			>
				<div class="inline-flex flex-col items-center gap-2">
					<p class="text-neutral-500 text-sm font-medium tracking-wide">
						POWERED BY <span class="text-white font-bold ml-1">KANAYA</span>
					</p>
					<div class="flex items-center gap-4 text-xs text-neutral-600">
						<span>© {new Date().getFullYear()}</span>
						<span>•</span>
						<a href="/terms" class="hover:text-neutral-400 transition-colors">Terms</a>
						<span>•</span>
						<a href="/privacy" class="hover:text-neutral-400 transition-colors">Privacy</a>
					</div>
				</div>
			</div>
		</section>

		<!-- Profile Section -->
		<section
			id="profile"
			class="relative z-10 bg-white dark:bg-neutral-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-12 min-h-screen flex flex-col"
		>
			<div class="w-16 h-1 bg-neutral-200 dark:bg-neutral-700 mx-auto mt-4 rounded-full"></div>

			<div class="p-8 flex flex-col items-center gap-6 flex-1">
				<Avatar
					class="w-24 h-24 border-4 border-white dark:border-neutral-800 shadow-xl -mt-16 bg-white dark:bg-neutral-900"
				>
					<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>

				<div class="text-center space-y-1">
					<h2 class="text-2xl font-bold text-neutral-900 dark:text-white">Jane Doe</h2>
					<p class="text-neutral-500 dark:text-neutral-400">Senior Product Designer @ Acme Inc.</p>
				</div>

				<div class="flex gap-4">
					<Button variant="outline" size="icon" class="rounded-full">
						<Icons.Twitter class="w-4 h-4" />
					</Button>
					<Button variant="outline" size="icon" class="rounded-full">
						<Icons.Linkedin class="w-4 h-4" />
					</Button>
					<Button variant="outline" size="icon" class="rounded-full">
						<Icons.Globe class="w-4 h-4" />
					</Button>
				</div>

				<div class="w-full max-w-md space-y-4 text-left">
					<Card>
						<CardContent class="p-4 flex items-center gap-4">
							<div class="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
								<Icons.Mail class="w-5 h-5 text-blue-600 dark:text-blue-300" />
							</div>
							<div>
								<p class="text-xs text-neutral-500">Email</p>
								<p class="font-medium text-sm">jane.doe@example.com</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent class="p-4 flex items-center gap-4">
							<div class="bg-green-100 dark:bg-green-900 p-2 rounded-full">
								<Icons.Phone class="w-5 h-5 text-green-600 dark:text-green-300" />
							</div>
							<div>
								<p class="text-xs text-neutral-500">Phone</p>
								<p class="font-medium text-sm">+1 (555) 000-0000</p>
							</div>
						</CardContent>
					</Card>

					<div class="pt-4">
						<h3 class="font-semibold mb-2">About</h3>
						<p class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
							Passionate about creating intuitive and beautiful user experiences. Specializing in
							design systems, accessibility, and modern web technologies. Always learning and
							exploring new tools to improve workflows.
						</p>
					</div>
				</div>

				<div
					class="mt-8 p-4 text-center text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-full"
				>
					Mockup Data for Testing
				</div>
			</div>
		</section>
	</div>
{/if}
