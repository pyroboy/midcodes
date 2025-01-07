<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { PageData } from './$types';
  import PropertyForm from './PropertyForm.svelte';
  import * as Card from '$lib/components/ui/card';
  import { formatDateTime } from '$lib/utils';

  export let data: PageData;
  let showForm = false;
  let editMode = false;
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
    showForm = false;
    currentProperty = undefined;
    editMode = false;
  }

  function deleteProperty(property: any) {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    
    const form = new FormData();
    form.append('id', property.id.toString());
    
    fetch('?/delete', {
      method: 'POST',
      body: form
    }).then(() => {
      // Refresh the page to update the list
      window.location.reload();
    });
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Properties</h1>
    <Button on:click={toggleForm}>
      {showForm ? 'Hide Form' : 'Add Property'}
    </Button>
  </div>

  {#if showForm}
    <Card.Root class="mb-4">
      <Card.Header>
        <Card.Title>{editMode ? 'Edit' : 'Add'} Property</Card.Title>
      </Card.Header>
      <Card.Content>
        <PropertyForm
          {data}
          {editMode}
          property={currentProperty}
          on:propertyAdded={handlePropertyAdded}
        />
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each data.properties as property}
      <Card.Root>
        <Card.Header>
          <Card.Title>{property.name}</Card.Title>
          <Card.Description>{property.address}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-semibold">Type:</span>
              <span>{property.type}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Status:</span>
              <span class="capitalize">{property.status.toLowerCase()}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Floors:</span>
              <span>{property.floor_count}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Rental_Units:</span>
              <span>{property.rental_unit_count}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Created:</span>
              <span>{formatDateTime(property.created_at)}</span>
            </div>
            {#if property.updated_at}
              <div class="flex justify-between">
                <span class="font-semibold">Updated:</span>
                <span>{formatDateTime(property.updated_at)}</span>
              </div>
            {/if}
          </div>
        </Card.Content>
        <Card.Footer class="flex justify-end space-x-2">
          <Button variant="outline" on:click={() => editProperty(property)}>
            Edit
          </Button>
          <Button 
            variant="destructive" 
            on:click={() => deleteProperty(property)}
            disabled={property.floor_count > 0 || property.rental_unit_count > 0}
          >
            Delete
          </Button>
        </Card.Footer>
      </Card.Root>
    {/each}
  </div>
</div>
