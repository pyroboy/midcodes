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
  import type {PageData} from './$types';


  interface Props {
    data: PageData;
    editMode?: boolean;
    form: SuperForm<z.infer<typeof floorSchema>>['form'];
    errors: SuperForm<z.infer<typeof floorSchema>>['errors'];
    enhance: SuperForm<z.infer<typeof floorSchema>>['enhance'];
    constraints: SuperForm<z.infer<typeof floorSchema>>['constraints'];
  }

  let { data, editMode = false, form, errors, enhance, constraints }: Props = $props();



  const dispatch = createEventDispatcher();

     // START : PATTERN FOR DATABASE BASED SELECTION ITEMS
  let derivedProperties = $derived(data.properties.map(p => ({ value: p.id.toString(), label: p.name })));
  let selectedProperty = {
    get value() { 
      return $form.property_id ? $form.property_id.toString() : '';
    },
    set value(id: string) { 
      $form.property_id = id ? Number(id) : 0;
      // Reset validation errors when property changes
      if ($errors.property_id) {
        $errors.property_id = undefined;
      }
    }
  };
  let triggerContent = $derived(
    selectedProperty.value 
      ? data.properties.find(p => p.id.toString() === selectedProperty.value)?.name ?? "Select a property"
      : "Select a property"
  );
    // END : PATTERN FOR DATABASE BASED SELECTION ITEMS


  // START: PATTERN FOR ENUM BASED SELECTION ITEMS
  let derivedStatuses = $derived(
    Object.values(floorStatusEnum.Values).map(status => ({
      value: status,
      label: status.replace('_', ' ')
    }))
  );
  let selectedStatus = {
    get value() { 
      return $form.status as keyof typeof floorStatusEnum.Values;
    },
    set value(status: keyof typeof floorStatusEnum.Values) { 
      $form.status = status || 'ACTIVE';
    }
  };
  let triggerStatus = $derived(
    selectedStatus.value
      ? selectedStatus.value.replace('_', ' ')
      : "Select a Status"
  );
  // END: PATTERN FOR ENUM BASED SELECTION ITEMS

  // For debugging
  $effect(() => {
    console.log('Form State:', {
      property_id: $form.property_id,
      floor_number: $form.floor_number,
      wing: $form.wing,
      status: $form.status
    });
  });
</script>

<form method="POST" action={editMode ? "?/update" : "?/create"} use:enhance class="space-y-4" novalidate >
  {#if editMode && $form.id}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <Select.Root    
      type="single"
      name="property_id"
      bind:value={selectedProperty.value}
    >
      <Select.Trigger 
        class="w-full"
        data-error={!!$errors.property_id}
        {...$constraints.property_id}
      >
        {triggerContent}
      </Select.Trigger>
      <Select.Content>
        {#each derivedProperties as property}
          <Select.Item value={property.value}>
            {property.label}
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
      type="single"
      name="status"
      bind:value={selectedStatus.value}
    >
      <Select.Trigger 
        class="w-full"
        data-error={!!$errors.status}
        {...$constraints.status}
      >
        {triggerStatus}
      </Select.Trigger>
      <Select.Content>
        {#each derivedStatuses as status}
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
      {editMode ? 'Update' : 'Add'} Floor
    </Button>
    {#if editMode}
      <Button type="button" variant="destructive" onclick={() => dispatch('cancel')}>
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