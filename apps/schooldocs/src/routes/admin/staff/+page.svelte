<script lang="ts">
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import RequestModal from '$lib/components/modals/admin/RequestModal.svelte';
  import { enhancedRequestStore } from '$lib/stores/enhanced-request-store';
  import type { EnhancedPrintRequest } from '$lib/types/enhanced-request-types';
  import { mockPrintRequests } from '$lib/data/mock-print-requests';

  let selectedRequest: EnhancedPrintRequest | null = null;
  
  // Subscribe to individual stores
  const { requests: requestsStore, flags: flagsStore, steps: stepsStore, metadata: metadataStore } = enhancedRequestStore;
  $: requests = $requestsStore;
  $: flags = $flagsStore;
  $: steps = $stepsStore;
  $: metadata = $metadataStore;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  onMount(() => {
    // Removed the redundant request initialization
  });

  function handleRowClick(request: EnhancedPrintRequest) {
    console.log('Selected request:', request);
    selectedRequest = request;
  }

  function handleModalClose() {
    console.log('Modal closed');
    selectedRequest = null;
  }

  function handleStepToggle(referenceNumber: string, stepIndex: number, done: boolean) {
    console.log(`Toggling step ${stepIndex} to ${done} for request ${referenceNumber}`);
    enhancedRequestStore.steps.updateStep(referenceNumber, stepIndex, done);
  }

  function handleFlagToggle(referenceNumber: string, type: 'blocking' | 'nonBlocking', flagText: string) {
    console.log(`Toggling ${type} flag ${flagText} for request ${referenceNumber}`);
    enhancedRequestStore.flags.addFlag(referenceNumber, type, {
      id: crypto.randomUUID(),
      text: flagText,
      timestamp: new Date().toISOString()
    });
  }

  function handleFlagRemove(referenceNumber: string, type: 'blocking' | 'nonBlocking', flagId: string) {
    console.log(`Removing ${type} flag ${flagId} from request ${referenceNumber}`);
    enhancedRequestStore.flags.removeFlag(referenceNumber, type, flagId);
  }

  function getRequestState(request: EnhancedPrintRequest) {
    const flags = $flagsStore[request.reference_number] || { blocking: [], nonBlocking: [], notes: '', timestamp: '' };
    const steps = $stepsStore[request.reference_number]?.steps || [];
    
    const hasBlockingFlags = flags.blocking.length > 0;
    const progress = Math.round((steps.filter((s: { done: boolean }) => s.done).length / steps.length) * 100);

    return {
      hasBlockingFlags,
      progress
    };
  }
</script>

<div class="p-6 space-y-6">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-xl font-semibold text-gray-900">Print Requests</h1>
      <p class="mt-2 text-sm text-gray-700">List of paid document requests ready for printing.</p>
    </div>
  </div>

  <div class="mt-8 flex flex-col">
    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Reference</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Student</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Document</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Purpose</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {#each requests as request}
                {@const state = getRequestState(request)}
                <tr 
                  class="hover:bg-gray-50 cursor-pointer transition-colors duration-150 {selectedRequest?.id === request.id ? 'bg-indigo-50' : ''}"
                  on:click={() => handleRowClick(request)}
                >
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <div>{request.reference_number}</div>
                    <div class="text-xs text-gray-400">{formatDate(request.created_at)}</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div>{request.student_name}</div>
                    <div class="text-xs text-gray-400">{request.student_number}</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div>{request.document_type}</div>
                    <div class="text-xs text-gray-400">Qty: {request.quantity}</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {request.purpose}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="flex items-center gap-2">
                      <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-blue-600 h-2 rounded-full" 
                          style="width: {state.progress}%"
                        ></div>
                      </div>
                      <span class="text-xs">{state.progress}%</span>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    {#if state.hasBlockingFlags}
                      <span class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        Blocked
                      </span>
                    {:else if state.progress === 100}
                      <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Complete
                      </span>
                    {:else}
                      <span class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                        In Progress
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

{#if selectedRequest}
  <RequestModal
    referenceNumber={selectedRequest.reference_number}
    documentType={selectedRequest.document_type}
    studentName={selectedRequest.student_name}
    studentNumber={selectedRequest.student_number}
    quantity={selectedRequest.quantity}
    amountPaid={selectedRequest.amount_paid}
    paymentDate={selectedRequest.payment_date}
    purpose={selectedRequest.purpose}
    status={selectedRequest.status}
    on:close={handleModalClose}
    on:stepToggle={({ detail }) => {
      if (selectedRequest) {
        handleStepToggle(selectedRequest.reference_number, detail.index, detail.done)
      }
    }}
    on:flagAdd={({ detail }) => {
      if (selectedRequest) {
        handleFlagToggle(selectedRequest.reference_number, detail.type, detail.flag)
      }
    }}
    on:flagRemove={({ detail }) => {
      if (selectedRequest) {
        handleFlagRemove(selectedRequest.reference_number, detail.type, detail.id)
      }
    }}
  />
{/if}