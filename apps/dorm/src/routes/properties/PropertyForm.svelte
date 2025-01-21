<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { createEventDispatcher } from 'svelte';
  import type { PageData } from './$types';
  import { PropertyStatus, PropertyType } from './formSchema';
  import type { propertySchema } from './formSchema';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';

  interface Props {
    data: PageData;
    editMode?: boolean;
    form: SuperForm<z.infer<typeof propertySchema>>['form'];
    errors: SuperForm<z.infer<typeof propertySchema>>['errors'];
    enhance: SuperForm<z.infer<typeof propertySchema>>['enhance'];
    constraints: SuperForm<z.infer<typeof propertySchema>>['constraints'];
  }

  let {
    data,
    editMode = false,
    form,
    errors,
    enhance,
    constraints
  }: Props = $props();

  const dispatch = createEventDispatcher();

  // Initialize state for select fields with proper typing
  let selectedType = $state<string>($form.type || '');
  let selectedStatus = $state<string>($form.status || 'ACTIVE');

  // Create derived properties for select options
  const propertyTypes = Object.entries(PropertyType).map(([key]) => ({
    value: PropertyType[key as keyof typeof PropertyType],
    label: key.replace('_', ' ')
  }));

  const statusOptions = Object.entries(PropertyStatus).map(([key]) => ({
    value: PropertyStatus[key as keyof typeof PropertyStatus],
    label: key
  }));

  // Compute trigger content for select fields


  let triggerStatus = $derived($form.status || "Select a Status");
let triggerType = $derived($form.type || "Select a Type");

  // Effects to sync form state with select values
  $effect(() => {
  if (selectedType) {
    $form.type = selectedType as keyof typeof PropertyType;
  }
});

$effect(() => {
  if (selectedStatus) {
    $form.status = selectedStatus as keyof typeof PropertyStatus;
  }
});


  // Effects to sync select values with form state
  $effect(() => {
    const newType = $form.type;
    if (newType !== selectedType) {
      selectedType = newType;
    }
  });

  $effect(() => {
    const newStatus = $form.status;
    if (newStatus !== selectedStatus) {
      selectedStatus = newStatus;
    }
  });

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

  <div class="space-y-4">
    <div class="space-y-2">
      <Label for="name">Name</Label>
      <Input
        type="text"
        id="name"
        name="name"
        bind:value={$form.name}
        class="w-full"
        data-error={!!$errors.name}
        aria-invalid={!!$errors.name}
        {...$constraints.name}
      />
      {#if $errors.name}
        <p class="text-sm font-medium text-destructive">{$errors.name}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="address">Address</Label>
      <Input
        type="text"
        id="address"
        name="address"
        bind:value={$form.address}
        class="w-full"
        data-error={!!$errors.address}
        aria-invalid={!!$errors.address}
        {...$constraints.address}
      />
      {#if $errors.address}
        <p class="text-sm font-medium text-destructive">{$errors.address}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="type">Type</Label>
      <Select.Root    
        type="single"
        name="type"
        bind:value={selectedType}
      >
        <Select.Trigger 
          class="w-full"
          data-error={!!$errors.type}
          {...$constraints.type}
        >
          {triggerType}
        </Select.Trigger>
        <Select.Content>
          {#each propertyTypes as type}
            <Select.Item value={type.value}>
              {type.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.type}
        <p class="text-sm font-medium text-destructive">{$errors.type}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="status">Status</Label>
      <Select.Root    
        type="single"
        name="status"
        bind:value={selectedStatus}
      >
        <Select.Trigger 
          class="w-full"
          data-error={!!$errors.status}
          {...$constraints.status}
        >
          {triggerStatus}
        </Select.Trigger>
        <Select.Content>
          {#each statusOptions as status}
            <Select.Item value={status.value}>
              {status.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.status}
        <p class="text-sm font-medium text-destructive">{$errors.status}</p>
      {/if}
    </div>

    <div class="flex justify-end space-x-2">
      <Button type="submit">
        {editMode ? 'Update' : 'Create'} Property
      </Button>
      {#if editMode}
        <Button 
          type="button" 
          variant="destructive" 
          onclick={handleCancel}
        >
          Cancel
        </Button>
      {/if}
    </div>
  </div>
</form>

<style>
  :global([data-error="true"]) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
</style>