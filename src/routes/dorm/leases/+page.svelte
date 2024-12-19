<script lang="ts">
  import { enhance } from '$app/forms';
  import { superForm } from 'sveltekit-superforms/client';
  import { zod } from 'sveltekit-superforms/adapters';
  import type { PageData } from './$types';
  import type { Infer } from "sveltekit-superforms";
  import { browser } from "$app/environment";
  import { Input } from '$lib/components/ui/input';
  import { leaseSchema, leaseTypeEnum, leaseStatusEnum } from './formSchema';
  import type { FormSchema } from './formSchema';
  import type { z } from 'zod';

  interface Tenant {
    id: number;
    tenantName: string;
    email: string;
    contactNumber: string;
  }

  interface Location {
    id: number;
    locationName: string;
    locationFloorLevel: number;
    locationStatus: string;
  }

  interface Lease {
    id: number;
    tenantIds: number[];
    locationId: number;
    leaseStatus: z.infer<typeof leaseStatusEnum>;
    leaseType: z.infer<typeof leaseTypeEnum>;
    leaseStartDate: string;
    leaseEndDate: string;
    leaseTerminateDate: string | null;
    leaseTermsMonth: number;
    leaseSecurityDeposit: number;
    leaseRentRate: number;
    leaseNotes: string | null;
    createdBy: number | null;
    location?: Location;
    lease_tenants?: Array<{ tenant: Tenant }>;
  }

  export let data: PageData & { 
    form: Infer<FormSchema>;
    leases: Lease[] | null;
    tenants: Tenant[] | null;
    locations: Location[] | null;
  };

  const { form, errors, enhance: formEnhance } = superForm(data.form, {
    validators: zod(leaseSchema),
    taintedMessage: null,
    resetForm: true,
    onSubmit: ({ formData, cancel }) => {
      const startDate = new Date(formData.get('leaseStartDate') as string);
      const endDate = new Date(formData.get('leaseEndDate') as string);

      if (endDate <= startDate) {
        alert('End date must be after start date');
        cancel();
      }
    }
  });

  let editMode = false;
  let selectedLease: Lease | null = null;

  function handleLeaseClick(lease: Lease) {
    editMode = true;
    selectedLease = lease;
    form.set({
      id: lease.id,
      tenantIds: lease.lease_tenants?.map(lt => lt.tenant.id) || [],
      locationId: lease.locationId,
      leaseStatus: lease.leaseStatus,
      leaseType: lease.leaseType,
      leaseStartDate: lease.leaseStartDate,
      leaseEndDate: lease.leaseEndDate,
      leaseTerminateDate: lease.leaseTerminateDate,
      leaseTermsMonth: lease.leaseTermsMonth,
      leaseSecurityDeposit: lease.leaseSecurityDeposit || 0,
      leaseRentRate: lease.leaseRentRate,
      leaseNotes: lease.leaseNotes || '',
      createdBy: lease.createdBy
    });
  }

  function handleLeaseAdded() {
    editMode = false;
    selectedLease = null;
  }

  function getStatusVariant(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'TERMINATED':
        return 'destructive';
      case 'EXPIRED':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  $: tenantOptions = (data.tenants || []).map(t => ({
    value: t.id,
    label: t.tenantName
  }));

  $: locationOptions = (data.locations || []).map(l => ({
    value: l.id,
    label: `${l.locationName} - Floor ${l.locationFloorLevel}`
  }));

  $: selectedTenants = $form.tenantIds.map(id => 
    data.tenants?.find(t => t.id === id)
  ).filter((t): t is Tenant => t !== undefined);

  $: selectedLocation = data.locations?.find(l => l.id === $form.locationId);

  $: proratedDays = $form.leaseStartDate
    ? new Date(new Date($form.leaseStartDate).getFullYear(), new Date($form.leaseStartDate).getMonth() + 1, 0).getDate() - new Date($form.leaseStartDate).getDate() + 1
    : 0;
</script>

<div class="space-y-4">
  {#if !editMode}
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Leases</h1>
      <button class="btn btn-primary" on:click={() => editMode = true}>Add Lease</button>
    </div>

    <div class="grid gap-4">
      {#each data.leases || [] as lease (lease.id)}
        <div 
          class="card cursor-pointer hover:bg-gray-50" 
          on:click={() => handleLeaseClick(lease)}
          on:keydown={(e) => e.key === 'Enter' && handleLeaseClick(lease)}
          tabindex="0"
          role="button"
        >
          <div class="card-header">
            <h3 class="card-title flex justify-between items-center">
              <span>
                {lease.location?.locationName}
                <span class="badge {getStatusVariant(lease.leaseStatus)}">
                  {lease.leaseStatus}
                </span>
              </span>
              <span class="text-sm font-normal">
                {formatDate(lease.leaseStartDate)} - {formatDate(lease.leaseEndDate)}
              </span>
            </h3>
            <p class="text-sm text-muted-foreground">
              {lease.lease_tenants?.map(lt => lt.tenant.tenantName).join(', ')}
            </p>
          </div>
          <div class="card-content">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <strong>Type:</strong> {lease.leaseType}
              </div>
              <div>
                <strong>Terms:</strong> {lease.leaseTermsMonth} months
              </div>
              <div>
                <strong>Rent Rate:</strong> {formatCurrency(lease.leaseRentRate)}
              </div>
              <div>
                <strong>Security Deposit:</strong> {formatCurrency(lease.leaseSecurityDeposit)}
              </div>
              {#if lease.leaseTerminateDate}
                <div class="col-span-2">
                  <strong>Terminated:</strong> {formatDate(lease.leaseTerminateDate)}
                </div>
              {/if}
              {#if lease.leaseNotes}
                <div class="col-span-2">
                  <strong>Notes:</strong> {lease.leaseNotes}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">{selectedLease ? 'Edit' : 'Add'} Lease</h1>
      <button class="btn btn-outline" on:click={() => {
        editMode = false;
        selectedLease = null;
      }}>
        Cancel
      </button>
    </div>

    <form method="POST" action={selectedLease ? "?/update" : "?/create"} use:formEnhance>
      {#if selectedLease}
        <input type="hidden" name="id" value={selectedLease.id} />
      {/if}

      <div class="space-y-4">
        <div>
          <label for="tenantIds">Tenants</label>
          <select name="tenantIds" multiple bind:value={$form.tenantIds}>
            {#each data.tenants || [] as tenant}
              <option value={tenant.id}>{tenant.tenantName}</option>
            {/each}
          </select>
          {#if $errors.tenantIds}
            <p class="text-destructive text-sm mt-1">{$errors.tenantIds}</p>
          {/if}
        </div>

        <div>
          <label for="locationId">Location</label>
          <select name="locationId" bind:value={$form.locationId}>
            <option value="">Select location</option>
            {#each data.locations || [] as location}
              <option value={location.id}>
                {location.locationName} - Floor {location.locationFloorLevel}
              </option>
            {/each}
          </select>
          {#if $errors.locationId}
            <p class="text-destructive text-sm mt-1">{$errors.locationId}</p>
          {/if}
        </div>

        <div>
          <label for="leaseType">Type</label>
          <select name="leaseType" bind:value={$form.leaseType}>
            <option value="">Select type</option>
            {#each Object.values(leaseTypeEnum.Values) as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
          {#if $errors.leaseType}
            <p class="text-destructive text-sm mt-1">{$errors.leaseType}</p>
          {/if}
        </div>

        <div>
          <label for="leaseStatus">Status</label>
          <select name="leaseStatus" bind:value={$form.leaseStatus}>
            <option value="">Select status</option>
            {#each Object.values(leaseStatusEnum.Values) as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
          {#if $errors.leaseStatus}
            <p class="text-destructive text-sm mt-1">{$errors.leaseStatus}</p>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="leaseStartDate">Start Date</label>
            <Input
              type="date"
              name="leaseStartDate"
              bind:value={$form.leaseStartDate}
            />
            {#if $errors.leaseStartDate}
              <p class="text-destructive text-sm mt-1">{$errors.leaseStartDate}</p>
            {/if}
          </div>

          <div>
            <label for="leaseEndDate">End Date</label>
            <Input
              type="date"
              name="leaseEndDate"
              bind:value={$form.leaseEndDate}
              readonly
            />
            {#if $errors.leaseEndDate}
              <p class="text-destructive text-sm mt-1">{$errors.leaseEndDate}</p>
            {/if}
          </div>
        </div>

        <div>
          <label for="leaseTermsMonth">Terms (months)</label>
          <Input
            type="number"
            name="leaseTermsMonth"
            bind:value={$form.leaseTermsMonth}
            min="1"
            max="60"
          />
          {#if $errors.leaseTermsMonth}
            <p class="text-destructive text-sm mt-1">{$errors.leaseTermsMonth}</p>
          {/if}
        </div>

        <div>
          <label for="leaseRentRate">Rent Rate</label>
          <Input
            type="number"
            name="leaseRentRate"
            bind:value={$form.leaseRentRate}
            min="0"
            step="0.01"
          />
          {#if $errors.leaseRentRate}
            <p class="text-destructive text-sm mt-1">{$errors.leaseRentRate}</p>
          {/if}
        </div>

        <div>
          <label for="leaseSecurityDeposit">Security Deposit</label>
          <Input
            type="number"
            name="leaseSecurityDeposit"
            bind:value={$form.leaseSecurityDeposit}
            min="0"
            step="0.01"
          />
          {#if $errors.leaseSecurityDeposit}
            <p class="text-destructive text-sm mt-1">{$errors.leaseSecurityDeposit}</p>
          {/if}
        </div>

        <div>
          <label for="leaseNotes">Notes</label>
          <textarea
            name="leaseNotes"
            bind:value={$form.leaseNotes}
            rows="3"
            class="w-full"
          ></textarea>
          {#if $errors.leaseNotes}
            <p class="text-destructive text-sm mt-1">{$errors.leaseNotes}</p>
          {/if}
        </div>

        <div class="flex justify-end space-x-2">
          {#if selectedLease}
            <button
              type="submit"
              formaction="?/delete"
              class="btn btn-destructive"
            >
              Delete
            </button>
          {/if}
          <button type="submit" class="btn btn-primary">
            {selectedLease ? 'Update' : 'Create'} Lease
          </button>
        </div>
      </div>
    </form>
  {/if}
</div>