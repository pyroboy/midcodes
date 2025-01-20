<script lang="ts">
  import { run } from 'svelte/legacy';

  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import type { Rental_unit } from './formSchema';
  import { locationStatusEnum } from './formSchema';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import type { rental_unitSchema } from './formSchema';

  interface PageData {
    rental_unit: Array<Rental_unit & {
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

  interface Props {
    data: PageData;
    editMode?: boolean;
    form: SuperForm<z.infer<typeof rental_unitSchema>>['form'];
    errors: SuperForm<z.infer<typeof rental_unitSchema>>['errors'];
    enhance: SuperForm<z.infer<typeof rental_unitSchema>>['enhance'];
    constraints: SuperForm<z.infer<typeof rental_unitSchema>>['constraints'];
  }

  let {
    data,
    editMode = false,
    form,
    errors,
    enhance,
    constraints
  }: Props = $props();

  const dispatch = createEventDispatcher();
  const rental_unitTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'SUITE'] as const;

  function handleFormSubmit(event: Event) {
    event.preventDefault();
    console.log('[DEBUG] Form submitted with data:', $form);
    dispatch('submit', $form);
  }

  function handlePropertyChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      const propertyId = parseInt(s.value, 10);
      if (!isNaN(propertyId)) {
        const selectedProperty = data.properties.find(p => p.id === propertyId);
        $form = {
          ...$form,
          property_id: propertyId,
          floor_id: 0,
          property: {
            id: selectedProperty?.id || 0,
            name: selectedProperty?.name || ''
          }
        };
        console.log('[DEBUG] Property selected:', selectedProperty);
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
        rental_unit_status: s.value as typeof locationStatusEnum._type
      };
    }
  }

  let availableFloors;

  function getFloorLabel(floorId: number): string {
    const floor = data.floors.find(f => f.id === floorId);
    return floor ? `Floor ${floor.floor_number}${floor.wing ? ` Wing ${floor.wing}` : ''}` : '';
  }
  
  function handleCancel() {
    dispatch('cancel');
  }

  let amenityInput = $state('');
  
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
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4"
  novalidate
