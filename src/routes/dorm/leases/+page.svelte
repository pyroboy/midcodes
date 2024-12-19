

<script lang="ts">

  import { leaseStatusEnum, leaseTypeEnum } from './formSchema.ts'
  import { zod } from 'sveltekit-superforms/adapters';
   import RandomLease from './RandomLease.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';
  import { Textarea } from '$lib/components/ui/textarea';
  import MultiSelect from '$lib/components/ui/multiSelect.svelte';
  import type { PageData } from './$types';
  import LeaseList from './LeaseList.svelte';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { superForm } from "sveltekit-superforms";
  import { Field, Control, Label, Description, FieldErrors } from "formsnap";
  import type { Infer } from "sveltekit-superforms";
  import { browser } from "$app/environment";
  import { Input } from '$lib/components/ui/input';
import { schema } from './formSchema';
import type { FormSchema } from './formSchema';
  export let data: PageData & { form: Infer<FormSchema> };


  const form = superForm(data.form, {
    validators: zod(schema),
  taintedMessage: null,
  resetForm: true,
  onSubmit: ({ formData, cancel }) => {
    const formDataObj = Object.fromEntries(formData);
    console.log("Form data being submitted:", formDataObj);
    console.log("Current form state:", $formData);
    // Don't cancel the submission
    return;
  }
  });

  let { form: formData, enhance, reset } = form;


  $: proratedDays = $formData.leaseStartDate
    ? new Date(new Date($formData.leaseStartDate).getFullYear(), new Date($formData.leaseStartDate).getMonth() + 1, 0).getDate() - new Date($formData.leaseStartDate).getDate() + 1
    : 0;

  function handleTenantChange(event: CustomEvent<number[]>) {
    $formData.tenantIds = event.detail;
  }

  function editLease(lease: any) {
    $formData = {
      ...lease,
      tenantIds: lease.leaseTenants.map((lt: any) => lt.tenant.id),
    };
  }

  $: tenantOptions = data.tenants.map(tenant => ({
    value: tenant.id,
    label: tenant.tenantName
  }));

  $: leaseStatusSelected = $formData.leaseStatus ? { value: $formData.leaseStatus, label: $formData.leaseStatus } : undefined;
  $: leaseTypeSelected = $formData.leaseType ? { value: $formData.leaseType, label: $formData.leaseType } : undefined;
  $: locationSelected = $formData.locationId
    ? { value: $formData.locationId, label: data.locations.find(l => l.id === $formData.locationId)?.locationName ?? 'Select a location' }
    : undefined;

  $: if ($formData.leaseStartDate && $formData.leaseTermsMonth) {
    const startDate = new Date($formData.leaseStartDate);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + $formData.leaseTermsMonth, startDate.getDate() - 1);
    $formData.leaseEndDate = endDate.toISOString().split('T')[0];
  }

  function handleRandomLease(event: CustomEvent) {
  const randomLease = event.detail;
  if (randomLease.leaseTerminateDate === '') {
    randomLease.leaseTerminateDate = null;
  }
  $formData = { ...$formData, ...randomLease };
}
</script>

<div class="container mx-auto p-4 flex">
  <div class="w-2/3 pr-4">
  <h1 class="text-2xl font-bold mb-4">Lease Management</h1>
  
  <LeaseList leases={data.leases} {editLease} />
