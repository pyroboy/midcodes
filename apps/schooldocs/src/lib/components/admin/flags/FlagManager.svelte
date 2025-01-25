<script lang="ts">
  import FlagsList from './FlagsList.svelte';
  import FlagOptions from './FlagOptions.svelte';
  import type { FlagOption, Flags } from '$lib/types/requestTypes';
  import { createEventDispatcher } from 'svelte';

  export let flags: Flags = {
    blocking: [],
    nonBlocking: [],
    notes: ''
  };

  export let showFlagSelector: boolean;
  export let flagOptions: { blocking: FlagOption[]; nonBlocking: FlagOption[] };

  const dispatch = createEventDispatcher<{
    addFlag: { type: 'blocking' | 'nonBlocking'; flag: FlagOption };
    removeFlag: { type: 'blocking' | 'nonBlocking'; id: string };
    notesChange: { notes: string };
    toggleSelector: void;
  }>();

  function handleFlagEvent(type: 'blocking' | 'nonBlocking', flag: FlagOption) {
    dispatch('addFlag', { type, flag });
  }

  function handleFlagRemove(type: 'blocking' | 'nonBlocking', id: string) {
    dispatch('removeFlag', { type, id });
  }

  function handleNotesChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    dispatch('notesChange', { notes: target.value });
  }

  function handleToggleSelector() {
    dispatch('toggleSelector');
  }
</script>

<div class="border rounded-lg">
  {#if showFlagSelector}
    <div class="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
      <div class="font-medium">Request Flags</div>
      <button
        on:click={handleToggleSelector}
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back
      </button>
    </div>
    <div class="p-4">
      <div class="text-center text-gray-500 text-sm mt-4">
        1 Blocking - 1 Non-Blocking only
      </div>
      <div class="mt-4">
        <FlagOptions
          {flagOptions}
          {flags}
          on:addFlag={(event) => handleFlagEvent(event.detail.type, event.detail.flag)}
        />
      </div>
    </div>
  {:else}
    <div class="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
      <div class="font-medium">Request Flags</div>
      {#if flags.blocking.length === 0 || flags.nonBlocking.length === 0}
        <button
          on:click={handleToggleSelector}
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 4v16m8-8H4"/>
          </svg>
          Add Flag
        </button>
      {/if}
    </div>
    <div class="p-4">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <label for="flagNotes" class="text-sm text-gray-600">Flag Notes</label>
          <span class="text-xs text-gray-500">{flags.notes.length}/70</span>
        </div>
        <textarea
          id="flagNotes"
          name="flagNotes"
          rows="3"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Add any additional notes about the flags..."
          value={flags.notes}
          on:input={handleNotesChange}
        ></textarea>
      </div>
      {#if flags.blocking.length === 0 && flags.nonBlocking.length === 0}
        <div class="text-center text-gray-500 text-sm mt-4">
          1 Blocking - 1 Non-Blocking only
        </div>
      {/if}
      <div class="mt-4">
        <FlagsList
          {flags}
          {flagOptions}
          on:removeFlag={(event) => handleFlagRemove(event.detail.type, event.detail.id)}
        />
      </div>
    </div>
  {/if}
</div>