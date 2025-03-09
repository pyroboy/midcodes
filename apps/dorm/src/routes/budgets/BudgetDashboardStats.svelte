<script lang="ts">
    import { Card, CardContent } from '$lib/components/ui/card';
    import { Progress } from '$lib/components/ui/progress';
    import { DollarSign, CheckCircle, Clock, TrendingUp, BarChart3 } from 'lucide-svelte';
    import { cn } from '$lib/utils';
    
    // Props using Svelte 5 $props rune
    let { 
      statistics = {
        totalPlannedBudget: 0,
        totalAllocatedBudget: 0,
        totalRemainingBudget: 0,
        completedProjects: 0,
        ongoingProjects: 0
      }
    } = $props();
  
    // Derived values
    let totalProjects = $derived(statistics.completedProjects + statistics.ongoingProjects);
    let allocatedPercentage = $derived(
      statistics.totalPlannedBudget > 0 
        ? Math.min(Math.round((statistics.totalAllocatedBudget / statistics.totalPlannedBudget) * 100), 100)
        : 0
    );
    let completionPercentage = $derived(
      totalProjects > 0
        ? Math.round((statistics.completedProjects / totalProjects) * 100)
        : 0
    );
    let isOverBudget = $derived(statistics.totalRemainingBudget < 0);
  
    // Format currency with Peso sign
    function formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
      }).format(amount);
    }
  </script>
  
  <Card class="bg-white shadow-md overflow-hidden">
    <CardContent class="p-0">
      <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
        <!-- Total Budget Section -->
        <div class="p-4 flex items-center">
          <div class="rounded-full bg-green-100 p-3 mr-4">
            <DollarSign class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Budget</p>
            <p class="text-2xl font-bold mt-1">{formatCurrency(statistics.totalPlannedBudget)}</p>
          </div>
        </div>
  
        <!-- Budget Distribution Section -->
        <div class="p-4">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <BarChart3 class="h-5 w-5 text-blue-600 mr-2" />
              <span class="text-sm font-medium text-gray-500">Budget Distribution</span>
            </div>
            <span class="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {allocatedPercentage}% Allocated
            </span>
          </div>
          
          <Progress value={allocatedPercentage} class="h-2 mb-2" />
          
          <div class="grid grid-cols-2 gap-2 mt-3">
            <div>
              <p class="text-xs text-gray-500">Allocated</p>
              <p class="text-sm font-semibold">{formatCurrency(statistics.totalAllocatedBudget)}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500">Remaining</p>
              <p class={cn(
                "text-sm font-semibold",
                isOverBudget ? "text-red-600" : "text-green-600"
              )}>
                {formatCurrency(statistics.totalRemainingBudget)}
              </p>
            </div>
          </div>
          
          {#if isOverBudget}
            <div class="text-xs text-red-600 mt-1">
              Exceeded by {formatCurrency(Math.abs(statistics.totalRemainingBudget))}
            </div>
          {/if}
        </div>
  
        <!-- Project Status Section -->
        <div class="p-4">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center">
              <TrendingUp class="h-5 w-5 text-purple-600 mr-2" />
              <span class="text-sm font-medium text-gray-500">Project Status</span>
            </div>
            {#if totalProjects > 0}
              <span class="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                {completionPercentage}% Complete
              </span>
            {/if}
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-2">
            <div class="flex items-center">
              <div class="rounded-full bg-green-100 p-1.5 mr-2">
                <CheckCircle class="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p class="text-xs text-gray-500">Completed</p>
                <p class="text-lg font-bold">{statistics.completedProjects}</p>
              </div>
            </div>
            <div class="flex items-center">
              <div class="rounded-full bg-yellow-100 p-1.5 mr-2">
                <Clock class="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p class="text-xs text-gray-500">Ongoing</p>
                <p class="text-lg font-bold">{statistics.ongoingProjects}</p>
              </div>
            </div>
          </div>
          
          {#if totalProjects === 0}
            <div class="text-xs text-gray-500 mt-1">No active projects</div>
          {/if}
        </div>
      </div>
    </CardContent>
  </Card>