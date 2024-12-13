<script lang="ts">
    import { superForm } from 'sveltekit-superforms/client';
    import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import * as Table from "$lib/components/ui/table/index.js";
    import TransactionList from './TransactionList.svelte';
    import { ArrowLeftRight } from 'lucide-svelte';

    export let data;
  
    const { form, errors, enhance } = superForm(data.form);
  
    let searchTerm = '';
    let selectedAccounts: number[] = [];
    let totalAccountCharges = 0;
    let amount = 0;
    let change = 0;
    const partialPaymentThreshold = 0.2; // 20% threshold
    let isPartialPaymentValid = false;
    let amountValidationMessage = '';
    let showTransactionList = true;
  
    $: filteredAccounts = data.accounts.filter(account => 
      account.lease.leaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    $: {
      totalAccountCharges = selectedAccounts.reduce((total, id) => {
        const account = data.accounts.find(a => a.id === id);
        return total + (account ? account.amount : 0);
      }, 0);
      $form.totalAccountCharges = totalAccountCharges;
      change = amount - totalAccountCharges;
      $form.change = Math.abs(change);
      isPartialPaymentValid = amount >= totalAccountCharges * partialPaymentThreshold;
      
      if (amount < totalAccountCharges * partialPaymentThreshold) {
        const minAmount = (totalAccountCharges * partialPaymentThreshold).toFixed(2);
        amountValidationMessage = `Minimum payment of ₱${minAmount} required (${(partialPaymentThreshold * 100).toFixed(0)}% of total charges)`;
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
      $form.selectedAccounts = filteredAccounts
        .filter(account => selectedAccounts.includes(account.id))
        .map(account => ({
          id: account.id,
          leaseId: account.leaseId,
          type: account.type,
          amount: account.amount,
          balance: account.balance,
          dateIssued: account.dateIssued,
          dueOn: account.dueOn
        }));
    }

    function setExactAmount() {
      amount = totalAccountCharges;
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
    <!-- <ArrowLeftRight size={16} /> -->
    <span class="ml-2">{showTransactionList ? 'Hide List' : 'Show List'}</span>
  </button>

  {#if showTransactionList}
    <div class="w-1/2 border-r border-gray-300 pr-10">
 
      <TransactionList transactions={data.transactions} />
    </div>
  {/if}

  <div class="flex-grow {showTransactionList ? 'pl-10' : ''}">
    <h1 class="text-3xl font-bold mb-4">Create Transaction</h1>
  
    <form method="POST" use:enhance class="space-y-4">
      <div class="flex justify-between items-end ">
        <div class="flex-grow flex items-end space-x-2">
          <div class="w-1/3">
            <Label for="totalAccountCharges" class="text-lg font-semibold">Total Charges</Label>
            <div class="text-2xl font-bold">₱{totalAccountCharges.toFixed(2)}</div>
          </div>
          <Button 
            type="button" 
            class="mr-2 bg-green-500 hover:bg-green-600 text-white font-bold p-2 rounded-lg text-xl h-[42px] w-[42px] flex items-center justify-center"
            on:click={setExactAmount}
            disabled={selectedAccounts.length === 0}
          >
            =
          </Button>
          <div class="flex-grow">
            <Label for="amount" class="text-lg font-semibold">Amount</Label>
            <Input 
              type="number" 
              id="amount" 
              bind:value={amount} 
              class="text-xl" 
              disabled={selectedAccounts.length === 0}
              placeholder={selectedAccounts.length === 0 ? "Select account(s) first" : "Enter amount"}
            />
            {#if amountValidationMessage}
              <p class="text-sm text-red-500 mt-1">{amountValidationMessage}</p>
            {/if}
          </div>
        </div>
        <div class="w-1/6">
          <Label for="transactionType" class="text-lg font-semibold">Type</Label>
          <select id="transactionType" bind:value={$form.transactionType} class="w-full p-2 border rounded text-xl">
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="GCASH">GCash</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div class="w-1/4">
          {#if change >= 0}
            <Button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl" disabled={!isPartialPaymentValid || selectedAccounts.length === 0}>
              {#if change > 0}
                ₱{change.toFixed(2)} Change - Payment
              {:else}
                Exact Payment
              {/if}
            </Button>
          {:else}
            <Button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-xl" disabled={!isPartialPaymentValid || selectedAccounts.length === 0}>
              Partial Payment
            </Button>
          {/if}
        </div>
      </div>

      <input type="hidden" name="change" bind:value={$form.change}>

      <div class="flex justify-between items-center">
        <div class="flex-1 mr-4">
          <Label for="receivedBy" class="text-lg font-semibold">Received By</Label>
          <Input type="text" id="receivedBy" bind:value={$form.receivedBy} class="text-xl" />
        </div>
        <div class="flex-1">
          <Label for="paidBy" class="text-lg font-semibold">Paid By</Label>
          <Input type="text" id="paidBy" bind:value={$form.paidBy} class="text-xl" />
        </div>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex-1 mr-4">
          <Label for="search" class="text-lg font-semibold">Search Accounts</Label>
          <Input type="text" id="search" bind:value={searchTerm} placeholder="Search by lease name or account type" class="text-xl" />
        </div>
        <div class="flex-1">
          <Label for="transactionDate" class="text-lg font-semibold">Transaction Date</Label>
          <Input type="date" id="transactionDate" bind:value={$form.transactionDate} class="text-xl" />
        </div>
      </div>

      {#if Object.keys($errors).length > 0}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Error:</strong>
          <ul class="list-disc list-inside">
            {#each Object.entries($errors) as [field, error]}
              <li>{field}: {error}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <Table.Root>
        <Table.Caption>Select accounts for this transaction</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[50px]">
              <Checkbox
                checked={selectedAccounts.length === filteredAccounts.length}
                onCheckedChange={toggleAllAccounts}
              />
            </Table.Head>
            <Table.Head>Lease Name</Table.Head>
            <Table.Head>Account Type</Table.Head>
            <Table.Head>Amount</Table.Head>
            <Table.Head>Balance</Table.Head>
            <Table.Head>Date Issued</Table.Head>
            <Table.Head>Due Date</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each filteredAccounts as account (account.id)}
            <Table.Row class={selectedAccounts.includes(account.id) ? 'bg-blue-100' : ''}>
              <Table.Cell>
                <Checkbox 
                  checked={selectedAccounts.includes(account.id)} 
                  onCheckedChange={() => toggleAccount(account.id)}
                />
              </Table.Cell>
              <Table.Cell>{account.lease.leaseName}</Table.Cell>
              <Table.Cell>{account.type}</Table.Cell>
              <Table.Cell>₱{account.amount.toFixed(2)}</Table.Cell>
              <Table.Cell>₱{account.balance?.toFixed(2)}</Table.Cell>
              <Table.Cell>{new Date(account.dateIssued).toLocaleDateString()}</Table.Cell>
              <Table.Cell>{account.dueOn ? new Date(account.dueOn).toLocaleDateString() : 'N/A'}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </form>
  </div>
</div>

<SuperDebug data={$form} />