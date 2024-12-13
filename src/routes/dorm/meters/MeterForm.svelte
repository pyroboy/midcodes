<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import { toast } from '@zerodevx/svelte-toast';
  
  export { form };
  export let data: any;
  export let editMode = false;
  export let currentMeter: any = undefined;

  const dispatch = createEventDispatcher();

  const schema = z.object({
    locationId: z.coerce.number().int().optional(),
    meterType: z.enum(['ELECTRICITY', 'WATER', 'GAS']),
    meterName: z.string().min(1, 'Meter name is required'),
    meterFloorLevel: z.coerce.number().int().min(0, 'Meter floor level must be 0 or greater'),
    meterActive: z.coerce.boolean(),
  });

  const { form: formStore, errors, enhance, submit, reset } = superForm(data.form, {
    id: 'meterForm',
    validators: zodClient(schema),
    applyAction: true,
    resetForm: true,
    taintedMessage: null,
    onUpdated: ({ form }) => {
      // You can add any logic here that should run when the form is updated
    },
    onSubmit: ({ formData, cancel }) => {
      console.log('Form data before submit:', $formStore);
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
        toast.push(editMode ? 'Meter updated successfully' : 'Meter added successfully', {
          theme: {
            '--toastBackground': '#48BB78',
            '--toastColor': 'white',
          }
        });
        dispatch('meterAdded');
        reset();
      }
    },
  });

  $: {
    if (currentMeter && editMode) {
      const formData = {
        ...currentMeter,
      };

      formStore.set(formData);
      meterTypeSelected = { value: currentMeter.meterType, label: currentMeter.meterType };
      locationSelected = currentMeter.locationId 
        ? { value: currentMeter.locationId.toString(), label: getLocationString(currentMeter.locationId) }
        : { value: '', label: 'Select a location' };
    }
  }

  $: meterTypeSelected = $formStore?.meterType 
    ? { value: $formStore.meterType, label: $formStore.meterType }
    : { value: '', label: 'Select a meter type' };

  $: locationSelected = $formStore?.locationId
    ? { value: $formStore.locationId.toString(), label: getLocationString($formStore.locationId) }
    : { value: '', label: 'Select a location' };

  const meterTypes = ['ELECTRICITY', 'WATER', 'GAS'];

  function getLocationString(locationId: number): string {
    const location = data.locations.find((loc: any) => loc.id === locationId);
    return location ? `${location.locationName} - Floor ${location.locationFloorLevel}` : 'Unknown';
  }
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:enhance
  on:submit|preventDefault={submit}
  class="space-y-4 mb-8"
>
  {#if editMode && $formStore?.id}
    <input type="hidden" name="id" bind:value={$formStore.id} />
  {/if}
  <div>
    <Label for="meterName">Meter Name</Label>
    <Input id="meterName" name="meterName" bind:value={$formStore.meterName} />
    {#if $errors.meterName}<span class="text-red-500">{$errors.meterName}</span>{/if}
  </div>

  <div>
    <Label for="meterFloorLevel">Meter Floor Level</Label>
    <Input type="number" id="meterFloorLevel" name="meterFloorLevel" bind:value={$formStore.meterFloorLevel} />
    {#if $errors.meterFloorLevel}<span class="text-red-500">{$errors.meterFloorLevel}</span>{/if}
  </div>

  <div>
    <Label for="locationId">Location</Label>
    <Select.Root
      selected={locationSelected}
      onSelectedChange={(s) => {
        if (s) {
          $formStore.locationId = parseInt(s.value);
          locationSelected = { value: s.value, label: s.label || 'Select a location' };
        } else {
          $formStore.locationId = undefined;
          locationSelected = { value: '', label: 'Select a location' };
        }
      }}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a location" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="" label="No location" />
        {#each data.locations as location}
          <Select.Item 
            value={location.id.toString()} 
            label={`${location.locationName} - Floor ${location.locationFloorLevel}`} 
          />
        {/each}
      </Select.Content>
    </Select.Root>
    <input type="hidden" name="locationId" bind:value={$formStore.locationId} />
    {#if $errors.locationId}<span class="text-red-500">{$errors.locationId}</span>{/if}
  </div>

  <div>
    <Label for="meterType">Meter Type</Label>
    <Select.Root    
      selected={meterTypeSelected}
      onSelectedChange={(s) => {
        if (s) {
          $formStore.meterType = s.value;
          meterTypeSelected = { value: s.value, label: s.value };
        }
      }}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a meter type" />
      </Select.Trigger>
      <Select.Content>
        {#each meterTypes as type}
          <Select.Item value={type} label={type} />
        {/each}
      </Select.Content>
    </Select.Root>
    <input type="hidden" name="meterType" bind:value={$formStore.meterType} />
    {#if $errors.meterType}<span class="text-red-500">{$errors.meterType}</span>{/if}
  </div>

  <div>
    <Label for="meterActive">Meter Active</Label>
    <Input type="checkbox" id="meterActive" name="meterActive" bind:value={$formStore.meterActive} />
    {#if $errors.meterActive}<span class="text-red-500">{$errors.meterActive}</span>{/if}
  </div>

  <Button type="submit">{editMode ? 'Update' : 'Add'} Meter</Button>
  {#if editMode}
    <Button type="button" on:click={() => {
      editMode = false;
      reset();
    }}>Cancel</Button>
  {/if}

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