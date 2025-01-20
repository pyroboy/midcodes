<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { SvelteComponentTyped } from "svelte";
  import { superForm } from 'sveltekit-superforms/client';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { leaseSchema } from './formSchema';
  import { createEventDispatcher } from 'svelte';
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import type { PageData } from './$types';

  interface Tenant {
    id: number;
    name: string;
    email: string | null;
    contact_number: string | null;
  }

  interface RentalUnit {
    id: number;
    name: string;
    property: {
      id: number;
      name: string;
    };
  }

  interface FormError {
    error?: string;
    message?: string;
  }

  type FormData = z.infer<typeof leaseSchema>;

  interface Props {
    data: PageData;
    editMode?: boolean;
    form: SuperForm<FormData>['form'];
    errors: SuperForm<FormData>['errors'];
    enhance: SuperForm<FormData>['enhance'];
    constraints: SuperForm<FormData>['constraints'];
    submitting: SuperForm<FormData>['submitting'];
    entity?: FormData | undefined;
  }

  interface Props {
    data: PageData;
    editMode?: boolean;
    form: SuperForm<FormData>['form'];
    errors: SuperForm<FormData>['errors'];
    enhance: SuperForm<FormData>['enhance'];
    constraints: SuperForm<FormData>['constraints'];
    submitting: SuperForm<FormData>['submitting'];
    entity?: FormData | undefined;
  }

  let {
    data,
    editMode = false,
    form,
    errors,
    enhance,
    constraints,
    submitting,
    entity = undefined
  }: Props = $props();

  const dispatch = createEventDispatcher();

  function getRentalUnitName(rental_unit_id: number): string | undefined {
    return data.rental_units?.find((r) => r.id === rental_unit_id)?.name;
  }

  function getTenantName(tenantId: number): string | undefined {
    return data.tenants?.find((t: Tenant) => t.id === tenantId)?.name;
  }

  function getTenantNames(tenantIds: number[]): string {
    return tenantIds
      .map(id => getTenantName(id))
      .filter((name): name is string => name !== undefined)
      .join(', ');
  }

  let currentTenants = $derived(($form.tenantIds?.map((id: number) => data.tenants?.find((t: Tenant) => t.id === id)) || [])
    .filter((t): t is Tenant => t !== undefined));

  let currentRentalUnit = $derived(data.rental_units?.find((r) => r.id === $form.rental_unit_id));

  // Dispatch changes to parent
  run(() => {
    dispatch('tenantsChange', currentTenants);
    dispatch('rentalUnitChange', currentRentalUnit);
  });

  function mapTenantToOption(tenant: Tenant) {
    return {
      value: tenant.id,
      label: tenant.name
    };
  }

  function mapRentalUnit(rental_unit: unknown): RentalUnit {
    if (
      typeof rental_unit === 'object' && 
      rental_unit !== null && 
      'id' in rental_unit && 
      'name' in rental_unit && 
      'property' in rental_unit &&
      typeof rental_unit.property === 'object' &&
      rental_unit.property !== null &&
      'id' in rental_unit.property &&
      'name' in rental_unit.property
    ) {
      return rental_unit as RentalUnit;
    }
    throw new Error('Invalid rental unit data structure');
  }

  run(() => {
    if ($form.start_date && $form.terms_month) {
      const startDate = new Date($form.start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + Number($form.terms_month));
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      $form.end_date = `${year}-${month}-${day}`;
    }
  });

  let formErrors = $derived($errors as unknown as FormError);
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:enhance
  class="space-y-4"
