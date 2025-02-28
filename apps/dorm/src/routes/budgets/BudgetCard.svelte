<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import { Progress } from '$lib/components/ui/progress';
    import { Edit, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-svelte';
    import BudgetItemList from './BudgetItemList.svelte';
    import type { Budget, BudgetWithStats } from './types';
    import BudgetAllocationCard from './BudgetAllocationCard.svelte';
  
    // Props using Svelte 5 $props rune
    let { 
      budget,
      isExpanded = false
    } = $props<{
      budget: BudgetWithStats;
      isExpanded: boolean;
    }>();
  
    // Event dispatcher
    const dispatch = createEventDispatcher<{
      edit: Budget;
      delete: number;
      addItem: { budgetId: number };
      toggleExpand: number;
      updateBudget: Budget;
    }>();
  
    // Format currency
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
  
    // Calculate allocation percentage
    let allocationPercentage = $derived(
      budget.planned_amount > 0 
        ? Math.min(Math.round((budget.allocatedAmount || 0) / budget.planned_amount * 100), 100)
        : 0
    );
  </script>
  
  <Card class="bg-white shadow-md mb-4 relative">
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
          onclick={() => dispatch('edit', budget)}
          variant="outline" 
          size="icon" 
          class="h-8 w-8">
          <Edit class="h-4 w-4" />
        </Button>
        <Button 
          onclick={() => dispatch('delete', budget.id)}
          variant="outline" 
          size="icon" 
          class="h-8 w-8 text-red-600 hover:text-red-800">
          <Trash2 class="h-4 w-4" />
        </Button>
        <Button 
          onclick={() => dispatch('toggleExpand', budget.id)}
          variant="ghost" 
          size="icon" 
          class="h-8 w-8">
          {#if isExpanded}
            <ChevronUp class="h-4 w-4" />
          {:else}
            <ChevronDown class="h-4 w-4" />
          {/if}
        </Button>
      </div>
    </CardHeader>
    
    <CardContent class="pb-2">
      {#if budget.project_description}
        <p class="text-sm text-gray-600 mb-4">
          {budget.project_description}
        </p>
      {/if}
      
      <div class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-medium">Budget Allocation</span>
          <span class="text-xs text-gray-500">{allocationPercentage}%</span>
        </div>
        <Progress value={allocationPercentage} class="h-2" />
      </div>
      
      <div class="grid grid-cols-3 gap-3 mb-2">
        <div>
          <div class="text-sm text-gray-500">Planned</div>
          <div class="text-lg font-semibold">{formatCurrency(budget.planned_amount)}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Allocated</div>
          <div class="text-lg font-semibold">{formatCurrency(budget.allocatedAmount || 0)}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Remaining</div>
          <div class="text-lg font-semibold" class:text-green-600={budget.remainingAmount >= 0} class:text-red-600={budget.remainingAmount < 0}>
            {formatCurrency(budget.remainingAmount || 0)}
          </div>
        </div>
      </div>
      
      {#if isExpanded}
        <div class="mt-6 border-t pt-4 relative">
          <BudgetItemList budget={budget} onUpdateBudget={(updatedBudget) => {
            dispatch('updateBudget', updatedBudget);
          }} />
          
          <Button 
            onclick={() => dispatch('addItem', { budgetId: budget.id })}
            variant="default" 
            size="sm" 
            class="absolute bottom-4 right-4 shadow-md flex items-center gap-1 rounded-full h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700"
            title="Add Item">
            <Plus class="h-5 w-5" />
          </Button>
        </div>
      {/if}
    </CardContent>
    
    {#if isExpanded}
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