<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate } from 'svelte';
    import { browser } from '$app/environment';
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
    let offscreenCanvas: OffscreenCanvas;
    let canvasInitialized = false;
    let isRendering = false;
    let renderRequested = false;
    
    const DEBOUNCE_DELAY = 16; // Approximately 60 fps
    const PREVIEW_SCALE = 0.5;
    const FULL_WIDTH = 1013;
    const FULL_HEIGHT = 638;
    const elementScale = 2;
    
    // Cache for loaded images
    const imageCache = new Map<string, HTMLImageElement>();
    
    onMount(() => {
        if (browser) {
            console.log('IdCanvas onMount called');
            initializeCanvases();
        }
    });
    
    afterUpdate(() => {
        if (browser && !canvasInitialized) {
            console.log('IdCanvas afterUpdate called, canvases not yet initialized');
            initializeCanvases();
        }
    });
    
    function initializeCanvases() {
        console.log('Initializing canvases');
        if (canvas) {
            offscreenCanvas = new OffscreenCanvas(FULL_WIDTH, FULL_HEIGHT);
            canvasInitialized = true;
            console.log('Canvases initialized');
            renderIdCard();
            dispatch('mounted', { canvas, offscreenCanvas });
        } else {
            console.log('Canvas not yet available');
        }
    }
    
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
        console.log("Rendering ID card");
        if (!canvas || isRendering) {
            return;
        }
    
        isRendering = true;
        renderRequested = false;
    
        const scale = fullResolution ? 1 : PREVIEW_SCALE;
        const width = FULL_WIDTH * scale;
        const height = FULL_HEIGHT * scale;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context from canvas');
            isRendering = false;
            return;
        }
    
        canvas.width = width;
        canvas.height = height;
    
        // Render background
        const backgroundImage = await loadAndCacheImage(backgroundUrl);
        ctx.drawImage(backgroundImage, 0, 0, width, height);
    
        ctx.save();
        ctx.scale(scale * elementScale, scale * elementScale);
    
        // Render static elements first
        elements.filter(el => el.type === 'text').forEach(element => {
            renderTextElement(ctx, element, scale * elementScale);
        });
    
        // Render dynamic elements (photos and signatures)
        for (const element of elements.filter(el => el.type === 'photo' || el.type === 'signature')) {
            await renderImageElement(ctx, element, scale * elementScale);
        }
    
        ctx.restore();
    
        isRendering = false;
    
        // Request next frame if needed
        if (renderRequested) {
            requestAnimationFrame(renderIdCard);
        }
    
        dispatch('rendered');
    }
    
    function renderTextElement(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, element: TemplateElement, scale: number) {


    ctx.font = `${(element.size || 12) * scale}px ${element.font || 'Arial'}`;
    ctx.fillStyle = element.color || 'black';
    ctx.textAlign = element.alignment as CanvasTextAlign;

    const text = formData[element.variableName] || '';

    if (element.type !== 'text') return;
    console.log(`Rendering text for ${element.variableName}: "${text}"`);

    
    const x = element.alignment === 'center' ? ((element.width || 0) / 2) :
              element.alignment === 'right' ? (element.x || 0) + (element.width || 0) :
              (element.x || 0);
    const y = (element.y || 0) + (ctx.measureText(text).actualBoundingBoxAscent || 0);

    ctx.fillText(text, x * scale, y * scale);
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
    
    export async function renderFullResolution(): Promise<Blob | null> {
    console.log('renderFullResolution called');
    if (!offscreenCanvas) {
        console.error('Offscreen canvas not initialized in renderFullResolution');
        return null;
    }

    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context from offscreen canvas');
        return null;
    }

    // Clear the canvas
    ctx.clearRect(0, 0, FULL_WIDTH, FULL_HEIGHT);

    // Render background
    const backgroundImage = await loadImage(backgroundUrl);
    ctx.drawImage(backgroundImage, 0, 0, FULL_WIDTH, FULL_HEIGHT);

    // Render elements
    for (const element of elements) {
        if (element.type === 'text') {
            renderTextElement(ctx, element, 1 * elementScale);  // Use scale 1 for full resolution
        } else if (element.type === 'photo' || element.type === 'signature') {
            await renderImageElement(ctx, element, 1 * elementScale);;  // Use scale 1 for full resolution
        }
    }

    console.log('Full resolution rendering complete');
    
    // Convert OffscreenCanvas to Blob
    return await offscreenCanvas.convertToBlob({ type: 'image/png' });
}

    
    $: if (elements || formData || fileUploads || imagePositions || fullResolution) {
        debouncedRender();
    }
    </script>
    
    <canvas bind:this={canvas}></canvas>
    
    <style>
        canvas {
            border: 1px solid #ccc;
        }
    </style>