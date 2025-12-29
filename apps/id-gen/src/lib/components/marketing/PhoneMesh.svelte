<script lang="ts">
	/**
	 * PhoneMesh.svelte - Simple 3D Phone model with animated screen
	 *
	 * Renders a phone that enters/exits and shows a scrolling "Verified" -> "Profile" sequence.
	 */
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { lerp } from '$lib/marketing/animation';
	import { drawScreenContent, PHONE_TEX_W, PHONE_TEX_H } from './utils/drawPhoneScreen';

	interface Props {
		visible?: boolean;
		progress?: number; // Section progress 0-1
		section?: string;
	}

	let { visible = false, progress = 0, section = 'scan' }: Props = $props();

	// Starting position (closer to edge for quicker entry)
	const START_X = 1.2;
	const START_ROT_Y = 0;

	// State
	let position = $state(new THREE.Vector3(START_X, 0, 0));
	let rotation = $state(new THREE.Euler(0, START_ROT_Y, 0));
	let opacity = $state(0);

	// Track previous visibility to detect when phone becomes visible
	let wasVisible = $state(false);

	// Reset position when visibility changes
	$effect(() => {
		if (visible && !wasVisible) {
			// Phone just became visible - reset to start position for clean entry
			position.set(START_X, 0, 0);
			rotation.set(0, START_ROT_Y, 0);
			opacity = 0;
		} else if (!visible && wasVisible) {
			// Phone just became invisible - reset for next entrance
			position.set(START_X, 0, 0);
			rotation.set(0, START_ROT_Y, 0);
			opacity = 0;
		}
		wasVisible = visible;
	});

	// Screen Texture
	let canvas: HTMLCanvasElement;
	let screenTexture: THREE.CanvasTexture | null = $state(null);
	let ctx: CanvasRenderingContext2D | null = null;

	// Dimensions
	const PHONE_WIDTH = 1.1;
	const PHONE_HEIGHT = 2.2;
	const PHONE_DEPTH = 0.15;
	const SCREEN_WIDTH = 1.0;
	const SCREEN_HEIGHT = 2.1;

	onMount(() => {
		// Create canvas for screen content
		canvas = document.createElement('canvas');
		canvas.width = PHONE_TEX_W;
		canvas.height = PHONE_TEX_H;
		ctx = canvas.getContext('2d');

		if (ctx) {
			drawScreenContent(ctx);
		}

		screenTexture = new THREE.CanvasTexture(canvas);
		screenTexture.wrapS = THREE.ClampToEdgeWrapping;
		screenTexture.wrapT = THREE.RepeatWrapping;
		screenTexture.repeat.set(1, 0.5); // Show half the texture height (the viewport)
		screenTexture.offset.set(0, 0.5); // Start at top (Verified screen)
		// Note: UV origin is bottom-left.
		// repeatY=0.5 means we see half.
		// offsetY=0.5 means we see the top half?
		// Let's verify mapping later. Usually offset=0.5 with repeat=0.5 shows top half.

		return () => {
			screenTexture?.dispose();
		};
	});

	useTask((delta) => {
		if (!visible) return;

		// Coordinate system:
		// X: left(-) to right(+), Y: down(-) to up(+), Z: into screen(-) to camera(+)
		// Card is on LEFT at x = -0.5, rotated -45° (front faces right)
		// Phone is on RIGHT at x = +0.5, rotated -90° (back faces left toward card)

		let targetX = START_X; // Default off-screen right
		let targetZ = 0;
		let targetRotY = 0;
		let scrollY = 0.5; // Start at top (Verified)

		// Phone back faces left = rotation.y = -π/2
		// Rotate slightly towards camera (+0.5 rad)
		const PHONE_SCAN_ROT = -Math.PI / 2 + 0.5;
		const SCAN_POS_X = 0.15; // Balanced with card at -0.5

		if (section === 'scan') {
			// SCAN: Phone enters from right, settles at SCAN_POS_X
			// Smooth entry: Finish by 0.2 progress
			if (progress < 0.2) {
				// Enter animation
				const p = easeOutCubic(progress / 0.2);
				targetX = lerp(START_X, SCAN_POS_X, p);
				opacity = p;
			} else {
				// Hold position
				targetX = SCAN_POS_X;
				opacity = 1;
			}
			// Bring forward to avoid Z-fighting
			targetZ = 0.6;
			targetRotY = PHONE_SCAN_ROT;
			scrollY = 0.5;
		} else if (section === 'tap') {
			// TAP: Phone moves to center for tap
			// Start from SCAN_POS, move to 0.0
			const TAP_TARGET_X = 0.0;

			if (progress < 0.4) {
				// Move toward card/center
				const p = progress / 0.4;
				targetX = lerp(SCAN_POS_X, TAP_TARGET_X, p);
				targetZ = lerp(0.6, 0.4, p); // Move slightly closer to card
				targetRotY = PHONE_SCAN_ROT;
				opacity = 1;
			} else if (progress < 0.7) {
				// Tap bump
				const tapP = (progress - 0.4) / 0.3;
				targetX = TAP_TARGET_X;
				// Bump closer to card (Card is at Z=0.05 approx in tap)
				targetZ = lerp(0.4, 0.25, Math.sin(tapP * Math.PI));
				targetRotY = PHONE_SCAN_ROT;
				opacity = 1;
			} else {
				// Exit
				const p = (progress - 0.7) / 0.3;
				targetX = lerp(TAP_TARGET_X, 3.5, easeInQuad(p));
				targetRotY = lerp(PHONE_SCAN_ROT, 0, p);
				opacity = 1 - p;
			}
			scrollY = 0.0;
		}

		// Apply texture scroll
		if (screenTexture) {
			screenTexture.offset.y = scrollY;
		}

		// Update Transform
		// Lower lerp speed (delta * 3) for smoother inertia
		position.x = lerp(position.x, targetX, delta * 3);
		position.y = Math.sin(Date.now() * 0.001) * 0.05; // Gentle float
		position.z = lerp(position.z, targetZ, delta * 3);
		// Apply rotation - use target directly (already set per section)
		rotation.y = lerp(rotation.y, targetRotY, delta * 3);
	});

	// Easing functions
	function easeOutCubic(x: number): number {
		return 1 - Math.pow(1 - x, 3);
	}
	function easeInQuad(x: number): number {
		return x * x;
	}
	function easeInOutQuad(x: number): number {
		return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
	}
</script>

{#if visible}
	<T.Group
		position={[position.x, position.y, position.z]}
		rotation={[rotation.x, rotation.y, rotation.z]}
	>
		<!-- Phone Body -->
		<T.Mesh>
			<T.BoxGeometry args={[PHONE_WIDTH, PHONE_HEIGHT, PHONE_DEPTH]} />
			<T.MeshStandardMaterial color="#1f2937" roughness={0.2} metalness={0.8} />
		</T.Mesh>

		<!-- Screen -->
		{#if screenTexture}
			<T.Mesh position.z={PHONE_DEPTH / 2 + 0.001}>
				<T.PlaneGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
				<T.MeshBasicMaterial map={screenTexture} />
			</T.Mesh>
		{/if}

		<!-- Bezel / Frame Glow -->
		<T.Mesh position.z={PHONE_DEPTH / 2}>
			<T.BoxGeometry args={[PHONE_WIDTH + 0.02, PHONE_HEIGHT + 0.02, 0.01]} />
			<T.MeshBasicMaterial color="#3b82f6" transparent opacity={0.1} />
		</T.Mesh>
	</T.Group>
{/if}
