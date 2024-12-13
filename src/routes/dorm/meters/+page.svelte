<script lang="ts">
  import { browser } from '$app/environment';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { PageData } from './$types';
  import MeterForm from './MeterForm.svelte';

  export let data: PageData;
  let formData: any;

  interface MeterWithReadings {
    id: number;
    locationId: number | null;
    meterType: string;
    meterActive: boolean;
    meterName: string;
    meterFloorLevel: number;
    createdAt: Date | null;
    updatedAt: Date | null;
    readingsCount: number;
    latestReading: number | null;
  }

  let currentMeter: MeterWithReadings | undefined;
  let editMode = false;
  let showForm = true;

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      editMode = false;
      currentMeter = undefined;
    }
  }

  function editMeter(meter: MeterWithReadings) {
    console.log('editMeter', meter);
    editMode = true;
    currentMeter = meter;
    showForm = true;
  }

  function deleteMeter(id: number) {
    if (confirm('Are you sure you want to delete this meter?')) {
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

<div class="container mx-auto p-4 flex">
  <div class="w-2/3 pr-4">
    <h2 class="text-xl font-bold mb-2">Meter List</h2>
    <ul class="space-y-2">
      {#each data.meters as meter}
        <li class="bg-gray-100 p-4 rounded shadow-md">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold">{meter.meterType} Meter</span>
            <span class="text-sm text-gray-600">Name: {meter.meterName}</span>
            <span class="text-sm text-gray-600">Floor: {meter.meterFloorLevel}</span>
            <span class="text-sm text-gray-600">Active?: {meter.meterActive}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <span>Location ID: {meter.locationId}</span>
            <span>Readings: {meter.readingsCount}</span>
            {#if meter.latestReading !== null}
              <span>Latest Reading: {meter.latestReading}</span>
            {/if}
          </div>

          <div class="mt-2 space-x-2">
            <Button on:click={() => editMeter(meter)}>Edit</Button>
            <Button on:click={() => deleteMeter(meter.id)}>Delete</Button>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <div class="w-1/3 pl-4">
    {#if showForm}
      <h1 class="text-2xl font-bold mb-4">Meter</h1>
      <MeterForm {data} {editMode} {currentMeter} bind:form={formData} on:meterAdded={toggleForm} />
    {:else}
      <p class="text-center text-gray-500 mt-8">Click "Add Meter" to create a new meter</p>
    {/if}
  </div>
</div>

<div class="fixed bottom-4 right-4">
  <Button on:click={toggleForm} class="rounded-full w-16 h-16 flex items-center justify-center text-2xl">
    {showForm ? '×' : '+'}
  </Button>
</div>

{#if browser && formData}
  <SuperDebug data={$formData} />
{/if}