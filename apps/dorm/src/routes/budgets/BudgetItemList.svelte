<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Plus, Edit, Trash2 } from 'lucide-svelte';
  import BudgetItemFormModal from './BudgetItemFormModal.svelte';
  import type { BudgetItem, Budget, BudgetWithStats } from './types';
  import { v4 as uuidv4 } from 'uuid';

  // Props using Svelte 5 $props rune
  let { 
    budget,
    onUpdateBudget
  } = $props<{
    budget: BudgetWithStats;
    onUpdateBudget: (budget: Budget) => void;
  }>();

  // State
  let showFormModal = $state(false);
  let editMode = $state(false);
  let currentItem = $state<BudgetItem | null>(null);
  let itemIndex = $state<number | null>(null);

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Add a new budget item
  function handleAddItem() {
    currentItem = {
      id: uuidv4(),
      name: '',
      type: 'MATERIALS',
      cost: 0,
      quantity: 1
    };
    editMode = false;
    showFormModal = true;
  }

  // Edit a budget item
  function handleEditItem(item: BudgetItem, index: number) {
    currentItem = { ...item };
    itemIndex = index;
    editMode = true;
    showFormModal = true;
  }

  // Delete a budget item
  function handleDeleteItem(index: number) {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    // Create a copy of the budget items array and remove the item
    const updatedItems = [...budget.budget_items];
    updatedItems.splice(index, 1);

    // Update the budget
    onUpdateBudget({
      ...budget,
      budget_items: updatedItems
    });
  }

  // Handle modal close
  function handleModalClose() {
    showFormModal = false;
  }

  // Handle item form submission
  function handleItemSubmit(event: CustomEvent<BudgetItem>) {
    const item = event.detail;
    
    // Create a copy of the budget items array
    const updatedItems = [...(budget.budget_items || [])];
    
    if (editMode && itemIndex !== null) {
      // Update the existing item
      updatedItems[itemIndex] = item;
    } else {
      // Add the new item
      updatedItems.push(item);
    }

    // Update the budget
    onUpdateBudget({
      ...budget,
      budget_items: updatedItems
    });

    showFormModal = false;
  }

  // Calculate total for an item
  function calculateItemTotal(item: BudgetItem): number {
    return item.cost * item.quantity;
  }
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-semibold">Budget Items</h3>
    <Button 
      onclick={handleAddItem}
      variant="outline" 
      size="sm" 
      class="flex items-center gap-1">
      <Plus class="h-4 w-4" />
      Add Item
    </Button>
  </div>

  {#if !budget.budget_items || budget.budget_items.length === 0}
    <div class="text-center py-8 bg-gray-50 rounded-lg">
      <p class="text-gray-500">No budget items added yet.</p>
      <Button onclick={handleAddItem} variant="link" class="mt-2">Add your first item</Button>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead class="text-right">Cost</TableHead>
            <TableHead class="text-right">Quantity</TableHead>
            <TableHead class="text-right">Total</TableHead>
            <TableHead class="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each budget.budget_items as item, index (item.id || index)}
            <TableRow>
              <TableCell class="font-medium">{item.name}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell class="text-right">{formatCurrency(item.cost)}</TableCell>
              <TableCell class="text-right">{item.quantity}</TableCell>
              <TableCell class="text-right font-semibold">{formatCurrency(calculateItemTotal(item))}</TableCell>
              <TableCell class="flex justify-end gap-1">
                <Button 
                  onclick={() => handleEditItem(item, index)}
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8">
                  <Edit class="h-4 w-4" />
                </Button>
                <Button 
                  onclick={() => handleDeleteItem(index)}
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-red-600 hover:text-red-800">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>

{#if showFormModal}
  <BudgetItemFormModal
    item={currentItem}
    editMode={editMode}
    on:close={handleModalClose}
    on:submit={handleItemSubmit}
  />
{/if}
