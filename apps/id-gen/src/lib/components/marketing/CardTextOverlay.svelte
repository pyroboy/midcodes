<script lang="ts">
	/**
	 * CardTextOverlay.svelte
	 * Renders a transparent plane with dynamic text (CanvasTexture) to simulate typing.
	 */
	import { T } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount, tick } from 'svelte';

	interface Props {
		typingProgress?: number;
		sectionProgress?: number;
	}

	let { typingProgress = 0, sectionProgress = 0 }: Props = $props();

	// Texture state
	let textTexture: THREE.CanvasTexture | null = $state(null);
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// Config
	const WIDTH = 640;
	const HEIGHT = 1024;

	// Text Data
	const LINES = [
		{ text: 'Alex Morgan', y: 0.4, font: 'bold 48px Inter, sans-serif', color: '#1f2937' },
		{ text: 'Student', y: 0.5, font: 'normal 28px Inter, sans-serif', color: '#6b7280' },
		{ text: 'ID: 2024-8821', y: 0.6, font: 'normal 24px Inter, sans-serif', color: '#6b7280' }
	];

	onMount(() => {
		console.log('[CardTextOverlay] Mounted');
		canvas = document.createElement('canvas');
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
		ctx = canvas.getContext('2d');

		textTexture = new THREE.CanvasTexture(canvas);
		textTexture.colorSpace = THREE.SRGBColorSpace;
		console.log('[CardTextOverlay] Texture created', textTexture);
	});

	/**
	 * Update texture when typingProgress changes
	 */
	$effect(() => {
		if (!ctx || !textTexture) {
			// console.warn('[CardTextOverlay] Skipping update - no ctx or texture');
			return;
		}

		// Clear
		ctx.clearRect(0, 0, WIDTH, HEIGHT);

		let debugTexts: string[] = [];

		// Draw Lines
		LINES.forEach((line) => {
			// Calculate how many chars are visible
			// We want concurrent typing.
			// Map progress 0-1 to 0-Length.
			// Add randomness/jitter? No, plain stepping.
			const charCount = Math.floor(line.text.length * typingProgress);
			let visibleText = line.text.substring(0, charCount);

			// Add "decoding" effect: Append random chars at the tip if not fully typed
			if (typingProgress < 1 && visibleText.length < line.text.length) {
				// Add 1-2 random characters
				const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
				const r1 = randomChars.charAt(Math.floor(Math.random() * randomChars.length));
				// const r2 = randomChars.charAt(Math.floor(Math.random() * randomChars.length));
				visibleText += r1;
			}

			if (visibleText.length > 0) {
				debugTexts.push(visibleText);
				// Draw Text
				ctx!.fillStyle = line.color;
				ctx!.font = line.font;
				ctx!.textAlign = 'left';
				ctx!.textBaseline = 'middle';
				// 3D Y=0 is Center. Canvas Y is Top->Bottom.
				// MarketingTextureManager logic matched roughly.
				// x=0.1 * WIDTH
				ctx!.fillText(visibleText, WIDTH * 0.1, HEIGHT * line.y);

				// Draw Cursor for this line if active (and not fully typed)
				if (
					typingProgress > 0 &&
					typingProgress < 1 &&
					visibleText.length < line.text.length &&
					visibleText.length > 0
				) {
					// Measure text width to place cursor
					const metrics = ctx!.measureText(visibleText);
					const cursorX = WIDTH * 0.1 + metrics.width + 5;

					// Blink effect (global sync)
					if (Math.sin(sectionProgress * 30) > 0) {
						ctx!.fillRect(cursorX, HEIGHT * line.y - 20, 3, 40);
					}
				}
			}
		});

		if (debugTexts.length > 0) {
			console.log(`[CardTextOverlay] Rendering: "${debugTexts.join('", "')}"`);
		}
		textTexture.needsUpdate = true;
	});
</script>

{#if textTexture}
	<!-- Overlay slightly above card surface -->
	<T.Mesh position.z={0.005}>
		<T.PlaneGeometry args={[2 / 1.586, 2]} />
		<T.MeshBasicMaterial map={textTexture} transparent opacity={1} side={THREE.DoubleSide} />
	</T.Mesh>
{/if}
