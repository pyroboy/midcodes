<script lang="ts">
  import type { PageData } from './$types';
  import { RoleConfig, type UserRole, type AllowedPath } from '$lib/auth/roleConfig';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const role = (data.profile?.role || 'property_admin') as UserRole;
  const roleConfig = RoleConfig[role];
  const allowedPaths: AllowedPath[] = roleConfig.allowedPaths
    .filter((path: AllowedPath) => path.path.startsWith('/dorm/') && path.showInNav)
    .sort((a: AllowedPath, b: AllowedPath) => (a.label || '').localeCompare(b.label || ''));

  // Get the current section from the URL
  let currentPath = $derived($page.url.pathname);
  let currentSection = $derived(currentPath.split('/')[2] || 'overview');
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Welcome Section -->
  <div class="card-content bg-white rounded-lg shadow-md p-6 mb-8">
    <h1 class="text-3xl font-bold mb-2">Welcome to Dorm Management</h1>
    <p class="text-gray-600">Role: {roleConfig.label}</p>
  </div>

  <!-- Navigation Section -->
  {#if allowedPaths.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each allowedPaths as item}
        <Card.Root class="hover:bg-accent transition-colors">
          <a href={item.path} class="block">
            <Card.Header>
              <Card.Title>{item.label}</Card.Title>
            </Card.Header>
          </a>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
