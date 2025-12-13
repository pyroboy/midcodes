<script lang="ts">
	import { run } from 'svelte/legacy';
	import { createEventDispatcher, onMount, onDestroy, untrack, tick } from 'svelte';
	import { Move, Scaling, Camera, Image as ImageIcon, X, SwitchCamera, Circle, ZoomIn, Square } from '@lucide/svelte';
	import { debounce } from 'lodash-es';
	import { fly, fade } from 'svelte/transition';

	const dispatch = createEventDispatcher<{
		selectfile: { source: 'camera' | 'gallery'; file: File };
		update: { scale: number; x: number; y: number; borderSize: number };
	}>();

	interface Props {
		width: number;
		height: number;
		fileUrl?: string | null;
		initialScale?: number;
		initialX?: number;
		initialY?: number;
		initialBorderSize?: number;
		isSignature?: boolean;
	}

	let {
		width,
		height,
		fileUrl = null,
		initialScale = 1,
		initialX = 0,
		initialY = 0,
		initialBorderSize = 0,
		isSignature = false
	}: Props = $props();

	let showPopup = $state(false);
	let showCamera = $state(false);
	let galleryInput: HTMLInputElement;
	let nativeCameraInput: HTMLInputElement;

	// Mobile detection - use user agent only, not window width
	// Window width check was causing false positives on desktop with narrow windows
	const isMobile = $derived(
		typeof navigator !== 'undefined' &&
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	);
	const isIOS = $derived(
		typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
	);
	const isAndroid = $derived(
		typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)
	);

	// Camera state
	let videoElement: HTMLVideoElement | undefined = $state(undefined);
	let cameraStream: MediaStream | null = $state(null);
	let facingMode = $state<'user' | 'environment'>('environment');
	let cameraError = $state<string | null>(null);

	let canvas = $state<HTMLCanvasElement | undefined>(undefined);
	let ctx = $state<CanvasRenderingContext2D | null>(null);
	// Local state for transformations
	let imageScale = $state(untrack(() => initialScale));
	let imageX = $state(untrack(() => initialX));
	let imageY = $state(untrack(() => initialY));
	let borderSize = $state(untrack(() => initialBorderSize));

	$effect(() => {
		imageScale = initialScale;
		imageX = initialX;
		imageY = initialY;
		borderSize = initialBorderSize;
	});
	let isDragging = $state(false);

	const MAX_HEIGHT = 150;
	const aspectRatio = $derived(width / height);
	const thumbnailHeight = $derived(Math.min(MAX_HEIGHT, height));
	const thumbnailWidth = $derived(thumbnailHeight * aspectRatio);
	const scale = $derived(thumbnailHeight / height);

	// Safe zone is 15% larger than the crop area
	const SAFE_ZONE_PADDING = 0.15;

	// Dynamic screen dimensions for camera overlay
	let screenWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 375);
	let screenHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 667);
	
	// Padding in pixels for UI elements
	const topPaddingPx = 60;    // Space for instruction text
	const bottomPaddingPx = 140; // Space for camera controls
	const sidePaddingPx = 20;    // Side margins
	
	// Calculate available area in pixels
	const availablePixelWidth = $derived(screenWidth - (sidePaddingPx * 2));
	const availablePixelHeight = $derived(screenHeight - topPaddingPx - bottomPaddingPx);
	
	// Available area aspect ratio
	const availableAspectRatio = $derived(availablePixelWidth / availablePixelHeight);
	
	// Card aspect ratio (from props)
	// aspectRatio = width / height (already defined above)
	
	// Calculate crop dimensions in PIXELS to maintain exact card aspect ratio
	const cropPixelWidth = $derived(
		aspectRatio >= availableAspectRatio
			? availablePixelWidth // Card is wider - constrain by width
			: availablePixelHeight * aspectRatio // Card is taller - calculate width from height
	);
	
	const cropPixelHeight = $derived(
		aspectRatio >= availableAspectRatio
			? availablePixelWidth / aspectRatio // Card is wider - calculate height from width
			: availablePixelHeight // Card is taller - constrain by height
	);
	
	// Convert to percentages of screen for SVG
	const cropW = $derived((cropPixelWidth / screenWidth) * 100);
	const cropH = $derived((cropPixelHeight / screenHeight) * 100);
	const cropX = $derived((100 - cropW) / 2);
	const cropY = $derived((topPaddingPx / screenHeight) * 100 + ((availablePixelHeight - cropPixelHeight) / screenHeight) * 100 / 2);
	
	// Safe zone is slightly larger (also in pixels first, then percentages)
	const safePixelWidth = $derived(cropPixelWidth * (1 + SAFE_ZONE_PADDING));
	const safePixelHeight = $derived(cropPixelHeight * (1 + SAFE_ZONE_PADDING));
	const safeW = $derived((safePixelWidth / screenWidth) * 100);
	const safeH = $derived((safePixelHeight / screenHeight) * 100);
	const safeX = $derived((100 - safeW) / 2);
	const safeY = $derived(cropY - ((safePixelHeight - cropPixelHeight) / screenHeight) * 100 / 2);

	// Update screen dimensions on resize
	$effect(() => {
		if (typeof window === 'undefined') return;
		
		const updateDimensions = () => {
			screenWidth = window.innerWidth;
			screenHeight = window.innerHeight;
		};
		
		window.addEventListener('resize', updateDimensions);
		window.addEventListener('orientationchange', updateDimensions);
		
		return () => {
			window.removeEventListener('resize', updateDimensions);
			window.removeEventListener('orientationchange', updateDimensions);
		};
	});

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d');
			if (ctx) {
				drawPlaceholder();
			}
		}
	});

	onDestroy(() => {
		stopCamera();
	});

	function drawPlaceholder() {
		if (!ctx) return;

		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);
		ctx.strokeStyle = '#999';
		ctx.strokeRect(0, 0, thumbnailWidth, thumbnailHeight);
		ctx.fillStyle = '#999';
		ctx.font = '14px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('Click to upload', thumbnailWidth / 2, thumbnailHeight / 2);
	}

	function drawImage(img: HTMLImageElement) {
		if (!ctx) return;

		const imgAspectRatio = img.width / img.height;
		let drawWidth = width * imageScale;
		let drawHeight = height * imageScale;

		if (imgAspectRatio > aspectRatio) {
			drawHeight = drawWidth / imgAspectRatio;
		} else {
			drawWidth = drawHeight * imgAspectRatio;
		}

		ctx.clearRect(0, 0, thumbnailWidth, thumbnailHeight);
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, 0, thumbnailWidth, thumbnailHeight);
		ctx.clip();

		if (isSignature) {
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);
		}

		ctx.drawImage(
			img,
			imageX * scale + (thumbnailWidth - drawWidth * scale) / 2,
			imageY * scale + (thumbnailHeight - drawHeight * scale) / 2,
			drawWidth * scale,
			drawHeight * scale
		);

		// Draw inner border if borderSize > 0
		if (borderSize > 0) {
			const scaledBorder = borderSize * scale;
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = scaledBorder;
			ctx.strokeRect(
				scaledBorder / 2,
				scaledBorder / 2,
				thumbnailWidth - scaledBorder,
				thumbnailHeight - scaledBorder
			);
		}

		ctx.restore();
	}

	function handleClick() {
		showPopup = true;
	}

	function closePopup() {
		showPopup = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closePopup();
		}
	}

	// State for permission error only (no loading state)
	let permissionError = $state<string | null>(null);

	// Use native camera input for mobile - most reliable approach
	function selectCameraNative() {
		closePopup();
		nativeCameraInput?.click();
	}

	async function selectCamera() {
		permissionError = null;

		// On mobile, prefer native camera input as it's more reliable
		// It triggers the native camera app and handles permissions at OS level
		if (isMobile) {
			try {
				// Check if getUserMedia is available for custom camera view
				if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
					// Fall back to native camera input which is more widely supported
					console.log('[Camera] Falling back to native camera input on mobile');
					selectCameraNative();
					return;
				}
				
				// Try getUserMedia for custom camera view
				await attemptGetUserMedia();
			} catch (err: any) {
				console.warn('[Camera] getUserMedia failed on mobile, using native fallback:', err.message);
				// On mobile, if getUserMedia fails, use native camera as fallback
				// This is more reliable especially on iOS Safari
				selectCameraNative();
			}
			return;
		}

		// Desktop path - use getUserMedia for custom camera view
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				permissionError = 'Camera access is not supported in this browser.';
				return;
			}
			await attemptGetUserMedia();
		} catch (err: any) {
			handleGetUserMediaError(err);
		}
	}

	// Shared getUserMedia logic
	async function attemptGetUserMedia() {
		// Request camera permission FIRST, before changing UI state
		// This prevents the camera view from flashing when permission is denied
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: facingMode,
				width: { ideal: 1920 },
				height: { ideal: 1080 }
			},
			audio: false
		});

		// Only close popup and show camera AFTER permission is granted
		closePopup();
		showCamera = true;
		cameraStream = stream;

		// Wait for DOM to update (video element to be rendered)
		await tick();

		// Try multiple times to bind the stream
		let attempts = 0;
		while (!videoElement && attempts < 20) {
			await new Promise((resolve) => setTimeout(resolve, 50));
			attempts++;
		}

		if (videoElement) {
			videoElement.srcObject = stream;
			try {
				await videoElement.play();
			} catch (playErr) {
				console.warn('Autoplay failed:', playErr);
				// On mobile, autoplay might fail - attempt with user interaction
				if (isMobile) {
					console.log('[Camera] Attempting muted play on mobile');
					videoElement.muted = true;
					try {
						await videoElement.play();
					} catch (e) {
						console.warn('[Camera] Muted play also failed:', e);
					}
				}
			}
		} else {
			cameraError = 'Camera display failed. Please try again.';
		}
	}

	// Handle getUserMedia errors
	function handleGetUserMediaError(err: any) {
		console.error('Camera error:', err);
		
		// Ensure camera view is closed and popup is shown
		stopCamera();
		showCamera = false;
		showPopup = true;

		if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
			if (isIOS) {
				permissionError = 'Camera denied. Go to Settings > Safari > Camera to allow access, or use Gallery instead.';
			} else if (isAndroid) {
				permissionError = 'Camera denied. Tap the lock icon in address bar to enable, or use Gallery instead.';
			} else {
				permissionError = 'Camera denied. Click the camera icon in your address bar to allow.';
			}
		} else if (err.name === 'NotFoundError') {
			permissionError = 'No camera found on this device.';
		} else if (err.name === 'NotReadableError') {
			permissionError = 'Camera is in use by another app.';
		} else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
			// Try with simpler constraints
			attemptSimplifiedCamera();
			return;
		} else if (err.name === 'SecurityError') {
			permissionError = 'Camera access blocked. Please ensure you are using HTTPS.';
		} else if (err.name === 'AbortError') {
			permissionError = 'Camera access was interrupted. Please try again.';
		} else {
			permissionError = 'Could not access camera. Try using Gallery instead.';
		}
	}

	// Try with simplified constraints
	async function attemptSimplifiedCamera() {
		try {
			const fallbackStream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: false
			});
			cameraStream = fallbackStream;
			showPopup = false;
			showCamera = true;
			await tick();
			
			let attempts = 0;
			while (!videoElement && attempts < 20) {
				await new Promise((resolve) => setTimeout(resolve, 50));
				attempts++;
			}
			
			if (videoElement) {
				videoElement.srcObject = fallbackStream;
				await videoElement.play();
			}
		} catch (e) {
			permissionError = 'Camera not supported in this browser. Try using Gallery instead.';
			showCamera = false;
			showPopup = true;
		}
	}

	function selectGallery() {
		closePopup();
		galleryInput?.click();
	}

	// Used for switching camera or retrying when already in camera view
	async function startCamera() {
		cameraError = null;

		try {
			// Stop any existing stream
			stopCamera();

			// Request camera access with current facing mode
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				},
				audio: false
			});

			cameraStream = stream;

			// Wait for video element to be ready
			await tick();

			let attempts = 0;
			while (!videoElement && attempts < 20) {
				await new Promise((resolve) => setTimeout(resolve, 50));
				attempts++;
			}

			if (videoElement) {
				videoElement.srcObject = stream;
				try {
					await videoElement.play();
				} catch (playErr) {
					console.warn('Autoplay failed:', playErr);
				}
			} else {
				cameraError = 'Camera display failed. Please try again.';
			}
		} catch (err: any) {
			console.error('Camera error:', err);

			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				cameraError = 'Camera permission denied. Please check your browser settings.';
			} else if (err.name === 'NotFoundError') {
				cameraError = 'No camera found on this device.';
			} else if (err.name === 'NotReadableError') {
				cameraError = 'Camera is in use by another application.';
			} else if (err.name === 'OverconstrainedError') {
				// Try with basic constraints
				try {
					const fallbackStream = await navigator.mediaDevices.getUserMedia({
						video: true,
						audio: false
					});
					cameraStream = fallbackStream;
					await tick();
					if (videoElement) {
						videoElement.srcObject = fallbackStream;
						await videoElement.play();
					}
					return;
				} catch {
					cameraError = 'Camera not supported.';
				}
			} else {
				cameraError = 'Could not access camera.';
			}
		}
	}

	function stopCamera() {
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
			cameraStream = null;
		}
	}

	function closeCamera() {
		stopCamera();
		showCamera = false;
	}

	async function switchCamera() {
		facingMode = facingMode === 'environment' ? 'user' : 'environment';
		await startCamera();
	}

	function capturePhoto() {
		if (!videoElement || !cameraStream) return;

		const videoWidth = videoElement.videoWidth;
		const videoHeight = videoElement.videoHeight;

		// Calculate the capture area using the same logic as the overlay
		// but scaled to the video's native resolution
		
		// Calculate available area ratio (same proportions as overlay)
		const videoAvailableWidth = videoWidth - (sidePaddingPx * 2 * (videoWidth / screenWidth));
		const videoAvailableHeight = videoHeight - ((topPaddingPx + bottomPaddingPx) * (videoHeight / screenHeight));
		const videoAvailableAR = videoAvailableWidth / videoAvailableHeight;
		
		// Calculate crop dimensions maintaining the card's aspect ratio
		let captureWidth: number;
		let captureHeight: number;
		
		if (aspectRatio >= videoAvailableAR) {
			// Card is wider - constrain by width
			captureWidth = videoAvailableWidth;
			captureHeight = videoAvailableWidth / aspectRatio;
		} else {
			// Card is taller - constrain by height
			captureHeight = videoAvailableHeight;
			captureWidth = videoAvailableHeight * aspectRatio;
		}
		
		// Apply safe zone multiplier to capture the full safe zone area
		const safeWidth = captureWidth * (1 + SAFE_ZONE_PADDING);
		const safeHeight = captureHeight * (1 + SAFE_ZONE_PADDING);

		// Center position in video
		const x = (videoWidth - safeWidth) / 2;
		const y = (videoHeight - safeHeight) / 2;

		// Create canvas for capture
		const captureCanvas = document.createElement('canvas');
		captureCanvas.width = safeWidth;
		captureCanvas.height = safeHeight;
		const captureCtx = captureCanvas.getContext('2d');

		if (!captureCtx) return;

		// Flip horizontally if using front camera
		if (facingMode === 'user') {
			captureCtx.translate(safeWidth, 0);
			captureCtx.scale(-1, 1);
		}

		// Draw the cropped region from the video
		captureCtx.drawImage(videoElement, x, y, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);

		// Convert to blob
		captureCanvas.toBlob(
			(blob) => {
				if (blob) {
					const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
					dispatch('selectfile', { source: 'camera', file });
					closeCamera();
				}
			},
			'image/jpeg',
			0.92
		);
	}

	function handleFileChange(e: Event, source: 'camera' | 'gallery') {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			dispatch('selectfile', { source, file });
		}
		input.value = '';
	}

	const debouncedUpdate = debounce((scale: number, x: number, y: number, border: number) => {
		dispatch('update', { scale, x, y, borderSize: border });
	}, 16);

	// Slider change handlers
	function handleZoomSliderChange(e: Event) {
		const target = e.target as HTMLInputElement;
		imageScale = parseFloat(target.value);
		updateImage();
		debouncedUpdate(imageScale, imageX, imageY, borderSize);
	}

	function handleBorderSliderChange(e: Event) {
		const target = e.target as HTMLInputElement;
		borderSize = parseFloat(target.value);
		updateImage();
		debouncedUpdate(imageScale, imageX, imageY, borderSize);
	}

	function updateImage() {
		if (fileUrl) {
			const img = new Image();
			img.onload = () => drawImage(img);
			img.src = fileUrl;
		}
	}

	function handleStart(event: MouseEvent | TouchEvent, mode: 'move' | 'resize') {
		// Only prevent default for mouse events (touch events are passive by default)
		if (!('touches' in event)) {
			event.preventDefault();
		}
		isDragging = true;

		const startPoint =
			'touches' in event
				? { x: event.touches[0].clientX, y: event.touches[0].clientY }
				: { x: event.clientX, y: event.clientY };

		const startValues = {
			scale: imageScale,
			x: imageX,
			y: imageY
		};

		function handleMove(e: MouseEvent | TouchEvent) {
			if (!isDragging) return;

			const currentPoint =
				'touches' in e
					? { x: e.touches[0].clientX, y: e.touches[0].clientY }
					: { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

			const dx = currentPoint.x - startPoint.x;
			const dy = currentPoint.y - startPoint.y;

			if (mode === 'resize') {
				const delta = Math.max(dx, dy);
				imageScale = Math.max(0.1, startValues.scale + delta / (100 * scale));
			} else {
				imageX = startValues.x + dx / scale;
				imageY = startValues.y + dy / scale;
			}

			requestAnimationFrame(updateImage);
			debouncedUpdate(imageScale, imageX, imageY, borderSize);
		}

		function handleEnd() {
			isDragging = false;
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleEnd);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('touchend', handleEnd);
			window.removeEventListener('touchcancel', handleEnd);
		}

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleEnd);
		window.addEventListener('touchmove', handleMove);
		window.addEventListener('touchend', handleEnd);
		window.addEventListener('touchcancel', handleEnd);
	}

	run(() => {
		if (fileUrl) {
			const img = new Image();
			img.onload = () => drawImage(img);
			img.src = fileUrl;
		}
	});
