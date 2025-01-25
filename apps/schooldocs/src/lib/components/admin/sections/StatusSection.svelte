<script lang="ts">
  export let hasBlockingFlag: boolean;
  export let hasNonBlockingFlag: boolean;
  export let blockingFlag: string;
  export let nonBlockingFlag: string;
  export let completedSteps: number;
  export let totalSteps: number;
  export let flagNotes: string;
</script>

<div class="border rounded-lg">
  <div class={`${hasBlockingFlag ? 'bg-red-50' : 'bg-white'} px-4 py-3`}>
    <div class="flex justify-between items-center mb-2">
      <div class="flex items-center gap-3">
        {#if hasBlockingFlag}
          <svg class="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-medium text-red-600">{blockingFlag}</span>
        {:else}
          <div class="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin"></div>
          <span class="font-medium text-gray-900">Processing document request</span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if hasNonBlockingFlag}
          <span class="bg-yellow-100 px-3 py-1 rounded text-yellow-700 text-sm">
            {nonBlockingFlag}
          </span>
        {/if}
      </div>
    </div>
    <div class="flex justify-between items-center">
      <div class="text-gray-600">
        {completedSteps} of {totalSteps} steps completed
      </div>
      {#if flagNotes}
        <div class="text-sm text-gray-600 italic">
          Note: {flagNotes}
        </div>
      {/if}
    </div>
  </div>
</div>