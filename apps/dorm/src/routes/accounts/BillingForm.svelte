<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';
  import { createEventDispatcher } from 'svelte';
  import { billingTypeEnum, utilityTypeEnum, paymentStatusEnum } from './formSchema';

  const dispatch = createEventDispatcher();
  
  let { data, editMode = false } = $props();
  
  const { form, enhance, errors, reset } = superForm(data.form);
  
  // Show utility type select only for utility billings
  let showUtilityType = $derived($form.type === 'UTILITY');
  
  function handleCancel() {
    reset();
    dispatch('cancel');
  }
</script>

<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4"
>
  <!-- Lease Select -->
  <div class="space-y-2">
    <Label for="lease_id">Lease</Label>
    <Select.Root
      name="lease_id"
         type="single"
      bind:value={$form.lease_id}
    >
      <Select.Trigger>
        Select Lease
      </Select.Trigger>
      <Select.Content>
        {#each data.leases as lease}
          <Select.Item value={lease.id}>
            {lease.rental_unit.property.name} - {lease.rental_unit.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Billing Type -->
  <div class="space-y-2">
    <Label for="type">Type</Label>
    <Select.Root
      name="type"
      type="single"
      bind:value={$form.type}
    >
      <Select.Trigger>
        Select Type
      </Select.Trigger>
      <Select.Content>
        {#each billingTypeEnum.enumValues as type}
          <Select.Item value={type}>{type}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Utility Type (conditional) -->
  {#if showUtilityType}
    <div class="space-y-2">
      <Label for="utility_type">Utility Type</Label>
      <Select.Root
        name="utility_type"
           type="single"
        bind:value={$form.utility_type}
      >
        <Select.Trigger>
          Select Utility
        </Select.Trigger>
        <Select.Content>
          {#each utilityTypeEnum.enumValues as type}
            <Select.Item value={type}>{type}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  {/if}

  <!-- Amount -->
  <div class="space-y-2">
    <Label for="amount">Amount</Label>
    <Input
      type="number"
      id="amount"
      name="amount"
      bind:value={$form.amount}
    />
  </div>

  <!-- Due Date -->
  <div class="space-y-2">
    <Label for="due_date">Due Date</Label>
    <Input
      type="date"
      id="due_date"
      name="due_date"
      bind:value={$form.due_date}
    />
  </div>

  <!-- Submit/Cancel -->
  <div class="flex justify-end gap-2">
    <Button type="submit">
      {editMode ? 'Update' : 'Add'} Billing
    </Button>
    {#if editMode}
      <Button type="button" variant="outline" onclick={handleCancel}>
        Cancel
      </Button>
    {/if}
  </div>
</form>
