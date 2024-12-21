<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zod } from 'sveltekit-superforms/adapters';
  import type { PageData } from './$types';
  import { browser } from "$app/environment";
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Textarea } from '$lib/components/ui/textarea';
  import { leaseSchema, leaseTypeEnum, leaseStatusEnum } from './formSchema';
  import type { z } from 'zod';

  interface Tenant {
    id: number;
    tenantName: string;
    email: string | null;
    contactNumber: string | null;
  }

  interface Location {
    id: number;
    locationName: string;
    locationFloorLevel: number;
    locationStatus: string;
  }

  interface LeaseTenant {
    tenant: Tenant;
  }

  interface Lease {
    id: number;
    tenantIds: number[];
    locationId: number;
    leaseStatus: keyof typeof leaseStatusEnum.Values;
    leaseType: keyof typeof leaseTypeEnum.Values;
    leaseStartDate: string;
    leaseEndDate: string;
    leaseTerminateDate: string | null;
    leaseTermsMonth: number;
    leaseSecurityDeposit: number;
    leaseRentRate: number;
    leaseNotes: string | null;
    createdBy: number | undefined;
    location?: Location;
    lease_tenants?: LeaseTenant[];
  }
  interface CustomKeyboardEvent {
  key: string;
}
  export let data: PageData & {
    form: z.infer<typeof leaseSchema>;
    leases: Lease[] | null;
    tenants: Tenant[] | null;
    locations: Location[] | null;
    isAdminLevel: boolean;
    isAccountant: boolean;
    isFrontdesk: boolean;
  };

  const { form, errors, enhance: formEnhance, reset } = superForm(data.form, {
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
  let showDeleteConfirm = false;

  function handleLeaseClick(lease: Lease) {
    if (!data.isAdminLevel && !data.isAccountant) return;
    
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
      leaseTerminateDate: lease.leaseTerminateDate || undefined,
      leaseTermsMonth: lease.leaseTermsMonth,
      leaseSecurityDeposit: lease.leaseSecurityDeposit,
      leaseRentRate: lease.leaseRentRate,
      leaseNotes: lease.leaseNotes || '',
      createdBy: lease.createdBy
    });
  }
  function handleCardKeydown(lease: Lease) {
  return (e: CustomEvent<CustomKeyboardEvent>) => {
    if (e.detail.key === 'Enter') {
      handleLeaseClick(lease);
    }
  };
}
  function resetForm() {
    editMode = false;
    selectedLease = null;
    reset();
  }

  function handleDelete() {
    showDeleteConfirm = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // Handle keyboard event
    }
  }

  function getStatusBadgeVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'TERMINATED':
        return 'destructive';
      case 'EXPIRED':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  $: canEditLease = data.isAdminLevel || data.isAccountant;
  
  $: selectedTenants = $form.tenantIds
    .map(id => data.tenants?.find(t => t.id === id))
    .filter((t): t is Tenant => t !== undefined);

  $: selectedLocation = data.locations?.find(l => l.id === $form.locationId);

  $: {
    if ($form.leaseStartDate && $form.leaseTermsMonth) {
      const startDate = new Date($form.leaseStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + $form.leaseTermsMonth);
      $form.leaseEndDate = endDate.toISOString().split('T')[0];
    }
  }
</script>

