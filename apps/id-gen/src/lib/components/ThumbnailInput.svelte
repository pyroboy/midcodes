<script lang="ts">
	import { run } from 'svelte/legacy';
	import { createEventDispatcher, onMount, onDestroy, untrack, tick } from 'svelte';
	import { Move, Scaling, Camera, Image, X, SwitchCamera, Circle } from '@lucide/svelte';
	import { debounce } from 'lodash-es';
	import { fly, fade } from 'svelte/transition';

	const dispatch = createEventDispatcher<{
		selectfile: { source: 'camera' | 'gallery'; file: File };
		update: { scale: number; x: number; y: number };
	}>();

	interface Props {
		width: number;
		height: number;
		fileUrl?: string | null;
		initialScale?: number;
		initialX?: number;
		initialY?: number;
		isSignature?: boolean;
	}

	let {
		width,
		height,
		fileUrl = null,
		initialScale = 1,
		initialX = 0,
		initialY = 0,
		isSignature = false
	}: Props = $props();

	let showPopup = $state(false);
	let showCamera = $state(false);
	let galleryInput: HTMLInputElement;

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

	$effect(() => {
		imageScale = initialScale;
		imageX = initialX;
		imageY = initialY;
	});
	let isDragging = $state(false);

	const MAX_HEIGHT = 150;
	const aspectRatio = $derived(width / height);
	const thumbnailHeight = $derived(Math.min(MAX_HEIGHT, height));
	const thumbnailWidth = $derived(thumbnailHeight * aspectRatio);
	const scale = $derived(thumbnailHeight / height);

	// Safe zone is 20% larger than the crop area
	const SAFE_ZONE_PADDING = 0.15;

	// Overlay calculations for camera view
	const cropX = 10;
	const cropW = 80;
	const cropY = $derived(50 - 40 / aspectRatio);
	const cropH = $derived(80 / aspectRatio);
	const safeX = $derived(50 - 40 * (1 + SAFE_ZONE_PADDING));
	const safeY = $derived(50 - (40 * (1 + SAFE_ZONE_PADDING)) / aspectRatio);
	const safeW = $derived(80 * (1 + SAFE_ZONE_PADDING));
	const safeH = $derived((80 * (1 + SAFE_ZONE_PADDING)) / aspectRatio);

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

	async function selectCamera() {
		closePopup();
		showCamera = true;
		await startCamera();
	}

	function selectGallery() {
		closePopup();
		galleryInput?.click();
	}

	async function startCamera() {
		cameraError = null;
		try {
			// Stop any existing stream
			stopCamera();

			// Wait for DOM to update (video element to be rendered)
			await tick();

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				},
				audio: false
			});

			cameraStream = stream;

			// Wait another tick to ensure video element is bound
			await tick();

			// Try multiple times to bind the stream
			let attempts = 0;
			while (!videoElement && attempts < 10) {
				await new Promise((resolve) => setTimeout(resolve, 50));
				attempts++;
			}

			if (videoElement) {
				videoElement.srcObject = stream;
				try {
					await videoElement.play();
				} catch (playErr) {
					console.warn('Autoplay failed, user interaction may be required:', playErr);
				}
			} else {
				console.error('Video element not found after waiting');
				cameraError = 'Camera display failed. Please try again.';
			}
		} catch (err: any) {
			console.error('Camera error:', err);
			if (err.name === 'NotAllowedError') {
				cameraError = 'Camera permission denied. Please allow camera access.';
			} else if (err.name === 'NotFoundError') {
				cameraError = 'No camera found on this device.';
			} else {
				cameraError = 'Could not access camera. Please check permissions.';
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

		// Calculate the crop area with safe zone
		const safeZoneMultiplier = 1 + SAFE_ZONE_PADDING * 2;

		// Calculate the frame dimensions that fit within the video
		let frameWidth: number;
		let frameHeight: number;

		if (aspectRatio > videoWidth / videoHeight) {
			// Width-constrained
			frameWidth = videoWidth * 0.8; // 80% of video width
			frameHeight = frameWidth / aspectRatio;
		} else {
			// Height-constrained
			frameHeight = videoHeight * 0.8; // 80% of video height
			frameWidth = frameHeight * aspectRatio;
		}

		// Safe zone dimensions
		const safeWidth = frameWidth * safeZoneMultiplier;
		const safeHeight = frameHeight * safeZoneMultiplier;

		// Center position
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

		// Draw the cropped region
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

	const debouncedUpdate = debounce((scale: number, x: number, y: number) => {
		dispatch('update', { scale, x, y });
	}, 16);

	function updateImage() {
		if (fileUrl) {
			const img = new Image();
			img.onload = () => drawImage(img);
			img.src = fileUrl;
		}
	}

	function handleStart(event: MouseEvent | TouchEvent, mode: 'move' | 'resize') {
		event.preventDefault();
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
			debouncedUpdate(imageScale, imageX, imageY);
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

			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
					{isSignature ? 'Add Signature' : 'Add Photo'}
				</h3>
				<button
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
					onclick={selectGallery}
					class="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
				>
					<div
						class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center"
					>
						<Image size={24} class="text-purple-600 dark:text-purple-400" />
					</div>
					<span class="text-sm font-medium text-gray-700 dark:text-gray-200">Gallery</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Camera View with Overlay -->
{#if showCamera}
	<div
		class="fixed inset-0 z-[60] bg-black flex flex-col"
		transition:fade={{ duration: 200 }}
	>
		<!-- Camera Preview -->
		<div class="relative flex-1 overflow-hidden">
			<!-- Video Element -->
			<video
				bind:this={videoElement}
				autoplay
				playsinline
				muted
				class="absolute inset-0 w-full h-full object-cover"
				class:scale-x-[-1]={facingMode === 'user'}
			></video>

			<!-- Overlay -->
			<div class="absolute inset-0 pointer-events-none">
				<!-- Dark overlay outside safe zone -->
				<svg class="w-full h-full" preserveAspectRatio="xMidYMid slice">
					<defs>
						<!-- Mask for the dark overlay - reveals the safe zone -->
						<mask id="overlay-mask">
							<rect width="100%" height="100%" fill="white" />
							<!-- Safe zone cutout (slightly larger than crop area) -->
							<rect
								x={`${safeX}%`}
								y={`${safeY}%`}
								width={`${safeW}%`}
								height={`${safeH}%`}
								fill="black"
								rx="4"
							/>
						</mask>
					</defs>

					<!-- Dark overlay -->
					<rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#overlay-mask)" />

					<!-- Safe zone border (outer dashed) -->
					<rect
						x={`${safeX}%`}
						y={`${safeY}%`}
						width={`${safeW}%`}
						height={`${safeH}%`}
						fill="none"
						stroke="rgba(255,255,255,0.5)"
						stroke-width="2"
						stroke-dasharray="8 4"
						rx="4"
					/>

					<!-- Crop area border (inner solid) -->
					<rect
						x={`${cropX}%`}
						y={`${cropY}%`}
						width={`${cropW}%`}
						height={`${cropH}%`}
						fill="none"
						stroke="white"
						stroke-width="3"
						rx="2"
					/>

					<!-- Top-left corner -->
					<path
						d={`M ${cropX}% ${cropY + 5}% L ${cropX}% ${cropY}% L ${cropX + 5}% ${cropY}%`}
						fill="none"
						stroke="white"
						stroke-width="4"
						stroke-linecap="round"
					/>
					<!-- Top-right corner -->
					<path
						d={`M ${cropX + cropW - 5}% ${cropY}% L ${cropX + cropW}% ${cropY}% L ${cropX + cropW}% ${cropY + 5}%`}
						fill="none"
						stroke="white"
						stroke-width="4"
						stroke-linecap="round"
					/>
					<!-- Bottom-left corner -->
					<path
						d={`M ${cropX}% ${cropY + cropH - 5}% L ${cropX}% ${cropY + cropH}% L ${cropX + 5}% ${cropY + cropH}%`}
						fill="none"
						stroke="white"
						stroke-width="4"
						stroke-linecap="round"
					/>
					<!-- Bottom-right corner -->
					<path
						d={`M ${cropX + cropW - 5}% ${cropY + cropH}% L ${cropX + cropW}% ${cropY + cropH}% L ${cropX + cropW}% ${cropY + cropH - 5}%`}
						fill="none"
						stroke="white"
						stroke-width="4"
						stroke-linecap="round"
					/>

					<!-- Crosshair -->
					<g stroke="rgba(255,255,255,0.8)" stroke-width="1">
						<!-- Horizontal line -->
						<line x1="45%" y1="50%" x2="48%" y2="50%" />
						<line x1="52%" y1="50%" x2="55%" y2="50%" />
						<!-- Vertical line -->
						<line x1="50%" y1="45%" x2="50%" y2="48%" />
						<line x1="50%" y1="52%" x2="50%" y2="55%" />
						<!-- Center dot -->
						<circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.8)" stroke="none" />
					</g>
				</svg>

				<!-- Labels -->
				<div class="absolute top-4 left-0 right-0 text-center">
					<span class="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
						{isSignature ? 'Position signature in frame' : 'Position face in frame'}
					</span>
				</div>

				<div class="absolute bottom-32 left-0 right-0 text-center">
					<span class="text-white/70 text-xs">
						Dashed line = safe zone for adjustments
					</span>
				</div>
			</div>

			<!-- Error Message -->
			{#if cameraError}
				<div class="absolute inset-0 flex items-center justify-center bg-black/80">
					<div class="text-center p-6">
						<p class="text-white mb-4">{cameraError}</p>
						<button
							onclick={startCamera}
							class="px-4 py-2 bg-white text-black rounded-lg font-medium"
						>
							Retry
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Camera Controls -->
		<div class="bg-black px-6 py-8 safe-bottom">
			<div class="flex items-center justify-between max-w-md mx-auto">
				<!-- Close Button -->
				<button
					onclick={closeCamera}
					class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
					aria-label="Close camera"
				>
					<X size={24} class="text-white" />
				</button>

				<!-- Capture Button -->
				<button
					onclick={capturePhoto}
					disabled={!cameraStream}
					class="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
					aria-label="Take photo"
				>
					<div class="w-16 h-16 rounded-full border-4 border-black/20"></div>
				</button>

				<!-- Switch Camera Button -->
				<button
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
