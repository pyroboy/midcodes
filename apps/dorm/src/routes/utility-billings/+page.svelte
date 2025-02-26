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
  } from "$lib/components/ui/select";
  import * as Dialog from '$lib/components/ui/dialog';
  import type { PageData } from './$types';
  import { utilityBillingTypeEnum } from './meterReadingSchema';
  import { AlertCircle, Check, PlusCircle, Info } from 'lucide-svelte';
  import * as Alert from '$lib/components/ui/alert';
  import { invalidateAll } from '$app/navigation';

  type UtilityType = keyof typeof utilityBillingTypeEnum.enum;

  interface Reading {
    id: number;
    meter_id: number;
    reading_date: string;
    reading: number;
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
    location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
    property_id: number | null;
    floor_id: number | null;
    rental_unit_id: number | null;
    rental_unit: Rental_unit[] | null;
  }

  interface Property {
    id: number;
    name: string;
  }

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

  // Define the meter reading entry structure
  type MeterReadingEntry = {
    meterId: number;
    meterName: string;
    previousReading: number | null;
    previousDate: string | null;
    currentReading: number | null;
    consumption: number | null;
    cost: number | null;
  };

  let data = $props<{data: PageData}>();
  
  const { form, errors, enhance, delayed, message } = superForm(data.data.form, {
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

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // UI state
  let selectedPropertyId: number | null = $state(null);
  let selectedStartDate: string | null = $state(null);
  let selectedEndDate: string | null = $state(null);
  let selectedType: string | null = $state(null);
  let costPerUnit = $state(0);
  let showSuccessMessage = $state(false);
  let showReadingModal = $state(false);
  
  // Batch reading modal state
  let readingDate = $state<string>(new Date().toISOString().substring(0, 10)); // Today's date
  let meterReadings = $state<MeterReadingEntry[]>([]);
  let isSubmittingReadings = $state(false);
  let modalErrorMessage = $state<string | null>(null);
  let modalSuccessMessage = $state<string | null>(null);
  let modalCostPerUnit = $state<number>(0); // New field for cost per unit in modal
  
  let meterBillings: MeterBilling[] = $state([]);

  // Debug info
  let debugMeters = $state<string>('');

  // Filter meters and readings
  let availableDates = $derived(data.data.availableReadingDates || []);
  let shouldShowBillings = $derived(meterBillings.length > 0);
  
  // Filter meters by both property and type
  let relevantMeters = $derived(data.data.meters.filter((meter: Meter) => {
    const propertyMatch = selectedPropertyId ? 
      // Check both as number and string to handle any type inconsistencies
      meter.property_id === selectedPropertyId || 
      meter.property_id === String(selectedPropertyId) ||
      Number(meter.property_id) === selectedPropertyId : true;
    
    const typeMatch = selectedType ? 
      meter.type === selectedType || 
      meter.type?.toUpperCase() === selectedType.toUpperCase() : true;
    
    return propertyMatch && typeMatch;
  }));
  
  // Available end dates should be after the selected start date
  let availableEndDates = $derived(availableDates.filter((date: string) => 
    selectedStartDate ? new Date(date) > new Date(selectedStartDate) : true
  ));

  // Get previous reading for a meter
  function getPreviousReading(meterId: number): { reading: number | null, date: string | null } {
    const readings = data.data.readings
      .filter((r: Reading) => r.meter_id === meterId)
      .sort((a: Reading, b: Reading) => 
        new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
      );
    
    if (readings.length > 0) {
      return { 
        reading: readings[0].reading, 
        date: readings[0].reading_date 
      };
    }
    
    return { reading: null, date: null };
  }

  // Handle property selection change
  function handlePropertyChange(value: string) {
    // Convert string value to number
    const propertyId = parseInt(value, 10);
    
    // Only set if it's a valid number
    if (!isNaN(propertyId)) {
      selectedPropertyId = propertyId;
      // Reset selections since meters will change
      selectedStartDate = null;
      selectedEndDate = null;
      meterBillings = [];
      calculateBillings();
    }
  }

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
    
    const reading = data.data.readings.find(
      (r: Reading) => r.meter_id === meterId && r.reading_date === date
    );
    
    return reading?.reading || 0;
  }
  
  function calculateBillings() {
    if (!selectedPropertyId || !selectedStartDate || !selectedEndDate || !selectedType || costPerUnit <= 0) {
      meterBillings = [];
      return;
    }

    // Filter meters based on selected property and utility type
    const filteredMeters = relevantMeters.filter((meter: Meter) => {
      // Convert types to handle potential string/number mismatches
      const propMatch = meter.property_id?.toString() === selectedPropertyId?.toString();
      const typeMatch = meter.type?.toUpperCase() === selectedType?.toUpperCase();
      return propMatch && typeMatch;
    });
    
    if (filteredMeters.length === 0) {
      meterBillings = [];
      return;
    }

    meterBillings = filteredMeters.map((meter: Meter) => {
      const startReading = getReadingValue(meter.id, selectedStartDate);
      const endReading = getReadingValue(meter.id, selectedEndDate);
      
      const consumption = Math.max(0, endReading - startReading); // Ensure non-negative
      const totalCost = consumption * costPerUnit;
      
      // Handle location type appropriately
      let tenantCount = 0;
      if (meter.location_type === 'RENTAL_UNIT' && meter.rental_unit_id) {
        tenantCount = data.data.rental_unitTenantCounts[meter.rental_unit_id] || 0;
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
    
    // Ensure property_id is converted to string before assignment
    if (selectedPropertyId !== null) {
      $form.property_id = String(selectedPropertyId); // Convert to string
    }
    
    $form.meter_billings = meterBillings;
  }
  
  // Function to open the meter reading modal
  function openReadingModal() {
    // Reset modal state
    modalErrorMessage = null;
    modalSuccessMessage = null;
    modalCostPerUnit = costPerUnit || 0; // Use the main cost per unit as a starting value
    readingDate = new Date().toISOString().substring(0, 10);
    
    // Get all meters for the selected property and type (with more detailed debugging)
    const metersForProperty = data.data.meters.filter((meter: Meter) => {
      const propMatch = meter.property_id?.toString() === selectedPropertyId?.toString();
      return propMatch;
    });
    
    const metersToUpdate = metersForProperty.filter((meter: Meter) => 
      meter.type?.toUpperCase() === selectedType?.toUpperCase()
    );
    
    // Set debug info
    debugMeters = `Found ${metersForProperty.length} meters for property ${selectedPropertyId}. 
                   Of those, ${metersToUpdate.length} match the type ${selectedType}.
                   All meters: ${JSON.stringify(metersForProperty.map(m => ({ id: m.id, name: m.name, type: m.type })))}`;
    
    // Initialize reading values with previous readings
    meterReadings = metersToUpdate.map((meter: Meter) => {
      const previousData = getPreviousReading(meter.id);
      return {
        meterId: meter.id,
        meterName: meter.name,
        previousReading: previousData.reading,
        previousDate: previousData.date,
        currentReading: null,
        consumption: null,
        cost: null
      };
    });
    
    showReadingModal = true;
  }
  
  // Handle reading input change and auto-calculate consumption and cost
  function handleReadingChange(meterId: number, value: string) {
    const readingValue = parseFloat(value);
    if (!isNaN(readingValue)) {
      const index = meterReadings.findIndex(m => m.meterId === meterId);
      if (index !== -1) {
        const previousReading = meterReadings[index].previousReading || 0;
        const consumption = Math.max(0, readingValue - previousReading);
        const cost = consumption * modalCostPerUnit;
        
        meterReadings[index].currentReading = readingValue;
        meterReadings[index].consumption = consumption;
        meterReadings[index].cost = cost;
      }
    }
  }
  
  // Handle cost per unit change in modal and recalculate all costs
  function handleModalCostChange(event: Event) {
    const target = event.target as HTMLInputElement;
    modalCostPerUnit = parseFloat(target.value) || 0;
    
    // Recalculate costs for all readings
    meterReadings = meterReadings.map(entry => {
      if (entry.currentReading !== null && entry.previousReading !== null) {
        const consumption = Math.max(0, entry.currentReading - (entry.previousReading || 0));
        return {
          ...entry,
          consumption,
          cost: consumption * modalCostPerUnit
        };
      }
      return entry;
    });
  }


async function submitReadings() {
  try {
    // Construct FormData from the form inputs
    const formData = new FormData();
    formData.append('readingDate', document.querySelector('#readingDate').value);
    formData.append('costPerKwh', document.querySelector('#costPerKwh').value);
    formData.append('currentReading', document.querySelector('#currentReading').value);
    // Add more fields as needed based on your form

    // Submit to the form action
    const response = await fetch('/utility-billings?/addBatchReadings', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // Handle the response based on type
    if (result.type === 'failure') {
      modalErrorMessage = result.data.message || 'An error occurred';
      modalSuccessMessage = '';
    } else if (result.type === 'success') {
      modalSuccessMessage = result.data.message || 'Readings saved successfully';
      modalErrorMessage = '';
      // Optionally, close the modal or reset the form here
    }
  } catch (error) {
    console.error('Submission error:', error);
    modalErrorMessage = 'Network error: ' + error.message;
    modalSuccessMessage = '';
  }
}
  // Get unit label based on utility type
  function getUnitLabel(): string {
    if (!selectedType) return "Cost Per Unit";
    
    switch (selectedType.toUpperCase()) {
      case 'ELECTRICITY':
        return "Cost Per kWh";
      case 'WATER':
        return "Cost Per m³";
      case 'GAS':
        return "Cost Per m³";
      case 'INTERNET':
        return "Cost Per GB";
      case 'CABLE':
        return "Monthly Fee";
      default:
        return "Cost Per Unit";
    }
  }

  // Check if we have the required data for valid calculations
  let hasValidConfiguration = $derived(
    selectedPropertyId !== null && 
    selectedStartDate !== null && 
    selectedEndDate !== null && 
    selectedType !== null && 
    costPerUnit > 0 &&
    meterBillings.length > 0
  );
</script>

<div class="container mx-auto py-6">
  <div class="flex justify-between items-center mb-8 border-b pb-4">
    <h1 class="text-3xl font-bold">Utility Billings</h1>
  </div>

  {#if showSuccessMessage}
    <Alert.Root class="mb-6">
      <Check class="h-5 w-5 mr-2 text-green-500" />
      <Alert.Title>Billing created successfully!</Alert.Title>
    </Alert.Root>
  {/if}

  <form method="POST" action="?/createBilling" use:enhance class="space-y-8">
    <!-- Single row with all main controls -->
    <div class="flex flex-wrap items-end gap-4 p-6 bg-gray-50 rounded-lg shadow-sm">
      <!-- Property selection -->
      <div class="flex-1 min-w-[200px]">
        <Label for="property" class="text-sm font-medium mb-2 block">Property</Label>
        <Select 
          type="single" 
          onValueChange={handlePropertyChange} 
          value={selectedPropertyId?.toString() || undefined}
          disabled={data.data.properties.length <= 1 && selectedPropertyId !== null}
        >
          <SelectTrigger class="w-full">
            <span>
              {selectedPropertyId 
                ? data.data.properties.find((p: Property) => p.id === selectedPropertyId)?.name || "Select property" 
                : "Select property"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {#each data.data.properties as property}
              <SelectItem value={property.id.toString()}>{property.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>

      <!-- Utility type selection -->
      <div class="flex-1 min-w-[200px]">
        <Label for="type" class="text-sm font-medium mb-2 block">Utility Type</Label>
        <Select 
          type="single" 
          onValueChange={handleTypeChange} 
          value={selectedType || undefined}
          disabled={!selectedPropertyId}
        >
          <SelectTrigger class="w-full">
            <span>{selectedType || (selectedPropertyId ? "Select utility type" : "Select property first")}</span>
          </SelectTrigger>
          <SelectContent>
            {#each Object.entries(utilityBillingTypeEnum.enum) as [key, value]}
              <SelectItem value={value}>{value}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      
      <!-- Cost per unit -->
      <div class="flex-1 min-w-[160px]">
        <Label for="cost_per_unit" class="text-sm font-medium mb-2 block">{getUnitLabel()}</Label>
        <Input
          type="number"
          id="cost_per_unit"
          bind:value={costPerUnit}
          min="0.01"
          step="0.01"
          oninput={handleCostPerUnitChange}
          disabled={!selectedPropertyId}
          class="w-full"
          placeholder="0.00"
        />
      </div>

      <!-- Add Readings button -->
      <div>
        <Button 
          type="button"
          variant="outline"
          class="flex items-center gap-2 h-10"
          onclick={openReadingModal}
          disabled={!selectedPropertyId || !selectedType}
        >
          <PlusCircle class="h-4 w-4" />
          Add Meter Reading
        </Button>
      </div>
    </div>

    <!-- Alerts and date selectors in second row -->
    {#if selectedPropertyId && selectedType}
      <div class="p-6 bg-gray-50 rounded-lg shadow-sm">
        <!-- If no readings, show a message -->
        {#if availableDates.length === 0}
          <Alert.Root variant="default" class="bg-amber-50 border-amber-200 mb-6">
            <AlertCircle class="h-4 w-4 mr-2 text-amber-500" />
            <Alert.Title>No reading dates available</Alert.Title>
            <Alert.Description>
              No meter readings have been recorded for the selected property and utility type.
              Add meter readings using the button above, or proceed with a dummy billing by entering the cost per unit.
            </Alert.Description>
          </Alert.Root>
        {/if}

        <!-- Date selectors only if readings are available -->
        {#if availableDates.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label for="start_date" class="text-sm font-medium mb-2 block">Start Date</Label>
              <Select 
                type="single" 
                onValueChange={handleStartDateChange} 
                value={selectedStartDate || undefined}
              >
                <SelectTrigger class="w-full">
                  <span>
                    {selectedStartDate 
                      ? new Date(selectedStartDate).toLocaleDateString() 
                      : "Select start date"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {#each availableDates as date}
                    <SelectItem value={date}>{new Date(date).toLocaleDateString()}</SelectItem>
                  {/each}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label for="end_date" class="text-sm font-medium mb-2 block">End Date</Label>
              <Select 
                type="single"
                onValueChange={handleEndDateChange} 
                value={selectedEndDate || undefined} 
                disabled={!selectedStartDate}
              >
                <SelectTrigger class="w-full">
                  <span>
                    {selectedEndDate 
                      ? new Date(selectedEndDate).toLocaleDateString() 
                      : (selectedStartDate ? "Select end date" : "Select start date first")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {#each availableEndDates as date}
                    <SelectItem value={date}>{new Date(date).toLocaleDateString()}</SelectItem>
                  {/each}
                </SelectContent>
              </Select>
            </div>
          </div>
        {/if}
        
        <!-- Show error only if we have property and type selected but no meters found -->
        {#if relevantMeters.length === 0}
          <Alert.Root variant="destructive" class="mt-6">
            <AlertCircle class="h-4 w-4 mr-2" />
            <Alert.Title>No meters found for the selected property and utility type</Alert.Title>
            <Alert.Description>
              Please make sure meters are configured for this property with the selected utility type.
              Currently looking for meters with property_id: {selectedPropertyId} and type: {selectedType}.
            </Alert.Description>
          </Alert.Root>
          
          {#if import.meta.env.DEV}
            <div class="mt-4 p-4 bg-gray-100 rounded-md text-sm">
              <p class="font-semibold mb-2">Debug Info:</p>
              <pre class="overflow-auto">{debugMeters}</pre>
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- Billing table -->
    {#if meterBillings.length > 0}
      <div class="mt-4 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <Table.Root>
          <Table.Caption class="p-4 bg-gray-50 border-b font-semibold text-lg">
            {availableDates.length === 0 ? 'Estimated Meter Billings (No Readings)' : 'Meter Billings'}
          </Table.Caption>
          <Table.Header>
            <Table.Row class="bg-gray-100">
              <Table.Head class="font-bold">Meter</Table.Head>
              <Table.Head class="font-bold text-right">Start Reading</Table.Head>
              <Table.Head class="font-bold text-right">End Reading</Table.Head>
              <Table.Head class="font-bold text-right">Consumption</Table.Head>
              <Table.Head class="font-bold text-right">Total Cost</Table.Head>
              <Table.Head class="font-bold text-right">Tenant Count</Table.Head>
              <Table.Head class="font-bold text-right">Cost Per Tenant</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each meterBillings as billing}
              <Table.Row class="hover:bg-gray-50">
                <Table.Cell class="font-medium">{billing.meter_name}</Table.Cell>
                <Table.Cell class="text-right">{billing.start_reading.toFixed(2)}</Table.Cell>
                <Table.Cell class="text-right">{billing.end_reading.toFixed(2)}</Table.Cell>
                <Table.Cell class="text-right">{billing.consumption.toFixed(2)}</Table.Cell>
                <Table.Cell class="text-right font-medium">{formatCurrency(billing.total_cost)}</Table.Cell>
                <Table.Cell class="text-right">{billing.tenant_count}</Table.Cell>
                <Table.Cell class="text-right font-medium">{formatCurrency(billing.per_tenant_cost)}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <div class="mt-6 flex justify-end">
        <Button 
          type="submit" 
          disabled={$delayed || meterBillings.length === 0}
          class="px-6 py-2 text-base"
        >
          {#if $delayed}
            <span class="mr-2">Creating Billings...</span>
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          {:else}
            Create Billings
          {/if}
        </Button>
      </div>
    {:else if shouldShowBillings}
      <Alert.Root variant="destructive" class="mt-6">
        <AlertCircle class="h-4 w-4 mr-2" />
        <Alert.Title>Could not generate billing</Alert.Title>
        <Alert.Description>
          No meter billings could be generated with the current configuration.
          {#if availableDates.length === 0}
            This may be because no meters exist for this property and utility type.
          {:else}
            This may be because readings are missing or invalid.
          {/if}
        </Alert.Description>
      </Alert.Root>
    {/if}
  </form>

  <!-- Batch Reading Modal -->
  <Dialog.Root open={showReadingModal} onOpenChange={() => showReadingModal = false}>
    <Dialog.Content class="sm:max-w-2xl w-full">
      <Dialog.Header>
        <Dialog.Title>
          Add Meter Readings - {selectedType} Meters
          {#if selectedPropertyId}
            ({data.data.properties.find((p: Property) => p.id === selectedPropertyId)?.name})
          {/if}
        </Dialog.Title>
        <Dialog.Description>
          Enter new readings for all meters in this category. All readings will use the same date.
        </Dialog.Description>
      </Dialog.Header>
      
      {#if modalErrorMessage}
        <Alert.Root variant="destructive" class="mt-2">
          <AlertCircle class="h-4 w-4 mr-2" />
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{modalErrorMessage}</Alert.Description>
        </Alert.Root>
      {/if}
      
      {#if modalSuccessMessage}
        <Alert.Root variant="default" class="mt-2 bg-green-50 border-green-200">
          <Check class="h-4 w-4 mr-2 text-green-500" />
          <Alert.Title>Success</Alert.Title>
          <Alert.Description>{modalSuccessMessage}</Alert.Description>
        </Alert.Root>
      {/if}
      
      <div class="py-4">
        <!-- Modal inputs side by side -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label for="reading_date" class="text-sm font-medium mb-2 block">Reading Date (for all meters)</Label>
            <Input 
              type="date" 
              id="reading_date"
              bind:value={readingDate}
            />
          </div>
          
          <div>
            <Label for="modal_cost_per_unit" class="text-sm font-medium mb-2 block">{getUnitLabel()}</Label>
            <Input
              type="number"
              id="modal_cost_per_unit"
              bind:value={modalCostPerUnit}
              min="0.01"
              step="0.01"
              oninput={handleModalCostChange}
              class="w-full"
              placeholder="0.00"
            />
          </div>
        </div>
        
        {#if meterReadings.length > 0}
          <Table.Root>
            <Table.Header>
              <Table.Row class="bg-gray-100">
                <Table.Head class="font-bold">Meter Name</Table.Head>
                <Table.Head class="font-bold">Previous Reading</Table.Head>
                <Table.Head class="font-bold">Current Reading</Table.Head>
                <Table.Head class="font-bold">Consumption</Table.Head>
                <Table.Head class="font-bold">Cost</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each meterReadings as entry}
                <Table.Row>
                  <Table.Cell>{entry.meterName}</Table.Cell>
                  <Table.Cell>
                    {entry.previousReading !== null ? entry.previousReading.toFixed(2) : 'No previous reading'}
                    {#if entry.previousDate}
                      <span class="text-xs text-gray-500 block">{new Date(entry.previousDate).toLocaleDateString()}</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter reading"
                      value={entry.currentReading || ''}
                      oninput={(e) => handleReadingChange(entry.meterId, (e.target as HTMLInputElement).value)}
                    />
                  </Table.Cell>
                  <Table.Cell class="text-right">
                    {entry.consumption !== null ? entry.consumption.toFixed(2) : '-'}
                  </Table.Cell>
                  <Table.Cell class="text-right">
                    {entry.cost !== null ? formatCurrency(entry.cost) : '-'}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        {:else}
          <div class="text-center py-6 bg-gray-50 rounded-md">
            <p>No meters found for this property and utility type.</p>
            {#if import.meta.env.DEV}
              <pre class="text-left text-xs mt-4 p-2 bg-gray-100">{debugMeters}</pre>
            {/if}
          </div>
        {/if}
      </div>
      
      <Dialog.Footer class="flex justify-between">
        <Button variant="outline" type="button" onclick={() => showReadingModal = false}>
          Cancel
        </Button>
        <Button 
          type="button" 
          onclick={submitReadings}
          disabled={isSubmittingReadings}
        >
          {#if isSubmittingReadings}
            <span class="mr-2">Saving...</span>
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          {:else}
            Save Readings
          {/if}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  {#if import.meta.env.DEV}
    <SuperDebug data={$form} />
  {/if}
</div>