<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Upload, X, ImageIcon, Loader2 } from 'lucide-svelte';
  import { cn } from '$lib/utils';

  interface Props {
    value?: string | null;
    accept?: string;
    maxSize?: number; // in MB
    class?: string;
    disabled?: boolean;
    placeholder?: string;
    onupload?: (file: File) => void;
    onremove?: () => void;
    onerror?: (error: string) => void;
  }

  let { 
    value = null, 
    accept = 'image/*', 
    maxSize = 2, // Default to 2MB for profile pictures
    class: className = '',
    disabled = false,
    placeholder = 'Click to upload or drag and drop',
    onupload,
    onremove,
    onerror
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    upload: File;
    remove: void;
    error: string;
  }>();

  let fileInput: HTMLInputElement;
  let dragOver = $state(false);
  let uploading = $state(false);
  let preview = $state<string | null>(value);

  // Update preview when value changes
  $effect(() => {
    preview = value;
  });

  function validateFile(file: File): string | null {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file);
    if (error) {
      if (onerror) onerror(error);
      dispatch('error', error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      preview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Call upload handler
    if (onupload) onupload(file);
    dispatch('upload', file);
  }

  function handleInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function handleRemove() {
    preview = null;
    if (fileInput) {
      fileInput.value = '';
    }
    if (onremove) onremove();
    dispatch('remove');
  }

  function openFileDialog() {
    if (!disabled) {
      fileInput?.click();
    }
  }
</script>

<div class={cn('relative', className)}>
  <!-- Hidden file input -->
  <input
    bind:this={fileInput}
    type="file"
    {accept}
    {disabled}
    onchange={handleInputChange}
    class="hidden"
    aria-label="Upload image"
  />

  {#if preview}
    <!-- Image Preview -->
    <div class="relative group">
      <div class="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-slate-200 bg-slate-100">
        <img 
          src={preview} 
          alt="Preview" 
          class="w-full h-full object-cover"
        />
      </div>
      
      {#if !disabled}
        <!-- Remove button -->
        <Button
          variant="destructive"
          size="icon"
          class="absolute -top-2 -right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onclick={handleRemove}
          aria-label="Remove image"
        >
          <X class="h-4 w-4" />
        </Button>

        <!-- Change button -->
        <Button
          variant="secondary"
          size="sm"
          class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          onclick={openFileDialog}
        >
          <Upload class="h-3 w-3 mr-1" />
          Change
        </Button>
      {/if}
    </div>
  {:else}
    <!-- Upload Area -->
    <div
      class={cn(
        "w-40 h-40 mx-auto rounded-full border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors cursor-pointer flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100",
        dragOver && "border-primary bg-primary/5",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onclick={openFileDialog}
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      role="button"
      tabindex={disabled ? -1 : 0}
      aria-label="Upload area"
      onkeydown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          openFileDialog();
        }
      }}
    >
      {#if uploading}
        <Loader2 class="h-8 w-8 text-slate-400 animate-spin mb-2" />
        <span class="text-xs text-slate-500">Uploading...</span>
      {:else}
        <ImageIcon class="h-8 w-8 text-slate-400 mb-2" />
        <span class="text-xs text-slate-500 text-center px-2">
          {placeholder}
        </span>
        <span class="text-xs text-slate-400 mt-1">
          Max {maxSize}MB • JPG, PNG, GIF, WebP
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Ensure proper focus styles for accessibility */
  [role="button"]:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }
</style>