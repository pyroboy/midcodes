<script lang="ts">
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';

const images = [
  "https://ucarecdn.com/0ff3b3b7-da02-425c-9941-7d17707cf88f/-/preview/1294x2000/-/quality/smart/",
  "https://ucarecdn.com/a6095a9e-807f-4f89-b9e3-a18de617fa90/-/preview/1294x2000/-/quality/smart/"
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