<script lang="ts">
	/**
	 * InstancedCardGrid.svelte - 50-card background grid using instanced rendering
	 *
	 * Renders many cards in a single draw call for performance.
	 * Cards have subtle animation and one "active" card that highlights.
	 */
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import {
		createHeroCardTexture,
		getCachedTexture
	} from '$lib/marketing/textures/MarketingTextureManager';

	interface Props {
		visible?: boolean;
		activeIndex?: number;
		gridCols?: number;
		gridRows?: number;
		cardSpacing?: number;
		scrollProgress?: number;
	}

	let {
		visible = false,
		activeIndex = 0,
		gridCols = 10,
		gridRows = 5,
		cardSpacing = 0.5,
		scrollProgress = 0
	}: Props = $props();

	// Card dimensions
	const CARD_WIDTH = 0.4;
	const CARD_HEIGHT = CARD_WIDTH / 1.586;

	// Compute total cards reactively
	let totalCards = $derived(gridCols * gridRows);

	// Instanced mesh reference
	let instancedMesh: THREE.InstancedMesh | undefined = $state(undefined);
	let isReady = $state(false);

	// Geometry and material
	let geometry: THREE.PlaneGeometry | null = $state(null);
	let material: THREE.MeshStandardMaterial | null = $state(null);

	// Dummy object for matrix calculations
	const dummy = new THREE.Object3D();

	// Store base positions for animation
	let basePositions: { x: number; y: number; z: number }[] = $state([]);

	// Animation time
	let time = $state(0);

	onMount(() => {
		// Create geometry
		geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);

		// Create texture
		const texture = getCachedTexture('grid-card', () => createHeroCardTexture(256, 160, 'hero'));

		// Create material
		material = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: 0.5,
			metalness: 0.1,
			transparent: true,
			opacity: 0.6,
			side: THREE.DoubleSide
		});

		// Calculate base positions in a grid
		const positions: { x: number; y: number; z: number }[] = [];
		const offsetX = ((gridCols - 1) * cardSpacing) / 2;
		const offsetY = ((gridRows - 1) * cardSpacing) / 2;

		for (let row = 0; row < gridRows; row++) {
			for (let col = 0; col < gridCols; col++) {
				positions.push({
					x: col * cardSpacing - offsetX,
					y: row * cardSpacing - offsetY,
					z: -3 + Math.random() * 0.5 // Slight z variation
				});
			}
		}
		basePositions = positions;

		isReady = true;

		return () => {
			geometry?.dispose();
			material?.dispose();
		};
	});

	// Initialize instance matrices when mesh is ready
	$effect(() => {
		if (!instancedMesh || basePositions.length === 0) return;

		for (let i = 0; i < totalCards; i++) {
			const pos = basePositions[i];
			dummy.position.set(pos.x, pos.y, pos.z);
			dummy.rotation.set(0, 0, 0);
			dummy.scale.setScalar(1);
			dummy.updateMatrix();
			instancedMesh.setMatrixAt(i, dummy.matrix);
		}
		instancedMesh.instanceMatrix.needsUpdate = true;
	});

	// Animation loop
	useTask((delta) => {
		// Always update material opacity (even when not visible)
		if (material) {
			material.opacity = visible ? 0.6 : 0;
		}

		// Skip expensive calculations when not visible
		if (!instancedMesh || !visible || basePositions.length === 0) return;

		time += delta;

		for (let i = 0; i < totalCards; i++) {
			const pos = basePositions[i];

			// Subtle floating animation
			const floatOffset = Math.sin(time * 0.5 + i * 0.3) * 0.05;

			// Subtle wavy motion
			const wavePhase = (pos.x + pos.y) * 0.5 + time * 0.5; // Mostly time based now
			const waveOffset = Math.sin(wavePhase) * 0.1;

			// Visible immediately at 0%, fade out at end (0.8-1.0)
			let opacity = 1;
			// Removed start fade-in to ensure visibility at 0%
			if (scrollProgress > 0.8) opacity = (1 - scrollProgress) / 0.2;

			// Apply fade to scale
			const fadeScale = opacity;

			const isActive = i === activeIndex;
			const scale = (isActive ? 1.3 : 1) * fadeScale;
			const zOffset = isActive ? 0.5 : 0;

			dummy.position.set(pos.x, pos.y + floatOffset, pos.z + waveOffset + zOffset);

			// Slight rotation based on position
			dummy.rotation.set(Math.sin(time * 0.3 + i) * 0.05, Math.cos(time * 0.2 + i) * 0.05, 0);

			dummy.scale.setScalar(scale);
			dummy.updateMatrix();
			instancedMesh.setMatrixAt(i, dummy.matrix);

			// Also control global material opacity if single draw call
			if (i === 0 && material) {
				material.opacity = opacity * 0.6;
			}
		}

		instancedMesh.instanceMatrix.needsUpdate = true;
	});

	// Cycle through active index for highlight effect
	$effect(() => {
		if (!visible) return;

		// Calculate which card should be "active" based on scroll
		const cycleSpeed = scrollProgress * totalCards * 2;
		activeIndex = Math.floor(cycleSpeed) % totalCards;
	});
</script>

{#if isReady && geometry && material}
	<!-- Outer Group: Handles Scroll Position (World Y) and Scale -->
	<!-- Moves straight up/down without drifting sideways -->
	<T.Group position.z={-2} scale={2.5} position.y={1.5 + scrollProgress * 5}>
		<!-- Inner Group: Handles Dutch Angle Rotation -->
		<T.Group rotation.z={Math.PI * 0.1} rotation.x={-Math.PI * 0.1}>
			<T.InstancedMesh
				bind:ref={instancedMesh}
				args={[geometry, material, totalCards]}
				frustumCulled={false}
			/>
		</T.Group>
	</T.Group>
{/if}
