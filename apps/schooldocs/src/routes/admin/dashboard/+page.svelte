<script lang="ts">
  import QuickStats from '$lib/components/admin/Dashboard/QuickStats.svelte';
  import RecentActivity from '$lib/components/admin/Dashboard/RecentActivity.svelte';
  import TasksSummary from '$lib/components/admin/Dashboard/TasksSummary.svelte';

  const stats = {
    orders: {
      total: 125,
      pending: 45,
      completed: 80,
      trend: '+5.4%'
    },
    students: {
      total: 1250,
      verified: 1180,
      pending: 70,
      trend: '+2.3%'
    },
    revenue: {
      total: 125000,
      thisMonth: 15000,
      lastMonth: 12000,
      trend: '+25%'
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };
</script>

<div class="p-6 space-y-6">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
      <p class="mt-2 text-sm text-gray-700">Overview of system statistics and recent activities.</p>
    </div>
  </div>

  <QuickStats {stats} />

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Tasks Summary -->
    <div>
      <TasksSummary />
    </div>

    <!-- Recent Activity -->
    <div>
      <RecentActivity />
    </div>
  </div>
</div>