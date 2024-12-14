<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { PageData } from './$types';
  import FloorForm from './FloorForm.svelte';

  export let data: PageData;
  let formData: any;
  let editMode = false;
  let showForm = true;
  let currentFloor: any | undefined;

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      currentFloor = undefined;
      editMode = false;
    }
  }

  function editFloor(floor: any) {
    editMode = true;
    currentFloor = floor;
    showForm = true;
  }

  function handleFloorAdded() {
    currentFloor = undefined;
    editMode = false;
  }
</script>

<div class="container mx-auto p-4 flex">
  <div class="w-2/3 pr-4">
    <h2 class="text-xl font-bold mb-2">Floor List</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr>
            <th class="px-4 py-2">Property</th>
            <th class="px-4 py-2">Floor Name</th>
            <th class="px-4 py-2">Floor Number</th>
            <th class="px-4 py-2">Status</th>
            <th class="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.floors as floor}
            <tr>
              <td class="border px-4 py-2">{floor.propertyName}</td>
              <td class="border px-4 py-2">{floor.name}</td>
              <td class="border px-4 py-2">{floor.floorNumber}</td>
              <td class="border px-4 py-2">{floor.status}</td>
              <td class="border px-4 py-2">
                <Button variant="outline" size="sm" on:click={() => editFloor(floor)}>Edit</Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="w-1/3">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">{editMode ? 'Edit Floor' : 'Add Floor'}</h2>
      <Button variant="outline" size="sm" on:click={toggleForm}>
        {showForm ? 'Hide Form' : 'Show Form'}
      </Button>
    </div>

    {#if showForm}
      <FloorForm
        data={data.form}
        properties={data.properties}
        {editMode}
        floor={currentFloor}
        on:floorAdded={handleFloorAdded}
      />
    {/if}
  </div>
</div>