</script>

<!-- Hidden file input for gallery -->
<input
	bind:this={galleryInput}
	type="file"
	accept="image/*"
	class="hidden"
	onchange={(e) => handleFileChange(e, 'gallery')}
/>

<!-- Native camera input for reliable mobile camera access -->
<!-- Uses capture attribute to directly trigger device camera -->
<input
	bind:this={nativeCameraInput}
	type="file"
	accept="image/*"
	capture="environment"
	class="hidden"
	onchange={(e) => handleFileChange(e, 'camera')}
/>

<div class="flex items-center touch-none">
	<div class="relative" style="width: {thumbnailWidth}px; height: {thumbnailHeight}px;">
		<canvas
			bind:this={canvas}
			width={thumbnailWidth}
			height={thumbnailHeight}
			onclick={handleClick}
			class="cursor-pointer"
		></canvas>
	</div>
	<div class="ml-2 flex flex-col gap-2">
		<div
			class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-move active:bg-gray-300"
			onmousedown={(e) => handleStart(e, 'move')}
			ontouchstart={(e) => handleStart(e, 'move')}
			role="button"
			tabindex="0"
			aria-label="Move image"
		>
			<Move size={16} />
		</div>
		<div
			class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-se-resize active:bg-gray-300"
			onmousedown={(e) => handleStart(e, 'resize')}
			ontouchstart={(e) => handleStart(e, 'resize')}
			role="button"
			tabindex="0"
			aria-label="Resize image"
		>
			<Scaling size={16} />
		</div>
	</div>
