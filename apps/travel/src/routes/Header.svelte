<script>
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } from '../stores/mobileMenuStore';
  import { fade, slide } from 'svelte/transition';
  import { NAVIGATION_LINKS } from '$lib/constants';
  import { preloadStatus } from '../stores/navigationStore';
  let isScrolled = false;


  if (browser) {
    window.addEventListener('scroll', () => {
      isScrolled = window.scrollY > 50;
    });
  }
</script>

<header class={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent`}>
  <div class="absolute top-0 left-0 right-0 max-w-[1400px] mx-auto flex justify-between items-center px-4 md:px-8 py-4">
    <div class="flex items-center gap-3">
      <a href="/" class="z-50">
        <img src="https://i.ibb.co/9q9XKrt/clipart1133673.png" alt="logo" class="h-10">
      </a>
      <div class={`flex flex-col ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
        <span class="text-lg font-semibold leading-tight">Cabilao</span>
        <span class="text-lg font-semibold leading-tight">Cliff Dive Resort</span>
      </div>
    </div>

    <button 
      class="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 backdrop-blur z-50" 
      on:click={toggleMobileMenu} 
      aria-label="Toggle menu"
    >
      <div class="relative w-6 h-6">
        <span class={`absolute top-1/2 left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
          $isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'
        }`}></span>
        <span class={`absolute top-1/2 left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
          $isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
        }`}></span>
        <span class={`absolute top-1/2 left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
          $isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'
        }`}></span>
      </div>
    </button>

    <!-- Mobile Menu -->
    <div class="lg:hidden fixed inset-0 flex items-center justify-center" class:hidden={!$isMobileMenuOpen}>
      {#if $isMobileMenuOpen}
        <nav 
          class="p-4 w-[85%] sm:w-[70%] max-w-[300px] bg-white shadow-lg flex flex-col items-center"
          in:slide={{ duration: 300, delay: 100 }}
          out:slide={{ duration: 300 }}
        >
          {#each NAVIGATION_LINKS as [path, label]}
            <a
              href={path}
              data-sveltekit-preload-data
              on:click={closeMobileMenu}
              class="block text-sm font-medium tracking-wider transition-colors text-gray-800 px-4 py-4 border-b border-gray-200 text-center w-full hover:text-blue-600"
              class:text-blue-600={page.url.pathname === path}
            >
              {label}
            </a>
          {/each}
        </nav>
      {/if}
    </div>

    <!-- Desktop Menu -->
    <nav class="hidden lg:flex gap-6 xl:gap-10">
      {#each NAVIGATION_LINKS as [path, label]}
        <div class="relative">
          <a
            href={path}
            data-sveltekit-preload-data
            class={`text-base font-medium tracking-wider transition-colors
              ${isScrolled ? 'text-gray-800' : 'text-white'} 
              ${page.url.pathname === path ? 'text-blue-600' : ''}
              hover:text-blue-600`}
          >
            {label}
          </a>
          {#if $preloadStatus.get(path) === 'loading'}
            <div 
              class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600/50"
              transition:slide={{ axis: 'x', duration: 200 }}
            ></div>
          {/if}
        </div>
      {/each}
    </nav>

    <div class="hidden lg:flex gap-4 items-center">
      <a 
        href="https://wa.me/yourphonenumber" 
        class={`px-4 py-2 font-medium tracking-wider rounded transition-colors
          ${isScrolled ? 'text-gray-800' : 'text-white'} 
          hover:text-blue-600`}
      >
        WHATSAPP
      </a>
    </div>
  </div>
</header>