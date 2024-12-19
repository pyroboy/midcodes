<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import { z } from 'zod';
  import type { PageData } from './$types';
  import type { Database } from '$lib/database.types';
  import type { SuperValidated } from 'sveltekit-superforms';
  
  const floorStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
  
  const floorSchema = z.object({
    id: z.number().optional(),
    property_id: z.number(),
    floor_number: z.number().int(),
    wing: z.string().optional().nullable(),
    status: floorStatusEnum
  });
  
  type Property = Database['public']['Tables']['properties']['Row'];
  type BaseFloor = Database['public']['Tables']['floors']['Row'];
  
  interface Floor extends BaseFloor {
    property: {
      name: string;
    } | null;
  }
  
  type FormData = z.infer<typeof floorSchema> & {
    [key: string]: unknown;
  };
  
  // Using type intersection instead of interface extension
  type ExtendedPageData = PageData & {
    form: SuperValidated<FormData>;
    isAdminLevel: boolean;
    isStaffLevel: boolean;
  };
  
  export let data: ExtendedPageData;
  export let properties: Property[] = [];
  export let editMode = false;
  export let floor: Floor | undefined = undefined;
  
  const dispatch = createEventDispatcher();
  
  const { form, errors, enhance, submitting, reset } = superForm<FormData>(data.form, {
    id: 'floorForm',
    validators: zodClient(floorSchema),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('floorAdded');
        reset();
      }
    },
  });
  
  $: {
    if (floor && editMode) {
      form.update($form => ({
        ...$form,
        id: floor.id,
        property_id: floor.property_id,
        floor_number: floor.floor_number,
        wing: floor.wing || undefined,
        status: floor.status
      }));
    }
  }
  
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
      <Select.Root>
        <Select.Trigger class="w-full" disabled={!canEdit}>
          <Select.Value>{properties.find(p => p.id === $form.property_id)?.name ?? 'Select property'}</Select.Value>
        </Select.Trigger>
        <Select.Content>
          {#each properties as property}
            <Select.Item 
              value={property.id.toString()} 
              on:click={() => form.update($form => ({ ...$form, property_id: property.id }))}
            >
              {property.name}
            </Select.Item>
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
      <Label for="wing">Wing</Label>
      <Input
        type="text"
        id="wing"
        name="wing"
        bind:value={$form.wing}
        disabled={!canEdit}
        placeholder="Optional"
      />
      {#if $errors.wing}
        <p class="text-red-500 text-sm">{$errors.wing}</p>
      {/if}
    </div>
  
    <div class="space-y-2">
      <Label for="status">Status</Label>
      <Select.Root>
        <Select.Trigger class="w-full" disabled={!canEdit}>
          <Select.Value>{$form.status ?? 'Select status'}</Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Item 
            value="ACTIVE" 
            on:click={() => form.update($form => ({ ...$form, status: 'ACTIVE' }))}
          >
            Active
          </Select.Item>
          <Select.Item 
            value="INACTIVE" 
            on:click={() => form.update($form => ({ ...$form, status: 'INACTIVE' }))}
          >
            Inactive
          </Select.Item>
          <Select.Item 
            value="MAINTENANCE" 
            on:click={() => form.update($form => ({ ...$form, status: 'MAINTENANCE' }))}
          >
            Maintenance
          </Select.Item>
        </Select.Content>
      </Select.Root>
      {#if $errors.status}
        <p class="text-red-500 text-sm">{$errors.status}</p>
      {/if}
    </div>
  
    <div class="flex justify-end gap-2">
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
        <Button variant="outline" on:click={() => dispatch('floorAdded')} disabled={$submitting}>
          Cancel
        </Button>
      {/if}
      <Button type="submit" disabled={$submitting || !canEdit}>
        {editMode ? 'Update' : 'Create'} Floor
      </Button>
    </div>
  </form>