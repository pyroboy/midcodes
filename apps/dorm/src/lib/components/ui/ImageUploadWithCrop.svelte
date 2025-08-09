<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Camera, Upload, X, RotateCw, ZoomIn, ZoomOut, Move, Check } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';

	let {
		value = $bindable(''),
		disabled = false,
		onupload,
		onremove,
		onerror,
		onCropReady, // NEW: Called when crop is ready but not uploaded yet
		class: className = '',
		placeholder = 'Upload image',
		maxSize = 10, // MB - increased for larger images
		cropSize = { width: 400, height: 400 } // Final crop size
	} = $props<{
		value?: string | null;
		disabled?: boolean;
		onupload?: (file: File) => Promise<void> | void;
		onremove?: () => void;
		onerror?: (error: string) => void;
		onCropReady?: (file: File, previewUrl: string) => void; // NEW: Deferred upload
		class?: string;
		placeholder?: string;
		maxSize?: number;
		cropSize?: { width: number; height: number };
	}>();

	// Component state
	let fileInput: HTMLInputElement;
	let showCropModal = $state(false);
	let originalImage: HTMLImageElement | null = $state(null);
	let canvas: HTMLCanvasElement | null = $state(null);
	let ctx: CanvasRenderingContext2D;
	let isDragging = $state(false);
	let isUploading = $state(false);

	// Crop state
	let scale = $state(1);
	let position = $state({ x: 0, y: 0 });
	let rotation = $state(0);
	let imageData = $state<{
		file: File | null;
		url: string;
		naturalWidth: number;
		naturalHeight: number;
	}>({
		file: null,
		url: '',
		naturalWidth: 0,
		naturalHeight: 0
	});

	// Mobile touch handling
	let touchStart = $state<{ x: number; y: number } | null>(null);
	let lastTouchDistance = $state(0);
	let initialScale = $state(1);
	let initialPosition = $state({ x: 0, y: 0 });

	// File input handler
	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			onerror?.('Please select a valid image file');
			return;
		}

		if (file.size > maxSize * 1024 * 1024) {
			onerror?.(`File size must be less than ${maxSize}MB`);
			return;
		}

		await loadImageForCropping(file);
	}

	// Load image for cropping
	async function loadImageForCropping(file: File) {
		console.log('Loading image for cropping:', file.name, file.type, file.size);
		
		const url = URL.createObjectURL(file);
		console.log('Created blob URL:', url);
		
		const img = new Image();
		img.crossOrigin = 'anonymous'; // Allow canvas to read the image

		img.onload = async () => {
			console.log('✅ Image loaded successfully:', { 
				width: img.naturalWidth, 
				height: img.naturalHeight,
				file: file.name,
				src: img.src
			});
			
			// Verify image has valid dimensions
			if (img.naturalWidth === 0 || img.naturalHeight === 0) {
				console.error('❌ Image has invalid dimensions');
				onerror?.('Invalid image file');
				return;
			}
			
			imageData = {
				file,
				url,
				naturalWidth: img.naturalWidth,
				naturalHeight: img.naturalHeight
			};

			// Set the image reference immediately
			originalImage = img;
			console.log('🖼️ Original image set:', originalImage);
			
			// Calculate initial settings
			resetCropSettings();
			console.log('⚙️ Crop settings reset, scale:', scale);
			
			// Open modal - this will trigger the canvas drawing effect
			showCropModal = true;
			console.log('🚀 Modal opened, waiting for DOM update...');

			// Wait for DOM to update so canvas element is bound
			await tick();
			console.log('🔄 DOM tick complete, canvas bound:', !!canvas);

			// Now try to draw the image
			if (canvas && originalImage) {
				console.log('✅ Canvas and image ready after tick - drawing now!');
				drawCropPreview();
			} else {
				console.log('❌ Canvas or image still not ready after tick:', { canvas: !!canvas, originalImage: !!originalImage });
			}
		};

		img.onerror = (error) => {
			console.error('❌ Image failed to load:', error);
			URL.revokeObjectURL(url);
			onerror?.('Failed to load image');
		};

		// Set the source to start loading
		img.src = url;
		console.log('📡 Started loading image from:', url);
	}

	// Reset crop settings to fit image in the full square canvas
	function resetCropSettings() {
		if (!originalImage) return;

		// Calculate scale to fit the entire square canvas
		const canvasSize = 340;
		const imgW = originalImage.naturalWidth;
		const imgH = originalImage.naturalHeight;
		
		// Scale to fit the canvas (square), using 90% for comfortable margin
		const effectiveCanvasSize = canvasSize * 0.9;
		const scaleForWidth = effectiveCanvasSize / imgW;
		const scaleForHeight = effectiveCanvasSize / imgH;
		scale = Math.min(scaleForWidth, scaleForHeight, 1); // Don't upscale beyond original
		
		// Ensure minimum visibility for very small images
		if (scale < 0.2) {
			scale = 0.4;
		}

		position = { x: 0, y: 0 };
		rotation = 0;
		console.log('Reset scale to fit canvas:', scale, 'Canvas size:', canvasSize);
	}

	// Draw crop preview with circular crop area
	function drawCropPreview() {
		if (!canvas || !originalImage || !showCropModal) return;

		const context = canvas.getContext('2d');
		if (!context) return;
		
		ctx = context;

		// Larger canvas to fill modal better - match container width
		const canvasSize = 340;
		canvas.width = canvasSize;
		canvas.height = canvasSize;

		// Clear canvas with slate background
		ctx.fillStyle = '#f1f5f9';
		ctx.fillRect(0, 0, canvasSize, canvasSize);

		ctx.save();

		// Center the transformation
		ctx.translate(canvasSize / 2, canvasSize / 2);
		ctx.rotate((rotation * Math.PI) / 180);
		ctx.scale(scale, scale);
		ctx.translate(position.x, position.y);

		// Draw image - optimize for large images
		const imgW = originalImage.naturalWidth;
		const imgH = originalImage.naturalHeight;

		if (originalImage.complete && originalImage.naturalWidth > 0) {
			// PREVIEW TRANSFORMATION LOG
			console.log('🖼️ PREVIEW DRAWING:', {
				canvasSize: canvasSize,
				imageSize: { w: imgW, h: imgH },
				scale: scale,
				position: position,
				rotation: rotation,
				isLargeImage: imgW > 1500 || imgH > 1500
			});

			// For very large images, draw at optimized size for better performance
			if (imgW > 1500 || imgH > 1500) {
				const maxSize = 1500;
				const imageScale = Math.min(maxSize / imgW, maxSize / imgH);
				const drawW = imgW * imageScale;
				const drawH = imgH * imageScale;
				ctx.drawImage(originalImage, -drawW / 2, -drawH / 2, drawW, drawH);
				console.log('📏 Preview: Large image optimized', { imageScale, drawW, drawH });
			} else {
				ctx.drawImage(originalImage, -imgW / 2, -imgH / 2, imgW, imgH);
				console.log('📏 Preview: Full size image drawn');
			}
		}

		ctx.restore();

		// Draw circular crop overlay - circle fills the entire square canvas
		// 340px canvas -> 340px diameter circle (170px radius) = fills entire canvas
		const cropRadius = canvasSize / 2; // 170px radius for 340px canvas (full width)
		const centerX = canvasSize / 2;
		const centerY = canvasSize / 2;

		// Method: Draw dark overlay ONLY outside the circle
		ctx.save();
		
		// Create clipping path for the circle (everything OUTSIDE the circle)
		ctx.beginPath();
		ctx.rect(0, 0, canvasSize, canvasSize); // Full canvas
		ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2, true); // Circle (counterclockwise = hole)
		ctx.clip();
		
		// Fill the area outside the circle with dark overlay
		ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
		ctx.fillRect(0, 0, canvasSize, canvasSize);
		
		ctx.restore();

		// Draw circle border around crop area
		ctx.strokeStyle = '#64748b';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2);
		ctx.stroke();
	}

	// Canvas mouse/touch handlers
	function handleCanvasMouseDown(event: MouseEvent) {
		if (disabled) return;
		isDragging = true;
		event.preventDefault();
	}

	function handleCanvasMouseMove(event: MouseEvent) {
		if (!isDragging || disabled) return;
		
		const sensitivity = 0.5;
		
		position = {
			x: position.x + event.movementX * sensitivity,
			y: position.y + event.movementY * sensitivity
		};
		
		// Force immediate redraw for smooth dragging
		if (canvas && originalImage) {
			drawCropPreview();
		}
	}

	function handleCanvasMouseUp() {
		isDragging = false;
	}

	// Touch handlers for mobile
	function handleTouchStart(event: TouchEvent) {
		if (disabled) return;
		event.preventDefault();

		if (event.touches.length === 1) {
			const touch = event.touches[0];
			touchStart = { x: touch.clientX, y: touch.clientY };
			initialPosition = { ...position };
		} else if (event.touches.length === 2) {
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			const distance = Math.sqrt(
				Math.pow(touch2.clientX - touch1.clientX, 2) +
				Math.pow(touch2.clientY - touch1.clientY, 2)
			);
			lastTouchDistance = distance;
			initialScale = scale;
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (disabled || !touchStart) return;
		event.preventDefault();

		if (event.touches.length === 1) {
			// Single finger - pan
			const touch = event.touches[0];
			const deltaX = (touch.clientX - touchStart.x) * 0.5;
			const deltaY = (touch.clientY - touchStart.y) * 0.5;
			
			position = {
				x: initialPosition.x + deltaX,
				y: initialPosition.y + deltaY
			};
		} else if (event.touches.length === 2 && lastTouchDistance > 0) {
			// Two fingers - zoom
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			const distance = Math.sqrt(
				Math.pow(touch2.clientX - touch1.clientX, 2) +
				Math.pow(touch2.clientY - touch1.clientY, 2)
			);

			const scaleChange = distance / lastTouchDistance;
			scale = Math.max(0.1, Math.min(5, initialScale * scaleChange));
		}
		
		// Force immediate redraw for smooth touch interactions
		if (canvas && originalImage) {
			drawCropPreview();
		}
	}

	function handleTouchEnd() {
		touchStart = null;
		lastTouchDistance = 0;
	}

	// Simplified control handlers
	function zoomIn() {
		scale = Math.min(3, scale * 1.3);
		if (canvas && originalImage) drawCropPreview();
	}

	function zoomOut() {
		scale = Math.max(0.2, scale / 1.3);
		if (canvas && originalImage) drawCropPreview();
	}

	function resetCrop() {
		resetCropSettings();
		if (canvas && originalImage) drawCropPreview();
	}

	// Generate circular cropped image and upload - CANVAS-TO-CANVAS METHOD
	async function applyCrop() {
		if (!originalImage || !imageData.file || !canvas) return;

		isUploading = true;

		try {
			console.log('🎯 STARTING PRECISE CANVAS-TO-CANVAS CROP');
			
			// METHOD: Copy directly from preview canvas to avoid transformation errors
			// Step 1: Get the current preview canvas state (what user sees)
			const previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			
			// Step 2: Create intermediate canvas at same size as preview for pixel-perfect copy
			const intermediateCanvas = document.createElement('canvas');
			const intermediateCtx = intermediateCanvas.getContext('2d')!;
			intermediateCanvas.width = canvas.width;  // 340px
			intermediateCanvas.height = canvas.height; // 340px
			
			// Step 3: Copy preview canvas exactly
			intermediateCtx.putImageData(previewImageData, 0, 0);
			console.log('✅ Preview canvas copied to intermediate canvas');
			
			// Step 4: Create final crop canvas
			const finalCanvas = document.createElement('canvas');
			const finalCtx = finalCanvas.getContext('2d')!;
			finalCanvas.width = cropSize.width;   // 400px
			finalCanvas.height = cropSize.height; // 400px

			// Step 5: Create circular clip path on final canvas
			finalCtx.save();
			finalCtx.beginPath();
			finalCtx.arc(cropSize.width / 2, cropSize.height / 2, cropSize.width / 2, 0, Math.PI * 2);
			finalCtx.clip();

			// Step 6: Draw white background
			finalCtx.fillStyle = '#ffffff';
			finalCtx.fillRect(0, 0, cropSize.width, cropSize.height);

			// Step 7: Scale and draw the intermediate canvas to final canvas
			// This preserves exactly what the user sees, just scaled up
			const scaleRatio = cropSize.width / canvas.width; // 400/340 = 1.176
			
			console.log('🎯 CANVAS-TO-CANVAS SCALE:', {
				previewSize: { w: canvas.width, h: canvas.height },
				finalSize: { w: cropSize.width, h: cropSize.height },
				scaleRatio: scaleRatio,
				method: 'DIRECT_CANVAS_COPY'
			});

			// Draw the intermediate canvas scaled up to final size
			finalCtx.drawImage(
				intermediateCanvas,           // Source: exact copy of preview
				0, 0, canvas.width, canvas.height,    // Source rectangle (entire preview)
				0, 0, cropSize.width, cropSize.height // Destination rectangle (entire final)
			);
			
			finalCtx.restore();
			console.log('✅ Canvas-to-canvas copy complete - PIXEL PERFECT!');

			// Convert to blob and create file for upload
			return new Promise<void>((resolve, reject) => {
				finalCanvas.toBlob(async (blob) => {
					if (!blob) {
						reject(new Error('Failed to create cropped image'));
						return;
					}

					const timestamp = Date.now();
					const originalName = imageData.file!.name.split('.')[0];
					const croppedFile = new File([blob], `${originalName}_cropped_${timestamp}.jpg`, {
						type: 'image/jpeg',
						lastModified: timestamp
					});

					try {
						// Check if we should upload immediately or defer
						if (onCropReady) {
							// DEFERRED MODE: Create preview URL and pass file for later upload
							const previewUrl = URL.createObjectURL(blob);
							value = previewUrl; // Show preview immediately
							onCropReady(croppedFile, previewUrl); // Pass file for later upload
							console.log('✅ Crop ready - deferred upload mode');
						} else {
							// IMMEDIATE MODE: Upload right away (legacy behavior)
							await onupload?.(croppedFile);
							console.log('✅ Crop uploaded immediately');
						}
						
						showCropModal = false;
						resolve();
					} catch (error: any) {
						console.error('Crop processing failed:', error);
						reject(error);
					}
				}, 'image/jpeg', 0.9);
			});
		} catch (error: any) {
			console.error('Crop failed:', error);
			onerror?.(error.message || 'Failed to crop image');
		} finally {
			isUploading = false;
		}
	}

	function closeCropModal() {
		showCropModal = false;
		if (imageData.url) {
			URL.revokeObjectURL(imageData.url);
		}
		imageData = { file: null, url: '', naturalWidth: 0, naturalHeight: 0 };
	}

	// Main effect: Draw as soon as canvas is available
	$effect(() => {
		console.log('🎨 MAIN DRAW EFFECT:', {
			canvas: !!canvas,
			showCropModal,
			originalImage: !!originalImage
		});
		
		// The moment all three are ready, draw immediately
		if (canvas && showCropModal && originalImage) {
			console.log('✅✅✅ ALL READY - DRAWING NOW!');
			ctx = canvas.getContext('2d')!;
			drawCropPreview();
		}
	});

	// State changes: redraw when user interacts
	$effect(() => {
		if (canvas && originalImage && showCropModal) {
			console.log('🔄 State change redraw:', { scale, position, rotation });
			drawCropPreview();
		}
	});
</script>

<div class={`flex flex-col items-center space-y-2 ${className}`}>
	<!-- Display current image or upload area -->
	{#if value}
		<div class="relative group">
			<img 
				src={value} 
				alt="Profile" 
				class="w-32 h-32 rounded-full object-cover border-2 border-slate-200 shadow-sm"
			/>
			<div class="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
				<div class="flex gap-2">
					<Button
						type="button"
						size="sm"
						variant="ghost"
						class="text-white hover:bg-white hover:bg-opacity-20"
						onclick={() => fileInput?.click()}
						{disabled}
					>
						<Camera class="w-4 h-4" />
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						class="text-white hover:bg-white hover:bg-opacity-20"
						onclick={onremove}
						{disabled}
					>
						<X class="w-4 h-4" />
					</Button>
				</div>
			</div>
		</div>
	{:else}
		<button
			type="button"
			class="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center text-gray-500 hover:text-gray-600 transition-colors {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
			onclick={() => fileInput?.click()}
			{disabled}
		>
			<Upload class="w-6 h-6 mb-1" />
			<span class="text-xs text-center px-2">{placeholder}</span>
		</button>
	{/if}

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={handleFileSelect}
		{disabled}
	/>

	<p class="text-xs text-gray-500 text-center">
		Max size: {maxSize}MB • JPG, PNG, GIF
	</p>
</div>

<!-- Minimalist Crop Modal -->
<Dialog bind:open={showCropModal} onOpenChange={closeCropModal}>
	<DialogContent class="sm:max-w-md bg-slate-50">
		<DialogHeader>
			<DialogTitle class="text-slate-800 text-center">Crop Photo</DialogTitle>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Crop Preview -->
			<div class="flex justify-center">
				<div class="relative">
					<canvas
						bind:this={canvas}
						width="340"
						height="340"
						class="rounded-xl cursor-move touch-none"
						onmousedown={handleCanvasMouseDown}
						onmousemove={handleCanvasMouseMove}
						onmouseup={handleCanvasMouseUp}
						onmouseleave={handleCanvasMouseUp}
						ontouchstart={handleTouchStart}
						ontouchmove={handleTouchMove}
						ontouchend={handleTouchEnd}
					></canvas>
				</div>
			</div>

			<!-- Simple Instructions -->
			<p class="text-xs text-slate-600 text-center">
				Drag to move • Pinch or use buttons to zoom
			</p>

			<!-- Minimal Controls -->
			<div class="flex justify-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={zoomOut}
					{disabled}
					class="bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"
				>
					<ZoomOut class="w-4 h-4" />
				</Button>
				
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={resetCrop}
					{disabled}
					class="bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"
				>
					Reset
				</Button>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={zoomIn}
					{disabled}
					class="bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"
				>
					<ZoomIn class="w-4 h-4" />
				</Button>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-2 pt-2">
				<Button
					type="button"
					variant="outline"
					onclick={closeCropModal}
					{disabled}
					class="flex-1 bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700"
				>
					Cancel
				</Button>
				<Button
					type="button"
					onclick={applyCrop}
					disabled={disabled || isUploading}
					class="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
				>
					{#if isUploading}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
						Save
					{:else}
						Save
					{/if}
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>