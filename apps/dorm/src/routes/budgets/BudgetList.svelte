<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Edit, Trash2, Plus, RefreshCw, ChevronDown, ChevronUp, DollarSign } from 'lucide-svelte';
  import BudgetItemList from './BudgetItemList.svelte';
  import BudgetFormModal from './BudgetFormModal.svelte';
  import type { Budget, BudgetWithStats, Property } from './types';
  import { defaultBudget } from './schema';

  // Props using Svelte 5 $props rune
  let { 
    budgets = [],
    properties = []
  } = $props<{
    budgets: BudgetWithStats[];
    properties: Property[];
  }>();

  // State
  let showFormModal = $state(false);
  let editMode = $state(false);
  let currentBudget = $state<Budget | null>(null);

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    edit: Budget;
    delete: number;
    add: Partial<Budget>;
    refresh: void;
  }>();

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Toggle expand/collapse for a budget
  function toggleBudgetExpansion(budgetId: number) {
    budgets = budgets.map((budget: BudgetWithStats) => 
      budget.id === budgetId 
        ? { ...budget, isExpanded: !budget.isExpanded } 
        : budget
    );
  }

  // Handle edit button click
  function handleEditClick(budget: BudgetWithStats) {
    currentBudget = budget;
    editMode = true;
    showFormModal = true;
  }

  // Handle delete button click
  function handleDeleteClick(budgetId: number) {
    dispatch('delete', budgetId);
  }

  // Handle add budget button click
  function handleAddBudget() {
    currentBudget = { ...defaultBudget, property_id: properties[0]?.id } as Budget;
    editMode = false;
    showFormModal = true;
  }

  // Handle modal close
  function handleModalClose() {
    showFormModal = false;
  }

  // Handle budget form submission
  function handleBudgetSubmit(event: CustomEvent<Budget>) {
    const budget = event.detail;
    if (editMode) {
      dispatch('edit', budget);
    } else {
      dispatch('add', budget);
    }
    showFormModal = false;
  }

  // Get status badge color
  function getStatusColor(status: string): string {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800';
      case 'ONGOING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Refresh data
  function refreshData() {
    dispatch('refresh');
  }
</script>

<div class="mb-6 flex items-center justify-between">
  <h2 class="text-xl font-semibold">Projects ({budgets.length})</h2>
  <div class="flex gap-2">
    <Button onclick={refreshData} variant="outline" size="sm" class="flex items-center gap-1">
      <RefreshCw class="h-4 w-4" />
      Refresh
    </Button>
    <Button onclick={handleAddBudget} variant="default" size="sm" class="flex items-center gap-1">
      <Plus class="h-4 w-4" />
      Add Project
    </Button>
  </div>
</div>

{#if budgets.length === 0}
  <div class="bg-white rounded-lg shadow-sm p-8 text-center border">
    <DollarSign class="h-12 w-12 mx-auto text-gray-400" />
    <h3 class="mt-2 text-lg font-medium text-gray-900">No budget projects</h3>
    <p class="mt-1 text-sm text-gray-500">Get started by creating your first budget project.</p>
    <div class="mt-6">
      <Button onclick={handleAddBudget} class="flex items-center gap-1 mx-auto">
        <Plus class="h-4 w-4" />
        Add Project
      </Button>
    </div>
  </div>
{:else}
  <div class="space-y-4">
    {#each budgets as budget (budget.id)}
      <Card class="bg-white shadow-md">
        <CardHeader class="pb-2 flex flex-row justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <CardTitle class="text-lg font-bold">{budget.project_name}</CardTitle>
              <Badge class={getStatusColor(budget.status)}>{budget.status}</Badge>
            </div>
            <CardDescription>
              {budget.project_category} | Property: {budget.property?.name || 'Unknown'} | Created: {new Date(budget.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Button 
              onclick={() => handleEditClick(budget)}
              variant="outline" 
              size="icon" 
              class="h-8 w-8">
              <Edit class="h-4 w-4" />
            </Button>
            <Button 
              onclick={() => handleDeleteClick(budget.id)}
              variant="outline" 
              size="icon" 
              class="h-8 w-8 text-red-600 hover:text-red-800">
              <Trash2 class="h-4 w-4" />
            </Button>
            <Button 
              onclick={() => toggleBudgetExpansion(budget.id)}
              variant="ghost" 
              size="icon" 
              class="h-8 w-8">
              {#if budget.isExpanded}
                <ChevronUp class="h-4 w-4" />
              {:else}
                <ChevronDown class="h-4 w-4" />
              {/if}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent class="pb-2">
          <div class="flex flex-wrap justify-between mb-2">
            <div class="w-full md:w-auto mb-2 md:mb-0">
              <div class="text-sm text-gray-500">Planned Budget</div>
              <div class="text-lg font-semibold">{formatCurrency(budget.planned_amount)}</div>
            </div>
            <div class="w-full md:w-auto mb-2 md:mb-0">
              <div class="text-sm text-gray-500">Allocated</div>
              <div class="text-lg font-semibold">{formatCurrency(budget.allocatedAmount || 0)}</div>
            </div>
            <div class="w-full md:w-auto">
              <div class="text-sm text-gray-500">Remaining</div>
              <div class="text-lg font-semibold" class:text-green-600={budget.remainingAmount >= 0} class:text-red-600={budget.remainingAmount < 0}>
                {formatCurrency(budget.remainingAmount || 0)}
              </div>
            </div>
          </div>
          
          {#if budget.project_description}
            <p class="text-sm text-gray-600 mt-2">
              {budget.project_description}
            </p>
          {/if}
          
          {#if budget.isExpanded}
            <div class="mt-4 border-t pt-4">
              <BudgetItemList budget={budget} onUpdateBudget={(updatedBudget: Budget) => dispatch('edit', updatedBudget)} />
            </div>
          {/if}
        </CardContent>
        
        {#if budget.isExpanded}
          <CardFooter class="pt-0">
            <div class="text-xs text-gray-500 w-full flex justify-between items-center">
              <div>
                <span>Start: {budget.start_date || 'Not set'}</span>
                {#if budget.end_date}
                  <span class="ml-4">End: {budget.end_date}</span>
                {/if}
              </div>
              <div>
                Last updated: {new Date(budget.updated_at).toLocaleDateString()}
              </div>
            </div>
          </CardFooter>
        {/if}
      </Card>
    {/each}
  </div>
{/if}

{#if showFormModal}
  <BudgetFormModal
    budget={currentBudget}
    properties={properties}
    editMode={editMode}
    on:close={handleModalClose}
    on:submit={(event: CustomEvent<Budget>) => handleBudgetSubmit(event)}
  />
{/if}
