<script lang="ts">
	/**
	 * MarketingScene.svelte - Fixed WebGL canvas for marketing page
	 *
	 * This is the container for all 3D elements on the marketing page.
	 * It renders as a fixed-position fullscreen canvas behind the scrolling content.
	 */
	import { Canvas } from '@threlte/core';
	import MarketingSceneContent from './MarketingSceneContent.svelte';

	interface Props {
		/** Template assets from server for card textures */
		templateAssets?: Array<{
			id: string;
			imageUrl: string | null;
			widthPixels: number | null;
			heightPixels: number | null;
		}>;
		/** Callback when scene is fully loaded */
		onSceneReady?: () => void;
	}

	let { templateAssets = [], onSceneReady }: Props = $props();
</script>

<!-- Fixed fullscreen canvas behind content with gradient background -->
<div 
	class="fixed inset-0 w-screen h-screen z-0 pointer-events-none bg-gradient-to-b from-gray-300 to-gray-400"
	style="touch-action: none;"
>
	<Canvas>
		<MarketingSceneContent {templateAssets} {onSceneReady} />
	</Canvas>
</div>
