<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import * as Alert from '$lib/components/ui/alert';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { utilityTypeEnum, meterStatusEnum, locationTypeEnum, type MeterFormData, meterFormSchema } from './formSchema';
  import type { Database } from '$lib/database.types';
  import { createEventDispatcher } from 'svelte';

  type Property = Database['public']['Tables']['properties']['Row'];
  type Floor = Database['public']['Tables']['floors']['Row'] & {
    property: Property | null;
  };
  type Room = Database['public']['Tables']['rooms']['Row'] & {
    floor: Floor | null;
  };

  export let form: SuperValidated<MeterFormData, any>;
  export let properties: Property[] = [];
  export let floors: Floor[] = [];
  export let rooms: Room[] = [];
  export let meter: MeterFormData | undefined = undefined;

  const dispatch = createEventDispatcher<{
    meterAdded: void;
    meterUpdated: void;
  }>();

  const { enhance, errors, delayed, message, form: formData } = superForm(form, {
    resetForm: true,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch(meter ? 'meterUpdated' : 'meterAdded');
      }
    }
  });

  $: if (meter) {
    $formData = {
      ...meter
    };
  }

  function getLocationLabel(type: string, id: number | null): string {
    if (!id) return '';
    
    switch (type) {
      case 'PROPERTY':
        return properties.find(p => p.id === id)?.name || '';
      case 'FLOOR':
        const floor = floors.find(f => f.id === id);
        return floor ? `${floor.property?.name || ''} - Floor ${floor.floor_number} ${floor.wing || ''}` : '';
      case 'ROOM':
        const room = rooms.find(r => r.id === id);
        return room ? `${room.floor?.property?.name || ''} - Floor ${room.floor?.floor_number || ''} - Room ${room.number}` : '';
      default:
        return '';
    }
  }

  $: filteredProperties = properties.filter(p => p.status === 'ACTIVE');
  $: filteredFloors = floors.filter(f => f.status === 'ACTIVE');
  $: filteredRooms = rooms.filter(r => r.room_status === 'VACANT' || r.room_status === 'OCCUPIED');

  $: locationLabel = $formData.location_type ? 
    getLocationLabel($formData.location_type, 
      $formData.location_type === 'PROPERTY' ? Number($formData.property_id) : 
      $formData.location_type === 'FLOOR' ? Number($formData.floor_id) : 
      Number($formData.rooms_id)
    ) : '';

  function handleLocationTypeChange(type: string) {
    if (type === 'PROPERTY' || type === 'FLOOR' || type === 'ROOM') {
      $formData.location_type = type;
      $formData.property_id = null;
      $formData.floor_id = null;
      $formData.rooms_id = null;
    }
  }

  function handleLocationChange(id: string) {
    const numId = Number(id);
    switch ($formData.location_type) {
      case 'PROPERTY':
        $formData.property_id = numId;
        break;
      case 'FLOOR':
        $formData.floor_id = numId;
        break;
      case 'ROOM':
        $formData.rooms_id = numId;
        break;
    }
  }
</script>

<form method="POST" use:enhance>
  <div class="space-y-4">
    {#if $message}
      <Alert.Root>
        <Alert.Title>{$message}</Alert.Title>
      </Alert.Root>
    {/if}

    <div>
      <Label for="name">Name</Label>
      <Input type="text" id="name" bind:value={$formData.name} maxlength={255} required />
      {#if $errors.name}<span class="text-red-500">{$errors.name}</span>{/if}
    </div>

    <div>
      <Label for="location_type">Location Type</Label>
      <Select.Root
        selected={{
          label: $formData.location_type || 'Select location type',
          value: $formData.location_type || ''
        }}
        onSelectedChange={(s) => {
          if (s?.value) {
            handleLocationTypeChange(s.value);
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select location type" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="PROPERTY">Property</Select.Item>
          <Select.Item value="FLOOR">Floor</Select.Item>
          <Select.Item value="ROOM">Room</Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.location_type}<span class="text-red-500">{$errors.location_type}</span>{/if}
    </div>

    {#if $formData.location_type === 'PROPERTY'}
      <div>
        <Label for="property_id">Property</Label>
        <Select.Root
          selected={{
            label: $formData.property_id ? getLocationLabel('PROPERTY', Number($formData.property_id)) : 'Select property',
            value: $formData.property_id?.toString() || ''
          }}
          onSelectedChange={(s) => {
            if (s?.value) {
              handleLocationChange(s.value);
            }
          }}
        >
          <Select.Trigger class="w-full">
            <Select.Value placeholder="Select property" />
          </Select.Trigger>
          <Select.Content>
            {#each filteredProperties as property}
              <Select.Item value={property.id.toString()}>{property.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if $errors.property_id}<span class="text-red-500">{$errors.property_id}</span>{/if}
      </div>
    {:else if $formData.location_type === 'FLOOR'}
      <div>
        <Label for="floor_id">Floor</Label>
        <Select.Root
          selected={{
            label: $formData.floor_id ? getLocationLabel('FLOOR', Number($formData.floor_id)) : 'Select floor',
            value: $formData.floor_id?.toString() || ''
          }}
          onSelectedChange={(s) => {
            if (s?.value) {
              handleLocationChange(s.value);
            }
          }}
        >
          <Select.Trigger class="w-full">
            <Select.Value placeholder="Select floor" />
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
    {:else if $formData.location_type === 'ROOM'}
      <div>
        <Label for="rooms_id">Room</Label>
        <Select.Root
          selected={{
            label: $formData.rooms_id ? getLocationLabel('ROOM', Number($formData.rooms_id)) : 'Select room',
            value: $formData.rooms_id?.toString() || ''
          }}
          onSelectedChange={(s) => {
            if (s?.value) {
              handleLocationChange(s.value);
            }
          }}
        >
          <Select.Trigger class="w-full">
            <Select.Value placeholder="Select room" />
          </Select.Trigger>
          <Select.Content>
            {#each filteredRooms as room}
              <Select.Item value={room.id.toString()}>
                Room {room.number}
                {#if room.floor?.property}
                  - {room.floor.property.name}
                {/if}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if $errors.rooms_id}<span class="text-red-500">{$errors.rooms_id}</span>{/if}
      </div>
    {/if}

    <div>
      <Label for="type">Utility Type</Label>
      <Select.Root
        selected={{
          label: $formData.type || 'Select utility type',
          value: $formData.type || ''
        }}
        onSelectedChange={(s) => {
          if (s?.value) {
            $formData.type = s.value;
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select utility type" />
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
        bind:value={$formData.initial_reading} 
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
        bind:value={$formData.unit_rate} 
        min="0" 
        step="0.01" 
        required 
      />
      {#if $errors.unit_rate}<span class="text-red-500">{$errors.unit_rate}</span>{/if}
    </div>

    <div>
      <Label for="status">Status</Label>
      <Select.Root
        selected={{
          label: $formData.status || 'Select status',
          value: $formData.status || ''
        }}
        onSelectedChange={(s) => {
          if (s?.value) {
            $formData.status = s.value;
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select status" />
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
      <Textarea id="notes" bind:value={$formData.notes} />
      {#if $errors.notes}<span class="text-red-500">{$errors.notes}</span>{/if}
    </div>

    <div class="flex justify-end gap-2">
      <Button type="submit" disabled={$delayed}>
        {#if $delayed}
          Saving...
        {:else}
          Save
        {/if}
      </Button>
    </div>
  </div>
</form>