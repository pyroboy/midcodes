<script lang="ts">
  import { onMount } from 'svelte';

  interface Order {
    id: string;
    organization_id: string;
    reference_number: string;
    purpose: string;
    quantity: number;
    status: OrderStatus;
    amount: number;
    shipping_fee: number;
    total_amount: number;
    estimated_completion_date: string | null;
    created_at: string;
    updated_at: string;
    requester: {
      name: string;
      student_number: string;
      delivery_address: string;
    };
  }

  type OrderStatus = 'pending' | 'paid' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

  let orders: Order[] = [];

  // Mock data following the database schema
  onMount(() => {
    orders = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        reference_number: 'REF-2024-001',
        purpose: 'Transcript of Records',
        quantity: 2,
        status: 'processing',
        amount: 500.00,
        shipping_fee: 100.00,
        total_amount: 600.00,
        estimated_completion_date: '2024-02-15T10:00:00Z',
        created_at: '2024-02-01T08:30:00Z',
        updated_at: '2024-02-01T08:30:00Z',
        requester: {
          name: 'John Doe',
          student_number: '2020-00001',
          delivery_address: '123 Main St, Anytown, Philippines'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        reference_number: 'REF-2024-002',
        purpose: 'Diploma',
        quantity: 1,
        status: 'paid',
        amount: 1000.00,
        shipping_fee: 100.00,
        total_amount: 1100.00,
        estimated_completion_date: '2024-02-20T10:00:00Z',
        created_at: '2024-02-02T09:15:00Z',
        updated_at: '2024-02-02T09:15:00Z',
        requester: {
          name: 'Sarah Williams',
          student_number: '2020-00002',
          delivery_address: '456 Oak Avenue, Metro Manila, Philippines'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        reference_number: 'REF-2024-003',
        purpose: 'Certificate of Enrollment',
        quantity: 3,
        status: 'pending',
        amount: 300.00,
        shipping_fee: 100.00,
        total_amount: 400.00,
        estimated_completion_date: null,
        created_at: '2024-02-03T14:20:00Z',
        updated_at: '2024-02-03T14:20:00Z',
        requester: {
          name: 'Michael Thompson',
          student_number: '2020-00003',
          delivery_address: '789 Pine Street, Cebu City, Philippines'
        }
      }
    ];
  });

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusColor = (status: OrderStatus): string => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
</script>

<div class="p-6">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-xl font-semibold text-gray-900">Orders</h1>
      <p class="mt-2 text-sm text-gray-700">A list of all orders in the system.</p>
    </div>
  </div>

  <div class="mt-8 flex flex-col">
    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Reference</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requester</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Purpose</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Est. Completion</th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {#each orders as order}
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {order.reference_number}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div>
                      <div class="font-medium">{order.requester.name}</div>
                      <div class="text-xs text-gray-400">{order.requester.student_number}</div>
                      <div class="text-xs text-gray-400 truncate max-w-xs" title={order.requester.delivery_address}>
                        {order.requester.delivery_address}
                      </div>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{order.purpose}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(order.status)}">
                      {order.status}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatAmount(order.total_amount)}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(order.estimated_completion_date)}</td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <a href="/admin/orders/{order.id}" class="text-indigo-600 hover:text-indigo-900">View</a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>