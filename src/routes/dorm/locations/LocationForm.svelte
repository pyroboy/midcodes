<!-- src/routes/locations/LocationForm.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { createInsertSchema } from 'drizzle-zod';
  import { locations } from '$lib/db/schema';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import RandomLocation from './RandomLocation.svelte';
	import { sub } from 'date-fns';


  export let data: any;
  export let editMode = false;
  export let currentLocation: any = undefined;

  const dispatch = createEventDispatcher();

  const locationSchema = createInsertSchema(locations);

  const { form, errors, enhance, submitting,reset,submit } = superForm(data, {
    id: 'locationForm',
    validators: zodClient(locationSchema),
    applyAction: true,
    resetForm: true,
    taintedMessage: null,
    onUpdated: ({ form }) => {
      // You can add any logic here that should run when the form is updated
    },
    onSubmit: ({ formData, cancel }) => {
      console.log('Form data before submit:', $form);
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
 
        dispatch('locationAdded');
      }
    },
  });

  $: {
    if (currentLocation && editMode) {
      form.set(currentLocation);
      locationStatusSelected = { value: currentLocation.locationStatus, label: currentLocation.locationStatus };
    }
  }

  $: locationStatusSelected = $form.locationStatus 
    ? { value: $form.locationStatus, label: $form.locationStatus }
    : { value: '', label: 'Select a status' };

  const locationStatuses = ['VACANT', 'OCCUPIED', 'FULL_OCCUPANCY', 'RESERVED'];

  

function handleRandomData(event: CustomEvent) {
  const randomData = event.detail;
  form.set(randomData);
  
  // i dont konw why but this is needed to make the form submit
  setTimeout(() => {
    submit();
  }, 1); 
}

  function handleSubmit() {
    submit();  // This will submit the form programmatically
  }
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:enhance
  on:submit|preventDefault={handleSubmit}
  class="space-y-4 mb-8"
>
  {#if editMode && $form.id}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Location Form</h1>
    <RandomLocation on:randomData={handleRandomData} />
  </div>

  <div>
    <Label for="locationName">Location Name</Label>
    <Input id="locationName" name="locationName" bind:value={$form.locationName} />
    {#if $errors.locationName}<span class="text-red-500">{$errors.locationName}</span>{/if}
  </div>

  <div>
    <Label for="locationFloorLevel">Floor Level</Label>
    <Input type="number" id="locationFloorLevel" name="locationFloorLevel" bind:value={$form.locationFloorLevel} />
    {#if $errors.locationFloorLevel}<span class="text-red-500">{$errors.locationFloorLevel}</span>{/if}
  </div>

  <div>
    <Label for="locationCapacity">Capacity</Label>
    <Input type="number" id="locationCapacity" name="locationCapacity" bind:value={$form.locationCapacity} />
    {#if $errors.locationCapacity}<span class="text-red-500">{$errors.locationCapacity}</span>{/if}
  </div>

  <div>
    <Label for="locationRentRate">Rent Rate</Label>
    <Input type="number" id="locationRentRate" name="locationRentRate" bind:value={$form.locationRentRate} />
    {#if $errors.locationRentRate}<span class="text-red-500">{$errors.locationRentRate}</span>{/if}
  </div>

  <div>
    <Label for="locationStatus">Status</Label>
    <Select.Root    
      selected={locationStatusSelected}
      onSelectedChange={(s) => {
        if (s) {
          $form.locationStatus = s.value;
          locationStatusSelected = { value: s.value, label: s.value };
        }
      }}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a status" />
      </Select.Trigger>
      <Select.Content>
        {#each locationStatuses as status}
          <Select.Item value={status} label={status} />
        {/each}
      </Select.Content>
    </Select.Root>
    <input type="hidden" name="locationStatus" bind:value={$form.locationStatus} />
    {#if $errors.locationStatus}<span class="text-red-500">{$errors.locationStatus}</span>{/if}
  </div>

  <div class="flex justify-end space-x-2">
    <Button type="submit" disabled={$submitting} class="border-2 border-green-300 rounded-full text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white">
      {$submitting ? 'Submitting...' : (editMode ? 'Update' : 'Add') + ' Location'}
    </Button>
    {#if editMode}
      <Button type="button" on:click={() => {
        editMode = false;
        reset();
      }} class="border-2 border-red-300 rounded-full text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white">
        Cancel
      </Button>
    {/if}
  </div>

  {#if Object.keys($errors).length > 0}
    <div class="error-message">
      Please correct the following errors:
      <ul>
        {#each Object.entries($errors) as [field, error]}
          <li>{field}: {error}</li>
        {/each}
      </ul>
    </div>
  {/if}
</form>

<style>
  .error-message {
    color: red;
    font-weight: bold;
    margin-top: 0.25rem;
  }
</style>