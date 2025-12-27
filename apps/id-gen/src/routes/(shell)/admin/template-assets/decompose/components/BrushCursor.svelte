<script lang="ts">
	/**
	 * BrushCursor - Visual cursor for brush/eraser tools
	 *
	 * Shows a circular cursor that represents:
	 * - Size: diameter of the circle in pixels (relative to displayed container)
	 * - Hardness: edge softness via radial gradient
	 *   - 100 = solid edge
	 *   - 0 = fully feathered/soft gradient
	 *
	 * Coordinates (x, y) are in pixels relative to container, matching BrushTool coordinate system.
	 */

	let {
		x,
		y,
		size,
		hardness = 100,
		color = '#3b82f6',
		visible = true,
		isEraser = false
	}: {
		/** X position in pixels relative to container */
		x: number;
		/** Y position in pixels relative to container */
		y: number;
		/** Brush size in pixels */
		size: number;
		hardness?: number;
		color?: string;
		visible?: boolean;
		isEraser?: boolean;
	} = $props();

	// Calculate visual bleed from blur
	// Must match BrushTool.svelte.ts logic
	// Tool logic: blur = (size * (1 - H)) / 4
	// Visual bleed approx 2 * blur
	const blurRadius = $derived((size * (1 - hardness / 100)) / 4);
	const visualSize = $derived(size + blurRadius * 4);

	// Calculate gradient stops based on hardness
	// Hardness 100 = solid circle with sharp edge
	// Hardness 0 = fully feathered, gradient from center outward
	const gradientStops = $derived.by(() => {
		// Convert hardness (0-100) to gradient stop position
		// At hardness 100, the solid color extends to the edge
		// At hardness 0, the gradient starts from center
		const solidStop = hardness / 100; // 0.0 to 1.0

		if (isEraser) {
			// Eraser uses a lighter fill to indicate erasing
			return `
				rgba(255, 255, 255, 0.4) 0%,
				rgba(255, 255, 255, 0.4) ${solidStop * 100}%,
				rgba(255, 255, 255, 0) 100%
			`;
		}

		// Parse hex color to rgba for gradient
		const hexToRgba = (hex: string, alpha: number) => {
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		};

		const solidColor = hexToRgba(color, 0.5);
		const fadeColor = hexToRgba(color, 0);

		return `
			${solidColor} 0%,
			${solidColor} ${solidStop * 100}%,
			${fadeColor} 100%
		`;
	});
</script>

{#if visible}
	<div
		class="absolute pointer-events-none rounded-full"
		style="
			left: {x}px;
			top: {y}px;
			width: {visualSize}px;
			height: {visualSize}px;
			transform: translate(-50%, -50%);
			background: radial-gradient(circle, {gradientStops});
			border: 1px solid {isEraser ? 'rgba(255, 100, 100, 0.6)' : 'rgba(255, 255, 255, 0.8)'};
			box-shadow: 0 0 0 1px {isEraser ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
		"
	>
		<!-- Inner core indicator (original size) if soft -->
		{#if hardness < 100}
			<div
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 border-dashed"
				style="
			width: {size}px;
			height: {size}px;
		  "
			></div>
		{/if}
	</div>
{/if}
