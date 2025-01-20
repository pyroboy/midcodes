<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { createEventDispatcher } from 'svelte';
  import type { PageData } from './$types';
  import { PropertyStatus, PropertyType } from './formSchema';

  interface Props {
    data: PageData;
    editMode?: boolean;
    property?: any | undefined;
  }

  let { data, editMode = false, property = $bindable(undefined) }: Props = $props();

  const dispatch = createEventDispatcher();

  const { form, errors, enhance } = superForm(data.form, {
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('propertyAdded');
      }
    }
  });

  let action = $derived(editMode ? '?/update' : '?/create');

  const propertyTypes = Object.entries(PropertyType).map(([value]) => ({
    value,
    label: value.replace('_', ' ')
  }));

  const statusOptions = Object.entries(PropertyStatus).map(([value]) => ({
    value,
    label: value
  }));
</script>

<form method="POST" {action} use:enhance>
  {#if editMode && property}
    <input type="hidden" name="id" bind:value={property.id} />
  {/if}

  <div class="space-y-4">
    <div class="space-y-2">
      <Label for="name">Name</Label>
      <Input
        id="name"
        name="name"
        value={property?.name ?? ''}
      />
      {#if $errors.name}
        <p class="text-sm text-red-500">{$errors.name[0]}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="address">Address</Label>
      <Input
        id="address"
        name="address"
        value={property?.address ?? ''}
      />
      {#if $errors.address}
        <p class="text-sm text-red-500">{$errors.address[0]}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="type">Type</Label>
      <Select.Root
        name="type"
        items={propertyTypes}
        selected={property?.type}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select property type" />
        </Select.Trigger>
        <Select.Content>
          {#each propertyTypes as type}
            <Select.Item value={type.value}>{type.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.type}
        <p class="text-sm text-red-500">{$errors.type[0]}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="status">Status</Label>
      <Select.Root
        name="status"
        items={statusOptions}
        selected={property?.status ?? 'ACTIVE'}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select status" />
        </Select.Trigger>
        <Select.Content>
          {#each statusOptions as status}
            <Select.Item value={status.value}>{status.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.status}
        <p class="text-sm text-red-500">{$errors.status[0]}</p>
      {/if}
    </div>

    <div class="flex justify-end space-x-2">
      <Button type="submit">
        {editMode ? 'Update' : 'Create'} Property
      </Button>
    </div>
  </div>
</form>
