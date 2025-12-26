<script lang="ts">
	import { ImageIcon } from 'lucide-svelte';
	import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';
	import CanvasToolbar from './CanvasToolbar.svelte';

	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Scissors } from 'lucide-svelte';

	type CanvasTool = 'brush' | 'eraser' | 'lasso' | 'eyedropper' | null;

	let {
		currentImageUrl,
		currentLayers,
		layerSelections,
		showOriginalLayer,
		selectedLayerId,
		assetName,
		activeSide,
		widthPixels,
		heightPixels,
		orientation,
		activeTool = $bindable<CanvasTool>(null),
		currentColor = $bindable<string>('#3b82f6'),
		onLassoCut,
		isProcessing = false
	}: {
		currentImageUrl: string | null;
		currentLayers: DecomposedLayer[];
		layerSelections: Map<string, LayerSelection>;
		showOriginalLayer: boolean;
		selectedLayerId: string | null;
		assetName: string;
		activeSide: string;
		widthPixels: number;
		heightPixels: number;
		orientation: string;
		activeTool?: CanvasTool;
		currentColor?: string;
		onLassoCut?: (points: { x: number; y: number }[]) => void;
		isProcessing?: boolean;
	} = $props();

	let previousTool = $state<CanvasTool>(null);
	let lassoPoints = $state<{ x: number; y: number }[]>([]);
	let isLassoClosed = $state(false);
	let lassoPopoverOpen = $state(false);

	async function startEyedropper() {
		if (typeof window !== 'undefined' && 'EyeDropper' in window) {
			try {
				// @ts-ignore - EyeDropper is a relatively new API
				const eyeDropper = new window.EyeDropper();
				const result = await eyeDropper.open();
				currentColor = result.sRGBHex;
				// After picking, switch back to previous tool if it was brush/lasso
				if (previousTool && previousTool !== 'eyedropper') {
					activeTool = previousTool;
				} else {
					activeTool = 'brush'; // Default to brush
				}
			} catch (e) {
				console.log('Eyedropper cancelled or failed:', e);
				// If cancelled, switch back anyway so we don't get stuck
				activeTool = previousTool || null;
			}
		} else {
			alert('Your browser does not support the EyeDropper API');
			activeTool = previousTool || null;
		}
	}

	$effect(() => {
		if (activeTool === 'eyedropper') {
			startEyedropper();
		} else {
			previousTool = activeTool;
		}
	});

	function handleInnerClick(e: MouseEvent) {
		const target = e.target as HTMLElement;

		// If tool is lasso, handle poly-line creation
		if (activeTool === 'lasso') {
			// Don't interact if clicking on the popover or toolbar
			if (target.closest('[data-toolbar]') || target.closest('[data-lasso-popover]')) return;

			// Stop propagation so outer click doesn't deselect?
			// Actually we want to stop propagation so we don't trigger "deselect" logic if that's on outer
			e.stopPropagation();

			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = (e.clientY - rect.top) / rect.height;

			// Check if closing the loop (click near start)
			if (lassoPoints.length > 2) {
				const start = lassoPoints[0];
				const dist = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
				// Threshold of 3% distance to close
				if (dist < 0.03) {
					isLassoClosed = true;
					lassoPopoverOpen = true;
					return;
				}
			}

			if (isLassoClosed && !lassoPopoverOpen) {
				// Reset if clicking after functionality is done
				lassoPoints = [{ x, y }];
				isLassoClosed = false;
				lassoPopoverOpen = false;
			} else if (!isLassoClosed) {
				lassoPoints = [...lassoPoints, { x, y }];
			}
			return;
		}

		// If NOT lasso, we allow bubble or handle here?
		// If clicking on image (inner) without tool, maybe deselect tool?
		if (!target.closest('[data-toolbar]')) {
			activeTool = null;
		}
	}

	function handleOuterClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// Deselect tool when clicking on outer canvas area if not toolbar
		// This handles clicking on "empty grey space"
		if (!target.closest('[data-toolbar]')) {
			activeTool = null;
			lassoPoints = [];
			isLassoClosed = false;
		}
	}

	// Reset lasso when tool changes
	$effect(() => {
		if (activeTool !== 'lasso') {
			lassoPoints = [];
			isLassoClosed = false;
			lassoPopoverOpen = false;
		}
	});

	function handleCut() {
		if (onLassoCut && isLassoClosed) {
			onLassoCut(lassoPoints);
			lassoPoints = [];
			isLassoClosed = false;
			lassoPopoverOpen = false;
		}
	}
