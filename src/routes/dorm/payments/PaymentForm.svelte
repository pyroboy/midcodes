<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import type { PaymentSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';

  export let data: any;
  export let billings: any[] = [];
  export let editMode = false;
  export let payment: PaymentSchema | undefined = undefined;

  const dispatch = createEventDispatcher();

  $: {
    if (payment && editMode) {
      form.data.set({
        ...payment
      });
    }
  }

  const { form, errors, enhance, submitting, reset } = superForm(data, {
    id: 'paymentForm',
    validators: zodClient(),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('paymentAdded');
        reset();
      }
    },
  });

  $: canEdit = data.isAdminLevel || data.isAccountant || data.isFrontdesk;
  $: canUpdateStatus = data.isAdminLevel || data.isAccountant;
  $: selectedBilling = billings.find(b => b.id === $form.billing_id);
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4 p-4 bg-white rounded-lg shadow"
>
  <input type="hidden" name="id" bind:value={$form.id} />

  {#if !editMode}
    <div class="space-y-2">
      <Label for="billing_id">Billing</Label>
      <Select.Root bind:value={$form.billing_id} disabled={!canEdit || editMode}>
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select a billing" />
        </Select.Trigger>
        <Select.Content>
          {#each billings as billing}
            <Select.Item value={billing.id}>
              {billing.type} 
              {#if billing.utility_type}
                - {billing.utility_type}
              {/if}
              ({billing.lease.name})
              - Balance: ₱{billing.balance.toFixed(2)}
              {#if billing.lease.room}
                - Room {billing.lease.room.room_number}
                {#if billing.lease.room.floor}
                  Floor {billing.lease.room.floor.floor_number}
                  {#if billing.lease.room.floor.wing}
                    Wing {billing.lease.room.floor.wing}
                  {/if}
                  ({billing.lease.room.floor.property?.name})
                {/if}
              {/if}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.billing_id}
        <p class="text-red-500 text-sm">{$errors.billing_id}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="amount">Amount</Label>
      <Input
        type="number"
        id="amount"
        name="amount"
        bind:value={$form.amount}
        min="0"
        max={selectedBilling?.balance || 0}
        step="0.01"
        disabled={!canEdit || editMode}
      />
      {#if $errors.amount}
        <p class="text-red-500 text-sm">{$errors.amount}</p>
      {/if}
    </div>
  {/if}

  <div class="space-y-2">
    <Label for="payment_method">Payment Method</Label>
    <Select.Root bind:value={$form.payment_method} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select payment method" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="CASH">Cash</Select.Item>
        <Select.Item value="BANK_TRANSFER">Bank Transfer</Select.Item>
        <Select.Item value="CREDIT_CARD">Credit Card</Select.Item>
        <Select.Item value="GCASH">GCash</Select.Item>
        <Select.Item value="MAYA">Maya</Select.Item>
        <Select.Item value="CHECK">Check</Select.Item>
      </Select.Content>
    </Select.Root>
    {#if $errors.payment_method}
      <p class="text-red-500 text-sm">{$errors.payment_method}</p>
    {/if}
  </div>

  {#if !editMode}
    <div class="space-y-2">
      <Label for="payment_date">Payment Date</Label>
      <Input
        type="date"
        id="payment_date"
        name="payment_date"
        bind:value={$form.payment_date}
        disabled={!canEdit}
      />
      {#if $errors.payment_date}
        <p class="text-red-500 text-sm">{$errors.payment_date}</p>
      {/if}
    </div>
  {/if}

  <div class="space-y-2">
    <Label for="reference_number">Reference Number</Label>
    <Input
      type="text"
      id="reference_number"
      name="reference_number"
      bind:value={$form.reference_number}
      disabled={!canEdit}
    />
    {#if $errors.reference_number}
      <p class="text-red-500 text-sm">{$errors.reference_number}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="receipt_url">Receipt URL</Label>
    <Input
      type="url"
      id="receipt_url"
      name="receipt_url"
      bind:value={$form.receipt_url}
      disabled={!canEdit}
    />
    {#if $errors.receipt_url}
      <p class="text-red-500 text-sm">{$errors.receipt_url}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="notes">Notes</Label>
    <Textarea
      id="notes"
      name="notes"
      bind:value={$form.notes}
      disabled={!canEdit}
      rows="3"
    />
    {#if $errors.notes}
      <p class="text-red-500 text-sm">{$errors.notes}</p>
    {/if}
  </div>

  {#if editMode && canUpdateStatus}
    <div class="space-y-2">
      <Label for="status">Status</Label>
      <Select.Root bind:value={$form.status}>
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select status" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="PENDING">Pending</Select.Item>
          <Select.Item value="PAID">Paid</Select.Item>
          <Select.Item value="FAILED">Failed</Select.Item>
          <Select.Item value="REFUNDED">Refunded</Select.Item>
          <Select.Item value="CANCELLED">Cancelled</Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.status}
        <p class="text-red-500 text-sm">{$errors.status}</p>
      {/if}
    </div>
  {/if}

  <div class="flex justify-end space-x-2">
    {#if editMode}
      {#if canUpdateStatus}
        <Button type="submit" disabled={$submitting}>
          Update
        </Button>
      {/if}
    {:else if canEdit}
      <Button type="submit" disabled={$submitting}>
        Create
      </Button>
    {/if}
  </div>
</form>
