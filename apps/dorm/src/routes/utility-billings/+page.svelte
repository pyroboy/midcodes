<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import * as Table from "$lib/components/ui/table";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "$lib/components/ui/select";
  import { formatCurrency } from '$lib/utils';
  import type { PageData } from './$types';
  import { utilityBillingTypeEnum, utilityBillingSchema } from '$lib/schemas/utility-billings';

  type UtilityType = keyof typeof utilityBillingTypeEnum.enum;

  interface Reading {
    meter_id: number;
    reading_date: string;
    reading_value: number;
  }

  interface Rental_unit {
    id: number;
    name: string;
    number: string;
  }

  interface Meter {
    id: number;
    name: string;
    type: string;
    rental_unit: Rental_unit[];
  }

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  
  const { form, errors, enhance, delayed } = superForm(data.form);

  let selectedStartDate: string | null = $state(null);
  let selectedEndDate: string | null = $state(null);
  let selectedType: UtilityType | null = $state(null);
  let costPerUnit = $state(0);
  let meterBillings: Array<{
    meter_id: number;
    meter_name: string;
    start_reading: number;
    end_reading: number;
    consumption: number;
    total_cost: number;
    tenant_count: number;
    per_tenant_cost: number;
  }> = $state([]);

  let relevantMeters = $derived((data.meters as unknown as Meter[]).filter(meter => meter?.id != null));
  let availableEndDates = $derived(data.availableReadingDates.filter(date => 
    selectedStartDate ? new Date(date.reading_date) > new Date(selectedStartDate) : true
  ));

  function handleStartDateChange(event: CustomEvent<string>) {
    selectedStartDate = event.detail;
    calculateBillings();
  }

  function handleEndDateChange(event: CustomEvent<string>) {
    selectedEndDate = event.detail;
    calculateBillings();
  }

  function handleTypeChange(event: CustomEvent<UtilityType>) {
    selectedType = event.detail;
    calculateBillings();
  }

  function handleCostPerUnitChange(event: Event) {
    const target = event.target as HTMLInputElement;
    costPerUnit = parseFloat(target.value) || 0;
    calculateBillings();
  }

  function getReadingValue(meterId: number, date: string): number {
    const reading = (data.readings as Reading[]).find(
      r => r.meter_id === meterId && r.reading_date === date
    );
    return reading?.reading_value || 0;
  }

  function calculateBillings() {
    if (!selectedStartDate || !selectedEndDate || !selectedType || costPerUnit <= 0) {
      meterBillings = [];
      return;
    }

    const startDate = new Date(selectedStartDate);
    const endDate = new Date(selectedEndDate);

    meterBillings = relevantMeters.map(meter => {
      const startReading = getReadingValue(meter.id, selectedStartDate!);
      const endReading = getReadingValue(meter.id, selectedEndDate!);
      const consumption = endReading - startReading;
      const totalCost = consumption * costPerUnit;
      const rental_unit = meter.rental_unit[0]; // Get first rental_unit since it's an array
      const tenantCount = rental_unit ? (data.rental_unitTenantCounts[rental_unit.id] || 0) : 0;
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

    $form.start_date = startDate;
    $form.end_date = endDate;
    $form.type = selectedType;
    $form.cost_per_unit = costPerUnit;
    $form.meter_billings = meterBillings;
    $form.org_id = data.org_id;
  }

  // Role-based access control
  let canCreateBillings = $derived(['super_admin', 'property_admin', 'accountant'].includes(data.role));
  let canViewBillings = $derived(['super_admin', 'property_admin', 'accountant', 'manager', 'frontdesk'].includes(data.role));
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
          <Select on:change={handleStartDateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select start date">
                {selectedStartDate ? new Date(selectedStartDate).toLocaleDateString() : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {#each data.availableReadingDates as { reading_date }}
                <SelectItem value={reading_date}>
                  {new Date(reading_date).toLocaleDateString()}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if $errors.start_date}<span class="text-destructive text-sm">{$errors.start_date}</span>{/if}
        </div>

        <div>
          <Label for="end_date">End Date</Label>
          <Select on:change={handleEndDateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select end date">
                {selectedEndDate ? new Date(selectedEndDate).toLocaleDateString() : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {#each availableEndDates as { reading_date }}
                <SelectItem value={reading_date}>
                  {new Date(reading_date).toLocaleDateString()}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if $errors.end_date}<span class="text-destructive text-sm">{$errors.end_date}</span>{/if}
        </div>

        <div>
          <Label for="type">Utility Type</Label>
          <Select on:change={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select utility type">
                {selectedType || ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {#each Object.entries(utilityBillingTypeEnum.enum) as [key, value]}
                <SelectItem value={key}>{value}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
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
            on:input={handleCostPerUnitChange}
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