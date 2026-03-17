<script lang="ts">
	/**
	 * InstancedCardGrid.svelte
	 * Final Polish: Continuous Fly-in, Overlapping Settle Phase, Seamless Unidirectional Rotation
	 * Update: Late Snap Rotation (Cards stay flat until 96% arrived)
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
		/** Combined animation progress: 0-1 mapping to all phases */
		animationProgress?: number;
	}

	let { visible = false, animationProgress = 0 }: Props = $props();

	// --- CONSTANTS ---
	const CARD_WIDTH = 0.2;
	const CARD_HEIGHT = CARD_WIDTH / 1.586;
	const TOTAL_CARDS = 50;

	// UPDATED: Reduced radius for a smaller sphere
	const SPHERE_RADIUS = 0.75;

	const GRID_COLS = 10;
	const GRID_ROWS = 5;
	const CARD_SPACING = 0.45;

	// Scale factor for latitude (0.9 = 90% of hemisphere, avoids pole overlapping)
	const LATITUDE_SCALE = 0.9;

	// --- STATE ---
	let instancedMesh: THREE.InstancedMesh | undefined = $state(undefined);
	let isReady = $state(false);
	let geometry: THREE.PlaneGeometry | null = $state(null);
	let material: THREE.MeshStandardMaterial | null = $state(null);
	const dummy = new THREE.Object3D();
	let time = $state(0);

	// --- POSITION ARRAYS ---
	let swarmPositions: { x: number; y: number; z: number }[] = [];
	let gridPositions: { x: number; y: number; z: number; col: number; row: number }[] = [];
	let meridianPositions: { x: number; y: number; z: number; col: number; row: number }[] = [];
	let fibonacciPositions: { x: number; y: number; z: number }[] = [];
	let cardToFibMapping: number[] = [];
	let settleDelays: number[] = [];

	/**
	 * Generate Meridian positions matching the end state of the wrapping phase.
	 */
	function generateMeridianPositions(count: number, radius: number, cols: number, rows: number) {
		const positions: { x: number; y: number; z: number; col: number; row: number }[] = [];

		for (let i = 0; i < count; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);

			// Match the visual end state of the wrapping animation
			const longitude = 1.5 * Math.PI - (col / cols) * Math.PI * 2;
			const latitudeProgress = (row + 0.5) / rows;
			const latitude = (latitudeProgress - 0.5) * Math.PI * LATITUDE_SCALE;

			positions.push({
				x: Math.cos(latitude) * Math.sin(longitude) * radius,
				y: Math.sin(latitude) * radius,
				z: Math.cos(latitude) * Math.cos(longitude) * radius,
				col,
				row
			});
		}
		return positions;
	}

	function generateFibonacciPositions(count: number, radius: number) {
		const positions: { x: number; y: number; z: number }[] = [];
		const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

		for (let i = 0; i < count; i++) {
			const y = 1 - (i / (count - 1)) * 2;
			const radiusAtY = Math.sqrt(1 - y * y);
			const theta = phi * i;

			positions.push({
				x: radiusAtY * Math.cos(theta) * radius,
				y: y * radius,
				z: radiusAtY * Math.sin(theta) * radius
			});
		}
		return positions;
	}

	function computeCardToFibMapping(meridian: any[], fib: any[]): number[] {
		const mapping: number[] = [];
		const usedFibIndices = new Set<number>();
		for (let i = 0; i < meridian.length; i++) {
			const pos = meridian[i];
			let closestIdx = -1;
			let closestDist = Infinity;
			for (let j = 0; j < fib.length; j++) {
				if (usedFibIndices.has(j)) continue;
				const fibPos = fib[j];
				const dx = pos.x - fibPos.x;
				const dy = pos.y - fibPos.y;
				const dz = pos.z - fibPos.z;
				const dist = dx * dx + dy * dy + dz * dz;
				if (dist < closestDist) {
					closestDist = dist;
					closestIdx = j;
				}
			}
			mapping.push(closestIdx);
			usedFibIndices.add(closestIdx);
		}
		return mapping;
	}

	function generateGridPositions(cols: number, rows: number, spacing: number) {
		const positions: { x: number; y: number; z: number; col: number; row: number }[] = [];
		const offsetX = ((cols - 1) * spacing) / 2;
		const offsetY = ((rows - 1) * spacing) / 2;

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				positions.push({
					x: col * spacing - offsetX,
					y: row * spacing - offsetY,
					z: 0,
					col,
					row
				});
			}
		}
		return positions;
	}

	function generateSwarmPositions(count: number) {
		const positions: { x: number; y: number; z: number }[] = [];
		for (let i = 0; i < count; i++) {
			positions.push({
				x: 4 + Math.random() * 8,
				y: (Math.random() - 0.5) * 8,
				z: -5 + Math.random() * 8
			});
		}
		return positions;
	}

	function generateSettleDelays(count: number) {
		const delays: number[] = [];
		for (let i = 0; i < count; i++) {
			delays.push(Math.random());
		}
		return delays;
	}

	// --- EASING ---
	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}
	function easeOutQuad(t: number): number {
		return 1 - (1 - t) * (1 - t);
	}
	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	onMount(() => {
		geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
		const texture = getCachedTexture('grid-card', () => createHeroCardTexture(256, 160, 'hero'));

		material = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: 0.5,
			metalness: 0.1,
			transparent: true,
			opacity: 0.7,
			side: THREE.DoubleSide
		});

		swarmPositions = generateSwarmPositions(TOTAL_CARDS);
		gridPositions = generateGridPositions(GRID_COLS, GRID_ROWS, CARD_SPACING);
		meridianPositions = generateMeridianPositions(TOTAL_CARDS, SPHERE_RADIUS, GRID_COLS, GRID_ROWS);
		fibonacciPositions = generateFibonacciPositions(TOTAL_CARDS, SPHERE_RADIUS);
		cardToFibMapping = computeCardToFibMapping(meridianPositions, fibonacciPositions);
		settleDelays = generateSettleDelays(TOTAL_CARDS);

		isReady = true;

		return () => {
			geometry?.dispose();
			material?.dispose();
		};
	});

	// --- ANIMATION ---
	useTask((delta) => {
		if (material) material.opacity = visible ? 0.75 : 0;
		if (!instancedMesh || !visible || swarmPositions.length === 0) return;

		time += delta;

		// --- PHASE TIMING CONFIG ---
		const PHASE_SWARM_END = 0.35;
		const PHASE_WRAP_END = 0.8;
		const PHASE_SETTLE_START = 0.75;

		// --- DERIVED PROGRESS ---
		let wrapProgress = 0;
		if (animationProgress > PHASE_SWARM_END) {
			wrapProgress = Math.min(
				1,
				(animationProgress - PHASE_SWARM_END) / (PHASE_WRAP_END - PHASE_SWARM_END)
			);
		}

		let settleProgress = 0;
		if (animationProgress > PHASE_SETTLE_START) {
			settleProgress = Math.min(
				1,
				(animationProgress - PHASE_SETTLE_START) / (1.0 - PHASE_SETTLE_START)
			);
		}

		// --- UNIFIED ROTATION LOGIC ---
		const wrapRotation = wrapProgress * Math.PI * 2;
		const idleRotation = time * 0.3;
		const currentRotation = wrapRotation + idleRotation;

		for (let i = 0; i < TOTAL_CARDS; i++) {
			const swarmPos = swarmPositions[i];
			const gridPos = gridPositions[i];
			const meridianPos = meridianPositions[i];
			const fibIdx = cardToFibMapping[i];
			const fibPos = fibonacciPositions[fibIdx];

			const col = gridPos.col;
			const staggerDelay = (i / TOTAL_CARDS) * 0.08;

			let finalX = 0,
				finalY = 0,
				finalZ = 0;
			let rotX = 0,
				rotY = 0,
				rotZ = 0;
			let scale = 1;

			if (animationProgress <= PHASE_SWARM_END) {
				// --- PHASE 1: CONTINUOUS SWARM -> MOVING GRID ---
				const t = animationProgress / PHASE_SWARM_END;

				// Moving Reference Frame (Right -> Left)
				const flyStart = 8;
				const flyEnd = -12;
				const currentFrameX = flyStart + (flyEnd - flyStart) * t;

				// Formation logic
				const rawFormT = (t - staggerDelay) / (0.8 - staggerDelay);
				const formT = easeOutCubic(Math.max(0, Math.min(1, rawFormT)));

				const targetGridX = currentFrameX + gridPos.x;

				// Interpolate: Swarm -> Moving Grid
				finalX = swarmPos.x + (targetGridX - swarmPos.x) * formT;
				finalY = swarmPos.y + (gridPos.y - swarmPos.y) * formT;
				finalZ = swarmPos.z + (gridPos.z - swarmPos.z) * formT;

				// Wiggle
				finalY += Math.sin(time * 0.5 + i * 0.3) * 0.05;
				finalZ += Math.sin((gridPos.x + gridPos.y) * 0.5 + time * 0.3) * 0.05;

				const flutter = Math.max(0, 1 - formT * 1.5);
				rotZ = Math.sin(time * 5 + i) * 0.2 * flutter;
				rotY = Math.sin(time * 3 + i * 0.5) * 0.1 * flutter;
			} else {
				// --- PHASE 2 & 3: WRAP + SETTLE (OVERLAPPING) ---

				// 1. Calculate Base "Wrap" Position (Columns forming sphere)
				const columnIndex = GRID_COLS - 1 - col;
				const colStart = columnIndex / GRID_COLS;
				const colDuration = 1 / GRID_COLS;
				const colT = Math.max(0, Math.min(1, (wrapProgress - colStart) / colDuration));
				const easedColT = easeInOutCubic(colT);

				// "Feeding" logic (Moving from left into sphere)
				const feedT = easeOutQuad(
					Math.min(1, (wrapProgress - colStart * 0.5) / (1 - colStart * 0.5))
				);
				const gridStartX = -15;
				const gridEndX = 0;
				const incomingGridX = gridPos.x + gridStartX + (gridEndX - gridStartX) * feedT;

				// Target Sphere Position
				const attachmentAngle =
					-Math.PI / 2 + currentRotation - (columnIndex / GRID_COLS) * Math.PI * 2;

				const latitude = ((gridPos.row + 0.5) / GRID_ROWS - 0.5) * Math.PI * LATITUDE_SCALE;

				const sphereX = Math.cos(latitude) * Math.sin(attachmentAngle) * SPHERE_RADIUS;
				const sphereY = Math.sin(latitude) * SPHERE_RADIUS;
				const sphereZ = Math.cos(latitude) * Math.cos(attachmentAngle) * SPHERE_RADIUS;

				// Interpolate: Incoming Grid Line -> Sphere Surface
				let wrapX = incomingGridX + (sphereX - incomingGridX) * easedColT;
				let wrapY = gridPos.y + (sphereY - gridPos.y) * easedColT;
				let wrapZ = gridPos.z + (sphereZ - gridPos.z) * easedColT;

				// 2. Calculate "Settle" Target (Fibonacci)
				let settleX = wrapX;
				let settleY = wrapY;
				let settleZ = wrapZ;

				if (settleProgress > 0) {
					const rotAngle = currentRotation;

					// Standard rotation for Fibonacci target
					const cosR = Math.cos(rotAngle);
					const sinR = Math.sin(rotAngle);

					const fibRotX = fibPos.x * cosR - fibPos.z * sinR;
					const fibRotZ = fibPos.x * sinR + fibPos.z * cosR;

					// Individual card settle timing
					const delay = settleDelays[i];
					const cardDur = 0.5;
					const cardStart = delay * 0.3; // Stagger

					const cardT = Math.max(0, Math.min(1, (settleProgress - cardStart) / cardDur));
					const smoothCardT = easeInOutCubic(cardT);

					// Blend
					finalX = wrapX + (fibRotX - wrapX) * smoothCardT;
					finalY = wrapY + (fibPos.y - wrapY) * smoothCardT;
					finalZ = wrapZ + (fibRotZ - wrapZ) * smoothCardT;

					// Radius correction
					const dist = Math.sqrt(finalX * finalX + finalY * finalY + finalZ * finalZ);
					if (dist > 0 && smoothCardT > 0.01) {
						const f = SPHERE_RADIUS / dist;
						finalX *= f;
						finalY *= f;
						finalZ *= f;
					}
				} else {
					finalX = wrapX;
					finalY = wrapY;
					finalZ = wrapZ;
				}

				// ===============================================
				// ROTATION LOGIC (FLAT UNTIL 96% -> SNAP)
				// ===============================================

				// 1. Target Rotation: Where it SHOULD look if it was fully settled
				const targetRotY = Math.atan2(sphereX, sphereZ);
				const targetRotX = -Math.asin(sphereY / SPHERE_RADIUS);

				if (settleProgress > 0.01) {
					// Phase 3: Settle (Look away from actual position)
					rotY = Math.atan2(finalX, finalZ);
					rotX = -Math.asin(finalY / SPHERE_RADIUS);

					// Idle movement
					if (settleProgress > 0.5) {
						finalX += Math.sin(time * 2 + i * 0.7) * 0.01;
						finalY += Math.cos(time * 1.5 + i * 0.3) * 0.008;
					}
				} else {
					// Phase 2: Wrap Fly-in
					// Logic: Keep rotation exactly 0 (flat) until easedColT >= 0.96
					const SNAP_THRESHOLD = 0.75;

					// Remap the last 4% of the flight to be 0->1
					const snapT = Math.max(0, (easedColT - SNAP_THRESHOLD) / (1 - SNAP_THRESHOLD));

					rotY = targetRotY * snapT;
					rotX = targetRotX * snapT;
					rotZ = 0;
				}
			}

			dummy.position.set(finalX, finalY, finalZ);
			dummy.rotation.set(rotX, rotY, rotZ);
			dummy.scale.setScalar(scale);
			dummy.updateMatrix();
			instancedMesh.setMatrixAt(i, dummy.matrix);
		}

		instancedMesh.instanceMatrix.needsUpdate = true;
	});
</script>

{#if isReady && geometry && material}
	<T.Group
		position.y={0.3}
		position.z={-0.5}
		rotation.z={animationProgress < 0.5
			? Math.PI * 0.06
			: Math.PI * 0.06 * Math.max(0, 1 - (animationProgress - 0.5) * 2)}
		rotation.x={animationProgress < 0.5
			? -Math.PI * 0.06
			: -Math.PI * 0.06 * Math.max(0, 1 - (animationProgress - 0.5) * 2)}
		scale={1.8}
	>
		<T.InstancedMesh
			bind:ref={instancedMesh}
			args={[geometry, material, TOTAL_CARDS]}
			frustumCulled={false}
		/>
	</T.Group>
{/if}
