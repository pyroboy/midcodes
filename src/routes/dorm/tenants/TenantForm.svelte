<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import { tenantSchema, type TenantSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';

  export let data: any;
  export let properties: any[] = [];
  export let rooms: any[] = [];
  export let users: any[] = [];
  export let editMode = false;
  export let tenant: z.infer<typeof tenantSchema> | undefined = undefined;

  const dispatch = createEventDispatcher();

  $: filteredRooms = rooms.filter(r => r.property_id === $form.property_id);

  $: {
    if (tenant && editMode) {
      form.set({
        ...tenant
      });
    }
  }

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

  $: canEdit = data.isAdminLevel || (data.isStaffLevel && !editMode);
  $: canDelete = data.isAdminLevel;

  function updatePropertyId(event: CustomEvent<number>) {
    form.update($form => ({ ...$form, property_id: event.detail }));
  }

  function updateRoomId(event: CustomEvent<number>) {
    form.update($form => ({ ...$form, room_id: event.detail }));
  }

  function updateUserId(event: CustomEvent<string>) {
    form.update($form => ({ ...$form, user_id: event.detail }));
  }

  function updateTenantStatus(event: CustomEvent<string>) {
    form.update($form => ({ ...$form, tenant_status: event.detail }));
  }

  function updateNumberField(field: keyof z.infer<typeof tenantSchema>, value: string) {
    const numValue = value === '' ? 0 : Number(value);
    form.update($form => ({ ...$form, [field]: numValue }));
  }
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
>
  <input type="hidden" name="id" bind:value={$form.id} />

  <div class="space-y-2">
    <Label for="property_id">Property</Label>
    <Select.Root onSelectedChange={updatePropertyId} selected={$form.property_id} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select property" />
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
    <Select.Root onSelectedChange={updateRoomId} selected={$form.room_id} disabled={!canEdit || !$form.property_id}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select room" />
      </Select.Trigger>
      <Select.Content>
        {#each filteredRooms as room}
          <Select.Item value={room.id}>Room {room.number}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.room_id}
      <p class="text-red-500 text-sm">{$errors.room_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="user_id">User</Label>
    <Select.Root onSelectedChange={updateUserId} selected={$form.user_id} disabled={!canEdit}>
      <Select.Trigger class="w-full">
        <Select.Value placeholder="Select user" />
      </Select.Trigger>
      <Select.Content>
        {#each users as user}
          <Select.Item value={user.id}>{user.email}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if $errors.user_id}
      <p class="text-red-500 text-sm">{$errors.user_id}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="tenant_status">Status</Label>
    <Select.Root onSelectedChange={updateTenantStatus} selected={$form.tenant_status} disabled={!canEdit}>
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
        value={$form.monthly_rate}
        on:input={(e) => updateNumberField('monthly_rate', e.currentTarget.value)}
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
        value={$form.security_deposit}
        on:input={(e) => updateNumberField('security_deposit', e.currentTarget.value)}
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
          name="emergency_contact.name"
          bind:value={$form.emergency_contact?.name}
          disabled={!canEdit}
        />
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact_relationship">Relationship</Label>
        <Input
          type="text"
          id="emergency_contact_relationship"
          name="emergency_contact.relationship"
          bind:value={$form.emergency_contact?.relationship}
          disabled={!canEdit}
        />
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact_phone">Phone</Label>
        <Input
          type="tel"
          id="emergency_contact_phone"
          name="emergency_contact.phone"
          bind:value={$form.emergency_contact?.phone}
          disabled={!canEdit}
        />
      </div>

      <div class="space-y-2">
        <Label for="emergency_contact_email">Email</Label>
        <Input
          type="email"
          id="emergency_contact_email"
          name="emergency_contact.email"
          bind:value={$form.emergency_contact?.email}
          disabled={!canEdit}
        />
      </div>

      <div class="space-y-2 md:col-span-2">
        <Label for="emergency_contact_address">Address</Label>
        <Input
          type="text"
          id="emergency_contact_address"
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
