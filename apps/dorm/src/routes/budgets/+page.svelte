<script lang="ts">
  import { browser } from '$app/environment';
  import { budgetSchema } from './schema';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { invalidate, invalidateAll } from '$app/navigation';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { DollarSign, CheckCircle, Clock, Plus, PieChart, Edit, Trash2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-svelte';
  import type { PageData } from './$types';
  import type { Budget, BudgetWithStats, BudgetItem } from './types';
  import BudgetFormModal from './BudgetFormModal.svelte';
  import BudgetItemFormModal from './BudgetItemFormModal.svelte';

  // Page data using Svelte 5 $props rune
  let { data } = $props<{data: PageData}>();

  // State management for modals and UI
  let showBudgetFormModal = $state(false);
  let showItemFormModal = $state(false);
  let editingBudget = $state(false);
  let selectedBudget = $state<Budget | null>(null);
  let selectedBudgetItem = $state<BudgetItem | null>(null);
  let expandedBudgetIds = $state<Set<number>>(new Set());
  let itemBudgetId = $state<number | null>(null);

  // Form for adding/editing budgets
  const { form, errors, enhance, constraints, submitting, reset } = superForm(
    data.form,
    {
      validators: zodClient(budgetSchema),
      resetForm: true,
      dataType: 'json',
      onUpdate: ({ form }) => {
        console.log('Form updated', form);
      },
      onError: ({ result }) => {
        console.error('Form error', result.error);
        toast.error('Error saving budget');
      },
      onResult: ({ result }) => {
        if (result.type === 'success') {
          toast.success(selectedBudget ? 'Budget updated' : 'Budget added');
          selectedBudget = null;
          invalidateAll();
        }
      }
    }
  );

  // Format currency with Peso sign
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
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

  // Toggle budget expansion
  function toggleExpand(budgetId: number) {
    if (expandedBudgetIds.has(budgetId)) {
      expandedBudgetIds.delete(budgetId);
    } else {
      expandedBudgetIds.add(budgetId);
    }
    expandedBudgetIds = new Set(expandedBudgetIds); // Trigger reactivity
  }

  // Handle add budget
  function handleAddBudget() {
    selectedBudget = null;
    editingBudget = false;
    showBudgetFormModal = true;
  }

  // Handle edit budget
  function handleEditBudget(budget: BudgetWithStats) {
    selectedBudget = budget;
    editingBudget = true;
    showBudgetFormModal = true;
  }

  // Handle add item
  function handleAddItem(budgetId: number) {
    itemBudgetId = budgetId;
    selectedBudgetItem = null;
    showItemFormModal = true;
  }

  // Handle budget form submission
  function handleBudgetSubmit(event: CustomEvent<Budget>) {
    const budget = event.detail;
    
    // Reset the form with the budget data
    reset({
      data: {
        id: budget.id,
        property_id: budget.property_id,
        project_name: budget.project_name,
        project_description: budget.project_description,
        project_category: budget.project_category,
        planned_amount: budget.planned_amount,
        pending_amount: budget.pending_amount,
        actual_amount: budget.actual_amount,
        budget_items: budget.budget_items || [],
        status: budget.status,
        start_date: budget.start_date,
        end_date: budget.end_date
      }
    });
    
    // Submit the form
    setTimeout(() => {
      const submitButton = document.getElementById('submit-budget-form');
      if (submitButton) submitButton.click();
    }, 0);
    
    showBudgetFormModal = false;
  }

  // Handle item form submission
  function handleItemSubmit(event: CustomEvent<BudgetItem>) {
    const newItem = event.detail;
    
    if (!itemBudgetId) return;
    
    // Find the budget
    const budget = data.budgets.find((b: Budget) => b.id === itemBudgetId);
    if (!budget) return;
    
    // Create a copy of the budget items array
    const existingItems = Array.isArray(budget.budget_items) ? budget.budget_items : [];
    const updatedItems = [...existingItems, newItem];
    
    // Reset the form with the updated budget data
    reset({
      data: {
        id: budget.id,
        property_id: budget.property_id,
        project_name: budget.project_name,
        project_description: budget.project_description,
        project_category: budget.project_category,
        planned_amount: budget.planned_amount,
        pending_amount: budget.pending_amount,
        actual_amount: budget.actual_amount,
        budget_items: updatedItems,
        status: budget.status,
        start_date: budget.start_date,
        end_date: budget.end_date
      }
    });
    
    // Submit the form
    setTimeout(() => {
      const submitButton = document.getElementById('submit-budget-form');
      if (submitButton) submitButton.click();
    }, 0);
    
    showItemFormModal = false;
  }

  // Handle delete budget
  async function handleDeleteBudget(budgetId: number) {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', budgetId.toString());
      
      const response = await fetch(`?/delete`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        toast.success('Budget deleted');
        invalidateAll();
      } else {
        toast.error('Error deleting budget');
      }
    } catch (error) {
      console.error('Error deleting budget', error);
      toast.error('Error deleting budget');
    }
  }

  // Refresh data
  async function refreshData() {
    await invalidate('budgets:refresh');
    toast.success('Data refreshed');
  }