</div>

<!-- Sliders for Zoom and Border Size -->
{#if fileUrl}
	<div class="mt-3 space-y-3" style="width: {thumbnailWidth + 40}px;">
		<!-- Zoom Slider -->
		<div class="flex items-center gap-2">
			<ZoomIn size={14} class="text-gray-500 dark:text-gray-400 flex-shrink-0" />
			<input
				type="range"
				min="0.5"
				max="3"
				step="0.05"
				value={imageScale}
				oninput={handleZoomSliderChange}
				class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
				aria-label="Zoom"
			/>
			<span class="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{Math.round(imageScale * 100)}%</span>
		</div>

		<!-- Border Size Slider -->
		<div class="flex items-center gap-2">
			<Square size={14} class="text-gray-500 dark:text-gray-400 flex-shrink-0" />
			<input
				type="range"
				min="0"
				max="20"
				step="1"
				value={borderSize}
				oninput={handleBorderSliderChange}
				class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
				aria-label="Border size"
			/>
			<span class="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{borderSize}px</span>
		</div>
	</div>
{/if}

<!-- Bottom sheet popup -->
{#if showPopup}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && closePopup()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50"></div>

		<!-- Bottom sheet -->
		<div
			class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl p-4 pb-8 safe-bottom"
			transition:fly={{ y: 300, duration: 300 }}
		>
			<!-- Handle bar -->
			<div class="flex justify-center mb-4">
				<div class="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
			</div>

			{#if permissionError}
				<!-- Permission Error State -->
				<div class="text-center py-6">
					<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
						<Camera size={28} class="text-red-500" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						Camera Error
					</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-6 px-4 leading-relaxed">
						{permissionError}
					</p>
					<div class="flex gap-3 justify-center">
						<button
							type="button"
							onclick={() => { permissionError = null; }}
							class="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
						>
							Back
						</button>
						<button
							type="button"
							onclick={selectCamera}
							class="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			{:else}
				<!-- Normal State - Camera/Gallery Options -->
				<!-- Header -->
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
						{isSignature ? 'Add Signature' : 'Add Photo'}
					</h3>
					<button
						type="button"
						onclick={closePopup}
						class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						aria-label="Close"
					>
						<X size={20} class="text-gray-500" />
					</button>
				</div>

				<!-- Options -->
				<div class="grid grid-cols-2 gap-3">
					<button
						type="button"
						onclick={selectCamera}
						class="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
					>
						<div
							class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
						>
							<Camera size={24} class="text-blue-600 dark:text-blue-400" />
						</div>
						<span class="text-sm font-medium text-gray-700 dark:text-gray-200">Camera</span>
					</button>

					<button
						type="button"
						onclick={selectGallery}
						class="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
					>
						<div
							class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center"
						>
							<ImageIcon size={24} class="text-purple-600 dark:text-purple-400" />
						</div>
						<span class="text-sm font-medium text-gray-700 dark:text-gray-200">Gallery</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Camera View with Overlay -->
{#if showCamera}
	<div
		class="fixed inset-0 z-[60] bg-black"
		transition:fade={{ duration: 200 }}
	>
		<!-- Video Element - full screen -->
		<!-- playsinline prevents iOS Safari from going fullscreen when video starts -->
		<video
			bind:this={videoElement}
			autoplay
			playsinline
			muted
			class="absolute inset-0 w-full h-full object-cover"
			class:scale-x-[-1]={facingMode === 'user'}
		></video>

		<!-- Overlay - use pixel values for accurate aspect ratio -->
		<div class="absolute inset-0 pointer-events-none">
			<svg 
				class="w-full h-full" 
				viewBox={`0 0 ${screenWidth} ${screenHeight}`}
				preserveAspectRatio="none"
			>
				<defs>
					<!-- Mask for the dark overlay - reveals the safe zone -->
					<mask id="overlay-mask">
						<rect width="100%" height="100%" fill="white" />
						<!-- Safe zone cutout in PIXELS -->
						<rect
							x={(screenWidth - safePixelWidth) / 2}
							y={topPaddingPx + (availablePixelHeight - safePixelHeight) / 2}
							width={safePixelWidth}
							height={safePixelHeight}
							fill="black"
							rx="8"
						/>
					</mask>
				</defs>

				<!-- Dark overlay -->
				<rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#overlay-mask)" />

				<!-- Safe zone border (outer dashed) in PIXELS -->
				<rect
					x={(screenWidth - safePixelWidth) / 2}
					y={topPaddingPx + (availablePixelHeight - safePixelHeight) / 2}
					width={safePixelWidth}
					height={safePixelHeight}
					fill="none"
					stroke="rgba(255,255,255,0.5)"
					stroke-width="2"
					stroke-dasharray="8 4"
					rx="8"
				/>

				<!-- Crop area border (inner solid) in PIXELS -->
				<rect
					x={(screenWidth - cropPixelWidth) / 2}
					y={topPaddingPx + (availablePixelHeight - cropPixelHeight) / 2}
					width={cropPixelWidth}
					height={cropPixelHeight}
					fill="none"
					stroke="white"
					stroke-width="3"
					rx="4"
				/>

				<!-- Crosshair -->
				<g stroke="rgba(255,255,255,0.8)" stroke-width="1">
					<!-- Horizontal line -->
					<line x1={screenWidth/2 - 20} y1={screenHeight/2} x2={screenWidth/2 - 8} y2={screenHeight/2} />
					<line x1={screenWidth/2 + 8} y1={screenHeight/2} x2={screenWidth/2 + 20} y2={screenHeight/2} />
					<!-- Vertical line -->
					<line x1={screenWidth/2} y1={screenHeight/2 - 20} x2={screenWidth/2} y2={screenHeight/2 - 8} />
					<line x1={screenWidth/2} y1={screenHeight/2 + 8} x2={screenWidth/2} y2={screenHeight/2 + 20} />
					<!-- Center dot -->
					<circle cx={screenWidth/2} cy={screenHeight/2} r="3" fill="rgba(255,255,255,0.8)" stroke="none" />
				</g>
			</svg>

			<!-- Labels -->
			<div class="absolute top-4 left-0 right-0 text-center">
				<span class="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
					{isSignature ? 'Position signature in frame' : 'Position face in frame'}
				</span>
			</div>

			<div class="absolute bottom-36 left-0 right-0 text-center">
				<span class="text-white/70 text-xs">
					Dashed line = safe zone for adjustments
				</span>
			</div>
		</div>

		<!-- Error Message -->
		{#if cameraError}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
				<div class="text-center p-6 max-w-sm">
					<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
						<Camera size={32} class="text-red-400" />
					</div>
					<p class="text-white mb-4 text-sm leading-relaxed">{cameraError}</p>
					<div class="flex gap-3 justify-center">
						<button
							onclick={closeCamera}
							class="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onclick={startCamera}
							class="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
						>
							Retry
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Camera Controls - fixed at bottom -->
		<div class="absolute bottom-0 left-0 right-0 bg-black/80 px-6 py-6 safe-bottom">
			<div class="flex items-center justify-between max-w-md mx-auto">
				<!-- Close Button -->
				<button
					type="button"
					onclick={closeCamera}
					class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
					aria-label="Close camera"
				>
					<X size={24} class="text-white" />
				</button>

				<!-- Capture Button -->
				<button
					type="button"
					onclick={capturePhoto}
					disabled={!cameraStream}
					class="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
					aria-label="Take photo"
				>
					<div class="w-16 h-16 rounded-full border-4 border-black/20"></div>
				</button>

				<!-- Switch Camera Button -->
				<button
					type="button"
					onclick={switchCamera}
					class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
					aria-label="Switch camera"
				>
					<SwitchCamera size={24} class="text-white" />
				</button>
			</div>
		</div>
	</div>
{/if}
