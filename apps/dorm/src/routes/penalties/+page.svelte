<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { invalidate } from '$app/navigation';
  // Import components with relative paths
  import PenaltyTable from './PenaltyTable.svelte';
  import PenaltyCard from './PenaltyCard.svelte';
  import PenaltyModal from './PenaltyModal.svelte';
  import { updatePenaltySchema } from './formSchema';
  import type { PenaltyBilling, PenaltyFilter } from './types';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { AnyZodObject } from 'zod';
  
  let { data } = $props();
  let penaltyBillings = $state(data.penaltyBillings);
  let selectedPenalty: PenaltyBilling | undefined = $state();
  let showPenaltyDetails = $state(false);
  let showPenaltyModal = $state(false);
  let filter: PenaltyFilter = $state({});
  
  $effect(() => {
    penaltyBillings = data.penaltyBillings;
  });

  const { form, enhance, errors, constraints, submitting, reset } = superForm(data.form, {
    id: 'penalty-form',
    validators: zodClient(updatePenaltySchema as AnyZodObject),
    validationMethod: 'oninput',
    dataType: 'json',
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error('Form submission error:', {
        error: result.error,
        status: result.status
      });
      if (result.error) {
        console.error('Server error:', result.error.message);
      }
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        showPenaltyModal = false;
        selectedPenalty = undefined;
        showPenaltyDetails = false;
        await invalidate('app:penalties');
        reset();
      }
    }
  });

  function handlePenaltyClick(penalty: PenaltyBilling) {
    selectedPenalty = penalty;
    showPenaltyDetails = true;
  }

  function handleUpdatePenalty(penalty: PenaltyBilling) {
    selectedPenalty = penalty;
    if (selectedPenalty) {
      // Update form values using the proper method
      form.update(($form) => {
        $form.id = selectedPenalty!.id;
        $form.penalty_amount = selectedPenalty!.penalty_amount;
        $form.notes = selectedPenalty!.notes;
        return $form;
      });
    }
    showPenaltyModal = true;
  }

  function handleCloseDetails() {
    showPenaltyDetails = false;
    selectedPenalty = undefined;
  }

  function applyFilter(newFilter: PenaltyFilter) {
    filter = { ...filter, ...newFilter };
    // In a real implementation, you might want to fetch data from the server with these filters
    // or filter the data client-side
  }

  function resetFilter() {
    filter = {};
    // In a real implementation, you might want to fetch all data from the server again
  }
</script>


<div class="w-full h-full bg-gray-50">
  <!-- Page Header -->
  <div class="w-full bg-white shadow-sm border-b">
    <div class="max-w-[1600px] mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold">Penalty Billings</h1>
    </div>
  </div>

  <div class="max-w-[1600px] mx-auto px-4 py-6">
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Sidebar for filter controls -->
      <div class="w-full lg:w-72 shrink-0">
        <div class="bg-white p-5 rounded-lg shadow-md sticky top-4">
          <h2 class="text-xl font-semibold mb-4">Filters</h2>
          <div class="space-y-5">
            <!-- Date range filter -->
            <div>
              <label for="date-range" class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="date-from" class="text-xs text-gray-500 mb-1 block">From</label>
                  <input 
                    id="date-from"
                    type="date" 
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label for="date-to" class="text-xs text-gray-500 mb-1 block">To</label>
                  <input 
                    id="date-to"
                    type="date" 
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <!-- Status filter -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                id="status" 
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="overdue">Overdue</option>
                <option value="approaching">Approaching Due Date</option>
                <option value="penalized">Penalized</option>
              </select>
            </div>
            
            <!-- Search -->
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by lease or tenant..."
                  class="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            
            <!-- Filter buttons -->
            <div class="flex justify-between pt-3">
              <button
                onclick={() => applyFilter({})}
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Filters
              </button>
              <button
                onclick={() => resetFilter()}
                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main content -->
      <div class="flex-1">
        {#if showPenaltyDetails && selectedPenalty}
          <div class="bg-white rounded-lg shadow-md p-5">
            <PenaltyCard 
              penalty={selectedPenalty} 
              onClose={handleCloseDetails}
              onUpdate={handleUpdatePenalty}
            />
          </div>
        {:else}
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-5 border-b">
              <h2 class="text-xl font-semibold">Penalty Records</h2>
              <p class="text-sm text-gray-500 mt-1">
                Click on a row to view details or update penalty amounts
              </p>
            </div>
            <PenaltyTable 
              penalties={penaltyBillings} 
              onPenaltyClick={handlePenaltyClick}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  {#if showPenaltyModal && selectedPenalty}
    <PenaltyModal
      penalty={selectedPenalty}
      open={showPenaltyModal}
      onOpenChange={(open: boolean) => showPenaltyModal = open}
      form={$form}
      enhance={enhance}
      errors={errors}
      constraints={constraints}
      submitting={$submitting}
    />
  {/if}
</div>

