<!-- src/routes/rooms/RoomForm.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import { roomSchema, type Room, locationStatusEnum } from './formSchema';
  import type { SuperValidated, SuperForm } from 'sveltekit-superforms';
  import type { AnyZodObject } from 'zod';
  import type { z } from 'zod';
  import { zod } from 'sveltekit-superforms/adapters';

  interface PageData {
    rooms: Array<Room & {
      property: { name: string };
      floor: { floor_number: number; wing?: string };
    }>;
    properties: Array<{ id: number; name: string }>;
    floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
    form: SuperValidated<any>;
  }

  interface SelectItem {
    value: string;
    label: string;
  }

  export let data: PageData;
  interface Props {
  data: PageData;
  editMode?: boolean;
  selectedRoom?: Room & { 
    property: { name: string }; 
    floor: { floor_number: number; wing?: string } 
  };
  form: SuperValidated<z.infer<typeof roomSchema>>;
  submitEnhancer: (form: HTMLFormElement) => void;
}

export let form: Props['form'];
export let submitEnhancer: Props['submitEnhancer'];

// Update form initialization


  export let editMode = false;
  export let selectedRoom: (Room & { 
    property: { name: string }; 
    floor: { floor_number: number; wing?: string } 
  }) | undefined = undefined;

  const dispatch = createEventDispatcher();

  const { form: formData, errors, submitting } = superForm(form, {
  validators: zod(roomSchema),
  dataType: 'json',
  id: editMode ? 'edit-room' : 'add-room'  // Add this line
});

  let propertySelected: SelectItem | undefined;
  let floorSelected: SelectItem | undefined;
  let roomStatusSelected: SelectItem | undefined;

  $: {
    if (selectedRoom && editMode) {
      $formData = selectedRoom;
    }
  }

  const roomTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'SUITE'] as const;

  function handlePropertyChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $formData.property_id = Number(s.value);
      propertySelected = s;
      // Reset floor when property changes
      $formData.floor_id = 0;
      floorSelected = { value: '', label: 'Select a floor' };
    }
  }

  function handleFloorChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $formData.floor_id = Number(s.value);
      floorSelected = s;
    }
  }

  function handleTypeChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $formData.type = s.value;
      propertySelected = s;
    }
  }

  function handleStatusChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $formData.room_status = s.value as typeof locationStatusEnum._type;
      roomStatusSelected = s;
    }
  }

  $: availableFloors = data.floors.filter(f => 
    f.property_id === Number($formData.property_id)
  );

  function getFloorLabel(floorId: number): string {
    const floor = data.floors.find(f => f.id === floorId);
    return floor ? `Floor ${floor.floor_number}${floor.wing ? ` Wing ${floor.wing}` : ''}` : '';
  }
  
  function handleCancel() {
    dispatch('cancel');
  }

  let amenityInput = '';
  
  function addAmenity() {
    if (amenityInput.trim()) {
      $formData.amenities = [...($formData.amenities || []), amenityInput.trim()];
      amenityInput = '';
    }
  }
  
  function removeAmenity(index: number): void {
    if ($formData.amenities) {
      $formData.amenities = $formData.amenities.filter((_: string, i: number) => i !== index);
    }
  }
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:submitEnhancer
  class="space-y-4 mb-8"
>

  {#if editMode && $formData.id}
    <input type="hidden" name="id" bind:value={$formData.id} />
  {/if}

  <div>
    <Label for="property_id">Property</Label>
    <Select.Root    
      selected={{ value: $formData.property_id?.toString() || '', label: data.properties.find(p => p.id === $formData.property_id)?.name || 'Select a property' }}
      onSelectedChange={handlePropertyChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a property" />
      </Select.Trigger>
      <Select.Content>
        {#each data.properties as property}
          <Select.Item value={property.id.toString()}>
            {property.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.property_id}<span class="text-red-500">{$errors.property_id}</span>{/if}
  </div>

  <div>
    <Label for="floor_id">Floor</Label>
    <Select.Root    
      selected={{ value: $formData.floor_id?.toString() || '', label: getFloorLabel($formData.floor_id) || 'Select a floor' }}
      onSelectedChange={handleFloorChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a floor" />
      </Select.Trigger>
      <Select.Content>
        {#each availableFloors as floor}
          <Select.Item value={floor.id.toString()}>
            Floor {floor.floor_number}
            {#if floor.wing}
              Wing {floor.wing}
            {/if}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.floor_id}<span class="text-red-500">{$errors.floor_id}</span>{/if}
  </div>

  <div>
    <Label for="name">Name</Label>
    <Input id="name" name="name" bind:value={$formData.name} />
    {#if $errors.name}<span class="text-red-500">{$errors.name}</span>{/if}
  </div>

  <div>
    <Label for="number">Number</Label>
    <Input type="number" id="number" name="number" bind:value={$formData.number} />
    {#if $errors.number}<span class="text-red-500">{$errors.number}</span>{/if}
  </div>

  <div>
    <Label for="type">Type</Label>
    <Select.Root    
      selected={{ value: $formData.type || '', label: $formData.type || 'Select a type' }}
      onSelectedChange={handleTypeChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a type" />
      </Select.Trigger>
      <Select.Content>
        {#each roomTypes as type}
          <Select.Item value={type}>
            {type}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.type}<span class="text-red-500">{$errors.type}</span>{/if}
  </div>

  <div>
    <Label for="capacity">Capacity</Label>
    <Input type="number" id="capacity" name="capacity" bind:value={$formData.capacity} />
    {#if $errors.capacity}<span class="text-red-500">{$errors.capacity}</span>{/if}
  </div>

  <div>
    <Label for="base_rate">Base Rate</Label>
    <Input type="number" id="base_rate" name="base_rate" bind:value={$formData.base_rate} />
    {#if $errors.base_rate}<span class="text-red-500">{$errors.base_rate}</span>{/if}
  </div>

  <div>
    <Label for="room_status">Status</Label>
    <Select.Root    
      selected={{ value: $formData.room_status || '', label: $formData.room_status || 'Select a status' }}
      onSelectedChange={handleStatusChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a status" />
      </Select.Trigger>
      <Select.Content>
        {#each locationStatusEnum.options as status}
          <Select.Item value={status}>
            {status}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.room_status}<span class="text-red-500">{$errors.room_status}</span>{/if}
  </div>

  <div>
    <Label>Amenities</Label>
    <div class="flex gap-2">
      <Input
        type="text"
        bind:value={amenityInput}
        placeholder="Add amenity"
        on:keydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addAmenity();
          }
        }}
      />
      <Button type="button" on:click={addAmenity}>Add</Button>
    </div>
    {#if $formData.amenities?.length}
      <div class="flex flex-wrap gap-2 mt-2">
        {#each $formData.amenities as amenity, i}
          <div class="flex items-center gap-1 bg-secondary p-1 rounded">
            <span>{amenity}</span>
            <button 
              type="button"
              class="text-sm hover:text-destructive"
              on:click={() => removeAmenity(i)}
            >
              ×
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="flex justify-end space-x-2">
    <Button type="submit" disabled={$submitting}>
      {$submitting ? 'Submitting...' : (editMode ? 'Update' : 'Add') + ' Room'}
    </Button>
    {#if editMode}
      <Button type="button" variant="destructive" on:click={handleCancel}>
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