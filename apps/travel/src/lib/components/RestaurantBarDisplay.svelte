<script lang="ts">
  import MenuModal from './MenuModal.svelte';
  
  interface MenuItem {
    name: string;
    description: string;
    price: number;
  }

  export let title: string;
  export let description: string;
  export let menuItems: {
    category: string;
    items: MenuItem[];
  }[];
  export let galleryImages: {
    src: string;
    alt: string;
  }[];

  let isMenuModalOpen = false;
</script>

<div class="mb-20">
  <h2 class="text-2xl font-bold text-orange-600 mb-8">{title}</h2>
  
  <!-- Gallery Section remains the same -->
  <div class="mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] mb-4">
      {#each galleryImages as image}
        <div class="overflow-hidden rounded-lg h-full">
          <img 
            src={image.src} 
            alt={image.alt}
            class="w-full h-full object-cover transition-all duration-300 hover:scale-105"
          />
        </div>
      {/each}
    </div>
    <p class="text-gray-600 text-sm italic text-center">{description}</p>
  </div>

  <!-- View Menu Button -->
  <button
    class="w-full px-6 py-4 flex items-center justify-between bg-orange-100/50 rounded-lg hover:bg-orange-100 transition-colors"
    on:click={() => isMenuModalOpen = true}
  >
    <span class="text-lg font-semibold text-orange-800">View Menu</span>
    <svg
      class="w-6 h-6 text-orange-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M9 5l7 7-7 7"
      />
    </svg>
  </button>

  <MenuModal 
    bind:isOpen={isMenuModalOpen}
    title={title}
    menuItems={menuItems}
  />
</div>

<style>
  /* Optional: Add smooth height animation */
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }
</style>