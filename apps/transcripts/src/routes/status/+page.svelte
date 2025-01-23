<script lang="ts">
  import { onMount } from 'svelte';

  let studentId = '';
  let isLoading = false;
  let error = '';
  let requests = [];
  let hasSearched = false;

  async function searchRequests() {
    if (!studentId) {
      error = 'Please enter your Student ID';
      return;
    }

    isLoading = true;
    error = '';
    hasSearched = true;

    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock data for demonstration
      requests = [
        {
          id: '1',
          status: 'processing',
          requestDate: '2024-01-15',
          copies: 2,
          deliveryMethod: 'pickup'
        },
        {
          id: '2',
          status: 'completed',
          requestDate: '2024-01-10',
          copies: 1,
          deliveryMethod: 'email'
        }
      ];
    } catch (e) {
      error = 'Failed to fetch requests. Please try again.';
      requests = [];
    } finally {
      isLoading = false;
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="py-6">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-2xl font-semibold text-gray-900">Check Request Status</h1>
    <p class="mt-2 text-sm text-gray-600">
      Enter your Student ID to view the status of your transcript requests.
    </p>

    <div class="mt-6">
      <div class="flex space-x-4">
        <input
          type="text"
          bind:value={studentId}
          placeholder="Enter Student ID"
          class="flex-1 block border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <button
          on:click={searchRequests}
          disabled={isLoading}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {#if error}
        <div class="mt-4 p-4 bg-red-50 rounded-md">
          <p class="text-red-700">{error}</p>
        </div>
      {/if}

      {#if hasSearched}
        <div class="mt-8">
          {#if requests.length > 0}
            <div class="bg-white shadow overflow-hidden sm:rounded-md">
              <ul class="divide-y divide-gray-200">
                {#each requests as request}
                  <li>
                    <div class="px-4 py-4 sm:px-6">
                      <div class="flex items-center justify-between">
                        <div class="text-sm font-medium text-indigo-600 truncate">
                          Request #{request.id}
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
                            Requested on {request.requestDate}
                          </p>
                          <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            {request.copies} {request.copies === 1 ? 'copy' : 'copies'}
                          </p>
                        </div>
                        <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Delivery: {request.deliveryMethod}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          {:else}
            <div class="text-center py-12 bg-white rounded-lg">
              <p class="text-gray-500">No requests found for this Student ID.</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>