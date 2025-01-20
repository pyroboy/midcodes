<!-- src/routes/transactions/TransactionList.svelte -->
<script lang="ts">
  import * as Table from "$lib/components/ui/table/index.js";
  import type { ExtendedPayment } from "./types";
  import { format } from "date-fns";
  
  interface Props {
    transactions: ExtendedPayment[];
  }

  let { transactions }: Props = $props();

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }
</script>

<div class="transaction-list">
  <h2 class="text-2xl font-bold mb-4">Recent Transactions</h2>
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Date</Table.Head>
        <Table.Head>Amount</Table.Head>
        <Table.Head>Type</Table.Head>
        <Table.Head>Method</Table.Head>
        <Table.Head>Paid By</Table.Head>
        <Table.Head>Reference</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each transactions as transaction (transaction.id)}
        <Table.Row>
          <Table.Cell>{format(new Date(transaction.paid_at), 'MMM d, yyyy')}</Table.Cell>
          <Table.Cell>{formatAmount(transaction.amount)}</Table.Cell>
          <Table.Cell>
            {transaction.billing?.type ?? 'N/A'}
            {#if transaction.billing?.utility_type}
              ({transaction.billing.utility_type})
            {/if}
          </Table.Cell>
          <Table.Cell>{transaction.method}</Table.Cell>
          <Table.Cell>
            {transaction.billing?.lease?.tenant?.name ?? 'N/A'}
          </Table.Cell>
          <Table.Cell>{transaction.reference_number ?? 'N/A'}</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>