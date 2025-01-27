<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { X } from 'lucide-svelte';
    import { SupabaseImageManager } from '$lib/utils/SupabaseImageManager';
    import type { SupabaseClient } from '@supabase/supabase-js';
    import { getContext } from 'svelte';
    import { page } from '$app/stores';
    
    interface ImageProps {
        bucket: string;
        imageUrl: string | null;
        label: string;
        width?: number;
        height?: number;
        quality?: number;
    }
    
    interface ImageTransformResult {
        url: string | null;
        error?: string;
    }
    
    export let bucket: ImageProps['bucket'];
    export let imageUrl: ImageProps['imageUrl'] = null;
    export let label: ImageProps['label'];
    export let width: ImageProps['width'] = undefined;
    export let height: ImageProps['height'] = undefined;
    export let quality: ImageProps['quality'] = 80;
    
    let previousUrl: string | null = null;
    let supabase: SupabaseClient = getContext('supabase') || $page.data.supabase;

    // Cache for transformed URLs to avoid unnecessary transformations
    const transformedUrlCache = new Map<string, string>();

    function getPublicStorageUrl(filename: string): string {
        const baseUrl = supabase.storage.from(bucket).getPublicUrl('').data.publicUrl;
        return `${baseUrl}/${filename}`;
    }

    function getCacheKey(url: string): string {
        const filename = url.split('/').pop() || '';
        const transformString = [
            width ? `w${width}` : '',
            height ? `h${height}` : '',
            quality ? `q${quality}` : ''
        ].filter(Boolean).join('-');
        return `${bucket}:${filename}-${transformString}`;
    }

    function getTransformedUrl(imageUrl: string | null): string {
        if (!imageUrl) return '';
        const filename = imageUrl.split('/').pop() || '';
        const [baseName, ext] = filename.split('.');
        const transformString = [
            width ? `w${width}` : '',
            height ? `h${height}` : '',
            quality ? `q${quality}` : ''
        ].filter(Boolean).join('-');
        const transformedFilename = `${baseName}-${transformString}.${ext}`;
        return getPublicStorageUrl(transformedFilename);
    }

    let transformedUrl = getTransformedUrl(imageUrl);
    let error: string | null = null;
    let imageLoadError = false;
    let isTransforming = false;
    let isImageLoaded = false;
    let imageManager: SupabaseImageManager | null = null;
    let isInitialized = false;
    let hasTransformed = false;

    // Function to check if transformed image exists
    async function checkImageExists(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    async function loadImage() {
        if (!imageUrl || !transformedUrl) return;

        const cacheKey = getCacheKey(imageUrl);
        
        // Check memory cache first
        const cachedUrl = transformedUrlCache.get(cacheKey);
        if (cachedUrl) {
            transformedUrl = cachedUrl;
            isImageLoaded = true;
            return;
        }

        // Check localStorage cache
        const storedCache = localStorage.getItem(cacheKey);
        if (storedCache) {
            const { url, timestamp } = JSON.parse(storedCache);
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) { // 24 hours
                transformedUrl = url;
                transformedUrlCache.set(cacheKey, url);
                isImageLoaded = true;
                return;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }

        // Check if the transformed image already exists
        const exists = await checkImageExists(transformedUrl);
        if (exists) {
            transformedUrlCache.set(cacheKey, transformedUrl);
            localStorage.setItem(cacheKey, JSON.stringify({
                url: transformedUrl,
                timestamp: Date.now()
            }));
            isImageLoaded = true;
            return;
        }

        // If not in cache and doesn't exist, trigger transformation
        if (!hasTransformed && imageManager) {
            transformImage(imageUrl);
        }
    }

    async function handleImageLoad() {
        if (!transformedUrl || !imageUrl) return;
        
        const cacheKey = getCacheKey(imageUrl);
        transformedUrlCache.set(cacheKey, transformedUrl);
        localStorage.setItem(cacheKey, JSON.stringify({
            url: transformedUrl,
            timestamp: Date.now()
        }));
        isImageLoaded = true;
        imageLoadError = false;
        error = null;
    }

    async function handleImageError() {
        if (!imageUrl || !isInitialized) return;
        
        imageLoadError = true;
        isImageLoaded = false;
        
        // Clear cache for failed image
        const cacheKey = getCacheKey(imageUrl);
        transformedUrlCache.delete(cacheKey);
        localStorage.removeItem(cacheKey);

        if (!hasTransformed && imageManager) {
            transformImage(imageUrl);
        }
    }

    const imageLoadMonitor = {
        handleLoad: handleImageLoad,
        handleError: handleImageError
    };

    async function getSignedUrl(path: string): Promise<string | null> {
        if (!supabase || !bucket) return null;
    
        try {
            const { data, error: signError } = await supabase
                .storage
                .from(bucket)
                .createSignedUrl(path, 3600);
    
            if (signError) throw signError;
            return data?.signedUrl || null;
        } catch {
            return null;
        }
    }
    
    function extractPathFromUrl(url: string): string | null {
        try {
            const pathMatch = url.match(/public\/[^\/]+\/(.+)/);
            return pathMatch ? pathMatch[1] : null;
        } catch {
            return null;
        }
    }
    
    async function transformImage(url: string): Promise<void> {
        if (!isInitialized || !imageManager) {
            error = 'Image manager not initialized';
            hasTransformed = true;
            return;
        }

        if (url === previousUrl && !imageLoadError) return;

        const cacheKey = getCacheKey(url);
        
        // Check memory cache first
        const cachedUrl = transformedUrlCache.get(cacheKey);
        if (cachedUrl) {
            transformedUrl = cachedUrl;
            imageLoadError = false;
            hasTransformed = true;
            return;
        }

        isTransforming = true;
        error = null;

        try {
            const result = await imageManager.transformAndStore(url, {
                width,
                height,
                quality
            });

            if (result.error) {
                error = result.error;
                imageLoadError = true;
                hasTransformed = true;
                return;
            }

            const newUrl = result.url;
            if (newUrl) {
                transformedUrl = newUrl;
                imageLoadError = false;
                hasTransformed = true;
                transformedUrlCache.set(cacheKey, newUrl);
                localStorage.setItem(cacheKey, JSON.stringify({
                    url: newUrl,
                    timestamp: Date.now()
                }));
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to transform image';
            imageLoadError = true;
            hasTransformed = true;
        } finally {
            isTransforming = false;
        }
    }

    onMount(async () => {
        imageManager = SupabaseImageManager.create(supabase, bucket);
        isInitialized = true;
        if (imageUrl) {
            await loadImage();
        }
    });

    $: if (imageUrl !== previousUrl) {
        previousUrl = imageUrl;
        hasTransformed = false;
        error = null;
        loadImage();
    }
</script>

<div class="relative w-full h-full overflow-hidden">
    {#if imageUrl}
        <div class="absolute inset-0 animate-[breathing_2s_ease-in-out_infinite] bg-gray-100" />
        
        {#if transformedUrl && !imageLoadError}
            <img
                src={transformedUrl}
                alt={label}
                class="w-full h-full relative transition-[filter] duration-150 ease-out {isImageLoaded ? '' : 'blur-[1px]'}"
                style="object-fit: cover; clip-path: inset(0);"
                on:error={imageLoadMonitor.handleError}
                on:load={imageLoadMonitor.handleLoad}
                loading="lazy"
            />
        {:else if imageLoadError || error}
            <div class="w-full h-full absolute inset-0 flex items-center justify-center bg-gray-50">
                <div class="text-center">
                    <X class="text-gray-400 mx-auto" size={24} />
                    <span class="text-xs text-gray-400 mt-1 block">Image not found</span>
                </div>
            </div>
        {/if}
    
        {#if isTransforming}
            <div class="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div class="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
        {/if}
    {:else}
        <div class="w-full h-full flex items-center justify-center bg-gray-50">
            <span class="text-sm text-gray-400">No image</span>
        </div>
    {/if}
</div>