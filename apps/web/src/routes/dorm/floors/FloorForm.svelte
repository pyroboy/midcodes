<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import { floorStatusEnum } from './formSchema';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import type { floorSchema } from './formSchema';
  import type { Floor, FloorWithProperty } from './formSchema';
  interface Property {
    id: number;
    name: string;
  }



  interface PageData {
    properties: Property[];
    floors: Array<Floor & { property: Property }>;
  }

  interface SelectItem {
    value: string;
    label: string;
  }

  interface Props {
    data: PageData;
    editMode?: boolean;
    form: SuperForm<z.infer<typeof floorSchema>>['form'];
    errors: SuperForm<z.infer<typeof floorSchema>>['errors'];
    enhance: SuperForm<z.infer<typeof floorSchema>>['enhance'];
    constraints: SuperForm<z.infer<typeof floorSchema>>['constraints'];
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

  function handlePropertyChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      const propertyId = parseInt(s.value, 10);
      if (!isNaN(propertyId)) {
        $form.property_id = propertyId;
      }
    }
  }

  function handleStatusChange(selected: unknown) {
    const s = selected as SelectItem;
    if (s?.value) {
      $form.status = s.value as typeof floorStatusEnum._type;
    }
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

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <input type="hidden" name="property_id" bind:value={$form.property_id} />
    <Select.Root    
      selected={{ 
        value: $form.property_id?.toString() || '', 
        label: data.properties.find(p => p.id === $form.property_id)?.name || 'Select a property' 
      }}
      onSelectedChange={handlePropertyChange}
    >
      <Select.Trigger data-error={!!$errors.property_id}>
        <Select.Value placeholder="Select a property" />
      </Select.Trigger>
      <Select.Content>
        {#each data.properties as property}
          <Select.Item value={property.id.toString()}>
            {property.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.property_id}
      <p class="text-sm font-medium text-destructive">{$errors.property_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="floor_number">Floor Number</Label>
    <Input 
      type="number" 
      id="floor_number" 
      name="floor_number" 
      min="1"
      bind:value={$form.floor_number}
      class="w-full"
      data-error={!!$errors.floor_number}
      aria-invalid={!!$errors.floor_number}
      {...$constraints.floor_number}
    />
    {#if $errors.floor_number}
      <p class="text-sm font-medium text-destructive">{$errors.floor_number}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="wing">Wing</Label>
    <Input 
      type="text" 
      id="wing" 
      name="wing" 
      bind:value={$form.wing}
      class="w-full"
      data-error={!!$errors.wing}
      aria-invalid={!!$errors.wing}
      {...$constraints.wing}
      placeholder="Optional"
    />
    {#if $errors.wing}
      <p class="text-sm font-medium text-destructive">{$errors.wing}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="status">Status</Label>
    <Select.Root    
      selected={{ 
        value: $form.status || '', 
        label: $form.status || 'Select a status' 
      }}
      onSelectedChange={handleStatusChange}
    >
      <Select.Trigger 
        data-error={!!$errors.status}
        {...$constraints.status}
      >
        <Select.Value placeholder="Select a status" />
      </Select.Trigger>
      <Select.Content>
        {#each floorStatusEnum.options as status}
          <Select.Item value={status}>
            {status}
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
      {editMode ? 'Update' : 'Add'} Floor
    </Button>
    {#if editMode}
      <Button type="button" variant="destructive" on:click={() => dispatch('cancel')}>
        Cancel
      </Button>
    {/if}
  </div>
</form>

<style>
  :global([data-error="true"]) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
</style>
