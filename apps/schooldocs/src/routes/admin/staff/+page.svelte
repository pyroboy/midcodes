<script lang="ts">
  import { onMount } from 'svelte';

  interface PrintRequest {
    id: string;
    order_id: string;
    reference_number: string;
    document_type: string;
    student_name: string;
    student_number: string;
    purpose: string;
    quantity: number;
    payment_status: 'paid' | 'pending' | 'failed';
    payment_date: string;
    amount_paid: number;
    status: 'pending' | 'printed' | 'cancelled';
    created_at: string;
  }

  let printRequests: PrintRequest[] = [
    {
      id: '1',
      order_id: 'ORD-2024-001',
      reference_number: 'REF-2024-001',
      document_type: 'Transcript of Records',
      student_name: 'John Doe',
      student_number: '2020-00001',
      purpose: 'Employment',
      quantity: 2,
      payment_status: 'paid',
      payment_date: '2024-02-15T08:30:00Z',
      amount_paid: 600.00,
      status: 'pending',
      created_at: '2024-02-15T08:00:00Z'
    },
    // Add more mock data here
  ];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handlePrint = (request: PrintRequest) => {
    // TODO: Implement print functionality
    console.log('Printing request:', request);
  };
</script>

<div class="p-6 space-y-6">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-xl font-semibold text-gray-900">Print Requests</h1>
      <p class="mt-2 text-sm text-gray-700">List of paid document requests ready for printing.</p>
    </div>
  </div>

  <div class="mt-8 flex flex-col">
    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Reference</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Document</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Student</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Purpose</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Payment Date</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {#each printRequests as request}
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {request.reference_number}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {request.document_type}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div>
                      <div class="font-medium">{request.student_name}</div>
                      <div class="text-xs text-gray-400">{request.student_number}</div>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.purpose}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.quantity}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(request.payment_date)}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatAmount(request.amount_paid)}
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      on:click={() => handlePrint(request)}
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      Print
                    </button>
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