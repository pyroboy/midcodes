<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { debounce } from 'lodash-es';
    import type { TemplateElement } from '../stores/templateStore';
    
    export let elements: TemplateElement[];
    export let backgroundUrl: string;
    export let formData: { [key: string]: string };
    export let fileUploads: { [key: string]: File | null };
    export let imagePositions: { [key: string]: { x: number, y: number, width: number, height: number, scale: number } };
    export let fullResolution = false;
    



    const dispatch = createEventDispatcher();
    
    let canvas: HTMLCanvasElement;
    let hiddenCanvas: HTMLCanvasElement;
    let isRendering = false;
    let renderRequested = false;
    const DEBOUNCE_DELAY = 16; // Approximately 60 fps
    const PREVIEW_SCALE = 0.5;
    const FULL_WIDTH = 1013;
    const FULL_HEIGHT = 638;
    const elementScale = 2;
    
    // Create offscreen canvas
    const offscreenCanvas = new OffscreenCanvas(FULL_WIDTH, FULL_HEIGHT);
    const offscreenCtx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

    
    // Cache for loaded images
    const imageCache = new Map<string, HTMLImageElement>();
    
    async function loadAndCacheImage(url: string): Promise<HTMLImageElement> {
        if (imageCache.has(url)) {
            return imageCache.get(url)!;
        }
        const img = await loadImage(url);
        imageCache.set(url, img);
        return img;
    }


    
    
    function loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
    
    const debouncedRender = debounce(() => {
        if (!renderRequested) {
            renderRequested = true;
            requestAnimationFrame(renderIdCard);
        }
    }, DEBOUNCE_DELAY);
    
    async function renderIdCard() {

        console.log("rat")
        if (!canvas || isRendering) {
            return;
        }
    
        isRendering = true;
        renderRequested = false;
    
        const scale = fullResolution ? 1 : PREVIEW_SCALE;
        const width = FULL_WIDTH * scale;
        const height = FULL_HEIGHT * scale;
    
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
    
        // Render background
        const backgroundImage = await loadAndCacheImage(backgroundUrl);
        offscreenCtx.drawImage(backgroundImage, 0, 0, width, height);
    
        offscreenCtx.save();
        offscreenCtx.scale(scale * elementScale, scale * elementScale);
    
        // Render static elements first
        elements.filter(el => el.type === 'text').forEach(element => {
            renderTextElement(offscreenCtx, element, scale * elementScale);
        });
    
        // Render dynamic elements (photos and signatures)
        for (const element of elements.filter(el => el.type === 'photo' || el.type === 'signature')) {
            await renderImageElement(offscreenCtx, element, scale * elementScale);
        }
    
        offscreenCtx.restore();
    
        // Copy offscreen canvas to visible canvas
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(offscreenCanvas, 0, 0);
        }
    
        isRendering = false;
    
        // Request next frame if needed
        if (renderRequested) {
            requestAnimationFrame(renderIdCard);
        }
    
        dispatch('rendered');
    }
    
    function renderTextElement(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, element: TemplateElement, scale: number) {
        if (element.type !== 'text') return;
    
        ctx.font = `${(element.size || 12) * scale}px ${element.font || 'Arial'}`;
        ctx.fillStyle = element.color || 'black';
        ctx.textAlign = element.alignment as CanvasTextAlign;
    
        const text = formData[element.variableName] || '';
        const x = element.alignment === 'center' ? ((element.width || 0) * scale / 2) :
                  element.alignment === 'right' ? (element.x || 0) * scale + (element.width || 0) * scale :
                  (element.x || 0) * scale;
        const y = (element.y || 0) * scale + (ctx.measureText(text).actualBoundingBoxAscent || 0);
    
        ctx.fillText(text, x, y);
    }
    
    async function renderImageElement(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, element: TemplateElement, scale: number) {
 
        if (element.type !== 'photo' && element.type !== 'signature') return;

        const file = fileUploads[element.variableName];
        const pos = imagePositions[element.variableName];

        ctx.save();
        ctx.beginPath();
        ctx.rect((element.x || 0) * scale, (element.y || 0) * scale, (element.width || 100) * scale, (element.height || 100) * scale);
        ctx.clip();

        if (file) {
            try {
                const image = await loadAndCacheImage(URL.createObjectURL(file));
                const imgAspectRatio = image.width / image.height;
                const elementAspectRatio = (element.width || 100) / (element.height || 100);
                
                let drawWidth = (element.width || 100) * pos.scale * scale;
                let drawHeight = (element.height || 100) * pos.scale * scale;

                if (imgAspectRatio > elementAspectRatio) {
                    drawHeight = drawWidth / imgAspectRatio;
                } else {
                    drawWidth = drawHeight * imgAspectRatio;
                }

                const x = ((element.x || 0) + ((element.width || 100) - drawWidth) / 2 + pos.x) * scale;
                const y = ((element.y || 0) + ((element.height || 100) - drawHeight) / 2 + pos.y) * scale;

                // Apply multiply blending mode for signatures
                if (element.type === 'signature') {
                    ctx.globalCompositeOperation = 'multiply';
                }

                ctx.drawImage(image, x, y, drawWidth, drawHeight);

                // Reset the blending mode
                ctx.globalCompositeOperation = 'source-over';
            } catch (error) {
                console.error(`Error loading image for ${element.variableName}:`, error);
            }
        } else {
            // Render placeholder
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect((element.x || 0) * scale, (element.y || 0) * scale, (element.width || 100) * scale, (element.height || 100) * scale);
            ctx.strokeStyle = '#999';
            ctx.strokeRect((element.x || 0) * scale, (element.y || 0) * scale, (element.width || 100) * scale, (element.height || 100) * scale);
            ctx.fillStyle = '#999';
            ctx.font = `${12 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                element.type,
                ((element.x || 0) + (element.width || 100) / 2) * scale,
                ((element.y || 0) + (element.height || 100) / 2) * scale
            );
        }

        ctx.restore();
    }

    export function renderFullResolution() {
        const ctx = hiddenCanvas.getContext('2d');
        if (!ctx) return;

        hiddenCanvas.width = FULL_WIDTH;
        hiddenCanvas.height = FULL_HEIGHT;

        // Render background
        const backgroundImage = new Image();
        backgroundImage.onload = async () => {
            ctx.drawImage(backgroundImage, 0, 0, FULL_WIDTH, FULL_HEIGHT);

            // Render elements
            for (const element of elements) {
                if (element.type === 'text') {
                    renderTextElement(ctx, element, 1);  // Pass 1 as scale for full resolution
                } else if (element.type === 'photo' || element.type === 'signature') {
                    await renderImageElement(ctx, element, 1);  // Pass 1 as scale for full resolution
                }
            }

            dispatch('fullResolutionRendered');
        };
        backgroundImage.src = backgroundUrl;
    }

    onMount(() => {
        renderIdCard();
    });
    
    $: if (elements || formData || fileUploads || imagePositions || fullResolution) {
        debouncedRender();
    }
</script>

<canvas bind:this={canvas}></canvas>
<canvas bind:this={hiddenCanvas}></canvas>
<!-- <canvas bind:this={hiddenCanvas} style="display: none;"></canvas> -->

<style>
    canvas {
        border: 1px solid #ccc;
    }
</style>
