<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import type { Room } from './formSchema';
  import { locationStatusEnum } from './formSchema';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import type { roomSchema } from './formSchema';

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
  export let form: SuperForm<z.infer<typeof roomSchema>>['form'];
  export let errors: SuperForm<z.infer<typeof roomSchema>>['errors'];
  export let constraints: SuperForm<z.infer<typeof roomSchema>>['constraints'];
  export let enhance: (node: HTMLFormElement) => void;

  const dispatch = createEventDispatcher();
  let submitted = false;

  const roomTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'SUITE'] as const;

  function handlePropertyChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      const propertyId = parseInt(s.value, 10);
      if (!isNaN(propertyId)) {
        $form = {
          ...$form,
          property_id: propertyId,
          floor_id: 0
        };
      }
    }
  }

  function handleFloorChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      const floorId = parseInt(s.value, 10);
      if (!isNaN(floorId)) {
        $form = {
          ...$form,
          floor_id: floorId
        };
      }
    }
  }

  function handleTypeChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $form = {
        ...$form,
        type: s.value
      };
    }
  }

  function handleStatusChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $form = {
        ...$form,
        room_status: s.value as typeof locationStatusEnum._type
      };
    }
  }

  $: availableFloors = data.floors.filter(f => 
    f.property_id === Number($form.property_id)
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
      $form = {
        ...$form,
        amenities: [...($form.amenities || []), amenityInput.trim()]
      };
      amenityInput = '';
    }
  }
  
  function removeAmenity(index: number): void {
    if ($form.amenities) {
      $form = {
        ...$form,
        amenities: $form.amenities.filter((_, i) => i !== index)
      };
    }
  }

  function getSelectTriggerClasses(error: boolean): string {
    const baseClasses = 'flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    return error 
      ? `${baseClasses} border-destructive ring-destructive` 
      : `${baseClasses} border-input`;
  }

  function getInputErrorClass(error: boolean): string {
    const baseClasses = 'w-full';
    return error 
      ? `${baseClasses} border-destructive focus-visible:ring-destructive` 
      : `${baseClasses} border-input`;
  }
</script>

<form 
  method="POST" 
  action={editMode ? "?/update" : "?/create"} 
  use:enhance
  on:submit={() => {
    submitted = true;
  }}
  class="space-y-4 mb-8"
>
  {#if submitted && Object.keys($errors).length > 0}
    <div class="p-4 mb-4 rounded-md bg-destructive/10 text-destructive">
      <p class="font-medium">Please fix the following errors:</p>
      <ul class="mt-2 list-disc list-inside">
        {#each Object.entries($errors) as [field, error]}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if editMode && $form.id}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <div class={getSelectTriggerClasses(submitted && !!$errors.property_id)}>
      <Select.Root    
        selected={{ 
          value: $form.property_id?.toString() || '', 
          label: data.properties.find(p => p.id === $form.property_id)?.name || 'Select a property' 
        }}
        onSelectedChange={handlePropertyChange}
      >
        <Select.Trigger 
          class={submitted && $errors.property_id ? 'border-destructive ring-destructive' : ''}
        >
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
    {#if submitted && $errors.property_id}
      <p class="text-sm font-medium text-destructive">{$errors.property_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="floor_id">Floor</Label>
    <div class={getSelectTriggerClasses(submitted && !!$errors.floor_id)}>
      <Select.Root    
        selected={{ 
          value: $form.floor_id?.toString() || '', 
          label: getFloorLabel($form.floor_id) || 'Select a floor' 
        }}
        onSelectedChange={handleFloorChange}
      >
        <Select.Trigger 
          class={submitted && $errors.floor_id ? 'border-destructive ring-destructive' : ''}
        >
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
    {#if submitted && $errors.floor_id}
      <p class="text-sm font-medium text-destructive">{$errors.floor_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="name">Name</Label>
    <Input 
      id="name" 
      name="name" 
      bind:value={$form.name}
      class={getInputErrorClass(submitted && !!$errors.name)}
      aria-invalid={submitted && $errors.name ? 'true' : undefined}
      {...$constraints.name}
    />
    {#if submitted && $errors.name}
      <p class="text-sm font-medium text-destructive">{$errors.name}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="number">Number</Label>
    <Input 
      type="number" 
      id="number" 
      name="number" 
      min="1"
      bind:value={$form.number}
      class={getInputErrorClass(submitted && !!$errors.number)}
      aria-invalid={submitted && $errors.number ? 'true' : undefined}
      {...$constraints.number}
    />
    {#if submitted && $errors.number}
      <p class="text-sm font-medium text-destructive">{$errors.number}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="type">Type</Label>
    <div class={getSelectTriggerClasses(submitted && !!$errors.type)}>
      <Select.Root    
        selected={{ 
          value: $form.type || '', 
          label: $form.type || 'Select a type' 
        }}
        onSelectedChange={handleTypeChange}
      >
        <Select.Trigger 
          class={submitted && $errors.type ? 'border-destructive ring-destructive' : ''}
        >
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
    {#if submitted && $errors.type}
      <p class="text-sm font-medium text-destructive">{$errors.type}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="capacity">Capacity</Label>
    <Input 
      type="number" 
      id="capacity" 
      name="capacity" 
      min="1"
      bind:value={$form.capacity}
      class={getInputErrorClass(submitted && !!$errors.capacity)}
      aria-invalid={submitted && $errors.capacity ? 'true' : undefined}
      {...$constraints.capacity}
    />
    {#if submitted && $errors.capacity}
      <p class="text-sm font-medium text-destructive">{$errors.capacity}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="base_rate">Base Rate</Label>
    <Input 
      type="number" 
      id="base_rate" 
      name="base_rate" 
      min="0"
      bind:value={$form.base_rate}
      class={getInputErrorClass(submitted && !!$errors.base_rate)}
      aria-invalid={submitted && $errors.base_rate ? 'true' : undefined}
      {...$constraints.base_rate}
    />
    {#if submitted && $errors.base_rate}
      <p class="text-sm font-medium text-destructive">{$errors.base_rate}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="room_status">Status</Label>
    <div class={getSelectTriggerClasses(submitted && !!$errors.room_status)}>
      <Select.Root    
        selected={{ 
          value: $form.room_status || '', 
          label: $form.room_status || 'Select a status' 
        }}
        onSelectedChange={handleStatusChange}
      >
        <Select.Trigger 
          class={submitted && $errors.room_status ? 'border-destructive ring-destructive' : ''}
        >
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
    {#if submitted && $errors.room_status}
      <p class="text-sm font-medium text-destructive">{$errors.room_status}</p>
    {/if}
  </div>

  <div class="space-y-2">
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
    {#if $form.amenities?.length}
      <div class="flex flex-wrap gap-2 mt-2">
        {#each $form.amenities as amenity, i}
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
    <Button type="submit">
      {editMode ? 'Update' : 'Add'} Room
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
    @apply border-destructive ring-destructive;
  }
  
  :global(.error:hover) {
    @apply border-destructive;
  }

  :global(.select-trigger.error) {
    @apply border-destructive;
  }
</style>