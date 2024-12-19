<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import type { MeterSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';

  export let data: any;
  export let rooms: any[] = [];
  export let editMode = false;
  export let meter: MeterSchema | undefined = undefined;

  const dispatch = createEventDispatcher();

  $: {
    if (meter && editMode) {
      form.data.set({
        ...meter
      });
    }
  }

  const { form, errors, enhance, submitting, reset } = superForm(data, {
    id: 'meterForm',
    validators: zodClient(),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('meterAdded');
        reset();
      }
    },
  });

  $: canEdit = data.isAdminLevel || data.isUtility;
  $: canDelete = data.isAdminLevel;
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4 p-4 bg-white rounded-lg shadow"
>
  <input type="hidden" name="id" bind:value={$form.id} />

  <div class="space-y-2">
    <Label for="room_id">Room</Label>
    <Select.Root bind:value={$form.room_id} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select a room" />
      </Select.Trigger>
      <Select.Content>
        {#each rooms as room}
          <Select.Item value={room.id}>
            Room {room.room_number}
            {#if room.floor}
              - Floor {room.floor.floor_number}
              {#if room.floor.wing}
                Wing {room.floor.wing}
              {/if}
              ({room.floor.property?.name})
            {/if}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.room_id}
      <p class="text-red-500 text-sm">{$errors.room_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="type">Type</Label>
    <Select.Root bind:value={$form.type} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select utility type" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="WATER">Water</Select.Item>
        <Select.Item value="ELECTRICITY">Electricity</Select.Item>
        <Select.Item value="GAS">Gas</Select.Item>
      </Select.Content>
    </Select.Root>
    {#if $errors.type}
      <p class="text-red-500 text-sm">{$errors.type}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="name">Meter Name</Label>
    <Input
      type="text"
      id="name"
      name="name"
      bind:value={$form.name}
      disabled={!canEdit}
    />
    {#if $errors.name}
      <p class="text-red-500 text-sm">{$errors.name}</p>
    {/if}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="initial_reading">Initial Reading</Label>
      <Input
        type="number"
        id="initial_reading"
        name="initial_reading"
        bind:value={$form.initial_reading}
        min="0"
        step="0.01"
        disabled={!canEdit}
      />
      {#if $errors.initial_reading}
        <p class="text-red-500 text-sm">{$errors.initial_reading}</p>
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
        disabled={!canEdit}
      />
      {#if $errors.unit_rate}
        <p class="text-red-500 text-sm">{$errors.unit_rate}</p>
      {/if}
    </div>
  </div>

  <div class="space-y-2">
    <Label for="status">Status</Label>
    <Select.Root bind:value={$form.status} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select status" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="ACTIVE">Active</Select.Item>
        <Select.Item value="INACTIVE">Inactive</Select.Item>
        <Select.Item value="MAINTENANCE">Maintenance</Select.Item>
      </Select.Content>
    </Select.Root>
    {#if $errors.status}
      <p class="text-red-500 text-sm">{$errors.status}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="notes">Notes</Label>
    <Textarea
      id="notes"
      name="notes"
      bind:value={$form.notes}
      disabled={!canEdit}
      rows="3"
    />
    {#if $errors.notes}
      <p class="text-red-500 text-sm">{$errors.notes}</p>
    {/if}
  </div>

  <div class="flex justify-end space-x-2">
    {#if editMode}
      {#if canDelete}
        <Button
          type="submit"
          formaction="?/delete"
          variant="destructive"
          disabled={$submitting}
        >
          Delete
        </Button>
      {/if}
      {#if canEdit}
        <Button type="submit" disabled={$submitting}>
          Update
        </Button>
      {/if}
    {:else if canEdit}
      <Button type="submit" disabled={$submitting}>
        Create
      </Button>
    {/if}
  </div>
</form>