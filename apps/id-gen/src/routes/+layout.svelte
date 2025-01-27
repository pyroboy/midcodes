<script lang="ts">
  import type { LayoutProps } from './$types';
  import '../app.css';
  import { onMount } from 'svelte';
  
  let { data, children }: LayoutProps = $props();


</script>

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
