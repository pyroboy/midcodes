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
    export let isDragging = false;
    
    const dispatch = createEventDispatcher();
    
    let displayCanvas: HTMLCanvasElement;
    let bufferCanvas: HTMLCanvasElement;
    let offscreenCanvas: OffscreenCanvas;
    let displayCtx: CanvasRenderingContext2D;
    let bufferCtx: CanvasRenderingContext2D;
    let canvasInitialized = false;
    let isRendering = false;
    let renderRequested = false;
    
    const DEBOUNCE_DELAY = 20; // Approximately 60 fps
    const PREVIEW_SCALE = 0.5;
    const ELEMENT_SCALE = 2;
    const FULL_WIDTH = 1013;
    const FULL_HEIGHT = 638;
    const LOW_RES_SCALE = 0.4; // Scale for low-resolution images during drag
    
    // Cache for loaded images
    const imageCache = new Map<string, HTMLImageElement>();
    const lowResImageCache = new Map<string, HTMLImageElement>();
    
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
        if (!browser) return;
        
        console.log('Initializing canvases');
        if (displayCanvas) {
            displayCtx = displayCanvas.getContext('2d')!;
            bufferCanvas = document.createElement('canvas');
            bufferCtx = bufferCanvas.getContext('2d')!;
            offscreenCanvas = new OffscreenCanvas(FULL_WIDTH, FULL_HEIGHT);
            canvasInitialized = true;
            console.log('Canvases initialized');
            renderIdCard();
            dispatch('mounted', { displayCanvas, bufferCanvas, offscreenCanvas });
        } else {
            console.log('Display canvas not yet available');
        }
    }
    
    async function loadAndCacheImage(url: string, lowRes: boolean = false): Promise<HTMLImageElement> {
        if (!browser || !url) {
            console.error('Cannot load image: browser not available or URL is empty');
            return new Image();
        }

        const cache = lowRes ? lowResImageCache : imageCache;
        if (cache.has(url)) {
            return cache.get(url)!;
        }
        const img = await loadImage(url);
        if (lowRes) {
            const lowResImg = await createLowResImage(img);
            cache.set(url, lowResImg);
            return lowResImg;
        }
        cache.set(url, img);
        return img;
    }
    
    async function loadImage(url: string): Promise<HTMLImageElement> {
        if (!browser || !url) {
            console.error('Cannot load image: browser not available or URL is empty');
            return new Image();
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => resolve(img);
            img.onerror = (error) => {
                console.error('Error loading image:', error);
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            img.src = url;
        });
    }
    
    async function createLowResImage(img: HTMLImageElement): Promise<HTMLImageElement> {
        if (!browser) return new Promise((resolve) => resolve(img));
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions
        let newWidth = img.width * LOW_RES_SCALE;
        let newHeight = img.height * LOW_RES_SCALE;
        let pxLimit = 400

        // Adjust dimensions if they exceed 300 pixels
        if (newWidth > pxLimit || newHeight > pxLimit) {
            const aspectRatio = img.width / img.height;
            if (newWidth > newHeight) {
                newWidth = pxLimit;
                newHeight = newWidth / aspectRatio;
            } else {
                newHeight = pxLimit;
                newWidth = newHeight * aspectRatio;
            }
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Apply blur effect
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const lowResImg = new Image();
                lowResImg.onload = () => resolve(lowResImg);
                lowResImg.src = URL.createObjectURL(blob!);
            }, 'image/jpeg', 0.5); // Adjust quality as needed
        });
    }
    const debouncedRender = debounce(() => {
        if (!renderRequested && browser) {
            renderRequested = true;
            if (typeof window !== 'undefined') {
                window.requestAnimationFrame(renderIdCard);
            }
        }
    }, DEBOUNCE_DELAY);
    
    async function renderIdCard() {
        if (!browser || !displayCanvas || !bufferCanvas || isRendering) {
            console.log('Skipping render:', { browser, displayCanvas: !!displayCanvas, bufferCanvas: !!bufferCanvas, isRendering });
            return;
        }

        try {
            isRendering = true;
            renderRequested = false;

            const scale = fullResolution ? 1 : PREVIEW_SCALE;
            const width = FULL_WIDTH * scale;
            const height = FULL_HEIGHT * scale;

            // Set buffer canvas dimensions
            bufferCanvas.width = width;
            bufferCanvas.height = height;

            // Render to buffer
            await renderCanvas(bufferCtx, scale, false);

            // Set display canvas dimensions
            displayCanvas.width = width;
            displayCanvas.height = height;

            // Copy from buffer to display
            displayCtx.drawImage(bufferCanvas, 0, 0);

            dispatch('rendered');
        } catch (error) {
            console.error('Error in renderIdCard:', error);
        } finally {
            isRendering = false;
            if (renderRequested && browser) {
                window.requestAnimationFrame(renderIdCard);
            }
        }
    }
    
    async function renderCanvas(ctx: CanvasRenderingContext2D, scale: number, isOffScreen: boolean) {
        try {
            // Clear the canvas first
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Render background if URL is provided
            if (backgroundUrl) {
                try {
                    const backgroundImage = await loadAndCacheImage(backgroundUrl);
                    ctx.drawImage(backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
                } catch (error) {
                    console.error('Error loading background image:', error);
                }
            }

            // Render elements
            for (const element of elements) {
                try {
                    if (element.type === 'text' || element.type === 'selection') {
                        renderTextElement(ctx, element, scale);
                    } else if (element.type === 'photo' || element.type === 'signature') {
                        await renderImageElement(ctx, element, scale, isOffScreen);
                    }
                } catch (error) {
                    console.error(`Error rendering element ${element.variableName}:`, error);
                }
            }
        } catch (error) {
            console.error('Error in renderCanvas:', error);
        }
    }
    
    function measureTextHeight(ctx: CanvasRenderingContext2D, fontFamily?: string, fontSize?: number): number {
        if (!browser) return 0;
        
        const previousFont = ctx.font;
        ctx.font = `${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ');
        ctx.font = previousFont;
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }
    
    function renderTextElement(ctx: CanvasRenderingContext2D, element: TemplateElement, scale: number) {
        if (element.type !== 'text' && element.type !== 'selection') return;
     
        const nScale = scale * ELEMENT_SCALE;
        const fontSize = (element.size || 12) * nScale;
        ctx.font = `${element.fontWeight || ''} ${fontSize}px ${element.font || 'Arial'}`;
        ctx.fillStyle = element.color || 'black';
        ctx.textAlign = element.alignment as CanvasTextAlign;
        ctx.textBaseline = 'top';
    
        let text = '';
        if (element.type === 'selection') {
            // For selection type, get the selected option from formData
            text = formData[element.variableName] || element.options?.[0] || '';
        } else {
            // For text type, get the text directly from formData
            text = formData[element.variableName] || '';
        }

        // Apply text transformations if specified
        if (element.textTransform === 'uppercase') {
            text = text.toUpperCase();
        } else if (element.textTransform === 'lowercase') {
            text = text.toLowerCase();
        } else if (element.textTransform === 'capitalize') {
            text = text.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        const elementWidth = (element.width || 0) * nScale;
        const elementHeight = (element.height || 0) * nScale;
        const elementX = (element.x || 0) * nScale;
        const elementY = (element.y || 0) * nScale;
    
        let x: number;
        if (element.alignment === 'center') {
            x = elementX + elementWidth / 2;
        } else if (element.alignment === 'right') {
            x = elementX + elementWidth;
        } else {
            x = elementX;
        }
    
        const textHeight = element.font ? measureTextHeight(ctx, element.font, element.size) : 0;
        const y = elementY + (textHeight/2.3) * nScale;

        // Apply text decorations
        if (element.textDecoration === 'underline' || element.textDecoration === 'line-through') {
            const metrics = ctx.measureText(text);
            const lineY = element.textDecoration === 'underline' 
                ? y + textHeight 
                : y + textHeight / 2;
            
            ctx.beginPath();
            ctx.moveTo(x - (element.alignment === 'right' ? metrics.width : 0), lineY);
            ctx.lineTo(x + (element.alignment === 'left' ? metrics.width : 0), lineY);
            ctx.strokeStyle = element.color || 'black';
            ctx.lineWidth = Math.max(1, fontSize * 0.05);
            ctx.stroke();
        }

        // Apply opacity if specified
        if (typeof element.opacity === 'number') {
            ctx.globalAlpha = element.opacity;
        }

        // Draw the text
        ctx.fillText(text, x, y);

        // Reset opacity
        ctx.globalAlpha = 1;
    }
    
    async function renderImageElement(ctx: CanvasRenderingContext2D, element: TemplateElement, scale: number, isOffScreen: boolean) {
        if (element.type !== 'photo' && element.type !== 'signature') return;
    
        const nScale = scale * ELEMENT_SCALE;
        const file = fileUploads[element.variableName];
        const pos = imagePositions[element.variableName];
    
        const elementX = (element.x || 0) * nScale;
        const elementY = (element.y || 0) * nScale;
        const elementWidth = (element.width || 100) * nScale;
        const elementHeight = (element.height || 100) * nScale;
    
        ctx.save();
        ctx.beginPath();
        ctx.rect(elementX, elementY, elementWidth, elementHeight);
        ctx.clip();
    
        if (file) {
            try {
                const image = await loadAndCacheImage(URL.createObjectURL(file), isDragging && !isOffScreen && !(element.type === 'signature'));
                const imgAspectRatio = image.width / image.height;
                const elementAspectRatio = elementWidth / elementHeight;
                
                let drawWidth = elementWidth * (pos.scale || 1);
                let drawHeight = elementHeight * (pos.scale || 1);
    
                if (imgAspectRatio > elementAspectRatio) {
                    drawHeight = drawWidth / imgAspectRatio;
                } else {
                    drawWidth = drawHeight * imgAspectRatio;
                }
    
                const x = elementX + (elementWidth - drawWidth) / 2 + (pos.x || 0) * nScale;
                const y = elementY + (elementHeight - drawHeight) / 2 + (pos.y || 0) * nScale;
    
                if (element.type === 'signature') {
                    ctx.globalCompositeOperation = 'multiply';
                }
    
                ctx.drawImage(image, x, y, drawWidth, drawHeight);
                ctx.globalCompositeOperation = 'source-over';

       
            } catch (error) {
                console.error(`Error loading image for ${element.variableName}:`, error);
                if (!isOffScreen) {
                    renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, "Error Photo", nScale);
                }
            }
        } else if (!isOffScreen) {
            renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, element.type, nScale);
        }
    
        ctx.restore();
    }
    
    function renderPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string, scale: number) {
        if (!browser) return;
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#999';
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#999';
        ctx.font = `${12 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type, x + width / 2, y + height / 2);
    }
    
    export async function renderFullResolution(): Promise<Blob | null> {
        if (!browser || !offscreenCanvas) {
            console.error('Offscreen canvas not initialized in renderFullResolution');
            return null;
        }
        const offscreenCtx = offscreenCanvas.getContext('2d');
        if (!offscreenCtx) {
            console.error('Could not get 2D context from offscreen canvas');
            return null;
        }
        offscreenCanvas.width = FULL_WIDTH;
        offscreenCanvas.height = FULL_HEIGHT;
        offscreenCtx.clearRect(0, 0, FULL_WIDTH, FULL_HEIGHT);
        await renderCanvas(offscreenCtx as unknown as CanvasRenderingContext2D, 1, true);
        return await offscreenCanvas.convertToBlob({ type: 'image/png' });
    }
    
    $: if (elements || formData || fileUploads || imagePositions || fullResolution || isDragging) {
        if (browser) {
            debouncedRender();
        }
    }
</script>

<canvas bind:this={displayCanvas}></canvas>

<style>
    canvas {
        border: 1px solid #ccc;
    }
</style>