<script lang="ts">
  interface Task {
    id: string;
    title: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    category: 'verification' | 'document' | 'payment' | 'other';
    assignee: {
      name: string;
      role: string;
    };
  }

  export let tasks: Task[] = [
    {
      id: '1',
      title: 'Verify new student batch',
      dueDate: '2024-02-16T17:00:00Z',
      priority: 'high',
      category: 'verification',
      assignee: {
        name: 'Admin User',
        role: 'admin'
      }
    },
    {
      id: '2',
      title: 'Process TOR requests',
      dueDate: '2024-02-17T12:00:00Z',
      priority: 'medium',
      category: 'document',
      assignee: {
        name: 'Staff User',
        role: 'staff'
      }
    },
    {
      id: '3',
      title: 'Review pending payments',
      dueDate: '2024-02-16T15:00:00Z',
      priority: 'high',
      category: 'payment',
      assignee: {
        name: 'Finance User',
        role: 'finance'
      }
    },
    {
      id: '4',
      title: 'Update student records',
      dueDate: '2024-02-18T17:00:00Z',
      priority: 'low',
      category: 'other',
      assignee: {
        name: 'Staff User',
        role: 'staff'
      }
    }
  ];

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      high: 'text-red-700 bg-red-50 ring-red-600/20',
      medium: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
      low: 'text-green-700 bg-green-50 ring-green-600/20'
    };
    return colors[priority];
  };

  const getCategoryIcon = (category: Task['category']) => {
    const icons = {
      verification: `<svg class="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>`,
      document: `<svg class="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>`,
      payment: `<svg class="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>`,
      other: `<svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>`
    };
    return icons[category];
  };

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) {
      return `Today at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return dueDate.toLocaleString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
</script>

<div class="bg-white shadow rounded-lg">
  <div class="p-6">
    <h3 class="text-base font-semibold leading-6 text-gray-900">Tasks Summary</h3>
    <div class="mt-6 flow-root">
      <ul role="list" class="-my-5 divide-y divide-gray-200">
        {#each tasks as task}
          <li class="py-5">
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                {@html getCategoryIcon(task.category)}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900">{task.title}</h3>
                  <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset {getPriorityColor(task.priority)}">
                    {task.priority}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Assigned to {task.assignee.name}
                </p>
                <p class="mt-1 text-sm text-gray-500">
                  Due {formatDueDate(task.dueDate)}
                </p>
              </div>
              <div class="flex-shrink-0 self-center">
                <button type="button" class="text-indigo-600 hover:text-indigo-900">
                  View
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
    <div class="mt-6">
      <a href="/admin/tasks" class="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
        View all tasks
      </a>
    </div>
  </div>
</div>