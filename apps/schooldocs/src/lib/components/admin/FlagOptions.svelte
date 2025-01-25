<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Flag from './Flag.svelte';
  import type { Flags, FlagOptions as FlagOptionsType } from '$lib/types/requestTypes';

  export let flagOptions: FlagOptionsType;
  export let flags: Flags;

  const dispatch = createEventDispatcher();

  $: hasBlockingFlag = flags.blocking.length > 0;
  $: hasNonBlockingFlag = flags.nonBlocking.length > 0;

  function handleFlagClick(type: 'blocking' | 'nonBlocking', flagId: string) {
    if (!flags[type].includes(flagId)) {
      dispatch('addFlag', { type, flagId });
    }
  }
</script>

<div class="space-y-4">
  <div class="grid grid-cols-2 gap-4">
    {#each flagOptions.blocking as flag}
      <Flag
        type="blocking"
        value={flag.id}
        description={flag.label}
        isSelected={flags.blocking.includes(flag.id)}
        disabled={!flags.blocking.includes(flag.id) && hasBlockingFlag}
        on:click={() => handleFlagClick('blocking', flag.id)}
      />
    {/each}
  </div>
  
  <hr class="border-gray-200" />
  
  <div class="grid grid-cols-2 gap-4">
    {#each flagOptions.nonBlocking as flag}
      <Flag
        type="nonBlocking"
        value={flag.id}
        description={flag.label}
        isSelected={flags.nonBlocking.includes(flag.id)}
        disabled={!flags.nonBlocking.includes(flag.id) && hasNonBlockingFlag}
        on:click={() => handleFlagClick('nonBlocking', flag.id)}
      />
    {/each}
  </div>
</div>