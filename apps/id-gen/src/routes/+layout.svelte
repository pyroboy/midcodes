<script lang="ts">
  // Define our own LayoutProps interface since the $types import is missing
  interface LayoutProps {
    data: any;
    children: any;
  }
  
  import '../app.css';
  import { onMount } from 'svelte';
  import { loadGoogleFonts } from '$lib/config/fonts';
  
  let { data, children }: LayoutProps = $props();

  onMount(async () => {
    try {
      await loadGoogleFonts();
    } catch (error) {
      console.error('Failed to load fonts:', error);
    }
  });
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com" rel="preconnect">
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Playfair+Display:wght@400;500;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-background">
    {#if data.user}
    <nav class="bg-gray-800 text-white">
        <div class="container mx-auto px-4">
            <div class="flex justify-between items-center h-16">
                <div class="text-xl font-bold">ID Generator</div>
                <div class="flex space-x-4">
                    <a href="/" class="px-3 py-2 rounded hover:bg-gray-700">Home</a>
                    <a href="/all-ids" class="px-3 py-2 rounded hover:bg-gray-700">All IDs</a>
                    <a href="/templates" class="px-3 py-2 rounded hover:bg-gray-700">Templates</a>
                    <form method="POST" action="/auth/signout" class="inline">
                        <button type="submit" class="px-3 py-2 rounded hover:bg-gray-700">Sign Out</button>
                    </form>
                </div>
            </div>
        </div>
    </nav>
    {/if}

    <main>
      {@render children()}
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
</style>
