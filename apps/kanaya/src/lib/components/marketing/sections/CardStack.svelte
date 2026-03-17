<script lang="ts">
	/**
	 * CardStack.svelte - A stack of physical cards with a lanyard
	 *
	 * Renders an InstancedMesh of 50 cards stacked neatly.
	 * A custom tube geometry renders a lanyard winding around them.
	 */
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { createRoundedRectCard } from '$lib/utils/cardGeometry';
	import {
		getCachedTexture,
		createHeroCardTexture,
		createCardBackTexture
	} from '$lib/marketing/textures/MarketingTextureManager';

	interface Props {
		visible: boolean;
		scrollProgress: number;
	}

	let { visible = false, scrollProgress = 0 }: Props = $props();

	// Config
	const COUNT = 50;
	const CARD_THICKNESS = 0.007; // 0.76mm standard
	const STACK_HEIGHT = COUNT * CARD_THICKNESS;
	const CARD_HEIGHT = 2;
	const CARD_WIDTH = CARD_HEIGHT / 1.586;
	const RADIUS = 0.08;

	// Instanced Mesh State
	let instancedMesh: THREE.InstancedMesh | null = $state(null);
	let geometry: THREE.BufferGeometry | null = $state(null);
	let cardMaterial: THREE.MeshStandardMaterial | null = $state(null);

	// Lanyard State
	let lanyardGeometry: THREE.TubeGeometry | null = $state(null);
	let lanyardMaterial: THREE.MeshStandardMaterial | null = $state(null);

	// Group ref for animation
	let groupRef: THREE.Group | undefined = $state();

	onMount(() => {
		async function init() {
			// 1. Create Card Geometry (reuse utility but merge parts or use just the edge/block for efficiency)
			// For a stack, we primarily see edges. A simple Box with rounded corners or the actual geometry?
			// Using the actual geometry is better for closeups.
			const cardGeo = await createRoundedRectCard(CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS, RADIUS);
			// For instanced mesh, we need a single geometry. merging front/back/edge is complex with materials.
			// Ideally, we just use a white material for the stack edges/bodies to look like raw PVC cards waiting for print,
			// or maybe printed cards. Let's assume they are printed cards.
			// Simplified: Use a BoxGeometry for the stack cards to save draw calls if we don't need perfect rounded corners on every single one,
			// BUT for visual quality, let's try to use the ExtrudeGeometry from createRoundedRectCard if possible,
			// or just standard BoxGeometry with a white material to look like "blank stock" or "finished stack".

			// Let's use a simple BoxGeometry for performance, but mapped to look good.
			// Actually, let's use the edge geometry from the card utils to keep rounded shape.
			// cardGeo.edgeGeometry is the curve.

			// For the stack, we'll just use a white "PVC" material.
			geometry = cardGeo.edgeGeometry; // This is just the rim.
			// We need a full solid shape.
			// Let's stick to a Box with slightly rounded corners via normal map or just a high-res plain Box.
			// Simpler: standard box, no rounded corners for the stack items below the top one.
			// Wait, the top one is the "Hero" card usually.
			// Let's make the stack "Blank PVC Cards" (White)
			const contentGeo = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS);

			// Material
			cardMaterial = new THREE.MeshStandardMaterial({
				color: 0xffffff,
				roughness: 0.2,
				metalness: 0.1
			});

			instancedMesh = new THREE.InstancedMesh(contentGeo, cardMaterial, COUNT);

			const dummy = new THREE.Object3D();
			// Stack them up
			for (let i = 0; i < COUNT; i++) {
				dummy.position.set(
					(Math.random() - 0.5) * 0.05, // Slight jitter
					-i * CARD_THICKNESS - 0.2, // Start below and stack down
					(Math.random() - 0.5) * 0.05
				);
				dummy.rotation.set(
					Math.PI / 2, // Lay flat
					0,
					(Math.random() - 0.5) * 0.1 // Slight rotation jitter
				);
				dummy.updateMatrix();
				instancedMesh.setMatrixAt(i, dummy.matrix);
			}
			instancedMesh.instanceMatrix.needsUpdate = true;

			// 2. Create Lanyard (Coiled around)
			// A spiral curve
			const spiralPoints = [];
			const spiralRadius = CARD_WIDTH * 0.7;
			const spiralHeight = 1.0;
			const loops = 3;
			for (let i = 0; i <= 100; i++) {
				const t = i / 100;
				const angle = t * Math.PI * 2 * loops;
				const y = (1 - t) * spiralHeight - (STACK_HEIGHT + 0.5); // Snake around vertically
				const x = Math.cos(angle) * spiralRadius;
				const z = Math.sin(angle) * spiralRadius;
				spiralPoints.push(new THREE.Vector3(x, y, z));
			}
			const curve = new THREE.CatmullRomCurve3(spiralPoints);
			lanyardGeometry = new THREE.TubeGeometry(curve, 100, 0.05, 8, false);

			lanyardMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a1a2e,
				roughness: 0.6
			});
		}

		init();

		return () => {
			cardMaterial?.dispose();
			geometry?.dispose();
			lanyardGeometry?.dispose();
			lanyardMaterial?.dispose();
		};
	});

	// Scale state for smooth transition
	let currentScale = $state(0);

	useTask((delta) => {
		if (!groupRef) return;

		const targetScale = visible ? 1 : 0;
		const lerpSpeed = 5;

		// Smoothly interpolate scale
		currentScale = currentScale + (targetScale - currentScale) * Math.min(1, delta * lerpSpeed);

		// Apply scale
		groupRef.scale.setScalar(currentScale);

		// Optimization: hide when very small
		groupRef.visible = currentScale > 0.01;
	});
</script>

<T.Group bind:ref={groupRef} position={[0, -0.5, 0]} {visible}>
	{#if instancedMesh}
		<T.Mesh is={instancedMesh} castShadow receiveShadow />
	{/if}

	{#if lanyardGeometry && lanyardMaterial}
		<T.Mesh geometry={lanyardGeometry} material={lanyardMaterial} castShadow />
	{/if}
</T.Group>
