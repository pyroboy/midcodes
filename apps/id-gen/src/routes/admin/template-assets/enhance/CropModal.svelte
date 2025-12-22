<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let {
		isOpen = $bindable(false),
		imageUrl,
		aspectRatio,
		targetWidth,
		targetHeight,
		onCropComplete
	}: {
		isOpen: boolean;
		imageUrl: string;
		aspectRatio: number;
		targetWidth: number;
		targetHeight: number;
		onCropComplete: (croppedImageUrl: string) => void;
	} = $props();

	let containerElement: HTMLDivElement;
	let imageElement: HTMLImageElement;
	let isProcessing = $state(false);

	// Transform state
	// x,y are translations in pixels
	// scale is the VISUAL scale factor (CSS transform scale)
	let transform = $state({ x: 0, y: 0, scale: 1 });

	// Normalize zoom concept:
	// zoomLevel 1.0 = Image fits perfectly in viewport (baseScale)
	// zoomLevel 2.0 = Image is 2x larger than fit
	let zoomLevel = $state(1);
	let baseScale = $state(1); // The CSS scale value that corresponds to zoomLevel = 1

	let isDragging = false;
	let startPos = { x: 0, y: 0 };

	// Viewport state (the visible crop area in pixels within the container)
	let viewport = $state({ width: 0, height: 0, x: 0, y: 0 });

	// Initialize
	onMount(() => {
		calculateViewport();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function handleResize() {
		calculateViewport();
	}

	function calculateViewport() {
		if (!containerElement) return;

		const rect = containerElement.getBoundingClientRect();
		const containerRatio = rect.width / rect.height;

		let w, h;

		// Fit viewport inside container maintaining aspect ratio
		// Use 95% to maximize crop area visibility
		if (containerRatio > aspectRatio) {
			h = rect.height * 0.95;
			w = h * aspectRatio;
		} else {
			w = rect.width * 0.95;
			h = w / aspectRatio;
		}

		viewport = {
			width: w,
			height: h,
			x: (rect.width - w) / 2,
			y: (rect.height - h) / 2
		};

		if (imageElement && imageElement.complete) {
			fitImageToViewport();
		}
	}

	function fitImageToViewport() {
		if (!imageElement || viewport.width === 0) return;

		// 1. Get current layout dimensions of the image (before transform)
		const imgW = imageElement.width;
		const imgH = imageElement.height;

		if (imgW === 0 || imgH === 0) return;

		// 2. Calculate scale needed to fit/cover viewport
		const scaleX = viewport.width / imgW;
		const scaleY = viewport.height / imgH;

		// "Fit" (show full image) is the minimum of scales needed to fit dimensions
		// This will be our baseScale (Zoom 1.0)
		baseScale = Math.min(scaleX, scaleY);

		// Default to Zoom 1.0
		zoomLevel = 1;
		updateTransform();
	}

	function updateTransform() {
		transform.scale = baseScale * zoomLevel;
	}

	// Interaction Handlers
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.99 : 1.01;
		// Limit zoomLevel between 1 and 3
		zoomLevel = Math.max(1, Math.min(3, zoomLevel * delta));
		updateTransform();
	}

	function onSliderChange(e: Event & { currentTarget: HTMLInputElement }) {
		zoomLevel = parseFloat(e.currentTarget.value);
		updateTransform();
	}

	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		startPos = { x: e.clientX - transform.x, y: e.clientY - transform.y };
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		transform.x = e.clientX - startPos.x;
		transform.y = e.clientY - startPos.y;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function reset() {
		transform.x = 0;
		transform.y = 0;
		zoomLevel = 1;
		updateTransform();
	}

	async function handleApply() {
		if (!imageElement) return;

		isProcessing = true;
		try {
			// Calculate crop logic

			// 1. Image rendered dimensions (untransformed layout size)
			const naturalWidth = imageElement.naturalWidth;

			// We need visible rect of image on screen (applying transform)
			const imageRect = imageElement.getBoundingClientRect();

			if (!containerElement || !imageElement) throw new Error('Elements missing');

			const containerRect = containerElement.getBoundingClientRect();
			const viewportRect = {
				left: containerRect.left + viewport.x,
				top: containerRect.top + viewport.y,
				width: viewport.width,
				height: viewport.height
			};

			// Calculate where the viewport is relative to the displayed image
			const relativeLeft = viewportRect.left - imageRect.left;
			const relativeTop = viewportRect.top - imageRect.top;

			// Scale ratio: natural pixel / displayed screen pixel
			const pixelRatio = naturalWidth / imageRect.width;

			const cropX = relativeLeft * pixelRatio;
			const cropY = relativeTop * pixelRatio;
			const cropWidth = viewportRect.width * pixelRatio;
			const cropHeight = viewportRect.height * pixelRatio;

			// Draw to canvas
			const canvas = document.createElement('canvas');
			canvas.width = targetWidth;
			canvas.height = targetHeight;
			const ctx = canvas.getContext('2d');

			if (!ctx) throw new Error('No context');

			// Fill with black (or transparent)
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw the slice
			ctx.drawImage(
				imageElement,
				cropX,
				cropY,
				cropWidth,
				cropHeight,
				0,
				0,
				targetWidth,
				targetHeight
			);

			canvas.toBlob((blob) => {
				if (!blob) {
					toast.error('Failed to create crop');
					isProcessing = false;
					return;
				}
				const url = URL.createObjectURL(blob);
				onCropComplete(url);
				isOpen = false;
				isProcessing = false;
			}, 'image/png');
		} catch (e) {
			console.error('Crop failed', e);
			toast.error('Failed to crop image');
			isProcessing = false;
		}
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex flex-col bg-black"
		transition:fade={{ duration: 150 }}
		role="dialog"
		aria-modal="true"
	>
		<!-- Workspace (90% of screen) -->
		<div
			class="relative flex-1 bg-neutral-950 overflow-hidden cursor-move select-none"
			bind:this={containerElement}
			onwheel={handleWheel}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
		>
			<!-- Image Layer -->
			<div class="absolute w-full h-full flex items-center justify-center pointer-events-none">
				<img
					bind:this={imageElement}
					src={imageUrl}
					alt="To crop"
					crossorigin="anonymous"
					class="max-w-none origin-center"
					style:transform="translate({transform.x}px, {transform.y}px) scale({transform.scale})"
					style:outline="1px dashed rgba(255,255,255,0.5)"
					style:outline-offset="-1px"
					onload={() => {
						calculateViewport();
					}}
				/>
			</div>

			<!-- Overlay Mask Layer - lighter for better visibility -->
			{#if viewport.width > 0}
				<!-- Top -->
				<div
					class="absolute bg-black/40"
					style="top: 0; left: 0; right: 0; height: {viewport.y}px;"
				></div>
				<!-- Bottom -->
				<div
					class="absolute bg-black/40"
					style="bottom: 0; left: 0; right: 0; top: {viewport.y + viewport.height}px;"
				></div>
				<!-- Left -->
				<div
					class="absolute bg-black/40"
					style="top: {viewport.y}px; bottom: {containerElement?.clientHeight -
						(viewport.y + viewport.height)}px; left: 0; width: {viewport.x}px;"
				></div>
				<!-- Right -->
				<div
					class="absolute bg-black/40"
					style="top: {viewport.y}px; bottom: {containerElement?.clientHeight -
						(viewport.y + viewport.height)}px; right: 0; left: {viewport.x + viewport.width}px;"
				></div>

				<!-- Viewport Border - 1px thin for pixel accuracy -->
				<div
					class="absolute pointer-events-none"
					style="top: {viewport.y}px; left: {viewport.x}px; width: {viewport.width}px; height: {viewport.height}px; box-shadow: 0 0 0 1px rgba(255,255,255,0.8), 0 0 0 2px rgba(0,0,0,0.4);"
				>
					<!-- Corner markers for precision -->
					<div class="absolute -top-px -left-px w-4 h-px bg-white"></div>
					<div class="absolute -top-px -left-px w-px h-4 bg-white"></div>
					<div class="absolute -top-px -right-px w-4 h-px bg-white"></div>
					<div class="absolute -top-px -right-px w-px h-4 bg-white"></div>
					<div class="absolute -bottom-px -left-px w-4 h-px bg-white"></div>
					<div class="absolute -bottom-px -left-px w-px h-4 bg-white"></div>
					<div class="absolute -bottom-px -right-px w-4 h-px bg-white"></div>
					<div class="absolute -bottom-px -right-px w-px h-4 bg-white"></div>
				</div>
			{/if}

			<!-- Dimensions overlay -->
			<div
				class="absolute top-3 left-3 text-xs text-white/70 font-mono bg-black/50 px-2 py-1 rounded"
			>
				{targetWidth} × {targetHeight}px
			</div>
		</div>

		<!-- Compact Controls Bar -->
		<div
			class="flex items-center justify-between px-4 py-2 bg-neutral-900 border-t border-neutral-800"
		>
			<div class="flex items-center gap-4">
				<button
					class="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
					onclick={reset}
				>
					Reset
				</button>
				<div class="flex items-center gap-2">
					<span class="text-xs text-neutral-500">Zoom</span>
					<input
						type="range"
						min="1"
						max="3"
						step="0.001"
						value={zoomLevel}
						oninput={onSliderChange}
						class="w-32 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-white"
					/>
					<span class="text-xs text-neutral-400 w-10 font-mono">{zoomLevel.toFixed(2)}x</span>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					class="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
					onclick={() => (isOpen = false)}
					disabled={isProcessing}
				>
					Cancel
				</button>
				<button
					class="px-4 py-1.5 text-xs font-medium bg-white text-black rounded hover:bg-neutral-200 transition-colors flex items-center gap-2"
					onclick={handleApply}
					disabled={isProcessing}
				>
					{#if isProcessing}
						<div
							class="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"
						></div>
						Cropping...
					{:else}
						Apply
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
