<script lang="ts">

  import { meterSchema, locationTypeEnum, utilityTypeEnum, meterStatusEnum, type FormSelectValue } from './formSchema';
  import type { Property, Floor, RentalUnit } from './formSchema';
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { createEventDispatcher } from 'svelte';
  import { Textarea } from "$lib/components/ui/textarea";



  let {
    data,
    editMode = false,
    onMeterAdded,
    form,
    errors,
    enhance,
    constraints,
    submitting,
  } = $props();

  const dispatch = createEventDispatcher();

  // Single Select for Property
  let selectedProperty = {
    get value(): string | undefined { 
      return $form.property_id?.toString();
    },
    set value(id: string | undefined) { 
      $form.property_id = id ? parseInt(id) : null;
      $form.floor_id = null;
      $form.rental_unit_id = null;
    }
  };

  // Single Select for Floor
  let selectedFloor = {
    get value(): string | undefined { 
      return $form.floor_id?.toString();
    },
    set value(id: string | undefined) { 
      $form.floor_id = id ? parseInt(id) : null;
      $form.rental_unit_id = null;
    }
  };

  // Single Select for Rental Unit
  let selectedRentalUnit = {
    get value(): string | undefined { 
      return $form.rental_unit_id?.toString();
    },
    set value(id: string | undefined) { 
      $form.rental_unit_id = id ? parseInt(id) : null;
    }
  };

  let triggerLocation = $derived.by(() => {
    switch ($form.location_type) {
      case 'PROPERTY':
        const property = (data.properties as Property[] | undefined)?.find(p => p.id === $form.property_id);
        return property ? property.name : "Select a property";
      case 'FLOOR':
        const floor = (data.floors as Floor[] | undefined)?.find(f => f.id === $form.floor_id);
        return floor ? `Floor ${floor.floor_number}${floor.wing ? `, Wing ${floor.wing}` : ''}` : "Select a floor";
      case 'RENTAL_UNIT':
        const unit = (data.rental_units as RentalUnit[] | undefined)?.find(r => r.id === $form.rental_unit_id);
        return unit ? `Unit ${unit.number}` : "Select a rental unit";
      default:
        return "Select location type first";
    }
  });

  function handleCancel() {
    dispatch('cancel');
  }

  function handleDelete() {
    dispatch('delete');
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
    <Label for="name">Name</Label>
    <Input
      type="text"
      id="name"
      name="name"
      bind:value={$form.name}
      data-error={!!$errors.name}
      {...$constraints.name}
    />
    {#if $errors.name}
      <p class="text-sm font-medium text-destructive">{$errors.name}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="location_type">Location Type</Label>
    <Select.Root
      type="single"
      name="location_type"
      bind:value={$form.location_type}
    >
      <Select.Trigger 
        class="w-full"
        data-error={!!$errors.location_type}
        {...$constraints.location_type}
      >
        {$form.location_type || "Select location type"}
      </Select.Trigger>
      <Select.Content>
        {#each locationTypeEnum.options as type}
          <Select.Item value={type}>{type.replace('_', ' ')}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.location_type}
      <p class="text-sm font-medium text-destructive">{$errors.location_type}</p>
    {/if}
  </div>

  {#if $form.location_type === 'PROPERTY'}
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
          {triggerLocation}
        </Select.Trigger>
        <Select.Content>
          <div class="max-h-[200px] overflow-y-auto">
            {#each data.properties ?? [] as property (property.id)}
            <Select.Item value={property.id.toString()}>
              {property.name}
            </Select.Item>
          {/each}
          </div>
        </Select.Content>
      </Select.Root>
      {#if $errors.property_id}
        <p class="text-sm font-medium text-destructive">{$errors.property_id}</p>
      {/if}
    </div>
  {/if}

  {#if $form.location_type === 'FLOOR'}
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
          {triggerLocation}
        </Select.Trigger>
        <Select.Content>
          <div class="max-h-[200px] overflow-y-auto">
            {#each data.floors?? [] as floor(floor.id)}
              <Select.Item value={floor.id.toString()}>
                Floor {floor.floor_number}
                {floor.wing ? `, Wing ${floor.wing}` : ''}
                {floor.property ? ` - ${floor.property.name}` : ''}
              </Select.Item>
            {/each}
          </div>
        </Select.Content>
      </Select.Root>
      {#if $errors.floor_id}
        <p class="text-sm font-medium text-destructive">{$errors.floor_id}</p>
      {/if}
    </div>
  {/if}

  {#if $form.location_type === 'RENTAL_UNIT'}
    <div class="space-y-2">
      <Label for="rental_unit_id">Rental Unit</Label>
      <Select.Root
        type="single"
        name="rental_unit_id"
        bind:value={selectedRentalUnit.value}
      >
        <Select.Trigger 
          class="w-full"
          data-error={!!$errors.rental_unit_id}
          {...$constraints.rental_unit_id}
        >
          {triggerLocation}
        </Select.Trigger>
        <Select.Content>
          <div class="max-h-[200px] overflow-y-auto">
            {#each data.rental_units ?? [] as unit (unit.id)}
              <Select.Item value={unit.id.toString()}>
                Unit {unit.number}
                {unit.floor?.property && ` - ${unit.floor.property.name}`}
              </Select.Item>
            {/each}
          </div>
        </Select.Content>
      </Select.Root>
      {#if $errors.rental_unit_id}
        <p class="text-sm font-medium text-destructive">{$errors.rental_unit_id}</p>
      {/if}
    </div>
  {/if}

  <div class="space-y-2">
    <Label for="type">Utility Type</Label>
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
        {$form.type || "Select utility type"}
      </Select.Trigger>
      <Select.Content>
        {#each utilityTypeEnum.options as type}
          <Select.Item value={type}>
            {type.replace('_', ' ')}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.type}
      <p class="text-sm font-medium text-destructive">{$errors.type}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="initial_reading">Initial Reading</Label>
    <Input
      type="number"
      id="initial_reading"
      name="initial_reading"
      bind:value={$form.initial_reading}
      min="0"
      step="0.01"
      data-error={!!$errors.initial_reading}
      {...$constraints.initial_reading}
    />
    {#if $errors.initial_reading}
      <p class="text-sm font-medium text-destructive">{$errors.initial_reading}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="unit_rate">Unit Rate</Label>
    <Input
      type="number"
      id="unit_rate"
      name="unit_rate"
      bind:value={$form.unit_rate}
      min="0"
      step="0.01"
      data-error={!!$errors.unit_rate}
      {...$constraints.unit_rate}
    />
    {#if $errors.unit_rate}
      <p class="text-sm font-medium text-destructive">{$errors.unit_rate}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="notes">Notes</Label>
    <Textarea
      id="notes"
      name="notes"
      bind:value={$form.notes}
      rows={3}
      data-error={!!$errors.notes}
      {...$constraints.notes}
    />
    {#if $errors.notes}
      <p class="text-sm font-medium text-destructive">{$errors.notes}</p>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex justify-end space-x-2">
    {#if editMode}
      <Button
        type="button"
        variant="destructive"
        onclick={handleDelete}
      >
        Delete
      </Button>
    {/if}
    <Button
      type="button"
      variant="outline"
      onclick={handleCancel}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={$submitting}>
      {#if $submitting}
        Saving...
      {:else}
        {editMode ? 'Update' : 'Create'} Meter
      {/if}
    </Button>
  </div>
</form>

<style lang="postcss">
  :global([data-error="true"]) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
</style>