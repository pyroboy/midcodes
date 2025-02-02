<script lang="ts">
  import { slide } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { scrollState } from '$lib/stores/scrollStore';

  let isMenuOpen = false;
  let maxBeats = 2;
  let currentBeats = 0;
  let logoElement: HTMLImageElement | null = null;

  const links = [
    { path: '/about', text: 'About' },
    { path: '/cv', text: 'Programs' },
    { path: '/', text: 'Contact' }
  ];

  const toggleMenu = () => isMenuOpen = !isMenuOpen;
  const closeMenu = () => isMenuOpen = false;
  
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

  const restartAnimation = () => {
    currentBeats = 0;
    if (logoElement) {
      logoElement.style.animation = '';
    }
  };

  const handleLogoLoad = (event: Event) => {
    logoElement = event.target as HTMLImageElement;
  };
</script>

<nav class="fixed md:top-0 bottom-0 md:bottom-auto left-0 right-0 z-50 transition-all duration-300 
  {$scrollState.hasScrolled ? 'bg-white/90 backdrop-blur-sm shadow-sm' : 'bg-gradient-to-b from-[#32949199] to-transparent'} 
  {$scrollState.isHeroVisible ? 'md:opacity-0 md:pointer-events-none' : 'opacity-100'}"
>
  <div class="container">
    <!-- Desktop Navigation -->
    <div class="hidden md:flex items-center justify-between h-20">
      <a href="/" class="flex items-center" onmouseenter={restartAnimation}>
        <img 
          bind:this={logoElement}
          src="https://ucarecdn.com/58c1e01e-1959-4f3a-bd04-00aed947f020/-/preview/200x200/" 
          alt="Logo" 
          class="h-12 md:h-24 w-auto beating-heart object-cover -mb-2 md:-mb-10" 
          onload={handleLogoLoad}
        />
      </a>
      <ul class="flex space-x-8">
        {#each links as link}
          <li>
            <a 
              href={link.path} 
              class="transition-colors {$scrollState.hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}"
            >
              {link.text}
            </a>
          </li>
        {/each}
      </ul>
    </div>

    <!-- Mobile Navigation -->
    <div class="md:hidden transition-all duration-300" class:opacity-100={$scrollState.isHeroVisible} class:pointer-events-none={$scrollState.isHeroVisible}>
      {#if isMenuOpen}
        <div class="py-4 {$scrollState.hasScrolled ? 'border-t border-gray-200 bg-white/90 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'}" 
          transition:slide={{ duration: 200 }}>
          <ul class="space-y-4">
            {#each links as link}
              <li>
                <a 
                  href={link.path} 
                  class="block px-2 py-1 {$scrollState.hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}" 
                  onclick={closeMenu}
                >
                  {link.text}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="flex items-center justify-around h-16 {$scrollState.hasScrolled ? 'bg-[#32949199] backdrop-blur-sm' : 'hidden'}">
          {#each links as link}
            <a 
              href={link.path} 
              class="flex-1 text-center py-4 {$scrollState.hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}"
            >
              {link.text}
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</nav>

<style>
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
