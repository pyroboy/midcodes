<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { zod } from 'sveltekit-superforms/adapters';
  import type { PageData } from './$types';
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { toast } from "svelte-french-toast";
  import type { z } from 'zod';
  import { leaseSchema } from './formSchema';
  import LeaseForm from './LeaseForm.svelte';

  type FormType = z.infer<typeof leaseSchema>;

  interface Tenant {
    id: number;
    name: string;
    email: string | null;
    contact_number: string | null;
  }

  export let data: PageData;
  
  let showForm = false;
  let editMode = false;
  let selectedLease: FormType | undefined = undefined;
  let showDeleteConfirm = false;

  const { form, errors, enhance, reset, delayed, constraints, submitting } = superForm(data.form ?? {
    id: undefined,
    tenantIds: [],
    rental_unit_id: undefined,
    name: '',
    status: 'ACTIVE',
    type: 'MONTHLY',
    start_date: '',
    end_date: '',
    terms_month: 1,
    security_deposit: 0,
    rent_amount: 0,
    notes: '',
    balance: 0
  }, {
    validators: zod(leaseSchema),
    resetForm: true,
    taintedMessage: null,
    onUpdated: ({ form }) => {
      if (!form.valid) {
        // Access error messages from the result
        const formData = form.data as Record<string, any>;
        const errorMessage = formData.error?.message || 'Failed to save lease';
        toast.error(errorMessage);
        return;
      }
      if ('success' in form.data && form.data.success) {
        toast.success('Lease saved successfully');
        showForm = false;
        editMode = false;
        reset();
      }
    },
    onSubmit: () => {
      console.log('Form submitted with values:', $form);
    },
    onError: ({ result }) => {
      console.error('Form submission error:', result.error);
      const errorMessage = result.error?.message || 'An error occurred';
      toast.error(errorMessage);
    }
  });

  function handleEdit(lease: FormType) {
    editMode = true;
    showForm = true;
    selectedLease = lease;
    $form = {
      id: lease.id,
      tenantIds: lease.tenantIds,
      rental_unit_id: lease.rental_unit_id,
      name: lease.name,
      status: lease.status,
      type: lease.type,
      start_date: lease.start_date,
      end_date: lease.end_date,
      terms_month: lease.terms_month,
      security_deposit: lease.security_deposit,
      rent_amount: lease.rent_amount,
      notes: lease.notes || '',
      balance: lease.balance
    };
  }

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      reset();
      editMode = false;
    }
  }

  function getTenantName(id: number) {
    return data.tenants?.find((t: Tenant) => t.id === id)?.name;
  }

  function handleCancel() {
    showForm = false;
    editMode = false;
    reset();
  }

  function handleDelete() {
    showDeleteConfirm = true;
  }

  $: canEditLease = data.isAdminLevel || data.isAccountant;

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
              {lease.rental_unit?.name}
              <span class={`badge ${getStatusBadgeVariant(lease.status)}`}>
                {lease.status}
              </span>
            </div>
            <div>
              {#each lease.tenantIds as id}
                {getTenantName(id)}
                {#if lease.tenantIds.indexOf(id) !== lease.tenantIds.length - 1}, {/if}
              {/each}
            </div>
            <div>{lease.type}</div>
            <div class="text-sm">
              {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
              <br>
              {lease.terms_month} months
            </div>
            <div>
              <div>₱{lease.rent_amount}/mo</div>
              <div class="text-sm text-muted-foreground">
                Deposit: ₱{lease.security_deposit}
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
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">{editMode ? 'Edit' : 'Add'} Lease</h1>
    </div>

    <LeaseForm
      {data}
      {editMode}
      {form}
      {errors}
      {enhance}
      {constraints}
      {submitting}
      entity={selectedLease}
      on:cancel={handleCancel}
      on:delete={handleDelete}
    />
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

<SuperDebug data={$form} />
