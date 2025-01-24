<script lang="ts">
  export let currentPath: string;
</script>

<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
  <a
    href="/admin/staff"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/staff'}
  >
    Print Requests
  </a>
  <a
    href="/admin/staff/history"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/staff/history'}
  >
    Print History
  </a>
</div>