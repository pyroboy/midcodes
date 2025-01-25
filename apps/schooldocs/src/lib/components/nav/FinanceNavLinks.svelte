<script lang="ts">
  export let currentPath: string;
</script>

<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
  <a
    href="/admin/finance/dashboard"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/finance/dashboard'}
  >
    Overview
  </a>
  <a
    href="/admin/finance/payments"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/finance/payments'}
  >
    Payments
  </a>
  <a
    href="/admin/finance/reports"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/admin/finance/reports'}
  >
    Reports
  </a>
</div>