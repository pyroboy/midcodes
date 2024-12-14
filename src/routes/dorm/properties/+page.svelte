<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { PageData } from './$types';
  import PropertyForm from './PropertyForm.svelte';

  export let data: PageData;
  let formData: any;
  let editMode = false;
  let showForm = true;
  let currentProperty: any | undefined;

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      currentProperty = undefined;
      editMode = false;
    }
  }

  function editProperty(property: any) {
    editMode = true;
    currentProperty = property;
    showForm = true;
  }

  function handlePropertyAdded() {
    currentProperty = undefined;
    editMode = false;
  }
</script>

<div class="container mx-auto p-4 flex">
  <div class="w-2/3 pr-4">
    <h2 class="text-xl font-bold mb-2">Property List</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Address</th>
            <th class="px-4 py-2">Status</th>
            <th class="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.properties as property}
            <tr>
              <td class="border px-4 py-2">{property.name}</td>
              <td class="border px-4 py-2">{property.address}</td>
              <td class="border px-4 py-2">{property.status}</td>
              <td class="border px-4 py-2">
                <Button variant="outline" size="sm" on:click={() => editProperty(property)}>Edit</Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="w-1/3">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">{editMode ? 'Edit Property' : 'Add Property'}</h2>
      <Button variant="outline" size="sm" on:click={toggleForm}>
        {showForm ? 'Hide Form' : 'Show Form'}
      </Button>
    </div>

    {#if showForm}
      <PropertyForm
        data={data.form}
        {editMode}
        property={currentProperty}
        on:propertyAdded={handlePropertyAdded}
      />
    {/if}
  </div>
</div>
