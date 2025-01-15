<script lang="ts">
  import type { PageData } from './$types';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { Database } from '$lib/database.types';
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
  import type { z } from 'zod';
  import { createEventDispatcher } from 'svelte';
  import { TenantStatusEnum, tenantFormSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { defaultEmergencyContact } from './constants';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';

  type Property = Database['public']['Tables']['properties']['Row'];
  type User = Database['public']['Tables']['profiles']['Row'];

  export let data: PageData;

  export let form: SuperForm<z.infer<typeof tenantFormSchema>>['form'];
  export let errors: SuperForm<z.infer<typeof tenantFormSchema>>['errors'];
  export let enhance: SuperForm<z.infer<typeof tenantFormSchema>>['enhance'];
  export let constraints: SuperForm<z.infer<typeof tenantFormSchema>>['constraints'];
  export let submitting: SuperForm<z.infer<typeof tenantFormSchema>>['submitting'];
  export let editMode = false;
  export let tenant: z.infer<typeof tenantFormSchema> | undefined = undefined;

  const dispatch = createEventDispatcher();

  let showStatusDialog = false;
  let statusChangeReason = '';

  $: canEdit = data.isAdminLevel || (data.isStaffLevel && !editMode);
  $: canDelete = data.isAdminLevel;

  $: if (tenant && editMode) {
    $form = { ...$form, ...tenant };
  }

  // Convert ZodEnum to array of status options
  $: tenantStatusOptions = Object.values(TenantStatusEnum.Values);

  type TenantStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "BLACKLISTED";

  function updateTenantStatus(event: CustomEvent<TenantStatus>) {
    if (event.detail) {
      showStatusDialog = true;
      $form = { ...$form, tenant_status: event.detail };
    }
  }

  $: emergencyContact = {
    ...defaultEmergencyContact,
    ...($form.emergency_contact || {}),
    email: $form.emergency_contact?.email || ''
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
  novalidate
>
  <input type="hidden" name="id" bind:value={$form.id} />

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="name">Name</Label>
      <Input
        type="text"
        name="name"
      bind:value={$form.name}
      class="w-full"
      disabled={!canEdit}
      data-error={$errors.name}
      aria-invalid={$errors.name ? 'true' : undefined}
      {...$constraints.name}
      />
      {#if $errors.name}
        <p class="text-sm font-medium text-destructive">{$errors.name}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="email">Email</Label>
      <Input
        type="email"
        name="email"
      bind:value={$form.email}
      class="w-full"
      disabled={!canEdit}
      data-error={$errors.email && $form.email !== undefined}
      aria-invalid={$errors.email ? 'true' : undefined}
      {...$constraints.email}
      />
      {#if $errors.email && $form.email !== undefined}
        <p class="text-sm font-medium text-destructive">{$errors.email}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="contact_number">Contact Number</Label>
      <Input
        type="tel"
        name="contact_number"
      bind:value={$form.contact_number}
      class="w-full"
      disabled={!canEdit}
      data-error={$errors.contact_number && $form.contact_number !== undefined}
      aria-invalid={$errors.contact_number ? 'true' : undefined}
      {...$constraints.contact_number}
      />
      {#if $errors.contact_number && $form.contact_number !== undefined}
        <p class="text-sm font-medium text-destructive">{$errors.contact_number}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="tenant_status">Tenant Status</Label>
      <div class:error-class={$errors.tenant_status}>
        <Select 
          on:change={updateTenantStatus} 
          disabled={!canEdit}
          {...$constraints.tenant_status}
        >
          <SelectTrigger>
            <SelectValue>
              {#if $form.tenant_status}
                <Badge variant="outline" class={getStatusColor($form.tenant_status)}>
                  {$form.tenant_status}
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
      </div>
      {#if $errors.tenant_status && $form.tenant_status !== undefined}
        <p class="text-sm font-medium text-destructive">{$errors.tenant_status}</p>
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
      class="w-full"
            disabled={!canEdit}
            data-error={$errors.emergency_contact?.name && emergencyContact.name !== undefined}
            aria-invalid={$errors.emergency_contact?.name ? 'true' : undefined}
            {...$constraints.emergency_contact?.name}
          />
          {#if $errors.emergency_contact?.name && emergencyContact.name !== undefined}
            <p class="text-sm font-medium text-destructive">{$errors.emergency_contact.name}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="emergency_contact.relationship">Relationship</Label>
          <Input
            type="text"
            name="emergency_contact.relationship"
      bind:value={emergencyContact.relationship}
      class="w-full"
            disabled={!canEdit}
            data-error={$errors.emergency_contact?.relationship && emergencyContact.relationship !== undefined}
            aria-invalid={$errors.emergency_contact?.relationship ? 'true' : undefined}
            {...$constraints.emergency_contact?.relationship}
          />
          {#if $errors.emergency_contact?.relationship && emergencyContact.relationship !== undefined}
            <p class="text-sm font-medium text-destructive">{$errors.emergency_contact.relationship}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="emergency_contact.phone">Phone</Label>
          <Input
            type="tel"
            name="emergency_contact.phone"
      bind:value={emergencyContact.phone}
      class="w-full"
            disabled={!canEdit}
            data-error={$errors.emergency_contact?.phone && emergencyContact.phone !== undefined}
            aria-invalid={$errors.emergency_contact?.phone ? 'true' : undefined}
            {...$constraints.emergency_contact?.phone}
          />
          {#if $errors.emergency_contact?.phone && emergencyContact.phone !== undefined}
            <p class="text-sm font-medium text-destructive">{$errors.emergency_contact.phone}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="emergency_contact.email">Email</Label>
          <Input
            type="email"
            name="emergency_contact.email"
      bind:value={emergencyContact.email}
      class="w-full"
            disabled={!canEdit}
            data-error={$errors.emergency_contact?.email && emergencyContact.email !== undefined}
            aria-invalid={$errors.emergency_contact?.email ? 'true' : undefined}
            {...$constraints.emergency_contact?.email}
          />
          {#if $errors.emergency_contact?.email && emergencyContact.email !== undefined}
            <p class="text-sm font-medium text-destructive">{$errors.emergency_contact.email}</p>
          {/if}
        </div>

        <div class="col-span-2 space-y-2">
          <Label for="emergency_contact.address">Address</Label>
          <Textarea
            name="emergency_contact.address"
      bind:value={emergencyContact.address}
      class="w-full"
            disabled={!canEdit}
            data-error={$errors.emergency_contact?.address && emergencyContact.address !== undefined}
            aria-invalid={$errors.emergency_contact?.address ? 'true' : undefined}
            {...$constraints.emergency_contact?.address}
          />
          {#if $errors.emergency_contact?.address && emergencyContact.address !== undefined}
            <p class="text-sm font-medium text-destructive">{$errors.emergency_contact.address}</p>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="flex justify-end space-x-2 pt-4">
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
        $form = {
          ...$form,
          status_change_reason: statusChangeReason
        };
        showStatusDialog = false;
        statusChangeReason = '';
      }} disabled={!statusChangeReason}>
        Confirm Change
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global([data-error="true"]) {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
  .error-class {
    border-color: hsl(var(--destructive)) !important;
    --tw-ring-color: hsl(var(--destructive)) !important;
    outline: none !important;
  }
</style>
