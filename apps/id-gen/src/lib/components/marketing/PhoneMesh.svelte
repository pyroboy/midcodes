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

		const SCAN_Z = 0.6;
		const APPROACH_X = 0.5;
		const APPROACH_Z = 0.5;
		const APPROACH_ROT_Y = PHONE_SCAN_ROT - 0.2;
		const CONTACT_X = 0.42;
		const CONTACT_Z = 0.3;
		const BUMP_ROT_X = -0.3;
		const BUMP_ROT_Y = PHONE_SCAN_ROT - 0.6;
		const BUMP_ROT_Z = 0.2;
		const LINGER_X = 0.45;
		const LINGER_Z = 0.4;
		const LINGER_ROT_Y = PHONE_SCAN_ROT - 0.35;
		const SUCCESS_X = 0.45;
		const SUCCESS_Z = 0.7;
		const SUCCESS_ROT_Y = 0.2;

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
		} else if (section === 'tap-approach') {
			// 0-100%: Approach
			const p = easeInOutQuad(progress);
			targetX = lerp(SCAN_POS_X, APPROACH_X, p);
			targetZ = lerp(SCAN_Z, APPROACH_Z, p);
			targetRotY = lerp(PHONE_SCAN_ROT, APPROACH_ROT_Y, p);
			scrollY = 0.66;
			opacity = 1;

		} else if (section === 'tap-bump') {
			// 0-100%: Bump Contact
			const bumpP = Math.sin(progress * Math.PI); // 0→1→0 curve

			// Position: quick move to contact, then back
			targetX = lerp(APPROACH_X, CONTACT_X, bumpP);
			targetZ = lerp(APPROACH_Z, CONTACT_Z, bumpP);

			// Dutch angle peaks at contact
			targetRotX = BUMP_ROT_X * bumpP;
			targetRotY = lerp(APPROACH_ROT_Y, BUMP_ROT_Y, bumpP);
			targetRotZ = BUMP_ROT_Z * bumpP;

			scrollY = 0.66;
			opacity = 1;

		} else if (section === 'tap-linger') {
			// 0-100%: Linger & Read
			const easeP = easeOutCubic(Math.min(1, progress * 1.5));
			
			// Gentle breathing
			const breathe = Math.sin(progress * Math.PI * 3) * 0.015;

			targetX = lerp(APPROACH_X, LINGER_X, easeP) + breathe;
			targetZ = lerp(CONTACT_Z, LINGER_Z, easeP);

			// Ease out of dutch angle
			const dutchFade = 1 - easeP;
			targetRotX = BUMP_ROT_X * dutchFade * 0.2;
			targetRotY = lerp(BUMP_ROT_Y, LINGER_ROT_Y, easeP);
			targetRotZ = BUMP_ROT_Z * dutchFade * 0.2;

			// Screen: NFC → Verified transition near middle (0.3-0.6 range)
			if (progress < 0.3) {
				scrollY = 0.66;
			} else if (progress < 0.6) {
				const screenP = (progress - 0.3) / 0.3;
				scrollY = lerp(0.66, 0.33, easeInOutQuad(screenP));
			} else {
				scrollY = 0.33; // Verified!
			}
			opacity = 1;

		} else if (section === 'tap-success') {
			// 0-100%: Pull back -> Success -> Exit
			// Split: 0-40% Pull back, 40-80% Hold, 80-100% Exit

			if (progress < 0.4) {
				// Pull back
				const p = easeInOutQuad(progress / 0.4);
				targetX = lerp(LINGER_X, SUCCESS_X, p);
				targetZ = lerp(LINGER_Z, SUCCESS_Z, p);
				targetRotY = lerp(LINGER_ROT_Y, SUCCESS_ROT_Y, p);
				// Screen: Verified → Profile
				scrollY = lerp(0.33, 0.0, p);
				opacity = 1;
			} else if (progress < 0.8) {
				// Hold
				targetX = SUCCESS_X;
				targetZ = SUCCESS_Z;
				targetRotY = SUCCESS_ROT_Y;
				scrollY = 0.0;
				opacity = 1;
			} else {
				// Exit
				const p = easeInQuad((progress - 0.8) / 0.2);
				targetX = lerp(SUCCESS_X, 2.5, p);
				targetZ = SUCCESS_Z;
				targetRotY = lerp(SUCCESS_ROT_Y, 0.6, p);
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
		// Apply rotation
		rotation.x = lerp(rotation.x, targetRotX, delta * 3);
		rotation.y = lerp(rotation.y, targetRotY, delta * 3);
		rotation.z = lerp(rotation.z, targetRotZ, delta * 3);
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
