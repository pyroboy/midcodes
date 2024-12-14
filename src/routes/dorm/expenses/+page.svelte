<!-- src/routes/expenses/+page.svelte -->
<script lang="ts">
    import { superForm } from 'sveltekit-superforms/client';
    import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
    import * as Select from "$lib/components/ui/select";
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import type { PageData } from './$types';
    import { browser } from '$app/environment';
  
    export let data: PageData;
  
    const { form, errors, enhance } = superForm(data.form);
  
    let typeSelected = { value: '', label: 'Select expense type' };
  </script>
  
  <div class="flex">
    <!-- Expense List -->
    <div class="w-1/2 pr-4">
      <h2 class="text-2xl font-bold mb-4">Expenses</h2>
      {#if data.expenseList.length === 0}
        <p>No expenses found.</p>
      {:else}
        <ul class="space-y-2">
          {#each data.expenseList as expense}
            <li class="bg-white shadow rounded p-3">
              <div class="font-bold">{expense.type}</div>
              <div>Amount: ${expense.amount.toFixed(2)}</div>
              <div>Date: {new Date(expense.dateIssued).toLocaleDateString()}</div>
              <div>Notes: {expense.notes || 'N/A'}</div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  
    <!-- Expense Form -->
    <div class="w-1/2 pl-4">
      <h2 class="text-2xl font-bold mb-4">Add Expense</h2>
      <form method="POST" use:enhance>
        <div class="space-y-4">
          <div>
            <Label for="amount">Amount</Label>
            <Input type="number" id="amount" bind:value={$form.amount} step="0.01" min="0" required />
            {#if $errors.amount}<span class="text-red-500">{$errors.amount}</span>{/if}
          </div>
  
          <div>
            <Label for="type">Type</Label>
            <Select.Root
              selected={{value: $form.type, label: $form.type || 'Select expense type'}}
              onSelectedChange={(s) => {
                if (s) {
                  $form.type = s.value;
                  typeSelected = { value: s.value, label: s.value };
                }
              }}
            >
              <Select.Trigger class="w-full">
                <Select.Value placeholder="Select expense type" />
              </Select.Trigger>
              <Select.Content>
                {#each expenseTypeEnum.enumValues as type}
                  <Select.Item value={type}>{type}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if $errors.type}<span class="text-red-500">{$errors.type}</span>{/if}
          </div>
  
          <div>
            <Label for="issuedTo">Issued To</Label>
            <Input type="text" id="issuedTo" bind:value={$form.issuedTo} />
            {#if $errors.issuedTo}<span class="text-red-500">{$errors.issuedTo}</span>{/if}
          </div>
  
          <div>
            <Label for="notes">Notes</Label>
            <Input type="text" id="notes" bind:value={$form.notes} />
            {#if $errors.notes}<span class="text-red-500">{$errors.notes}</span>{/if}
          </div>
  
          <div>
            <Label for="dateIssued">Date Issued</Label>
            <Input type="date" id="dateIssued" bind:value={$form.dateIssued} required />
            {#if $errors.dateIssued}<span class="text-red-500">{$errors.dateIssued}</span>{/if}
          </div>
  
          <div>
            <Label>
              <Input type="checkbox" 
                     checked={$form.isRecurring ?? false} 
                     on:change={(e) => $form.isRecurring = e.currentTarget.checked} />
              Is Recurring
            </Label>
            {#if $errors.isRecurring}<span class="text-red-500">{$errors.isRecurring}</span>{/if}
          </div>
  
          <Button type="submit">Add Expense</Button>
        </div>
      </form>
    </div>
  </div>
  
  {#if browser}
    <SuperDebug data={$form} />
  {/if}