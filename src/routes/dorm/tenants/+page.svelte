<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import type { PageData } from './$types';
  import TenantList from './TenantList.svelte';
  import { tenantSchema } from './schema';
  import { browser } from '$app/environment';

  export let data: PageData;

  const { form, errors, enhance, reset, submit } = superForm(data.form, {
    validators: zodClient(tenantSchema),
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
      name: tenant.name,
      contact_number: tenant.contact_number,
      email: tenant.email
    });
    showForm = true;
  }

  function cancelEdit() {
    editMode = false;
    reset();
  }
</script>

<div class="container mx-auto p-4 flex">
  <TenantList 
    tenants={data.tenants} 
    on:edit={event => editTenant(event.detail)}
    on:deleteSuccess={handleDeleteSuccess}
  />

  <!-- Tenant Form -->
  <div class="w-1/3 pl-4">
    {#if showForm}
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Tenant Form</h1>
      </div>
      <form method="POST" action={editMode ? "?/update" : "?/create"} use:enhance class="space-y-4 mb-8">
        {#if editMode}
          <input type="hidden" name="id" bind:value={$form.id} />
        {/if}

        <div class="space-y-2">
          <Label for="name">Name</Label>
          <div class:input-error={$errors.name}>
            <Input
              type="text"
              id="name"
              name="name"
              bind:value={$form.name}
            />
          </div>
          {#if $errors.name}
            <span class="text-red-500 text-sm">{$errors.name}</span>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="contact_number">Contact Number</Label>
          <Input
            type="text"
            id="contact_number"
            name="contact_number"
            bind:value={$form.contact_number}
          />
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <div class:input-error={$errors.email}>
            <Input
              type="email"
              id="email"
              name="email"
              bind:value={$form.email}
            />
          </div>
          {#if $errors.email}
            <span class="text-red-500 text-sm">{$errors.email}</span>
          {/if}
        </div>

        <div class="flex gap-2">
          <Button type="submit" variant="default">
            {editMode ? 'Update' : 'Add'} Tenant
          </Button>
          {#if editMode}
            <Button type="button" variant="destructive" on:click={cancelEdit}>
              Cancel
            </Button>
          {/if}
        </div>
      </form>
    {:else}
      <button class="w-full" on:click={toggleForm}>
        <Button variant="outline">
          Show Form
        </Button>
      </button>
    {/if}
  </div>
</div>

<!-- Sticky Add Button -->
<div class="fixed bottom-4 right-4">
  <button class="rounded-full w-16 h-16 flex items-center justify-center text-2xl" on:click={toggleForm}>
    <Button>
      {showForm ? '×' : '+'}
    </Button>
  </button>
</div>

{#if browser}
  <SuperDebug data={$form} />
{/if}