<script lang="ts">
  import { browser } from '$app/environment';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Button } from "$lib/components/ui/button";
  import type { PageData } from './$types';
  import { locations } from '$lib/db/schema';
  import type { InferSelectModel } from 'drizzle-orm';
  import LocationForm from './LocationForm.svelte';
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';

  export let data: PageData;

  let editMode = false;
  let showForm = true;
  let currentLocation: InferSelectModel<typeof locations> | undefined;

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      editMode = false;
      currentLocation = undefined;
    }
  }

  function editLocation(location: InferSelectModel<typeof locations>) {
    editMode = true;
    currentLocation = location;
    showForm = true;
    data.locationForm.data = {
      id: location.id,
      locationName: location.locationName,
      locationFloorLevel: location.locationFloorLevel,
      locationCapacity: location.locationCapacity,
      locationStatus: location.locationStatus,
      locationRentRate: location.locationRentRate,
      locationActiveLease: location.locationActiveLease,
      createdBy: location.createdBy,
      updatedBy: location.updatedBy,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt
    };
  }

  function deleteLocation(id: number) {
    if (confirm('Are you sure you want to delete this location?')) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '?/delete';
      const idInput = document.createElement('input');
      idInput.type = 'hidden';
      idInput.name = 'id';
      idInput.value = id.toString();
      form.appendChild(idInput);
      document.body.appendChild(form);
      form.submit();
    }
  }
</script>

<SvelteToast />

<div class="container mx-auto p-4 flex">
  <div class="w-2/3 pr-4">
    <h2 class="text-xl font-bold mb-2">Location List</h2>
    <ul class="space-y-2">
      {#each data.countLocations as location}
        <li class="bg-gray-100 p-4 rounded shadow-md">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold">{location.locationName}</span>
            <span class="text-sm text-gray-600">Rent Rate: {location.locationRentRate}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <span>Floor: {location.locationFloorLevel}</span>
            <span>Capacity: {location.locationCapacity}</span>
            <span>Status: {location.locationStatus}</span>
            <span>Tenants: {location.tenantCount}</span>
          </div>

          <div class="mt-2 space-x-2">
            <Button on:click={() => editLocation({
              ...location,
              locationActiveLease: null,
              createdBy: 0,
              updatedBy: null,
              createdAt: new Date(),
              updatedAt: null
            })}>Edit</Button>
            <Button on:click={() => deleteLocation(location.id)}>Delete</Button>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <div class="w-1/3 pl-4">
    {#if showForm}
      <LocationForm data={data.locationForm} {editMode} />
    {:else}
      <p class="text-center text-gray-500 mt-8">Click "Add Location" to create a new location</p>
    {/if}
  </div>
</div>

<div class="fixed bottom-4 right-4">
  <Button on:click={toggleForm} class="rounded-full w-16 h-16 flex items-center justify-center text-2xl">
    {showForm ? '×' : '+'}
  </Button>
</div>

{#if browser}
  <SuperDebug data={data.locationForm} />
{/if}