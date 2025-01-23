<!-- +layout.svelte -->
<script lang="ts">
  import { base } from "$app/paths";
  import "../app.css";
  import { slide } from 'svelte/transition';
  import { onMount } from 'svelte';



// Use $props() without type argument
let { children } = $props();
let isMenuOpen = $state(false);
let hasScrolled = $state(false);
let isHeroVisible = $state(true);
let maxBeats = $state(2);
let currentBeats = $state(0);
let logoElement: HTMLImageElement | null = null;

const toggleMenu = () => isMenuOpen = !isMenuOpen;
const closeMenu = () => isMenuOpen = false;
const handleScroll = () => {
  hasScrolled = window.scrollY > 20;
  // Check if we're at the top of the page (hero section)
  isHeroVisible = window.scrollY < window.innerHeight * 0.5;
};
  // Handle animation iteration counting
  onMount(() => {
    if (logoElement) {
      logoElement.addEventListener('animationiteration', () => {
        currentBeats++;
        if (currentBeats >= maxBeats) {
          logoElement!.style.animation = 'none';
        }
      });
    }
  });

  // Function to restart animation on hover
  const restartAnimation = () => {
    currentBeats = 0;
    if (logoElement) {
      // Remove any existing animation styles before restarting
      logoElement.style.animation = '';
      logoElement.style.animationDelay = '0s';

      // Add the animation class back to trigger the animation restart
      logoElement.classList.add('beating-heart');
    }
  };
</script>

<svelte:window on:scroll={handleScroll} />

<nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {hasScrolled ? 'bg-white/90 backdrop-blur-sm shadow-sm' : 'bg-gradient-to-b from-[#32949199] to-transparent'} {isHeroVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}"
>  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-20">
      <a href="{base}/" class="flex items-center" onmouseenter={restartAnimation}>
        <img 
          bind:this={logoElement}
          src="https://ucarecdn.com/58c1e01e-1959-4f3a-bd04-00aed947f020/-/preview/200x200/" 
          alt="Logo" 
          class="h-12 md:h-24 w-auto beating-heart object-cover -mb-2 md:-mb-10" 
        />
      </a>
      
      <button 
        class="md:hidden p-2 {hasScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white'}"
        onclick={toggleMenu}
        aria-label="Toggle menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {#if isMenuOpen}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          {/if}
        </svg>
      </button>

      <ul class="hidden md:flex space-x-8">
        <li><a href="{base}/about" class="transition-colors {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}">About</a></li>
        <li><a href="{base}/cv" class="transition-colors {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}">Priorities</a></li>
        <li><a href="{base}/#priorities" class="transition-colors {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}">Events</a></li>
        <li><a href="{base}/#biography" class="transition-colors {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}">Contact</a></li>
      </ul>
    </div>

    {#if isMenuOpen}
      <div class="md:hidden py-4 {hasScrolled ? 'border-t border-gray-200 bg-white/90 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'}" transition:slide>
        <ul class="space-y-4">
          <li><a href="{base}/about" class="block px-2 py-1 {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}" onclick={closeMenu}>About</a></li>
          <li><a href="{base}/cv" class="block px-2 py-1 {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}" onclick={closeMenu}>Priorities</a></li>
          <li><a href="{base}/#priorities" class="block px-2 py-1 {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}" onclick={closeMenu}>Events</a></li>
          <li><a href="{base}/#biography" class="block px-2 py-1 {hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}" onclick={closeMenu}>Contact</a></li>
        </ul>
      </div>
    {/if}
  </div>
</nav>

{@render children()}

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  .beating-heart {
    animation: heartBeat 1.2s ease-in-out infinite;
    transform-origin: center;
  }

  @keyframes heartBeat {
    0% {
      transform: scale(1);
    }
    14% {
      transform: scale(1.2);
    }
    28% {
      transform: scale(1);
    }
    42% {
      transform: scale(1.2);
    }
    70% {
      transform: scale(1);
    }
    100% {
      transform: scale(1);
    }
  }
</style>