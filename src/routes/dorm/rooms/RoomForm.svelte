# src/routes/rooms/RoomForm.svelte
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import { roomSchema, type Room, locationStatusEnum } from './formSchema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { zodClient } from 'sveltekit-superforms/adapters';

  interface PageData {
    rooms: Array<Room & {
      property: { name: string };
      floor: { floor_number: number; wing?: string };
    }>;
    properties: Array<{ id: number; name: string }>;
    floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
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
  export let form: SuperValidated<z.infer<typeof roomSchema>>;
  export let enhance: (node: HTMLFormElement) => void;

  const dispatch = createEventDispatcher();

  const { form: formData, errors, submitting, message } = superForm(form, {
    id: 'room-form',
    validators: zodClient(roomSchema),
    validationMethod: 'submit-only',
    dataType: 'json',
    taintedMessage: null,
    resetForm: false,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('roomSaved');
      }
    },
    onError: (error) => {
      console.error('Form validation error:', error);
    }
  });

  let propertySelected: SelectItem | undefined;
  let floorSelected: SelectItem | undefined;
  let roomStatusSelected: SelectItem | undefined;

  $: {
    if (selectedRoom && editMode) {
      $formData = {
        ...selectedRoom,
        property_id: selectedRoom.property_id,
        floor_id: selectedRoom.floor_id,
      };
    }
  }

  const roomTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'SUITE'] as const;

  function handlePropertyChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      const propertyId = parseInt(s.value, 10);
      if (!isNaN(propertyId)) {
        $formData = {
          ...$formData,
          property_id: propertyId
        };
        propertySelected = s;
        // Reset floor when property changes
        $formData = {
          ...$formData,
          floor_id: 0
        };
        floorSelected = { value: '', label: 'Select a floor' };
      }
    }
  }

  function handleFloorChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      const floorId = parseInt(s.value, 10);
      if (!isNaN(floorId)) {
        $formData = {
          ...$formData,
          floor_id: floorId
        };
        floorSelected = s;
      }
    }
  }

  function handleTypeChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $formData = {
        ...$formData,
        type: s.value
      };
      propertySelected = s;
    }
  }

  function handleStatusChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $formData = {
        ...$formData,
        room_status: s.value as typeof locationStatusEnum._type
      };
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
      $formData = {
        ...$formData,
        amenities: [...($formData.amenities || []), amenityInput.trim()]
      };
      amenityInput = '';
    }
  }
  
  function removeAmenity(index: number): void {
    if ($formData.amenities) {
      $formData = {
        ...$formData,
        amenities: $formData.amenities.filter((_, i) => i !== index)
      };
    }
  }

  function getSelectTriggerClasses(error: boolean): string {
    const baseClasses = 'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    return error ? `${baseClasses} border-destructive` : baseClasses;
  }

  function getInputErrorClass(error: boolean): string {
    return error ? 'border-destructive' : '';
  }
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:enhance
  class="space-y-4 mb-8"
>
  <!-- Form-level errors -->
  {#if Object.keys($errors).length > 0}
    <div class="bg-destructive/15 border-l-4 border-destructive text-destructive px-4 py-3 rounded-md">
      <p class="font-medium">Please fix the following errors:</p>
      <ul class="mt-2 list-disc list-inside text-sm">
        {#each Object.entries($errors) as [field, error]}
          <li>{field}: {error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if editMode && $formData.id}
    <input type="hidden" name="id" bind:value={$formData.id} />
  {/if}

  <div>
    <Label for="property_id">Property <span class="text-destructive">*</span></Label>
    <div class={getSelectTriggerClasses(!!$errors.property_id)}>
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
    </div>
    {#if $errors.property_id}<span class="text-destructive text-sm mt-1">{$errors.property_id}</span>{/if}
  </div>

  <div>
    <Label for="floor_id">Floor <span class="text-destructive">*</span></Label>
    <div class={getSelectTriggerClasses(!!$errors.floor_id)}>
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
    </div>
    {#if $errors.floor_id}<span class="text-destructive text-sm mt-1">{$errors.floor_id}</span>{/if}
  </div>

  <div>
    <Label for="name">Name <span class="text-destructive">*</span></Label>
    <Input 
      id="name" 
      name="name" 
      bind:value={$formData.name}
      class={getInputErrorClass(!!$errors.name)}
      aria-invalid={$errors.name ? 'true' : undefined}
    />
    {#if $errors.name}<span class="text-destructive text-sm mt-1">{$errors.name}</span>{/if}
  </div>

  <div>
    <Label for="number">Number <span class="text-destructive">*</span></Label>
    <Input 
      type="number" 
      id="number" 
      name="number" 
      min="1"
      bind:value={$formData.number}
      class={getInputErrorClass(!!$errors.number)}
      aria-invalid={$errors.number ? 'true' : undefined}
    />
    {#if $errors.number}<span class="text-destructive text-sm mt-1">{$errors.number}</span>{/if}
  </div>

  <div>
    <Label for="type">Type <span class="text-destructive">*</span></Label>
    <div class={getSelectTriggerClasses(!!$errors.type)}>
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
    </div>
    {#if $errors.type}<span class="text-destructive text-sm mt-1">{$errors.type}</span>{/if}
  </div>

  <div>
    <Label for="capacity">Capacity <span class="text-destructive">*</span></Label>
    <Input 
      type="number" 
      id="capacity" 
      name="capacity" 
      min="1"
      bind:value={$formData.capacity}
      class={getInputErrorClass(!!$errors.capacity)}
      aria-invalid={$errors.capacity ? 'true' : undefined}
    />
    {#if $errors.capacity}<span class="text-destructive text-sm mt-1">{$errors.capacity}</span>{/if}
  </div>

  <div>
    <Label for="base_rate">Base Rate <span class="text-destructive">*</span></Label>
    <Input 
      type="number" 
      id="base_rate" 
      name="base_rate" 
      min="0"
      bind:value={$formData.base_rate}
      class={getInputErrorClass(!!$errors.base_rate)}
      aria-invalid={$errors.base_rate ? 'true' : undefined}
    />
    {#if $errors.base_rate}<span class="text-destructive text-sm mt-1">{$errors.base_rate}</span>{/if}
  </div>

  <div>
    <Label for="room_status">Status <span class="text-destructive">*</span></Label>
    <div class={getSelectTriggerClasses(!!$errors.room_status)}>
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
    </div>
    {#if $errors.room_status}<span class="text-destructive text-sm mt-1">{$errors.room_status}</span>{/if}
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
      <Button type="button" variant="secondary" on:click={addAmenity}>Add</Button>
    </div>
    {#if $formData.amenities?.length}
      <div class="flex flex-wrap gap-2 mt-2">
        {#each $formData.amenities as amenity, i}
          <div class="flex items-center gap-1 bg-secondary/50 p-1 rounded">
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
</form>

<style>
  :global(.error) {
    border-color: hsl(var(--destructive));
  }
  
  :global(.error:hover) {
    border-color: hsl(var(--destructive));
  }
</style>