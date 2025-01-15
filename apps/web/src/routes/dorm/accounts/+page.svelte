<!-- src/routes/accounts/+page.svelte -->

<script lang="ts">
    import { superForm } from "sveltekit-superforms/client";
    import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Select from '$lib/components/ui/select';
    import { Input } from '$lib/components/ui/input';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Field, Control, Label, FieldErrors } from "formsnap";
    import type { PageData } from './$types';
    import { browser } from "$app/environment";
    import { billingSchema, billingTypeEnum, utilityTypeEnum, paymentStatusEnum } from './formSchema';
    import type { Infer } from "sveltekit-superforms";
    import { zodClient } from 'sveltekit-superforms/adapters';

    export let data: PageData & { form: Infer<typeof billingSchema> };
    let editMode = false;
    let showForm = true;

    const form = superForm(data.form, {
      validators: zodClient(billingSchema),
      taintedMessage: null,
      resetForm: true,
      onSubmit: ({ formData, cancel }) => {
        const formDataObj = Object.fromEntries(formData);
        console.log("Form data being submitted:", formDataObj);
        // console.log("Current form state:", $form);
        // Don't cancel the submission
        return;
      }
    });
  
    let { form: formData, enhance, reset } = form;

    function cancelEdit() {
      editMode = false;
      reset();
    }

    function toggleForm() {
      showForm = !showForm;
      if (!showForm) {
        cancelEdit();
      }
    }

    function editBilling(billing: any) {
      editMode = true;
      $formData = { 
        ...billing,
        dueDate: new Date(billing.dueDate),
        billingDate: new Date(billing.billingDate)
      };
      showForm = true;
    }
  
    $: billingTypeSelected = $formData.type ? { value: $formData.type, label: $formData.type } : undefined;
    $: utilityTypeSelected = $formData.utilityType ? { value: $formData.utilityType, label: $formData.utilityType } : undefined;
    $: statusSelected = $formData.status ? { value: $formData.status, label: $formData.status } : undefined;
    $: leaseSelected = $formData.leaseId ? { value: $formData.leaseId, label: data.leases.find(l => l.id === $formData.leaseId)?.leaseName ?? 'Select a lease' } : undefined;
    $: balance = ($formData.amount || 0) - ($formData.paidAmount || 0);
    $: showUtilityType = $formData.type === 'UTILITY';
</script>
  
