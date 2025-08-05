<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Progress } from '$lib/components/ui/progress';
    import { PieChart, CircleDollarSign, ArrowDownCircle } from 'lucide-svelte';
    
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
    let remainingPercentage = $derived(
      plannedAmount > 0 ? Math.max(0, Math.min(Math.round((remainingAmount / plannedAmount) * 100), 100)) : 0
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
  
  <Card class="bg-white shadow hover:shadow-md transition-shadow border border-gray-200 rounded-xl overflow-hidden h-full">
    <CardHeader class="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
      <CardTitle class="text-sm font-medium text-gray-700 flex items-center gap-2">
        <PieChart class="h-4 w-4 text-purple-600" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent class="pt-4">
      <div class="flex items-stretch gap-4 mb-4">
        <div class="flex-1 p-3 rounded-lg bg-green-50 border border-green-100">
          <div class="flex items-center gap-1.5 mb-1">
            <CircleDollarSign class="h-4 w-4 text-green-600" />
            <span class="text-xs font-medium text-green-800">Allocated</span>
          </div>
          <div class="text-lg font-bold text-green-700">{formatCurrency(allocatedAmount)}</div>
        </div>
        <div class="flex-1 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <div class="flex items-center gap-1.5 mb-1">
            <ArrowDownCircle class="h-4 w-4 text-blue-600" />
            <span class="text-xs font-medium text-blue-800">Remaining</span>
          </div>
          <div class="text-lg font-bold text-blue-700">{formatCurrency(remainingAmount)}</div>
        </div>
      </div>
      
      <div class="space-y-4 mt-2">
        <!-- Allocated Progress Bar -->
        <div class="space-y-2">
          <div class="flex justify-between items-center text-xs font-medium">
            <span class="text-gray-700">Allocated</span>
            <span class="text-gray-700">{allocatedPercentage}%</span>
          </div>
          <div class="relative pt-1">
            <div class="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-200">
              <div 
                style="width: {allocatedPercentage}%" 
                class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 rounded-full transition-all duration-500 ease-in-out"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Remaining Progress Bar -->
        {#if remainingAmount >= 0}
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs font-medium">
              <span class="text-gray-700">Remaining</span>
              <span class="text-gray-700">{remainingPercentage}%</span>
            </div>
            <div class="relative pt-1">
              <div class="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-200">
                <div 
                  style="width: {remainingPercentage}%" 
                  class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
                ></div>
              </div>
            </div>
          </div>
        {:else}
          <div class="bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2">
            <span class="text-xs text-red-600">Over budget by {formatCurrency(Math.abs(remainingAmount))}</span>
          </div>
        {/if}
        
        <!-- Total Budget as Reference -->
        <div class="pt-2 mt-2 border-t border-gray-200 text-xs text-gray-600">
          <div>Total Planned Budget: <span class="font-semibold">{formatCurrency(plannedAmount)}</span></div>
          <div class="mt-1">
            {#if remainingAmount >= 0}
              <span class="text-green-600 font-medium">{formatCurrency(remainingAmount)}</span> available to allocate
            {:else}
              <span class="text-red-600 font-medium">Exceeded</span> by {formatCurrency(Math.abs(remainingAmount))}
            {/if}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
   