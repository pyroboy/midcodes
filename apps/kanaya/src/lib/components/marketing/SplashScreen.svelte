<script lang="ts">
	/**
	 * SplashScreen.svelte - Loading screen with logo animation
	 * Shows while 3D scene and assets are loading
	 */
	import { fade } from 'svelte/transition';

	interface Props {
		progress?: number; // 0-100
		isLoading?: boolean;
	}

	let { progress = 0, isLoading = true }: Props = $props();
</script>

{#if isLoading}
	<div
		class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
		transition:fade={{ duration: 400 }}
	>
		<!-- Logo -->
		<div class="mb-8">
			<svg
				width="120"
				height="120"
				viewBox="0 0 100 100"
				class="animate-pulse"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<!-- Stylized "K" for Kanaya -->
				<rect x="20" y="15" width="12" height="70" rx="2" fill="white" />
				<polygon points="32,50 70,15 85,15 45,50 85,85 70,85 32,50" fill="white" />
			</svg>
		</div>

		<!-- Brand name -->
		<h1 class="text-2xl font-light tracking-[0.3em] text-white mb-8">KANAYA</h1>

		<!-- Progress bar -->
		<div class="w-48 h-0.5 bg-white/20 rounded-full overflow-hidden">
			<div
				class="h-full bg-white transition-all duration-300 ease-out"
				style="width: {progress}%"
			></div>
		</div>

		<!-- Loading text -->
		<p class="mt-4 text-xs text-white/50 tracking-wider">
			{#if progress < 30}
				Initializing...
			{:else if progress < 60}
				Loading assets...
			{:else if progress < 90}
				Preparing scene...
			{:else}
				Almost ready...
			{/if}
		</p>
	</div>
{/if}
