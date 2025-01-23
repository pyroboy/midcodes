<script lang="ts">
  import { onMount } from 'svelte';

  let stats = $state({
    pending: 0,
    processing: 0,
    completed: 0,
    total: 0
  })

  interface Request {
    id: string;
    studentId: string;
    studentName: string;
    requestDate: string;
    status: string;
    copies: number;
    deliveryMethod: string;
  }

  let recentRequests = $state<Request[]>([]);
  let isLoading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock data for demonstration
      stats = {
        pending: 5,
        processing: 3,
        completed: 12,
        total: 20
      };
      
      recentRequests = [
        {
          id: '1',
          studentId: 'ST001',
          studentName: 'John Doe',
          requestDate: '2024-01-15',
          status: 'pending',
          copies: 2,
          deliveryMethod: 'pickup'
        },
        {
          id: '2',
          studentId: 'ST002',
          studentName: 'Jane Smith',
          requestDate: '2024-01-14',
          status: 'processing',
          copies: 1,
          deliveryMethod: 'email'
        }
      ];
    } catch (e) {
      error = 'Failed to load dashboard data';
    } finally {
      isLoading = false;
    }
  });

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="py-6">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>

    {#if error}
      <div class="mt-4 p-4 bg-red-50 rounded-md">
        <p class="text-red-700">{error}</p>
      </div>
    {/if}

    {#if isLoading}
      <div class="mt-6 text-center">
        <p class="text-gray-500">Loading dashboard data...</p>
      </div>
    {:else}
      <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                  <dd class="text-lg font-medium text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Processing</dt>
                  <dd class="text-lg font-medium text-gray-900">{stats.processing}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd class="text-lg font-medium text-gray-900">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
                  <dd class="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <h2 class="text-lg font-medium text-gray-900">Recent Requests</h2>
        <div class="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-gray-200">
            {#each recentRequests as request}
              <li>
                <div class="px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <div class="text-sm font-medium text-indigo-600 truncate">
                      {request.studentName} ({request.studentId})
                    </div>
                    <div class="ml-2 flex-shrink-0 flex">
                      <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-gray-500">
                        Request #{request.id}
                      </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>Requested on {request.requestDate}</p>
                    </div>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    {/if}
  </div>
</div>