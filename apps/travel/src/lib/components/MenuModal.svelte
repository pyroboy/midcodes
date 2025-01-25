<script lang="ts">
  import { fade } from 'svelte/transition';

  interface MenuItem {
    name: string;
    description: string;
    price: number;
  }

  export let isOpen: boolean;
  export let title: string;
  export let menuItems: {
    category: string;
    items: MenuItem[];
  }[];

  function closeModal() {
    isOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  let modalContent: HTMLElement;

  function handleOutsideClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 z-50"
    role="dialog"
    aria-labelledby="modal-title"
    aria-modal="true"
  >
    <!-- Backdrop -->
    <button
      type="button"
      class="absolute inset-0 w-full h-full bg-black/50"
      on:click={handleOutsideClick}
      aria-label="Close modal overlay"
    ></button>

    <!-- Modal Content -->
    <div 
      class="absolute inset-0 flex items-center justify-center p-4"
      bind:this={modalContent}
    >
      <div 
        class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
        role="document"
      >
        <div class="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 id="modal-title" class="text-2xl font-bold text-orange-600">{title} Menu</h2>
          <button 
            type="button"
            class="text-gray-500 hover:text-orange-600"
            on:click={closeModal}
            aria-label="Close menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {#each menuItems as category}
              <div>
                <h3 class="text-lg font-bold text-orange-600 mb-4">{category.category}</h3>
                <div class="space-y-4">
                  {#each category.items as item}
                    <div class="border-b border-orange-100 pb-3">
                      <div class="flex justify-between items-center mb-1">
                        <h4 class="text-base font-semibold">{item.name}</h4>
                        <span class="text-base text-orange-600">₱{item.price}</span>
                      </div>
                      <p class="text-sm text-gray-600">{item.description}</p>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<svelte:window on:keydown={handleKeydown}/>