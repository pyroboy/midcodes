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
    // SelectValue is not exported, remove it
  } from "$lib/components/ui/select";
  import type { PageData } from './$types';
  import { utilityBillingTypeEnum, utilityBillingSchema } from '$lib/schemas/utility-billings';
  import { AlertCircle, Check } from 'lucide-svelte';
  import * as Alert from '$lib/components/ui/alert';

  type UtilityType = keyof typeof utilityBillingTypeEnum.enum;

  interface Reading {
    id: number;
    meter_id: number;
    reading_date: string;
    reading: number;  // Changed from reading_value to match DB schema
  }

  // Fix the rental_unit structure - it's returned as an array from the API
  interface Rental_unit {
    id: number;
    name: string;
    number: string;
  }

  interface Meter {
    id: number;
    name: string;
    type: string;
    location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
    property_id: number | null;
    floor_id: number | null;
    rental_unit_id: number | null;
    rental_unit: Rental_unit[] | null; // Changed to array to match API response
  }

  interface Props {
    data: PageData;
  }

  // Add this interface to match your schema
  // Make it extend Record<string, unknown> to satisfy the superForm constraint
  interface UtilityBillingForm extends Record<string, unknown> {
    type: string;
    start_date: Date;
    end_date: Date;
    cost_per_unit: number;
    property_id: number; // Changed from org_id
    meter_billings: Array<{
      meter_id: number;
      meter_name: string;
      start_reading: number;
      end_reading: number;
      consumption: number;
      total_cost: number;
      tenant_count: number;
      per_tenant_cost: number;
    }>;
  }

  let { data }: Props = $props();
  
  const { form, errors, enhance, delayed, message } = superForm(data.form, {
    resetForm: true,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        showSuccessMessage = true;
        setTimeout(() => {
          showSuccessMessage = false;
        }, 3000);
      }
    }
  });

  // Format currency (replace the commented out function)
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  let selectedStartDate: string | null = $state(null);
  let selectedEndDate: string | null = $state(null);
  let selectedType: string | null = $state(null);
  let costPerUnit = $state(0);
  let showSuccessMessage = $state(false);
  
  // Define the meter billings structure
  type MeterBilling = {
    meter_id: number;
    meter_name: string;
    start_reading: number;
    end_reading: number;
    consumption: number;
    total_cost: number;
    tenant_count: number;
    per_tenant_cost: number;
  };
  
  let meterBillings: MeterBilling[] = $state([]);

  // Filter meters and readings
  let availableDates = $derived(data.availableReadingDates || []);
  let relevantMeters = $derived(data.meters.filter((meter: any) => 
    !selectedType || meter.type === selectedType
  ));
  
  // Available end dates should be after the selected start date
  let availableEndDates = $derived(availableDates.filter(date => 
    selectedStartDate ? new Date(date) > new Date(selectedStartDate) : true
  ));

  function handleStartDateChange(value: string) {
    selectedStartDate = value;
    // Reset end date if it's now before start date
    if (selectedEndDate && new Date(selectedEndDate) <= new Date(selectedStartDate)) {
      selectedEndDate = null;
    }
    calculateBillings();
  }

  function handleEndDateChange(value: string) {
    selectedEndDate = value;
    calculateBillings();
  }

  function handleTypeChange(value: string) {
    selectedType = value as UtilityType;
    calculateBillings();
  }

  function handleCostPerUnitChange(event: Event) {
    const target = event.target as HTMLInputElement;
    costPerUnit = parseFloat(target.value) || 0;
    calculateBillings();
  }

  function getReadingValue(meterId: number, date: string | null): number {
    if (!date) return 0;
    
    const reading = (data.readings as Reading[]).find(
      r => r.meter_id === meterId && r.reading_date === date
    );
    return reading?.reading || 0; // Changed from reading_value to reading
  }

  function calculateBillings() {
    if (!selectedStartDate || !selectedEndDate || !selectedType || costPerUnit <= 0) {
      meterBillings = [];
      return;
    }

    // Filter meters based on selected utility type
    const filteredMeters = relevantMeters.filter((meter: any) => 
      meter.type === selectedType
    );

    meterBillings = filteredMeters.map((meter: any) => {
      const startReading = getReadingValue(meter.id, selectedStartDate);
      const endReading = getReadingValue(meter.id, selectedEndDate);
      const consumption = Math.max(0, endReading - startReading); // Ensure non-negative
      const totalCost = consumption * costPerUnit;
      
      // Handle location type appropriately
      let tenantCount = 0;
      if (meter.location_type === 'RENTAL_UNIT' && meter.rental_unit_id) {
        tenantCount = data.rental_unitTenantCounts[meter.rental_unit_id] || 0;
      }
      
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

    // Update form values for submission
    $form.start_date = new Date(selectedStartDate);
    $form.end_date = new Date(selectedEndDate);
    $form.type = selectedType;
    $form.cost_per_unit = costPerUnit;
    $form.meter_billings = meterBillings;
    $form.property_id = data.property_id; // Changed from org_id
  }

  // Check if we have the required data for valid calculations
  let hasValidConfiguration = $derived(
    selectedStartDate !== null && 
    selectedEndDate !== null && 
    selectedType !== null && 
    costPerUnit > 0 &&
    meterBillings.length > 0
  );

  // Role-based access control
  let canCreateBillings = $derived(data.canCreateBillings || false);
  let canViewBillings = $derived(
    ['super_admin', 'property_admin', 'accountant', 'manager', 'frontdesk'].includes(data.role)
  );
</script>

<div class="container mx-auto py-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Utility Billings</h1>
    {#if !canViewBillings}
      <Alert.Root variant="destructive">
        <AlertCircle class="h-4 w-4 mr-2" />
        <Alert.Title>You don't have permission to view utility billings</Alert.Title>
      </Alert.Root>
    {/if}
  </div>

  {#if showSuccessMessage}
    <Alert.Root>
      <Check class="h-4 w-4 mr-2" />
      <Alert.Title>Billing created successfully!</Alert.Title>
    </Alert.Root>
  {/if}

  {#if canViewBillings}
    <form method="POST" use:enhance class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label for="start_date">Start Date</Label>
          <Select type="single" onValueChange={handleStartDateChange} value={selectedStartDate || undefined}>
            <SelectTrigger>
              <span>{selectedStartDate ? new Date(selectedStartDate).toLocaleDateString() : "Select start date"}</span>
            </SelectTrigger>
            <SelectContent>
              {#each availableDates as date}
                <SelectItem value={date}>{new Date(date).toLocaleDateString()}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if $errors.start_date}<span class="text-destructive text-sm">{$errors.start_date}</span>{/if}
        </div>

        <div>
          <Label for="end_date">End Date</Label>
          <Select 
            type="single"
            onValueChange={handleEndDateChange} 
            value={selectedEndDate || undefined} 
            disabled={!selectedStartDate}
          >
            <SelectTrigger>
              <span>{selectedEndDate ? new Date(selectedEndDate).toLocaleDateString() : (selectedStartDate ? "Select end date" : "Select start date first")}</span>
            </SelectTrigger>
            <SelectContent>
              {#each availableEndDates as date}
                <SelectItem value={date}>{new Date(date).toLocaleDateString()}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if $errors.end_date}<span class="text-destructive text-sm">{$errors.end_date}</span>{/if}
        </div>

        <div>
          <Label for="type">Utility Type</Label>
          <Select type="single" onValueChange={handleTypeChange} value={selectedType || undefined}>
            <SelectTrigger>
              <span>{selectedType || "Select utility type"}</span>
            </SelectTrigger>
            <SelectContent>
              {#each Object.entries(utilityBillingTypeEnum.enum) as [key, value]}
                <SelectItem value={value}>{value}</SelectItem>
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
            min="0.01"
            step="0.01"
            oninput={handleCostPerUnitChange}
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
                <Table.Cell>{billing.start_reading.toFixed(2)}</Table.Cell>
                <Table.Cell>{billing.end_reading.toFixed(2)}</Table.Cell>
                <Table.Cell>{billing.consumption.toFixed(2)}</Table.Cell>
                <Table.Cell>{formatCurrency(billing.total_cost)}</Table.Cell>
                <Table.Cell>{billing.tenant_count}</Table.Cell>
                <Table.Cell>{formatCurrency(billing.per_tenant_cost)}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>

        {#if !hasValidConfiguration}
          <Alert.Root>
            <AlertCircle class="h-4 w-4 mr-2" />
            <Alert.Title>Please complete all fields to generate billings</Alert.Title>
          </Alert.Root>
        {/if}

        {#if canCreateBillings}
          <Button type="submit" disabled={$delayed || !hasValidConfiguration}>
            {#if $delayed}
              Creating Billings...
            {:else}
              Create Billings
            {/if}
          </Button>
        {/if}
      {:else if selectedStartDate && selectedEndDate && selectedType}
        <Alert.Root>
          <AlertCircle class="h-4 w-4 mr-2" />
          <Alert.Title>No meters found for the selected utility type</Alert.Title>
        </Alert.Root>
      {/if}
    </form>
  {/if}
</div>

{#if import.meta.env.DEV}
  <SuperDebug data={$form} />
{/if}