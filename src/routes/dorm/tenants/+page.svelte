<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from "$lib/components/ui/select";
  import type { PageData } from './$types';
  import TenantList from './TenantList.svelte';
  import { tenantSchema, tenantStatusEnum } from './formSchema';
  import { browser } from '$app/environment';

  export let data: PageData;

  const defaultEmergencyContact = {
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: ''
  };

  const { form, errors, enhance, reset, submit } = superForm(data.form, {
    id: 'tenant-form',
    validators: zodClient(tenantSchema),
    resetForm: true,
    defaultValues: {
      property_id: 0,
      room_id: 0,
      user_id: '',
      tenant_status: 'PENDING' as const,
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: new Date().toISOString().split('T')[0],
      monthly_rate: 0,
      security_deposit: 0,
      emergency_contact: null,
      notes: null,
      created_by: ''
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
        reset();
        editMode = false;
      }
    },
  });

  let editMode = false;
  let showForm = true;
  let showEmergencyContact = false;

  function handleDeleteSuccess() {
    if (editMode) {
      reset();
    }
    editMode = false;
  }

  function toggleForm() {
    showForm = !showForm;
    if (!showForm) {
      cancelEdit();
    }
  }

  function updatePropertyId(selected: { value: string } | undefined) {
    if (selected?.value) {
      $form.property_id = parseInt(selected.value);
      // Reset room when property changes
      $form.room_id = 0;
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
      $form.tenant_status = selected.value as typeof tenantStatusEnum._type;
    }
  }

  function toggleEmergencyContact() {
    showEmergencyContact = !showEmergencyContact;
    if (!showEmergencyContact) {
      $form.emergency_contact = null;
    } else if (!$form.emergency_contact) {
      $form.emergency_contact = defaultEmergencyContact;
    }
  }

  function editTenant(tenant: any) {
    editMode = true;
    form.set({
      id: tenant.id,
      property_id: tenant.property_id,
      room_id: tenant.room_id,
      user_id: tenant.user_id,
      tenant_status: tenant.tenant_status,
      contract_start_date: tenant.contract_start_date,
      contract_end_date: tenant.contract_end_date,
      monthly_rate: tenant.monthly_rate,
      security_deposit: tenant.security_deposit,
      emergency_contact: tenant.emergency_contact,
      notes: tenant.notes,
      created_by: tenant.created_by
    });
    showForm = true;
    showEmergencyContact = !!tenant.emergency_contact;
  }

  function cancelEdit() {
    editMode = false;
    reset();
  }

  $: tenants = data.tenants ?? [];
  $: availableRooms = data.rooms?.filter(room => 
    !$form.property_id || room.property_id === $form.property_id
  ) ?? [];
</script>

