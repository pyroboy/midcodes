<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import type { TenantSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';

  export let data: any;
  export let properties: any[] = [];
  export let rooms: any[] = [];
  export let users: any[] = [];
  export let editMode = false;
  export let tenant: TenantSchema | undefined = undefined;

  const dispatch = createEventDispatcher();

  $: filteredRooms = rooms.filter(r => r.property_id === $form.property_id);

  $: {
    if (tenant && editMode) {
      form.data.set({
        ...tenant
      });
    }
  }

  const { form, errors, enhance, submitting, reset } = superForm(data, {
    id: 'tenantForm',
    validators: zodClient(),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('tenantAdded');
        reset();
      }
    },
  });

  $: canEdit = data.isAdminLevel || (data.isStaffLevel && !editMode);
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
    <Label for="room_id">Room</Label>
    <Select.Root bind:value={$form.room_id} disabled={!$form.property_id || !canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select a room" />
      </Select.Trigger>
      <Select.Content>
        {#each filteredRooms as room}
          <Select.Item value={room.id}>Room {room.room_number}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.room_id}
      <p class="text-red-500 text-sm">{$errors.room_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="user_id">User</Label>
    <Select.Root bind:value={$form.user_id} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select a user" />
      </Select.Trigger>
      <Select.Content>
        {#each users as user}
          <Select.Item value={user.id}>{user.full_name} ({user.email})</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.user_id}
      <p class="text-red-500 text-sm">{$errors.user_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="tenant_status">Status</Label>
    <Select.Root bind:value={$form.tenant_status} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select status" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="ACTIVE">Active</Select.Item>
        <Select.Item value="INACTIVE">Inactive</Select.Item>
        <Select.Item value="PENDING">Pending</Select.Item>
        <Select.Item value="BLACKLISTED">Blacklisted</Select.Item>
      </Select.Content>
    </Select.Root>
    {#if $errors.tenant_status}
      <p class="text-red-500 text-sm">{$errors.tenant_status}</p>
    {/if}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="contract_start_date">Contract Start Date</Label>
      <Input
        type="date"
        id="contract_start_date"
        name="contract_start_date"
        bind:value={$form.contract_start_date}
        disabled={!canEdit}
      />
      {#if $errors.contract_start_date}
        <p class="text-red-500 text-sm">{$errors.contract_start_date}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="contract_end_date">Contract End Date</Label>
      <Input
        type="date"
        id="contract_end_date"
        name="contract_end_date"
        bind:value={$form.contract_end_date}
        disabled={!canEdit}
      />
      {#if $errors.contract_end_date}
        <p class="text-red-500 text-sm">{$errors.contract_end_date}</p>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="monthly_rate">Monthly Rate</Label>
      <Input
        type="number"
        id="monthly_rate"
        name="monthly_rate"
        bind:value={$form.monthly_rate}
        min="0"
        step="0.01"
        disabled={!canEdit}
      />
      {#if $errors.monthly_rate}
        <p class="text-red-500 text-sm">{$errors.monthly_rate}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="security_deposit">Security Deposit</Label>
      <Input
        type="number"
        id="security_deposit"
        name="security_deposit"
        bind:value={$form.security_deposit}
        min="0"
        step="0.01"
        disabled={!canEdit}
      />
      {#if $errors.security_deposit}
        <p class="text-red-500 text-sm">{$errors.security_deposit}</p>
      {/if}
    </div>
  </div>

  <div class="space-y-2">
    <Label>Emergency Contact</Label>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
      <div class="space-y-2">
        <Label for="emergency_contact.name">Name</Label>
        <Input
          type="text"
          id="emergency_contact.name"
          name="emergency_contact.name"
          bind:value={$form.emergency_contact?.name}
          disabled={!canEdit}
        />
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact.relationship">Relationship</Label>
        <Input
          type="text"
          id="emergency_contact.relationship"
          name="emergency_contact.relationship"
          bind:value={$form.emergency_contact?.relationship}
          disabled={!canEdit}
        />
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact.phone">Phone</Label>
        <Input
          type="tel"
          id="emergency_contact.phone"
          name="emergency_contact.phone"
          bind:value={$form.emergency_contact?.phone}
          disabled={!canEdit}
        />
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact.email">Email (Optional)</Label>
        <Input
          type="email"
          id="emergency_contact.email"
          name="emergency_contact.email"
          bind:value={$form.emergency_contact?.email}
          disabled={!canEdit}
        />
      </div>

      <div class="col-span-2 space-y-2">
        <Label for="emergency_contact.address">Address (Optional)</Label>
        <Input
          type="text"
          id="emergency_contact.address"
          name="emergency_contact.address"
          bind:value={$form.emergency_contact?.address}
          disabled={!canEdit}
        />
      </div>
    </div>
    {#if $errors.emergency_contact}
      <p class="text-red-500 text-sm">{$errors.emergency_contact}</p>
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
