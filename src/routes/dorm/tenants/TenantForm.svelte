<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import { tenantSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import type { Database } from '$lib/database.types';

  type Property = Database['public']['Tables']['properties']['Row'];
  type Room = Database['public']['Tables']['rooms']['Row'];
  type User = Database['public']['Tables']['profiles']['Row'];

  interface PageData {
    form: z.infer<typeof tenantSchema>;
    properties: Property[];
    rooms: Room[];
    users: User[];
    isAdminLevel: boolean;
    isStaffLevel: boolean;
  }

  export let data: PageData;
  export let editMode = false;
  export let tenant: z.infer<typeof tenantSchema> | undefined = undefined;

  const dispatch = createEventDispatcher();

  const { form, errors, enhance, submitting, reset } = superForm(data.form, {
    id: 'tenantForm',
    validators: zodClient(tenantSchema),
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dispatch('tenantAdded');
        reset();
      }
    },
  });

  $: {
    if (tenant && editMode) {
      $form = tenant;
    }
  }

  $: filteredRooms = data.rooms.filter(r => r.property_id === $form.property_id);
  $: canEdit = data.isAdminLevel || (data.isStaffLevel && !editMode);
  $: canDelete = data.isAdminLevel;

  function updatePropertyId(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.property_id = parseInt(selected.value);
    }
  }

  function updateRoomId(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.room_id = parseInt(selected.value);
    }
  }

  function updateUserId(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.user_id = selected.value;
    }
  }

  function updateTenantStatus(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.tenant_status = selected.value as z.infer<typeof tenantSchema>['tenant_status'];
    }
  }

  let emergencyContact = {
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: ''
  };

  $: {
    if ($form.emergency_contact) {
      emergencyContact = $form.emergency_contact;
    } else {
      $form.emergency_contact = emergencyContact;
    }
  }
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4"
>
  <input type="hidden" name="id" bind:value={$form.id} />

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <Select.Root
      onSelectedChange={updatePropertyId}
    >
      <Select.Trigger class="w-full" disabled={!canEdit}>
        <Select.Value placeholder="Select property" />
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
      <p class="text-red-500 text-sm">{$errors.property_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="room_id">Room</Label>
    <Select.Root
      onSelectedChange={updateRoomId}
    >
      <Select.Trigger class="w-full" disabled={!canEdit || !$form.property_id}>
        <Select.Value placeholder="Select room" />
      </Select.Trigger>
      <Select.Content>
        {#each filteredRooms as room}
          <Select.Item value={room.id.toString()}>
            Room {room.room_number}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.room_id}
      <p class="text-red-500 text-sm">{$errors.room_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="user_id">User</Label>
    <Select.Root
      onSelectedChange={updateUserId}
    >
      <Select.Trigger class="w-full" disabled={!canEdit}>
        <Select.Value placeholder="Select user" />
      </Select.Trigger>
      <Select.Content>
        {#each data.users as user}
          <Select.Item value={user.id}>
            {user.email}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.user_id}
      <p class="text-red-500 text-sm">{$errors.user_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="tenant_status">Status</Label>
    <Select.Root
      onSelectedChange={updateTenantStatus}
    >
      <Select.Trigger class="w-full" disabled={!canEdit}>
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
        <Label for="emergency_contact_name">Name</Label>
        <Input
          type="text"
          id="emergency_contact_name"
          bind:value={emergencyContact.name}
          disabled={!canEdit}
        />
        {#if $errors.emergency_contact?.name}
          <p class="text-red-500 text-sm">{$errors.emergency_contact.name}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact_relationship">Relationship</Label>
        <Input
          type="text"
          id="emergency_contact_relationship"
          bind:value={emergencyContact.relationship}
          disabled={!canEdit}
        />
        {#if $errors.emergency_contact?.relationship}
          <p class="text-red-500 text-sm">{$errors.emergency_contact.relationship}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact_phone">Phone</Label>
        <Input
          type="tel"
          id="emergency_contact_phone"
          bind:value={emergencyContact.phone}
          disabled={!canEdit}
        />
        {#if $errors.emergency_contact?.phone}
          <p class="text-red-500 text-sm">{$errors.emergency_contact.phone}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact_email">Email</Label>
        <Input
          type="email"
          id="emergency_contact_email"
          bind:value={emergencyContact.email}
          disabled={!canEdit}
        />
        {#if $errors.emergency_contact?.email}
          <p class="text-red-500 text-sm">{$errors.emergency_contact.email}</p>
        {/if}
      </div>

      <div class="col-span-2 space-y-2">
        <Label for="emergency_contact_address">Address</Label>
        <Textarea
          id="emergency_contact_address"
          bind:value={emergencyContact.address}
          disabled={!canEdit}
        />
        {#if $errors.emergency_contact?.address}
          <p class="text-red-500 text-sm">{$errors.emergency_contact.address}</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="space-y-2">
    <Label for="notes">Notes</Label>
    <Textarea
      id="notes"
      bind:value={$form.notes}
      disabled={!canEdit}
    />
    {#if $errors.notes}
      <p class="text-red-500 text-sm">{$errors.notes}</p>
    {/if}
  </div>

  {#if canEdit}
    <div class="flex justify-end gap-2">
      {#if editMode && canDelete}
        <Button type="submit" formaction="?/delete" variant="destructive" disabled={$submitting}>
          Delete
        </Button>
      {/if}
      <Button type="submit" disabled={$submitting}>
        {editMode ? 'Update' : 'Create'} Tenant
      </Button>
    </div>
  {/if}
</form>
