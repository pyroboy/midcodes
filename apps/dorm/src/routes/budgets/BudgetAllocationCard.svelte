<script lang="ts">
    import { Progress } from '$lib/components/ui/progress';
    import { Card, CardContent } from '$lib/components/ui/card';
  
    // Props using Svelte 5 $props rune
    let { 
      plannedAmount = 0,
      allocatedAmount = 0
    } = $props<{
      plannedAmount: number;
      allocatedAmount: number;
    }>();
  
    // Calculate remaining amount and progress percentage
    let remainingAmount = $derived(plannedAmount - allocatedAmount);
    let progressPercentage = $derived(
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
  
  <Card class="w-full overflow-hidden shadow-sm border-gray-200">
    <CardContent class="p-6">
      <h3 class="text-lg font-medium mb-2">Budget Allocation</h3>
      
      <div class="mb-4">
        <Progress value={progressPercentage} class="h-2" />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-500 mb-1">Allocated</p>
          <p class="text-xl font-semibold">{formatCurrency(allocatedAmount)}</p>
        </div>
        
        <div class="text-right">
          <p class="text-sm text-gray-500 mb-1">Remaining</p>
          <p class="text-xl font-semibold" class:text-green-600={remainingAmount >= 0} class:text-red-600={remainingAmount < 0}>
            {formatCurrency(remainingAmount)}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>