<script lang="ts">
	/**
	 * LaserScanEffect.svelte - Red laser scan line with glow effect
	 *
	 * Renders a scanning laser line that moves across the card
	 * when in verification mode, with a trailing glow effect.
	 */
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';

	interface Props {
		active?: boolean;
		cardWidth?: number;
		cardHeight?: number;
		scanSpeed?: number;
		glowIntensity?: number;
	}

	let {
		active = false,
		cardWidth = 2,
		cardHeight = 1.26,
		scanSpeed = 0.8,
		glowIntensity = 1
	}: Props = $props();

	// Scan line position (0 to 1, normalized)
	let scanProgress = $state(0);

	// Glow material
	let glowMaterial: THREE.MeshBasicMaterial | null = $state(null);
	let lineMaterial: THREE.MeshBasicMaterial | null = $state(null);
	let trailMaterial: THREE.MeshBasicMaterial | null = $state(null);

	// Animation time accumulator
	let time = $state(0);

	onMount(() => {
		// Bright red laser line (Core)
		lineMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			transparent: true,
			opacity: 1.0,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending // Glow effect
		});

		// Outer glow (Intense)
		glowMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			transparent: true,
			opacity: 0.6,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending
		});

		// Trailing glow (Wider)
		trailMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			transparent: true,
			opacity: 0.3,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending
		});

		return () => {
			lineMaterial?.dispose();
			glowMaterial?.dispose();
			trailMaterial?.dispose();
		};
	});

	// Animation loop
	useTask((delta) => {
		if (!active) {
			scanProgress = 0;
			time = 0;
			return;
		}

		time += delta;

		// Oscillate scan position with sine wave (back and forth)
		scanProgress = (Math.sin(time * scanSpeed * Math.PI) + 1) / 2;

		// Update material opacity based on glow intensity
		if (glowMaterial) {
			glowMaterial.opacity = 0.4 * glowIntensity;
		}
		if (lineMaterial) {
			lineMaterial.opacity = 0.9 * glowIntensity;
		}
		if (trailMaterial) {
			trailMaterial.opacity = 0.15 * glowIntensity;
		}
	});

	// Calculate Y position from progress
	function getYPosition(progress: number): number {
		return (progress - 0.5) * cardHeight * 0.9;
	}
</script>

{#if active && lineMaterial && glowMaterial && trailMaterial}
	<!-- Main scan group - positioned in front of card -->
	<!-- Main scan group - positioned in front of card -->
	<T.Group position.z={0.02}>
		<!-- Trailing glow (wider, behind) -->
		<T.Mesh position.y={getYPosition(scanProgress)} position.z={-0.01} material={trailMaterial}>
			<T.PlaneGeometry args={[cardWidth * 1.4, 0.2]} />
		</T.Mesh>

		<!-- Outer glow (medium width) -->
		<T.Mesh position.y={getYPosition(scanProgress)} material={glowMaterial}>
			<T.PlaneGeometry args={[cardWidth * 1.3, 0.08]} />
		</T.Mesh>

		<!-- Main laser line (thin and bright) -->
		<T.Mesh position.y={getYPosition(scanProgress)} position.z={0.001} material={lineMaterial}>
			<T.PlaneGeometry args={[cardWidth * 1.3, 0.02]} />
		</T.Mesh>

		<!-- Leading edge highlight (Tinted RED) -->
		<T.Mesh position.y={getYPosition(scanProgress)} position.z={0.002}>
			<T.PlaneGeometry args={[cardWidth * 1.3, 0.005]} />
			<T.MeshBasicMaterial color={0xffaaaa} transparent opacity={0.9 * glowIntensity} />
		</T.Mesh>

		<!-- Horizontal edge markers (scanning bounds - moved out) -->
		{#each [-1, 1] as side (side)}
			<T.Mesh
				position.x={side * cardWidth * 0.65}
				position.y={getYPosition(scanProgress)}
				position.z={0.001}
			>
				<T.PlaneGeometry args={[0.02, 0.08]} />
				<T.MeshBasicMaterial color={0xff0000} transparent opacity={0.8 * glowIntensity} />
			</T.Mesh>
		{/each}
	</T.Group>

	<!-- "Verified" glow effect at bottom (when scan completes) -->
	{#if scanProgress > 0.9}
		<T.Mesh position.y={-cardHeight * 0.55} position.z={0.02}>
			<T.PlaneGeometry args={[0.8, 0.15]} />
			<T.MeshBasicMaterial
				color={0x00ff44}
				transparent
				opacity={(scanProgress - 0.9) * 10 * 0.5 * glowIntensity}
			/>
		</T.Mesh>
	{/if}
{/if}
