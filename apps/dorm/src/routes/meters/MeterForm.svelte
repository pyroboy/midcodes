<script lang="ts">

  import { meterSchema, locationTypeEnum, utilityTypeEnum, meterStatusEnum, type FormSelectValue } from './formSchema';
  import type { Property, Floor, RentalUnit } from './formSchema';
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Select from '$lib/components/ui/select';
  import { utilityTypeEnum, meterStatusEnum, type MeterFormData, meterFormSchema } from './formSchema';
  import type { Database } from '$lib/database.types';
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

  type Property = Database['public']['Tables']['properties']['Row'];
  type Floor = Database['public']['Tables']['floors']['Row'] & {
    property: Property | null;
  };
  type Rental_unit = Database['public']['Tables']['rental_unit']['Row'] & {
    floor: Floor | null;
  };

  interface Props {
    editMode?: boolean;
    data: {
      properties: Property[];
      floors: Floor[];
      rental_unit: Rental_unit[];
      meter?: MeterFormData;
    };
    form: SuperForm<z.infer<typeof meterFormSchema>>['form'];
    errors: SuperForm<z.infer<typeof meterFormSchema>>['errors'];
    enhance: SuperForm<z.infer<typeof meterFormSchema>>['enhance'];
    constraints: SuperForm<z.infer<typeof meterFormSchema>>['constraints'];
    submitting: SuperForm<z.infer<typeof meterFormSchema>>['submitting'];
  }

  // Use props with no type argument, and assign types to destructured properties
  let props = $props();
  
  // Destructure props with explicit typing
  let form = props.form;
  let data = props.data as Props['data'];
  let editMode = props.editMode as Props['editMode'] || false;
  let errors = props.errors as Props['errors'];
  let enhance = props.enhance as Props['enhance'];
  let constraints = props.constraints as Props['constraints'];
  let submitting = props.submitting as Props['submitting'];

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
  const dispatch = createEventDispatcher<{
    meterAdded: void;
    meterUpdated: void;
    cancel: void;
  }>();

  function getLocationLabel(type: string, id: number | null): string {
    if (!id) return '';
    
    switch (type) {
      case 'PROPERTY':
        return data.properties.find((p) => p.id === id)?.name || '';
      case 'FLOOR':
        const floor = data.floors.find((f) => f.id === id);
        return floor ? `${floor.property?.name || ''} - Floor ${floor.floor_number} ${floor.wing || ''}` : '';
      case 'RENTAL_UNIT':
        const unit = data.rental_unit.find((r) => r.id === id);
        return unit ? `${unit.floor?.property?.name || ''} - Floor ${unit.floor?.floor_number || ''} - Rental_unit ${unit.number}` : '';
      default:
        return '';
    }
  }

  // Using $derived instead of $effect + $state
  let filteredProperties = $derived(
    data.properties.filter((p) => p.status === 'ACTIVE')
  );
  
  let filteredFloors = $derived(
    data.floors.filter((f) => f.status === 'ACTIVE')
  );
  
  let filteredRental_Units = $derived(
    data.rental_unit.filter((r) => 
      r.rental_unit_status === 'VACANT' || r.rental_unit_status === 'OCCUPIED'
    )
  );
  
  // Using $inspect for console logs instead of console.log
  $inspect('Form data:', data);
  $inspect('Form location type:', $form.location_type);
  $inspect('Available properties:', filteredProperties.length);
  $inspect('Available floors:', filteredFloors.length);
  $inspect('Available rental units:', filteredRental_Units.length);

  // Compute location label using $derived
  let locationLabel = $derived(
    !$form.location_type ? '' : getLocationLabel(
      $form.location_type, 
      $form.location_type === 'PROPERTY' ? Number($form.property_id) : 
      $form.location_type === 'FLOOR' ? Number($form.floor_id) : 
      Number($form.rental_unit_id)
    )
  );

  function handleLocationTypeChange(type: string) {
    if (type === 'PROPERTY' || type === 'FLOOR' || type === 'RENTAL_UNIT') {
      $form.location_type = type;
      
      // Reset location IDs based on the selected type
      if (type !== 'PROPERTY') $form.property_id = null;
      if (type !== 'FLOOR') $form.floor_id = null;
      if (type !== 'RENTAL_UNIT') $form.rental_unit_id = null;
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

  // Type-safe handlers for enums
  function handleUtilityTypeChange(value: string) {
    $form.type = value as z.infer<typeof utilityTypeEnum>;
  }

  function handleStatusChange(value: string) {
    $form.status = value as z.infer<typeof meterStatusEnum>;
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
<form method="POST" use:enhance>
  {#if editMode && $form.id}
    <input type="hidden" name="id" value={$form.id} />
    <input type="hidden" name="action" value="update" />
  {:else}
    <input type="hidden" name="action" value="create" />
  {/if}

  <div class="space-y-4">
    <div>
      <Label for="name">Name</Label>
      <Input type="text" id="name" bind:value={$form.name} maxlength={255} required />
      {#if $errors.name}<span class="text-red-500">{$errors.name}</span>{/if}
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
    <div>
      <Label for="location_type">Location Type</Label>
      <Select.Root type="single" value={$form.location_type} onValueChange={handleLocationTypeChange}>
        <Select.Trigger class="w-full">
          <span>{$form.location_type || 'Select location type'}</span>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="PROPERTY">Property</Select.Item>
          <Select.Item value="FLOOR">Floor</Select.Item>
          <Select.Item value="RENTAL_UNIT">Rental_unit</Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.location_type}<span class="text-red-500">{$errors.location_type}</span>{/if}
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
    {#if $form.location_type === 'PROPERTY'}
      <div>
        <Label for="property_id">Property</Label>
        <Select.Root 
          type="single" 
          value={$form.property_id ? $form.property_id.toString() : ''} 
          onValueChange={handleLocationChange}
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
          <Select.Trigger class="w-full">
            <span>
              {$form.property_id 
                ? getLocationLabel('PROPERTY', Number($form.property_id)) 
                : 'Select property'}
            </span>
          </Select.Trigger>
          <Select.Content>
            {#each filteredProperties as property}
              <Select.Item value={property.id.toString()}>{property.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if $errors.property_id}<span class="text-red-500">{$errors.property_id}</span>{/if}
      </div>
    {:else if $form.location_type === 'FLOOR'}
      <div>
        <Label for="floor_id">Floor</Label>
        <Select.Root 
          type="single" 
          value={$form.floor_id ? $form.floor_id.toString() : ''}
          onValueChange={handleLocationChange}
        >
          {triggerLocation}
        </Select.Trigger>
        <Select.Content>
          <div class="max-h-[200px] overflow-y-auto">
            {#each data.floors?? [] as floor(floor.id)}
          <Select.Trigger class="w-full">
            <span>
              {$form.floor_id 
                ? getLocationLabel('FLOOR', Number($form.floor_id)) 
                : 'Select floor'}
            </span>
          </Select.Trigger>
          <Select.Content>
            {#each filteredFloors as floor}
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
          </Select.Content>
        </Select.Root>
        {#if $errors.floor_id}<span class="text-red-500">{$errors.floor_id}</span>{/if}
      </div>
    {:else if $form.location_type === 'RENTAL_UNIT'}
      <div>
        <Label for="rental_unit_id">Rental_unit</Label>
        <Select.Root 
          type="single" 
          value={$form.rental_unit_id ? $form.rental_unit_id.toString() : ''}
          onValueChange={handleLocationChange}
        >
          {triggerLocation}
        </Select.Trigger>
        <Select.Content>
          <div class="max-h-[200px] overflow-y-auto">
            {#each data.rental_units ?? [] as unit (unit.id)}
              <Select.Item value={unit.id.toString()}>
                Unit {unit.number}
                {unit.floor?.property && ` - ${unit.floor.property.name}`}
          <Select.Trigger class="w-full">
            <span>
              {$form.rental_unit_id 
                ? getLocationLabel('RENTAL_UNIT', Number($form.rental_unit_id)) 
                : 'Select rental_unit'}
            </span>
          </Select.Trigger>
          <Select.Content>
            {#each filteredRental_Units as rental_unit}
              <Select.Item value={rental_unit.id.toString()}>
                Rental_unit {rental_unit.number}
                {#if rental_unit.floor?.property}
                  - {rental_unit.floor.property.name}
                {/if}
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
          </Select.Content>
        </Select.Root>
        {#if $errors.rental_unit_id}<span class="text-red-500">{$errors.rental_unit_id}</span>{/if}
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
    <div>
      <Label for="type">Utility Type</Label>
      <Select.Root 
        type="single" 
        value={$form.type} 
        onValueChange={handleUtilityTypeChange}
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
        <Select.Trigger class="w-full">
          <span>{$form.type || 'Select utility type'}</span>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="ELECTRICITY">Electricity</Select.Item>
          <Select.Item value="WATER">Water</Select.Item>
          <Select.Item value="INTERNET">Internet</Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.type}<span class="text-red-500">{$errors.type}</span>{/if}
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
    <div>
      <Label for="status">Status</Label>
      <Select.Root 
        type="single" 
        value={$form.status} 
        onValueChange={handleStatusChange}
      >
        <Select.Trigger class="w-full">
          <span>{$form.status || 'Select status'}</span>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="ACTIVE">Active</Select.Item>
          <Select.Item value="INACTIVE">Inactive</Select.Item>
          <Select.Item value="MAINTENANCE">Maintenance</Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.status}<span class="text-red-500">{$errors.status}</span>{/if}
    </div>

    <div>
      <Label for="notes">Notes</Label>
      <Textarea id="notes" bind:value={$form.notes} />
      {#if $errors.notes}<span class="text-red-500">{$errors.notes}</span>{/if}
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
    <div class="flex justify-end space-x-2 pt-4">
      <button 
        type="button" 
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        onclick={handleCancel}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={$submitting}
      >
        {editMode ? 'Update' : 'Create'} Meter
      </button>
    </div>
  </div>
</form>

<style lang="postcss">
  :global([data-error="true"]) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
</style>