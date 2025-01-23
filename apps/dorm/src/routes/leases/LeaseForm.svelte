<script lang="ts">
  import type { PageData } from './$types';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { leaseSchema, leaseStatusEnum } from './formSchema';
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';

  import Textarea from '$lib/components/ui/textarea/textarea.svelte';


  interface Tenant {
    id: number;
    name: string;
  }

  interface Property {
    id: number;
    name: string;
  }

  interface RentalUnit {
    id: number;
    name: string;
    property: Property[];
  }

  interface Props {
    data: PageData;
    editMode?: boolean;
    form: SuperForm<z.infer<typeof leaseSchema>>['form'];
    errors: SuperForm<z.infer<typeof leaseSchema>>['errors'];
    enhance: SuperForm<z.infer<typeof leaseSchema>>['enhance'];
    constraints: SuperForm<z.infer<typeof leaseSchema>>['constraints'];
    submitting: SuperForm<z.infer<typeof leaseSchema>>['submitting'];
  }

  let {
    data,
    editMode = false,
    form,
    errors,
    enhance,
    constraints,
    submitting,
  }: Props = $props();

  const dispatch = createEventDispatcher();

  // DATABASE BASED SELECTION - Multiple Select
  let selectedTenants = {
    get value() { 
      return $form.tenantIds?.map(id => id.toString()) || [] 
    },
    set value(ids: string[]) { 
      $form.tenantIds = ids.map(id => parseInt(id, 10))
    }
  };

  // DATABASE BASED SELECTION - Single Select
  let selectedRentalUnit = {
    get value() { 
      return $form.rental_unit_id?.toString() || undefined 
    },
    set value(id: string | undefined) { 
      $form.rental_unit_id = id ? parseInt(id, 10) : 0 
    }
  };

  let triggerRentalUnit = $derived(
    $form.rental_unit_id
      ? data.rental_units?.find(r => r.id === $form.rental_unit_id)?.name ?? "Select a unit"
      : "Select a unit"
  );

  let triggerStatus = $derived($form.status || "Select a status");

  function handleCancel() {
    dispatch('cancel');
  }

  function handleDelete() {
    dispatch('delete');
  }
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4"
  novalidate
>
  {#if editMode && $form.id}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <!-- DATABASE BASED SELECTION - Multiple Select -->
  <div class="space-y-2">
    <Label for="tenantIds">Tenants</Label>
    <Select.Root
      type="multiple"
      name="tenantIds"
      bind:value={selectedTenants.value}
    >
      <Select.Trigger 
        class="w-full" 
        data-error={!!$errors.tenantIds}
        {...$constraints.tenantIds}
      >
        {$form.tenantIds?.length 
          ? `${$form.tenantIds.length} tenant${$form.tenantIds.length === 1 ? '' : 's'} selected` 
          : "Select tenants"}
      </Select.Trigger>
      <Select.Content>
        {#each data.tenants as tenant}
          <Select.Item value={tenant.id.toString()}>
            {tenant.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.tenantIds}
      <p class="text-sm font-medium text-destructive">{$errors.tenantIds}</p>
    {/if}
  </div>

  <!-- DATABASE BASED SELECTION - Single Select -->
  <div class="space-y-2">
    <Label for="rental_unit_id">Rental Unit</Label>
    <Select.Root
      type="single"
      name="rental_unit_id"
      bind:value={selectedRentalUnit.value}
    >
      <Select.Trigger 
        class="w-full"
        data-error={!!$errors.rental_unit_id}
        {...$constraints.rental_unit_id}
      >
        {triggerRentalUnit}
      </Select.Trigger>
      <Select.Content>
        {#each data.rental_units as unit}
          <Select.Item value={unit.id.toString()}>
            {unit.name} - {unit.property[0]?.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.rental_unit_id}
      <p class="text-sm font-medium text-destructive">{$errors.rental_unit_id}</p>
    {/if}
  </div>

  <!-- ENUM BASED SELECTION -->
  <div class="space-y-2">
    <Label for="status">Status</Label>
    <Select.Root
      type="single"
      name="status"
      bind:value={$form.status}
    >
      <Select.Trigger 
        class="w-full"
        data-error={!!$errors.status}
        {...$constraints.status}
      >
        {triggerStatus}
      </Select.Trigger>
      <Select.Content>
        {#each leaseStatusEnum.options as status}
          <Select.Item value={status}>
            {status}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.status}
      <p class="text-sm font-medium text-destructive">{$errors.status}</p>
    {/if}
  </div>

  <!-- Rest of the form remains the same -->
  <!-- Dates and Terms -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="start_date">Start Date</Label>
      <Input
        type="date"
        id="start_date"
        name="start_date"
        bind:value={$form.start_date}
        data-error={!!$errors.start_date}
        {...$constraints.start_date}
      />
      {#if $errors.start_date}
        <p class="text-sm font-medium text-destructive">{$errors.start_date}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="end_date">End Date</Label>
      <Input
        type="date"
        id="end_date"
        name="end_date"
        bind:value={$form.end_date}
        data-error={!!$errors.end_date}
        {...$constraints.end_date}
      />
      {#if $errors.end_date}
        <p class="text-sm font-medium text-destructive">{$errors.end_date}</p>
      {/if}
    </div>
  </div>

  <!-- Terms -->
  <div class="space-y-2">
    <Label for="terms_month">Terms (months)</Label>
    <Input
      type="number"
      id="terms_month"
      name="terms_month"
      bind:value={$form.terms_month}
      min="1"
      max="60"
      data-error={!!$errors.terms_month}
      {...$constraints.terms_month}
    />
    {#if $errors.terms_month}
      <p class="text-sm font-medium text-destructive">{$errors.terms_month}</p>
    {/if}
  </div>

  <!-- Financial Details -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="rent_amount">Monthly Rent</Label>
      <Input
        type="number"
        id="rent_amount"
        name="rent_amount"
        bind:value={$form.rent_amount}
        min="0"
        step="0.01"
        data-error={!!$errors.rent_amount}
        {...$constraints.rent_amount}
      />
      {#if $errors.rent_amount}
        <p class="text-sm font-medium text-destructive">{$errors.rent_amount}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="security_deposit">Security Deposit</Label>
      <Input
        type="number"
        id="security_deposit"
        name="security_deposit"
        bind:value={$form.security_deposit}
        min="0"
        step="0.01"
        data-error={!!$errors.security_deposit}
        {...$constraints.security_deposit}
      />
      {#if $errors.security_deposit}
        <p class="text-sm font-medium text-destructive">{$errors.security_deposit}</p>
      {/if}
    </div>
  </div>

  <!-- Notes -->
  <div class="space-y-2">
    <Label for="notes">Notes</Label>
    <Textarea
      id="notes"
      name="notes"
      bind:value={$form.notes}
      rows={3}
      data-error={!!$errors.notes}
      {...$constraints.notes}
    />
    {#if $errors.notes}
      <p class="text-sm font-medium text-destructive">{$errors.notes}</p>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex justify-end space-x-2">
    {#if editMode}
      <Button
        type="button"
        variant="destructive"
        onclick={handleDelete}
      >
        Delete
      </Button>
    {/if}
    <Button
      type="button"
      variant="outline"
      onclick={handleCancel}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={$submitting}>
      {#if $submitting}
        Saving...
      {:else}
        {editMode ? 'Update' : 'Create'} Lease
      {/if}
    </Button>
  </div>
</form>



<style lang="postcss">
  :global([data-error="true"]) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
</style>