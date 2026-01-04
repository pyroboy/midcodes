<script lang="ts">
	/**
	 * MarketingSceneContent.svelte
	 * The inner content of the marketing scene, running inside the <Canvas> context.
	 */
	import { T, useThrelte } from '@threlte/core';
	import { interactivity, ContactShadows, Environment } from '@threlte/extras'; // Added Environment
	import { DoubleSide } from 'three'; // Removed BackSide, PMREMGenerator, RoomEnvironment
	import * as THREE from 'three';
	import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
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

	const { scene, renderer } = useThrelte();

	// Track if scene is ready
	let sceneReady = $state(false);

	// Enable pointer events on 3D scene (must be called inside Canvas)
	interactivity();

	onMount(async () => {
		// Wait for next tick to ensure meshes are created
		await tick();

		// Init RectAreaLight uniforms
		RectAreaLightUniformsLib.init();

		// Set up glossy environment using RoomEnvironment (no external HDR)
		if (renderer) {
			renderer.toneMappingExposure = 1.5; // Brighten scene
			// const pmremGenerator = new PMREMGenerator(renderer);
			// pmremGenerator.compileEquirectangularShader();
			// const roomEnvironment = new RoomEnvironment();
			// scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;
			// // Clean up
			// roomEnvironment.dispose();
			// pmremGenerator.dispose();
		}

		// Small delay to ensure textures are uploaded to GPU
		setTimeout(() => {
			sceneReady = true;
			onSceneReady?.();
		}, 100);
	});
	// Check if we're in a layers section (for lighting swap)
	let isLayersSection = $derived(
		scrollState.currentSection === 'layers-main' ||
		scrollState.currentSection === 'layer-1' ||
		scrollState.currentSection === 'layer-2' ||
		scrollState.currentSection === 'layer-3' ||
		scrollState.currentSection === 'layer-4' ||
		scrollState.currentSection === 'layer-5'
	);
</script>

<!-- Camera positioned for card viewing -->
<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} near={0.1} far={100} />

<!-- Subtle ambient lighting (boosted for whiteness) -->
<!-- <T.AmbientLight intensity={2.0} /> -->

<!-- High Quality HDR Environment ("Nice Env File") -->
<!-- preset="city" provides rich, realistic urban reflections perfect for glossy surfaces -->
<!-- <Environment preset="city" /> -->

<!-- VirtuaEnvironment Removed -->

{#if isLayersSection}
	<!-- Ambient Light for even illumination during layers section -->
	<T.AmbientLight intensity={20.0} />
{:else}
	<!-- Gradient Light 1: 3 strips (total width=8, height=1.2) -->
	<T.Group position={[-0.8, 0.7, 3]} lookAt={[0, 0, 0]}>
	<!-- Brightest strip -->
	<T.RectAreaLight 
		width={20} 
		height={0.4} 
		intensity={30} 
		position.y={0.4}
		position.z={0.5}
		rotation.z={Math.PI / 2.5}
	/>
	<!-- Medium strip -->
	<T.RectAreaLight 
		width={20} 
		height={0.8} 
		intensity={13} 
		position.y={0}
		position.z={0}
		rotation.z={Math.PI / 2.5}
	/>
	<!-- Dimmest strip -->
	<T.RectAreaLight 
		width={20} 
		height={0.9} 
		intensity={8} 
		position.y={-0.9}
		position.z={-0.5}
		rotation.z={Math.PI / 2.5}
	/>

		<!-- Dimmest strip -->
	<T.RectAreaLight 
		width={15} 
		height={0.5} 
		intensity={6} 
		position.y={2.5}
		position.z={-1}
		rotation.z={Math.PI / 2.5}
	/>
</T.Group>

<!-- Gradient Light 2: 3 strips (total width=10, height=2) -->
<T.Group position={[3, -2, 3]} lookAt={[0, 0, 0]}>
	<!-- Brightest strip -->
	<T.RectAreaLight 
		width={15} 
		height={0.67} 
		intensity={15} 
		position.y={0.67}
		position.z={0.4}
		rotation.y={Math.PI / 2}
		rotation.z={Math.PI / 3.4}
	/>
	<!-- Medium strip -->
	<T.RectAreaLight 
		width={15} 
		height={0.67} 
		intensity={9} 
		position.y={0}
		position.z={0}
		rotation.y={Math.PI / 2}
		rotation.z={Math.PI / 3.4}
	/>
	<!-- Dimmest strip -->
	<T.RectAreaLight 
		width={15} 
		height={0.67} 
		intensity={4} 
		position.y={-0.67}
		position.z={-0.4}
		rotation.y={Math.PI / 2}
		rotation.z={Math.PI / 3.4}
	/>

		<!-- Dimmest strip -->
	<T.RectAreaLight 
		width={15} 
		height={0.67} 
		intensity={4} 
		position.y={2.5}
		position.z={-0.8}
		rotation.y={Math.PI / 2}
		rotation.z={Math.PI / 3.4}
	/>
</T.Group>
{/if}

<!-- Contact Shadows for card grounding -->
<ContactShadows
	scale={10}
	blur={2}
	far={10}
	resolution={256}
	color="#000000"
	opacity={0.4}
	position.y={-1.2}
/>

<!-- Background card grid (swarm-to-sphere animation) -->
<!-- Visible from last useCases section (attendance) 50% onwards, through systemScale -->
{#if sceneReady}
	{@const currentSection = scrollState.currentSection}
	{@const sectionProgress = scrollState.sectionProgress}
	
	{@const isAttendance = currentSection === 'useCases-attendance'}
	{@const isSystemScale = currentSection === 'systemScale'}
	
	{@const showGrid = isSystemScale || (isAttendance && sectionProgress > 0.5)}

	<!-- 
		Animation progress calculation:
		- useCases-attendance 50-100% → 0.0 to 0.5 (swarm flying in)
		- systemScale 0-100% → 0.5 to 1.0 (sphere formation and rotation)
	-->
	{@const animationProgress = isSystemScale
		? 0.5 + sectionProgress * 0.5
		: isAttendance
			? Math.max(0, (sectionProgress - 0.5) * 1.0)
			: 0}

	{#if showGrid}
		<InstancedCardGrid visible={true} {animationProgress} />
	{/if}
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
