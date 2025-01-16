<script lang="ts">
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';

const images = [
  "https://ucarecdn.com/d81c3753-7284-42f7-a4d1-f28f8064390e/-/preview/647x1000/",
  "https://ucarecdn.com/1b8104c8-28fe-4104-af40-74688ce4a392/-/preview/783x999/"
];

let mounted = $state(false);
let showImages = $state(false);
let isMobile = $state(false);

onMount(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  mounted = true;
  return () => window.removeEventListener('resize', checkMobile);
});

function checkMobile() {
  isMobile = window.innerWidth < 768;
}

function toggleView() {
  showImages = !showImages;
  if(!showImages) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
</script>

<div class="container mx-auto px-4 py-24 min-h-screen relative">
  <div class="grid grid-cols-1 gap-8 mb-24">
    <!-- Images Column -->
      <div class="space-y-4 transition-all duration-500"
           transition:fly={{ y: 50, duration: 500 }}>
        {#each images as img, i}
          <div class="relative overflow-hidden rounded-xl shadow-xl">
            <img 
              src={img} 
              alt="Profile" 
              class="w-full hover:scale-[1.02] transition-all duration-300"
              loading="lazy"
            />
          </div>
        {/each}
      </div>


  </div>

  <!-- Sticky Button -->

</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>