<script lang="ts">
	/**
	 * MarketingSceneContent.svelte
	 * The inner content of the marketing scene, running inside the <Canvas> context.
	 */
	import { T } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { onMount, tick } from 'svelte';
	import HeroCard3D from './HeroCard3D.svelte';
	import InstancedCardGrid from './InstancedCardGrid.svelte';
	import CardStack from './sections/CardStack.svelte';
	import { getScrollState } from '$lib/marketing/scroll';

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

	// Scroll state for driving animations
	const scrollState = getScrollState();

	// Track if scene is ready
	let sceneReady = $state(false);

	// Enable pointer events on 3D scene (must be called inside Canvas)
	interactivity();

	onMount(async () => {
		// Wait for next tick to ensure meshes are created
		await tick();

		// Small delay to ensure textures are uploaded to GPU
		setTimeout(() => {
			sceneReady = true;
			onSceneReady?.();
		}, 100);
	});
</script>

<!-- Camera positioned for card viewing -->
<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} near={0.1} far={100} />

<!-- Subtle ambient lighting -->
<T.AmbientLight intensity={0.4} />

<!-- Key light from upper right -->
<T.DirectionalLight position={[5, 5, 5]} intensity={1.2} castShadow={false} />

<!-- Fill light from left -->
<T.DirectionalLight position={[-3, 2, 4]} intensity={0.4} />

<!-- Rim light from behind -->
<T.DirectionalLight position={[0, 0, -5]} intensity={0.2} />

<!-- Background card grid (swarm-to-sphere animation) -->
<!-- Visible from useCases 50% onwards, encapsulates main card during systemScale -->
{#if sceneReady}
	{@const isUseCases = scrollState.currentSection === 'useCases'}
	{@const isSystemScale = scrollState.currentSection === 'systemScale'}
	{@const useCasesProgress = isUseCases ? scrollState.sectionProgress : 0}
	{@const showGrid = isSystemScale || useCasesProgress > 0.5}

	<!-- 
		Animation progress calculation:
		- useCases 50-100% → 0.0 to 0.5 (swarm flying in)
		- systemScale 0-100% → 0.5 to 1.0 (sphere formation and rotation)
	-->
	{@const animationProgress = isSystemScale
		? 0.5 + scrollState.sectionProgress * 0.5
		: isUseCases
			? Math.max(0, (useCasesProgress - 0.5) * 1.0)
			: 0}

	<InstancedCardGrid visible={showGrid} {animationProgress} />
{/if}

<!-- The hero card driven by scroll state -->
{#if sceneReady}
	<HeroCard3D
		scrollProgress={scrollState.progress}
		currentSection={scrollState.currentSection}
		sectionProgress={scrollState.sectionProgress}
		{templateAssets}
	/>

	<!-- Card Stack for Physical Ecosystem section -->
	<CardStack
		visible={scrollState.currentSection === 'physical'}
		scrollProgress={scrollState.sectionProgress}
	/>
{/if}
