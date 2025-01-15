<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { Move, Scaling } from "lucide-svelte";
    import { debounce } from 'lodash-es';

    export let width: number;
    export let height: number;
    export let fileUrl: string | null = null;
    export let initialScale = 1;
    export let initialX = 0;
    export let initialY = 0;
    export let isSignature = false;

    const dispatch = createEventDispatcher();
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let imageScale = initialScale;
    let imageX = initialX;
    let imageY = initialY;
    let isDragging = false;

    const MAX_HEIGHT = 100;
    const aspectRatio = width / height;
    const thumbnailHeight = Math.min(MAX_HEIGHT, height);
    const thumbnailWidth = thumbnailHeight * aspectRatio;
    const scale = thumbnailHeight / height;

    onMount(() => {
        ctx = canvas.getContext('2d')!;
        drawPlaceholder();
    });

    $: if (fileUrl) {
        const img = new Image();
        img.onload = () => drawImage(img);
        img.src = fileUrl;
    }

    function drawPlaceholder() {
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
            (imageX * scale) + (thumbnailWidth - drawWidth * scale) / 2,
            (imageY * scale) + (thumbnailHeight - drawHeight * scale) / 2,
            drawWidth * scale,
            drawHeight * scale
        );
        ctx.restore();
    }

    function handleClick() {
        dispatch('selectFile');
    }

    const debouncedDispatch = debounce((scale: number, x: number, y: number) => {
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
        
        const startPoint = 'touches' in event ? 
            { x: event.touches[0].clientX, y: event.touches[0].clientY } :
            { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };

        const startValues = {
            scale: imageScale,
            x: imageX,
            y: imageY
        };

        function handleMove(e: MouseEvent | TouchEvent) {
            if (!isDragging) return;

            const currentPoint = 'touches' in e ?
                { x: e.touches[0].clientX, y: e.touches[0].clientY } :
                { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

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
            debouncedDispatch(imageScale, imageX, imageY);
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
</script>

<div class="flex items-center touch-none">
    <div class="relative" style="width: {thumbnailWidth}px; height: {thumbnailHeight}px;">
        <canvas
            bind:this={canvas}
            width={thumbnailWidth}
            height={thumbnailHeight}
            on:click={handleClick}
            class="cursor-pointer"
        ></canvas>
    </div>
    <div class="ml-2 flex flex-col gap-2">
        <div 
            class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-move active:bg-gray-300"
            on:mousedown={(e) => handleStart(e, 'move')}
            on:touchstart={(e) => handleStart(e, 'move')}
            role="button"
            tabindex="0"
            aria-label="Move image"
        >
            <Move size={16} />
        </div>
        <div 
            class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-se-resize active:bg-gray-300"
            on:mousedown={(e) => handleStart(e, 'resize')}
            on:touchstart={(e) => handleStart(e, 'resize')}
            role="button"
            tabindex="0"
            aria-label="Resize image"
        >
            <Scaling size={16} />
        </div>
    </div>
</div>