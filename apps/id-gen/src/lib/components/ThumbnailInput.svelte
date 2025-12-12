<script lang="ts">
	import { run } from 'svelte/legacy';
	import { onMount } from 'svelte';
	import { Move, Scaling } from '@lucide/svelte';
	import { debounce } from 'lodash-es';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		selectfile: void;
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

	let canvas = $state<HTMLCanvasElement | undefined>(undefined);
	let ctx = $state<CanvasRenderingContext2D | null>(null);
	let imageScale = $state(initialScale);
	let imageX = $state(initialX);
	let imageY = $state(initialY);
	let isDragging = $state(false);

	const MAX_HEIGHT = 150;
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
		dispatch('selectfile');
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
