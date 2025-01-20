<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import * as Select from "$lib/components/ui/select";
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import { expenseTypeEnum, expenseStatusEnum, type ExpenseSchema } from './formSchema';
  import type { Database } from '$lib/database.types';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { ZodValidation } from 'sveltekit-superforms/adapters';

  // type Expense = Database['public']['Tables']['expenses']['Row'] & {
  //   property: { name: string } | null;
  //   created_by_user: { full_name: string } | null;
  //   approved_by_user: { full_name: string } | null;
  // };

  

  interface Props {
    // type Property = Database['public']['Tables']['properties']['Row'];
    data: PageData;
  }

  let { data }: Props = $props();

  const { form, errors, enhance } = superForm<ExpenseSchema>(data.form);

  let typeSelected = $state({ value: '', label: 'Select expense type' });
  let statusSelected = $state({ value: '', label: 'Select status' });

  function isValidExpenseType(value: string): value is typeof expenseTypeEnum._type {
    return Object.values(expenseTypeEnum.enum).includes(value as any);
  }

  function isValidExpenseStatus(value: string): value is typeof expenseStatusEnum._type {
    return Object.values(expenseStatusEnum.enum).includes(value as any);
  }

  let expenses = $derived(data.expenses ?? []);
  let properties = $derived(data.properties ?? []);
</script>

<div class="flex">
    <!-- Expense List -->
    <div class="w-1/2 pr-4">
      <h2 class="text-2xl font-bold mb-4">Expenses</h2>
      {#if !expenses.length}
        <p>No expenses found.</p>
      {:else}
        <ul class="space-y-2">
          {#each expenses as expense (expense.id)}
            <li class="bg-white shadow rounded p-3">
              <div class="font-bold">{expense.expense_type}</div>
              <div>Amount: ${expense.amount.toFixed(2)}</div>
              <div>Date: {new Date(expense.expense_date).toLocaleDateString()}</div>
              <div>Status: {expense.expense_status}</div>
              <div>Notes: {expense.notes || 'N/A'}</div>
              {#if expense.receipt_url}
                <div>Receipt: <a href={expense.receipt_url} target="_blank" class="text-blue-500 hover:underline">View</a></div>
              {/if}
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
            <Label for="expense_type">Type</Label>
            <Select.Root
              selected={{value: $form.expense_type ?? '', label: $form.expense_type ?? 'Select expense type'}}
              onSelectedChange={(s) => {
                if (s?.value && isValidExpenseType(s.value)) {
                  $form.expense_type = s.value;
                  typeSelected = { value: s.value, label: s.value };
                }
              }}
            >
              <Select.Trigger class="w-full">
                <Select.Value placeholder="Select expense type" />
              </Select.Trigger>
              <Select.Content>
                {#each Object.values(expenseTypeEnum.enum) as type}
                  <Select.Item value={type}>{type}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if $errors.expense_type}<span class="text-red-500">{$errors.expense_type}</span>{/if}
          </div>

          <div>
            <Label for="expense_status">Status</Label>
            <Select.Root
              selected={{value: $form.expense_status ?? '', label: $form.expense_status ?? 'Select status'}}
              onSelectedChange={(s) => {
                if (s?.value && isValidExpenseStatus(s.value)) {
                  $form.expense_status = s.value;
                  statusSelected = { value: s.value, label: s.value };
                }
              }}
            >
              <Select.Trigger class="w-full">
                <Select.Value placeholder="Select status" />
              </Select.Trigger>
              <Select.Content>
                {#each Object.values(expenseStatusEnum.enum) as status}
                  <Select.Item value={status}>{status}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if $errors.expense_status}<span class="text-red-500">{$errors.expense_status}</span>{/if}
          </div>

          <div>
            <Label for="property_id">Property</Label>
            <Select.Root
              selected={{value: ($form.property_id ?? '').toString(), label: properties.find(p => p.id === $form.property_id)?.name ?? 'Select property'}}
              onSelectedChange={(s) => {
                if (s) {
                  $form.property_id = parseInt(s.value);
                }
              }}
            >
              <Select.Trigger class="w-full">
                <Select.Value placeholder="Select property" />
              </Select.Trigger>
              <Select.Content>
                {#each properties as property}
                  <Select.Item value={property.id.toString()}>{property.name}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if $errors.property_id}<span class="text-red-500">{$errors.property_id}</span>{/if}
          </div>

          <div>
            <Label for="description">Description</Label>
            <Input type="text" id="description" bind:value={$form.description} required />
            {#if $errors.description}<span class="text-red-500">{$errors.description}</span>{/if}
          </div>

          <div>
            <Label for="expense_date">Date</Label>
            <Input type="date" id="expense_date" bind:value={$form.expense_date} required />
            {#if $errors.expense_date}<span class="text-red-500">{$errors.expense_date}</span>{/if}
          </div>

          <div>
            <Label for="receipt_url">Receipt URL</Label>
            <Input type="url" id="receipt_url" bind:value={$form.receipt_url} />
            {#if $errors.receipt_url}<span class="text-red-500">{$errors.receipt_url}</span>{/if}
          </div>

          <div>
            <Label for="notes">Notes</Label>
            <Input type="text" id="notes" bind:value={$form.notes} />
            {#if $errors.notes}<span class="text-red-500">{$errors.notes}</span>{/if}
          </div>

          <Button type="submit">Add Expense</Button>
        </div>
      </form>
    </div>
</div>

{#if browser}
  <SuperDebug data={$form} />
{/if}