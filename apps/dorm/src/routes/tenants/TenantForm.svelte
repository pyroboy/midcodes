<script lang="ts">
  import type { PageData } from './$types';
  import type { SuperForm } from 'sveltekit-superforms';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import type { z } from 'zod';
  import { createEventDispatcher } from 'svelte';
  import { TenantStatusEnum, tenantFormSchema } from './formSchema';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { defaultEmergencyContact } from './formSchema';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';

  interface Props {
    data: PageData;
    form: SuperForm<z.infer<typeof tenantFormSchema>>['form'];
    errors: SuperForm<z.infer<typeof tenantFormSchema>>['errors'];
    enhance: SuperForm<z.infer<typeof tenantFormSchema>>['enhance'];
    constraints: SuperForm<z.infer<typeof tenantFormSchema>>['constraints'];
    submitting: SuperForm<z.infer<typeof tenantFormSchema>>['submitting'];
    editMode?: boolean;
    tenant?: z.infer<typeof tenantFormSchema> | undefined;
  }

  let {
    data,
    form,
    errors,
    enhance,
    constraints,
    submitting,
    editMode = false,
  }: Props = $props();

  const dispatch = createEventDispatcher();

  let showStatusDialog = $state(false);
  let statusChangeReason = $state('');


  // Convert ZodEnum to array of status options
  let tenantStatusOptions = $derived(Object.values(TenantStatusEnum.Values));

  let triggerStatus = $derived($form.tenant_status || "Select a status");


  // so far this is the best way to 
  // set each Objects Values with getter/setter
  // a merge between $form and defaultEmergencyContact
function createEmergencyContactBindings() {
  const fields = ['name', 'relationship', 'phone', 'email', 'address'] as const;
  const bindings = {} as Record<typeof fields[number], string>;

  fields.forEach(field => {
    Object.defineProperty(bindings, field, {
      get() {
        return $form.emergency_contact?.[field] || '';
      },
      set(value: string) {
        if (!$form.emergency_contact) {
          $form.emergency_contact = { ...defaultEmergencyContact };
        }
        $form.emergency_contact[field] = value;
      },
      enumerable: true
    });
  });

  return bindings;
}

const emergencyContact = createEmergencyContactBindings();

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
      data-error={$errors.email && $form.email !== undefined}
      aria-invalid={$errors.email ? 'true' : undefined}
      {...$constraints.email}
      />
      {#if $errors.email}
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
            type="single"
          name="tenant_status"
          bind:value={$form.tenant_status}
          {...$constraints.tenant_status}
        >
          <SelectTrigger>
      {triggerStatus}
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
    <Button type="button" variant="outline" onclick={() => dispatch('cancel')}>
      Cancel
    </Button>
    <Button type="submit" disabled={ $submitting}>
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
      <Button type="button" variant="outline" onclick={() => showStatusDialog = false}>
        Cancel
      </Button>
      <Button type="button" onclick={() => {
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