<div class="container mx-auto p-4 flex">
  <TenantList 
    tenants={tenants}
    on:edit={event => editTenant(event.detail)}
    on:deleteSuccess={handleDeleteSuccess}
  />

  <!-- Tenant Form -->
  <div class="w-1/3 pl-4">
    {#if showForm}
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Tenant Form</h1>
      </div>
      <form method="POST" action={editMode ? "?/update" : "?/create"} use:enhance class="space-y-4 mb-8">
        {#if editMode}
          <input type="hidden" name="id" bind:value={$form.id} />
        {/if}

        <div class="space-y-2">
          <Label for="property">Property</Label>
          <Select.Root onSelectedChange={updatePropertyId}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select property" />
            </Select.Trigger>
            <Select.Content>
              {#each data.properties ?? [] as property}
                <Select.Item value={property.id.toString()}>
                  {property.name}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.property_id}
            <span class="text-red-500 text-sm">{$errors.property_id}</span>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="room">Room</Label>
          <Select.Root onSelectedChange={updateRoomId}>
            <Select.Trigger class="w-full" disabled={!$form.property_id}>
              <Select.Value placeholder="Select room" />
            </Select.Trigger>
            <Select.Content>
              {#each availableRooms as room}
                <Select.Item value={room.id.toString()}>
                  Room {room.room_number}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.room_id}
            <span class="text-red-500 text-sm">{$errors.room_id}</span>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="user">User</Label>
          <Select.Root onSelectedChange={updateUserId}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select user" />
            </Select.Trigger>
            <Select.Content>
              {#each data.users ?? [] as user}
                <Select.Item value={user.id}>
                  {user.full_name}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.user_id}
            <span class="text-red-500 text-sm">{$errors.user_id}</span>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="tenant_status">Status</Label>
          <Select.Root onSelectedChange={updateTenantStatus}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select status" />
            </Select.Trigger>
            <Select.Content>
              {#each Object.values(tenantStatusEnum.Values) as status}
                <Select.Item value={status}>
                  {status}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.tenant_status}
            <span class="text-red-500 text-sm">{$errors.tenant_status}</span>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="contract_start_date">Start Date</Label>
            <Input
              type="date"
              id="contract_start_date"
              name="contract_start_date"
              bind:value={$form.contract_start_date}
            />
            {#if $errors.contract_start_date}
              <span class="text-red-500 text-sm">{$errors.contract_start_date}</span>
            {/if}
          </div>

          <div class="space-y-2">
            <Label for="contract_end_date">End Date</Label>
            <Input
              type="date"
              id="contract_end_date"
              name="contract_end_date"
              bind:value={$form.contract_end_date}
            />
            {#if $errors.contract_end_date}
              <span class="text-red-500 text-sm">{$errors.contract_end_date}</span>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="monthly_rate">Monthly Rate</Label>
            <Input
              type="number"
              id="monthly_rate"
              name="monthly_rate"
              bind:value={$form.monthly_rate}
              min="0"
              step="0.01"
            />
            {#if $errors.monthly_rate}
              <span class="text-red-500 text-sm">{$errors.monthly_rate}</span>
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
            />
            {#if $errors.security_deposit}
              <span class="text-red-500 text-sm">{$errors.security_deposit}</span>
            {/if}
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <Label>Emergency Contact</Label>
            <Button type="button" variant="outline" on:click={toggleEmergencyContact}>
              {showEmergencyContact ? 'Hide' : 'Show'}
            </Button>
          </div>

          {#if showEmergencyContact && $form.emergency_contact}
            <div class="space-y-4 border p-4 rounded">
              <div class="space-y-2">
                <Label for="emergency_contact_name">Name</Label>
                <Input
                  type="text"
                  id="emergency_contact_name"
                  bind:value={$form.emergency_contact.name}
                />
              </div>

              <div class="space-y-2">
                <Label for="emergency_contact_relationship">Relationship</Label>
                <Input
                  type="text"
                  id="emergency_contact_relationship"
                  bind:value={$form.emergency_contact.relationship}
                />
              </div>

              <div class="space-y-2">
                <Label for="emergency_contact_phone">Phone</Label>
                <Input
                  type="tel"
                  id="emergency_contact_phone"
                  bind:value={$form.emergency_contact.phone}
                />
              </div>

              <div class="space-y-2">
                <Label for="emergency_contact_email">Email</Label>
                <Input
                  type="email"
                  id="emergency_contact_email"
                  bind:value={$form.emergency_contact.email}
                />
              </div>

              <div class="space-y-2">
                <Label for="emergency_contact_address">Address</Label>
                <Input
                  type="text"
                  id="emergency_contact_address"
                  bind:value={$form.emergency_contact.address}
                />
              </div>
            </div>
          {/if}
          {#if $errors.emergency_contact}
            <span class="text-red-500 text-sm">{$errors.emergency_contact}</span>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="notes">Notes</Label>
          <Input
            type="text"
            id="notes"
            name="notes"
            bind:value={$form.notes}
          />
          {#if $errors.notes}
            <span class="text-red-500 text-sm">{$errors.notes}</span>
          {/if}
        </div>

        <div class="flex justify-end gap-2">
          {#if editMode}
            <Button type="button" variant="outline" on:click={cancelEdit}>
              Cancel
            </Button>
            <Button type="submit" formaction="?/delete" variant="destructive">
              Delete
            </Button>
          {/if}
          <Button type="submit">
            {editMode ? 'Update' : 'Create'} Tenant
          </Button>
        </div>
      </form>
    {:else}
      <Button on:click={toggleForm}>
        Show Form
      </Button>
    {/if}
  </div>
</div>

{#if browser}
  <SuperDebug data={$form} />
{/if}