</script>

<div class="rounded-lg border border-border bg-card overflow-hidden">
	<div class="p-4 border-b border-border bg-muted/30">
		<h2 class="font-medium text-foreground">Template Preview</h2>
		<p class="text-xs text-muted-foreground">
			{widthPixels} x {heightPixels}px • {orientation}
		</p>
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="relative aspect-[1.6/1] bg-muted/50 flex items-center justify-center pb-20 border border-border rounded-md overflow-hidden"
		onclick={handleOuterClick}
	>
		<!-- Inner Image Wrapper - Constrained by Aspect Ratio -->
		<div
			class="relative w-full h-full shadow-sm flex items-center justify-center transition-all bg-[length:20px_20px] bg-repeat"
			style="max-width: 100%; max-height: 100%; aspect-ratio: {widthPixels}/{heightPixels}; background-image: conic-gradient(#eee 90deg, transparent 90deg), conic-gradient(transparent 90deg, #eee 90deg);"
			onclick={handleInnerClick}
		>
			{#if currentLayers.length > 0}
				<!-- Render Decomposed Layers -->
				<div class="relative w-full h-full">
					<!-- Original File Layer (shown behind all others when enabled) -->
					{#if showOriginalLayer && currentImageUrl}
						<img
							src={currentImageUrl}
							alt="Original file"
							class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
							style="z-index: -1; opacity: 0.5;"
						/>
					{/if}

					{#each currentLayers as layer (layer.id)}
						{@const selection = layerSelections.get(layer.id)}
						{@const hasBounds = layer.bounds && layer.bounds.width > 0 && layer.bounds.height > 0}
						<img
							src={layer.imageUrl}
							alt={layer.name}
							class="absolute object-fill transition-opacity duration-200 pointer-events-none"
							style="
								z-index: {layer.zIndex}; 
								opacity: {selection?.included ? 1 : 0};
								left: {hasBounds ? ((layer.bounds?.x || 0) / widthPixels) * 100 : 0}%;
								top: {hasBounds ? ((layer.bounds?.y || 0) / heightPixels) * 100 : 0}%;
								width: {hasBounds ? ((layer.bounds?.width || 0) / widthPixels) * 100 : 100}%;
								height: {hasBounds ? ((layer.bounds?.height || 0) / heightPixels) * 100 : 100}%;
							"
							onload={() =>
								console.log('Layer rendered:', {
									id: layer.id,
									name: layer.name,
									bounds: layer.bounds,
									hasBounds
								})}
						/>
					{/each}

					<!-- Selection Overlay (High Z-Index) -->
					<div class="absolute inset-0 pointer-events-none" style="z-index: 9999;">
						{#each currentLayers as layer (layer.id)}
							<div
								class="absolute inset-0 border-2 transition-opacity {selectedLayerId === layer.id
									? 'border-primary opacity-100'
									: 'border-transparent opacity-0'}"
							></div>
						{/each}
					</div>
				</div>
			{:else if currentImageUrl && showOriginalLayer}
				<img
					src={currentImageUrl}
					alt="{assetName} - {activeSide}"
					class="w-full h-full object-contain"
				/>
			{:else}
				<div class="text-center text-muted-foreground">
					<ImageIcon class="h-12 w-12 mx-auto mb-2 opacity-30" />
					<p class="text-sm">No image available</p>
				</div>
			{/if}

			<!-- Lasso Overlay attached to Inner Wrapper -->
			{#if activeTool === 'lasso' && lassoPoints.length > 0}
				<!-- Layer 1: Paths & Fills (Scalable geometry, consistent stroke) -->
				<svg
					class="absolute inset-0 w-full h-full pointer-events-none z-[10001]"
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
				>
					<!-- Closed State: Dimmer & Highlight -->
					{#if isLassoClosed}
						<path
							d={`M0,0 H100 V100 H0 Z ` +
								`M${lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')} Z`}
							fill-rule="evenodd"
							fill="rgba(0,0,0,0.6)"
						/>
						<polygon
							points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
							fill="rgba(255,255,255,0.1)"
						/>
					{/if}

					<!-- Marquee Stroke -->
					{#if isLassoClosed}
						<!-- White stroke base -->
						<polygon
							points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
							fill="none"
							stroke="white"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<!-- Black dashed march -->
						<polygon
							points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
							fill="none"
							stroke="black"
							stroke-width="1.5"
							stroke-dasharray="4 4"
							vector-effect="non-scaling-stroke"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="animate-march"
						/>
					{:else}
						<polyline
							points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
							fill="none"
							stroke="white"
							stroke-width="1.5"
							vector-effect="non-scaling-stroke"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<polyline
							points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
							fill="none"
							stroke="black"
							stroke-width="1.5"
							stroke-dasharray="4 4"
							vector-effect="non-scaling-stroke"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="animate-march"
						/>
					{/if}
				</svg>

				<!-- Layer 2: Handles/Dots (Screen-space 1:1, no distortion) -->
				<svg class="absolute inset-0 w-full h-full pointer-events-none z-[10002]">
					{#each lassoPoints as p, i}
						<circle
							cx="{p.x * 100}%"
							cy="{p.y * 100}%"
							r="3"
							fill="white"
							stroke="black"
							stroke-width="1"
						/>
						{#if i === 0 && lassoPoints.length > 2 && !isLassoClosed}
							<!-- Start Point Indicator -->
							<circle
								cx="{p.x * 100}%"
								cy="{p.y * 100}%"
								r="5"
								fill="rgba(239, 68, 68, 0.4)"
								stroke="rgba(239, 68, 68, 0.9)"
								stroke-width="1"
								class="animate-pulse"
							/>
						{/if}
					{/each}
				</svg>

				<!-- Popover Anchor -->
				{#if isLassoClosed && lassoPopoverOpen}
					<div
						class="absolute w-0 h-0 z-[10003]"
						style="left: {lassoPoints[0].x * 100}%; top: {lassoPoints[0].y * 100}%;"
						data-lasso-popover
					>
						<Popover.Root open={true} onOpenChange={(v) => !v && (lassoPopoverOpen = false)}>
							<Popover.Trigger class="w-0 h-0 opacity-0" />
							<Popover.Content
								side="top"
								sideOffset={10}
								class="w-auto p-0 bg-transparent border-none shadow-none z-[10010] pointer-events-auto"
							>
								<Button
									size="sm"
									variant="default"
									class="h-7 px-3 text-xs gap-1.5 rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 shadow-xl border border-zinc-700/50 backdrop-blur-sm pointer-events-auto cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
									onclick={handleCut}
									disabled={isProcessing}
								>
									{#if isProcessing}
										<div
											class="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin"
										></div>
										<span class="font-medium">Cutting...</span>
									{:else}
										<Scissors class="w-3.5 h-3.5" />
										<span class="font-medium">Copy to New Layer</span>
									{/if}
								</Button>
							</Popover.Content>
						</Popover.Root>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Canvas Toolbar Overlay -->
		<!-- Canvas Toolbar Overlay (Outside Inner Wrapper so it is fixed relative to card) -->
		<!-- We use absolute positioning relative to the outer container now -->
		<div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-[10000]" data-toolbar>
			<CanvasToolbar bind:activeTool bind:currentColor disabled={!selectedLayerId} />
		</div>
	</div>
</div>

<style>
	@keyframes march {
		to {
			stroke-dashoffset: -200; /* Should be large enough to look smooth, or match pattern */
		}
	}
	.animate-march {
		animation: march 5s linear infinite;
	}
</style>
