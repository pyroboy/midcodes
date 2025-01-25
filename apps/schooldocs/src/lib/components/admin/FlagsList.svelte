<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Flag from './Flag.svelte';
  import type { Flags, FlagOptions as FlagOptionsType } from '$lib/types/requestTypes';

  export let flags: Flags;
  export let flagOptions: FlagOptionsType;

  const dispatch = createEventDispatcher();

  function handleRemove(type: 'blocking' | 'nonBlocking', flag: string) {
    dispatch('removeFlag', { type, flag });
  }
</script>

<div class="grid grid-cols-2 gap-4">
  {#each flags.blocking as flag}
    {@const option = flagOptions.blocking.find(opt => opt.id === flag)}
    {#if option}
      <Flag
        type="blocking"
        value={flag}
        description={option.label}
        closable
        on:click={() => handleRemove('blocking', flag)}
      />
    {/if}
  {/each}
  {#each flags.nonBlocking as flag}
    {@const option = flagOptions.nonBlocking.find(opt => opt.id === flag)}
    {#if option}
      <Flag
        type="nonBlocking"
        value={flag}
        description={option.label}
        closable
        on:click={() => handleRemove('nonBlocking', flag)}
      />
    {/if}
  {/each}
</div>