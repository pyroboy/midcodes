<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import type { FloorSchema } from './formSchema';

  export let data: any;
  export let properties: any[] = [];
  export let editMode = false;
  export let floor: FloorSchema | undefined = undefined;

  const dispatch = createEventDispatcher();

  $: {
    if (floor && editMode) {
      form.data.set({
        ...floor
      });
    }
  }

  const { form, errors, enhance, submitting, reset } = superForm(data, {
    id: 'floorForm',
    validators: zodClient(),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('floorAdded');
        reset();
      }
    },
  });

  $: canEdit = data.isAdminLevel || data.isStaffLevel;
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
    <Label for="property_id">Property</Label>
    <Select.Root bind:value={$form.property_id} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select a property" />
      </Select.Trigger>
      <Select.Content>
        {#each properties as property}
          <Select.Item value={property.id}>{property.name}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.property_id}
      <p class="text-red-500 text-sm">{$errors.property_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="floor_number">Floor Number</Label>
    <Input
      type="number"
      id="floor_number"
      name="floor_number"
      bind:value={$form.floor_number}
      disabled={!canEdit}
    />
    {#if $errors.floor_number}
      <p class="text-red-500 text-sm">{$errors.floor_number}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="wing">Wing (Optional)</Label>
    <Input
      type="text"
      id="wing"
      name="wing"
      bind:value={$form.wing}
      disabled={!canEdit}
    />
    {#if $errors.wing}
      <p class="text-red-500 text-sm">{$errors.wing}</p>
    {/if}
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
