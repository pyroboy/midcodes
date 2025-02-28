<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { DollarSign, CheckCircle, Clock, PieChart } from 'lucide-svelte';
  import type { BudgetStatistics } from './types';

  // Props using Svelte 5 $props rune
  let { statistics } = $props<{
    statistics: BudgetStatistics;
  }>();

  // Calculate progress percentages
  let allocationPercentage = $derived(
    statistics.totalPlannedBudget > 0 
      ? Math.min(Math.round((statistics.totalAllocatedBudget / statistics.totalPlannedBudget) * 100), 100)
      : 0
  );

  let completionPercentage = $derived(
    (statistics.completedProjects + statistics.ongoingProjects) > 0
      ? Math.round((statistics.completedProjects / (statistics.completedProjects + statistics.ongoingProjects)) * 100)
      : 0
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

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <!-- Total Budget Card -->
  <Card class="bg-white shadow-sm border-gray-200">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">Total Planned Budget</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold mb-2">{formatCurrency(statistics.totalPlannedBudget)}</div>
      <div class="text-xs text-gray-500">Total budget across all projects</div>
    </CardContent>
  </Card>

  <!-- Allocated Budget Card -->
  <Card class="bg-white shadow-sm border-gray-200">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">Allocated Budget</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold mb-2">{formatCurrency(statistics.totalAllocatedBudget)}</div>
      <div class="flex items-center gap-2">
        <Progress value={allocationPercentage} class="h-2 flex-1" />
        <span class="text-xs text-gray-500">{allocationPercentage}%</span>
      </div>
    </CardContent>
  </Card>

  <!-- Remaining Budget Card -->
  <Card class="bg-white shadow-sm border-gray-200">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">Remaining Budget</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold mb-2" class:text-green-600={statistics.totalRemainingBudget >= 0} class:text-red-600={statistics.totalRemainingBudget < 0}>
        {formatCurrency(statistics.totalRemainingBudget)}
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
          <div class="text-lg font-bold">{statistics.completedProjects}</div>
        </div>
        <div>
          <div class="flex items-center mb-1">
            <Clock class="h-4 w-4 text-yellow-500 mr-1" />
            <span class="text-sm">Ongoing</span>
          </div>
          <div class="text-lg font-bold">{statistics.ongoingProjects}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Progress value={completionPercentage} class="h-2 flex-1" />
        <span class="text-xs text-gray-500">{completionPercentage}% Complete</span>
      </div>
    </CardContent>
  </Card>
</div>