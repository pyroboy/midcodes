<script lang="ts">
  import Card from '$lib/components/ui/card/card.svelte';
  import CardContent from '$lib/components/ui/card/card-content.svelte';
  import { getSupabaseStorageUrl } from '$lib/utils/supabase';

  type IDCardType = {
    idcard_id: string;
    template_name: string;
    front_image?: string | null;
    back_image?: string | null;
    fields?: Record<string, { value: string | null; side: 'front' | 'back' } | undefined>;
  };

  export let card: IDCardType;
  export let isSelected: boolean = false;
  // Loosen callback parameter types to interop with parent handlers
  export let onToggleSelect: (card: any) => void;
  export let onDownload: (card: any) => void;
  export let onDelete: (card: any) => void;
  export let onOpenPreview: (e: MouseEvent, card: any) => void;
  export let downloading: boolean = false;
  export let deleting: boolean = false;
  export let width: number = 300; // controlled from parent

  function handleClick(e: MouseEvent) {
    onOpenPreview?.(e, card);
  }

  const frontUrl = card.front_image
    ? getSupabaseStorageUrl(card.front_image, 'rendered-id-cards')
    : null;
</script>

<div class="relative" role="button" tabindex="0" on:click={handleClick} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(new MouseEvent('click')); } }} style={`width: ${width}px;`}>
  <input
    aria-label="Select card"
    type="checkbox"
    checked={isSelected}
    on:click|stopPropagation={() => onToggleSelect(card)}
    class="absolute top-2 left-2 z-10 w-5 h-5 text-blue-600 bg-white/90 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow"
  />

  <Card class="p-3 hover:shadow-md transition-shadow cursor-pointer">
    <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex items-center justify-center" style="aspect-ratio: 1013/638;">
      {#if frontUrl}
        <img src={frontUrl} alt="Card preview" class="w-full h-full object-contain" />
      {:else}
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      {/if}
    </div>

    <CardContent class="pt-3">
      <div class="flex gap-3">
        <button class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" on:click|stopPropagation={() => onDownload(card)} disabled={downloading}>
          {downloading ? 'Downloading...' : 'Download'}
        </button>
        <button class="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors" on:click|stopPropagation={() => onDelete(card)} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </CardContent>
  </Card>
</div>

