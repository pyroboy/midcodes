<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Receipt, Plus } from 'lucide-svelte';
  import type { Expense } from './types';
  import type { Property } from './types';
  import ExpenseCard from './ExpenseCard.svelte';
  import * as Select from '$lib/components/ui/select';

  // Props
  interface Props {
    expenses: Expense[];
    properties: Property[];
    selectedPropertyId: number | null;
    title?: string;
  }

  let { 
    expenses = [], 
    properties = [],
    selectedPropertyId = null,
    title = "Operational Expenses"
  }: Props = $props();

  // Create event dispatcher
  const dispatch = createEventDispatcher<{
    delete: number;
    add: any;
  }>();

  // Calculate total expenses
  let totalExpenses = $derived.by( () => {
    let total = 0;
    for (const expense of expenses) {
      total += expense.amount || 0;
    }
    return total;
  });

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  // Input fields
  let newDesc = $state('');
  let newAmount = $state('');

  // Operational expense types
  const operationalExpenseTypes = ['OPERATIONAL', 'MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'SALARY', 'OTHERS'];
  let selectedExpenseType = $state('OPERATIONAL');

  // Handle delete event from child component
  function handleDelete(event: CustomEvent<number>) {
    console.log('OperationalExpensesList received delete event for ID:', event.detail);
    dispatch('delete', event.detail);
  }

  // Handle adding a new expense
  function handleAdd() {
    if (!newDesc || !newAmount || !selectedPropertyId) return;
    
    dispatch('add', {
      description: newDesc,
      amount: parseFloat(newAmount),
      type: selectedExpenseType
    });
    
    // Reset inputs
    newDesc = '';
    newAmount = '';
  }

  // Check if form is valid
  let isFormValid = $derived.by(() => {
    return !!newDesc && !!newAmount && !!selectedPropertyId;
  });
</script>

<Card class="shadow-lg">
  <CardHeader class="border-b bg-gray-50">
    <CardTitle class="flex items-center gap-2 text-gray-700">
      <Receipt class="h-5 w-5" />
      {title}
    </CardTitle>
  </CardHeader>
  <CardContent class="p-4 space-y-4">
    {#if expenses.length === 0}
      <p class="text-gray-500 text-center py-2">No operational expenses</p>
    {:else}
      <div class="space-y-4">
        {#each expenses as expense (expense.id)}
          <ExpenseCard 
            expense={expense} 
            variant="operational"
            on:delete={handleDelete} 
          />
        {/each}
        
        <div class="mt-2 flex justify-end items-center p-2 border-t">
          <p class="font-bold">Total: <span class="text-green-700">{formatCurrency(totalExpenses)}</span></p>
        </div>
      </div>
    {/if}
    
    <!-- Add New Operational Expense -->
    <div class="border-t pt-4 mt-2">
      <h3 class="font-medium mb-2">Add New Operational Expense</h3>
      {#if !selectedPropertyId}
        <p class="text-amber-600 text-sm mb-2">Please select a property first</p>
      {/if}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div class="space-y-4 p-2">
          <div class="grid grid-cols-1 gap-2">
            <div class="mb-2">
              <label for="expense-type" class="text-sm font-medium text-gray-600 block mb-1">Expense Type</label>
              <Select.Root
                type="single"
                name="expense-type"
                value={selectedExpenseType}
                onValueChange={(value) => {
                  selectedExpenseType = value;
                }}
              >
                <Select.Trigger class="w-full border bg-white">
                  <span>{selectedExpenseType}</span>
                </Select.Trigger>
                <Select.Content>
                  <Select.Group>
                    {#each operationalExpenseTypes as type}
                      <Select.Item value={type}>{type}</Select.Item>
                    {/each}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </div>
            <div class="md:col-span-2">
              <Input
                value={newDesc}
                placeholder="Expense Description"
                class="bg-white"
                oninput={(e) => newDesc = (e.target as HTMLInputElement).value}
                disabled={!selectedPropertyId}
              />
            </div>
          </div>
          <div class="flex gap-2">
            <div class="relative flex-grow">
              <span class="absolute left-3 top-2 text-gray-500">₱</span>
              <Input
                type="number"
                value={newAmount}
                placeholder="0.00"
                class="pl-8 bg-white"
                oninput={(e) => newAmount = (e.target as HTMLInputElement).value}
                disabled={!selectedPropertyId}
              />
            </div>
            <Button 
              variant="default" 
              class="bg-green-600 hover:bg-green-700" 
              onclick={handleAdd}
              disabled={!newDesc || !newAmount || !selectedPropertyId}
            >
              <Plus class="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
