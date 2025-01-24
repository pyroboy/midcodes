<script lang="ts">
  interface Activity {
    id: string;
    type: 'order' | 'verification' | 'upload' | 'payment';
    description: string;
    user: {
      name: string;
      role: string;
    };
    timestamp: string;
    status?: string;
  }

  export let activities: Activity[] = [
    {
      id: '1',
      type: 'order',
      description: 'New order for Transcript of Records',
      user: {
        name: 'John Doe',
        role: 'student'
      },
      timestamp: '2024-02-15T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      type: 'verification',
      description: 'Student verification completed',
      user: {
        name: 'Admin User',
        role: 'admin'
      },
      timestamp: '2024-02-15T10:15:00Z'
    },
    {
      id: '3',
      type: 'payment',
      description: 'Payment received for order #REF-2024-001',
      user: {
        name: 'Sarah Williams',
        role: 'student'
      },
      timestamp: '2024-02-15T09:45:00Z',
      status: 'completed'
    },
    {
      id: '4',
      type: 'upload',
      description: 'Bulk student data uploaded',
      user: {
        name: 'Admin User',
        role: 'admin'
      },
      timestamp: '2024-02-15T09:30:00Z'
    }
  ];

  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      order: `<svg class="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>`,
      verification: `<svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>`,
      upload: `<svg class="h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>`,
      payment: `<svg class="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>`
    };
    return icons[type];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };
</script>

<div class="bg-white shadow rounded-lg overflow-hidden">
  <div class="p-6">
    <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
    <div class="flow-root mt-6">
      <ul role="list" class="-mb-8">
        {#each activities as activity, idx}
          <li>
            <div class="relative pb-8">
              {#if idx !== activities.length - 1}
                <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
              {/if}
              <div class="relative flex space-x-3">
                <div>
                  <span class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-50">
                    {@html getActivityIcon(activity.type)}
                  </span>
                </div>
                <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p class="text-sm text-gray-500">{activity.description}</p>
                    <p class="mt-1 text-xs text-gray-400">
                      by {activity.user.name} ({activity.user.role})
                      {#if activity.status}
                        <span class="mx-1">•</span>
                        <span class="font-medium text-gray-500">{activity.status}</span>
                      {/if}
                    </p>
                  </div>
                  <div class="text-right text-xs whitespace-nowrap text-gray-500">
                    <time datetime={activity.timestamp}>{formatDate(activity.timestamp)}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>