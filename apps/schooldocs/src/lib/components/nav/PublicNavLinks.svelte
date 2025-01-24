<script lang="ts">
  export let currentPath: string;
</script>

<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
  <a
    href="/request"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/request'}
  >
    Request Transcript
  </a>
  <a
    href="/status"
    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    class:border-indigo-500={currentPath === '/status'}
  >
    Check Status
  </a>
</div>