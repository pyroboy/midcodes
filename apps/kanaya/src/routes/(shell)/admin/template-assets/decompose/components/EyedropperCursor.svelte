<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Custom eyedropper cursor with magnified pixel preview.
	 * Shows a zoom circle with the exact pixels around the cursor,
	 * with a crosshair indicating the center pixel that will be picked.
	 */

	let {
		x,
		y,
		canvasX,
		canvasY,
		compositeCtx,
		zoomLevel = 10,
		gridSize = 11
	}: {
		x: number; // Screen X position
		y: number; // Screen Y position
		canvasX: number; // X position in canvas pixel coordinates
		canvasY: number; // Y position in canvas pixel coordinates
		compositeCtx: CanvasRenderingContext2D | null;
		zoomLevel?: number; // How much to magnify each pixel
		gridSize?: number; // Number of pixels to show (should be odd for center pixel)
	} = $props();

	// Canvas for rendering the zoomed pixels
	let zoomCanvas: HTMLCanvasElement | undefined = $state();
	let zoomCtx: CanvasRenderingContext2D | null = $state(null);

	// Current center color
	let centerColor = $state('#000000');

	// Calculate the size of the zoom preview
	const previewSize = $derived(gridSize * zoomLevel);
	const halfGrid = $derived(Math.floor(gridSize / 2));

	// Center the zoom circle on the cursor (half the preview size)
	const offsetX = $derived(-previewSize / 2);
	const offsetY = $derived(-previewSize / 2);

	onMount(() => {
		if (zoomCanvas) {
			zoomCtx = zoomCanvas.getContext('2d', { willReadFrequently: true });
			if (zoomCtx) {
				zoomCtx.imageSmoothingEnabled = false; // Crisp pixel rendering
			}
		}
	});

	// Update the zoom preview when position changes
	$effect(() => {
		if (!zoomCtx || !compositeCtx) return;

		const srcX = Math.floor(canvasX) - halfGrid;
		const srcY = Math.floor(canvasY) - halfGrid;

		// Clear the zoom canvas
		zoomCtx.clearRect(0, 0, previewSize, previewSize);

		// Draw each pixel as a magnified square
		for (let py = 0; py < gridSize; py++) {
			for (let px = 0; px < gridSize; px++) {
				const sampleX = srcX + px;
				const sampleY = srcY + py;

				// Get pixel color from composite canvas
				let color = 'rgba(128, 128, 128, 0.3)'; // Default for out-of-bounds

				if (sampleX >= 0 && sampleY >= 0) {
					try {
						const imageData = compositeCtx.getImageData(sampleX, sampleY, 1, 1);
						const [r, g, b, a] = imageData.data;

						if (a > 0) {
							color = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
						} else {
							// Transparent - show checkerboard pattern
							const isLight = (px + py) % 2 === 0;
							color = isLight ? '#ffffff' : '#cccccc';
						}

						// Capture center pixel color
						if (px === halfGrid && py === halfGrid) {
							centerColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
						}
					} catch {
						// Out of bounds or error
					}
				}

				// Draw the magnified pixel
				zoomCtx.fillStyle = color;
				zoomCtx.fillRect(px * zoomLevel, py * zoomLevel, zoomLevel, zoomLevel);
			}
		}

		// Draw grid lines
		zoomCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
		zoomCtx.lineWidth = 1;

		for (let i = 0; i <= gridSize; i++) {
			// Vertical lines
			zoomCtx.beginPath();
			zoomCtx.moveTo(i * zoomLevel, 0);
			zoomCtx.lineTo(i * zoomLevel, previewSize);
			zoomCtx.stroke();

			// Horizontal lines
			zoomCtx.beginPath();
			zoomCtx.moveTo(0, i * zoomLevel);
			zoomCtx.lineTo(previewSize, i * zoomLevel);
			zoomCtx.stroke();
		}
	});

	// Export the center color for parent to use
	export function getCenterColor(): string {
		return centerColor;
	}
</script>

<div
	class="pointer-events-none fixed z-[99999]"
	style="left: {x + offsetX}px; top: {y + offsetY}px;"
>
	<!-- Zoom circle container -->
	<div
		class="relative rounded-full overflow-hidden shadow-2xl"
		style="
			width: {previewSize}px;
			height: {previewSize}px;
			box-shadow: 0 0 0 3px white, 0 0 0 5px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5);
		"
	>
		<!-- Pixel grid canvas -->
		<canvas
			bind:this={zoomCanvas}
			width={previewSize}
			height={previewSize}
			class="block"
		></canvas>

		<!-- Center pixel highlight -->
		<div
			class="absolute pointer-events-none"
			style="
				width: {zoomLevel}px;
				height: {zoomLevel}px;
				left: {halfGrid * zoomLevel}px;
				top: {halfGrid * zoomLevel}px;
				border: 2px solid white;
				box-shadow: 0 0 0 1px black, inset 0 0 0 1px black;
			"
		></div>

		<!-- Crosshair lines -->
		<div class="absolute inset-0 pointer-events-none">
			<!-- Horizontal line left -->
			<div
				class="absolute h-0.5 bg-black/40"
				style="width: {halfGrid * zoomLevel - 2}px; top: calc(50% - 1px); left: 0;"
			></div>
			<!-- Horizontal line right -->
			<div
				class="absolute h-0.5 bg-black/40"
				style="width: {halfGrid * zoomLevel - 2}px; top: calc(50% - 1px); right: 0;"
			></div>
			<!-- Vertical line top -->
			<div
				class="absolute w-0.5 bg-black/40"
				style="height: {halfGrid * zoomLevel - 2}px; left: calc(50% - 1px); top: 0;"
			></div>
			<!-- Vertical line bottom -->
			<div
				class="absolute w-0.5 bg-black/40"
				style="height: {halfGrid * zoomLevel - 2}px; left: calc(50% - 1px); bottom: 0;"
			></div>
		</div>
	</div>

	<!-- Color preview below -->
	<div
		class="flex items-center gap-2 mt-3 bg-black/90 rounded-lg px-3 py-2 backdrop-blur-sm shadow-lg"
		style="margin-left: {previewSize / 2 - 60}px;"
	>
		<div
			class="w-7 h-7 rounded border-2 border-white shadow-inner"
			style="background-color: {centerColor};"
		></div>
		<span class="text-white text-xs font-mono font-bold tracking-wide">{centerColor.toUpperCase()}</span>
	</div>
</div>
