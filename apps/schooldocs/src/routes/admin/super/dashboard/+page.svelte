<script lang="ts">
  const stats = {
    totalOrganizations: 15,
    activeUsers: 450,
    totalRevenue: 1250000,
    averageCommissionRate: 5
  };

  const recentActivities = [
    {
      id: 1,
      type: 'organization_added',
      name: 'University of Example',
      timestamp: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 2,
      type: 'user_banned',
      name: 'John Doe',
      timestamp: new Date().toISOString(),
      reason: 'Violation of terms'
    },
    {
      id: 3,
      type: 'commission_updated',
      organization: 'College of Sample',
      oldRate: 4,
      newRate: 5,
      timestamp: new Date().toISOString()
    }
  ];

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleString();
  };
</script>

<div class="p-6 space-y-6">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
      <p class="mt-2 text-sm text-gray-700">System-wide overview and management.</p>
    </div>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Organizations</dt>
              <dd class="text-lg font-semibold text-gray-900">{stats.totalOrganizations}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Active Users</dt>
              <dd class="text-lg font-semibold text-gray-900">{stats.activeUsers}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
              <dd class="text-lg font-semibold text-gray-900">{formatAmount(stats.totalRevenue)}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Avg Commission Rate</dt>
              <dd class="text-lg font-semibold text-gray-900">{stats.averageCommissionRate}%</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
    </div>
    <div class="border-t border-gray-200">
      <ul role="list" class="divide-y divide-gray-200">
        {#each recentActivities as activity}
          <li class="px-4 py-4 sm:px-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="ml-3">
                  {#if activity.type === 'organization_added'}
                    <p class="text-sm font-medium text-gray-900">
                      New organization added: {activity.name}
                    </p>
                  {:else if activity.type === 'user_banned'}
                    <p class="text-sm font-medium text-gray-900">
                      User banned: {activity.name}
                    </p>
                    <p class="text-sm text-gray-500">Reason: {activity.reason}</p>
                  {:else if activity.type === 'commission_updated'}
                    <p class="text-sm font-medium text-gray-900">
                      Commission rate updated for {activity.organization}
                    </p>
                    <p class="text-sm text-gray-500">
                      Rate changed from {activity.oldRate}% to {activity.newRate}%
                    </p>
                  {/if}
                </div>
              </div>
              <div class="ml-2 flex-shrink-0">
                <p class="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>