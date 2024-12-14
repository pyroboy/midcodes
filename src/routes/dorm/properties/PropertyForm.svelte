<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';

  export let data: any;
  export let editMode = false;
  export let property: any | undefined = undefined;

  const dispatch = createEventDispatcher();

  $: {
    if (property && editMode) {
      form.data.set({
        ...property
      });
    }
  }

  const { form, errors, enhance, submitting, reset } = superForm(data, {
    id: 'propertyForm',
    validators: zodClient(),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('propertyAdded');
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
    <Label for="name">Property Name</Label>
    <Input
      id="name"
      name="name"
      bind:value={$form.name}
      placeholder="Enter property name"
      class="w-full"
    />
    {#if $errors.name}
      <span class="text-red-500 text-sm">{$errors.name}</span>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="address">Address</Label>
    <Input
      id="address"
      name="address"
      bind:value={$form.address}
      placeholder="Enter address"
      class="w-full"
    />
    {#if $errors.address}
      <span class="text-red-500 text-sm">{$errors.address}</span>
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
