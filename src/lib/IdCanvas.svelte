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

    const dispatch = createEventDispatcher<{
        error: { message: string; code: string };
        ready: { isReady: boolean };
        rendered: void;
    }>();

    type CanvasError = {
        code: string;
        message: string;
    };

    class CanvasOperationError extends Error {
        code: string;
        constructor(message: string, code: string) {
            super(message);
            this.code = code;
            this.name = 'CanvasOperationError';
        }
    }

    let displayCanvas: HTMLCanvasElement;
    let bufferCanvas: HTMLCanvasElement;
    let offscreenCanvas: OffscreenCanvas | null = null;
    let displayCtx: CanvasRenderingContext2D | null = null;
    let bufferCtx: CanvasRenderingContext2D | null = null;
    let isReady = false;
    let isRendering = false;
    let renderRequested = false;
    let isMounted = false;
    
    const DEBOUNCE_DELAY = 20;
    const PREVIEW_SCALE = 0.5;
    const ELEMENT_SCALE = 2;
    const FULL_WIDTH = 1013;
    const FULL_HEIGHT = 638;
    const LOW_RES_SCALE = 0.4;
    
    const imageCache = new Map<string, HTMLImageElement>();
    const lowResImageCache = new Map<string, HTMLImageElement>();

    export function isCanvasReady(): { ready: boolean; error?: CanvasError } {
        try {
            if (!browser) {
                throw new CanvasOperationError(
                    'Canvas operations are only available in browser environment',
                    'BROWSER_UNAVAILABLE'
                );
            }

            if (!displayCanvas) {
                throw new CanvasOperationError(
                    'Display canvas is not initialized',
                    'DISPLAY_CANVAS_MISSING'
                );
            }

            if (!bufferCanvas) {
                throw new CanvasOperationError(
                    'Buffer canvas is not initialized',
                    'BUFFER_CANVAS_MISSING'
                );
            }

            if (!offscreenCanvas) {
                throw new CanvasOperationError(
                    'Offscreen canvas is not initialized',
                    'OFFSCREEN_CANVAS_MISSING'
                );
            }

            if (!displayCtx || !bufferCtx) {
                throw new CanvasOperationError(
                    'Canvas context is not initialized',
                    'CONTEXT_MISSING'
                );
            }

            if (!isReady) {
                throw new CanvasOperationError(
                    'Canvas is not ready for operations',
                    'CANVAS_NOT_READY'
                );
            }

            return { ready: true };
        } catch (error) {
            if (error instanceof CanvasOperationError) {
                return { 
                    ready: false, 
                    error: { 
                        code: error.code, 
                        message: error.message 
                    } 
                };
            }
            return { 
                ready: false, 
                error: { 
                    code: 'UNKNOWN_ERROR', 
                    message: 'An unexpected error occurred while checking canvas readiness' 
                } 
            };
        }
    }
    
    onMount(async () => {
        if (browser) {
            isMounted = true;
            await initializeCanvases();
        }
    });
    
    afterUpdate(async () => {
        if (browser && !isReady && isMounted) {
            await initializeCanvases();
        }
    });
    
    async function initializeCanvases() {
        if (!browser || !displayCanvas) {
            dispatch('error', {
                code: 'INITIALIZATION_ERROR',
                message: 'Cannot initialize canvas: browser or canvas not available'
            });
            return;
        }
        
        try {
            displayCtx = displayCanvas.getContext('2d');
            if (!displayCtx) {
                throw new CanvasOperationError(
                    'Failed to get display canvas context',
                    'DISPLAY_CONTEXT_ERROR'
                );
            }

            bufferCanvas = document.createElement('canvas');
            bufferCtx = bufferCanvas.getContext('2d');
            if (!bufferCtx) {
                throw new CanvasOperationError(
                    'Failed to get buffer canvas context',
                    'BUFFER_CONTEXT_ERROR'
                );
            }

            offscreenCanvas = new OffscreenCanvas(FULL_WIDTH, FULL_HEIGHT);
            
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            isReady = true;
            await renderIdCard();
            dispatch('ready', { isReady: true });
            
        } catch (error) {
            isReady = false;
            const errorDetails = error instanceof CanvasOperationError 
                ? { code: error.code, message: error.message }
                : { code: 'INITIALIZATION_ERROR', message: 'Failed to initialize canvas' };
            
            dispatch('error', errorDetails);
        }
    }
    
    async function loadAndCacheImage(url: string, lowRes: boolean = false): Promise<HTMLImageElement> {
        if (!browser || !url) {
            throw new CanvasOperationError(
                'Cannot load image: browser not available or URL is empty',
                'IMAGE_LOAD_ERROR'
            );
        }

        const cache = lowRes ? lowResImageCache : imageCache;
        if (cache.has(url)) return cache.get(url)!;
        
        try {
            const img = await loadImage(url);
            if (lowRes) {
                const lowResImg = await createLowResImage(img);
                cache.set(url, lowResImg);
                return lowResImg;
            }
            cache.set(url, img);
            return img;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new CanvasOperationError(
                    `Failed to load and cache image: ${error.message}`,
                    'IMAGE_CACHE_ERROR'
                );
            } else {
                throw new CanvasOperationError(
                    'Failed to load and cache image: Unknown error',
                    'IMAGE_CACHE_ERROR'
                );
            }
        }
    }
    
    async function loadImage(url: string): Promise<HTMLImageElement> {
        if (!browser || !url) {
            throw new CanvasOperationError(
                'Cannot load image: browser not available or URL is empty',
                'IMAGE_LOAD_ERROR'
            );
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new CanvasOperationError(
                `Failed to load image: ${url}`,
                'IMAGE_LOAD_ERROR'
            ));
            img.src = url;
        });
    }
    
    async function createLowResImage(img: HTMLImageElement): Promise<HTMLImageElement> {
        if (!browser) return img;
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new CanvasOperationError(
                    'Failed to get context for low-res image creation',
                    'LOWRES_CONTEXT_ERROR'
                );
            }

            const pxLimit = 400;
            let newWidth = img.width * LOW_RES_SCALE;
            let newHeight = img.height * LOW_RES_SCALE;

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
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new CanvasOperationError(
                            'Failed to create blob for low-res image',
                            'BLOB_CREATION_ERROR'
                        ));
                        return;
                    }
                    const lowResImg = new Image();
                    lowResImg.onload = () => resolve(lowResImg);
                    lowResImg.onerror = (error) => reject(new CanvasOperationError(
                        'Failed to load low-res image',
                        'LOWRES_LOAD_ERROR'
                    ));
                    lowResImg.src = URL.createObjectURL(blob);
                }, 'image/jpeg', 0.5);
            });
        } catch (error: any) {
            if (error instanceof Error) {
                throw new CanvasOperationError(
                    `Failed to create low-res image: ${error.message}`,
                    'LOWRES_CREATION_ERROR'
                );
            } else {
                throw new CanvasOperationError(
                    'Failed to create low-res image: Unknown error',
                    'LOWRES_CREATION_ERROR'
                );
            }
        }
    }

    const debouncedRender = debounce(() => {
        if (!renderRequested && browser) {
            renderRequested = true;
            requestAnimationFrame(renderIdCard);
        }
    }, DEBOUNCE_DELAY);
    
    async function renderIdCard() {
        const readinessCheck = isCanvasReady();
        if (!readinessCheck.ready || isRendering) {
            if (readinessCheck.error) {
                dispatch('error', readinessCheck.error);
            }
            return;
        }

        try {
            isRendering = true;
            renderRequested = false;

            const scale = fullResolution ? 1 : PREVIEW_SCALE;
            const width = FULL_WIDTH * scale;
            const height = FULL_HEIGHT * scale;

            bufferCanvas.width = width;
            bufferCanvas.height = height;
            await renderCanvas(bufferCtx!, scale, false);

            displayCanvas.width = width;
            displayCanvas.height = height;
            displayCtx!.drawImage(bufferCanvas, 0, 0);

            dispatch('rendered');
        } catch (error) {
            const errorDetails = error instanceof CanvasOperationError 
                ? { code: error.code, message: error.message }
                : { code: 'RENDER_ERROR', message: 'Failed to render ID card' };
            
            dispatch('error', errorDetails);
        } finally {
            isRendering = false;
            if (renderRequested && browser) {
                requestAnimationFrame(renderIdCard);
            }
        }
    }
    
    async function renderCanvas(ctx: CanvasRenderingContext2D, scale: number, isOffScreen: boolean) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (backgroundUrl) {
            try {
                const backgroundImage = await loadAndCacheImage(backgroundUrl);
                ctx.drawImage(backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
            } catch (error) {
                dispatch('error', {
                    code: 'BACKGROUND_LOAD_ERROR',
                    message: 'Error loading background image'
                });
            }
        }

        for (const element of elements) {
            try {
                if (element.type === 'text' || element.type === 'selection') {
                    renderTextElement(ctx, element, scale);
                } else if (element.type === 'photo' || element.type === 'signature') {
                    await renderImageElement(ctx, element, scale, isOffScreen);
                }
            } catch (error) {
                dispatch('error', {
                    code: 'ELEMENT_RENDER_ERROR',
                    message: `Error rendering element ${element.variableName}`
                });
            }
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
     
        try {
            const nScale = scale * ELEMENT_SCALE;
            const fontSize = (element.size || 12) * nScale;
            ctx.font = `${element.fontWeight || ''} ${fontSize}px ${element.font || 'Arial'}`;
            ctx.fillStyle = element.color || 'black';
            ctx.textAlign = element.alignment as CanvasTextAlign;
            ctx.textBaseline = 'top';
        
            let text = '';
            if (element.type === 'selection') {
                text = formData[element.variableName] || element.options?.[0] || '';
            } else {
                text = formData[element.variableName] || '';
            }

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
        
            let x = elementX;
            if (element.alignment === 'center') {
                x += elementWidth / 2;
            } else if (element.alignment === 'right') {
                x += elementWidth;
            }
        
            const textHeight = element.font ? measureTextHeight(ctx, element.font, element.size) : 0;
            const y = elementY + (textHeight/2.3) * nScale;

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

            if (typeof element.opacity === 'number') {
                ctx.globalAlpha = element.opacity;
            }

            ctx.fillText(text, x, y);
            ctx.globalAlpha = 1;
        } catch (error: any) {
            throw new CanvasOperationError(
                `Failed to render text element: ${element.variableName}`,
                'TEXT_RENDER_ERROR'
            );
        }
    }
    
    async function renderImageElement(ctx: CanvasRenderingContext2D, element: TemplateElement, scale: number, isOffScreen: boolean) {
        if (element.type !== 'photo' && element.type !== 'signature') return;
    
        try {
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
                    const image = await loadAndCacheImage(
                        URL.createObjectURL(file), 
                        isDragging && !isOffScreen && !(element.type === 'signature')
                    );
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
                } catch (error: any) {
                    if (!isOffScreen) {
                        renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, "Error Photo", nScale);
                    }
                    throw new CanvasOperationError(
                        `Failed to load image for ${element.variableName}: ${error.message || 'Unknown error'}`,
                        'IMAGE_RENDER_ERROR'
                    );
                }
            } else if (!isOffScreen) {
                renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, element.type, nScale);
            }
        
            ctx.restore();
        } catch (error: any) {
            throw new CanvasOperationError(
                `Failed to render image element: ${element.variableName}`,
                'IMAGE_RENDER_ERROR'
            );
        }
    }
    
    function renderPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, type: string, scale: number) {
        if (!browser) return;
        
        try {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#999';
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = '#999';
            ctx.font = `${12 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type, x + width / 2, y + height / 2);
        } catch (error: any) {
            throw new CanvasOperationError(
                'Failed to render placeholder',
                'PLACEHOLDER_RENDER_ERROR'
            );
        }
    }
    
    export async function renderFullResolution(): Promise<Blob> {
        const readinessCheck = isCanvasReady();
        if (!readinessCheck.ready) {
            dispatch('error', {
                code: readinessCheck.error?.code || 'CANVAS_NOT_READY',
                message: readinessCheck.error?.message || 'Canvas is not ready for rendering'
            });
            throw new CanvasOperationError(
                readinessCheck.error?.message || 'Canvas is not ready for rendering',
                readinessCheck.error?.code || 'CANVAS_NOT_READY'
            );
        }

        if (!offscreenCanvas) {
            const error = {
                code: 'OFFSCREEN_CANVAS_ERROR',
                message: 'Offscreen canvas is not available for full resolution render'
            };
            dispatch('error', error);
            throw new CanvasOperationError(error.message, error.code);
        }

        try {
            const offscreenCtx = offscreenCanvas.getContext('2d');
            if (!offscreenCtx) {
                throw new CanvasOperationError(
                    'Could not get 2D context from offscreen canvas',
                    'CONTEXT_ACQUISITION_ERROR'
                );
            }

            offscreenCanvas.width = FULL_WIDTH;
            offscreenCanvas.height = FULL_HEIGHT;
            offscreenCtx.clearRect(0, 0, FULL_WIDTH, FULL_HEIGHT);

            await renderCanvas(offscreenCtx as unknown as CanvasRenderingContext2D, 1, true);

            const blob = await offscreenCanvas.convertToBlob({ 
                type: 'image/png',
                quality: 1
            });

            if (!blob) {
                throw new CanvasOperationError(
                    'Failed to generate image blob',
                    'BLOB_GENERATION_ERROR'
                );
            }

            return blob;
        } catch (error: any) {
            const errorDetails = error instanceof CanvasOperationError 
                ? { code: error.code, message: error.message }
                : { code: 'RENDER_ERROR', message: 'Failed to render full resolution image' };

            dispatch('error', errorDetails);
            throw new CanvasOperationError(errorDetails.message, errorDetails.code);
        }
    }
    
    $: if (elements || formData || fileUploads || imagePositions || fullResolution || isDragging) {
        if (browser) {
            debouncedRender();
        }
    }
</script>

<canvas 
    bind:this={displayCanvas} 
    class="id-canvas"
/>

<style lang="postcss">
    .id-canvas {
        @apply border border-slate-200 rounded-md shadow-sm;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        width: 100%; /* Make it stretch to its container's width */
  height: auto; /* Maintain aspect ratio */
  display: block; /* Avoid inline gap */
    }
</style>