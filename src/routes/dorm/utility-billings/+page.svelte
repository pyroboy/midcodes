<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import * as Table from "$lib/components/ui/table";
  import * as Select from "$lib/components/ui/select";
  import { formatCurrency } from '$lib/utils';
  import type { PageData } from './$types';
  import { utilityBillingTypeEnum } from '$lib/schemas/utility-billings';

  export let data: PageData;
  
  const { form, errors, enhance, delayed } = superForm(data.form, {
    resetForm: true,
    onUpdated: ({ form }) => {
      if (form.data.id) {
        calculateBillings();
      }
    }
  });

  let selectedStartDate: string | null = null;
  let selectedEndDate: string | null = null;
  let selectedType: keyof typeof utilityBillingTypeEnum.enum | null = null;
  let costPerUnit = 0;
  let meterBillings: Array<{
    meter_id: number;
    meter_name: string;
    start_reading: number;
    end_reading: number;
    consumption: number;
    total_cost: number;
    tenant_count: number;
    per_tenant_cost: number;
  }> = [];

  $: availableEndDates = data.availableReadingDates.filter(
    date => !selectedStartDate || new Date(date) > new Date(selectedStartDate)
  );

  $: relevantMeters = data.meters.filter(
    meter => !selectedType || meter.type === selectedType
  );

  function getReadingValue(meterId: number, date: string) {
    const reading = data.readings.find(
      r => r.meter_id === meterId && r.reading_date === date
    );
    return reading?.reading_value || 0;
  }

  function calculateBillings() {
    if (!selectedStartDate || !selectedEndDate || !selectedType || costPerUnit <= 0) {
      meterBillings = [];
      return;
    }

    meterBillings = relevantMeters.map(meter => {
      const startReading = getReadingValue(meter.id, selectedStartDate);
      const endReading = getReadingValue(meter.id, selectedEndDate);
      const consumption = endReading - startReading;
      const totalCost = consumption * costPerUnit;
      const tenantCount = data.roomTenantCounts[meter.room.id] || 0;
      const perTenantCost = tenantCount > 0 ? totalCost / tenantCount : 0;

      return {
        meter_id: meter.id,
        meter_name: meter.name,
        start_reading: startReading,
        end_reading: endReading,
        consumption,
        total_cost: totalCost,
        tenant_count: tenantCount,
        per_tenant_cost: perTenantCost
      };
    });

    $form.start_date = new Date(selectedStartDate);
    $form.end_date = new Date(selectedEndDate);
    $form.type = selectedType;
    $form.cost_per_unit = costPerUnit;
    $form.meter_billings = meterBillings;
    $form.org_id = data.org_id;
  }

  // Role-based access control
  $: canCreateBillings = ['super_admin', 'property_admin', 'accountant'].includes(data.role);
  $: canViewBillings = ['super_admin', 'property_admin', 'accountant', 'manager', 'frontdesk'].includes(data.role);
</script>

<div class="container mx-auto py-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Utility Billings</h1>
    {#if !canViewBillings}
      <p class="text-destructive">You don't have permission to view utility billings</p>
    {/if}
  </div>

  {#if canViewBillings}
    <form method="POST" use:enhance class="space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="start_date">Start Date</Label>
          <Select.Root
            selected={selectedStartDate ? { 
              label: new Date(selectedStartDate).toLocaleDateString(),
              value: selectedStartDate
            } : null}
            onSelectedChange={(s) => {
              if (s) {
                selectedStartDate = s.value;
                calculateBillings();
              }
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select start date" />
            </Select.Trigger>
            <Select.Content>
              {#each data.availableReadingDates as date}
                <Select.Item value={date}>
                  {new Date(date).toLocaleDateString()}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.start_date}<span class="text-destructive text-sm">{$errors.start_date}</span>{/if}
        </div>

        <div>
          <Label for="end_date">End Date</Label>
          <Select.Root
            selected={selectedEndDate ? { 
              label: new Date(selectedEndDate).toLocaleDateString(),
              value: selectedEndDate
            } : null}
            onSelectedChange={(s) => {
              if (s) {
                selectedEndDate = s.value;
                calculateBillings();
              }
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select end date" />
            </Select.Trigger>
            <Select.Content>
              {#each availableEndDates as date}
                <Select.Item value={date}>
                  {new Date(date).toLocaleDateString()}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.end_date}<span class="text-destructive text-sm">{$errors.end_date}</span>{/if}
        </div>

        <div>
          <Label for="type">Utility Type</Label>
          <Select.Root
            selected={selectedType ? { 
              label: selectedType,
              value: selectedType
            } : null}
            onSelectedChange={(s) => {
              if (s) {
                selectedType = s.value as keyof typeof utilityBillingTypeEnum.enum;
                calculateBillings();
              }
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select utility type" />
            </Select.Trigger>
            <Select.Content>
              {#each Object.values(utilityBillingTypeEnum.enum) as type}
                <Select.Item value={type}>{type}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.type}<span class="text-destructive text-sm">{$errors.type}</span>{/if}
        </div>

        <div>
          <Label for="cost_per_unit">Cost Per Unit</Label>
          <Input
            type="number"
            id="cost_per_unit"
            bind:value={costPerUnit}
            min="0"
            step="0.01"
            on:input={calculateBillings}
          />
          {#if $errors.cost_per_unit}<span class="text-destructive text-sm">{$errors.cost_per_unit}</span>{/if}
        </div>
      </div>

      {#if meterBillings.length > 0}
        <Table.Root>
          <Table.Caption>Meter Billings</Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.Head>Meter</Table.Head>
              <Table.Head>Start Reading</Table.Head>
              <Table.Head>End Reading</Table.Head>
              <Table.Head>Consumption</Table.Head>
              <Table.Head>Total Cost</Table.Head>
              <Table.Head>Tenant Count</Table.Head>
              <Table.Head>Cost Per Tenant</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each meterBillings as billing}
              <Table.Row>
                <Table.Cell>{billing.meter_name}</Table.Cell>
                <Table.Cell>{billing.start_reading}</Table.Cell>
                <Table.Cell>{billing.end_reading}</Table.Cell>
                <Table.Cell>{billing.consumption}</Table.Cell>
                <Table.Cell>{formatCurrency(billing.total_cost)}</Table.Cell>
                <Table.Cell>{billing.tenant_count}</Table.Cell>
                <Table.Cell>{formatCurrency(billing.per_tenant_cost)}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>

        {#if canCreateBillings}
          <Button type="submit" disabled={$delayed}>
            {#if $delayed}
              Creating Billings...
            {:else}
              Create Billings
            {/if}
          </Button>
        {/if}
      {/if}
    </form>
  {/if}
</div>

{#if import.meta.env.DEV}
  <SuperDebug data={$form} />
{/if}