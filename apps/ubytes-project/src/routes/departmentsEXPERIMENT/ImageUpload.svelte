<script lang="ts">
    import { createEventDispatcher, onDestroy } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { XCircle, ImageOff, Trash2 } from 'lucide-svelte';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    
    export let initialImage: string | null = null;
    export let maxSize = 5 * 1024 * 1024;
    export let acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    export let name: string;
    export let id: string;
    export let label: string;
    
    interface ImageVariant {
        file: File;
        size: 'small' | 'medium' | 'large';
        width: number;
        height: number;
    }
    
    const dispatch = createEventDispatcher<{
        change: { 
            variants: ImageVariant[];
            previewUrl: string | null; 
            originalName: string | null;
        };
        error: { message: string };
    }>();
    
    let imageFile: HTMLInputElement;
    let previewUrl: string | null = null;
    let error: string | null = null;
    let imageLoadError = false;
    
    const sizeVariants = [
        { size: 'small', width: 50, height: 50 },
        { size: 'medium', width: 100, height: 100 },
        { size: 'large', width: 150, height: 150 }
    ];
    
    async function convertToWebP(file: File, width: number, height: number, sizeName: string): Promise<ImageVariant> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
    
                const scale = Math.min(width / img.width, height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                
                const x = (width - scaledWidth) / 2;
                const y = (height - scaledHeight) / 2;
                
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Could not convert to WebP'));
                        return;
                    }
    
                    const newFile = new File([blob], `${file.name}-${sizeName}.webp`, {
                        type: 'image/webp'
                    });
    
                    resolve({
                        file: newFile,
                        size: sizeName as 'small' | 'medium' | 'large',
                        width,
                        height
                    });
                }, 'image/webp', 0.8);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }
    
    async function handleImageChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
            if (file.size > maxSize) {
                error = 'Image must be less than 5MB';
                dispatch('error', { message: error });
                return;
            }
            
            if (!acceptedTypes.includes(file.type)) {
                error = 'Invalid file type. Use JPG, PNG, or WebP';
                dispatch('error', { message: error });
                return;
            }
    
            try {
                if (previewUrl && previewUrl !== initialImage) {
                    URL.revokeObjectURL(previewUrl);
                }
    
                const variants = await Promise.all(
                    sizeVariants.map(variant => 
                        convertToWebP(file, variant.width, variant.height, variant.size)
                    )
                );
                
                const largeVar = variants.find(v => v.size === 'large');
                if (largeVar) {
                    previewUrl = URL.createObjectURL(largeVar.file);
                }
    
                error = null;
                imageLoadError = false;
    
                dispatch('change', { 
                    variants,
                    previewUrl,
                    originalName: file.name
                });
            } catch (err) {
                console.error('Image processing failed:', err);
                error = 'Failed to process image';
                dispatch('error', { message: error });
            }
        }
    }
    
    function handleRemove(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        
        if (previewUrl && previewUrl !== initialImage) {
            URL.revokeObjectURL(previewUrl);
        }
        
        previewUrl = null;
        if (imageFile) imageFile.value = '';
        error = null;
        imageLoadError = false;
    
        dispatch('change', { 
            variants: [],
            previewUrl: null,
            originalName: null
        });
    }
    
    function handleImageError() {
        imageLoadError = true;
        error = 'Failed to load image';
        dispatch('error', { message: error });
    }
    
    onDestroy(() => {
        if (previewUrl && previewUrl !== initialImage) {
            URL.revokeObjectURL(previewUrl);
        }
    });
    </script>
    
    <div class="w-full">
        <Label>{label}</Label>
        <div class="relative">
            <button 
                type="button"
                class="w-32 h-32 border-2 border-dashed rounded-lg 
                       flex flex-col items-center justify-center
                       overflow-hidden relative group transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-primary
                       {!error && !imageLoadError ? 'border-gray-300' : 'border-red-400 ring-2 ring-red-400'}"
                on:click={() => imageFile?.click()}
                aria-label="Click to upload image"
            >
                <input
                    type="file"
                    {id}
                    {name}
                    accept={acceptedTypes.join(',')}
                    class="hidden"
                    bind:this={imageFile}
                    on:change={handleImageChange}
                />
    
                {#if previewUrl && !imageLoadError}
                    <img
                        src={previewUrl}
                        alt={label}
                        class="w-full h-full object-cover absolute inset-0"
                        on:error={handleImageError}
                    />
                    <div 
                        class="absolute inset-0 bg-black bg-opacity-50 opacity-0 
                               group-hover:opacity-100 transition-opacity flex flex-col
                               items-center justify-center gap-2"
                    >
                        <span class="text-white text-sm">Change {label}</span>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            type="button"
                            on:click={handleRemove}
                            class="mt-2"
                        >
                            <Trash2 class="h-4 w-4 mr-1" />
                            Remove
                        </Button>
                    </div>
                {:else if imageLoadError}
                    <div class="flex flex-col items-center justify-center gap-2 p-2 text-red-500">
                        <ImageOff class="h-8 w-8" />
                        <span class="text-xs text-center">Unable to load image</span>
                        <span class="text-[10px] text-center text-gray-500">Click to upload new image</span>
                    </div>
                {:else}
                    <div class="flex flex-col items-center gap-1">
                        <span class="text-gray-500">{label.toUpperCase()}</span>
                        <span class="text-gray-400 text-xs">Click to upload</span>
                    </div>
                {/if}
            </button>
    
            {#if error && !imageLoadError}
                <div 
                    class="absolute -bottom-6 left-0 w-48 text-red-500 text-sm flex items-center gap-1"
                    in:fly={{ y: -10, duration: 200 }}
                    out:fade={{ duration: 150 }}
                    role="alert"
                >
                    <XCircle class="h-4 w-4" />
                    <span>{error}</span>
                </div>
            {/if}
        </div>
    
        <div class="mt-2 text-xs text-gray-500">
            <p>Requirements:</p>
            <ul class="list-disc list-inside">
                <li>Max size: 5MB</li>
                <li>Formats: JPG, PNG, WebP</li>
                <li>Auto-converts to WebP</li>
            </ul>
        </div>
    </div>