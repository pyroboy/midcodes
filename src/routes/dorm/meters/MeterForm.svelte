<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { ZodValidation } from 'sveltekit-superforms/adapters';
  import * as Alert from '$lib/components/ui/alert';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { utilityTypeEnum, meterStatusEnum, type MeterSchema } from './formSchema';
  import type { Database } from '$lib/database.types';

  type Room = Database['public']['Tables']['rooms']['Row'] & {
    floor: { floor_number: number; wing: string | null } | null;
  };

  export let form: SuperValidated<ZodValidation<MeterSchema>>;
  export let rooms: Room[];

  const { enhance, errors, delayed, message } = superForm(form, {
    resetForm: true,
    onUpdated: ({ form }) => {
      if (form.data.id) {
        dispatch('success');
      }
    }
  });

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    success: void;
  }>();

  function getRoomLabel(room: Room): string {
    const floor = room.floor;
    if (!floor) return `Room ${room.name}`;
    return `Room ${room.name} (Floor ${floor.floor_number}${floor.wing ? ` Wing ${floor.wing}` : ''})`;
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
      <Label for="room_id">Room</Label>
      <Select.Root
        selected={{ 
          label: rooms.find(r => r.id === $form.room_id) ? getRoomLabel(rooms.find(r => r.id === $form.room_id)!) : 'Select room',
          value: $form.room_id?.toString() ?? ''
        }}
        onSelectedChange={(s) => {
          if (s) {
            $form.room_id = parseInt(s.value);
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select room" />
        </Select.Trigger>
        <Select.Content>
          {#each rooms as room}
            <Select.Item value={room.id.toString()}>{getRoomLabel(room)}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.room_id}<span class="text-red-500">{$errors.room_id}</span>{/if}
    </div>

    <div>
      <Label for="type">Type</Label>
      <Select.Root
        selected={{ 
          label: $form.type ?? 'Select type',
          value: $form.type ?? ''
        }}
        onSelectedChange={(s) => {
          if (s) {
            $form.type = s.value as typeof utilityTypeEnum._type;
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select type" />
        </Select.Trigger>
        <Select.Content>
          {#each Object.values(utilityTypeEnum.enum) as type}
            <Select.Item value={type}>{type}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.type}<span class="text-red-500">{$errors.type}</span>{/if}
    </div>

    <div>
      <Label for="name">Name</Label>
      <Input type="text" id="name" bind:value={$form.name} required />
      {#if $errors.name}<span class="text-red-500">{$errors.name}</span>{/if}
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
        selected={{ 
          label: $form.status ?? 'Select status',
          value: $form.status ?? ''
        }}
        onSelectedChange={(s) => {
          if (s) {
            $form.status = s.value as typeof meterStatusEnum._type;
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select status" />
        </Select.Trigger>
        <Select.Content>
          {#each Object.values(meterStatusEnum.enum) as status}
            <Select.Item value={status}>{status}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.status}<span class="text-red-500">{$errors.status}</span>{/if}
    </div>

    <div>
      <Label for="notes">Notes</Label>
      <Input type="text" id="notes" bind:value={$form.notes} />
      {#if $errors.notes}<span class="text-red-500">{$errors.notes}</span>{/if}
    </div>

    <Button type="submit" disabled={$delayed}>
      {#if $delayed}
        Saving...
      {:else}
        Save Meter
      {/if}
    </Button>
  </div>
</form>