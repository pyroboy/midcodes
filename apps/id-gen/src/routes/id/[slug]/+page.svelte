<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { NoToneMapping } from 'three';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import DigitalCard3D from '$lib/components/DigitalCard3D.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as Icons from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let stage = $state<'intro' | 'profile'>('intro');
	let showContent = $state(false);

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
	import { getNetworkStatus } from '$lib/utils/network';
	import { Loader2 } from 'lucide-svelte';
	
	let is3DReady = $state(false);
	let load3D = $state(false);
	let show2D = $state(true); // Always start true
	
	onMount(() => {
		// For banned/suspended, show content immediately without animation
		if (isBannedOrSuspended) {
			showContent = true;
			return;
		}
        
        // Show content state (kept for other potential uses, but footer is now static)
        showContent = true;

		// Progressive Loading Logic
		const { isSlow } = getNetworkStatus();
		
		// If fast, load 3D shortly. If slow, give more time for 2D to settle.
		setTimeout(() => {
			load3D = true;
		}, isSlow ? 1500 : 200);

        // We no longer delay 'stage', it defaults to 'profile' (static front) to match 2D.
	});

    function on3DLoad() {
        // 3D assets loaded. Transition from 2D to 3D.
        is3DReady = true;
        
        // Wait a beat for the first frame to render then hide 2D
        setTimeout(() => {
            show2D = false;
        }, 500);
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
	<div class="fixed inset-0 z-0 bg-neutral-950 flex flex-col items-center justify-between overflow-hidden">
		
        <!-- Card Area (Center) -->
        <div class="flex-1 w-full flex items-center justify-center relative">
            
            <!-- 3D Layer (Background) -->
            {#if load3D}
                <div 
                    class="absolute inset-0 transition-opacity duration-1000 ease-out"
                    class:opacity-0={!is3DReady}
                    class:opacity-100={is3DReady}
                >
                    <Canvas toneMapping={NoToneMapping}>
                        <T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45}>
                            <OrbitControls
                                enableZoom={false}
                                enablePan={true}
                                enableRotate={true}
                                autoRotate={false} 
                            />
                        </T.PerspectiveCamera>
                        <T.AmbientLight intensity={1.5} />
                        <T.DirectionalLight position={[5, 5, 5]} intensity={1} castShadow />
                        <T.DirectionalLight position={[-5, 5, -5]} intensity={0.5} />

                        {#if frontUrl && backUrl}
                            <!-- Stage 'profile' ensures static front facing initially -->
                            <DigitalCard3D {frontUrl} {backUrl} stage="profile" onLoad={on3DLoad} />
                        {/if}
                    </Canvas>
                </div>
            {/if}

            <!-- 2D Layer (Foreground / Fallback) -->
            {#if show2D && (frontLowRes || frontUrl)}
                <div 
                    class="relative transition-opacity duration-1000 ease-out z-10 flex flex-col items-center gap-6"
                    class:opacity-0={is3DReady}
                >
                    <!-- 2D Image matching 3D scale approx 
                         Use max-h to prevent portrait images from taking too much vertical space.
                         Use max-w to restrict width.
                         w-auto/h-auto preserves aspect ratio.
                         Uses frontLowRes if available, falls back to frontUrl.
                    -->
				<img 
                    src={frontLowRes || frontUrl} 
                    alt="Digital ID" 
                    class="w-auto h-auto max-w-[85vw] md:max-w-[400px] max-h-[55vh] rounded-xl shadow-2xl object-contain"
                />
                    
                    <!-- Loading Indicator removed from here -->
                </div>
            {/if}
        </div>

        <!-- Footer (Always Visible) -->
        <div class="w-full pb-8 pointer-events-auto text-center z-20 relative">
            <div 
                class="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-medium transition-opacity duration-500"
                class:opacity-0={is3DReady}
                class:pointer-events-none={is3DReady}
            >
                <Loader2 class="w-3 h-3 animate-spin" />
                <span>Loading 3D Experience...</span>
            </div>
            <div
                class="inline-flex flex-col items-center gap-2"
            >
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
	</div>
{/if}
