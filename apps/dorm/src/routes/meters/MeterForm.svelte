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

  // Use props with no type argument

  let {
    data,
    editMode = false,
    form,
    errors,
    enhance,
    constraints,
    submitting,
  }: Props = $props();


 

  // Debug logs
  // console.log('MeterForm Component - editMode:', editMode);
  // console.log('MeterForm Component - form data:', $form);
  // console.log('MeterForm Component - selected meter:', data.meter);

  const dispatch = createEventDispatcher<{
    meterAdded: void;
    meterUpdated: void;
    cancel: void;
  }>();

  // State for delete confirmation
  let showDeleteConfirm = $state(false);

  // Using $derived instead of $effect + $state
  let filteredProperties = $derived(
    (data.properties || []).filter((p) => p.status === 'ACTIVE')
  );
  
  let filteredFloors = $derived(
    (data.floors || []).filter((f) => f.status === 'ACTIVE')
  );
  
  let filteredRental_Units = $derived(
    (data.rental_unit || []).filter((r) => 
      r.rental_unit_status === 'VACANT' || r.rental_unit_status === 'OCCUPIED'
    )
  );

  function getLocationLabel(type: string, id: number | null): string {
    if (!id) return '';
    
    switch (type) {
      case 'PROPERTY':
        return data.properties?.find((p) => p.id === id)?.name || '';
      case 'FLOOR':
        const floor = data.floors?.find((f) => f.id === id);
        return floor ? `${floor.property?.name || ''} - Floor ${floor.floor_number} ${floor.wing || ''}` : '';
      case 'RENTAL_UNIT':
        const unit = data.rental_unit?.find((r) => r.id === id);
        return unit ? `${unit.floor?.property?.name || ''}  -  ${unit.name}` : '';
      default:
        return '';
    }
  }

  // Updated function to preserve property_id when location type changes
  function handleLocationTypeChange(type: string) {
    if (type === 'PROPERTY' || type === 'FLOOR' || type === 'RENTAL_UNIT') {
      $form.location_type = type;
      
      // Reset only the IDs that aren't relevant to the current type
      // But never reset property_id (it should stay the same)
      if (type !== 'FLOOR') $form.floor_id = null;
      if (type !== 'RENTAL_UNIT') $form.rental_unit_id = null;
      
      // If changing to PROPERTY and we already have a property_id, keep it
      // Otherwise if we're changing away from PROPERTY and have no property_id, try to derive it
      if (type !== 'PROPERTY' && !$form.property_id) {
        // Try to derive property_id from the current view context if possible
        // This is just a fallback - normally property_id should be explicitly selected
        if (data.properties && data.properties.length === 1) {
          $form.property_id = data.properties[0].id;
        }
      }
    }
  }

  // Updated function to handle location selection
  function handleLocationChange(id: string) {
    const numId = Number(id);
    switch ($form.location_type) {
      case 'PROPERTY':
        $form.property_id = numId;
        // When property changes, clear floor and rental_unit
        $form.floor_id = null;
        $form.rental_unit_id = null;
        break;
        
      case 'FLOOR':
        $form.floor_id = numId;
        // When floor changes, clear rental_unit but set property based on floor
        $form.rental_unit_id = null;
        
        // Automatically set property_id from the selected floor
        const floor = data.floors?.find(f => f.id === numId);
        if (floor?.property?.id) {
          $form.property_id = floor.property.id;
        }
        break;
        
      case 'RENTAL_UNIT':
        $form.rental_unit_id = numId;
        
        // Automatically set property_id and floor_id from the selected rental unit
        const unit = data.rental_unit?.find(r => r.id === numId);
        if (unit?.floor?.id) {
          $form.floor_id = unit.floor.id;
          
          if (unit.floor?.property?.id) {
            $form.property_id = unit.floor.property.id;
          }
        }
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

  function askDeleteConfirmation() {
    console.log("Asking for delete confirmation");
    showDeleteConfirm = true;
  }

  function cancelDelete() {
    showDeleteConfirm = false;
  }
</script>

{#if showDeleteConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-medium mb-4">Confirm Deletion</h3>
      <p class="mb-4">Are you sure you want to delete this meter? This action cannot be undone.</p>
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          class="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onclick={cancelDelete}
        >
          Cancel
        </button>
        <form method="POST" action="?/delete">
          <input type="hidden" name="id" value={$form.id} />
          <button 
            type="submit"
            class="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Meter
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<form method="POST" action={editMode ? "?/update" : "?/create"} use:enhance class="space-y-3">
  {#if $form.id}
    <input type="hidden" name="id" value={$form.id} />
  {/if}

  <div>
    <Label for="name" class="text-sm font-medium">Name</Label>
    <Input type="text" id="name" bind:value={$form.name} maxlength={255} required />
    {#if $errors.name}<span class="text-xs text-red-500">{$errors.name}</span>{/if}
  </div>

  <div>
    <Label for="initial_reading" class="text-sm font-medium">Initial Reading</Label>
    <Input 
      type="number" 
      id="initial_reading" 
      bind:value={$form.initial_reading} 
      step="0.01"
      min="0"
      required 
    />
    {#if $errors.initial_reading}<span class="text-xs text-red-500">{$errors.initial_reading}</span>{/if}
  </div>
  



  <div>
    <Label for="location_type" class="text-sm font-medium">Location Type</Label>
    <Select.Root type="single" value={$form.location_type} onValueChange={handleLocationTypeChange}>
      <Select.Trigger class="w-full">
        <span>{$form.location_type || 'Select location type'}</span>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="PROPERTY">Property</Select.Item>
        <Select.Item value="FLOOR">Floor</Select.Item>
        <Select.Item value="RENTAL_UNIT">Rental Unit</Select.Item>
      </Select.Content>
    </Select.Root>
    {#if $errors.location_type}<span class="text-xs text-red-500">{$errors.location_type}</span>{/if}
  </div>

  {#if $form.location_type === 'PROPERTY'}
    <div>
      <Label for="property_id" class="text-sm font-medium">Property</Label>
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
      {#if $errors.property_id}<span class="text-xs text-red-500">{$errors.property_id}</span>{/if}
    </div>
  {:else if $form.location_type === 'FLOOR'}
    <div>
      <Label for="floor_id" class="text-sm font-medium">Floor</Label>
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
      {#if $errors.floor_id}<span class="text-xs text-red-500">{$errors.floor_id}</span>{/if}
    </div>
  {:else if $form.location_type === 'RENTAL_UNIT'}
    <div>
      <Label for="rental_unit_id" class="text-sm font-medium">Rental Unit</Label>
      <Select.Root 
        type="single" 
        value={$form.rental_unit_id ? $form.rental_unit_id.toString() : ''}
        onValueChange={handleLocationChange}
      >
        <Select.Trigger class="w-full">
          <span>
            {$form.rental_unit_id 
              ? getLocationLabel('RENTAL_UNIT', Number($form.rental_unit_id)) 
              : 'Select rental unit'}
          </span>
        </Select.Trigger>
        <Select.Content>
          {#each filteredRental_Units as rental_unit}
            <Select.Item value={rental_unit.id.toString()}>
              {rental_unit.name || ''}
              <!-- Unit {rental_unit.number}
              {#if rental_unit.floor?.property}
                - {rental_unit.floor.property.name}
              {/if} -->
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.rental_unit_id}<span class="text-xs text-red-500">{$errors.rental_unit_id}</span>{/if}
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-3">
    <div>
      <Label for="type" class="text-sm font-medium">Utility Type</Label>
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
      {#if $errors.type}<span class="text-xs text-red-500">{$errors.type}</span>{/if}
    </div>

    <div>
      <Label for="status" class="text-sm font-medium">Status</Label>
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
      {#if $errors.status}<span class="text-xs text-red-500">{$errors.status}</span>{/if}
    </div>
  </div>

  <div>
    <Label for="notes" class="text-sm font-medium">Notes</Label>
    <Textarea id="notes" bind:value={$form.notes} rows={3} />
    {#if $errors.notes}<span class="text-xs text-red-500">{$errors.notes}</span>{/if}
  </div>

  <div class="flex justify-between items-center pt-3">
    <!-- Delete button - always visible in edit mode -->
    {#if editMode}
      <button 
        type="button" 
        class="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        onclick={askDeleteConfirmation}
      >
        Delete
      </button>
    {:else}
      <div></div> <!-- Empty div for spacing when not in edit mode -->
    {/if}

    <div class="flex space-x-2">
      <button 
        type="button" 
        class="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        onclick={handleCancel}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        class="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={$submitting}
      >
        {editMode ? 'Update' : 'Create'} Meter
      </button>
    </div>
  </div>
</form>