</script>

<div class="container mx-auto py-6">
  <!-- Page Header -->
  <div class="flex justify-between items-center mb-6 border-b pb-4">
    <h1 class="text-3xl font-bold">Budget Planner</h1>
  </div>

  <!-- Statistics Summary -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <!-- Total Budget Card -->
    <Card class="bg-white shadow-sm border-gray-200">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-gray-500">Total Planned Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold mb-2">{formatCurrency(data.statistics.totalPlannedBudget)}</div>
        <div class="text-xs text-gray-500">Total budget across all projects</div>
      </CardContent>
    </Card>

    <!-- Allocated Budget Card -->
    <Card class="bg-white shadow-sm border-gray-200">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-gray-500">Allocated Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold mb-2">{formatCurrency(data.statistics.totalAllocatedBudget)}</div>
        {#if data.statistics.totalPlannedBudget > 0}
          {#if data.statistics.totalAllocatedBudget > 0}
            {@const percentage = Math.min(Math.round((data.statistics.totalAllocatedBudget / data.statistics.totalPlannedBudget) * 100), 100)}
            <div class="flex items-center gap-2">
              <Progress value={percentage} class="h-2 flex-1" />
              <span class="text-xs text-gray-500">{percentage}%</span>
            </div>
          {:else}
            <div class="flex items-center gap-2">
              <Progress value={0} class="h-2 flex-1" />
              <span class="text-xs text-gray-500">0%</span>
            </div>
          {/if}
        {:else}
          <div class="text-xs text-gray-500">No planned budget</div>
        {/if}
      </CardContent>
    </Card>

    <!-- Remaining Budget Card -->
    <Card class="bg-white shadow-sm border-gray-200">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-gray-500">Remaining Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold mb-2" class:text-green-600={data.statistics.totalRemainingBudget >= 0} class:text-red-600={data.statistics.totalRemainingBudget < 0}>
          {formatCurrency(data.statistics.totalRemainingBudget)}
        </div>
        <div class="text-xs text-gray-500">Available to allocate</div>
      </CardContent>
    </Card>

    <!-- Project Status Card -->
    <Card class="bg-white shadow-sm border-gray-200">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-gray-500">Project Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div class="flex items-center mb-1">
              <CheckCircle class="h-4 w-4 text-green-500 mr-1" />
              <span class="text-sm">Completed</span>
            </div>
            <div class="text-lg font-bold">{data.statistics.completedProjects}</div>
          </div>
          <div>
            <div class="flex items-center mb-1">
              <Clock class="h-4 w-4 text-yellow-500 mr-1" />
              <span class="text-sm">Ongoing</span>
            </div>
            <div class="text-lg font-bold">{data.statistics.ongoingProjects}</div>
          </div>
        </div>
        {#if (data.statistics.completedProjects + data.statistics.ongoingProjects) > 0}
          {@const completionPercentage = Math.round((data.statistics.completedProjects / (data.statistics.completedProjects + data.statistics.ongoingProjects)) * 100)}
          <div class="flex items-center gap-2">
            <Progress value={completionPercentage} class="h-2 flex-1" />
            <span class="text-xs text-gray-500">{completionPercentage}% Complete</span>
          </div>
        {:else}
          <div class="text-xs text-gray-500">No active projects</div>
        {/if}
      </CardContent>
    </Card>
  </div>

  <!-- Hidden form for submitting budget data -->
  <form id="budget-form" method="POST" action="?/upsert" use:enhance>
    <input type="hidden" name="id" value={$form.id} />
    <input type="hidden" name="property_id" value={$form.property_id} />
    <input type="hidden" name="project_name" value={$form.project_name} />
    <input type="hidden" name="project_description" value={$form.project_description} />
    <input type="hidden" name="project_category" value={$form.project_category} />
    <input type="hidden" name="planned_amount" value={$form.planned_amount} />
    <input type="hidden" name="pending_amount" value={$form.pending_amount} />
    <input type="hidden" name="actual_amount" value={$form.actual_amount} />
    <input type="hidden" name="budget_items" value={JSON.stringify($form.budget_items)} />
    <input type="hidden" name="status" value={$form.status} />
    <input type="hidden" name="start_date" value={$form.start_date} />
    <input type="hidden" name="end_date" value={$form.end_date} />
    <button id="submit-budget-form" type="submit" class="hidden" aria-label="Submit budget form"></button>
  </form>

  <!-- Projects List -->
  <div class="mb-6 flex items-center justify-between">
    <h2 class="text-xl font-semibold">Projects ({data.budgets.length})</h2>
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

  {#if data.budgets.length === 0}
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
      {#each data.budgets as budget (budget.id)}
        <Card class="bg-white shadow-md relative">
          <CardHeader class="pb-2 flex flex-row justify-between items-start">
            <div>
              <div class="flex items-center gap-2">
                <CardTitle class="text-lg font-bold">{budget.project_name}</CardTitle>
                <span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                  {budget.status}
                </span>
              </div>
              <p class="text-sm text-gray-500">
                {budget.project_category} | Property: {budget.property?.name || 'Unknown'} | Created: {new Date(budget.created_at).toLocaleDateString()}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button 
                onclick={() => handleEditBudget(budget)}
                variant="outline" 
                size="icon" 
                class="h-8 w-8">
                <Edit class="h-4 w-4" />
              </Button>
              <Button 
                onclick={() => handleDeleteBudget(budget.id)}
                variant="outline" 
                size="icon" 
                class="h-8 w-8 text-red-600 hover:text-red-800">
                <Trash2 class="h-4 w-4" />
              </Button>
              <Button 
                onclick={() => toggleExpand(budget.id)}
                variant="ghost" 
                size="icon" 
                class="h-8 w-8">
                {#if expandedBudgetIds.has(budget.id)}
                  <ChevronUp class="h-4 w-4" />
                {:else}
                  <ChevronDown class="h-4 w-4" />
                {/if}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent class="pb-4">
            {#if budget.project_description}
              <p class="text-sm text-gray-600 mb-4">
                {budget.project_description}
              </p>
            {/if}
            
            <!-- Budget Progress Bar -->
            <div class="mb-4">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium">Budget Allocation</span>
                {#if true}
                  {@const allocationPercentage = budget.planned_amount > 0 
                    ? Math.min(Math.round((budget.allocatedAmount || 0) / budget.planned_amount * 100), 100)
                    : 0}
                  <span class="text-xs text-gray-500">{allocationPercentage}%</span>
                {/if}
              </div>
              {#if true}
                {@const allocationPercentage = budget.planned_amount > 0 
                  ? Math.min(Math.round((budget.allocatedAmount || 0) / budget.planned_amount * 100), 100)
                  : 0}
                <Progress value={allocationPercentage} class="h-2" />
              {/if}
            </div>
            
            <!-- Budget Summary -->
            <div class="grid grid-cols-3 gap-3 mb-2">
              <div>
                <div class="text-sm text-gray-500">Planned</div>
                <div class="text-lg font-bold">{formatCurrency(budget.planned_amount)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Allocated</div>
                <div class="text-lg font-bold">{formatCurrency(budget.allocatedAmount || 0)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Remaining</div>
                <div class="text-lg font-semibold" class:text-green-600={budget.remainingAmount >= 0} class:text-red-600={budget.remainingAmount < 0}>
                  {formatCurrency(budget.remainingAmount || 0)}
                </div>
              </div>
            </div>
            
            <!-- Expanded Details -->
            {#if expandedBudgetIds.has(budget.id)}
              <div class="mt-6 pt-4 border-t relative">
                <h3 class="text-lg font-semibold mb-4">Budget Items</h3>
                
                {#if !budget.budget_items?.length}
                  <div class="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p class="text-gray-500">No budget items added yet.</p>
                    <Button 
                      onclick={() => handleAddItem(budget.id)} 
                      variant="link" 
                      class="mt-2 text-blue-600">
                      Add your first item
                    </Button>
                  </div>
                {:else}
                  <div class="overflow-x-auto rounded-md bg-gray-50 p-3">
                    <table class="w-full">
                      <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                          <th class="px-4 py-2 text-left">Item</th>
                          <th class="px-4 py-2 text-left">Type</th>
                          <th class="px-4 py-2 text-right">Cost</th>
                          <th class="px-4 py-2 text-right">Qty</th>
                          <th class="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each budget.budget_items as item, i}
                          <tr class="border-b border-gray-200">
                            <td class="px-4 py-2 text-sm font-medium">{item.name}</td>
                            <td class="px-4 py-2 text-sm">{item.type}</td>
                            <td class="px-4 py-2 text-sm text-right">{formatCurrency(item.cost)}</td>
                            <td class="px-4 py-2 text-sm text-right">{item.quantity}</td>
                            <td class="px-4 py-2 text-sm font-semibold text-right">
                              {formatCurrency(item.cost * item.quantity)}
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
                
                <!-- Add Item Button -->
                <Button 
                  onclick={() => handleAddItem(budget.id)}
                  variant="default" 
                  size="sm" 
                  class="absolute bottom-4 right-4 shadow-md flex items-center gap-1 rounded-full h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700"
                  title="Add Item">
                  <Plus class="h-5 w-5" />
                </Button>
              </div>
              
              <!-- Project Dates -->
              <div class="mt-4 pt-2 text-xs text-gray-500 flex justify-between">
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
            {/if}
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Budget Form Modal -->
{#if showBudgetFormModal}
  <BudgetFormModal
    budget={selectedBudget}
    properties={data.properties}
    editMode={editingBudget}
    on:close={() => (showBudgetFormModal = false)}
    on:submit={handleBudgetSubmit}
  />
{/if}

<!-- Budget Item Form Modal -->
{#if showItemFormModal}
  <BudgetItemFormModal
    item={selectedBudgetItem}
    editMode={false}
    on:close={() => (showItemFormModal = false)}
    on:submit={handleItemSubmit}
  />
{/if}

{#if browser && import.meta.env.DEV}
  <SuperDebug data={$form} />
{/if}