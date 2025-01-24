<script lang="ts">
  export let currentPath: string;
</script>

<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
  <a
    href="/admin/dashboard"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/dashboard'}
  >
    Dashboard
  </a>
  <a
    href="/admin/orders"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/orders'}
  >
    Requests
  </a>
  <a
    href="/admin/students"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/students'}
  >
    Students
  </a>
  <a
    href="/admin/document-types"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/document-types'}
  >
    Document Types
  </a>
</div>