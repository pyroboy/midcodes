<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { ZodValidation } from 'sveltekit-superforms/adapters';
  import * as Alert from '$lib/components/ui/alert';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { floorStatusEnum, type FloorSchema } from './formSchema';
  import type { Database } from '$lib/database.types';

  type Property = Database['public']['Tables']['properties']['Row'];

  export let form: SuperValidated<ZodValidation<FloorSchema>>;
  export let properties: Property[];

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
</script>

<form method="POST" use:enhance>
  <div class="space-y-4">
    {#if $message}
      <Alert.Root>
        <Alert.Title>{$message}</Alert.Title>
      </Alert.Root>
    {/if}

    <div>
      <Label for="property_id">Property</Label>
      <Select.Root
        selected={{ 
          label: properties.find(p => p.id === $form.property_id)?.name ?? 'Select property',
          value: $form.property_id?.toString() ?? ''
        }}
        onSelectedChange={(s) => {
          if (s) {
            $form.property_id = parseInt(s.value);
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select property" />
        </Select.Trigger>
        <Select.Content>
          {#each properties as property}
            <Select.Item value={property.id.toString()}>{property.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.property_id}<span class="text-red-500">{$errors.property_id}</span>{/if}
    </div>

    <div>
      <Label for="floor_number">Floor Number</Label>
      <Input type="number" id="floor_number" bind:value={$form.floor_number} required />
      {#if $errors.floor_number}<span class="text-red-500">{$errors.floor_number}</span>{/if}
    </div>

    <div>
      <Label for="wing">Wing</Label>
      <Input type="text" id="wing" bind:value={$form.wing} />
      {#if $errors.wing}<span class="text-red-500">{$errors.wing}</span>{/if}
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
            $form.status = s.value as typeof floorStatusEnum._type;
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select status" />
        </Select.Trigger>
        <Select.Content>
          {#each Object.values(floorStatusEnum.enum) as status}
            <Select.Item value={status}>{status}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.status}<span class="text-red-500">{$errors.status}</span>{/if}
    </div>

    <Button type="submit" disabled={$delayed}>
      {#if $delayed}
        Saving...
      {:else}
        Save Floor
      {/if}
    </Button>
  </div>
</form>
