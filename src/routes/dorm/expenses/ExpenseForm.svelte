<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import type { ExpenseSchema } from './formSchema';

  export let data: any;
  export let properties: any[] = [];
  export let editMode = false;
  export let expense: ExpenseSchema | undefined = undefined;
  export let user: any;

  const dispatch = createEventDispatcher();

  $: {
    if (expense && editMode) {
      form.data.set({
        ...expense
      });
    }
  }

  const { form, errors, enhance, submitting, reset } = superForm(data, {
    id: 'expenseForm',
    validators: zodClient(),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('expenseAdded');
        reset();
      }
    },
  });

  $: isAdminLevel = user?.role === 'super_admin' || user?.role === 'property_admin';
  $: isStaffLevel = user?.role === 'staff' || user?.role === 'frontdesk';
  $: canEdit = isAdminLevel || (isStaffLevel && !editMode);
  $: canApprove = isAdminLevel && editMode;
</script>

<form
  method="POST"
  action="?/create"
  use:enhance
  class="space-y-4 p-4 bg-white rounded-lg shadow"
>
  <input type="hidden" name="id" bind:value={$form.id} />

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <Select.Root bind:value={$form.property_id} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select property" />
      </Select.Trigger>
      <Select.Content>
        {#each properties as property}
          <Select.Item value={property.id}>{property.name}</Select.Item>
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
      <Select.Root bind:value={$form.expense_type} disabled={!canEdit}>
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select type" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="MAINTENANCE">Maintenance</Select.Item>
          <Select.Item value="REPAIR">Repair</Select.Item>
          <Select.Item value="UTILITY">Utility</Select.Item>
          <Select.Item value="SUPPLIES">Supplies</Select.Item>
          <Select.Item value="SALARY">Salary</Select.Item>
          <Select.Item value="MISC">Miscellaneous</Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.expense_type}
        <span class="text-red-500 text-sm">{$errors.expense_type}</span>
      {/if}
    </div>

    {#if editMode && canApprove}
      <div class="space-y-2">
        <Label for="expense_status">Status</Label>
        <Select.Root bind:value={$form.expense_status}>
          <Select.Trigger class="w-full">
            <Select.Value placeholder="Select status" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="PENDING">Pending</Select.Item>
            <Select.Item value="APPROVED">Approved</Select.Item>
            <Select.Item value="REJECTED">Rejected</Select.Item>
            <Select.Item value="CANCELLED">Cancelled</Select.Item>
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
      <Label for="amount">Amount</Label>
      <Input
        id="amount"
        name="amount"
        type="number"
        step="0.01"
        bind:value={$form.amount}
        placeholder="Enter amount"
        class="w-full"
        disabled={!canEdit}
      />
      {#if $errors.amount}
        <span class="text-red-500 text-sm">{$errors.amount}</span>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="expense_date">Date</Label>
      <Input
        id="expense_date"
        name="expense_date"
        type="date"
        bind:value={$form.expense_date}
        class="w-full"
        disabled={!canEdit}
      />
      {#if $errors.expense_date}
        <span class="text-red-500 text-sm">{$errors.expense_date}</span>
      {/if}
    </div>
  </div>

  <div class="space-y-2">
    <Label for="description">Description</Label>
    <Input
      id="description"
      name="description"
      bind:value={$form.description}
      placeholder="Enter description"
      class="w-full"
      disabled={!canEdit}
    />
    {#if $errors.description}
      <span class="text-red-500 text-sm">{$errors.description}</span>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="receipt_url">Receipt URL</Label>
    <Input
      id="receipt_url"
      name="receipt_url"
      type="url"
      bind:value={$form.receipt_url}
      placeholder="Enter receipt URL"
      class="w-full"
      disabled={!canEdit}
    />
    {#if $errors.receipt_url}
      <span class="text-red-500 text-sm">{$errors.receipt_url}</span>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="notes">Notes</Label>
    <Input
      id="notes"
      name="notes"
      bind:value={$form.notes}
      placeholder="Enter notes"
      class="w-full"
      disabled={!canEdit}
    />
    {#if $errors.notes}
      <span class="text-red-500 text-sm">{$errors.notes}</span>
    {/if}
  </div>

  {#if canEdit}
    <div class="flex justify-end space-x-2">
      {#if editMode && isAdminLevel}
        <Button
          type="submit"
          formaction="?/delete"
          variant="destructive"
          disabled={$submitting}
        >
          Delete
        </Button>
      {/if}
      <Button
        type="submit"
        formaction={editMode ? '?/update' : '?/create'}
        variant="default"
        disabled={$submitting}
      >
        {editMode ? 'Update' : 'Create'}
      </Button>
    </div>
  {/if}
</form>
