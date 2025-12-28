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
	}

	let { templateAssets = [] }: Props = $props();
</script>

<!-- Fixed fullscreen canvas behind content -->
<div class="fixed inset-0 w-screen h-screen z-0 pointer-events-none" style="touch-action: none;">
	<Canvas>
		<MarketingSceneContent {templateAssets} />
	</Canvas>
</div>
