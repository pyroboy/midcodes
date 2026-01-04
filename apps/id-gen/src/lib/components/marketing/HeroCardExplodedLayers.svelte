<script lang="ts">
	/**
	 * HeroCardExplodedLayers.svelte
	 *
	 * Renders the 5 layers that appear when the card explodes in the Architecture section.
	 */
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';

	interface Props {
		layerSeparation: number;
		middleLayerMaterial: THREE.MeshStandardMaterial;
		cardWidth: number;
		cardHeight: number;
		highlightLayer?: number;
	}

	let {
		layerSeparation,
		middleLayerMaterial,
		cardWidth,
		cardHeight,
		highlightLayer = 0
	}: Props = $props();
	// Shared Geometries for optimization (Reuse unitary geometries and scale them)
	const planeGeo = new THREE.PlaneGeometry(1, 1);
	const boxGeo = new THREE.BoxGeometry(1, 1, 1);
	const circleGeo = new THREE.CircleGeometry(1, 16);

	// Cleanup
	$effect.root(() => {
		return () => {
			planeGeo.dispose();
			boxGeo.dispose();
			circleGeo.dispose();
		};
	});

	// Floating animation state
	let time = 0;
	let layer1Y = $state(0);
	let layer2Y = $state(0);
	let layer3Y = $state(0);
	let layer5Y = $state(0);

	useTask((delta) => {
		if (layerSeparation < 0.1) return; // Don't animate if closed
		
		time += delta;
		
		// Gentle floating: Amplitude 0.05, Speed 0.5-1.0
		layer1Y = Math.sin(time * 0.8) * 0.03;
		layer2Y = Math.sin(time * 0.7 + 1) * 0.04; 
		layer3Y = Math.sin(time * 0.6 + 2) * 0.05;
		layer5Y = Math.sin(time * 0.5 + 3) * 0.06;
	});

	// Derived scales to prevent inline array creation
	// Type as tuples for Threlte compatibility
	const layer1Scale: [number, number, number] = $derived([cardWidth * 0.95, cardHeight * 0.95, 1]);
	const layer1GridScale: [number, number, number] = $derived([
		cardWidth * 0.9,
		cardHeight * 0.9,
		1
	]);
	const chipScale: [number, number, number] = [0.4, 0.5, 0.01];
	const chipAccentScale: [number, number, number] = [0.2, 0.02, 1];
	const qrBgScale: [number, number, number] = [0.35, 0.35, 1];
	const qrFgScale: [number, number, number] = [0.3, 0.3, 1];
	const iconScale: [number, number, number] = [0.08, 0.08, 1];
	const statusScale: [number, number, number] = $derived([cardWidth * 0.8, 0.05, 1]);

	// Text lines scales
	const textScales: [number, number, number][] = $derived([
		[cardWidth * 0.4, 0.03, 1],
		[cardWidth * 0.4, 0.03, 1],
		[cardWidth * 0.6, 0.03, 1],
		[cardWidth * 0.6, 0.03, 1],
		[cardWidth * 0.6, 0.03, 1]
	]);
</script>

{#if layerSeparation > 0.05}
	<!-- Layer 2: Base Grid/Background Data -->
	{@const layer2Opacity = highlightLayer === 0 || highlightLayer === 2 ? 1 : 0.03}
	
	<T.Group position.z={layerSeparation * 0.3} position.y={layer1Y}>
		<T.Mesh material={middleLayerMaterial} geometry={planeGeo} scale={layer1Scale} />
		
		<!-- Main Grid pattern -->
		<T.Mesh position.z={0.001} geometry={planeGeo} scale={layer1GridScale}>
			<T.MeshStandardMaterial
				color={0xffffff}
				wireframe
				transparent
				opacity={0.8 * layer2Opacity}
				emissive={0x8888ff}
				emissiveIntensity={1.0 * layer2Opacity}
			/>
		</T.Mesh>
	</T.Group>

	<!-- Layer 3: Photo Chip -->
	{@const layer3Opacity = highlightLayer === 0 || highlightLayer === 3 ? 1 : 0.03}

	<T.Group position.z={layerSeparation * 0.7} position.y={layer2Y}>
		<T.Mesh position.x={-0.65} position.y={0} geometry={boxGeo} scale={chipScale}>
			<T.MeshBasicMaterial
				color={0x6a6aaa}
				transparent
				opacity={Math.min(1, layerSeparation * 2) * layer3Opacity}
			/>
		</T.Mesh>
		<!-- Chip accents -->
		<T.Mesh position.x={-0.65} position.y={0.3} geometry={planeGeo} scale={chipAccentScale}>
			<T.MeshBasicMaterial
				color={0xffaa00}
				transparent
				opacity={1 * layer3Opacity}
			/>
		</T.Mesh>
	</T.Group>

	<!-- Layer 4: Text Lines (Identity Data) -->
	{@const layer4Opacity = highlightLayer === 0 || highlightLayer === 4 ? 1 : 0.03}

	<T.Group position.z={layerSeparation * 1.1} position.y={layer3Y}>
		{#each [0.4, 0.3, -0.1, -0.2, -0.3] as yPos, i (i)}
			<!-- Main Text Line -->
			<T.Mesh position.y={yPos} position.x={0.1} geometry={planeGeo} scale={textScales[i]}>
				<T.MeshBasicMaterial
					color={0xaaddff}
					transparent
					opacity={Math.min(1, layerSeparation * 2) * layer4Opacity}
				/>
			</T.Mesh>
		{/each}
	</T.Group>

	<!-- Layer 5: QR Code (Moved to HeroCardGeometry for all-section visibility) -->

	<!-- Layer 6: Holographic/Status Icons -->
	{@const layer6Opacity = highlightLayer === 0 || highlightLayer === 6 ? 1 : 0.03}

	<T.Group position.z={layerSeparation * 1.9} position.y={layer5Y}>
		<!-- Top right icon (Green placeholder removed, now handled by parent) -->
		<!-- Bottom center status bar -->
		<T.Mesh position.y={-0.8} geometry={planeGeo} scale={statusScale}>
			<T.MeshBasicMaterial
				color={0x00ffff}
				transparent
				opacity={0.6 * layer6Opacity}
			/>
		</T.Mesh>
	</T.Group>
{/if}
