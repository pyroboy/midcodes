<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { invalidate } from '$app/navigation';
  import { updatePenaltySchema } from './formSchema';
  import type { PenaltyBilling, PenaltyFilter } from './types';
  import type { AnyZodObject } from 'zod';
  import { toast } from 'svelte-sonner';
  // UI Components
  import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle, 
    CardFooter
  } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import * as Select from '$lib/components/ui/select';
  
  // Custom components
  import PenaltyTable from './PenaltyTable.svelte';
  import PenaltyCard from './PenaltyCard.svelte';
  import PenaltyModal from './PenaltyModal.svelte';
  import PenaltyRulesModal from './PenaltyRulesModal.svelte';
  
  // Utilities
  import { formatCurrency } from '$lib/utils/format';
  
  let { data } = $props();
  let penaltyBillings = $state(data.penaltyBillings);
  let selectedPenalty: PenaltyBilling | undefined = $state();
  let showPenaltyDetails = $state(false);
  let showPenaltyModal = $state(false);
  let isFilterOpen = $state(true);
  let showRulesModal = $state(false);
  
  // Filter state
  let filter: PenaltyFilter = $state({
    dateRange: {
      start: '',
      end: ''
    },
    status: null,
    searchTerm: ''
  });

  let fromDate = $state('');
  let toDate = $state('');
  let statusFilter = $state('');
  let searchTerm = $state('');
  
  // Status options for the select
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OVERDUE', label: 'Overdue' }
  ];
  
  $effect(() => {
    penaltyBillings = data.penaltyBillings;
  });

  // Calculate statistics
  let totalPenaltyAmount = $derived(
    penaltyBillings.reduce((sum, billing) => sum + billing.penalty_amount, 0)
  );
  
  let overdueCount = $derived(
    penaltyBillings.filter(billing => new Date(billing.due_date) < new Date()).length
  );
  
  let pendingCount = $derived(
    penaltyBillings.filter(billing => billing.status === 'PENDING').length
  );

  const { form, enhance, errors, constraints, submitting, reset } = superForm(data.form, {
    id: 'penalty-form',
    validators: zodClient(updatePenaltySchema as AnyZodObject),
    validationMethod: 'oninput',
    dataType: 'json',
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      toast.error('Update Failed', {
        description: result.error.message || 'An unexpected error occurred.'
      });
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        toast.success('Penalty Updated', {
          description: `The penalty for ${selectedPenalty?.lease?.name} has been successfully updated.`
        });
        await invalidate('app:penalties');
        reset();
      }
      if (result.type === 'failure') {
        toast.error('Update Failed', {
          description: result.data?.message || 'A validation error occurred.'
        });
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

  function toggleFilter() {
    isFilterOpen = !isFilterOpen;
  }
  
  function handleStatusChange(value: string) {
    statusFilter = value;
  }

  function applyFilter() {
    filter = {
      dateRange: {
        start: fromDate,
        end: toDate
      },
      status: statusFilter as any || null,
      searchTerm: searchTerm
    };
    
    // In a real implementation, you'd fetch from server with these filters
    // For now, we'll simulate filtering client-side
    
    // This will trigger a notification to the user that filtering is working
    const successMessage = document.getElementById('filter-success');
    if (successMessage) {
      successMessage.classList.remove('hidden');
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);
    }
  }

  function resetFilter() {
    fromDate = '';
    toDate = '';
    statusFilter = '';
    searchTerm = '';
    filter = {};
    
    // This would typically refresh all data from the server
    // For now, just show the success message
    const successMessage = document.getElementById('filter-success');
    if (successMessage) {
      successMessage.classList.remove('hidden');
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);
    }
  }
  
  function handleSaveRules(rules: any) {
    // Here you would typically save the rules to your backend
    showRulesModal = false;
    
    // For demo purposes, show a success message
    const successMessage = document.getElementById('filter-success');
    if (successMessage) {
      const messageElement = successMessage.querySelector('span');
      if (messageElement) {
        messageElement.textContent = "Penalty rules saved successfully";
      }
      successMessage.classList.remove('hidden');
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Page Header -->
  <div class="bg-white border-b">
    <div class="max-w-[1600px] mx-auto px-4 py-5">
      <div class="flex flex-col space-y-2">
        <div class="flex items-center text-sm text-gray-500">
          <a href="/" class="hover:text-gray-700" data-sveltekit-preload-data="hover">Dashboard</a>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          <span class="font-medium text-gray-900">Penalty Billings</span>
        </div>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Penalty Management</h1>
          <div class="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onclick={toggleFilter}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <!-- Gear icon for penalty rules -->
            <Button
              variant="outline"
              size="sm"
              onclick={() => showRulesModal = true}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Penalty Rules
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Success Message -->
  <div id="filter-success" class="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md hidden transition-opacity duration-300 z-50">
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <span>Filters applied successfully</span>
    </div>
  </div>

  <!-- Stats Section -->
  <div class="max-w-[1600px] mx-auto px-4 py-5">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-gray-500">Total Penalties</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-baseline">
            <span class="text-2xl font-bold text-gray-900">{formatCurrency(totalPenaltyAmount)}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Across {penaltyBillings.length} billings</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-gray-500">Overdue Billings</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-baseline">
            <span class="text-2xl font-bold text-gray-900">{overdueCount}</span>
            <span class="ml-2 text-sm text-red-600">Requiring attention</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Past due date and not fully paid</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-gray-500">Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-baseline">
            <span class="text-2xl font-bold text-gray-900">{pendingCount}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Billings with pending payment status</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filters in a single row with fixed layout -->
    {#if isFilterOpen}
    <Card class="mb-6">
      <CardContent class="pt-6">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1 min-w-[180px]">
            <Label for="date-from" class="mb-2 block">From Date</Label>
            <Input 
              id="date-from"
              type="date" 
              bind:value={fromDate}
            />
          </div>
          
          <div class="flex-1 min-w-[180px]">
            <Label for="date-to" class="mb-2 block">To Date</Label>
            <Input 
              id="date-to"
              type="date" 
              bind:value={toDate}
            />
          </div>
          
          <div class="flex-1 min-w-[180px]">
            <Label for="status" class="mb-2 block">Status</Label>
            <Select.Root 
              type="single" 
              value={statusFilter}
              onValueChange={handleStatusChange}
              items={statusOptions}
            >
              <Select.Trigger>
                {#snippet children()}
                  {statusOptions.find(option => option.value === statusFilter)?.label || 'Select status'}
                {/snippet}
              </Select.Trigger>
              <Select.Content>
                {#snippet children()}
                  <Select.Group>
                    {#each statusOptions as option}
                      <Select.Item value={option.value}>
                        {#snippet children()}
                          {option.label}
                        {/snippet}
                      </Select.Item>
                    {/each}
                  </Select.Group>
                {/snippet}
              </Select.Content>
            </Select.Root>
          </div>
          
          <div class="flex-1 min-w-[180px]">
            <Label for="search" class="mb-2 block">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search lease or tenant..."
              bind:value={searchTerm}
            />
          </div>
          
          <div class="flex space-x-2 ml-auto">
            <Button 
              variant="default"
              onclick={applyFilter}
            >
              Apply
            </Button>
            <Button
              variant="outline"
              onclick={resetFilter}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

    <div class="flex flex-col">
      <!-- Main content -->
      <div class="flex-1 transition-all duration-300 ease-in-out">
        {#if showPenaltyDetails && selectedPenalty}
          <Card>
            <CardContent class="p-0">
              <PenaltyCard 
                penalty={selectedPenalty} 
                onClose={handleCloseDetails}
                onUpdate={handleUpdatePenalty}
              />
            </CardContent>
          </Card>
        {:else}
          <!-- Fixed: Added overflow-hidden to the Card and wrapped PenaltyTable in a div with overflow-x-auto -->
          <Card class="overflow-hidden">
            <CardHeader>
              <div class="flex justify-between items-center">
                <div>
                  <CardTitle>Penalty Records</CardTitle>
                  <CardDescription>
                    Click on a row to view details or update penalty amounts
                  </CardDescription>
                </div>
                <Badge variant="outline" class="px-3 py-1">
                  {penaltyBillings.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="p-0">
              <div class="overflow-x-auto">
                <PenaltyTable 
                  penalties={penaltyBillings} 
                  onPenaltyClick={handlePenaltyClick}
                />
              </div>
            </CardContent>
          </Card>
        {/if}
      </div>
    </div>
  </div>
  
  {#if showPenaltyModal && selectedPenalty}
    <PenaltyModal
      penalty={selectedPenalty}
      open={showPenaltyModal}
      onOpenChange={(open: boolean) => showPenaltyModal = open}
      bind:form={$form}
      enhance={enhance}
      errors={errors}
      submitting={$submitting}
    />
  {/if}
  
  <!-- Use the separate PenaltyRulesModal component -->
  <PenaltyRulesModal
    open={showRulesModal}
    onOpenChange={(open: boolean) => showRulesModal = open}
    onSave={handleSaveRules}
  />
</div>