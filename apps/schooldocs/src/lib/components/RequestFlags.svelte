<script lang="ts">
  import { BLOCKING_FLAGS, NON_BLOCKING_FLAGS, requestFlags } from '@/stores/request-flags';

  export let referenceNumber: string;

  const blockingFlagOptions = Object.entries(BLOCKING_FLAGS).map(([code]) => ({
    code,
    label: code.split('_').join(' ')
  }));

  const nonBlockingFlagOptions = Object.entries(NON_BLOCKING_FLAGS).map(([code]) => ({
    code,
    label: code.split('_').join(' ')
  }));

  function handleBlockingFlagChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      // Remove any existing blocking flag first
      const existingBlockingFlag = flags.find(f => f.type === 'BLOCKING');
      if (existingBlockingFlag) {
        requestFlags.removeFlag(referenceNumber, existingBlockingFlag.code);
      }
      requestFlags.addFlag(referenceNumber, 'BLOCKING', select.value);
      select.value = '';
    }
  }

  function handleNonBlockingFlagChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      // Remove any existing non-blocking flag first
      const existingNonBlockingFlag = flags.find(f => f.type === 'NON_BLOCKING');
      if (existingNonBlockingFlag) {
        requestFlags.removeFlag(referenceNumber, existingNonBlockingFlag.code);
      }
      requestFlags.addFlag(referenceNumber, 'NON_BLOCKING', select.value);
      select.value = '';
    }
  }

  function removeFlag(flagCode: string) {
    requestFlags.removeFlag(referenceNumber, flagCode);
  }

  $: flags = $requestFlags[referenceNumber] || [];
  $: blockingFlag = flags.find(f => f.type === 'BLOCKING');
  $: nonBlockingFlag = flags.find(f => f.type === 'NON_BLOCKING');
</script>

<div class="space-y-4">
  <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
    <!-- Blocking Flags Dropdown -->
    <div class="flex-1">
      <label for="blocking-flags" class="block text-sm font-medium text-gray-700 mb-1">
        Blocking Flag
      </label>
      <select
        id="blocking-flags"
        class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        on:change={handleBlockingFlagChange}
        disabled={!!blockingFlag}
      >
        <option value="">Set blocking flag...</option>
        {#each blockingFlagOptions as flag}
          <option value={flag.code}>{flag.label}</option>
        {/each}
      </select>
    </div>

    <!-- Non-blocking Flags Dropdown -->
    <div class="flex-1">
      <label for="non-blocking-flags" class="block text-sm font-medium text-gray-700 mb-1">
        Non-blocking Flag
      </label>
      <select
        id="non-blocking-flags"
        class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        on:change={handleNonBlockingFlagChange}
        disabled={!!nonBlockingFlag}
      >
        <option value="">Set non-blocking flag...</option>
        {#each nonBlockingFlagOptions as flag}
          <option value={flag.code}>{flag.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Active Flags -->
  <div class="mt-4 space-y-2">
    {#if blockingFlag}
      <div class="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
        <div class="flex items-center gap-2">
          <span class="text-red-600 font-medium">
            {blockingFlag.code.split('_').join(' ')}
          </span>
        </div>
        <button
          type="button"
          class="text-red-400 hover:text-red-500"
          on:click|stopPropagation={() => removeFlag(blockingFlag.code)}
        >
          <span class="sr-only">Remove blocking flag</span>
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    {/if}

    {#if nonBlockingFlag}
      <div class="flex items-center justify-between gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
        <div class="flex items-center gap-2">
          <span class="text-yellow-600 font-medium">
            {nonBlockingFlag.code.split('_').join(' ')}
          </span>
        </div>
        <button
          type="button"
          class="text-yellow-400 hover:text-yellow-500"
          on:click|stopPropagation={() => removeFlag(nonBlockingFlag.code)}
        >
          <span class="sr-only">Remove non-blocking flag</span>
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
</div>