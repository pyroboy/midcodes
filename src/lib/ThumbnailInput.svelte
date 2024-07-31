<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { Move, Scaling } from "lucide-svelte";
    import { debounce } from 'lodash-es';

    // export let variableName: string;
    export let width: number;
    export let height: number;
    export let fileUrl: string | null = null;
    export let initialScale = 1;
    export let initialX = 0;
    export let initialY = 0;
    export let isSignature = false;  // New prop to indicate if it's a signature

    
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

            // Add white background for signatures
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

    function startResize(event: MouseEvent) {
        event.preventDefault();
        isDragging = true;
        const startX = event.clientX;
        const startY = event.clientY;
        const startScale = imageScale;

        function onMouseMove(e: MouseEvent) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const newScale = Math.max(0.1, startScale + Math.max(dx, dy) / (100 * scale));
            imageScale = newScale;
            
            requestAnimationFrame(() => {
                if (fileUrl) {
                    const img = new Image();
                    img.onload = () => drawImage(img);
                    img.src = fileUrl;
                }
            });
            
            debouncedDispatch(newScale, imageX, imageY);
        }

        function onMouseUp() {
            isDragging = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function startMove(event: MouseEvent) {
        event.preventDefault();
        isDragging = true;
        const startX = event.clientX;
        const startY = event.clientY;
        const startImageX = imageX;
        const startImageY = imageY;

        function onMouseMove(e: MouseEvent) {
            if (!isDragging) return;
            const dx = (e.clientX - startX) / scale;
            const dy = (e.clientY - startY) / scale;
            imageX = startImageX + dx;
            imageY = startImageY + dy;
            
            requestAnimationFrame(() => {
                if (fileUrl) {
                    const img = new Image();
                    img.onload = () => drawImage(img);
                    img.src = fileUrl;
                }
            });
            
            debouncedDispatch(imageScale, imageX, imageY);
        }

        function onMouseUp() {
            isDragging = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
</script>

<div class="flex items-center">
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
            class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-move"
            on:mousedown={startMove}
            role="button"
            tabindex="0"
            aria-label="Move image"
        >
            <Move size={16} />
        </div>
        <div 
            class="w-6 h-6 bg-gray-200 flex items-center justify-center cursor-se-resize"
            on:mousedown={startResize}
            role="button"
            tabindex="0"
            aria-label="Resize image"
        >
            <Scaling size={16} />
        </div>
    </div>
</div>