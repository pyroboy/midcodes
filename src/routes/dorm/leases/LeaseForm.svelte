<script lang="ts">
  import type { SvelteComponentTyped } from "svelte";
  import { superForm } from 'sveltekit-superforms/client';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { leaseSchema } from './formSchema';
  import { createEventDispatcher } from 'svelte';
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import MultiSelect from "$lib/components/ui/multiSelect.svelte";
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

  export let data: PageData;
  export let editMode = false;
  export let form: SuperForm<z.infer<typeof leaseSchema>>['form'];
  export let errors: SuperForm<z.infer<typeof leaseSchema>>['errors'];
  export let enhance: SuperForm<z.infer<typeof leaseSchema>>['enhance'];
  export let constraints: SuperForm<z.infer<typeof leaseSchema>>['constraints'];
  export let submitting: SuperForm<z.infer<typeof leaseSchema>>['submitting'];
  export let entity: z.infer<typeof leaseSchema> | undefined = undefined;

  const dispatch = createEventDispatcher();

  function getRentalUnitName(rentalUnitId: number): string | undefined {
    return data.rental_units?.find((r: RentalUnit) => r.id === rentalUnitId)?.name;
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

  $: currentTenants = ($form.tenantIds?.map((id: number) => data.tenants?.find((t: Tenant) => t.id === id)) || [])
    .filter((t): t is Tenant => t !== undefined);

  $: currentRentalUnit = data.rental_units?.find((r: RentalUnit) => r.id === $form.locationId);

  // Dispatch changes to parent
  $: {
    dispatch('tenantsChange', currentTenants);
    dispatch('rentalUnitChange', currentRentalUnit);
  }

  function mapTenantToOption(tenant: Tenant) {
    return {
      value: tenant.id,
      label: tenant.name
    };
  }

  function mapRentalUnit(rental_unit: RentalUnit) {
    return rental_unit;
  }

  $: {
    if ($form.leaseStartDate && $form.leaseTermsMonth) {
      const startDate = new Date($form.leaseStartDate as string);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + Number($form.leaseTermsMonth));
      $form.leaseEndDate = endDate.toISOString().split('T')[0];
    }
  }
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:enhance
  class="space-y-4"
>
  {#if entity}
    <div class="text-sm text-muted-foreground mb-4">
      Editing lease for {getRentalUnitName(entity.locationId)}
      {#if entity.tenantIds.length > 0}
        - Tenants: {getTenantNames(entity.tenantIds)}
      {/if}
    </div>
  {/if}
  {#if editMode}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <div class="space-y-4">
    <div class="form-field">
      <Label for="tenantIds">Tenants</Label>
      <MultiSelect
        options={data.tenants?.map(mapTenantToOption) || []}
        bind:selected={$form.tenantIds}
        placeholder="Select tenants..."
        on:change={({ detail }) => {
          $form.tenantIds = detail;
        }}
      />
      {#if $errors.tenantIds}
        <p class="text-destructive text-sm mt-1">{$errors.tenantIds}</p>
      {/if}
    </div>

    <div class="form-field">
      <Label for="locationId">Rental Unit</Label>
      <select 
        id="locationId"
        name="locationId" 
        bind:value={$form.locationId}
        class="w-full"
        {...$constraints.locationId}
      >
        <option value="">Select rental unit</option>
        {#each data.rental_units?.map(mapRentalUnit) || [] as rental_unit}
          <option value={rental_unit.id}>
            {rental_unit.name} - {rental_unit.property.name}
          </option>
        {/each}
      </select>
      {#if $errors.locationId}
        <p class="text-destructive text-sm mt-1">{$errors.locationId}</p>
      {/if}
    </div>

    <div class="form-field">
      <Label for="leaseType">Type</Label>
      <select 
        id="leaseType"
        name="leaseType" 
        bind:value={$form.leaseType}
        class="w-full"
        {...$constraints.leaseType}
      >
        <option value="">Select type</option>
        {#each Object.values(leaseSchema.shape.leaseType.options) as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
      {#if $errors.leaseType}
        <p class="text-destructive text-sm mt-1">{$errors.leaseType}</p>
      {/if}
    </div>

    <div class="form-field">
      <Label for="leaseStatus">Status</Label>
      <select 
        id="leaseStatus"
        name="leaseStatus" 
        bind:value={$form.leaseStatus}
        class="w-full"
        {...$constraints.leaseStatus}
      >
        <option value="">Select status</option>
        {#each Object.values(leaseSchema.shape.leaseStatus.options) as status}
          <option value={status}>{status}</option>
        {/each}
      </select>
      {#if $errors.leaseStatus}
        <p class="text-destructive text-sm mt-1">{$errors.leaseStatus}</p>
      {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-field">
        <Label for="leaseStartDate">Start Date</Label>
        <input
        type="date"
        id="leaseStartDate"
        name="leaseStartDate"
        bind:value={$form.leaseStartDate}
        {...$constraints.leaseStartDate}
        />
        {#if $errors.leaseStartDate}
          <p class="text-destructive text-sm mt-1">{$errors.leaseStartDate}</p>
        {/if}
      </div>

      <div class="form-field">
        <Label for="leaseTermsMonth">Terms (months)</Label>
        <input
        type="number"
        id="leaseTermsMonth"
        name="leaseTermsMonth"
        bind:value={$form.leaseTermsMonth}
        min="1"
        max="60"
        {...$constraints.leaseTermsMonth}
        />
        {#if $errors.leaseTermsMonth}
          <p class="text-destructive text-sm mt-1">{$errors.leaseTermsMonth}</p>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-field">
        <Label for="leaseRentRate">Monthly Rent</Label>
        <input
        type="number"
        id="leaseRentRate"
        name="leaseRentRate"
        bind:value={$form.leaseRentRate}
        min="0"
        step="0.01"
        {...$constraints.leaseRentRate}
        />
        {#if $errors.leaseRentRate}
          <p class="text-destructive text-sm mt-1">{$errors.leaseRentRate}</p>
        {/if}
      </div>

      <div class="form-field">
        <Label for="leaseSecurityDeposit">Security Deposit</Label>
        <input
        type="number"
        id="leaseSecurityDeposit"
        name="leaseSecurityDeposit"
        bind:value={$form.leaseSecurityDeposit}
        min="0"
        step="0.01"
        {...$constraints.leaseSecurityDeposit}
        />
        {#if $errors.leaseSecurityDeposit}
          <p class="text-destructive text-sm mt-1">{$errors.leaseSecurityDeposit}</p>
        {/if}
      </div>
    </div>

    <div class="form-field">
      <Label for="leaseNotes">Notes</Label>
      <textarea
        id="leaseNotes"
        name="leaseNotes"
        bind:value={$form.leaseNotes}
        rows={3}
        {...$constraints.leaseNotes}
      />
      {#if $errors.leaseNotes}
        <p class="text-destructive text-sm mt-1">{$errors.leaseNotes}</p>
      {/if}
    </div>

    <div class="flex justify-end space-x-2">
      {#if editMode && data.isAdminLevel}
        <Button
          type="button"
          variant="destructive"
          on:click={() => dispatch('delete')}
        >
          Delete
        </Button>
      {/if}
      <Button type="button" variant="outline" on:click={() => dispatch('cancel')}>
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
  @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm;
}

:global(.form-field select[multiple]) {
  @apply h-32;
}

:global(.form-field select option) {
  @apply py-1;
}

:global(.form-field input) {
  @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm;
}

:global(.form-field textarea) {
  @apply w-full rounded-md border border-input bg-background px-3 py-2 text-sm;
}
</style>
