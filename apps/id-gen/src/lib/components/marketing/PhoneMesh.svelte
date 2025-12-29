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

	// State - use plain objects for Svelte reactivity
	let position = $state({ x: START_X, y: 0, z: 0 });
	let rotation = $state({ x: 0, y: START_ROT_Y, z: 0 });
	let opacity = $state(0);

	// Group reference for direct Three.js manipulation (like HeroCard3D)
	let groupRef: THREE.Group | undefined = $state();

	// Track previous visibility to detect when phone becomes visible
	let wasVisible = $state(false);

	// Reset position when visibility changes
	$effect(() => {
		if (visible && !wasVisible) {
			// Phone just became visible - reset to start position for clean entry
			position.x = START_X;
			position.y = 0;
			position.z = 0;
			rotation.x = 0;
			rotation.y = START_ROT_Y;
			rotation.z = 0;
			opacity = 0;
		} else if (!visible && wasVisible) {
			// Phone just became invisible - reset for next entrance
			position.x = START_X;
			position.y = 0;
			position.z = 0;
			rotation.x = 0;
			rotation.y = START_ROT_Y;
			rotation.z = 0;
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
		// 3 sections: show 1/3 of texture at a time
		// UV origin is bottom-left, so:
		// offset=0.66 → NFC notification (top section)
		// offset=0.33 → Verified (middle section)
		// offset=0.0  → Profile (bottom section)
		screenTexture.repeat.set(1, 1 / 3);
		screenTexture.offset.set(0, 0.66); // Start at NFC notification

		return () => {
			screenTexture?.dispose();
		};
	});

	useTask((delta) => {
		if (!visible || !groupRef) return;

		// Coordinate system:
		// X: left(-) to right(+), Y: down(-) to up(+), Z: into screen(-) to camera(+)
		// Card is on LEFT at x = -0.5, rotated -45° (front faces right)
		// Phone is on RIGHT at x = +0.5, rotated -90° (back faces left toward card)

		let targetX = START_X; // Default off-screen right
		let targetZ = 0;
		let targetRotY = 0;
		let targetRotX = 0;
		let targetRotZ = 0;
		let scrollY = 0.5; // Start at top (Verified)

		// Phone rotated 90 degrees during scan
		const PHONE_SCAN_ROT = -Math.PI / 2+2;
		const SCAN_POS_X = 0.9; // Centered (card is at -0.5)

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
			targetRotX = 0;
			targetRotZ = 0;
			scrollY = 0.66; // NFC notification screen
		} else if (section === 'tap') {
			// TAP: Phone taps card, shows NFC notification, then verified, then profile
			// Screen states:
			// - 0.66 = NFC notification (dark lock screen)
			// - 0.33 = Verified (green success)
			// - 0.0  = Profile (user details)

			const SCAN_Z = 0.6;
			const TAP_ROT_Y = PHONE_SCAN_ROT - 0.3;
			const TAP_X = 0.3;
			const TAP_Z = 0.5;
			const BUMP_X = -0.05;

			// Success pose - phone faces viewer to show result
			const SUCCESS_X = 0.2;
			const SUCCESS_Z = 0.8;
			const SUCCESS_ROT_Y = 0.1;

			if (progress < 0.1) {
				// Phase 1: Approach - show NFC notification
				const p = easeInOutQuad(progress / 0.1);
				targetX = lerp(SCAN_POS_X, TAP_X, p);
				targetZ = lerp(SCAN_Z, TAP_Z, p);
				targetRotY = lerp(PHONE_SCAN_ROT, TAP_ROT_Y, p);
				scrollY = 0.66; // NFC notification
				opacity = 1;
			} else if (progress < 0.25) {
				// Phase 2: Tap bump - NFC detected
				const p = (progress - 0.1) / 0.15;
				const bumpP = Math.sin(p * Math.PI);
				targetX = lerp(TAP_X, BUMP_X, bumpP);
				targetZ = TAP_Z;
				targetRotY = TAP_ROT_Y;
				scrollY = 0.66; // Still NFC notification
				opacity = 1;
			} else if (progress < 0.35) {
				// Phase 3: Hold after tap - "Reading..." delay
				targetX = TAP_X;
				targetZ = TAP_Z;
				targetRotY = TAP_ROT_Y;
				// Transition from NFC to Verified
				const p = (progress - 0.25) / 0.1;
				scrollY = lerp(0.66, 0.33, easeInOutQuad(p));
				opacity = 1;
			} else if (progress < 0.5) {
				// Phase 4: Show Verified screen
				targetX = TAP_X;
				targetZ = TAP_Z;
				targetRotY = TAP_ROT_Y;
				scrollY = 0.33; // Verified!
				opacity = 1;
			} else if (progress < 0.65) {
				// Phase 5: Pull back and rotate to show success
				const p = easeInOutQuad((progress - 0.5) / 0.15);
				targetX = lerp(TAP_X, SUCCESS_X, p);
				targetZ = lerp(TAP_Z, SUCCESS_Z, p);
				targetRotY = lerp(TAP_ROT_Y, SUCCESS_ROT_Y, p);
				// Transition to Profile
				scrollY = lerp(0.33, 0.0, p);
				opacity = 1;
			} else if (progress < 0.85) {
				// Phase 6: Hold success pose showing Profile
				targetX = SUCCESS_X;
				targetZ = SUCCESS_Z;
				targetRotY = SUCCESS_ROT_Y;
				scrollY = 0.0; // Profile
				opacity = 1;
			} else {
				// Phase 7: Exit to right
				const p = easeInQuad((progress - 0.85) / 0.15);
				targetX = lerp(SUCCESS_X, 2.0, p);
				targetZ = SUCCESS_Z;
				targetRotY = lerp(SUCCESS_ROT_Y, 0.5, p);
				scrollY = 0.0;
				opacity = 1 - p;
			}
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
		rotation.x = lerp(rotation.x, targetRotX, delta * 3);
		// Apply transforms directly to Three.js group (bypasses Svelte reactivity)
		groupRef.position.set(position.x, position.y, position.z);
		groupRef.rotation.set(rotation.x, rotation.y, rotation.z);
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
	<T.Group bind:ref={groupRef}>
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
