<script lang="ts">
	/**
	 * HeroCard3D.svelte - State machine-driven card for marketing page
	 *
	 * This card transitions through different visual states based on scroll position:
	 * - hero: Slow rotation with embossed Baybayin Ka symbol
	 * - verification: Flat position with laser scan effect
	 * - exploding/exploded: Layers separate to show architecture
	 * - useCases: Texture swapping to show different applications
	 * - testimonials: Shrinks to corner while grid appears
	 * - shop: Returns with lanyard attached
	 */
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import HeroCardGeometry from './HeroCardGeometry.svelte';
	import LaserScanEffect from './LaserScanEffect.svelte';
	import type { SectionName } from '$lib/marketing/scroll';
	import {
		getSectionCardState,
		getStateTransform,
		getStateVisuals,
		lerp,
		type CardState,
		type CardTransform,
		type CardVisualState
	} from '$lib/marketing/animation';

	interface Props {
		scrollProgress: number;
		currentSection: SectionName;
		sectionProgress: number;
		templateAssets?: Array<{
			id: string;
			imageUrl: string | null;
			widthPixels: number | null;
			heightPixels: number | null;
		}>;
	}

	let {
		scrollProgress = 0,
		currentSection = 'hero',
		sectionProgress = 0,
		templateAssets = []
	}: Props = $props();

	// Current state from state machine
	let currentState = $state<CardState>('hero');

	// Smooth animated values (lerped toward targets)
	let position = $state({ x: 0, y: 0, z: 0 });
	let rotation = $state({ x: 0, y: 0, z: 0 });
	let scale = $state(1);
	let layerSeparation = $state(0);
	let textureIndex = $state(0);
	let opacity = $state(1);

	// Visual state flags
	let autoRotate = $state(true);
	let autoRotateSpeed = $state(0.3);
	let lanyardVisible = $state(false);
	let laserScanActive = $state(false);
	let glowIntensity = $state(0);

	// Auto-rotation accumulator
	let autoRotationY = $state(0);

	// Group reference for transforms
	let groupRef: THREE.Group | undefined = $state();

	// Interpolation speed (higher = faster catch-up)
	const LERP_SPEED = 5;

	/**
	 * Update state machine based on scroll position
	 */
	$effect(() => {
		currentState = getSectionCardState(currentSection, sectionProgress);
	});

	/**
	 * Animation loop - runs every frame
	 */
	useTask((delta) => {
		if (!groupRef) return;

		// Get target values from state machine
		const targetTransform = getStateTransform(currentState, sectionProgress);
		const targetVisuals = getStateVisuals(currentState, sectionProgress);

		// Smoothly interpolate toward targets
		const lerpFactor = Math.min(1, delta * LERP_SPEED);

		// Position
		position.x = lerp(position.x, targetTransform.position.x, lerpFactor);
		position.y = lerp(position.y, targetTransform.position.y, lerpFactor);
		position.z = lerp(position.z, targetTransform.position.z, lerpFactor);

		// Scale
		scale = lerp(scale, targetTransform.scale, lerpFactor);

		// Visual properties
		layerSeparation = lerp(layerSeparation, targetVisuals.layerSeparation, lerpFactor);
		opacity = lerp(opacity, targetVisuals.opacity, lerpFactor);
		glowIntensity = lerp(glowIntensity, targetVisuals.glowIntensity, lerpFactor);

		// Discrete state changes (no lerp needed)
		autoRotate = targetVisuals.autoRotate;
		autoRotateSpeed = targetVisuals.autoRotateSpeed;
		textureIndex = targetVisuals.textureIndex;
		lanyardVisible = targetVisuals.lanyardVisible;
		laserScanActive = targetVisuals.laserScanActive;

		// Handle rotation
		if (autoRotate) {
			// Accumulate auto-rotation
			autoRotationY += delta * autoRotateSpeed;
			rotation.y = autoRotationY;
		} else {
			// Lerp to target rotation
			rotation.x = lerp(rotation.x, targetTransform.rotation.x, lerpFactor);
			rotation.y = lerp(rotation.y, targetTransform.rotation.y, lerpFactor);
			rotation.z = lerp(rotation.z, targetTransform.rotation.z, lerpFactor);
			// Sync auto-rotation to current y to prevent jump when re-enabling
			autoRotationY = rotation.y;
		}

		// Apply transforms to Three.js group
		groupRef.position.set(position.x, position.y, position.z);
		groupRef.rotation.set(rotation.x, rotation.y, rotation.z);
		groupRef.scale.setScalar(scale);
	});
</script>

<!-- Card group with all transforms -->
<T.Group bind:ref={groupRef}>
	<HeroCardGeometry
		{layerSeparation}
		{textureIndex}
		{currentSection}
		{sectionProgress}
	/>

	<!-- Laser scan effect for verification section -->
	<LaserScanEffect
		active={laserScanActive}
		cardWidth={2}
		cardHeight={2 / 1.586}
		scanSpeed={0.8}
		{glowIntensity}
	/>
</T.Group>
