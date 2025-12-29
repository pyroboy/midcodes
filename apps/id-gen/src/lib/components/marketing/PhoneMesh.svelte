<script lang="ts">
	/**
	 * PhoneMesh.svelte - 3D Phone model with animated screen and NFC banner overlay
	 */
	import { T, useTask, useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { lerp } from '$lib/marketing/animation';
	import {
		drawScreenContent,
		drawNFCBannerTexture,
		PHONE_TEX_W,
		PHONE_TEX_H,
		NFC_BANNER_W,
		NFC_BANNER_H
	} from './utils/drawPhoneScreen';

	interface Props {
		visible?: boolean;
		progress?: number;
		section?: string;
	}

	let { visible = false, progress = 0, section = 'scan' }: Props = $props();

	// Starting position
	const START_X = 1.2;
	const START_ROT_Y = 0;

	// Phone state
	let position = $state({ x: START_X, y: 0, z: 0 });
	let rotation = $state({ x: 0, y: START_ROT_Y, z: 0 });
	let opacity = $state(0);

	// NFC Banner state
	let bannerY = $state(0.8); // Off-screen above (normalized screen position)
	let showBanner = $state(false);

	let groupRef: THREE.Group | undefined = $state();
	let wasVisible = $state(false);

	$effect(() => {
		if (visible && !wasVisible) {
			position.x = START_X;
			position.y = 0;
			position.z = 0;
			rotation.x = 0;
			rotation.y = START_ROT_Y;
			rotation.z = 0;
			opacity = 0;
			bannerY = 0.8;
			showBanner = false;
		} else if (!visible && wasVisible) {
			position.x = START_X;
			position.y = 0;
			position.z = 0;
			rotation.x = 0;
			rotation.y = START_ROT_Y;
			rotation.z = 0;
			opacity = 0;
			bannerY = 0.8;
			showBanner = false;
		}
		wasVisible = visible;
	});

	// Main Screen Texture
	let canvas: HTMLCanvasElement;
	let screenTexture: THREE.CanvasTexture | null = $state(null);
	let ctx: CanvasRenderingContext2D | null = null;

	// NFC Banner Texture
	let bannerCanvas: HTMLCanvasElement;
	let bannerTexture: THREE.CanvasTexture | null = $state(null);
	let bannerCtx: CanvasRenderingContext2D | null = null;

	// Dimensions
	const PHONE_WIDTH = 1.1;
	const PHONE_HEIGHT = 2.2;
	const PHONE_DEPTH = 0.15;
	const SCREEN_WIDTH = 1.0;
	const SCREEN_HEIGHT = 2.0;

	// NFC Banner dimensions in 3D space (proportional to screen)
	const BANNER_3D_WIDTH = SCREEN_WIDTH * 0.85;
	const BANNER_3D_HEIGHT = BANNER_3D_WIDTH * (NFC_BANNER_H / NFC_BANNER_W);

	// Clipping plane to mask banner within screen area (dynamically updated)
	const bannerClipPlane = new THREE.Plane();
	const bannerClipPlanes = [bannerClipPlane];

	// Temp vectors for clipping plane calculation
	const tempNormal = new THREE.Vector3();
	const tempPoint = new THREE.Vector3();

	// Enable clipping on renderer
	const { renderer } = useThrelte();
	$effect(() => {
		if (renderer) {
			renderer.localClippingEnabled = true;
		}
	});

	/**
	 * Update clipping plane to match phone's orientation
	 */
	function updateClipPlane() {
		if (!groupRef) return;

		// Get the world position of the top edge of the screen
		// Screen top in local coords: (0, SCREEN_HEIGHT/2, PHONE_DEPTH/2)
		tempPoint.set(0, SCREEN_HEIGHT / 2, PHONE_DEPTH / 2);
		groupRef.localToWorld(tempPoint);

		// Get the world normal pointing DOWN (into the screen area)
		// Local down is -Y, but we need to transform it to world space
		tempNormal.set(0, -1, 0);
		tempNormal.transformDirection(groupRef.matrixWorld);

		// Set the clipping plane
		bannerClipPlane.setFromNormalAndCoplanarPoint(tempNormal, tempPoint);
	}

	onMount(() => {
		// === Main Screen Texture ===
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
		// 6 screens: show 1/6 of texture at a time
		screenTexture.repeat.set(1, 1 / 6);
		screenTexture.offset.set(0, 5 / 6); // Start at QR Scanner

		// === NFC Banner Texture ===
		bannerCanvas = document.createElement('canvas');
		bannerCanvas.width = NFC_BANNER_W;
		bannerCanvas.height = NFC_BANNER_H;
		bannerCtx = bannerCanvas.getContext('2d');

		if (bannerCtx) {
			drawNFCBannerTexture(bannerCtx);
		}

		bannerTexture = new THREE.CanvasTexture(bannerCanvas);

		return () => {
			screenTexture?.dispose();
			bannerTexture?.dispose();
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

		// Screen offset constants (6 screens, UV origin bottom-left)
		const SCREEN_QR_SCANNER = 5 / 6;
		const SCREEN_QR_SUCCESS = 4 / 6;
		const SCREEN_HOME = 3 / 6;
		const SCREEN_VERIFYING = 2 / 6;
		const SCREEN_VERIFIED = 1 / 6;
		const SCREEN_PROFILE = 0 / 6;

		if (section === 'scan') {
			// SCAN: QR scanner flow (SNAP transitions)
			if (progress < 0.2) {
				const p = easeOutCubic(progress / 0.2);
				targetX = lerp(START_X, SCAN_POS_X, p);
				opacity = p;
				scrollY = SCREEN_QR_SCANNER;
			} else if (progress < 0.6) {
				targetX = SCAN_POS_X;
				opacity = 1;
				scrollY = SCREEN_QR_SCANNER;
			} else if (progress < 0.8) {
				targetX = SCAN_POS_X;
				opacity = 1;
				scrollY = SCREEN_QR_SUCCESS; // SNAP
			} else {
				targetX = SCAN_POS_X;
				opacity = 1;
				scrollY = SCREEN_PROFILE; // SNAP
			}
			targetZ = 0.6;
			targetRotY = PHONE_SCAN_ROT;
			targetRotX = 0;
			targetRotZ = 0;
			showBanner = false;

		} else if (section === 'tap-approach') {
			const p = easeInOutQuad(progress);
			targetX = lerp(SCAN_POS_X, APPROACH_X, p);
			targetZ = lerp(SCAN_Z, APPROACH_Z, p);
			targetRotY = lerp(PHONE_SCAN_ROT, APPROACH_ROT_Y, p);
			scrollY = SCREEN_HOME; // SNAP
			opacity = 1;
			showBanner = false;

		} else if (section === 'tap-bump') {
			const bumpP = Math.sin(progress * Math.PI);

			targetX = lerp(APPROACH_X, CONTACT_X, bumpP);
			targetZ = lerp(APPROACH_Z, CONTACT_Z, bumpP);
			targetRotX = BUMP_ROT_X * bumpP;
			targetRotY = lerp(APPROACH_ROT_Y, BUMP_ROT_Y, bumpP);
			targetRotZ = BUMP_ROT_Z * bumpP;

			scrollY = SCREEN_HOME; // Keep home screen as base
			opacity = 1;

			// NFC Banner animation (starts at 50%)
			if (progress < 0.5) {
				showBanner = false;
				bannerY = 0.8;
			} else if (progress < 0.7) {
				showBanner = true;
				const p = (progress - 0.5) / 0.2;
				bannerY = lerp(0.8, 0, easeOutCubic(p)); // Slide down
			} else {
				showBanner = true;
				bannerY = 0; // Visible
			}
			opacity = 1;

	} else if (section === 'tap-linger') {
			// Verifying -> Verified (SNAP)
			const easeP = easeOutCubic(Math.min(1, progress * 1.5));
			const breathe = Math.sin(progress * Math.PI * 3) * 0.015;

			targetX = lerp(APPROACH_X, LINGER_X, easeP) + breathe;
			targetZ = lerp(CONTACT_Z, LINGER_Z, easeP);

			const dutchFade = 1 - easeP;
			targetRotX = BUMP_ROT_X * dutchFade * 0.2;
			targetRotY = lerp(BUMP_ROT_Y, LINGER_ROT_Y, easeP);
			targetRotZ = BUMP_ROT_Z * dutchFade * 0.2;

			// Screen SNAP
			if (progress < 0.4) {
				scrollY = SCREEN_VERIFYING;
			} else {
				scrollY = SCREEN_VERIFIED; // SNAP
			}
			opacity = 1;
			showBanner = false;

		} else if (section === 'tap-success') {
			// Verified -> Profile -> Exit (SNAP)
			if (progress < 0.4) {
				const p = easeInOutQuad(progress / 0.4);
				targetX = lerp(LINGER_X, SUCCESS_X, p);
				targetZ = lerp(LINGER_Z, SUCCESS_Z, p);
				targetRotY = lerp(LINGER_ROT_Y, SUCCESS_ROT_Y, p);
				scrollY = SCREEN_VERIFIED;
				opacity = 1;
			} else if (progress < 0.8) {
				targetX = SUCCESS_X;
				targetZ = SUCCESS_Z;
				targetRotY = SUCCESS_ROT_Y;
				scrollY = SCREEN_PROFILE; // SNAP
				opacity = 1;
			} else {
				// Exit
				const p = easeInQuad((progress - 0.8) / 0.2);
				targetX = lerp(SUCCESS_X, 2.5, p);
				targetZ = SUCCESS_Z;
				targetRotY = lerp(SUCCESS_ROT_Y, 0.6, p);
				scrollY = SCREEN_PROFILE;
				opacity = 1 - p;
			}
			showBanner = false;
		}

		// Apply texture scroll
		if (screenTexture) {
			screenTexture.offset.y = scrollY;
		}

		// Update Transform
		if (section === 'tap-bump') {
			// Smooth entry for first 25%, then instant for the rest
			if (progress < 0.25) {
				// Lerp for smooth transition from tap-approach
				const lerpSpeed = delta * 8; // Faster lerp for quick catch-up
				position.x = lerp(position.x, targetX, lerpSpeed);
				position.y = Math.sin(Date.now() * 0.001) * 0.05;
				position.z = lerp(position.z, targetZ, lerpSpeed);
				rotation.x = lerp(rotation.x, targetRotX, lerpSpeed);
				rotation.y = lerp(rotation.y, targetRotY, lerpSpeed);
				rotation.z = lerp(rotation.z, targetRotZ, lerpSpeed);
			} else {
				// Instant position during bump (no lerp)
				position.x = targetX;
				position.y = Math.sin(Date.now() * 0.001) * 0.05;
				position.z = targetZ;
				rotation.x = targetRotX;
				rotation.y = targetRotY;
				rotation.z = targetRotZ;
			}
		} else {
			// Lerp for smooth transitions
			position.x = lerp(position.x, targetX, delta * 3);
			position.y = Math.sin(Date.now() * 0.001) * 0.05;
			position.z = lerp(position.z, targetZ, delta * 3);
			rotation.x = lerp(rotation.x, targetRotX, delta * 3);
			rotation.y = lerp(rotation.y, targetRotY, delta * 3);
			rotation.z = lerp(rotation.z, targetRotZ, delta * 3);
		}

		// Apply transforms directly to Three.js group
		groupRef.position.set(position.x, position.y, position.z);
		groupRef.rotation.set(rotation.x, rotation.y, rotation.z);

		// Update clipping plane to match phone orientation
		updateClipPlane();
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

		<!-- NFC Banner Overlay -->
		{#if showBanner && bannerTexture}
			<T.Mesh
				position.x={0}
				position.y={SCREEN_HEIGHT / 2 - BANNER_3D_HEIGHT / 2 - 0.1 + bannerY}
				position.z={PHONE_DEPTH / 2 + 0.01}
			>
				<T.PlaneGeometry args={[BANNER_3D_WIDTH, BANNER_3D_HEIGHT]} />
				<T.MeshBasicMaterial
					map={bannerTexture}
					transparent
					clippingPlanes={bannerClipPlanes}
				/>
			</T.Mesh>
		{/if}

		<!-- Bezel / Frame Glow -->
		<T.Mesh position.z={PHONE_DEPTH / 2}>
			<T.BoxGeometry args={[PHONE_WIDTH + 0.02, PHONE_HEIGHT + 0.02, 0.01]} />
			<T.MeshBasicMaterial color="#3b82f6" transparent opacity={0.1} />
		</T.Mesh>
	</T.Group>
{/if}
