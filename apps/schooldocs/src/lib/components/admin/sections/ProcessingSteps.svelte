<script lang="ts">
  export let steps: Array<{ step: string; done: boolean }>;
  export let onToggle: (index: number) => void;
</script>

<div class="border rounded-lg bg-white flex flex-col">
  <div class="px-4 py-3 border-b bg-gray-50">
    <div class="font-medium">Processing Steps</div>
  </div>
  <div class="p-4 flex-grow">
    <div class="space-y-2">
      {#each steps as item, i}
        {@const isNextStep = i === steps.findIndex(step => !step.done)}
        <button
          on:click={() => onToggle(i)}
          class={`flex items-center gap-2 px-3 py-2 rounded w-full transition-all duration-150 
            ${item.done ? 'bg-green-50 text-green-700' : 'bg-gray-50'}
            ${isNextStep ? 'hover:bg-green-100 cursor-pointer' : ''}
            ${!isNextStep && !item.done ? 'opacity-50 cursor-not-allowed' : ''}
            ${item.done && i === steps.findIndex(step => !step.done) - 1 ? 'hover:bg-red-50 hover:text-red-700' : ''}`}
        >
          <div class={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors
            ${item.done ? 'border-green-500' : isNextStep ? 'border-green-300' : 'border-gray-300'}`}
          >
            {#if item.done}
              <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            {/if}
          </div>
          {item.step}
        </button>
      {/each}
    </div>
  </div>
</div>