<script lang="ts">
	/**
	 * CardTextOverlay.svelte
	 * Renders a transparent plane with static text (CanvasTexture).
	 * Optimized: Only redraws when typingProgress changes significantly.
	 */
	import { T } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import type { SectionName } from '$lib/marketing/scroll';

	interface Props {
		typingProgress?: number;
		sectionProgress?: number;
		currentSection?: SectionName;
	}

	let { typingProgress = 0, sectionProgress = 0, currentSection = 'hero' }: Props = $props();

	// Caret visibility: end of hero, during encode, gone after
	let showCaret = $derived(
		(currentSection === 'hero' && sectionProgress > 0.8) ||
			currentSection === 'encode'
	);

	// Texture state
	let textTexture: THREE.CanvasTexture | null = $state(null);
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// Track last rendered progress to avoid unnecessary redraws
	let lastRenderedProgress = -1;

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
		canvas = document.createElement('canvas');
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
		ctx = canvas.getContext('2d');

		textTexture = new THREE.CanvasTexture(canvas);
		textTexture.colorSpace = THREE.SRGBColorSpace;

		// Initial render with full text, no caret
		renderText(1, false);
	});

	/**
	 * Render text to canvas
	 */
	function renderText(progress: number, drawCaret: boolean) {
		if (!ctx || !textTexture) return;

		// Clear
		ctx.clearRect(0, 0, WIDTH, HEIGHT);

		// Snap to full text when close to 1 (lerp never quite reaches 1)
		const effectiveProgress = progress > 0.95 ? 1 : progress < 0.05 ? 0 : progress;

		// Draw Lines
		LINES.forEach((line, index) => {
			const charCount = Math.round(line.text.length * effectiveProgress);
			const visibleText = line.text.substring(0, charCount);

			if (visibleText.length > 0) {
				ctx!.fillStyle = line.color;
				ctx!.font = line.font;
				ctx!.textAlign = 'left';
				ctx!.textBaseline = 'middle';
				ctx!.fillText(visibleText, WIDTH * 0.1, HEIGHT * line.y);

				// Draw caret after first line (name) if visible
				if (index === 0 && drawCaret) {
					const metrics = ctx!.measureText(visibleText);
					const caretX = WIDTH * 0.1 + metrics.width + 4;
					const caretY = HEIGHT * line.y;
					ctx!.fillStyle = '#1f2937';
					ctx!.fillRect(caretX, caretY - 24, 3, 48);
				}
			}
		});

		textTexture.needsUpdate = true;
		lastRenderedProgress = progress;
	}

	// Track last caret state to detect changes
	let lastCaretState = false;

	/**
	 * Update texture when typingProgress or caret state changes
	 */
	$effect(() => {
		if (!ctx || !textTexture) return;

		// Calculate character threshold - only redraw when a new character would appear
		const maxChars = Math.max(...LINES.map((l) => l.text.length));
		const threshold = 1 / maxChars;

		// Check if we need to redraw
		const progressDiff = Math.abs(typingProgress - lastRenderedProgress);
		const caretChanged = showCaret !== lastCaretState;
		const needsRedraw =
			progressDiff >= threshold || // New character would appear
			lastRenderedProgress < 0 || // Initial render
			(typingProgress > 0.95 && lastRenderedProgress <= 0.95) || // Snap to complete
			(typingProgress < 0.05 && lastRenderedProgress >= 0.05) || // Snap to empty
			caretChanged; // Caret visibility changed

		if (needsRedraw) {
			renderText(typingProgress, showCaret);
			lastCaretState = showCaret;
		}
	});
</script>

{#if textTexture}
	<!-- Overlay in front of card surface (z=0.02 to avoid z-fighting) -->
	<T.Mesh position.z={0.02}>
		<T.PlaneGeometry args={[2 / 1.586, 2]} />
		<T.MeshBasicMaterial
			map={textTexture}
			transparent
			opacity={1}
			depthTest={true}
			depthWrite={false}
		/>
	</T.Mesh>
{/if}
