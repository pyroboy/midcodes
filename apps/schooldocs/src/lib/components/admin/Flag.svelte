<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FlagType } from '$lib/types/requestTypes';

  const dispatch = createEventDispatcher();
  
  export let closable = false;
  export let type: FlagType = 'blocking';
  export let value: string;
  export let description: string;
  export let isSelected = false;
  export let disabled = false;

  let showInfo = false;

  const styles = {
    blocking: {
      container: `${isSelected ? 'bg-red-100 shadow-sm' : 'bg-red-50'} ${!disabled ? 'hover:bg-red-100' : ''} ${disabled ? 'opacity-40 bg-gray-50' : ''}`,
      text: 'text-red-700',
      icon: 'text-red-600',
      badge: 'text-red-600',
      border: isSelected ? 'border-red-300 border-2' : 'border-red-200'
    },
    nonBlocking: {
      container: `${isSelected ? 'bg-yellow-100 shadow-sm' : 'bg-yellow-50'} ${!disabled ? 'hover:bg-yellow-100' : ''} ${disabled ? 'opacity-40 bg-gray-50' : ''}`,
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
      badge: 'text-yellow-600',
      border: isSelected ? 'border-yellow-300 border-2' : 'border-yellow-200'
    }
  };

  $: style = styles[type];
</script>

<div
  role="button"
  tabindex="0"
  on:click
  on:keydown={(e) => e.key === 'Enter' && e.currentTarget.click()}
  on:mouseenter={() => showInfo = true}
  on:mouseleave={() => showInfo = false}
  class="p-3 rounded-lg border {style.border} {style.container} {!disabled ? 'cursor-pointer' : ''} relative overflow-hidden w-full text-left"
  aria-label={`${type} flag: ${value}`}
>
  <div class="flex justify-between items-center">
    <div class="flex items-center gap-2 transition-all duration-300 {showInfo ? 'opacity-0' : 'opacity-100'}">
      {#if type === 'blocking'}
        <svg class="w-4 h-4 {style.icon}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      {/if}
      <span class="text-base font-semibold {style.badge}">{value}</span>
    </div>
    <div class="absolute top-0 left-0 right-0 p-3 transition-all duration-300 {showInfo ? 'opacity-100' : 'opacity-0'}">
      <div class="space-y-1">
        <p class="text-sm text-gray-600">{description}</p>
        <p class="text-xs {style.badge}">
          {type === 'blocking' ? 'Blocking' : 'Non-blocking'}
        </p>
      </div>
    </div>
    {#if closable}
      <div
        role="button"
        tabindex="0"
        on:click|stopPropagation={(e) => dispatch('click', e)}
        on:keydown|stopPropagation={(e) => e.key === 'Enter' && dispatch('click', e)}
        class="hover:{style.text} h-fit z-10"
        aria-label={`Remove ${type} flag: ${value}`}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    {/if}
  </div>
</div>