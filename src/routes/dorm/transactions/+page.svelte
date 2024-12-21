<script lang="ts">
  import { formatCurrency, formatDateTime } from '$lib/utils';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { superForm } from 'sveltekit-superforms/client';
  import type { PageData } from './$types';
  import type { Database } from '$lib/database.types';
  import { transactionFilterSchema, type TransactionFilterData } from './schema';
  import { paymentMethodEnum } from './types';
  import type { ExtendedPayment } from './types';

  export let data: {
    form: PageData['form'];
    transactions: ExtendedPayment[];
    user: {
      role: string;
    };
  };

  const { form } = superForm(data.form);

  let searchTerm = '';
  let startDate: string = '';
  let endDate: string = '';
  let selectedMethod: keyof typeof paymentMethodEnum.Values | null = null;

  $: filteredTransactions = data.transactions.filter(transaction => {
    // Search filter
    const searchMatch = searchTerm ? (
      transaction.billing?.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.billing?.lease?.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;

    // Date filter
    const dateMatch = (!startDate || new Date(transaction.paid_at) >= new Date(startDate)) &&
                     (!endDate || new Date(transaction.paid_at) <= new Date(endDate));

    // Method filter
    const methodMatch = !selectedMethod || transaction.method === selectedMethod;

    return searchMatch && dateMatch && methodMatch;
  });

  function handleMethodSelect(value: string) {
    if (value in paymentMethodEnum.Values) {
      selectedMethod = value as keyof typeof paymentMethodEnum.Values;
    }
  }
</script>

<div class="container mx-auto p-4">
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">Transaction History</h2>
    
    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <!-- Search -->
      <div>
        <Label for="search">Search</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search transactions..."
          bind:value={searchTerm}
        />
      </div>

      <!-- Start Date -->
      <div>
        <Label for="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          bind:value={startDate}
        />
      </div>

      <!-- End Date -->
      <div>
        <Label for="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          bind:value={endDate}
        />
      </div>

      <!-- Payment Method -->
      <div>
        <Label>Payment Method</Label>
        <select 
          class="w-full p-2 border rounded"
          bind:value={selectedMethod}
        >
          <option value="">All Methods</option>
          {#each Object.entries(paymentMethodEnum.Values) as [key, value]}
            <option {value}>{key}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Transaction Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b">
            <th class="p-2 text-left">Date</th>
            <th class="p-2 text-left">Type</th>
            <th class="p-2 text-left">Paid By</th>
            <th class="p-2 text-left">Amount</th>
            <th class="p-2 text-left">Method</th>
            <th class="p-2 text-left">Reference</th>
            <th class="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredTransactions as transaction}
            <tr class="border-b">
              <td class="p-2">{formatDateTime(transaction.paid_at)}</td>
              <td class="p-2">{transaction.billing?.type ?? 'N/A'}</td>
              <td class="p-2">{transaction.billing?.lease?.tenant?.name ?? 'N/A'}</td>
              <td class="p-2">{formatCurrency(transaction.amount_paid)}</td>
              <td class="p-2">{transaction.method}</td>
              <td class="p-2">{transaction.reference_number ?? 'N/A'}</td>
              <td class="p-2">{transaction.status}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>