<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import type { Rental_unit } from './formSchema';
  import { locationStatusEnum, rentalUnitTypeEnum } from './formSchema';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import type { rental_unitSchema } from './formSchema';
  import type { Writable } from 'svelte/store';

  interface PageData {
    rental_unit: Array<Rental_unit & {
      property: { name: string };
      floor: { floor_number: number; wing?: string };
    }>;
    properties: Array<{ id: number; name: string }>;
    floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
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
    constraints,
  }: Props = $props();

  const dispatch = createEventDispatcher();

  // START : PATTERN FOR DATABASE BASED SELECTION ITEMS - Property
  let derivedProperties = $derived(data.properties.map(p => ({ value: p.id.toString(), label: p.name })));
  let selectedProperty = {
    get value() { return $form.property_id?.toString() || undefined },
    set value(id) { $form.property_id = id ? Number(id) || 0 : 0 }
  };
  let triggerPropertyContent = $derived(
    selectedProperty.value 
      ? data.properties.find(p => p.id.toString() === selectedProperty.value)?.name ?? "Select a property"
      : "Select a property"
  );

  // START : PATTERN FOR DATABASE BASED SELECTION ITEMS - Floor
  let derivedFloors = $derived(data.floors.map(f => ({ 
    value: f.id.toString(), 
    label: `Floor ${f.floor_number}${f.wing ? ` (${f.wing})` : ''}`
  })));
  let selectedFloor = {
    get value() { return $form.floor_id?.toString() || undefined },
    set value(id) { $form.floor_id = id ? Number(id) || 0 : 0 }
  };
  let triggerFloorContent = $derived(
    selectedFloor.value 
      ? data.floors.find(f => f.id.toString() === selectedFloor.value)?.floor_number ?? "Select a floor"
      : "Select a floor"
  );

  // Enum-based select for type
  let triggerType = $derived($form.type || "Select a type");

  // Enum-based select for rental_unit_status
  let triggerStatus = $derived($form.rental_unit_status || "Select a status");

  // Amenities handling
  // State management
let amenities = { get value() { return $form.amenities || [] }, set value(v) { $form.amenities = v } };
let currentAmenity = $state('');