>
  {#if formErrors?.message || formErrors?.error}
    <Alert variant="destructive">
      <AlertDescription>
        {formErrors.message || formErrors.error || 'An error occurred'}
      </AlertDescription>
    </Alert>
  {/if}

  {#if entity}
    <div class="text-sm text-muted-foreground mb-4">
      Editing lease for {getRentalUnitName(entity.rental_unit_id)}
      {#if entity.tenantIds.length > 0}
        - Tenants: {getTenantNames(entity.tenantIds)}
      {/if}
    </div>
  {/if}

  {#if editMode}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}
  <input type="hidden" name="name" value=""/>
  <div class="space-y-4">
    <div class="form-field">
      <Label for="tenantIds">Tenants</Label>
      <!-- <MultiSelect
        options={data.tenants?.map(mapTenantToOption) || []}
        bind:selected={$form.tenantIds}
        placeholder="Select tenants..."
      /> -->
      <input type="hidden" name="tenantIds" value={JSON.stringify($form.tenantIds)} />
      {#if $errors.tenantIds}
        <p class="error-message">{$errors.tenantIds}</p>
      {/if}
    </div>

    <div class="form-field">
      <Label for="rental_unit_id">Rental Unit</Label>
      <select 
        id="rental_unit_id"
        name="rental_unit_id" 
        bind:value={$form.rental_unit_id}
        class="w-full"
        {...$constraints.rental_unit_id}
      >
        <option value="">Select rental unit</option>
        {#each data.rental_units?.map(mapRentalUnit) || [] as rental_unit}
          <option value={rental_unit.id}>
            {rental_unit.name} - {rental_unit.property.name}
          </option>
        {/each}
      </select>
      {#if $errors.rental_unit_id}
        <p class="error-message">{$errors.rental_unit_id}</p>
      {/if}
    </div>

    <div class="form-field">
      <Label for="status">Status</Label>
      <select 
        id="status"
        name="status" 
        bind:value={$form.status}
        class="w-full"
        {...$constraints.status}
      >
        <option value="">Select status</option>
        {#each Object.values(leaseSchema.shape.status.options) as status}
          <option value={status}>{status}</option>
        {/each}
      </select>
      {#if $errors.status}
        <p class="error-message">{$errors.status}</p>
      {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-field">
        <Label for="start_date">Start Date</Label>
        <input
          type="date"
          id="start_date"
          name="start_date"
          bind:value={$form.start_date}
          {...$constraints.start_date}
        />
        {#if $errors.start_date}
          <p class="error-message">{$errors.start_date}</p>
        {/if}
      </div>

      <div class="form-field">
        <Label for="terms_month">Terms (months)</Label>
        <input
          type="number"
          id="terms_month"
          name="terms_month"
          bind:value={$form.terms_month}
          min="1"
          max="60"
          {...$constraints.terms_month}
        />
        {#if $errors.terms_month}
          <p class="error-message">{$errors.terms_month}</p>
        {/if}
      </div>
    </div>

    <input type="hidden" name="end_date" bind:value={$form.end_date} />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-field">
        <Label for="rent_amount">Monthly Rent</Label>
        <input
          type="number"
          id="rent_amount"
          name="rent_amount"
          bind:value={$form.rent_amount}
          min="0"
          step="0.01"
          {...$constraints.rent_amount}
        />
        {#if $errors.rent_amount}
          <p class="error-message">{$errors.rent_amount}</p>
        {/if}
      </div>

      <div class="form-field">
        <Label for="security_deposit">Security Deposit</Label>
        <input
          type="number"
          id="security_deposit"
          name="security_deposit"
          bind:value={$form.security_deposit}
          min="0"
          step="0.01"
          {...$constraints.security_deposit}
        />
        {#if $errors.security_deposit}
          <p class="error-message">{$errors.security_deposit}</p>
        {/if}
      </div>
    </div>

    <div class="form-field">
      <Label for="notes">Notes</Label>
      <textarea
        id="notes"
        name="notes"
        bind:value={$form.notes}
        rows={3}
        {...$constraints.notes}
></textarea>
      {#if $errors.notes}
        <p class="error-message">{$errors.notes}</p>
      {/if}
    </div>

    <div class="flex justify-end space-x-2">
      {#if editMode && data.isAdminLevel}
        <Button
          type="button"
          variant="destructive"
          onclick={() => dispatch('delete')}
        >
          Delete
        </Button>
      {/if}
      <Button type="button" variant="outline" onclick={() => dispatch('cancel')}>
        Cancel
      </Button>
      <Button type="submit" variant="default" disabled={$submitting}>
        {#if $submitting}
          Saving...
        {:else}
          {editMode ? 'Update' : 'Create'} Lease
        {/if}
      </Button>
    </div>
  </div>
</form>

<style lang="postcss">
  .form-field {
    @apply space-y-2;
  }

  :global(.form-field select) {
    @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background;
  }

  :global(.form-field select[multiple]) {
    @apply h-32;
  }

  :global(.form-field select option) {
    @apply py-1;
  }

  :global(.form-field input) {
    @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background;
  }

  :global(.form-field textarea) {
    @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background;
  }

  :global(.error-message) {
    @apply text-destructive text-sm mt-1;
  }
</style>
