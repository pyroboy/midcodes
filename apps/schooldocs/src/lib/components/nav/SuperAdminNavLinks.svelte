<script lang="ts">
  export let currentPath: string;
</script>

<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
  <a
    href="/admin/super/dashboard"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/super/dashboard'}
  >
    Overview
  </a>
  <a
    href="/admin/super/organizations"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/super/organizations'}
  >
    Organizations
  </a>
  <a
    href="/admin/super/users"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/super/users'}
  >
    Users
  </a>
  <a
    href="/admin/super/settings"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/super/settings'}
  >
    Settings
  </a>
</div>