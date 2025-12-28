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

	interface Props {
		visible?: boolean;
		progress?: number; // Section progress 0-1
		section?: string;
	}

	let { visible = false, progress = 0, section = 'scan' }: Props = $props();

	// State
	let position = $state(new THREE.Vector3(3, 0, 0)); // Start off-screen right
	let rotation = $state(new THREE.Euler(0, 0, 0));
	let opacity = $state(0);

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

	// Texture Dimensions (High res)
	const TEX_W = 512;
	const TEX_H = 1024 * 2; // 2x height for scrolling content

	onMount(() => {
		// Create canvas for screen content
		canvas = document.createElement('canvas');
		canvas.width = TEX_W;
		canvas.height = TEX_H;
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

	function drawScreenContent(ctx: CanvasRenderingContext2D) {
		// Fill background
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, TEX_W, TEX_H);

		// --- TOP HALF: Verified Screen ---
		// Green Header / Status
		ctx.fillStyle = '#10b981'; // Green-500
		ctx.fillRect(0, 0, TEX_W, TEX_H * 0.5);

		// Checkmark Circle
		ctx.beginPath();
		ctx.arc(TEX_W / 2, TEX_H * 0.2, 80, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255,255,255,0.2)';
		ctx.fill();
		ctx.beginPath();
		ctx.arc(TEX_W / 2, TEX_H * 0.2, 60, 0, Math.PI * 2);
		ctx.fillStyle = '#ffffff';
		ctx.fill();

		// Checkmark Icon (Simple paths)
		ctx.strokeStyle = '#10b981';
		ctx.lineWidth = 10;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(TEX_W / 2 - 20, TEX_H * 0.2);
		ctx.lineTo(TEX_W / 2 - 5, TEX_H * 0.2 + 15);
		ctx.lineTo(TEX_W / 2 + 25, TEX_H * 0.2 - 15);
		ctx.stroke();

		// Text "Verified"
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 60px Inter, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('Verified', TEX_W / 2, TEX_H * 0.32);

		ctx.font = 'normal 30px Inter, sans-serif';
		ctx.fillStyle = 'rgba(255,255,255,0.9)';
		ctx.fillText('Identity Confirmed', TEX_W / 2, TEX_H * 0.36);

		// --- BOTTOM HALF: Profile Page ---
		const profileOffset = TEX_H * 0.5;
		ctx.fillStyle = '#f9fafb'; // Gray-50
		ctx.fillRect(0, profileOffset, TEX_W, TEX_H * 0.5);

		// Header Background
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, profileOffset, TEX_W, 200);

		// Avatar
		ctx.beginPath();
		ctx.arc(TEX_W / 2, profileOffset + 150, 100, 0, Math.PI * 2);
		ctx.fillStyle = '#cbd5e1'; // Gray-300
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 10;
		ctx.stroke();

		// Name
		ctx.fillStyle = '#1e293b'; // Slate-800
		ctx.font = 'bold 50px Inter, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('Alex Morgan', TEX_W / 2, profileOffset + 320);

		ctx.fillStyle = '#64748b'; // Slate-500
		ctx.font = 'normal 30px Inter, sans-serif';
		ctx.fillText('Student • ID #2024-8821', TEX_W / 2, profileOffset + 360);

		// Data Rows
		const rowStart = profileOffset + 450;
		const rowH = 80;
		for (let i = 0; i < 4; i++) {
			const y = rowStart + i * rowH;
			// Label
			ctx.fillStyle = '#94a3b8';
			ctx.font = '30px Inter, sans-serif';
			ctx.textAlign = 'left';
			ctx.fillText('Field ' + (i + 1), 60, y);
			// Value
			ctx.fillStyle = '#334155';
			ctx.textAlign = 'right';
			ctx.fillText('Verified Data', TEX_W - 60, y);
			// Separator
			ctx.fillStyle = '#e2e8f0';
			ctx.fillRect(40, y + 20, TEX_W - 80, 2);
		}
	}

	useTask((delta) => {
		if (!visible) return;

		let targetX = 3; // Default off-screen
		let targetZ = 0;
		let targetRotY = 0;
		let scrollY = 0.5; // Start at top (Verified)

		if (section === 'scan') {
			// SCAN BEHAVIOR
			// 0.0 - 0.2: Enter
			// 0.2 - 1.0: Hold (Waiting for scan completion)

			if (progress < 0.2) {
				const p = progress / 0.2;
				targetX = lerp(3, 0.8, easeOutCubic(p));
				opacity = p;
			} else {
				targetX = 0.8;
				opacity = 1;
			}
			scrollY = 0.5; // Stay on Verified/Scan screen
		} else if (section === 'tap') {
			// TAP BEHAVIOR
			// 0.0: Already at 0.8 (from scan) ? Or re-enter?
			// Let's assume re-enter or continuous.
			// Ideally we want continuity.
			// 0.0 - 0.3: Move slightly closer
			// 0.3 - 0.6: Tap Motion (Tilt/Bump)
			// 0.6 - 1.0: Exit

			// Assume starting at 0.8 if continuous, but if section changed, progress jumps 0->1?
			// Sections are adjacent. progress goes 1.0 (scan) -> 0.0 (tap).

			if (progress < 0.3) {
				// Move closer
				targetX = lerp(0.8, 0.6, progress / 0.3);
				opacity = 1;
			} else if (progress < 0.6) {
				// Tap
				targetX = 0.6;
				opacity = 1;
				// Tap rotation/bump
				const tapP = (progress - 0.3) / 0.3;
				targetZ = Math.sin(tapP * Math.PI) * 0.2; // Bump forward
				targetRotY = -0.2 + Math.sin(tapP * Math.PI) * 0.2;
			} else {
				// Exit
				const p = (progress - 0.6) / 0.4;
				targetX = lerp(0.6, 3.5, easeInQuad(p));
				opacity = 1 - p;
			}
			scrollY = 0.0; // Show Profile?
		}

		// Apply texture scroll
		if (screenTexture) {
			screenTexture.offset.y = scrollY;
		}

		// Update Transform
		// Add some subtle float
		position.x = lerp(position.x, targetX, delta * 5);
		position.y = Math.sin(Date.now() * 0.001) * 0.05; // Gentle float
		// Tilt slightly towards card (left)
		rotation.y = lerp(rotation.y, targetRotY !== 0 ? targetRotY : -0.2, delta * 2);
		position.z = lerp(position.z, targetZ, delta * 5);
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
