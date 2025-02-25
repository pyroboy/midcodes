<script lang="ts">
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Select from '$lib/components/ui/select';
  import { utilityTypeEnum, meterStatusEnum, type MeterFormData, meterFormSchema } from './formSchema';
  import type { Database } from '$lib/database.types';
  import { createEventDispatcher } from 'svelte';

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

  // Store filtered properties in state
  let filteredProperties = $state<Property[]>([]);
  let filteredFloors = $state<Floor[]>([]);
  let filteredRental_Units = $state<Rental_unit[]>([]);
  
  // Use effect for filtering and logging
  $effect(() => {
    filteredProperties = data.properties.filter((p) => p.status === 'ACTIVE');
    filteredFloors = data.floors.filter((f) => f.status === 'ACTIVE');
    filteredRental_Units = data.rental_unit.filter((r) => 
      r.rental_unit_status === 'VACANT' || r.rental_unit_status === 'OCCUPIED'
    );
    
    console.log('Form location type:', $form.location_type);
    console.log('Available properties:', filteredProperties.length);
    console.log('Available floors:', filteredFloors.length);
    console.log('Available rental units:', filteredRental_Units.length);
  });

  // Compute location label
  let locationLabel = $state('');
  
  $effect(() => {
    if (!$form.location_type) {
      locationLabel = '';
      return;
    }
    
    locationLabel = getLocationLabel(
      $form.location_type, 
      $form.location_type === 'PROPERTY' ? Number($form.property_id) : 
      $form.location_type === 'FLOOR' ? Number($form.floor_id) : 
      Number($form.rental_unit_id)
    );
  });

  function handleLocationTypeChange(type: string) {
    if (type === 'PROPERTY' || type === 'FLOOR' || type === 'RENTAL_UNIT') {
      $form.location_type = type;
      
      // Reset location IDs based on the selected type
      if (type !== 'PROPERTY') $form.property_id = null;
      if (type !== 'FLOOR') $form.floor_id = null;
      if (type !== 'RENTAL_UNIT') $form.rental_unit_id = null;
    }
  }

  function handleLocationChange(id: string) {
    const numId = Number(id);
    switch ($form.location_type) {
      case 'PROPERTY':
        $form.property_id = numId;
        break;
      case 'FLOOR':
        $form.floor_id = numId;
        break;
      case 'RENTAL_UNIT':
        $form.rental_unit_id = numId;
        break;
    }
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
      <div>
        <Label for="property_id">Property</Label>
        <Select.Root 
          type="single" 
          value={$form.property_id ? $form.property_id.toString() : ''} 
          onValueChange={handleLocationChange}
        >
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
                Floor {floor.floor_number}{floor.wing ? `, Wing ${floor.wing}` : ''}{floor.property ? ` - ${floor.property.name}` : ''}
              </Select.Item>
            {/each}
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
          </Select.Content>
        </Select.Root>
        {#if $errors.rental_unit_id}<span class="text-red-500">{$errors.rental_unit_id}</span>{/if}
      </div>
    {/if}

    <div>
      <Label for="type">Utility Type</Label>
      <Select.Root 
        type="single" 
        value={$form.type} 
        onValueChange={handleUtilityTypeChange}
      >
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

    <div>
      <Label for="initial_reading">Initial Reading</Label>
      <Input 
        type="number" 
        id="initial_reading" 
        bind:value={$form.initial_reading} 
        min="0" 
        step="0.01" 
        required 
      />
      {#if $errors.initial_reading}<span class="text-red-500">{$errors.initial_reading}</span>{/if}
    </div>

    <div>
      <Label for="unit_rate">Unit Rate</Label>
      <Input 
        type="number" 
        id="unit_rate" 
        bind:value={$form.unit_rate} 
        min="0" 
        step="0.01" 
        required 
      />
      {#if $errors.unit_rate}<span class="text-red-500">{$errors.unit_rate}</span>{/if}
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