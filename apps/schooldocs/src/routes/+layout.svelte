<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  
  let isAdmin = false;
  
  onMount(() => {
    // TODO: Implement authentication and role check
    // This will be replaced with actual auth logic
    isAdmin = $page.url.pathname.startsWith('/admin');
  });
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white shadow-sm">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-xl font-bold text-gray-900">Transcript System</a>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            {#if isAdmin}
              <a
                href="/admin/dashboard"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Dashboard
              </a>
              <a
                href="/admin/orders"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Requests
              </a>
            {:else}
              <a
                href="/request"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Request Transcript
              </a>
              <a
                href="/status"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Check Status
              </a>
            {/if}
          </div>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <!-- Add authentication UI components here -->
        </div>
      </div>
    </nav>
  </header>

  <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <slot />
  </main>

  <footer class="bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Transcript System. All rights reserved.
      </p>
    </div>
  </footer>
</div>
