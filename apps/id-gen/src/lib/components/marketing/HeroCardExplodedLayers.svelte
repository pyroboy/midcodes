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
	const layer1Scale = $derived([cardWidth * 0.95, cardHeight * 0.95, 1]);
	const layer1GridScale = $derived([cardWidth * 0.9, cardHeight * 0.9, 1]);
	const chipScale = [0.4, 0.5, 0.01];
	const chipAccentScale = [0.2, 0.02, 1];
	const qrBgScale = [0.35, 0.35, 1];
	const qrFgScale = [0.3, 0.3, 1];
	const iconScale = [0.08, 0.08, 1];
	const statusScale = $derived([cardWidth * 0.8, 0.05, 1]);

	// Text lines scales
	const textScales = $derived([
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
			<T.MeshBasicMaterial color={0x3a3a6a} wireframe transparent opacity={0.3} />
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
		{#each [0.4, 0.3, -0.1, -0.2, -0.3] as yPos, i}
			<T.Mesh position.y={yPos} position.x={0.1} geometry={planeGeo} scale={textScales[i]}>
				<T.MeshBasicMaterial
					color={0xaaddff}
					transparent
					opacity={Math.min(1, layerSeparation * 2)}
				/>
			</T.Mesh>
		{/each}
	</T.Group>

	<!-- Layer 4: QR Code -->
	<T.Group position.z={layerSeparation * 1.5}>
		<T.Mesh position.x={0.4} position.y={-0.5} geometry={planeGeo} scale={qrBgScale}>
			<T.MeshBasicMaterial
				color={0xffffff}
				transparent
				opacity={Math.min(1, layerSeparation * 2)}
			/>
		</T.Mesh>
		<T.Mesh
			position.x={0.4}
			position.y={-0.5}
			position.z={0.001}
			geometry={planeGeo}
			scale={qrFgScale}
		>
			<T.MeshBasicMaterial color={0x000000} wireframe transparent opacity={0.5} />
		</T.Mesh>
	</T.Group>

	<!-- Layer 5: Holographic/Status Icons -->
	<T.Group position.z={layerSeparation * 1.9}>
		<!-- Top right icon -->
		<T.Mesh position.x={0.5} position.y={0.8} geometry={circleGeo} scale={iconScale}>
			<T.MeshBasicMaterial color={0x00ff00} transparent opacity={0.8} />
		</T.Mesh>
		<!-- Bottom center status bar -->
		<T.Mesh position.y={-0.8} geometry={planeGeo} scale={statusScale}>
			<T.MeshBasicMaterial color={0x00ffff} transparent opacity={0.6} />
		</T.Mesh>
	</T.Group>
{/if}
