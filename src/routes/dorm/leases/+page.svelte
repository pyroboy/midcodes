<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zod } from 'sveltekit-superforms/adapters';
  import type { PageData } from './$types';
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import * as Dialog from "$lib/components/ui/dialog";
  import { toast } from "svelte-french-toast";
  import type { z } from 'zod';
  import { leaseSchema } from './formSchema';

  type FormType = z.infer<typeof leaseSchema>;

  interface Tenant {
    id: string;
    tenantName: string;
    email: string | null;
    contactNumber: string | null;
  }

  interface Location {
    id: string;
    locationName: string;
    property: {
      id: string;
      propertyName: string;
    };
  }

  export let data: PageData;
  
  let showForm = false;
  let editMode = false;
  let selectedLease: FormType | null = null;
  let showDeleteConfirm = false;

  const { form, errors, enhance, reset, delayed } = superForm(data.form ?? {
    id: '',
    tenantIds: [],
    locationId: '',
    leaseStatus: 'ACTIVE',
    leaseType: 'MONTHLY',
    leaseStartDate: '',
    leaseEndDate: '',
    leaseTermsMonth: 1,
    leaseSecurityDeposit: 0,
    leaseRentRate: 0,
    leaseNotes: ''
  }, {
    validators: zod(leaseSchema),
    resetForm: true,
    onUpdated: ({ form }) => {
      if ('success' in form.data && form.data.success) {
        toast.success('Lease saved successfully');
        showForm = false;
        editMode = false;
        reset();
      }
    }
  });

  function handleEdit(lease: FormType) {
    editMode = true;
    showForm = true;
    selectedLease = lease;
    $form = {
      id: lease.id,
      tenantIds: lease.tenantIds,
      locationId: lease.locationId,
      leaseStatus: lease.leaseStatus,
      leaseType: lease.leaseType,
      leaseStartDate: lease.leaseStartDate,
      leaseEndDate: lease.leaseEndDate,
      leaseTermsMonth: lease.leaseTermsMonth,
      leaseSecurityDeposit: lease.leaseSecurityDeposit,
      leaseRentRate: lease.leaseRentRate,
      leaseNotes: lease.leaseNotes || ''
    };
  }

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      reset();
      editMode = false;
    }
  }

  function getTenantName(id: string) {
    return data.tenants?.find((t: Tenant) => t.id === id)?.tenantName;
  }

  $: canEditLease = data.isAdminLevel || data.isAccountant;
  
  $: selectedTenants = ($form.tenantIds as string[])
    .map((id: string) => data.tenants?.find((t: Tenant) => t.id === id))
    .filter((t): t is Tenant => t !== undefined);

  $: selectedLocation = data.locations?.find((l: Location) => l.id === $form.locationId);

  $: {
    if ($form.leaseStartDate && $form.leaseTermsMonth) {
      const startDate = new Date($form.leaseStartDate as string);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + Number($form.leaseTermsMonth));
      $form.leaseEndDate = endDate.toISOString().split('T')[0];
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
</script>

<div class="container mx-auto p-4 flex">
  <!-- Left side: List -->
  <div class="w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Leases</h1>
      {#if canEditLease}
        <Button on:click={toggleForm}>
          {showForm ? 'Hide Form' : 'Add Lease'}
        </Button>
      {/if}
    </div>

    <div class="rounded-md border">
      <div class="grid grid-cols-5 gap-4 p-4 font-medium border-b bg-muted/50">
        <div>Location</div>
        <div>Tenant(s)</div>
        <div>Type</div>
        <div>Duration</div>
        <div>Amount</div>
      </div>

      {#if data.leases && data.leases.length > 0}
        {#each data.leases as lease (lease.id)}
          <button 
            class="grid grid-cols-5 gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0"
            on:click={() => handleEdit(lease)}
          >
            <div>
              {lease.location?.locationName}
              <span class={`badge ${getStatusBadgeVariant(lease.leaseStatus)}`}>
                {lease.leaseStatus}
              </span>
            </div>
            <div>
              {#each lease.tenantIds as id}
                {getTenantName(id)}
                {#if lease.tenantIds.indexOf(id) !== lease.tenantIds.length - 1}, {/if}
              {/each}
            </div>
            <div>{lease.leaseType}</div>
            <div class="text-sm">
              {formatDate(lease.leaseStartDate)} - {formatDate(lease.leaseEndDate)}
              <br>
              {lease.leaseTermsMonth} months
            </div>
            <div>
              <div>₱{lease.leaseRentRate}/mo</div>
              <div class="text-sm text-muted-foreground">
                Deposit: ₱{lease.leaseSecurityDeposit}
              </div>
            </div>
          </button>
        {/each}
      {:else}
        <div class="p-4 text-center text-muted-foreground">
          No leases found
        </div>
      {/if}
    </div>
  </div>

  <!-- Right side: Form -->
  <div class="w-1/3 pl-4">
    {#if showForm}
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">{editMode ? 'Edit' : 'Add'} Lease</h1>
        <Button variant="outline" on:click={toggleForm}>Cancel</Button>
      </div>

      <form 
        method="POST" 
        action={editMode ? "?/update" : "?/create"} 
        use:enhance
        class="space-y-4"
      >
        {#if editMode}
          <input type="hidden" name="id" bind:value={$form.id} />
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
                  {location.locationName} - {location.property.propertyName}
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
                on:click={() => showDeleteConfirm = true}
              >
                Delete
              </Button>
            {/if}
            <Button type="submit" variant="default">
              {editMode ? 'Update' : 'Create'} Lease
            </Button>
          </div>
        </div>
      </form>
    {/if}
  </div>
</div>

<Dialog.Root bind:open={showDeleteConfirm}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Lease</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this lease? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex justify-end space-x-2">
      <Button variant="outline" on:click={() => showDeleteConfirm = false}>
        Cancel
      </Button>
      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={$form.id} />
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </div>
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