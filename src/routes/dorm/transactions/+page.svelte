<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Table from "$lib/components/ui/table";
  import * as Select from "$lib/components/ui/select";
  import TransactionList from './TransactionList.svelte';
  import { ArrowLeftRight } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { transactionTypeEnum } from '$lib/schemas/transactions';
  import { formatCurrency } from '$lib/utils';
  import type { Database } from '$lib/database.types';

  type Account = Database['public']['Tables']['accounts']['Row'] & {
    lease: {
      id: number;
      lease_name: string;
      tenant: {
        id: string;
        email: string;
      };
      room: {
        id: number;
        name: string;
        property_id: number;
      };
    };
  };

  export let data: PageData;
  
  const { form, errors, enhance, delayed, message } = superForm(data.form, {
    resetForm: true,
    onUpdated: ({ form }) => {
      if (form.data.id) {
        showTransactionList = true;
      }
    }
  });
  
  let searchTerm = '';
  let selectedAccounts: number[] = [];
  let totalCharges = 0;
  let amountPaid = 0;
  let change = 0;
  const partialPaymentThreshold = 0.2; // 20% threshold
  let isPartialPaymentValid = false;
  let amountValidationMessage = '';
  let showTransactionList = true;
  
  $: filteredAccounts = (data.accounts as Account[]).filter(account => 
    account.lease.lease_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  $: {
    totalCharges = selectedAccounts.reduce((total, id) => {
      const account = (data.accounts as Account[]).find(a => a.id === id);
      return total + (account ? account.amount : 0);
    }, 0);
    $form.total_charges = totalCharges;
    change = amountPaid - totalCharges;
    $form.change_amount = Math.abs(change);
    $form.amount_paid = amountPaid;
    isPartialPaymentValid = amountPaid >= totalCharges * partialPaymentThreshold;
    
    if (amountPaid < totalCharges * partialPaymentThreshold) {
      const minAmount = (totalCharges * partialPaymentThreshold).toFixed(2);
      amountValidationMessage = `Minimum payment of ${formatCurrency(parseFloat(minAmount))} required (${(partialPaymentThreshold * 100).toFixed(0)}% of total charges)`;
    } else {
      amountValidationMessage = '';
    }
  }
  
  function toggleAccount(accountId: number) {
    if (selectedAccounts.includes(accountId)) {
      selectedAccounts = selectedAccounts.filter(id => id !== accountId);
    } else {
      selectedAccounts = [...selectedAccounts, accountId];
    }
    updateSelectedAccounts();
  }

  function toggleAllAccounts(checked: boolean | 'indeterminate') {
    if (checked === true) {
      selectedAccounts = filteredAccounts.map(account => account.id);
    } else {
      selectedAccounts = [];
    }
    updateSelectedAccounts();
  }

  function updateSelectedAccounts() {
    $form.selected_accounts = filteredAccounts
      .filter(account => selectedAccounts.includes(account.id))
      .map(account => ({
        id: account.id,
        lease_id: account.lease_id,
        type: account.type,
        amount: account.amount,
        balance: account.balance,
        date_issued: account.date_issued,
        due_date: account.due_date
      }));
  }

  function setExactAmount() {
    amountPaid = totalCharges;
  }

  function toggleTransactionList() {
    showTransactionList = !showTransactionList;
  }
</script>

<div class="container mx-auto py-4 flex">
  <button
    class="absolute top-30 left-5 bg-gray-400 hover:bg-gray-600 text-white rounded-full p-2"
    on:click={toggleTransactionList}
  >
    <ArrowLeftRight class="h-5 w-5" />
  </button>

  {#if showTransactionList}
    <div class="w-1/3 pr-4">
      <TransactionList transactions={data.transactions} />
    </div>
  {/if}

  <div class="flex-grow {showTransactionList ? 'pl-10' : ''}">
    <h1 class="text-3xl font-bold mb-4">Create Transaction</h1>
  
    <form method="POST" use:enhance class="space-y-4">
      <div class="flex justify-between items-end">
        <div class="flex-grow flex items-end space-x-2">
          <div class="w-1/3">
            <Label for="total_charges" class="text-lg font-semibold">Total Charges</Label>
            <Input
              type="number"
              id="total_charges"
              bind:value={$form.total_charges}
              readonly
            />
          </div>
          <div class="w-1/3">
            <Label for="amount_paid" class="text-lg font-semibold">Amount Paid</Label>
            <Input
              type="number"
              id="amount_paid"
              bind:value={amountPaid}
              min="0"
              step="0.01"
              required
            />
            {#if amountValidationMessage}
              <p class="text-destructive text-sm mt-1">{amountValidationMessage}</p>
            {/if}
          </div>
          <div class="w-1/3">
            <Label for="change_amount" class="text-lg font-semibold">Change</Label>
            <Input
              type="number"
              id="change_amount"
              bind:value={$form.change_amount}
              readonly
            />
          </div>
          <Button type="button" on:click={setExactAmount}>
            Set Exact
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="transaction_type">Transaction Type</Label>
          <Select.Root
            selected={{ 
              label: $form.transaction_type ?? 'Select type',
              value: $form.transaction_type ?? ''
            }}
            onSelectedChange={(s) => {
              if (s) {
                $form.transaction_type = s.value as typeof transactionTypeEnum._type;
              }
            }}
          >
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select type" />
            </Select.Trigger>
            <Select.Content>
              {#each Object.values(transactionTypeEnum.enum) as type}
                <Select.Item value={type}>{type}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.transaction_type}<span class="text-red-500">{$errors.transaction_type}</span>{/if}
        </div>

        <div>
          <Label for="transaction_date">Transaction Date</Label>
          <Input
            type="date"
            id="transaction_date"
            bind:value={$form.transaction_date}
            required
          />
          {#if $errors.transaction_date}<span class="text-red-500">{$errors.transaction_date}</span>{/if}
        </div>

        <div>
          <Label for="paid_by">Paid By</Label>
          <Input
            type="text"
            id="paid_by"
            bind:value={$form.paid_by}
          />
          {#if $errors.paid_by}<span class="text-red-500">{$errors.paid_by}</span>{/if}
        </div>

        <div>
          <Label for="notes">Notes</Label>
          <Input
            type="text"
            id="notes"
            bind:value={$form.notes}
          />
          {#if $errors.notes}<span class="text-red-500">{$errors.notes}</span>{/if}
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search accounts..."
            bind:value={searchTerm}
          />
        </div>

        <Table.Root>
          <Table.Caption>Select accounts for this transaction</Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.Head class="w-[50px]">
                <Checkbox
                  checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                  onCheckedChange={toggleAllAccounts}
                />
              </Table.Head>
              <Table.Head>Lease</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Amount</Table.Head>
              <Table.Head>Balance</Table.Head>
              <Table.Head>Due Date</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredAccounts as account}
              <Table.Row>
                <Table.Cell>
                  <Checkbox
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={() => toggleAccount(account.id)}
                  />
                </Table.Cell>
                <Table.Cell>{account.lease.lease_name}</Table.Cell>
                <Table.Cell>{account.type}</Table.Cell>
                <Table.Cell>{formatCurrency(account.amount)}</Table.Cell>
                <Table.Cell>{account.balance !== null ? formatCurrency(account.balance) : 'N/A'}</Table.Cell>
                <Table.Cell>{account.due_date ? new Date(account.due_date).toLocaleDateString() : 'N/A'}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <Button type="submit" disabled={$delayed || !isPartialPaymentValid || selectedAccounts.length === 0}>
        {#if $delayed}
          Saving...
        {:else}
          Create Transaction
        {/if}
      </Button>
    </form>
  </div>
</div>

{#if import.meta.env.DEV}
  <SuperDebug data={$form} />
{/if}