<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import { expenseSchema, type ExpenseSchema, type Property } from './formSchema';
  import type { SuperValidated } from 'sveltekit-superforms';

  type UserRole = 'super_admin' | 'property_admin' | 'staff' | 'frontdesk' | 'user';

  interface User {
    role: UserRole;
  }

  interface PageData {
    form: SuperValidated<ExpenseSchema>;
    expenses: ExpenseSchema[];
    properties: Property[];
    user: User;
  }

  export let data: PageData;
  export let editMode = false;
  export let expense: ExpenseSchema | undefined = undefined;

  const dispatch = createEventDispatcher();

  const { form, errors, enhance, submitting, reset } = superForm<ExpenseSchema>(data.form, {
    id: 'expenseForm',
    validators: zodClient(expenseSchema),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('expenseAdded');
        reset();
      }
    },
  });

  $: {
    if (expense && editMode) {
      $form = expense;
    }
  }

  $: isAdminLevel = data.user?.role === 'super_admin' || data.user?.role === 'property_admin';
  $: isStaffLevel = data.user?.role === 'staff' || data.user?.role === 'frontdesk';
  $: canEdit = isAdminLevel || (isStaffLevel && !editMode);
  $: canApprove = isAdminLevel && editMode;

  function updatePropertyId(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.property_id = parseInt(selected.value);
    }
  }

  function updateExpenseType(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.expense_type = selected.value as ExpenseSchema['expense_type'];
    }
  }

  function updateExpenseStatus(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.expense_status = selected.value as ExpenseSchema['expense_status'];
    }
  }
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4 p-4 bg-white rounded-lg shadow"
>
  <input type="hidden" name="id" bind:value={$form.id} />

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <Select.Root onSelectedChange={updatePropertyId}>
      <Select.Trigger class="w-full" disabled={!canEdit}>
        <Select.Value placeholder="Select property" />
      </Select.Trigger>
      <Select.Content>
        {#each data.properties as property}
          <Select.Item value={property.id.toString()}>
            {property.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.property_id}
      <span class="text-red-500 text-sm">{$errors.property_id}</span>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="expense_type">Type</Label>
      <Select.Root onSelectedChange={updateExpenseType}>
        <Select.Trigger class="w-full" disabled={!canEdit}>
          <Select.Value placeholder="Select type" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="MAINTENANCE">Maintenance</Select.Item>
          <Select.Item value="UTILITIES">Utilities</Select.Item>
          <Select.Item value="SUPPLIES">Supplies</Select.Item>
          <Select.Item value="SALARY">Salary</Select.Item>
          <Select.Item value="OTHERS">Others</Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.expense_type}
        <span class="text-red-500 text-sm">{$errors.expense_type}</span>
      {/if}
    </div>

    {#if editMode && canApprove}
      <div class="space-y-2">
        <Label for="expense_status">Status</Label>
        <Select.Root onSelectedChange={updateExpenseStatus}>
          <Select.Trigger class="w-full">
            <Select.Value placeholder="Select status" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="PENDING">Pending</Select.Item>
            <Select.Item value="APPROVED">Approved</Select.Item>
            <Select.Item value="REJECTED">Rejected</Select.Item>
          </Select.Content>
        </Select.Root>
        {#if $errors.expense_status}
          <span class="text-red-500 text-sm">{$errors.expense_status}</span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="expense_date">Date</Label>
      <Input
        type="date"
        id="expense_date"
        bind:value={$form.expense_date}
        disabled={!canEdit}
      />
      {#if $errors.expense_date}
        <span class="text-red-500 text-sm">{$errors.expense_date}</span>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="amount">Amount</Label>
      <Input
        type="number"
        id="amount"
        bind:value={$form.amount}
        min="0"
        step="0.01"
        disabled={!canEdit}
      />
      {#if $errors.amount}
        <span class="text-red-500 text-sm">{$errors.amount}</span>
      {/if}
    </div>
  </div>

  <div class="space-y-2">
    <Label for="description">Description</Label>
    <Input
      type="text"
      id="description"
      bind:value={$form.description}
      disabled={!canEdit}
    />
    {#if $errors.description}
      <span class="text-red-500 text-sm">{$errors.description}</span>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="notes">Notes</Label>
    <Input
      type="text"
      id="notes"
      bind:value={$form.notes}
      disabled={!canEdit}
    />
    {#if $errors.notes}
      <span class="text-red-500 text-sm">{$errors.notes}</span>
    {/if}
  </div>

  {#if canEdit}
    <div class="flex justify-end gap-2">
      {#if editMode}
        <Button type="submit" formaction="?/delete" variant="destructive" disabled={$submitting}>
          Delete
        </Button>
      {/if}
      <Button type="submit" disabled={$submitting}>
        {editMode ? 'Update' : 'Create'} Expense
      </Button>
    </div>
  {/if}
</form>