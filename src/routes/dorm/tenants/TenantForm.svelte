<script lang="ts">
  import type { PageData } from './$types';
  import type {  SuperFormData } from 'sveltekit-superforms/client';
  import type { Database } from '$lib/database.types';
  import { superForm } from 'sveltekit-superforms/client';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Tabs from '$lib/components/ui/tabs';
  import type { z } from 'zod';
  import { createEventDispatcher } from 'svelte';
  import { TenantStatusEnum,tenantFormSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { defaultEmergencyContact } from './constants';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Separator } from '$lib/components/ui/separator';

  type Property = Database['public']['Tables']['properties']['Row'];
  type User = Database['public']['Tables']['profiles']['Row'];

  export let data: PageData;
  export let formData: SuperFormData<z.infer<typeof tenantFormSchema>>;
  export let errors: ReturnType<typeof superForm<z.infer<typeof tenantFormSchema>>>['errors'];
  export let enhance: ReturnType<typeof superForm<z.infer<typeof tenantFormSchema>>>['enhance'];
  export let submitting: ReturnType<typeof superForm<z.infer<typeof tenantFormSchema>>>['submitting'];
  export let editMode = false;
  export let tenant: z.infer<typeof tenantFormSchema> | undefined = undefined;

  const dispatch = createEventDispatcher();

  let showStatusDialog = false;
  let statusChangeReason = '';

  $: canEdit = data.isAdminLevel || (data.isStaffLevel && !editMode);
  $: canDelete = data.isAdminLevel;

  $: if (tenant && editMode) {
    formData.update($data => ({ ...$data, ...tenant }));
  }

  // Fix: Convert ZodEnum to array of status options
  $: tenantStatusOptions = Object.values(TenantStatusEnum.Values);

  type TenantStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "BLACKLISTED";

  function updateTenantStatus(event: CustomEvent<TenantStatus>) {
    if (event.detail) {
      showStatusDialog = true;
      formData.update($data => ({ ...$data, tenant_status: event.detail }));
    }
  }

  $: emergencyContact = {
    ...defaultEmergencyContact,
    ...($formData.emergency_contact || {}),
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
          <Select on:change={updateTenantStatus} disabled={!canEdit}>
            <SelectTrigger>
              <SelectValue>
                {#if $formData.tenant_status}
                  <Badge variant="outline" class={getStatusColor($formData.tenant_status)}>
                    {$formData.tenant_status}
                  </Badge>
                {:else}
                  Select status
                {/if}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {#each tenantStatusOptions as status}
                <SelectItem value={status}>
                  <Badge variant="outline" class={getStatusColor(status)}>
                    {status}
                  </Badge>
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
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
      <Button type="button" on:click={() => {
        formData.update($formData => ({
          ...$formData,
          status_change_reason: statusChangeReason
        }));
        showStatusDialog = false;
        statusChangeReason = '';
      }} disabled={!statusChangeReason}>
        Confirm Change
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>