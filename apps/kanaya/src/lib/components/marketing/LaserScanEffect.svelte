<script lang="ts">
	/**
	 * LaserScanEffect.svelte - Super vivid laser using MeshLineMaterial
	 */
	import { T, useTask } from '@threlte/core';
	import { MeshLineMaterial, MeshLineGeometry } from '@threlte/extras';
	import { Vector3, Color } from 'three';

	interface Props {
		active?: boolean;
		cardWidth?: number;
		cardHeight?: number;
		scanSpeed?: number;
	}

	let {
		active = false,
		cardWidth = 2,
		cardHeight = 1.26,
		scanSpeed = 0.8,
	}: Props = $props();

	let scanProgress = $state(0);
	let time = $state(0);
	let pulseWidth = $state(0.025);

	// Create line points reactively based on cardWidth
	const numPoints = 2;

	const linePoints = $derived.by(() => {
		const length = cardWidth * 1.3;
		const points: Vector3[] = [];
		for (let i = 0; i <= numPoints; i++) {
			const x = -length / 2 + (length * i) / numPoints;
			points.push(new Vector3(x, 0, 0));
		}
		return points;
	});

	useTask((delta) => {
		if (!active) {
			scanProgress = 0;
			time = 0;
			return;
		}

		time += delta;
		scanProgress = (Math.sin(time * scanSpeed * Math.PI) + 1) / 2;

		// Pulse the width for extra vividness
		pulseWidth = 0.022 + Math.sin(time * 15) * 0.003;
	});

	function getYPosition(progress: number): number {
		return (progress - 0.5) * cardHeight * 0.9;
	}

	// Super vivid red colors
	const hotCenterColor = new Color('#ff0000');
</script>

{#if active && linePoints.length > 0}
	<T.Group position.z={0.2} renderOrder={9999}>
		<!-- Outer glow layer (wide soft glow) -->
	
		<!-- Hot white center -->
		<T.Mesh
			position.y={getYPosition(scanProgress)}
			position.z={0.006}
			renderOrder={10003}
		>
			<MeshLineGeometry points={linePoints} />
			<MeshLineMaterial
				width={2}
				color={hotCenterColor}
				opacity={1}
				transparent
				depthTest={false}
				attenuate={false}
				toneMapped={false}
			/>
		</T.Mesh>
	</T.Group>
{/if}
