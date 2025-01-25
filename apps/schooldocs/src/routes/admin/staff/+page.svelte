<script lang="ts">
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { default as PrintRequestModal } from '$lib/components/modals/PrintRequestModal.svelte';
  import { printRequests, selectedRequest, initializeRequestSteps, updateRequestStatus, updateStepStatus } from '$lib/stores/print-requests';
  import { documentSteps } from '$lib/stores/document-steps';
  import type { PrintRequest } from '$lib/types/print-request';
  import type { ProcessingStep } from '$lib/types/print-steps';

  type PrintRequestWithSteps = PrintRequest & {
    steps: ProcessingStep[];
  };


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
    console.log('Initial print requests:', $printRequests);
    console.log('Initial requests with steps:', $requestsWithStepsJoined);
    
    const requestsNeedingSteps = $printRequests.filter(request => {
      const existingSteps = $documentSteps[request.reference_number];
      console.log(`Checking steps for request ${request.reference_number}:`, existingSteps);
      return !existingSteps?.length;
    });

    if (requestsNeedingSteps.length > 0) {
      console.log(`Batch initializing steps for ${requestsNeedingSteps.length} requests:`, requestsNeedingSteps);
      requestsNeedingSteps.forEach(request => {
        documentSteps.initialize(request.reference_number);
      });
    }
  });

  // Update the derived store to use documentSteps instead of requestsWithSteps
  // Update the derived store to use documentSteps
  const requestsWithStepsJoined = derived<
    [typeof printRequests, typeof documentSteps],
    PrintRequestWithSteps[]
  >(
    [printRequests, documentSteps],
    ([$printRequests, $documentSteps]) => {
      console.log('=== Joining Requests with Steps ===');
      console.log('Current print requests:', $printRequests);
      console.log('Current document steps:', $documentSteps);
      
      return $printRequests.map(request => {
        const steps = $documentSteps[request.reference_number] || [];
        console.log(`Steps for request ${request.id}:`, steps);
        return {
          ...request,
          steps
        };
      });
    }
  );



  function handleRowClick(request: PrintRequestWithSteps) {
    console.log('Selected request:', request);
    console.log('Steps in selected request:', request.steps);
    selectedRequest.set(request); // No need to spread and reconstruct
  }

  // Add status mapping function with null checks
  function getRequestStatus(steps: ProcessingStep[]): { status: string; color: string } {
    if (!steps?.length) return { status: 'Pending', color: 'gray' };
    
    const completedSteps = steps.filter(step => step?.status === 'completed').length;
    const totalSteps = steps.length;
    
    if (completedSteps === totalSteps) {
      return { status: 'Completed', color: 'green' };
    } else if (completedSteps === 0) {
      return { status: 'Pending', color: 'gray' };
    } else {
      return { status: 'Processing', color: 'indigo' };
    }
  }

  


  function handleModalClose() {
    selectedRequest.set(null);
  }

  function handleRequestComplete(event: CustomEvent<{ request: PrintRequestWithSteps; steps: ProcessingStep[] }>) {
    const { request, steps } = event.detail;
    
    steps.forEach(step => {
      documentSteps.toggleStep(request.reference_number, step.id);
    });
    updateRequestStatus(request.id, 'printed');
    selectedRequest.set(null);
  }

  function handleStepToggle(requestId: string, stepId: string) {
    const request = $printRequests.find(r => r.id === requestId);
    if (request) {
      documentSteps.toggleStep(request.reference_number, stepId);
    }
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
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Reference</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Document</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Student</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Purpose</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Payment Date</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {#each $requestsWithStepsJoined as request}
                <tr
                  class="cursor-pointer hover:bg-gray-50 transition-colors duration-150 {
                    $selectedRequest?.id === request.id ? 'bg-indigo-50' : ''
                  }"
                  on:click={() => handleRowClick(request)}
                >
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {request.reference_number}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {request.document_type}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div>
                      <div class="font-medium">{request.student_name}</div>
                      <div class="text-xs text-gray-400">{request.student_number}</div>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.purpose}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.quantity}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(request.payment_date)}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatAmount(request.amount_paid)}
                  </td>
                  
                  <!-- Progress Column -->
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="flex items-center gap-2">
                      <div class="w-32 bg-gray-200 rounded-full h-2">
                        {#if request?.steps?.length > 0}
                          {@const completed = request.steps.filter(s => s?.status === 'completed').length}
                          {@const percentage = (completed / request.steps.length) * 100}
                          <div 
                            class="bg-indigo-600 h-2 rounded-full" 
                            style="width: {percentage}%"
                          ></div>
                        {/if}
                      </div>
                      <span>
                        {request?.steps?.filter(s => s?.status === 'completed').length ?? 0}/{request?.steps?.length ?? 0}
                      </span>
                    </div>
                  </td>
                  
                  <!-- Status Column -->
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    {#if request?.steps}
                      {@const status = getRequestStatus(request.steps)}
                      <span class={`
                        inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
                        ${status.color === 'gray' ? 'text-gray-600 bg-gray-50 ring-gray-500/10' : ''}
                        ${status.color === 'green' ? 'text-green-700 bg-green-50 ring-green-600/20' : ''}
                        ${status.color === 'indigo' ? 'text-indigo-700 bg-indigo-50 ring-indigo-600/20' : ''}
                      `}>
                        {status.status}
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

  <PrintRequestModal
    request={$selectedRequest}
    on:close={handleModalClose}
    on:complete={handleRequestComplete}
    on:stepToggle={({ detail }) => handleStepToggle(detail.requestId, detail.stepId)}
  />