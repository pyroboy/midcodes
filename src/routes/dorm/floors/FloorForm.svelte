<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';

  export let data: any;
  export let properties: any[] = [];
  export let editMode = false;
  export let floor: any | undefined = undefined;

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
</script>

<form
  method="POST"
  action="?/create"
  use:enhance
  class="space-y-4 p-4 bg-white rounded-lg shadow"
>
  <input type="hidden" name="id" bind:value={$form.id} />

  <div class="space-y-2">
    <Label for="propertyId">Property</Label>
    <Select.Root bind:value={$form.propertyId}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select property" />
      </Select.Trigger>
      <Select.Content>
        {#each properties as property}
          <Select.Item value={property.id}>{property.name}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.propertyId}
      <span class="text-red-500 text-sm">{$errors.propertyId}</span>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="name">Floor Name</Label>
    <Input
      id="name"
      name="name"
      bind:value={$form.name}
      placeholder="Enter floor name"
      class="w-full"
    />
    {#if $errors.name}
      <span class="text-red-500 text-sm">{$errors.name}</span>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="floorNumber">Floor Number</Label>
    <Input
      id="floorNumber"
      name="floorNumber"
      type="number"
      bind:value={$form.floorNumber}
      placeholder="Enter floor number"
      class="w-full"
    />
    {#if $errors.floorNumber}
      <span class="text-red-500 text-sm">{$errors.floorNumber}</span>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="description">Description</Label>
    <Input
      id="description"
      name="description"
      bind:value={$form.description}
      placeholder="Enter description"
      class="w-full"
    />
  </div>

  <div class="space-y-2">
    <Label for="status">Status</Label>
    <Select.Root bind:value={$form.status}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select status" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="ACTIVE">Active</Select.Item>
        <Select.Item value="INACTIVE">Inactive</Select.Item>
        <Select.Item value="MAINTENANCE">Maintenance</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>

  <div class="flex justify-end space-x-2">
    {#if editMode}
      <Button
        type="submit"
        formaction="?/delete"
        variant="destructive"
        disabled={$submitting}
      >
        Delete
      </Button>
      <Button
        type="submit"
        formaction="?/update"
        variant="default"
        disabled={$submitting}
      >
        Update
      </Button>
    {:else}
      <Button type="submit" variant="default" disabled={$submitting}>
        Create
      </Button>
    {/if}
  </div>
</form>
