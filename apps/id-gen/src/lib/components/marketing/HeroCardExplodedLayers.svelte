<script lang="ts">
	/**
	 * HeroCardExplodedLayers.svelte
	 *
	 * Renders the 5 layers that appear when the card explodes in the Architecture section.
	 */
	import { T } from '@threlte/core';
	import * as THREE from 'three';

	interface Props {
		layerSeparation: number;
		middleLayerMaterial: THREE.MeshStandardMaterial;
		cardWidth: number;
		cardHeight: number;
	}

	let { layerSeparation, middleLayerMaterial, cardWidth, cardHeight }: Props = $props();
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
	<!-- Layer 1: Base Grid/Background Data -->
	<T.Group position.z={layerSeparation * 0.3}>
		<T.Mesh material={middleLayerMaterial} geometry={planeGeo} scale={layer1Scale} />
		<!-- Grid pattern -->
		<T.Mesh position.z={0.001} geometry={planeGeo} scale={layer1GridScale}>
			<T.MeshStandardMaterial color={0xffffff} wireframe transparent opacity={0.8} emissive={0x8888ff} emissiveIntensity={1.0} />
		</T.Mesh>
	</T.Group>

	<!-- Layer 2: Photo Chip -->
	<T.Group position.z={layerSeparation * 0.7}>
		<T.Mesh position.x={-0.65} position.y={0} geometry={boxGeo} scale={chipScale}>
			<T.MeshBasicMaterial
				color={0x6a6aaa}
				transparent
				opacity={Math.min(1, layerSeparation * 2)}
			/>
		</T.Mesh>
		<!-- Chip accents -->
		<T.Mesh position.x={-0.65} position.y={0.3} geometry={planeGeo} scale={chipAccentScale}>
			<T.MeshBasicMaterial color={0xffaa00} />
		</T.Mesh>
	</T.Group>

	<!-- Layer 3: Text Lines (Identity Data) -->
	<T.Group position.z={layerSeparation * 1.1}>
		{#each [0.4, 0.3, -0.1, -0.2, -0.3] as yPos, i (i)}
			<T.Mesh position.y={yPos} position.x={0.1} geometry={planeGeo} scale={textScales[i]}>
				<T.MeshBasicMaterial
					color={0xaaddff}
					transparent
					opacity={Math.min(1, layerSeparation * 2)}
				/>
			</T.Mesh>
		{/each}
	</T.Group>

	<!-- Layer 4: QR Code (Moved to HeroCardGeometry for all-section visibility) -->

	<!-- Layer 5: Holographic/Status Icons -->
	<T.Group position.z={layerSeparation * 1.9}>
		<!-- Top right icon (Green placeholder removed, now handled by parent) -->
		<!-- Bottom center status bar -->
		<T.Mesh position.y={-0.8} geometry={planeGeo} scale={statusScale}>
			<T.MeshBasicMaterial color={0x00ffff} transparent opacity={0.6} />
		</T.Mesh>
	</T.Group>
{/if}