</div>
<div class="w-1/3 pl-4">
  <h2 class="text-xl font-bold mt-8 mb-4">Lease {$formData.leaseType == 'BEDSPACER'?'Bed Spacer':'Private Room'} Form</h2>
  {$formData.leaseType == 'BEDSPACER'?'Select One Tenant Only':'Select Multiple Tenants'}
  <RandomLease tenants={data.tenants} locations={data.locations} on:randomLease={handleRandomLease} />

  <form method="POST" action="?/create" use:enhance>
    <input type="hidden" name="locationId" value={$formData.locationId}>
    <input type="hidden" name="leaseType" value={$formData.leaseType}>

    {#each $formData.tenantIds as tenantId}
      <input type="hidden" name="tenantIds" value={tenantId}>
    {/each}
    <Field {form} name="leaseType">
      <Control let:attrs>
        <Label>Lease Type</Label>
        <Select.Root
          selected={leaseTypeSelected}
          onSelectedChange={(s) => {
            if (s) {
              $formData.leaseType = s.value;
              if (s.value === 'BEDSPACER' && $formData.tenantIds.length > 1) {
                $formData.tenantIds = [$formData.tenantIds[0]];
              }
            }
          }}
        >
          <Select.Trigger {...attrs}>
            <Select.Value placeholder="Select a type" />
          </Select.Trigger>
          <Select.Content>
            {#each leaseTypeEnum.enumValues as type}
              <Select.Item value={type} label={type} />
            {/each}
          </Select.Content>
        </Select.Root>
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="tenantIds">
      <Control let:attrs>
        <Label>Tenants</Label>
        <MultiSelect
          options={tenantOptions}
          bind:selected={$formData.tenantIds}
          placeholder="Select tenants"
          on:change={handleTenantChange}
          multiSelect={$formData.leaseType !== 'BEDSPACER'}
          {...attrs}
        />
      </Control>
      <Description>Select one or more tenants for this lease.</Description>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="locationId">
      <Control let:attrs>
        <Label>Location</Label>
        <Select.Root
          selected={locationSelected}
          onSelectedChange={(s) => {
            if (s) $formData.locationId = s.value;
          }}
        >
          <Select.Trigger {...attrs}>
            <Select.Value placeholder="Select a location" />
          </Select.Trigger>
          <Select.Content>
            {#each data.locations as location}
              <Select.Item value={location.id} label={location.locationName} />
            {/each}
          </Select.Content>
        </Select.Root>
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="leaseStatus">
      <Control let:attrs>
        <Label>Lease Status</Label>
        <Select.Root
          selected={leaseStatusSelected}
          onSelectedChange={(s) => {
            if (s) $formData.leaseStatus = s.value;
          }}
        >
          <Select.Trigger {...attrs}>
            <Select.Value placeholder="Select a status" />
          </Select.Trigger>
          <Select.Content>
            {#each leaseStatusEnum.enumValues as status}
              <Select.Item value={status} label={status} />
            {/each}
          </Select.Content>
        </Select.Root>
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

   

    <Field {form} name="leaseStartDate">
      <Control let:attrs>
        <Label>Lease Start Date</Label>
        <Input type="date" {...attrs} bind:value={$formData.leaseStartDate} />
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="leaseTermsMonth">
      <Control let:attrs>
        <Label>Lease Terms (Months)</Label>
        <Input type="number" {...attrs} bind:value={$formData.leaseTermsMonth}  max="60" />
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="leaseEndDate">
      <Control let:attrs>
        <Label>Lease End Date</Label>
        <Input type="date" {...attrs} bind:value={$formData.leaseEndDate} readonly />
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="leaseTerminateDate">
      <Control let:attrs>
        <Label>Lease Terminate Date (Optional)</Label>
        <Input 
          type="date" 
          {...attrs} 
          bind:value={$formData.leaseTerminateDate} 
          on:change={(e) => {
            if (e.currentTarget.value === '') {
              $formData.leaseTerminateDate = null;
            }
          }}
        />
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>
    <Field {form} name="leaseSecurityDeposit">
      <Control let:attrs>
        <Label>Security Deposit</Label>
        <Input type="number" {...attrs} bind:value={$formData.leaseSecurityDeposit} min="0" step="0.01" />
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="leaseRentRate">
      <Control let:attrs>
        <Label>Rent Rate</Label>
        <Input type="number" {...attrs} bind:value={$formData.leaseRentRate} min="0" step="0.01" />
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <Field {form} name="leaseNotes">
      <Control let:attrs>
        <Label>Notes</Label>
        <Textarea {...attrs} bind:value={$formData.leaseNotes} />
      </Control>
      <FieldErrors class="text-red-500 text-sm mt-1" />
    </Field>

    <div class="bg-yellow-100 p-4 rounded mt-4">
      <h3 class="font-bold">Proration Information</h3>
      <p>Days prorated: {proratedDays}</p>
    </div>

    <Button type="submit" class="mt-4">{$formData.id ? 'Update' : 'Create'} Lease</Button>
    {#if $formData.id}
      <Button type="button" class="mt-4 ml-2" on:click={() => reset()}>Cancel Edit</Button>
    {/if}
  </form>
</div>
</div>

{#if browser}
  <SuperDebug data={$formData} />
{/if}