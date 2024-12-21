<script lang="ts">
  import { z } from 'zod';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import { tenantSchema, leaseStatusEnum, tenantStatusEnum, leaseTypeEnum } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { Database } from '$lib/database.types';
  import { format } from 'date-fns';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Separator } from '$lib/components/ui/separator';
  import { defaultEmergencyContact } from './constants';

  type Property = Database['public']['Tables']['properties']['Row'];
  type User = Database['public']['Tables']['profiles']['Row'];
  type TenantFormData = z.infer<typeof tenantSchema>;

  interface Room {
    id: number;
    property_id: number;
    number: number;
    room_status: string;
  }

  interface PageData {
    properties: Property[];
    rooms: Room[];
    users: User[];
    isAdminLevel: boolean;
    isStaffLevel: boolean;
  }

  export let data: PageData;
  export let form: SuperForm<TenantFormData>;
  export let editMode = false;
  export let tenant: TenantFormData | undefined = undefined;

  const dispatch = createEventDispatcher();
  const { form: formData, errors, enhance, submitting } = form;

  let showStatusDialog = false;
  let statusChangeReason = '';

  $: {
    if (tenant && editMode) {
      formData.update($formData => ({ ...$formData, ...tenant }));
    }
  }

  $: availableRooms = data.rooms?.filter(room => 
    !$formData.location_id || room.id === $formData.location_id
  ) ?? [];

  $: canEdit = data.isAdminLevel || (data.isStaffLevel && !editMode);
  $: canDelete = data.isAdminLevel;

  function updateLocationId(selected: { value: string } | undefined) {
    if (selected?.value) {
      formData.update($formData => ({ ...$formData, location_id: parseInt(selected.value) }));
    }
  }

  function updateTenantStatus(selected: { value: string } | undefined) {
    if (selected?.value) {
      showStatusDialog = true;
      formData.update($formData => ({ ...$formData, tenant_status: selected.value as TenantFormData['tenant_status'] }));
    }
  }

  function updateLeaseStatus(selected: { value: string } | undefined) {
    if (selected?.value) {
      formData.update($formData => ({ ...$formData, lease_status: selected.value as TenantFormData['lease_status'] }));
    }
  }

  function updateLeaseType(selected: { value: string } | undefined) {
    if (selected?.value) {
      formData.update($formData => ({ ...$formData, lease_type: selected.value as TenantFormData['lease_type'] }));
    }
  }

  function handleStatusChange() {
    if (statusChangeReason) {
      const now = new Date().toISOString();
      const history = $formData.status_history || [];
      history.push({
        status: $formData.tenant_status,
        changed_at: now,
        changed_by: $formData.created_by,
        reason: statusChangeReason
      });
      formData.update($formData => ({ ...$formData, status_history: history }));
      showStatusDialog = false;
      statusChangeReason = '';
    }
  }

  $: emergencyContact = {
    ...defaultEmergencyContact,
    ...$formData.emergency_contact,
    email: $formData.emergency_contact?.email || ''
  };

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'BLACKLISTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4"
>
  <input type="hidden" name="id" bind:value={$formData.id} />

  <Tabs.Root value="details" class="w-full">
    <Tabs.List>
      <Tabs.Trigger value="details">Tenant Details</Tabs.Trigger>
      <Tabs.Trigger value="lease">Lease Information</Tabs.Trigger>
      <Tabs.Trigger value="financial">Financial</Tabs.Trigger>
      <Tabs.Trigger value="history">History</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="details" class="p-4 border rounded-lg mt-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="name">Name</Label>
          <Input
            type="text"
            name="name"
            bind:value={$formData.name}
            disabled={!canEdit}
          />
          {#if $errors.name}
            <p class="text-sm text-red-500">{$errors.name}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            type="email"
            name="email"
            bind:value={$formData.email}
            disabled={!canEdit}
          />
          {#if $errors.email}
            <p class="text-sm text-red-500">{$errors.email}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="contact_number">Contact Number</Label>
          <Input
            type="tel"
            name="contact_number"
            bind:value={$formData.contact_number}
            disabled={!canEdit}
          />
          {#if $errors.contact_number}
            <p class="text-sm text-red-500">{$errors.contact_number}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="tenant_status">Tenant Status</Label>
          <Select.Root onSelectedChange={updateTenantStatus} disabled={!canEdit}>
            <Select.Trigger class="w-full">
              <Select.Value>
                {#if $formData.tenant_status}
                  <Badge variant="outline" class={getStatusColor($formData.tenant_status)}>
                    {$formData.tenant_status}
                  </Badge>
                {:else}
                  Select status
                {/if}
              </Select.Value>
            </Select.Trigger>
            <Select.Content>
              {#each tenantStatusEnum as status}
                <Select.Item value={status}>
                  <Badge variant="outline" class={getStatusColor(status)}>
                    {status}
                  </Badge>
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.tenant_status}
            <p class="text-sm text-red-500">{$errors.tenant_status}</p>
          {/if}
        </div>
      </div>

      <div class="mt-6">
        <Label>Emergency Contact</Label>
        <Card.Root class="mt-2">
          <Card.Content class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
            <div class="space-y-2">
              <Label for="emergency_contact.name">Name</Label>
              <Input
                type="text"
                name="emergency_contact.name"
                bind:value={emergencyContact.name}
                disabled={!canEdit}
              />
              {#if $errors.emergency_contact?.name}
                <p class="text-sm text-red-500">{$errors.emergency_contact.name}</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="emergency_contact.relationship">Relationship</Label>
              <Input
                type="text"
                name="emergency_contact.relationship"
                bind:value={emergencyContact.relationship}
                disabled={!canEdit}
              />
              {#if $errors.emergency_contact?.relationship}
                <p class="text-sm text-red-500">{$errors.emergency_contact.relationship}</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="emergency_contact.phone">Phone</Label>
              <Input
                type="tel"
                name="emergency_contact.phone"
                bind:value={emergencyContact.phone}
                disabled={!canEdit}
              />
              {#if $errors.emergency_contact?.phone}
                <p class="text-sm text-red-500">{$errors.emergency_contact.phone}</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="emergency_contact.email">Email</Label>
              <Input
                type="email"
                name="emergency_contact.email"
                bind:value={emergencyContact.email}
                disabled={!canEdit}
              />
              {#if $errors.emergency_contact?.email}
                <p class="text-sm text-red-500">{$errors.emergency_contact.email}</p>
              {/if}
            </div>

            <div class="col-span-2 space-y-2">
              <Label for="emergency_contact.address">Address</Label>
              <Textarea
                name="emergency_contact.address"
                bind:value={emergencyContact.address}
                disabled={!canEdit}
              />
              {#if $errors.emergency_contact?.address}
                <p class="text-sm text-red-500">{$errors.emergency_contact.address}</p>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </Tabs.Content>

    <Tabs.Content value="lease" class="p-4 border rounded-lg mt-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="location_id">Room</Label>
          <Select.Root onSelectedChange={updateLocationId} disabled={!canEdit}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select room" />
            </Select.Trigger>
            <Select.Content>
              {#each availableRooms as room}
                <Select.Item value={room.id.toString()}>
                  Room {room.number}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.location_id}
            <p class="text-sm text-red-500">{$errors.location_id}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="lease_type">Lease Type</Label>
          <Select.Root onSelectedChange={updateLeaseType} disabled={!canEdit}>
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select lease type" />
            </Select.Trigger>
            <Select.Content>
              {#each leaseTypeEnum as type}
                <Select.Item value={type}>{type}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.lease_type}
            <p class="text-sm text-red-500">{$errors.lease_type}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="lease_status">Lease Status</Label>
          <Select.Root onSelectedChange={updateLeaseStatus} disabled={!canEdit}>
            <Select.Trigger class="w-full">
              <Select.Value>
                {#if $formData.lease_status}
                  <Badge variant="outline" class={getStatusColor($formData.lease_status)}>
                    {$formData.lease_status}
                  </Badge>
                {:else}
                  Select status
                {/if}
              </Select.Value>
            </Select.Trigger>
            <Select.Content>
              {#each leaseStatusEnum as status}
                <Select.Item value={status}>
                  <Badge variant="outline" class={getStatusColor(status)}>
                    {status}
                  </Badge>
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.lease_status}
            <p class="text-sm text-red-500">{$errors.lease_status}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="start_date">Start Date</Label>
          <Input
            type="date"
            name="start_date"
            bind:value={$formData.start_date}
            min={format(new Date(), 'yyyy-MM-dd')}
            disabled={!canEdit}
          />
          {#if $errors.start_date}
            <p class="text-sm text-red-500">{$errors.start_date}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="end_date">End Date</Label>
          <Input
            type="date"
            name="end_date"
            bind:value={$formData.end_date}
            min={$formData.start_date || format(new Date(), 'yyyy-MM-dd')}
            disabled={!canEdit}
          />
          {#if $errors.end_date}
            <p class="text-sm text-red-500">{$errors.end_date}</p>
          {/if}
        </div>

        <div class="col-span-2 space-y-2">
          <Label for="notes">Notes</Label>
          <Textarea
            name="notes"
            bind:value={$formData.notes}
            disabled={!canEdit}
          />
          {#if $errors.notes}
            <p class="text-sm text-red-500">{$errors.notes}</p>
          {/if}
        </div>
      </div>
    </Tabs.Content>

    <Tabs.Content value="financial" class="p-4 border rounded-lg mt-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="rent_amount">Monthly Rent</Label>
          <Input
            type="number"
            name="rent_amount"
            bind:value={$formData.rent_amount}
            min="0"
            step="0.01"
            disabled={!canEdit}
          />
          {#if $errors.rent_amount}
            <p class="text-sm text-red-500">{$errors.rent_amount}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="security_deposit">Security Deposit</Label>
          <Input
            type="number"
            name="security_deposit"
            bind:value={$formData.security_deposit}
            min="0"
            step="0.01"
            disabled={!canEdit}
          />
          {#if $errors.security_deposit}
            <p class="text-sm text-red-500">{$errors.security_deposit}</p>
          {/if}
        </div>

        {#if $formData.payment_schedules?.length}
          <div class="col-span-2">
            <Label>Payment Schedule</Label>
            <Card.Root class="mt-2">
              <Card.Content class="pt-6">
                <table class="w-full">
                  <thead>
                    <tr>
                      <th class="text-left">Due Date</th>
                      <th class="text-left">Type</th>
                      <th class="text-right">Amount</th>
                      <th class="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each $formData.payment_schedules as payment}
                      <tr>
                        <td>{format(new Date(payment.due_date), 'MMM d, yyyy')}</td>
                        <td>{payment.type}</td>
                        <td class="text-right">₱{payment.amount.toLocaleString()}</td>
                        <td class="text-right">
                          <Badge variant="outline" class={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </Card.Content>
            </Card.Root>
          </div>
        {/if}

        {#if $formData.outstanding_balance !== undefined}
          <div class="col-span-2">
            <Card.Root>
              <Card.Content class="pt-6">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-sm text-gray-500">Outstanding Balance</p>
                    <p class="text-2xl font-bold">₱{$formData.outstanding_balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Next Payment Due</p>
                    <p class="text-lg">{$formData.next_payment_due ? format(new Date($formData.next_payment_due), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Last Payment</p>
                    <p class="text-lg">{$formData.last_payment_date ? format(new Date($formData.last_payment_date), 'MMM d, yyyy') : '-'}</p>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          </div>
        {/if}
      </div>
    </Tabs.Content>

    <Tabs.Content value="history" class="p-4 border rounded-lg mt-4">
      {#if $formData.status_history?.length}
        <div class="space-y-4">
          {#each $formData.status_history as change}
            <Card.Root>
              <Card.Content class="pt-6">
                <div class="flex items-center gap-4">
                  <Badge variant="outline" class={getStatusColor(change.status)}>
                    {change.status}
                  </Badge>
                  <div class="flex-1">
                    <p class="text-sm text-gray-500">{change.reason}</p>
                    <p class="text-xs text-gray-400">
                      Changed on {format(new Date(change.changed_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500">No status changes recorded</p>
      {/if}
    </Tabs.Content>
  </Tabs.Root>

  <div class="flex justify-end gap-4 pt-4">
    <Button type="button" variant="outline" on:click={() => dispatch('cancel')}>
      Cancel
    </Button>
    <Button type="submit" disabled={!canEdit || $submitting}>
      {#if $submitting}
        Saving...
      {:else}
        {editMode ? 'Update' : 'Create'} Tenant
      {/if}
    </Button>
  </div>
</form>

<Dialog.Root bind:open={showStatusDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Change Status</Dialog.Title>
      <Dialog.Description>
        Please provide a reason for changing the tenant's status.
      </Dialog.Description>
    </Dialog.Header>

    <div class="py-4">
      <Label for="status_reason">Reason</Label>
      <Textarea
        id="status_reason"
        bind:value={statusChangeReason}
        placeholder="Enter the reason for status change"
      />
    </div>

    <Dialog.Footer>
      <Button type="button" variant="outline" on:click={() => showStatusDialog = false}>
        Cancel
      </Button>
      <Button type="button" on:click={handleStatusChange} disabled={!statusChangeReason}>
        Confirm Change
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
