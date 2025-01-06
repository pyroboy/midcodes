<script lang="ts">
  import type { PageData } from './$types';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';
  // import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import type { ExtendedTenant, Room, Profile, EmergencyContact, Selected } from './types';
  import { browser } from '$app/environment';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import TenantList from './TenantList.svelte';
  import { tenantSchema, tenantStatusEnum, leaseTypeEnum, type TenantFormData } from './formSchema';
  import { formatCurrency, formatDate } from './formSchema';
  import { defaultEmergencyContact } from './constants';

  interface PageState {
    form: SuperValidated<TenantFormData>;
    tenants: ExtendedTenant[];
    rooms: Room[];
    properties: any[];
    profiles: Profile[];
    userProfile: Profile;
    isAdminLevel: boolean;
    isStaffLevel: boolean;
  }

  export let data: PageState;
  let editMode = false;
  let showEmergencyContact = false;

  const { form, errors, enhance } = superForm(data.form, {
    validators: zodClient(tenantSchema),
    taintedMessage: null,
    resetForm: true,
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        editMode = false;
        form.set({
          name: '',
          contact_number: null,
          email: null,
          auth_id: null,
          tenant_status: 'PENDING',
          lease_status: 'INACTIVE',
          lease_type: 'BEDSPACER',
          lease_id: null,
          location_id: null,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          rent_amount: 0,
          security_deposit: 0,
          outstanding_balance: 0,
          notes: '',
          last_payment_date: null,
          next_payment_due: null,
          created_by: data.userProfile.id,
          emergency_contact: defaultEmergencyContact,
          payment_schedules: [],
          status_history: []
        });
      }
    }
  });

  $: availableRooms = data.rooms?.filter((room: Room) => 
    !$form.location_id || room.id === $form.location_id
  ) ?? [];

  function handleEdit(tenant: ExtendedTenant) {
    editMode = true;
    const formData: TenantFormData = {
      id: tenant.id,
      name: tenant.name,
      contact_number: tenant.contact_number,
      email: tenant.email,
      auth_id: tenant.auth_id,
      tenant_status: tenant.tenant_status,
      lease_status: tenant.lease?.status ?? 'INACTIVE',
      lease_type: tenant.lease_type,
      lease_id: tenant.lease?.id ?? null,
      location_id: tenant.lease?.location?.id ?? null,
      start_date: tenant.start_date,
      end_date: tenant.end_date,
      rent_amount: tenant.lease?.rent_amount ?? 0,
      security_deposit: tenant.lease?.security_deposit ?? 0,
      outstanding_balance: tenant.outstanding_balance,
      notes: tenant.lease?.notes ?? '',
      last_payment_date: tenant.lease?.last_payment_date ?? null,
      next_payment_due: tenant.lease?.next_payment_due ?? null,
      created_by: tenant.created_by,
      emergency_contact: tenant.emergency_contact,
      payment_schedules: tenant.lease?.payment_schedules ?? [],
      status_history: tenant.status_history ?? []
    };
    form.set(formData);
  }

  function handleCreate() {
    editMode = false;
    form.set({
      name: '',
      contact_number: null,
      email: null,
      auth_id: null,
      tenant_status: 'PENDING',
      lease_status: 'INACTIVE',
      lease_type: 'BEDSPACER',
      lease_id: null,
      location_id: null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      rent_amount: 0,
      security_deposit: 0,
      outstanding_balance: 0,
      notes: '',
      last_payment_date: null,
      next_payment_due: null,
      created_by: data.userProfile.id,
      emergency_contact: defaultEmergencyContact,
      payment_schedules: [],
      status_history: []
    });
  }

  function toggleForm() {
      form.set({
        name: '',
        contact_number: null,
        email: null,
        auth_id: null,
        tenant_status: 'PENDING',
        lease_status: 'INACTIVE',
        lease_type: 'BEDSPACER',
        lease_id: null,
        location_id: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        rent_amount: 0,
        security_deposit: 0,
        outstanding_balance: 0,
        notes: '',
        last_payment_date: null,
        next_payment_due: null,
        created_by: data.userProfile.id,
        emergency_contact: defaultEmergencyContact,
        payment_schedules: [],
        status_history: []
      });
  }

  function toggleEmergencyContact() {
    showEmergencyContact = !showEmergencyContact;
  }

  function handleDeleteSuccess() {
    editMode = false;
  }

  function getNestedError(path: string): string | undefined {
    const parts = path.split('.');
    let current = $errors as any;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return current?._errors?.[0];
  }

  function handleRoomSelect(value: Selected<Room> | undefined) {
    if (value?.value) {
      form.update($form => ({
        ...$form,
        location_id: value.value.id
      }));
    }
  }

  function handleStatusSelect(value: Selected<TenantFormData['tenant_status']> | undefined) {
    if (value?.value) {
      form.update($form => ({
        ...$form,
        tenant_status: value.value
      }));
    }
  }
</script>

