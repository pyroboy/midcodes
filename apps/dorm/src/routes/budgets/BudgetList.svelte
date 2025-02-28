<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus, RefreshCw, DollarSign } from 'lucide-svelte';
  import BudgetFormModal from './BudgetFormModal.svelte';
  import BudgetItemFormModal from './BudgetItemFormModal.svelte';
  import BudgetCard from './BudgetCard.svelte';
  import type { Budget, BudgetWithStats, Property, BudgetItem } from './types';
  import { defaultBudget } from './schema';
  import { v4 as uuidv4 } from 'uuid';

  // Props using Svelte 5 $props rune
  let { 
    budgets = [],
    properties = []
  } = $props<{
    budgets: BudgetWithStats[];
    properties: Property[];
  }>();

  // State
  let showBudgetFormModal = $state(false);
  let showItemFormModal = $state(false);
  let editMode = $state(false);
  let currentBudget = $state<Budget | null>(null);
  let currentBudgetId = $state<number | null>(null);
  let currentBudgetItem = $state<BudgetItem | null>(null);
  let expandedBudgetIds = $state<Set<number>>(new Set());

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    edit: Budget;
    delete: number;
    add: Partial<Budget>;
    refresh: void;
  }>();

  // Handle add budget button click
  function handleAddBudget() {
    currentBudget = { ...defaultBudget, property_id: properties[0]?.id } as Budget;
    editMode = false;
    showBudgetFormModal = true;
  }

  // Handle edit budget click
  function handleEditBudget(event: CustomEvent<Budget>) {
    currentBudget = event.detail;
    editMode = true;
    showBudgetFormModal = true;
  }

  // Handle delete budget click
  function handleDeleteBudget(event: CustomEvent<number>) {
    dispatch('delete', event.detail);
  }

  // Handle update budget
  function handleUpdateBudget(event: CustomEvent<Budget>) {
    dispatch('edit', event.detail);
  }

  // Handle toggle expand
  function handleToggleExpand(event: CustomEvent<number>) {
    const budgetId = event.detail;
    if (expandedBudgetIds.has(budgetId)) {
      expandedBudgetIds.delete(budgetId);
    } else {
      expandedBudgetIds.add(budgetId);
    }
    expandedBudgetIds = new Set(expandedBudgetIds); // Trigger reactivity
  }

  // Handle add budget item
  function handleAddBudgetItem(event: CustomEvent<{ budgetId: number }>) {
    const { budgetId } = event.detail;
    currentBudgetId = budgetId;
    currentBudgetItem = {
      id: uuidv4(),
      name: '',
      type: 'MATERIALS',
      cost: 0,
      quantity: 1
    };
    showItemFormModal = true;
  }

  // Handle modal close
  function handleBudgetModalClose() {
    showBudgetFormModal = false;
  }

  // Handle item modal close
  function handleItemModalClose() {
    showItemFormModal = false;
  }

  // Handle budget form submission
  function handleBudgetSubmit(event: CustomEvent<Budget>) {
    const budget = event.detail;
    if (editMode) {
      dispatch('edit', budget);
    } else {
      dispatch('add', budget);
    }
    showBudgetFormModal = false;
  }

  // Handle item form submission
  function handleItemSubmit(event: CustomEvent<BudgetItem>) {
    const item = event.detail;
    
    if (!currentBudgetId) return;
    
    // Find the budget
    const budget = budgets.find((b: BudgetWithStats) => b.id === currentBudgetId);
    if (!budget) return;
    
    // Create a copy of the budget items array, ensuring it's always an array
    const existingItems = Array.isArray(budget.budget_items) ? budget.budget_items : [];
    const updatedItems = [...existingItems, item];
    
    // Calculate new allocated amount
    const newAllocatedAmount = updatedItems.reduce(
      (total: number, item: BudgetItem) => total + (item.cost * item.quantity),
      0
    );
    
    // Create an updated budget object
    const updatedBudget = {
      ...budget,
      budget_items: updatedItems,
      allocatedAmount: newAllocatedAmount,
      remainingAmount: budget.planned_amount - newAllocatedAmount
    };
    
    // Update the budget
    dispatch('edit', updatedBudget);
    
    // Close the modal
    showItemFormModal = false;
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
      <BudgetCard 
        budget={budget}
        isExpanded={expandedBudgetIds.has(budget.id)}
        on:edit={handleEditBudget}
        on:delete={handleDeleteBudget}
        on:addItem={handleAddBudgetItem}
        on:toggleExpand={handleToggleExpand}
        on:updateBudget={handleUpdateBudget}
      />
    {/each}
  </div>
{/if}

{#if showBudgetFormModal}
  <BudgetFormModal
    budget={currentBudget}
    properties={properties}
    editMode={editMode}
    on:close={handleBudgetModalClose}
    on:submit={handleBudgetSubmit}
  />
{/if}

{#if showItemFormModal}
  <BudgetItemFormModal
    item={currentBudgetItem}
    editMode={false}
    on:close={handleItemModalClose}
    on:submit={handleItemSubmit}
  />
{/if}