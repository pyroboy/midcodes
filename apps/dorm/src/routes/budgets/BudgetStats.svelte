<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { DollarSign, CheckCircle, Clock, PieChart } from 'lucide-svelte';
  import type { BudgetStatistics } from './types';

  // Props using Svelte 5 $props rune
  let { statistics } = $props<{
    statistics: BudgetStatistics;
  }>();

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <!-- Total Budget Card -->
  <Card class="bg-white shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">Total Planned Budget</CardTitle>
      <CardDescription class="flex items-center">
        <DollarSign class="h-4 w-4 text-blue-500 mr-1" />
        <span class="text-slate-600 text-xs">All Projects</span>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold text-blue-600">{formatCurrency(statistics.totalPlannedBudget)}</div>
    </CardContent>
  </Card>

  <!-- Allocated Budget Card -->
  <Card class="bg-white shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">Allocated Budget</CardTitle>
      <CardDescription class="flex items-center">
        <PieChart class="h-4 w-4 text-orange-500 mr-1" />
        <span class="text-slate-600 text-xs">Sum of Budget Items</span>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold text-orange-600">{formatCurrency(statistics.totalAllocatedBudget)}</div>
    </CardContent>
  </Card>

  <!-- Remaining Budget Card -->
  <Card class="bg-white shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">Remaining Budget</CardTitle>
      <CardDescription class="flex items-center">
        <DollarSign class="h-4 w-4 text-green-500 mr-1" />
        <span class="text-slate-600 text-xs">Available to Allocate</span>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold" class:text-green-600={statistics.totalRemainingBudget >= 0} class:text-red-600={statistics.totalRemainingBudget < 0}>
        {formatCurrency(statistics.totalRemainingBudget)}
      </div>
    </CardContent>
  </Card>

  <!-- Project Status Card -->
  <Card class="bg-white shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500">Project Status</CardTitle>
      <CardDescription class="flex items-center">
        <Clock class="h-4 w-4 text-purple-500 mr-1" />
        <span class="text-slate-600 text-xs">Completion Tracking</span>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center">
          <CheckCircle class="h-4 w-4 text-green-500 mr-1" />
          <span>Completed:</span>
        </div>
        <span class="font-semibold">{statistics.completedProjects}</span>
      </div>
      <div class="flex items-center justify-between text-sm mt-1">
        <div class="flex items-center">
          <Clock class="h-4 w-4 text-yellow-500 mr-1" />
          <span>Ongoing:</span>
        </div>
        <span class="font-semibold">{statistics.ongoingProjects}</span>
      </div>
    </CardContent>
  </Card>
</div>
