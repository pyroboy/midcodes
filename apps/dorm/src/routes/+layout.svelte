<script lang="ts">
  import { getContext } from 'svelte';
  import type { LayoutProps } from './$types';
  import '../app.css';
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  
  // Import Lucide icons
  import Building from "lucide-svelte/icons/building";
  import Home from "lucide-svelte/icons/home";
  import Layers from "lucide-svelte/icons/layers";
  import Gauge from "lucide-svelte/icons/gauge";
  import Users from "lucide-svelte/icons/users";
  import FileText from "lucide-svelte/icons/file-text";
  import CreditCard from "lucide-svelte/icons/credit-card";
  import List from "lucide-svelte/icons/list";
  import LogOut from "lucide-svelte/icons/log-out";
  import User from "lucide-svelte/icons/user";

  let { data, children }: LayoutProps = $props();

  // Navigation links with icons
  const navigationLinks = [
    {
      category: 'Locations',
      links: [
        { href: '/properties', label: 'Properties', icon: Building },
        { href: '/rental-unit', label: 'Rental Units', icon: Home },
        { href: '/floors', label: 'Floors', icon: Layers },
        { href: '/meters', label: 'Meters', icon: Gauge },
      ],
    },
    {
      category: 'Rent Management',
      links: [
        { href: '/tenants', label: 'Tenants', icon: Users },
        { href: '/leases', label: 'Leases', icon: FileText },
        { href: '/utility-billings', label: 'Utilities', icon: CreditCard },
        { href: '/penalties', label: 'Penalties', icon: List },
      ],
    },
    {
      category: 'Finance',
      links: [
        { href: '/transactions', label: 'Transactions', icon: CreditCard },
        { href: '/expenses', label: 'Expenses', icon: FileText },
      ],
    },
    {
      category: 'Reports',
      links: [
        { href: '/reports', label: 'Monthly Reports', icon: CreditCard },
        { href: '/lease-report', label: 'Lease Reports', icon: CreditCard },
      ],
    },
  ];

  // Define a type for the sidebar context
  type SidebarContext = {
    collapsed?: boolean;
    // Add any other properties that might be in the context
  };

  // Retrieve the sidebar context to determine if the sidebar is collapsed.
  // (This example assumes your Sidebar component sets a context with the key 'SidebarContext'
  // that contains a `collapsed` boolean. Adjust if your implementation differs.)
  const sidebarContext = getContext<SidebarContext>('SidebarContext') || { collapsed: false };
  let isCollapsed = sidebarContext.collapsed;
</script>

<Sidebar.Provider>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <Sidebar.Root collapsible="icon" class="shrink-0">
      <!-- Sidebar Header -->
      <Sidebar.Header>
        <div class="p-4 font-bold text-lg">Dorm Management</div>
      </Sidebar.Header>
      
      <!-- Sidebar Content with Navigation Groups -->
      <Sidebar.Content>
        {#each navigationLinks as group (group.category)}
          <Sidebar.Group>
            <Sidebar.GroupLabel>{group.category}</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each group.links as link (link.href)}
                  <a href={link.href} class="block no-underline">
                    <Sidebar.MenuItem>
                      <Sidebar.MenuButton>
                        {#if isCollapsed}
                          <!-- When collapsed: show just the icon with a tooltip -->
                          <div class="tooltip" data-tooltip={link.label}>
                            <link.icon class="h-5 w-5" />
                          </div>
                        {:else}
                          <!-- When expanded: show the icon and label -->
                          <div class="flex items-center gap-2">
                            <link.icon class="h-5 w-5" />
                            <span>{link.label}</span>
                          </div>
                        {/if}
                      </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  </a>
                {/each}
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        {/each}
      </Sidebar.Content>

      <!-- Sidebar Footer with Auth Status -->
      <Sidebar.Footer>
        <div class="p-4 border-t border-gray-200">
          {#if data.session}
            <div class="flex flex-col space-y-3">
              <div class="flex items-center space-x-2 text-sm">
                <User class="w-4 h-4 text-gray-500" />
                <span class="text-gray-700">{data.user?.email || 'Logged in'}</span>
              </div>
              <a 
                href="/auth/signout" 
                class="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800"
              >
                <LogOut class="w-4 h-4" />
                <span>Sign out</span>
              </a>
            </div>
          {:else}
            <a 
              href="/auth" 
              class="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <User class="w-4 h-4" />
              <span>Sign in</span>
            </a>
          {/if}
        </div>
      </Sidebar.Footer>
      
      <!-- Sidebar Rail to enable proper collapsible interaction -->
      <Sidebar.Rail />
    </Sidebar.Root>

    <!-- Main Content Area -->
    <main class="flex-1 p-4 md:p-6 overflow-auto">
      <div class="flex items-center mb-4">
        <Sidebar.Trigger />
      </div>
      <div class="container mx-auto max-w-7xl">
        {@render children()}
      </div>
    </main>
  </div>
</Sidebar.Provider>
