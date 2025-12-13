<script lang="ts">
	import { run } from 'svelte/legacy';
	import { createEventDispatcher, onMount, untrack } from 'svelte';
	import { Move, Scaling, Camera, Image, X } from '@lucide/svelte';
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
	let cameraInput: HTMLInputElement;
	let galleryInput: HTMLInputElement;

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

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d');
			if (ctx) {
				drawPlaceholder();
			}
		}
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

	function selectCamera() {
		closePopup();
		cameraInput?.click();
	}

	function selectGallery() {
		closePopup();
		galleryInput?.click();
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

<!-- Hidden file inputs -->
<input
	bind:this={cameraInput}
	type="file"
	accept="image/*"
	capture="environment"
	class="hidden"
	onchange={(e) => handleFileChange(e, 'camera')}
/>
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
					<div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
						<Camera size={24} class="text-blue-600 dark:text-blue-400" />
					</div>
					<span class="text-sm font-medium text-gray-700 dark:text-gray-200">Camera</span>
				</button>

				<button
					onclick={selectGallery}
					class="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
				>
					<div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
						<Image size={24} class="text-purple-600 dark:text-purple-400" />
					</div>
					<span class="text-sm font-medium text-gray-700 dark:text-gray-200">Gallery</span>
				</button>
			</div>
		</div>
	</div>
{/if}
