<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import PublicNavLinks from "$lib/components/nav/PublicNavLinks.svelte";
  import AdminNavLinks from "$lib/components/nav/AdminNavLinks.svelte";
  import StaffNavLinks from "$lib/components/nav/StaffNavLinks.svelte";
  import FinanceNavLinks from "$lib/components/nav/FinanceNavLinks.svelte";
  import SuperAdminNavLinks from "$lib/components/nav/SuperAdminNavLinks.svelte";

  let currentRole: 'public' | 'admin' | 'staff' | 'finance' | 'super-admin' = 'public';

  $: {
    if ($page.url.pathname.startsWith('/admin/super')) {
      currentRole = 'super-admin';
    } else if ($page.url.pathname.startsWith('/admin/finance')) {
      currentRole = 'finance';
    } else if ($page.url.pathname.startsWith('/admin/staff')) {
      currentRole = 'staff';
    } else if ($page.url.pathname.startsWith('/admin')) {
      currentRole = 'admin';
    } else {
      currentRole = 'public';
    }
  }

  function handleRoleChange(role: 'public' | 'admin' | 'staff' | 'finance' | 'super-admin') {
    currentRole = role;
    const paths = {
      public: '/',
      admin: '/admin/dashboard',
      staff: '/admin/staff',
      finance: '/admin/finance/dashboard',
      'super-admin': '/admin/super/dashboard'
    };
    window.location.href = paths[role];
  }
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white shadow-sm">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-xl font-bold text-gray-900">Transcript System</a>
          </div>
          
          {#if currentRole === 'public'}
            <PublicNavLinks currentPath={$page.url.pathname} />
          {:else if currentRole === 'admin'}
            <AdminNavLinks currentPath={$page.url.pathname} />
          {:else if currentRole === 'staff'}
            <StaffNavLinks currentPath={$page.url.pathname} />
          {:else if currentRole === 'finance'}
            <FinanceNavLinks currentPath={$page.url.pathname} />
          {:else}
            <SuperAdminNavLinks currentPath={$page.url.pathname} />
          {/if}
        </div>

        <div class="flex items-center space-x-4">
          <div class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                currentRole === 'public' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              on:click={() => handleRoleChange('public')}
            >
              Public
            </button>
            <button
              class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                currentRole === 'staff' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              on:click={() => handleRoleChange('staff')}
            >
              Staff
            </button>
            <button
              class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                currentRole === 'admin' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              on:click={() => handleRoleChange('admin')}
            >
              Admin
            </button>
            <button
              class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                currentRole === 'finance' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              on:click={() => handleRoleChange('finance')}
            >
              Finance
            </button>
            <button
              class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                currentRole === 'super-admin' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              on:click={() => handleRoleChange('super-admin')}
            >
              Super Admin
            </button>
          </div>
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
