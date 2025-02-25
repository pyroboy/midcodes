<script lang="ts">
  import type { LayoutProps } from './$types';
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto, preloadData } from '$app/navigation';
  import { page } from '$app/stores';
  // import { Toaster } from "$lib/components/ui/sonner";
  let { data, children }: LayoutProps = $props();
  let isLocationsOpen = $state(false);
  let isRentManagementOpen = $state(false);

  const navigationLinks = {
    locations: [
      { href: '/properties', label: 'Properties' },
      { href: '/rental-unit', label: 'Rental Units' },
      { href: '/floors', label: 'Floors' },
      { href: '/meters', label: 'Meters' },
    ],
    rentManagement: [
      { href: '/tenants', label: 'Tenants' },
      { href: '/leases', label: 'Leases' },
      { href: '/readings', label: 'Readings' },
      // { href: '/overview', label: 'Overview/Monthly' },
      // { href: '/accounts', label: 'Accounts' }
    ]
  };
  
  function toggleLocations() {
    isLocationsOpen = !isLocationsOpen;
    isRentManagementOpen = false; // Close other dropdown
  }

  function toggleRentManagement() {
    isRentManagementOpen = !isRentManagementOpen;
    isLocationsOpen = false; // Close other dropdown
  }
  
  // Close dropdowns when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const locationsDropdown = document.getElementById('locations-dropdown');
    const rentManagementDropdown = document.getElementById('rent-management-dropdown');
    
    if (!locationsDropdown?.contains(event.target as Node) && 
        !rentManagementDropdown?.contains(event.target as Node)) {
      isLocationsOpen = false;
      isRentManagementOpen = false;
    }
  }
  
  onMount(() => {
    const allLinks = [
      ...navigationLinks.locations,
      ...navigationLinks.rentManagement,
      // { href: '/auth', label: 'Auth' },
      // { href: '/auth/signout', label: 'Sign out' }
    ];

    // Preload all routes in parallel
    Promise.all(
      allLinks.map(link => preloadData(link.href))
    );

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Helper function to check if link is active
  const isActive = (href: string) => {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  };
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Navbar -->
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <!-- Left side - Brand and Navigation -->
        <div class="flex-shrink-0 flex items-center space-x-6">
          <a href="/" class="text-xl font-bold text-gray-900">
            Your App
          </a>
          
          <!-- Locations Dropdown -->
          <div class="relative" id="locations-dropdown">
            <button
              onclick={toggleLocations}
              onmouseenter={toggleLocations}
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Locations
              <svg
                class="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d={isLocationsOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                />
              </svg>
            </button>

            {#if isLocationsOpen}
              <div
                class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div class="py-1">
                  {#each navigationLinks.locations as link}
                    <a
                      href={link.href}
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 {isActive(link.href) ? 'bg-gray-100 text-blue-600 font-medium' : ''}"
                    >
                      {link.label}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- Rent Management Dropdown -->
          <div class="relative" id="rent-management-dropdown">
            <button
              onclick={toggleRentManagement}
              onmouseenter={toggleRentManagement}
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              Rent Management
              <svg
                class="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d={isRentManagementOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                />
              </svg>
            </button>

            {#if isRentManagementOpen}
              <div
                class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div class="py-1">
                  {#each navigationLinks.rentManagement as link}
                    <a
                      href={link.href}
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 {isActive(link.href) ? 'bg-gray-100 text-blue-600 font-medium' : ''}"
                    >
                      {link.label}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Right side - User info -->
        {#if data.user}
          <div class="flex items-center space-x-4">
            <div class="text-sm">
              <p class="text-gray-700">
                {data.user.email}
              </p>
              {#if data.decodedToken?.user_roles}
                <p class="text-gray-500 text-xs">
                  Roles: {data.decodedToken.user_roles.join(', ')}
                </p>
              {/if}
            </div>
            <a
              href="/auth/signout"
              class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign out
            </a>
          </div>
        {:else}
          <a
            href="/auth"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign in
          </a>
        {/if}
      </div>
    </div>
  </nav>
  <!-- <Toaster 
    theme="system" 
    richColors
    expand={true}
    closeButton
  /> -->
  <!-- Main content -->
  <main>

    {@render children()}
  </main>
</div>