>
  {#if editMode && $form.id}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <!-- <Select.Root    
      selected={{ 
        value: $form.property_id?.toString() || '', 
        label: data.properties.find(p => p.id === $form.property_id)?.name || 'Select a property' 
      }}
      onSelectedChange={handlePropertyChange}
    >
      <Select.Trigger data-error={$errors.property_id && $form.property_id !== undefined}>
        <Select.Value placeholder="Select a property" />
      </Select.Trigger>
      <Select.Content>
        {#each data.properties as property}
          <Select.Item value={property.id.toString()}>
            {property.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root> -->
    {#if $errors.property_id && $form.property_id !== undefined}
      <p class="text-sm font-medium text-destructive">{$errors.property_id}</p>
    {/if}
  </div>

  
  <div class="space-y-2">
    <Label for="floor_id">Floor</Label>
    <!-- <Select.Root
      selected={{
        value: $form.floor_id?.toString() || '',
        label: getFloorLabel($form.floor_id) || 'Select a floor'
      }}
      onSelectedChange={handleFloorChange}
    >
      <Select.Trigger
        data-error={$errors.floor_id && $form.floor_id !== undefined}
        {...$constraints.floor_id}
        disabled={!$form.property_id}
      >
        <Select.Value placeholder={$form.property_id ? 'Select a floor' : 'Select a property first'} />
      </Select.Trigger>
      <Select.Content>
        {#if $form.property_id}
          {#each availableFloors as floor}
            <Select.Item value={floor.id.toString()}>
              Floor {floor.floor_number}
              {#if floor.wing}
                Wing {floor.wing}
              {/if}
            </Select.Item>
          {/each}
        {:else}
          <Select.Item value="" disabled>
            Please select a property first
          </Select.Item>
        {/if}
      </Select.Content>
    </Select.Root> -->
    {#if $errors.floor_id && $form.floor_id !== undefined}
      <p class="text-sm font-medium text-destructive">{$errors.floor_id}</p>
    {/if}
  </div>


  <div class="space-y-2">
    <Label for="name">Name</Label>
    <Input 
      id="name" 
      name="name" 
      bind:value={$form.name}
      class="w-full"
      data-error={$errors.name && $form.name !== undefined}
      aria-invalid={$errors.name ? 'true' : undefined}
      {...$constraints.name}
    />
    {#if $errors.name && $form.name !== undefined}
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
      class="w-full"
      data-error={$errors.number && $form.number !== undefined}
      aria-invalid={$errors.number ? 'true' : undefined}
      {...$constraints.number}
    />
    {#if $errors.number && $form.number !== undefined}
      <p class="text-sm font-medium text-destructive">{$errors.number}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="type">Type</Label>
    <!-- <Select.Root    
      selected={{ 
        value: $form.type || '', 
        label: $form.type || 'Select a type' 
      }}
      onSelectedChange={handleTypeChange}
    >
      <Select.Trigger 
        data-error={$errors.type && $form.type !== undefined}
        {...$constraints.type}
      >
        <Select.Value placeholder="Select a type" />
      </Select.Trigger>
      <Select.Content>
        {#each rental_unitTypes as type}
          <Select.Item value={type}>
            {type}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root> -->
    {#if $errors.type && $form.type !== undefined}
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
      class="w-full"
      data-error={$errors.capacity && $form.capacity !== undefined}
      aria-invalid={$errors.capacity ? 'true' : undefined}
      {...$constraints.capacity}
    />
    {#if $errors.capacity && $form.capacity !== undefined}
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
      class="w-full"
      data-error={$errors.base_rate && $form.base_rate !== undefined}
      aria-invalid={$errors.base_rate ? 'true' : undefined}
      {...$constraints.base_rate}
    />
    {#if $errors.base_rate && $form.base_rate !== undefined}
      <p class="text-sm font-medium text-destructive">{$errors.base_rate}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="rental_unit_status">Status</Label>
    <!-- <Select.Root    
      selected={{ 
        value: $form.rental_unit_status || '', 
        label: $form.rental_unit_status || 'Select a status' 
      }}
      onSelectedChange={handleStatusChange}
    >
      <Select.Trigger 
        data-error={$errors.rental_unit_status && $form.rental_unit_status !== undefined}
        {...$constraints.rental_unit_status}
      >
      </Select.Trigger>
      <Select.Content>
        {#each locationStatusEnum.options as status}
          <Select.Item value={status}>
            {status}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root> -->
    {#if $errors.rental_unit_status && $form.rental_unit_status !== undefined}
      <p class="text-sm font-medium text-destructive">{$errors.rental_unit_status}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label>Amenities</Label>
    <div class="flex gap-2">
      <Input
        type="text"
        bind:value={amenityInput}
        placeholder="Add amenity"
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addAmenity();
          }
        }}
      />
      <Button type="button" variant="secondary" onclick={addAmenity}>Add</Button>
    </div>
    {#if $form.amenities?.length}
      <div class="flex flex-wrap gap-2 mt-2">
        {#each $form.amenities as amenity, i}
          <div class="flex items-center gap-1 bg-secondary/50 p-1 rounded">
            <span>{amenity}</span>
            <button 
              type="button"
              class="text-sm hover:text-destructive"
              onclick={() => removeAmenity(i)}
            >
              ×
            </button>
          </div>
        {/each}
      </div>
    {/if}
    {#if $errors.amenities && $form.amenities !== undefined}
      <p class="text-sm font-medium text-destructive">{$errors.amenities}</p>
    {/if}
  </div>

  <div class="flex justify-end space-x-2">
    <Button type="submit">
      {editMode ? 'Update' : 'Add'} Rental_unit
    </Button>
    {#if editMode}
      <Button type="button" variant="destructive" onclick={handleCancel}>
        Cancel
      </Button>
    {/if}
  </div>
</form>

<style>
  :global(.select-error) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
  }

  :global([data-error="true"]) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
  
  :global(.input-error) {
    border-color: hsl(var(--destructive));
    --tw-ring-color: hsl(var(--destructive));
  }
</style>
