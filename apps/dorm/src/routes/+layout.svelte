<script lang="ts">
  import type { LayoutProps } from './$types';
  import '../app.css';
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";

  // Importing Lucide icons
  import Building from "lucide-svelte/icons/building";
  import Home from "lucide-svelte/icons/home";
  import Layers from "lucide-svelte/icons/layers";
  import Gauge from "lucide-svelte/icons/gauge";
  import Users from "lucide-svelte/icons/users";
  import FileText from "lucide-svelte/icons/file-text";
  import CreditCard from "lucide-svelte/icons/credit-card";
  import List from "lucide-svelte/icons/list";
  // import FileChart from "lucide-svelte/icons/file-chart";

  let { data, children }: LayoutProps = $props();

  // Updated navigation links with icons
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
        { href: '/monthly-reports', label: 'Monthly Reports', icon: CreditCard },
      ],
    },
  ];
</script>

<Sidebar.Provider>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <Sidebar.Root collapsible="icon">
      <!-- Sidebar Header -->
      <Sidebar.Header>
        <div class="p-4 font-bold text-lg">My App</div>
      </Sidebar.Header>
      
      <!-- Sidebar Content with Navigation Groups -->
      <Sidebar.Content>
        {#each navigationLinks as group (group.category)}
          <Sidebar.Group>
            <Sidebar.GroupLabel>{group.category}</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each group.links as link (link.href)}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton>
                      {#snippet child({ props })}
                        <a
                          href={link.href}
                          {...props}
                          class="flex items-center space-x-2"
                        >
                          <link.icon class="w-5 h-5" />
                          <span>{link.label}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                {/each}
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        {/each}
      </Sidebar.Content>

      <!-- Sidebar Footer -->
      <Sidebar.Footer>
        <div class="p-4 text-sm">Footer</div>
      </Sidebar.Footer>
    </Sidebar.Root>

    <!-- Main Content Area -->
    <main class="flex-1 p-4 bg-gray-50">
      <Sidebar.Trigger />
      {@render children()}
    </main>
  </div>
</Sidebar.Provider>
