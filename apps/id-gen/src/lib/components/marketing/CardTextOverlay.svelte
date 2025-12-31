<script lang="ts">
	/**
	 * CardTextOverlay.svelte
	 * Renders a transparent plane with dynamic text (CanvasTexture).
	 * Subscribes to cardDataStore for live updates from encode section.
	 */
	import { T } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import type { SectionName } from '$lib/marketing/scroll';
	import { cardDataStore, COMPANY_NAME, isUserEditingStore, type CardData } from '$lib/stores/encodeInput';

	interface Props {
		typingProgress?: number;
		sectionProgress?: number;
		currentSection?: SectionName;
	}

	let { typingProgress = 0, sectionProgress = 0, currentSection = 'hero' }: Props = $props();

	// Card data from store (reactive)
	let cardData = $state<CardData>({ name: 'Arjo Magno', title: 'CEO' });

	// Flag to bypass animation when user is actively editing
	let isUserEditing = $state(false);

	// Caret visibility: hero > 50%, during encode, gone after
	let showCaret = $derived(
		(currentSection === 'hero' && sectionProgress > 0.5) || currentSection === 'encode'
	);

	// Texture state
	let textTexture: THREE.CanvasTexture | null = $state(null);
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// Track last rendered state to avoid unnecessary redraws
	let lastRenderedProgress = -1;
	let lastRenderedName = '';
	let lastRenderedTitle = '';

	// Blink state
	let blinkVisible = $state(true);

	// Config
	const WIDTH = 640;
	const HEIGHT = 1024;

	// Dynamic text lines (computed from cardData)
	let LINES = $derived([
		{ text: cardData.name || 'Your Name', y: 0.4, font: 'bold 48px Inter, sans-serif', color: '#1f2937' },
		{ text: cardData.title || 'Title', y: 0.5, font: 'normal 28px Inter, sans-serif', color: '#6b7280' },
		{ text: COMPANY_NAME, y: 0.6, font: 'normal 24px Inter, sans-serif', color: '#6b7280' }
	]);

	onMount(() => {
		// Subscribe to card data store
		const unsubscribeData = cardDataStore.subscribe((data) => {
			cardData = data;
		});

		// Subscribe to editing flag store
		const unsubscribeEditing = isUserEditingStore.subscribe((editing) => {
			isUserEditing = editing;
		});

		// Create canvas
		canvas = document.createElement('canvas');
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
		ctx = canvas.getContext('2d');

		textTexture = new THREE.CanvasTexture(canvas);
		textTexture.colorSpace = THREE.SRGBColorSpace;

		// Initial render with full text, no caret
		renderText(1, false);

		// Blink timer (530ms standard caret blink rate)
		const interval = setInterval(() => {
			blinkVisible = !blinkVisible;
		}, 530);

		return () => {
			clearInterval(interval);
			unsubscribeData();
			unsubscribeEditing();
		};
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

			// Draw text if visible
			if (visibleText.length > 0) {
				ctx!.fillStyle = line.color;
				ctx!.font = line.font;
				ctx!.textAlign = 'left';
				ctx!.textBaseline = 'middle';
				ctx!.fillText(visibleText, WIDTH * 0.1, HEIGHT * line.y);
			}

			// Draw caret for first line if requested and visible (blink)
			if (index === 0 && drawCaret) {
				// Must set font to get correct measurement even for empty string (width 0)
				ctx!.font = line.font;
				const metrics = ctx!.measureText(visibleText);
				const caretX = WIDTH * 0.1 + metrics.width + 4;
				const caretY = HEIGHT * line.y;

				ctx!.fillStyle = '#1f2937';
				ctx!.fillRect(caretX, caretY - 24, 3, 48);
			}
		});

		textTexture.needsUpdate = true;
		lastRenderedProgress = progress;
		lastRenderedName = cardData.name;
		lastRenderedTitle = cardData.title;
	}

	// Track last caret state to detect changes
	let lastCaretDrawn = false;

	/**
	 * Update texture when typingProgress, caret state, or cardData changes
	 */
	$effect(() => {
		if (!ctx || !textTexture) return;

		// When user is actively editing, bypass scroll animation and show full text
		const effectiveTypingProgress = isUserEditing ? 1 : typingProgress;

		// Calculate character threshold - only redraw when a new character would appear
		const maxChars = Math.max(...LINES.map((l) => l.text.length));
		const threshold = 1 / maxChars;

		// Determine if caret should be drawn this frame
		// Only draw caret if it's supposed to be shown AND it's in the visible phase of blink
		const shouldDrawCaret = showCaret && blinkVisible;

		// Check if cardData changed
		const cardDataChanged = cardData.name !== lastRenderedName || cardData.title !== lastRenderedTitle;

		// Check if we need to redraw
		const progressDiff = Math.abs(effectiveTypingProgress - lastRenderedProgress);
		const caretVisChanged = shouldDrawCaret !== lastCaretDrawn;

		const needsRedraw =
			cardDataChanged || // Card data changed from input
			progressDiff >= threshold || // New character would appear
			lastRenderedProgress < 0 || // Initial render
			(effectiveTypingProgress > 0.95 && lastRenderedProgress <= 0.95) || // Snap to complete
			(effectiveTypingProgress < 0.05 && lastRenderedProgress >= 0.05) || // Snap to empty
			caretVisChanged; // Caret visibility changed (including blink)

		if (needsRedraw) {
			renderText(effectiveTypingProgress, shouldDrawCaret);
			lastCaretDrawn = shouldDrawCaret;
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
