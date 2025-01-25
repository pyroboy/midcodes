<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { documentSteps } from '$lib/stores/document-steps';
  import type { PrintRequest } from '$lib/types/print-request';
  import type { ProcessingStep } from '$lib/types/print-steps';
  import { requestFlags } from '@/stores/request-flags';
    import RequestFlags from '@/components/RequestFlags.svelte';

  type PrintRequestWithSteps = PrintRequest & {
    steps: ProcessingStep[];
  };

  export let request: PrintRequestWithSteps | null = null;
  const dispatch = createEventDispatcher();

  console.log('Modal received request:', request);

  let unsubscribe: () => void;
  let isInitialized = false;

  $: if (request?.reference_number && request.steps) {
    const store = get(documentSteps);
    if (!store[request.reference_number]) {
      documentSteps.initialize(request.reference_number);
    } else {
      request.steps = store[request.reference_number];
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleEscape);
    
    unsubscribe = documentSteps.subscribe((store) => {
      if (request?.reference_number && store[request.reference_number]) {
        request.steps = store[request.reference_number];
        console.log('Steps updated from store:', request.steps);
      }
    });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (unsubscribe) unsubscribe();
    };
  });

  function handleStepToggle(stepId: string) {
    if (request?.reference_number) {
      console.log('Before toggle - Current steps:', currentSteps);
      console.log('Toggling step:', stepId);
      documentSteps.toggleStep(request.reference_number, stepId);
    }
  }

  $: currentSteps = request?.steps || [];
  $: completedSteps = currentSteps.filter((step: ProcessingStep) => step.status === 'completed').length;
  $: progress = (completedSteps / currentSteps.length) * 100;
  $: statusDescription = completedSteps === currentSteps.length 
    ? 'All steps completed' 
    : `${completedSteps} of ${currentSteps.length} steps completed`;
  $: flags = $requestFlags[request?.reference_number || ''] || [];
  $: hasBlockingFlags = flags.some(flag => flag.type === 'BLOCKING');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  function handleClose() {
    dispatch('close');
  }

  function handleComplete() {
    if (currentSteps.every((step: ProcessingStep) => step.status === 'completed')) {
      dispatch('complete', { request, steps: currentSteps });
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleClickOutside(event: MouseEvent) {
    const modalContent = document.querySelector('.modal-content');
    if (modalContent && !modalContent.contains(event.target as Node)) {
      handleClose();
    }
  }

  $: timeElapsed = request ? getTimeElapsed(request.payment_date) : '';

  function getTimeElapsed(date: string): string {
    const paymentDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  $: {
    if (request) {
      console.log('Modal received request:', request);
      console.log('Modal received steps:', request.steps);
    }
  }

  $: console.log('Current steps in modal:', currentSteps);
</script>

{#if request}
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

  <button
    class="fixed inset-0 z-10 overflow-y-auto cursor-default"
    on:click={handleClickOutside}
    on:keydown={handleEscape}
    aria-label="Close modal"
  >
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div 
        class="modal-content relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl sm:p-6 {
          hasBlockingFlags ? 'ring-2 ring-red-500' : ''
        }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h3 id="modal-title" class="sr-only">Document Request Processing</h3>
        
        <!-- Add warning message when blocking flags are present -->
        {#if hasBlockingFlags}
          <div class="mb-4 rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Blocking Flags Present</h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>This document has blocking flags that need to be resolved before proceeding.</p>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Rest of the modal content -->
        <div class="absolute right-0 top-0 pr-4 pt-4">
          <div
            role="button"
            tabindex="0"
            class="rounded-md bg-white text-gray-400 hover:text-gray-500 cursor-pointer"
            on:click={handleClose}
            on:keydown={e => e.key === 'Enter' && handleClose()}
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <div class="sm:flex sm:flex-col sm:gap-8 w-full">
          <div class="w-full flex items-center justify-center px-4 py-4 bg-gray-50 rounded-lg">
            <div class="flex items-center w-full justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  {#if completedSteps === currentSteps.length}
                    <svg class="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  {:else}
                    <svg class="h-6 w-6 text-indigo-500 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  {/if}
                </div>
                <div class="ml-4">
                  <div class="flex items-center gap-2">
                    <p class="text-base font-medium text-gray-900">
                      {#if completedSteps === currentSteps.length}
                        Document processing completed
                      {:else if completedSteps === 0}
                        Waiting to start processing
                      {:else}
                        Processing document request
                      {/if}
                    </p>
                  </div>
                  <p class="text-sm font-medium text-gray-500">
                    {statusDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="sm:flex sm:gap-8">
            <div class="flex-1">
              <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-4">
                Document Request Details
              </h3>

              <div class="flex items-center gap-2 mb-3">
                <svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm text-gray-500">Payment received {timeElapsed}</span>
              </div>
  
              <div class="bg-gray-50 rounded-lg p-4">
                <dl class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt class="text-gray-500">Reference Number</dt>
                    <dd class="mt-1 font-medium text-gray-900">{request.reference_number}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Document Type</dt>
                    <dd class="mt-1 font-medium text-gray-900">{request.document_type}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Student Name</dt>
                    <dd class="mt-1 font-medium text-gray-900">{request.student_name}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Student Number</dt>
                    <dd class="mt-1 font-medium text-gray-900">{request.student_number}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Purpose</dt>
                    <dd class="mt-1 font-medium text-gray-900">{request.purpose}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Quantity</dt>
                    <dd class="mt-1 font-medium text-gray-900">{request.quantity}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Payment Date</dt>
                    <dd class="mt-1 font-medium text-gray-900">{formatDate(request.payment_date)}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Amount Paid</dt>
                    <dd class="mt-1 font-medium text-gray-900">{formatAmount(request.amount_paid)}</dd>
                  </div>
                </dl>
              </div>

              {#if request.reference_number}
                <div class="mt-6">
                  <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-4">
                    Request Flags
                  </h3>
                  <RequestFlags referenceNumber={request.reference_number} />
                </div>
              {/if}
            </div>

            <div class="flex-1 mt-6 sm:mt-0">
              <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-4">
                Processing Steps
              </h3>

              <div class="bg-gray-50 rounded-lg p-4">
                <div class="space-y-4">
                  {#if currentSteps.length > 0}
                    {#each currentSteps as step (step.id)}
                      <div class="flex items-start">
                        <div class="flex h-5 items-center">
                          <input
                            type="checkbox"
                            id={step.id}
                            checked={step.status === 'completed'}
                            on:change={() => handleStepToggle(step.id)}
                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div class="ml-3">
                          <label for={step.id} class="text-sm text-gray-700">
                            {step.name}
                          </label>
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p>No steps available for this request.</p>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </button>
{/if}