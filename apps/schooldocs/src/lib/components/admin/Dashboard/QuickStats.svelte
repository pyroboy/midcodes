<script lang="ts">
  interface Stats {
    orders: {
      total: number;
      pending: number;
      completed: number;
      trend: string;
    };
    students: {
      total: number;
      verified: number;
      pending: number;
      trend: string;
    };
    revenue: {
      total: number;
      thisMonth: number;
      lastMonth: number;
      trend: string;
    };
  }

  export let stats: Stats;

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <!-- Orders Stats -->
  <div class="bg-white overflow-hidden shadow rounded-lg">
    <div class="p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
            <dd class="flex items-baseline">
              <div class="text-2xl font-semibold text-gray-900">{stats.orders.total}</div>
              <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                {stats.orders.trend}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div class="bg-gray-50 px-5 py-3">
      <div class="text-sm">
        <span class="font-medium text-gray-500">{stats.orders.pending} pending</span>
        <span class="mx-2 text-gray-400">•</span>
        <span class="font-medium text-gray-500">{stats.orders.completed} completed</span>
      </div>
    </div>
  </div>

  <!-- Students Stats -->
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
            <dt class="text-sm font-medium text-gray-500 truncate">Total Students</dt>
            <dd class="flex items-baseline">
              <div class="text-2xl font-semibold text-gray-900">{stats.students.total}</div>
              <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                {stats.students.trend}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div class="bg-gray-50 px-5 py-3">
      <div class="text-sm">
        <span class="font-medium text-gray-500">{stats.students.verified} verified</span>
        <span class="mx-2 text-gray-400">•</span>
        <span class="font-medium text-gray-500">{stats.students.pending} pending</span>
      </div>
    </div>
  </div>

  <!-- Revenue Stats -->
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
            <dd class="flex items-baseline">
              <div class="text-2xl font-semibold text-gray-900">{formatAmount(stats.revenue.total)}</div>
              <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                {stats.revenue.trend}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div class="bg-gray-50 px-5 py-3">
      <div class="text-sm">
        <span class="font-medium text-gray-500">This month: {formatAmount(stats.revenue.thisMonth)}</span>
        <span class="mx-2 text-gray-400">•</span>
        <span class="font-medium text-gray-500">Last month: {formatAmount(stats.revenue.lastMonth)}</span>
      </div>
    </div>
  </div>
</div>