<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Progress } from '$lib/components/ui/progress';
    
    // Props using Svelte 5 $props rune
    let { 
      plannedAmount = 0,
      allocatedAmount = 0,
      title = "Budget Distribution"
    } = $props();
  
    // Calculate remaining amount and progress percentage
    let remainingAmount = $derived(plannedAmount - allocatedAmount);
    let allocatedPercentage = $derived(
      plannedAmount > 0 ? Math.min(Math.round((allocatedAmount / plannedAmount) * 100), 100) : 0
    );
  
    // Format currency with Peso sign
    function formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
      }).format(amount);
    }
  </script>
  
  <Card class="bg-white shadow-sm border-gray-200 h-full">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex justify-between items-center mb-2">
        <div>
          <div class="text-xs text-gray-500">Planned</div>
          <div class="text-xl font-bold">{formatCurrency(plannedAmount)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500">Remaining</div>
          <div class="text-xl font-bold" class:text-green-600={remainingAmount >= 0} class:text-red-600={remainingAmount < 0}>
            {formatCurrency(remainingAmount)}
          </div>
        </div>
      </div>
      
      <div class="space-y-3">
        {#if plannedAmount > 0}
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center text-xs">
              <span>Allocated ({formatCurrency(allocatedAmount)})</span>
              <span>{allocatedPercentage}%</span>
            </div>
            <Progress 
              value={allocatedPercentage} 
              class="h-2.5"
            />
          </div>
        {:else}
          <div class="text-xs text-gray-500 py-2">No planned budget</div>
        {/if}
        
        <div class="text-xs text-gray-500 mt-1">
          {#if remainingAmount >= 0}
            {formatCurrency(remainingAmount)} available to allocate
          {:else}
            Over budget by {formatCurrency(Math.abs(remainingAmount))}
          {/if}
        </div>
      </div>
    </CardContent>
  </Card>