<div class="container mx-auto p-4 flex">
    <!-- Accounts List (Left Side) -->
    <div class="w-2/3 pr-4">
      <h2 class="text-xl font-bold mb-2">Accounts List</h2>
      <ul class="space-y-2">
        {#each data.billings as account}
          <li class="bg-gray-100 p-4 rounded shadow">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="font-bold">{account.lease.leaseName}</span>
                <span class="mx-2">|</span>
                <span class="text-blue-600">{account.type}</span>
                <span class="mx-2">|</span>
                <span class="text-green-600">{account.category}</span>
              </div>
              <div>
                <Button on:click={() => editBilling(account)} class="mr-2">Edit</Button>
                <form method="POST" action="?/delete" use:enhance class="inline">
                  <input type="hidden" name="id" value={account.id} />
                  <Button type="submit" variant="destructive">Delete</Button>
                </form>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Amount:</strong> {account.amount}</div>
              <div><strong>Paid:</strong> {account.paidAmount || 0}</div>
              <div><strong>Balance:</strong> {account.amount - (account.paidAmount || 0)}</div>
              <div><strong>Date Issued:</strong> {new Date(account.dateIssued).toLocaleDateString()}</div>
              <div><strong>Due Date:</strong> {account.dueOn ? new Date(account.dueOn).toLocaleDateString() : 'N/A'}</div>
            </div>
            {#if account.notes}
              <div class="mt-2">
                <strong>Notes:</strong> {account.notes}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  
    <!-- Account Form (Right Side) -->
    <div class="w-1/3 pl-4">
      {#if showForm}
        <h1 class="text-2xl font-bold mb-4">{editMode ? 'Edit' : 'Add'} Account</h1>
        <form method="POST" action={editMode ? "?/update" : "?/create"} use:enhance class="space-y-4 mb-8">
          {#if editMode}
            <input type="hidden" name="id" bind:value={$formData.id} />
          {/if}
  
          <Field {form} name="leaseId">
            <Control let:attrs>
              <Label>Lease</Label>
              <Select.Root
                selected={leaseSelected}
                onSelectedChange={(s) => {
                  if (s) $formData.leaseId = s.value;
                }}
              >
                <Select.Trigger {...attrs}>
                  <Select.Value placeholder="Select a lease" />
                </Select.Trigger>
                <Select.Content>
                  {#each data.leases as lease}
                    <Select.Item value={lease.id} label={lease.leaseName} />
                  {/each}
                </Select.Content>
              </Select.Root>
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>
  
          <Field {form} name="type">
            <Control let:attrs>
              <Label>Account Type</Label>
              <Select.Root
                selected={billingTypeSelected}
                onSelectedChange={(s) => {
                  if (s) $formData.type = s.value;
                }}
              >
                <Select.Trigger {...attrs}>
                  <Select.Value placeholder="Select an account type" />
                </Select.Trigger>
                <Select.Content>
                  {#each billingTypeEnum.enumValues as type}
                    <Select.Item value={type} label={type} />
                  {/each}
                </Select.Content>
              </Select.Root>
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>
  
          {#if showUtilityType}
            <Field {form} name="utilityType">
              <Control let:attrs>
                <Label>Utility Type</Label>
                <Select.Root
                  selected={utilityTypeSelected}
                  onSelectedChange={(s) => {
                    if (s) $formData.utilityType = s.value;
                  }}
                >
                  <Select.Trigger {...attrs}>
                    <Select.Value placeholder="Select a utility type" />
                  </Select.Trigger>
                  <Select.Content>
                    {#each utilityTypeEnum.enumValues as type}
                      <Select.Item value={type} label={type} />
                    {/each}
                  </Select.Content>
                </Select.Root>
              </Control>
              <FieldErrors class="text-red-500 text-sm mt-1" />
            </Field>
          {/if}
  
          <Field {form} name="amount">
            <Control let:attrs>
              <Label>Amount</Label>
              <Input type="number" {...attrs} bind:value={$formData.amount} min="0" step="0.01" />
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>
  
          <Field {form} name="paidAmount">
            <Control let:attrs>
              <Label>Paid Amount</Label>
              <Input type="number" {...attrs} bind:value={$formData.paidAmount} min="0" step="0.01" />
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>

          <div class="space-y-2">
            <Label>Balance</Label>
            <Input 
              type="number" 
              value={($formData.amount || 0) - ($formData.paidAmount || 0)} 
              disabled 
              class="bg-gray-100"
            />
          </div>
  
          <Field {form} name="status">
            <Control let:attrs>
              <Label>Status</Label>
              <Select.Root
                selected={statusSelected}
                onSelectedChange={(s) => {
                  if (s) $formData.status = s.value;
                }}
              >
                <Select.Trigger {...attrs}>
                  <Select.Value placeholder="Select a status" />
                </Select.Trigger>
                <Select.Content>
                  {#each paymentStatusEnum.enumValues as status}
                    <Select.Item value={status} label={status} />
                  {/each}
                </Select.Content>
              </Select.Root>
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>
  
          <Field {form} name="billingDate">
            <Control let:attrs>
              <Label>Billing Date</Label>
              <Input type="date" {...attrs} bind:value={$formData.billingDate} />
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>
  
          <Field {form} name="dueDate">
            <Control let:attrs>
              <Label>Due Date</Label>
              <Input type="date" {...attrs} bind:value={$formData.dueDate} />
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>
  
          <Field {form} name="notes">
            <Control let:attrs>
              <Label>Notes</Label>
              <Textarea {...attrs} bind:value={$formData.notes} />
            </Control>
            <FieldErrors class="text-red-500 text-sm mt-1" />
          </Field>
  
          <Button type="submit">{editMode ? 'Update' : 'Add'} Account</Button>
          {#if editMode}
            <Button type="button" on:click={cancelEdit}>Cancel</Button>
          {/if}
        </form>
      {:else}
        <p class="text-center text-gray-500 mt-8">Click "Add Account" to create a new entry</p>
      {/if}
    </div>
  </div>
  
  <!-- Sticky Add Button -->
  <div class="fixed bottom-4 right-4">
    <Button on:click={toggleForm} class="rounded-full w-16 h-16 flex items-center justify-center text-2xl">
      {showForm ? '×' : '+'}
    </Button>
  </div>
  
  {#if browser}
    <SuperDebug data={$formData} />
  {/if}