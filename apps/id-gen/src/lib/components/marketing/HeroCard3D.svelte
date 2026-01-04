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
	import PhoneMesh from './PhoneMesh.svelte';
	import LanyardMesh from './LanyardMesh.svelte';
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
	let highlightLayer = $state(0);

	// Visual state flags
	let autoRotate = $state(true);
	let autoRotateSpeed = $state(0.3);
	let lanyardVisible = $state(false);
	let laserScanActive = $state(false);
	let glowIntensity = $state(0);

	let typingProgress = $state(1);

	// Auto-rotation accumulator
	let autoRotationY = $state(0);

	// Scroll velocity for lanyard physics
	let scrollVelocity = $state(0);
	let prevScrollProgress = $state(0);

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

	// Cache previous state to avoid unnecessary calculations
	let prevState = $state<CardState | null>(null);
	let prevSectionProgress = $state<number>(0);
	let cachedTransform: ReturnType<typeof getStateTransform> | null = null;
	let cachedVisuals: ReturnType<typeof getStateVisuals> | null = null;

	// States that animate based on sectionProgress (need recalc every frame)
	const ANIMATED_STATES: CardState[] = [
		'tap-approach',
		'tap-bump',
		'tap-linger',
		'tap-success',
		'exploding-main',
		'collapsing',
		'segmentation',
		'shrinking',
		'growing',
		'systemScale',
		'encode'
	];

	/**
	 * Animation loop - runs every frame
	 */
	useTask((delta) => {
		if (!groupRef) return;

		// Recalculate when state changes OR when sectionProgress changes for animated states
		const needsRecalc =
			currentState !== prevState ||
			!cachedTransform ||
			!cachedVisuals ||
			(ANIMATED_STATES.includes(currentState) && sectionProgress !== prevSectionProgress);

		if (needsRecalc) {
			cachedTransform = getStateTransform(currentState, sectionProgress);
			cachedVisuals = getStateVisuals(currentState, sectionProgress, currentSection);
			prevState = currentState;
			prevSectionProgress = sectionProgress;
		}

		if (!cachedTransform || !cachedVisuals) return;

		const targetTransform = cachedTransform;
		const targetVisuals = cachedVisuals;

		// Dynamic lerp speed based on state
		// Tap interactions need to be snappy/responsive to show the procedural animation details
		let currentLerpSpeed = LERP_SPEED;
		
		if (currentState.startsWith('tap-')) {
			// Much faster for tap interactions so we don't smooth out the "bounce" or "vibration"
			currentLerpSpeed = 20; 
			
			if (currentState === 'tap-linger') {
				// Slightly smoother for the floating/breathing phase
				currentLerpSpeed = 10;
			}
		}

		// Smoothly interpolate toward targets
		const lerpFactor = Math.min(1, delta * currentLerpSpeed);

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
		highlightLayer = targetVisuals.highlightLayer;

		// Typing speed tied to sectionProgress (scroll position)
		// Start of section = very slow, end of section = 1x
		let typingLerpFactor = lerpFactor;
		if (currentSection === 'encode') {
			// Speed based on how far through the section (0.02x to 1x)
			const speedMultiplier = 0.02 + sectionProgress * 0.98;
			typingLerpFactor = Math.min(1, delta * LERP_SPEED * speedMultiplier);
		} else if (currentSection === 'hero') {
			// Untyping: use inverse - further from encode = slower
			const speedMultiplier = 0.02 + (1 - sectionProgress) * 0.98;
			typingLerpFactor = Math.min(1, delta * LERP_SPEED * speedMultiplier);
		}
		typingProgress = lerp(typingProgress, targetVisuals.typingProgress, typingLerpFactor);

		// Discrete state changes (no lerp needed)
		autoRotate = targetVisuals.autoRotate;
		autoRotateSpeed = targetVisuals.autoRotateSpeed;
		textureIndex = targetVisuals.textureIndex;
		lanyardVisible = targetVisuals.lanyardVisible;
		laserScanActive = targetVisuals.laserScanActive;

		// Calculate target rotation based on mode
		let targetRotX = targetTransform.rotation.x;
		let targetRotY = targetTransform.rotation.y;
		let targetRotZ = targetTransform.rotation.z;

		if (autoRotate) {
			// Increase speed multiplier (User requested faster)
			const OSCILLATION_SPEED = 3.0;
			autoRotationY += delta * autoRotateSpeed * OSCILLATION_SPEED;

			// Fan oscillation targets
			targetRotY = Math.sin(autoRotationY) * 0.4;
			targetRotX = Math.sin(autoRotationY * 0.7 + 1) * 0.15;
			targetRotZ = Math.sin(autoRotationY * 0.5 + 2) * 0.05;
		} else {
			// Reset accumulator when not auto-rotating to prevent large values
			// We can sync it to current Y to avoid phase jump if we re-enter,
			// but sine inverse is singular. Resetting is stable.
			autoRotationY = 0;
		}

		// Always lerp to target for smooth transitions
		rotation.x = lerp(rotation.x, targetRotX, lerpFactor);
		rotation.y = lerp(rotation.y, targetRotY, lerpFactor);
		rotation.z = lerp(rotation.z, targetRotZ, lerpFactor);

		// Apply transforms to Three.js group
		groupRef.position.set(position.x, position.y, position.z);
		groupRef.rotation.set(rotation.x, rotation.y, rotation.z);
		groupRef.scale.setScalar(scale);

		// Track scroll velocity for lanyard physics
		scrollVelocity = (scrollProgress - prevScrollProgress) / delta;
		prevScrollProgress = scrollProgress;
	});
</script>

<!-- Card group with all transforms -->
<T.Group bind:ref={groupRef}>
	<HeroCardGeometry
		{layerSeparation}
		{textureIndex}
		{currentSection}
		{sectionProgress}
		{typingProgress}
		{highlightLayer}
	/>

	<!-- Laser scan effect for verification section -->
	<!-- Laser scan effect for verification section -->
	<LaserScanEffect
		active={laserScanActive}
		cardWidth={2 / 1.586}
		cardHeight={2}
		scanSpeed={0.8}
		{glowIntensity}
	/>

	<!-- Lanyard for shop section -->
	<LanyardMesh visible={lanyardVisible} {scrollVelocity} cardWidth={2 / 1.586} cardHeight={2} />
</T.Group>

<!-- Phone Model for Scan/Tap Sections -->
<PhoneMesh
	visible={currentSection === 'scan' || currentSection.startsWith('tap-')}
	section={currentSection}
	progress={sectionProgress}
/>