function addAmenity() {
  if (currentAmenity.trim()) {
    amenities.value = [...amenities.value, currentAmenity.trim()];
    currentAmenity = '';
  }
}

  function handleCancel() {
    dispatch('cancel');
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

  <!-- Property Select -->
  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <Select.Root
      type="single"
      name="property_id"
      bind:value={selectedProperty.value}
    >
      <Select.Trigger
        class="w-full"
        data-error={!!$errors.property_id}
        {...$constraints.property_id}
      >
        {triggerPropertyContent}
      </Select.Trigger>
      <Select.Content>
        {#each derivedProperties as property}
          <Select.Item value={property.value}>
            {property.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.property_id}
      <p class="text-sm font-medium text-destructive">{$errors.property_id}</p>
    {/if}
  </div>

  <!-- Floor Select -->
  <div class="space-y-2">
    <Label for="floor_id">Floor</Label>
    <Select.Root
      type="single"
      name="floor_id"
      bind:value={selectedFloor.value}
    >
      <Select.Trigger
        class="w-full"
        data-error={!!$errors.floor_id}
        {...$constraints.floor_id}
      >
        {triggerFloorContent}
      </Select.Trigger>
      <Select.Content>
        {#each derivedFloors as floor}
          <Select.Item value={floor.value}>
            {floor.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.floor_id}
      <p class="text-sm font-medium text-destructive">{$errors.floor_id}</p>
    {/if}
  </div>

  <!-- Name Input -->
  <div class="space-y-2">
    <Label for="name">Name</Label>
    <Input
      id="name"
      name="name"
      bind:value={$form.name}
      class="w-full"
      data-error={!!$errors.name}
      aria-invalid={!!$errors.name}
      {...$constraints.name}
    />
    {#if $errors.name}
      <p class="text-sm font-medium text-destructive">{$errors.name}</p>
    {/if}
  </div>

  <!-- Number Input -->
  <div class="space-y-2">
    <Label for="number">Number</Label>
    <Input
      type="number"
      id="number"
      name="number"
      min="1"
      bind:value={$form.number}
      class="w-full"
      data-error={!!$errors.number}
      aria-invalid={!!$errors.number}
      {...$constraints.number}
    />
    {#if $errors.number}
      <p class="text-sm font-medium text-destructive">{$errors.number}</p>
    {/if}
  </div>

  <!-- Type Select -->
  <div class="space-y-2">
    <Label for="type">Type</Label>
    <Select.Root
      type="single"
      name="type"
      bind:value={$form.type}
    >
      <Select.Trigger
        class="w-full"
        data-error={!!$errors.type}
        {...$constraints.type}
      >
        {triggerType}
      </Select.Trigger>
      <Select.Content>
        {#each rentalUnitTypeEnum.options as type}
          <Select.Item value={type}>
            {type}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.type}
      <p class="text-sm font-medium text-destructive">{$errors.type}</p>
    {/if}
  </div>

  <!-- Capacity Input -->
  <div class="space-y-2">
    <Label for="capacity">Capacity</Label>
    <Input
      type="number"
      id="capacity"
      name="capacity"
      min="1"
      bind:value={$form.capacity}
      class="w-full"
      data-error={!!$errors.capacity}
      aria-invalid={!!$errors.capacity}
      {...$constraints.capacity}
    />
    {#if $errors.capacity}
      <p class="text-sm font-medium text-destructive">{$errors.capacity}</p>
    {/if}
  </div>

  <!-- Base Rate Input -->
  <div class="space-y-2">
    <Label for="base_rate">Base Rate</Label>
    <Input
      type="number"
      id="base_rate"
      name="base_rate"
      min="0"
      bind:value={$form.base_rate}
      class="w-full"
      data-error={!!$errors.base_rate}
      aria-invalid={!!$errors.base_rate}
      {...$constraints.base_rate}
    />
    {#if $errors.base_rate}
      <p class="text-sm font-medium text-destructive">{$errors.base_rate}</p>
    {/if}
  </div>

  <!-- Status Select -->
  <div class="space-y-2">
    <Label for="rental_unit_status">Status</Label>
    <Select.Root
      type="single"
      name="rental_unit_status"
      bind:value={$form.rental_unit_status}
    >
      <Select.Trigger
        class="w-full"
        data-error={!!$errors.rental_unit_status}
        {...$constraints.rental_unit_status}
      >
        {triggerStatus}
      </Select.Trigger>
      <Select.Content>
        {#each locationStatusEnum.options as status}
          <Select.Item value={status}>
            {status}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.rental_unit_status}
      <p class="text-sm font-medium text-destructive">{$errors.rental_unit_status}</p>
    {/if}
  </div>

 <!-- Amenities Input -->
<div class="space-y-2">
  <Label>Amenities</Label>
  <div class="flex gap-2">
    <Input
      type="text"
      bind:value={currentAmenity}
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
  {#if amenities.value.length}
    <div class="flex flex-wrap gap-2 mt-2">
      {#each amenities.value as amenity, i}
        <div class="flex items-center gap-1 bg-secondary/50 p-1 rounded">
          <span>{amenity}</span>
          <button
            type="button"
            class="text-sm hover:text-destructive"
            onclick={() => amenities.value = amenities.value.filter((_, idx) => idx !== i)}
          >×</button>
        </div>
      {/each}
    </div>
  {/if}
  {#if $errors.amenities}
    <p class="text-sm font-medium text-destructive">{$errors.amenities}</p>
  {/if}
</div>

{#if $errors._errors}
  <div class="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
    {$errors._errors}
  </div>
{/if}
  <!-- Submit and Cancel Buttons -->
  <div class="flex justify-end space-x-2">
    <Button type="submit">
      {editMode ? 'Update' : 'Add'} Rental Unit
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