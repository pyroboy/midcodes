<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { enhancedRequestStore } from '$lib/stores/enhanced-request-store';
  import type { FlagOption, Flags, FlagOptions, ProcessingStep } from '$lib/types/requestTypes';
  import type { RequestMetadata } from '$lib/types/enhanced-request-types';

  export let referenceNumber: string;
  export let documentType: string;
  export let studentName: string;
  export let studentNumber: string;
  export let quantity: number = 1;
  export let paymentStatus: 'paid' | 'pending' | 'failed' = 'pending';
  export let paymentDate: string = new Date().toISOString();
  export let amountPaid: number = 0;
  export let status: 'pending' | 'printed' | 'cancelled' = 'pending';
  export let purpose: string = '';

  const dispatch = createEventDispatcher();

  let showFlagSelector = false;
  let showInfo = false;
  let showMiddleSection = true;
  let flags: Flags = {
    blocking: [],
    nonBlocking: [],
    notes: ''
  };
  let steps: ProcessingStep[] = [];
  
  let unsubscribeFlags: () => void;
  let unsubscribeSteps: () => void;

  // Predefined flag options
  const blockingFlags: FlagOption[] = [
    { id: 'UNVERIFIABLE', text: 'Unverifiable Information', timestamp: new Date().toISOString() },
    { id: 'INCOMPLETE', text: 'Incomplete Requirements', timestamp: new Date().toISOString() },
    { id: 'EXPIRED', text: 'Expired Documents', timestamp: new Date().toISOString() },
    { id: 'INVALID_ID', text: 'Invalid Identification', timestamp: new Date().toISOString() }
  ];

  const nonBlockingFlags: FlagOption[] = [
    { id: 'PRIORITY', text: 'Priority Processing', timestamp: new Date().toISOString() },
    { id: 'RUSH', text: 'Rush Request', timestamp: new Date().toISOString() },
    { id: 'SPECIAL_HANDLING', text: 'Special Handling', timestamp: new Date().toISOString() },
    { id: 'NEEDS_REVIEW', text: 'Needs Review', timestamp: new Date().toISOString() }
  ];

  const flagOptions: FlagOptions = {
    blocking: blockingFlags,
    nonBlocking: nonBlockingFlags
  };

  onMount(() => {
    // Subscribe to flags
    unsubscribeFlags = enhancedRequestStore.flags.subscribe((store) => {
      const requestFlags = store[referenceNumber];
      flags = requestFlags || {
        blocking: [],
        nonBlocking: [],
        notes: ''
      };
    });

    // Subscribe to steps and initialize if needed
    unsubscribeSteps = enhancedRequestStore.steps.subscribe((store) => {
      const requestSteps = store[referenceNumber];
      if (requestSteps) {
        steps = requestSteps.steps;
      } else {
        // Initialize steps if they don't exist
        enhancedRequestStore.steps.initialize(referenceNumber);
      }
    });

    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    if (unsubscribeFlags) unsubscribeFlags();
    if (unsubscribeSteps) unsubscribeSteps();
    document.removeEventListener('keydown', handleKeydown);
  });

  function handleClose() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  async function toggleStep(index: number) {
    const nextUndoneIndex = steps.findIndex(step => !step.done);
    if (index === nextUndoneIndex) {
      const newDoneState = !steps[index].done;
      await enhancedRequestStore.steps.updateStep(referenceNumber, index, newDoneState);
      dispatch('stepToggle', { index, done: newDoneState });
    } else if (index === nextUndoneIndex - 1 && steps[index].done) {
      await enhancedRequestStore.steps.updateStep(referenceNumber, index, false);
      dispatch('stepToggle', { index, done: false });
    }
  }

  async function handleFlagAdd(type: 'blocking' | 'nonBlocking', flag: FlagOption) {
    if (!flags[type].some(f => f.id === flag.id)) {
      await enhancedRequestStore.flags.addFlag(referenceNumber, type, flag);
      handleHideFlagSelector();
    }
  }

  async function handleFlagRemove(type: 'blocking' | 'nonBlocking', flagId: string) {
    try {
      await enhancedRequestStore.flags.removeFlag(referenceNumber, type, flagId);
    } catch (error) {
      console.error('Failed to remove flag:', error);
    }
  }

  async function handleNotesChange(event: { detail: { notes: string } }) {
    try {
      await enhancedRequestStore.flags.updateNotes(referenceNumber, event.detail.notes);
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  }

  function handleShowFlagSelector() {
    showMiddleSection = false;
    showFlagSelector = true;
  }

  function handleHideFlagSelector() {
    showMiddleSection = true;
    showFlagSelector = false;
  }

  $: shouldShowAddFlag = flags && (flags.blocking.length === 0 || flags.nonBlocking.length === 0) && !isComplete;
  $: hasBlockingFlag = flags && flags.blocking.length > 0;
  $: hasNonBlockingFlag = flags && flags.nonBlocking.length > 0;
  $: completedSteps = steps.filter(s => s.done).length;
  $: totalSteps = steps.length;
  $: isComplete = completedSteps === totalSteps;

  $: modalStatusClasses = (() => {
    if (isComplete) return 'border-green-300';
    if (hasBlockingFlag && hasNonBlockingFlag) return 'border-yellow-400 outline outline-2 outline-red-500';
    if (hasBlockingFlag) return 'border-red-500';
    if (hasNonBlockingFlag) return 'border-yellow-400';
    return '';
  })();

  $: backdropClasses = (() => {
    if (isComplete) return 'bg-green-50/30';
    if (hasBlockingFlag) return 'bg-red-50/30';
    if (hasNonBlockingFlag) return 'bg-yellow-50/30';
    return 'bg-white/30';
  })();
</script>

<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="absolute inset-0 backdrop-blur-sm {backdropClasses}"></div>
  <div class="relative min-h-screen w-full p-8 flex items-center justify-center overflow-y-auto">
    <!-- Close Button -->
    <button
      class="absolute top-4 right-4 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors z-50"
      on:click={handleClose}
      aria-label="Close modal"
    >
      <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Modal Content -->
    <div class="w-full max-w-7xl aspect-[16/9] bg-white rounded-xl shadow-xl p-6 border-4 {modalStatusClasses}">
      <div class="h-full grid grid-rows-[auto_1fr_auto] gap-4">
        <!-- Top Section -->
        <div class="border rounded-lg">
          <div class="{hasBlockingFlag ? 'bg-red-50' : 'bg-white'} px-4 py-3">
            <!-- Progress and Flags Row -->
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-3">
                {#if flags.blocking.length > 0}
                  <div class="flex items-center gap-2">
                    <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="font-medium text-red-600">{flags.blocking[0]?.text}</span>
                  </div>
                {:else}
                  <div class="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin">
                  </div>
                  <span class="font-medium text-gray-900">Processing document request</span>
                {/if}
              </div>
              <div class="flex items-center gap-2">
                {#if flags.nonBlocking.length > 0}
                  <div class="flex items-center gap-2">
                    <span class="bg-yellow-100 px-3 py-1 rounded text-yellow-700 text-sm">
                      {flags.nonBlocking[0]?.text}
                    </span>
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Progress Text and Notes -->
            <div class="flex justify-between items-center">
              <div class="text-gray-600">
                {completedSteps} of {totalSteps} steps completed
              </div>
              {#if flags && flags.notes}
                <div class="text-sm text-gray-600 italic">
                  Note: {flags.notes}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Middle Section - 60/40 split -->
        {#if showMiddleSection}
          <div 
            class="grid grid-cols-5 gap-4"
            transition:fade={{
              duration: 300
            }}
          >
            <!-- Main Info - 60% -->
            <div class="col-span-3 border rounded-lg bg-white p-4">
              <div class="space-y-4">
                <!-- Header Info -->
                <div class="grid grid-cols-3 gap-4 pb-4 border-b">
                  <div class="col-span-2">
                    <div class="text-2xl font-medium">{referenceNumber}</div>
                    <div class="text-gray-600">{documentType} • {quantity} {quantity > 1 ? 'copies' : 'copy'}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-medium">₱{amountPaid.toFixed(2)}</div>
                    <div class="text-sm text-gray-600">
                      {paymentStatus === 'paid' ? `Paid on ${new Date(paymentDate).toLocaleDateString()}` : 'Payment pending'}
                    </div>
                  </div>
                </div>
                
                <!-- Details Grid -->
                <div class="grid grid-cols-2 gap-4">
                  {#each [
                    ['Student', studentName],
                    ['ID', studentNumber],
                    ['Purpose', purpose],
                    ['Status', status.charAt(0).toUpperCase() + status.slice(1)]
                  ] as [label, value]}
                    <div class="border rounded p-3">
                      <div class="text-sm text-gray-600">{label}</div>
                      <div class="font-medium">{value}</div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Steps - 40% -->
            <div class="col-span-2 border rounded-lg bg-white flex flex-col">
              <div class="px-4 py-3 border-b bg-gray-50">
                <div class="font-medium">Processing Steps</div>
              </div>
              <div class="p-4">
                <div class="space-y-2">
                  {#each steps as step, i}
                    {@const isNextStep = i === steps.findIndex(s => !s.done)}
                    <button 
                      on:click={() => toggleStep(i)}
                      class="flex items-center gap-2 px-3 py-2 rounded w-full transition-all duration-150 
                        {step.done ? 'bg-green-50 text-green-700' : 'bg-gray-50'}
                        {isNextStep ? 'hover:bg-green-100 cursor-pointer' : ''}
                        {!isNextStep && !step.done ? 'opacity-50 cursor-not-allowed' : ''}
                        {step.done && i === steps.findIndex(s => !s.done) - 1 ? 'hover:bg-red-50 hover:text-red-700' : ''}"
                    >
                      <div class="w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                        {step.done ? 'border-green-500' : isNextStep ? 'border-green-300' : 'border-gray-300'}"
                      >
                        {#if step.done}
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        {/if}
                      </div>
                      {step.step}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Bottom Section - Flag Management -->
        <div class="border rounded-lg">
          {#if showFlagSelector}
            <!-- Flag Selector -->
            <div>
              <div class="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                <div class="font-medium">Request Flags</div>
                <button 
                  on:click={handleHideFlagSelector}
                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Go back to request details"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div class="p-4">
                <div class="text-center text-gray-500 text-sm">1 Blocking - 1 Non-Blocking only</div>
                <div class="mt-4">
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      {#each flagOptions.blocking as flag}
                        <div
                          class="p-3 rounded-lg border relative overflow-hidden cursor-pointer
                            {flags && flags.blocking.some(f => f.id === flag.id) ? 'bg-red-100 shadow-sm border-red-300 border-2' : 'bg-red-50 border-red-200'}
                            {!flags || !flags.blocking.some(f => f.id === flag.id) && !hasBlockingFlag ? 'hover:bg-red-100' : ''}
                            {!flags || !flags.blocking.some(f => f.id === flag.id) && hasBlockingFlag ? 'opacity-40 bg-gray-50 cursor-not-allowed' : ''}"
                          on:click={() => !hasBlockingFlag && handleFlagAdd('blocking', flag)}
                          on:keydown={(e) => e.key === 'Enter' && !hasBlockingFlag && handleFlagAdd('blocking', flag)}
                          role="button"
                          tabindex="0"
                        >
                          <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                              <svg class="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span class="text-base font-semibold text-red-700">{flag.id}</span>
                            </div>
                            {#if flags && flags.blocking.some(f => f.id === flag.id)}
                              <button 
                                on:click|stopPropagation={() => handleFlagRemove('blocking', flag.id)}
                                class="hover:text-red-700 h-fit z-10"
                                aria-label="Remove blocking flag: {flag.text}"
                              >
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                    <hr class="border-gray-200" />
                    <div class="grid grid-cols-2 gap-4">
                      {#each flagOptions.nonBlocking as flag}
                        <div
                          class="p-3 rounded-lg border relative overflow-hidden cursor-pointer
                            {flags && flags.nonBlocking.some(f => f.id === flag.id) ? 'bg-yellow-100 shadow-sm border-yellow-300 border-2' : 'bg-yellow-50 border-yellow-200'}
                            {!flags || !flags.nonBlocking.some(f => f.id === flag.id) && !hasNonBlockingFlag ? 'hover:bg-yellow-100' : ''}
                            {!flags || !flags.nonBlocking.some(f => f.id === flag.id) && hasNonBlockingFlag ? 'opacity-40 bg-gray-50 cursor-not-allowed' : ''}"
                          on:click={() => !hasNonBlockingFlag && handleFlagAdd('nonBlocking', flag)}
                          on:keydown={(e) => e.key === 'Enter' && !hasNonBlockingFlag && handleFlagAdd('nonBlocking', flag)}
                          role="button"
                          tabindex="0"
                        >
                          <div class="flex justify-between items-center">
                            <span class="text-base font-semibold text-yellow-700">{flag.id}</span>
                            {#if flags && flags.nonBlocking.some(f => f.id === flag.id)}
                              <button 
                                on:click|stopPropagation={() => handleFlagRemove('nonBlocking', flag.id)}
                                class="hover:text-yellow-700 h-fit z-10"
                                aria-label="Remove non-blocking flag: {flag.text}"
                              >
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <!-- Flag Display -->
            <div>
              <div class="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                <div class="font-medium">Request Flags</div>
                {#if shouldShowAddFlag}
                  <button 
                    on:click={handleShowFlagSelector}
                    class="flex items-center gap-2 px-4 py-2 rounded-lg {isComplete ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors"
                    disabled={isComplete}
                    aria-label={isComplete ? 'Cannot add flags to completed requests' : 'Add flag'}
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Flag
                  </button>
                {/if}
              </div>
              <div class="p-4">
                <!-- Notes Input -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <label for="flagNotes" class="text-sm text-gray-600">Flag Notes</label>
                    <span class="text-xs text-gray-500">{flags && flags.notes?.length || 0}/70</span>
                  </div>
                  <input
                    id="flagNotes"
                    type="text"
                    value={flags && flags.notes}
                    maxlength={70}
                    on:input={(e) => handleNotesChange({ detail: { notes: (e.target as HTMLInputElement).value } })}
                    placeholder="Add notes about the flags..."
                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {#if flags}
                  <div class="mt-4">
                    <div class="grid grid-cols-2 gap-4">
                      {#if flags.blocking.length > 0}
                        <div class="p-3 rounded-lg border-2 border-red-300 bg-red-100 shadow-sm">
                          <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                              <svg class="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                              <span class="text-base font-semibold text-red-700">{flags.blocking[0]?.text}</span>
                            </div>
                            <button 
                              on:click={() => handleFlagRemove('blocking', flags.blocking[0].id)}
                              class="hover:text-red-700 h-fit"
                              aria-label="Remove blocking flag"
                            >
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      {/if}
                      {#if flags.nonBlocking.length > 0}
                        <div class="p-3 rounded-lg border-2 border-yellow-300 bg-yellow-100 shadow-sm">
                          <div class="flex justify-between items-center">
                            <span class="text-base font-semibold text-yellow-700">{flags.nonBlocking[0]?.text}</span>
                            <button 
                              on:click={() => handleFlagRemove('nonBlocking', flags.nonBlocking[0].id)}
                              class="hover:text-yellow-700 h-fit"
                              aria-label="Remove non-blocking flag"
                            >
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                            </button>
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>