<div class="space-y-4">
  {#if !editMode}
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Leases</h1>
      {#if canEditLease}
        <Button on:click={() => editMode = true}>Add Lease</Button>
      {/if}
    </div>

    <div class="grid gap-4">
      {#each data.leases || [] as lease (lease.id)}
      <Card.Root 
      class="cursor-pointer hover:bg-gray-50" 
      on:click={() => handleLeaseClick(lease)}
      on:keydown={handleCardKeydown(lease)}
      tabindex={0}
      role="button"
    >
          <Card.Header>
            <Card.Title class="flex justify-between items-center">
              <span>
                {lease.location?.locationName}
                <Badge variant={getStatusBadgeVariant(lease.leaseStatus)}>
                  {lease.leaseStatus}
                </Badge>
              </span>
              <span class="text-sm font-normal">
                {formatDate(lease.leaseStartDate)} - {formatDate(lease.leaseEndDate)}
              </span>
            </Card.Title>
            <Card.Description>
              {#each lease.lease_tenants || [] as { tenant }}
                {tenant.tenantName}
                {#if lease.lease_tenants && lease.lease_tenants.indexOf({ tenant }) !== lease.lease_tenants.length - 1}, {/if}
              {/each}
            </Card.Description>
          </Card.Header>
          <Card.Content>
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
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else}
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">{selectedLease ? 'Edit' : 'Add'} Lease</h1>
      <Button variant="outline" on:click={resetForm}>Cancel</Button>
    </div>

    <form 
      method="POST" 
      action={selectedLease ? "?/update" : "?/create"} 
      use:formEnhance
      class="space-y-4"
    >
      {#if selectedLease}
        <input type="hidden" name="id" bind:value={selectedLease.id} />
      {/if}

      <div class="space-y-4">
        <div class="form-field">
          <Label for="tenantIds">Tenants</Label>
          <select 
            id="tenantIds"
            name="tenantIds" 
            bind:value={$form.tenantIds}
            multiple 
            class="w-full"
          >
            {#each data.tenants || [] as tenant}
              <option value={tenant.id}>{tenant.tenantName}</option>
            {/each}
          </select>
          {#if $errors.tenantIds}
            <p class="text-destructive text-sm mt-1">{$errors.tenantIds}</p>
          {/if}
        </div>

        <div class="form-field">
          <Label for="locationId">Location</Label>
          <select 
            id="locationId"
            name="locationId" 
            bind:value={$form.locationId}
            class="w-full"
          >
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

        <div class="form-field">
          <Label for="leaseType">Type</Label>
          <select 
            id="leaseType"
            name="leaseType" 
            bind:value={$form.leaseType}
            class="w-full"
          >
            <option value="">Select type</option>
            {#each Object.values(leaseTypeEnum.Values) as type}
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
          >
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
          <div class="form-field">
            <Label for="leaseStartDate">Start Date</Label>
            <Input
              type="date"
              id="leaseStartDate"
              name="leaseStartDate"
              bind:value={$form.leaseStartDate}
            />
            {#if $errors.leaseStartDate}
              <p class="text-destructive text-sm mt-1">{$errors.leaseStartDate}</p>
            {/if}
          </div>

          <div class="form-field">
            <Label for="leaseTermsMonth">Terms (months)</Label>
            <Input
              type="number"
              id="leaseTermsMonth"
              name="leaseTermsMonth"
              bind:value={$form.leaseTermsMonth}
              min="1"
              max="60"
            />
            {#if $errors.leaseTermsMonth}
              <p class="text-destructive text-sm mt-1">{$errors.leaseTermsMonth}</p>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-field">
            <Label for="leaseRentRate">Monthly Rent</Label>
            <Input
              type="number"
              id="leaseRentRate"
              name="leaseRentRate"
              bind:value={$form.leaseRentRate}
              min="0"
              step="0.01"
            />
            {#if $errors.leaseRentRate}
              <p class="text-destructive text-sm mt-1">{$errors.leaseRentRate}</p>
            {/if}
          </div>

          <div class="form-field">
            <Label for="leaseSecurityDeposit">Security Deposit</Label>
            <Input
              type="number"
              id="leaseSecurityDeposit"
              name="leaseSecurityDeposit"
              bind:value={$form.leaseSecurityDeposit}
              min="0"
              step="0.01"
            />
            {#if $errors.leaseSecurityDeposit}
              <p class="text-destructive text-sm mt-1">{$errors.leaseSecurityDeposit}</p>
            {/if}
          </div>
        </div>

        <div class="form-field">
          <Label for="leaseNotes">Notes</Label>
          <Textarea
            id="leaseNotes"
            name="leaseNotes"
            bind:value={$form.leaseNotes}
            rows={3}
          />
          {#if $errors.leaseNotes}
            <p class="text-destructive text-sm mt-1">{$errors.leaseNotes}</p>
          {/if}
        </div>

        <div class="flex justify-end space-x-2">
          {#if selectedLease && data.isAdminLevel}
          <Button
              type="button"
              variant="destructive"
              on:click={() => showDeleteConfirm = true}
            >
              Delete
            </Button>
          {/if}
          <Button type="submit" variant="default">
            {selectedLease ? 'Update' : 'Create'} Lease
          </Button>
        </div>
      </div>
    </form>
  {/if}
</div>

<Dialog.Root bind:open={showDeleteConfirm}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Confirm Delete</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this lease? This action cannot be undone.
        {#if selectedLease?.lease_tenants?.length}
          This will also remove the lease association for {selectedLease.lease_tenants.length} tenant(s).
        {/if}
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" action="?/delete" use:formEnhance>
      {#if selectedLease}
        <input type="hidden" name="id" bind:value={selectedLease.id} />
      {/if}
      <div class="flex justify-end space-x-2 mt-4">
        <Button 
          type="button" 
          variant="outline"
          on:click={() => showDeleteConfirm = false}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          variant="destructive"
          on:click={handleDelete}
        >
          Delete
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

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
</style>