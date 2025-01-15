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
  import LeaseList from './LeaseList.svelte';


  export let data: PageData;
  type FormType = z.infer<typeof leaseSchema>;



  
  let showForm = false;
  let editMode = false;
  let selectedLease: FormType | undefined = undefined;
  let showDeleteConfirm = false;

  const { form, errors, enhance, reset, delayed, constraints, submitting } = superForm(data.form, {
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
    onResult: ({ result }) => {
    console.log('Server response:', result);
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
      start_date: lease.start_date,
      end_date: lease.end_date,
      terms_month: lease.terms_month,
      security_deposit: lease.security_deposit,
      rent_amount: lease.rent_amount,
      notes: lease.notes || '',
      balance: lease.balance
    };
  }



  function handleCancel() {
    showForm = false;
    editMode = false;
    reset();
  }

  function handleDelete() {
    showDeleteConfirm = true;
  }

</script>

<div class="container mx-auto p-4 flex">
  <!-- Left side: List -->
  <div class="w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Leases</h1>
    </div>

    <LeaseList 
    leases={data.leases} 
    {data} 
  />
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
