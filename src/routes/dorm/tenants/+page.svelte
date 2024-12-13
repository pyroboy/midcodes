<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { browser } from '$app/environment';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import type { PageData } from './$types';
  import RandomTenant from './RandomTenant.svelte';
  import TenantList from './TenantList.svelte';

  export let data: PageData;

  const schema = z.object({
    id: z.number().optional(),
    tenantName: z.string().min(1, 'Name is required'),
    tenantContactNumber: z.string().optional(),
    mainleaseId: z.number().int().positive().optional(),
  });

  const { form, errors, enhance, reset, submit } = superForm(data.form, {
    validators: zodClient(schema),
    dataType: 'json',
    resetForm: true,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        reset();
        editMode = false;
      }
    },
  });

  let editMode = false;
  let showForm = true;

  function handleDeleteSuccess() {
  if (editMode) {
    reset();
  }
  editMode = false;
}



  function handleRandomSubmit(event: CustomEvent) {
    const randomData = event.detail;
    form.set(randomData);
    submit();
  }

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      cancelEdit();
    }
  }

  function editTenant(tenant: any) {
    editMode = true;
    form.set({
      id: tenant.id,
      tenantName: tenant.tenantName,
      tenantContactNumber: tenant.tenantContactNumber,
      mainleaseId: tenant.mainleaseId,
    });
    showForm = true;
  }

  function cancelEdit() {
    editMode = false;
    reset();
  }

  $: mainLeaseSelected = $form.mainleaseId
    ? { value: $form.mainleaseId, label: data.leases.find(l => l.id === $form.mainleaseId)?.leaseName ?? 'Select a lease' }
    : undefined;
</script>

<div class="container mx-auto p-4 flex">
  <TenantList 
    tenants={data.tenants} 
    leases={data.leases} 
    on:edit={event => editTenant(event.detail)}
    on:deleteSuccess={handleDeleteSuccess}
  />

  <!-- Tenant Form (Right Side) -->
  <div class="w-1/3 pl-4">
    {#if showForm}
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Tenant Form</h1>
        <RandomTenant on:submitRandom={handleRandomSubmit} />
      </div>
      <form method="POST" action={editMode ? "?/update" : "?/create"} use:enhance class="space-y-4 mb-8">
        {#if editMode}
          <input type="hidden" name="id" bind:value={$form.id} />
        {/if}

        <div>
          <Label for="tenantName">Name</Label>
          <Input id="tenantName" name="tenantName" bind:value={$form.tenantName} />
          {#if $errors.tenantName}<span class="text-red-500">{$errors.tenantName}</span>{/if}
        </div>

        <div>
          <Label for="tenantContactNumber">Contact Number</Label>
          <Input id="tenantContactNumber" name="tenantContactNumber" bind:value={$form.tenantContactNumber} />
          {#if $errors.tenantContactNumber}<span class="text-red-500">{$errors.tenantContactNumber}</span>{/if}
        </div>

        <div>
          <Label for="mainleaseId">Main Lease</Label>
          <Select.Root    
            selected={mainLeaseSelected}
            onSelectedChange={(s) => {
              if (s) $form.mainleaseId = s.value;
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select a main lease" />
            </Select.Trigger>
            <Select.Content>
              {#each data.leases as lease}
                <Select.Item value={lease.id}>{lease.leaseName}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.mainleaseId}<span class="text-red-500">{$errors.mainleaseId}</span>{/if}
        </div>

        {#if $errors}<span class="text-red-500">{JSON.stringify($errors)}</span>{/if}
        
        <div class="flex justify-end space-x-2">
          {#if editMode}
          <Button 
            type="submit"
            class="border-2 border-yellow-300 rounded-full text-[10px] font-bold bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Update Tenant
          </Button>
          <Button 
            type="button" 
            on:click={cancelEdit}
            class="border-2 border-red-300 rounded-full text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white"
          >
            Cancel
          </Button>
        {:else}
          <Button 
            type="submit"
            class="border-2 border-green-300 rounded-full text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white"
          >
            Add Tenant
          </Button>
        {/if}
        </div>
      </form>
    {:else}
      <p class="text-center text-gray-500 mt-8">Click "Add Tenant" to create a new entry</p>
    {/if}
  </div>
</div>

<!-- Sticky Add Button -->
<div class="fixed bottom-4 right-4">
  <Button on:click={toggleForm} class="rounded-full w-16 h-16 flex items-center justify-center text-2xl">
    {showForm ? '×' : '+'}
  </Button>
</div>

{#if browser}
  <SuperDebug data={$form} />
{/if}