<script lang="ts">
  import type { PageData } from './$types';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { leaseSchema, leaseStatusEnum, unitTypeEnum } from './formSchema';
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import { Switch } from "$lib/components/ui/switch";

  import Textarea from '$lib/components/ui/textarea/textarea.svelte';




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
      console.log('Setting tenant ids to:', ids);
      // Use a new array to ensure reactivity
      $form.tenantIds = ids?.length ? ids.map(id => parseInt(id, 10)) : [];
      // Force validation update
      $form.tenantIds = $form.tenantIds;
    }
  };

  // DATABASE BASED SELECTION - Single Select
  let selectedRentalUnit = {
    get value() { 
       return $form.rental_unit_id?.toString() ;
    },
    set value(id: string ) { 
       $form.rental_unit_id = id ? parseInt(id) : 0;
    }
  };

  let triggerRentalUnit = $derived.by(() => {
    
  const unit = data.rental_units?.find(r => r.id === $form.rental_unit_id);
  if (!unit)
   return "Select a unit";
  const unitName: string = unit.name ?? "Unnamed Unit";
  const propertyName: string = unit.property?.[0]?.name ?? "No property";
  
  return `${unitName} - ${propertyName}`;
});

  // Form data for selections
  let formData = $state<Record<string, string>>({});

  console.log('Initial formData:', formData);

  // Add reactive stores for tracking changes
  let startDate = $derived($form.start_date);
  let termsMonths = $derived($form.terms_month);
  let daysInMonth = $state(0);
  let remainingDays = $state(0);
  let proratedAmount = $state(0);
  let storeProratedAmount = $state(0);

  // Update end_date whenever either start_date or terms_month changes
  $effect(() => {
    if (startDate && termsMonths) {
      try {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return;
        
        const end = new Date(start);
        end.setMonth(end.getMonth() + Number(termsMonths));
        $form.end_date = end.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error calculating end date:', error);
      }
    }
  });

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
        data-error={!!$errors.tenantIds  && selectedTenants.value.length === 0}
        {...$constraints.tenantIds}
      >
        {$form.tenantIds?.length 
          ? `${$form.tenantIds.length} tenant${$form.tenantIds.length === 1 ? '' : 's'} selected` 
          : "Select tenants"}
      </Select.Trigger>
      <Select.Content>
        <div class="max-h-[200px] overflow-y-auto">
          {#each data.tenants as tenant}
            <Select.Item value={tenant.id.toString()}>
              {tenant.name}
            </Select.Item>
          {/each}
        </div>
      </Select.Content>
    </Select.Root>
    {#if $errors.tenantIds && selectedTenants.value.length === 0}
      <p class="text-sm font-medium text-destructive">
        {Array.isArray($errors.tenantIds) 
          ? $errors.tenantIds[0] 
          : typeof $errors.tenantIds === 'string' 
            ? $errors.tenantIds 
            : 'At least one tenant must be selected'}
      </p>
    {/if}
  </div>

  <!-- DATABASE BASED SELECTION - Single Select -->
  <div class="space-y-2">
    <Label for="rental_unit_idaa">Rental Unit</Label>
    <Select.Root
      type="single"
      name="rental_unit_idaa"
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
        <div class="max-h-[200px] overflow-y-auto">
          {#each data.rental_units as unit}
            <Select.Item value={unit.id.toString()} label={unit.name}>
              {unit.name} - {unit.property[0]?.name || 'No property'}
            </Select.Item>
          {/each}
        </div>
      </Select.Content>
    </Select.Root>
    {#if $errors.rental_unit_id}
      <p class="text-sm font-medium text-destructive">
        {Array.isArray($errors.rental_unit_id) 
          ? $errors.rental_unit_id[0] 
          : typeof $errors.rental_unit_id === 'string' 
            ? $errors.rental_unit_id 
            : 'A rental unit must be selected'}
      </p>
    {/if}
  </div>

  <!-- Add this section after the rental unit selection and before the status selection -->
  <div class="space-y-2">
    <Label for="unit_type">Unit Type</Label>
    <Select.Root
      type="single"
      name="unit_type"
      bind:value={$form.unit_type}
    >
      <Select.Trigger 
        class="w-full"
        data-error={!!$errors.unit_type}
        {...$constraints.unit_type}
      >
        {$form.unit_type || "Select unit type"}
      </Select.Trigger>
      <Select.Content>
        {#each unitTypeEnum.options as type}
          <Select.Item value={type}>
            {type.replace('_', ' ').toLowerCase()}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.unit_type}
      <p class="text-sm font-medium text-destructive">{$errors.unit_type}</p>
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
        {$form.status || "Select a status"}
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

  <!-- Add this before the proration calculation section -->

  <!-- Only show proration controls if prorated_first_month is true -->
  

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
  </div>

  <!-- Add a read-only display of the calculated end date -->
  <div class="space-y-2">
    <Label for="end_date">End Date</Label>
    <Input
      type="date"
      id="end_date"
      name="end_date"
      value={$form.end_date}
      readonly
      disabled
      class="bg-gray-50"
    />
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

  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <Label for="prorated_first_month">Prorate First Month</Label>
      <Switch
        id="prorated_first_month"
        name="prorated_first_month"
        bind:checked={$form.prorated_first_month}
      />
    </div>
  </div>

  {#if $form.prorated_first_month}
  <div class="space-y-2">
    <!-- Replace the Prorate Button section -->
    <div class="space-y-2">
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-600">
          {#if daysInMonth && remainingDays && proratedAmount}
            <p>Days in month: {daysInMonth}</p>
            <p>Remaining days: {remainingDays}</p>
            <p class="font-medium text-blue-600">Prorated amount: ₱{proratedAmount.toFixed(2)}</p>
          {/if}
        </div>
        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={() => {
              // Validate required fields
              let hasErrors = false;
              
              if (!$form.start_date) {
                $errors.start_date = ['Start date is required for proration'];
                hasErrors = true;
              }
              
              if (!$form.terms_month) {
                $errors.terms_month = ['Terms (months) is required for proration'];
                hasErrors = true;
              }
              
              if (!$form.rent_amount) {
                $errors.rent_amount = ['Monthly rent is required for proration'];
                hasErrors = true;
              }

              if (hasErrors) return;

              // Proceed with proration if no errors
              const startDate = new Date($form.start_date);
              daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
              remainingDays = daysInMonth - startDate.getDate() + 1;
              proratedAmount = ($form.rent_amount / daysInMonth) * remainingDays;
              storeProratedAmount = proratedAmount;
              $form.prorated_amount = proratedAmount;
            }}
          >
            Prorate Rent
          </Button>
          <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={() => {
            daysInMonth = 0;
            remainingDays = 0;
            proratedAmount = 0;
            storeProratedAmount = 0;
            $form.prorated_amount = null;
          }}
        >
          Cancel Prorate
        </Button>
        </div>
      </div>
      
      <!-- Add Rounding Buttons -->
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={() => {
            if (proratedAmount) {
              const rounded = Math.ceil(storeProratedAmount / 100) * 100;
              proratedAmount = rounded;
              $form.prorated_amount = rounded;
            }
          }}
        >
          Round to 100s
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={() => {
            if (proratedAmount) {
              const rounded = Math.ceil(storeProratedAmount / 500) * 500;
              proratedAmount = rounded;
              $form.prorated_amount = rounded;
            }
          }}
        >
          Round to 500s
        </Button>
      </div>
    </div>
  </div>
{/if}
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