<script lang="ts">
	/**
	 * LanyardMesh.svelte - Lanyard with physics-based swing
	 *
	 * Renders a lanyard strap attached to the top of the ID card.
	 * Uses pendulum physics for realistic swing motion.
	 */
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import {
		updateLanyardPhysics,
		applyImpulse,
		createLanyardState,
		DEFAULT_LANYARD_CONFIG,
		type LanyardState
	} from '$lib/marketing/animation/LanyardPhysics';

	interface Props {
		visible?: boolean;
		scrollVelocity?: number;
		cardWidth?: number;
		cardHeight?: number;
	}

	let {
		visible = false,
		scrollVelocity = 0,
		cardWidth = 2,
		cardHeight = 1.26
	}: Props = $props();

	// Lanyard dimensions
	const LANYARD_WIDTH = 0.08;
	const LANYARD_LENGTH = 1.2;
	const LANYARD_SEGMENTS = 12;

	// Physics state
	let physicsState = $state<LanyardState>(createLanyardState());

	// Group reference
	let groupRef: THREE.Group | undefined = $state(undefined);

	// Materials
	let strapMaterial: THREE.MeshStandardMaterial | null = $state(null);
	let clipMaterial: THREE.MeshStandardMaterial | null = $state(null);

	// Curve geometry
	let curveGeometry: THREE.TubeGeometry | null = $state(null);
	let isReady = $state(false);

	// Previous scroll velocity for impulse calculation
	let prevScrollVelocity = $state(0);

	onMount(() => {
		// Create strap material (fabric-like)
		strapMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a2e, // Dark blue-gray
			roughness: 0.8,
			metalness: 0.0,
			side: THREE.DoubleSide
		});

		// Create clip material (metallic)
		clipMaterial = new THREE.MeshStandardMaterial({
			color: 0xcccccc,
			roughness: 0.3,
			metalness: 0.8
		});

		// Create initial curve
		updateCurveGeometry();

		isReady = true;

		return () => {
			strapMaterial?.dispose();
			clipMaterial?.dispose();
			curveGeometry?.dispose();
		};
	});

	/**
	 * Update the tube geometry based on physics state
	 */
	function updateCurveGeometry() {
		// Dispose old geometry
		curveGeometry?.dispose();

		// Create curve points
		const swing = physicsState.angle;

		// Top anchor (above card, offset by swing)
		const topX = Math.sin(swing) * LANYARD_LENGTH * 0.3;
		const topZ = Math.cos(swing) * 0.1;

		// Create a simple curved path
		const curve = new THREE.CatmullRomCurve3([
			new THREE.Vector3(0, cardHeight / 2 + LANYARD_LENGTH, 0), // Top attachment point (fixed)
			new THREE.Vector3(topX * 0.5, cardHeight / 2 + LANYARD_LENGTH * 0.7, topZ * 0.5),
			new THREE.Vector3(topX * 0.7, cardHeight / 2 + LANYARD_LENGTH * 0.4, topZ * 0.7),
			new THREE.Vector3(topX * 0.3, cardHeight / 2 + 0.05, topZ * 0.3) // Near card top
		]);

		curveGeometry = new THREE.TubeGeometry(curve, LANYARD_SEGMENTS, LANYARD_WIDTH / 2, 8, false);
	}

	// Animation loop
	useTask((delta) => {
		if (!visible) {
			// Reset physics when not visible
			physicsState = createLanyardState();
			return;
		}

		// Apply impulse from scroll velocity changes
		const velocityChange = scrollVelocity - prevScrollVelocity;
		if (Math.abs(velocityChange) > 0.01) {
			physicsState = applyImpulse(physicsState, velocityChange * 0.5);
		}
		prevScrollVelocity = scrollVelocity;

		// Update physics
		physicsState = updateLanyardPhysics(physicsState, DEFAULT_LANYARD_CONFIG, delta);

		// Update curve geometry (throttled - every few frames)
		if (Math.abs(physicsState.angularVelocity) > 0.001) {
			updateCurveGeometry();
		}

		// Apply rotation to group
		if (groupRef) {
			groupRef.rotation.z = physicsState.angle * 0.3; // Subtle rotation
		}
	});
</script>

{#if visible && isReady && strapMaterial && clipMaterial && curveGeometry}
	<T.Group bind:ref={groupRef}>
		<!-- Lanyard strap -->
		<T.Mesh geometry={curveGeometry} material={strapMaterial} />

		<!-- Metal clip at top -->
		<T.Mesh position.y={cardHeight / 2 + LANYARD_LENGTH} material={clipMaterial}>
			<T.BoxGeometry args={[0.15, 0.06, 0.03]} />
		</T.Mesh>

		<!-- Metal clip at card attachment -->
		<T.Mesh position.y={cardHeight / 2 + 0.03} material={clipMaterial}>
			<T.BoxGeometry args={[0.12, 0.04, 0.02]} />
		</T.Mesh>

		<!-- Decorative Baybayin pattern on strap (simplified) -->
		<T.Mesh position.y={cardHeight / 2 + LANYARD_LENGTH * 0.5} position.z={0.01}>
			<T.PlaneGeometry args={[LANYARD_WIDTH * 0.8, LANYARD_LENGTH * 0.3]} />
			<T.MeshBasicMaterial color={0x2a2a4e} transparent opacity={0.5} />
		</T.Mesh>
	</T.Group>
{/if}