<div class="container mx-auto p-4 flex">
  <TenantList 
    {data}
    on:edit={event => handleEdit(event.detail)}
    on:deleteSuccess={handleDeleteSuccess}
  />

  <div class="w-1/3 pl-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Tenant Form</h1>
      </div>
      <form method="POST" action={editMode ? "?/update" : "?/create"} use:enhance class="space-y-4 mb-8">
        {#if editMode}
          <input type="hidden" name="id" bind:value={$form.id} />
        {/if}

        <div class="space-y-2">
          <Label>Name</Label>
          <Input name="name" bind:value={$form.name} class={$errors.name ? 'border-red-500' : ''} />
          {#if $errors.name}<span class="text-red-500 text-sm">{$errors.name[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>Contact Number</Label>
          <Input name="contact_number" bind:value={$form.contact_number} class={$errors.contact_number ? 'border-red-500' : ''} />
          {#if $errors.contact_number}<span class="text-red-500 text-sm">{$errors.contact_number[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>Email</Label>
          <Input name="email" type="email" bind:value={$form.email} class={$errors.email ? 'border-red-500' : ''} />
          {#if $errors.email}<span class="text-red-500 text-sm">{$errors.email[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>Room</Label>
          <Select onSelectedChange={handleRoomSelect}>
            <SelectTrigger class={$errors.location_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {#each availableRooms as room}
                <SelectItem value={room}>
                  Room {room.number} ({room.name})
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if $errors.location_id}<span class="text-red-500 text-sm">{$errors.location_id[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>Status</Label>
          <Select onSelectedChange={handleStatusSelect}>
            <SelectTrigger class={$errors.tenant_status ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {#each tenantStatusEnum as status}
                <SelectItem value={status}>
                  {status}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if $errors.tenant_status}<span class="text-red-500 text-sm">{$errors.tenant_status[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>Start Date</Label>
          <Input
            name="start_date"
            type="date"
            bind:value={$form.start_date}
            class={$errors.start_date ? 'border-red-500' : ''}
          />
          {#if $errors.start_date}<span class="text-red-500 text-sm">{$errors.start_date[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>End Date</Label>
          <Input
            name="end_date"
            type="date"
            bind:value={$form.end_date}
            class={$errors.end_date ? 'border-red-500' : ''}
          />
          {#if $errors.end_date}<span class="text-red-500 text-sm">{$errors.end_date[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>Rent Amount</Label>
          <Input
            name="rent_amount"
            type="number"
            bind:value={$form.rent_amount}
            class={$errors.rent_amount ? 'border-red-500' : ''}
          />
          {#if $errors.rent_amount}<span class="text-red-500 text-sm">{$errors.rent_amount[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <Label>Security Deposit</Label>
          <Input
            name="security_deposit"
            type="number"
            bind:value={$form.security_deposit}
            class={$errors.security_deposit ? 'border-red-500' : ''}
          />
          {#if $errors.security_deposit}<span class="text-red-500 text-sm">{$errors.security_deposit[0]}</span>{/if}
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <Label>Emergency Contact</Label>
            <Button type="button" variant="outline" on:click={toggleEmergencyContact}>
              {showEmergencyContact ? 'Hide' : 'Show'}
            </Button>
          </div>

          {#if showEmergencyContact}
            <div class="space-y-4 mt-2">
              <div class="space-y-2">
                <Label>Name</Label>
                <Input
                  name="emergency_contact.name"
                  bind:value={$form.emergency_contact.name}
                  class={getNestedError('emergency_contact.name') ? 'border-red-500' : ''}
                />
                {#if getNestedError('emergency_contact.name')}<span class="text-red-500 text-sm">{getNestedError('emergency_contact.name')}</span>{/if}
              </div>

              <div class="space-y-2">
                <Label>Relationship</Label>
                <Input
                  name="emergency_contact.relationship"
                  bind:value={$form.emergency_contact.relationship}
                  class={getNestedError('emergency_contact.relationship') ? 'border-red-500' : ''}
                />
                {#if getNestedError('emergency_contact.relationship')}<span class="text-red-500 text-sm">{getNestedError('emergency_contact.relationship')}</span>{/if}
              </div>

              <div class="space-y-2">
                <Label>Phone</Label>
                <Input
                  name="emergency_contact.phone"
                  bind:value={$form.emergency_contact.phone}
                  class={getNestedError('emergency_contact.phone') ? 'border-red-500' : ''}
                />
                {#if getNestedError('emergency_contact.phone')}<span class="text-red-500 text-sm">{getNestedError('emergency_contact.phone')}</span>{/if}
              </div>

              <div class="space-y-2">
                <Label>Email</Label>
                <Input
                  name="emergency_contact.email"
                  type="email"
                  bind:value={$form.emergency_contact.email}
                  class={getNestedError('emergency_contact.email') ? 'border-red-500' : ''}
                />
                {#if getNestedError('emergency_contact.email')}<span class="text-red-500 text-sm">{getNestedError('emergency_contact.email')}</span>{/if}
              </div>

              <div class="space-y-2">
                <Label>Address</Label>
                <Input
                  name="emergency_contact.address"
                  bind:value={$form.emergency_contact.address}
                  class={getNestedError('emergency_contact.address') ? 'border-red-500' : ''}
                />
                {#if getNestedError('emergency_contact.address')}<span class="text-red-500 text-sm">{getNestedError('emergency_contact.address')}</span>{/if}
              </div>
            </div>
          {/if}
        </div>

        <div class="space-y-2">
          <Label>Notes</Label>
          <Input 
            name="notes" 
            bind:value={$form.notes} 
            class={$errors.notes ? 'border-red-500' : ''} 
          />
          {#if $errors.notes}<span class="text-red-500 text-sm">{$errors.notes[0]}</span>{/if}
        </div>

        <div class="flex justify-end space-x-2">
          <Button type="submit">
            {editMode ? 'Update' : 'Create'} Tenant
          </Button>
        </div>
      </form>

  </div>
</div>

<!-- {#if browser}
  <SuperDebug data={$form} />
{/if} -->