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

    const dispatch = createEventDispatcher<{
        change: { file: File | null; previewUrl: string | null; name: string | null };
        error: { message: string };
    }>();

    let imageFile: HTMLInputElement;
    let previewUrl: string | null = null;
    let error: string | null = null;
    let imageLoadError = false;

    $: {
        console.log('Initial image updated:', { id, initialImage });
        
        // If initialImage starts with 'https://', it's a URL, so keep it
        if (initialImage?.startsWith('https://')) {
            previewUrl = initialImage;
        } else if (initialImage === null) {
            previewUrl = null;
        }
        
        imageLoadError = false;
        error = null;
        console.log('Preview URL set to:', { id, previewUrl });
    }

    function handleImageChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
            console.log('Image selected:', { 
                name: file.name, 
                size: file.size, 
                type: file.type 
            });

            if (file.size > maxSize) {
                error = 'Image must be less than 5MB';
                console.log('Image validation failed:', error);
                dispatch('error', { message: error });
                return;
            }
            
            if (!acceptedTypes.includes(file.type)) {
                error = 'Invalid file type. Use JPG, PNG, or WebP';
                console.log('Image validation failed:', error);
                dispatch('error', { message: error });
                return;
            }

            if (previewUrl && previewUrl !== initialImage) {
                URL.revokeObjectURL(previewUrl);
            }

            const newPreviewUrl = URL.createObjectURL(file);
            previewUrl = newPreviewUrl;
            error = null;
            imageLoadError = false;
            
            console.log('Image change successful:', { 
                previewUrl: newPreviewUrl,
                fileName: file.name
            });

            dispatch('change', { 
                file, 
                previewUrl: newPreviewUrl,
                name: file.name
            });
        }
    }

    function handleRemove(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        
        console.log('Removing image with id:', id);
        console.log('Current previewUrl:', previewUrl);
        console.log('Current initialImage:', initialImage);

        if (previewUrl && previewUrl !== initialImage) {
            URL.revokeObjectURL(previewUrl);
        }
        
        previewUrl = null;
        if (imageFile) imageFile.value = '';
        error = null;
        imageLoadError = false;

        // Always dispatch null values to indicate removal
        dispatch('change', { 
            file: null,
            previewUrl: null,
            name: null
        });

        console.log('Image removed, state after removal:', {
            previewUrl,
            error,
            imageLoadError
        });
    }

    function handleImageError() {
        console.log('Image load error occurred');
        imageLoadError = true;
        error = 'Failed to load image';
        dispatch('error', { message: error });
    }

    onDestroy(() => {
        if (previewUrl && previewUrl !== initialImage) {
            console.log('Cleaning up image URL:', previewUrl);
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
        </ul>
    </div>
</div>