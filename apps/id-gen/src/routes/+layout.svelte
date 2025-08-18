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
                    {#if data.user && data.user.app_metadata && data.user.app_metadata.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(data.user.app_metadata.role)}
                        <a href="/admin" class="px-3 py-2 rounded hover:bg-gray-700 bg-gray-700 text-yellow-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Admin
                        </a>
                    {/if}
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
