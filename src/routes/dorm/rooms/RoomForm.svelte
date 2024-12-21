<!-- src/routes/rooms/RoomForm.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import { roomSchema, type Room } from './formSchema';

  interface PageData {
    rooms: Array<Room & {
      property: { name: string };
      floor: { floor_number: number; wing?: string };
    }>;
    properties: Array<{ id: number; name: string }>;
    floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
    form: any;
  }

  interface SelectItem {
    value: string;
    label: string;
  }

  export let data: PageData;
  export let editMode = false;
  export let selectedRoom: (Room & { 
    property: { name: string }; 
    floor: { floor_number: number; wing?: string } 
  }) | undefined = undefined;

  const dispatch = createEventDispatcher();

  const { form, errors, enhance, submitting, reset } = superForm(data.form, {
    id: 'roomForm',
    validators: zodClient(roomSchema),
    applyAction: true,
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('roomSaved');
      }
    },
  });

  $: {
    if (selectedRoom && editMode) {
      form.set(selectedRoom);
      roomStatusSelected = { value: selectedRoom.room_status, label: selectedRoom.room_status };
      propertySelected = { value: selectedRoom.property_id.toString(), label: data.properties.find(p => p.id === selectedRoom.property_id)?.name || '' };
      floorSelected = { value: selectedRoom.floor_id.toString(), label: getFloorLabel(selectedRoom.floor_id) };
    }
  }

  let roomStatusSelected: SelectItem = { value: 'VACANT', label: 'VACANT' };
  let propertySelected: SelectItem = { value: '', label: 'Select a property' };
  let floorSelected: SelectItem = { value: '', label: 'Select a floor' };

  function handlePropertyChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $form.property_id = Number(s.value);
      propertySelected = s;
      // Reset floor when property changes
      $form.floor_id = undefined;
      floorSelected = { value: '', label: 'Select a floor' };
    }
  }

  function handleFloorChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $form.floor_id = Number(s.value);
      floorSelected = s;
    }
  }

  function handleTypeChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $form.type = s.value;
      propertySelected = s;
    }
  }

  function handleStatusChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $form.room_status = s.value;
      roomStatusSelected = s;
    }
  }

  $: availableFloors = data.floors.filter(f => 
    f.property_id === Number($form.property_id)
  );

  function getFloorLabel(floorId: number): string {
    const floor = data.floors.find(f => f.id === floorId);
    if (!floor) return '';
    return `Floor ${floor.floor_number}${floor.wing ? ` - ${floor.wing}` : ''}`;
  }

  const roomStatuses = ['VACANT', 'OCCUPIED', 'RESERVED'];
  const roomTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'SUITE'];
  
  function handleCancel() {
    dispatch('cancel');
    reset();
  }

  let amenityInput = '';
  
  function addAmenity() {
    if (amenityInput.trim()) {
      $form.amenities = [...$form.amenities, amenityInput.trim()];
      amenityInput = '';
    }
  }

  function removeAmenity(index: number): void {
    $form.amenities = $form.amenities.filter((_: string, i: number) => i !== index);
  }
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:enhance
  class="space-y-4 mb-8"
>
  {#if editMode && $form.id}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Room Form</h1>
  </div>

  <div>
    <Label for="property">Property</Label>
    <Select.Root    
      selected={propertySelected}
      onSelectedChange={handlePropertyChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a property" />
      </Select.Trigger>
      <Select.Content>
        {#each data.properties as property}
          <Select.Item value={property.id.toString()} label={property.name} />
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.property_id}<span class="text-red-500">{$errors.property_id}</span>{/if}
  </div>

  <div>
    <Label for="floor">Floor</Label>
    <Select.Root    
      selected={floorSelected}
      onSelectedChange={handleFloorChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a floor" />
      </Select.Trigger>
      <Select.Content>
        {#each availableFloors as floor}
          <Select.Item 
            value={floor.id.toString()} 
            label={getFloorLabel(floor.id)} 
          />
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.floor_id}<span class="text-red-500">{$errors.floor_id}</span>{/if}
  </div>

  <div>
    <Label for="name">Room Name</Label>
    <Input id="name" name="name" bind:value={$form.name} />
    {#if $errors.name}<span class="text-red-500">{$errors.name}</span>{/if}
  </div>

  <div>
    <Label for="number">Room Number</Label>
    <Input type="number" id="number" name="number" bind:value={$form.number} />
    {#if $errors.number}<span class="text-red-500">{$errors.number}</span>{/if}
  </div>

  <div>
    <Label for="type">Room Type</Label>
    <Select.Root    
      selected={{ value: $form.type || '', label: $form.type || 'Select a type' }}
      onSelectedChange={handleTypeChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a type" />
      </Select.Trigger>
      <Select.Content>
        {#each roomTypes as type}
          <Select.Item value={type} label={type} />
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.type}<span class="text-red-500">{$errors.type}</span>{/if}
  </div>

  <div>
    <Label for="capacity">Capacity</Label>
    <Input type="number" id="capacity" name="capacity" bind:value={$form.capacity} />
    {#if $errors.capacity}<span class="text-red-500">{$errors.capacity}</span>{/if}
  </div>

  <div>
    <Label for="base_rate">Base Rate</Label>
    <Input type="number" id="base_rate" name="base_rate" bind:value={$form.base_rate} />
    {#if $errors.base_rate}<span class="text-red-500">{$errors.base_rate}</span>{/if}
  </div>

  <div>
    <Label for="room_status">Status</Label>
    <Select.Root    
      selected={roomStatusSelected}
      onSelectedChange={handleStatusChange}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select a status" />
      </Select.Trigger>
      <Select.Content>
        {#each roomStatuses as status}
          <Select.Item value={status} label={status} />
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.room_status}<span class="text-red-500">{$errors.room_status}</span>{/if}
  </div>

  <div>
    <Label for="amenities">Amenities</Label>
    <div class="flex gap-2 mb-2">
      <Input 
        id="amenity-input" 
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
    {#if $form.amenities?.length}
      <div class="flex flex-wrap gap-2 mt-2">
        {#each $form.amenities as amenity, i}
          <div class="flex items-center gap-1 bg-secondary p-1 rounded">
            <span>{amenity}</span>
            <button 
              type="button" 
              class="text-destructive hover:text-destructive-foreground"
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