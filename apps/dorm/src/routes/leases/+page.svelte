<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { browser } from "$app/environment";
  import { invalidate } from '$app/navigation';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import LeaseForm from './LeaseForm.svelte';
  import LeaseList from './LeaseList.svelte';
  import type { PageData } from './$types';
  import { leaseSchema } from './formSchema';
  import type { z } from 'zod';

  interface Props {
    data: PageData;
  }

  type FormType = z.infer<typeof leaseSchema>;
  
  let { data }: Props = $props();
  let leases = $state(data.leases);
  let editMode = $state(false);
  let selectedLease: FormType | undefined = $state();

  $effect(() => {
    leases = structuredClone(data.leases);
  });

  const { form, enhance, errors, constraints, submitting, reset } = superForm(data.form, {
    id: 'lease-form',
    validators: zodClient(leaseSchema),
    validationMethod: 'oninput',
    dataType: 'json',
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error('Form submission error:', {
        error: result.error,
        status: result.status
      });
      if (result.error) {
        console.error('Server error:', result.error.message);
      }
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        editMode = false;
        selectedLease = undefined;
        await invalidate('app:leases');
        reset();
      }
    }
  });

  function handleEdit(lease: FormType) {
    editMode = true;
    selectedLease = lease;
    $form = { ...lease };
  }

  async function handleDeleteLease(lease: FormType) {
    if (!confirm(`Are you sure you want to delete lease ${lease.name}?`)) return;

    const formData = new FormData();
    formData.append('id', String(lease.id));
    
    try {
      const result = await fetch('?/delete', {
        method: 'POST',
        body: formData
      });
      const response = await result.json();

      if (result.ok) {
        leases = leases.filter(l => l.id !== lease.id);
        editMode = false;
        selectedLease = undefined;
        await Promise.all([
          invalidate('app:leases'),
          invalidate(url => url.pathname.includes('/leases'))
        ]);
      } else {
        console.error('Delete failed:', response);
        alert(response.message || 'Failed to delete lease');
      }
    } catch (error) {
      console.error('Error deleting lease:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleCancel() {
    selectedLease = undefined;
    editMode = false;
    reset();
  }
</script>

<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
  <div class="w-full lg:w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Leases</h1>
    </div>
    <LeaseList
      {leases}
      on:edit={event => handleEdit(event.detail)}
      on:delete={event => handleDeleteLease(event.detail)}
    />
  </div>

  <div class="w-full lg:w-1/3">
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
      on:cancel={handleCancel}
    />
  </div>
</div>

{#if browser}
  <SuperDebug data={form} />
{/if}