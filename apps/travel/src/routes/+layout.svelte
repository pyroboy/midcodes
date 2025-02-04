<script>
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';
  import '../app.css';
  import { isMobileMenuOpen } from '../stores/mobileMenuStore';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { preloadAllPages, preloadStatus } from '../stores/navigationStore';
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();

  // onMount(() => {
  //   preloadAllPages();
  // });
</script>

<div class="app">
  <!-- Loading indicator -->
  {#if $preloadStatus.size > 0 && [...$preloadStatus.values()].some(status => status !== 'loaded')}
  <div class="fixed top-0 left-0 right-0 h-0.5 bg-gray-200 z-[60]">
    <div 
      class="h-full bg-blue-600 transition-all duration-300"
      style:width={`${[...$preloadStatus.values()].filter(status => status === 'loaded').length / $preloadStatus.size * 100}%`}
    ></div>
  </div>
{/if}

  {#if $isMobileMenuOpen}
    <div 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      transition:fade={{ duration: 200 }}
    ></div>
  {/if}
  <Header />
  <main class="transition-all duration-300" class:blur-sm={$isMobileMenuOpen}>
    {@render children?.()}
  </main>
  <Footer />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
  }
</style>