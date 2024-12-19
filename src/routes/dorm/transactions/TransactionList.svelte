<!-- src/routes/transactions/TransactionList.svelte -->
<script lang="ts">
    import * as Table from "$lib/components/ui/table/index.js";
  
    export let transactions: Transactions[];
  </script>
  
  <div class="transaction-list">
    <h2 class="text-2xl font-bold mb-4">Recent Transactions</h2>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Date</Table.Head>
          <Table.Head>Amount</Table.Head>
          <Table.Head>Type</Table.Head>
          <Table.Head>Paid By</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each transactions as transaction (transaction.id)}
          <Table.Row>
            <Table.Cell>{new Date(transaction.transactionDate).toLocaleDateString()}</Table.Cell>
            <Table.Cell>₱{transaction.amount.toFixed(2)}</Table.Cell>
            <Table.Cell>{transaction.transactionType}</Table.Cell>
            <Table.Cell>{transaction.paidBy}</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>