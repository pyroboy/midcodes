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

<!-- Logo Container - Separate from Nav -->
<div class="fixed top-0 left-0 z-[9999] p-4 transition-opacity duration-300
  {$scrollState.hasScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
  <a href="/" class="block relative" on:mouseenter={restartAnimation}>
    <img 
      bind:this={logoElement}
      src="https://ucarecdn.com/58c1e01e-1959-4f3a-bd04-00aed947f020/-/preview/200x200/" 
      alt="Logo" 
      class="h-12 md:h-24 w-auto beating-heart object-cover" 
      on:load={handleLogoLoad}
      style="position: relative; z-index: 9999;"
    />
  </a>
</div>

<nav class="fixed md:top-0 bottom-0 md:bottom-auto left-0 right-0 z-40 
  {$scrollState.hasScrolled ? 'bg-white/90 backdrop-blur-sm shadow-sm' : 'bg-gradient-to-b from-[#32949199] to-transparent'} 
  {$scrollState.isHeroVisible ? 'md:opacity-0 md:pointer-events-none' : 'opacity-100'}"
>
  <div class="container mx-auto px-4 max-w-7xl">
    <!-- Desktop Navigation -->
    <div class="hidden md:flex items-center justify-end h-20">
      <ul class="flex space-x-8 items-center">
        {#each links as link}
          <li>
            <a 
              href={link.path} 
              class="transition-colors whitespace-nowrap {$scrollState.hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'}"
            >
              {link.text}
            </a>
          </li>
        {/each}
      </ul>
    </div>

    <!-- Mobile Navigation -->
    <div class="md:hidden transition-all duration-300 overflow-hidden" 
      class:opacity-100={$scrollState.isHeroVisible} 
      class:pointer-events-none={!$scrollState.isHeroVisible}>
      <div class="relative">
        <!-- Hamburger Menu Button -->
        <button
          on:click={toggleMenu}
          class="absolute top-4 right-4 z-50 p-2 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            class="w-6 h-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {#if isMenuOpen}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            {:else}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            {/if}
          </svg>
        </button>

        <!-- Mobile Menu Items -->
        {#if isMenuOpen}
          <div
            class="overflow-hidden"
            transition:slide={{ duration: 200 }}
          >
            <div class="py-4 px-4 {$scrollState.hasScrolled ? 'border-t border-gray-200 bg-white/90 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'}">
              <ul class="space-y-4">
                {#each links as link}
                  <li>
                    <a 
                      href={link.path} 
                      class="block py-2 {$scrollState.hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}"
                      on:click={closeMenu}
                    >
                      {link.text}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}

        <!-- Bottom Navigation Bar -->
        <div class="flex items-center justify-around h-16 {$scrollState.hasScrolled ? 'bg-[#32949199] backdrop-blur-sm' : ''}">
          {#each links as link}
            <a 
              href={link.path} 
              class="flex-1 text-center py-4 text-sm whitespace-nowrap px-2 {$scrollState.hasScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-white/80'}"
            >
              {link.text}
            </a>
          {/each}
        </div>
      </div>
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

  /* Handle overflow on mobile */
  :global(body) {
    overflow-x: hidden;
  }

  nav {
    max-width: 100vw;
    overflow-x: hidden;
  }
</style>