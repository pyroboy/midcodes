<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Alert from '$lib/components/ui/alert';
  import { AlertCircle, Check, PlusCircle, Info } from 'lucide-svelte';
  import type { PageData } from './$types';
  import { utilityBillingTypeEnum } from './meterReadingSchema';
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

  // (Optional) Structure for meter billings if needed for preview
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

  // Structure for each meter reading entry (used in the modal)
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

  // Helper: Format currency
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
  let readingDate = $state(new Date().toISOString().split('T')[0]); // Today's date
  let meterReadings = $state<MeterReadingEntry[]>([]);




  // Initialize form data
 $effect(() => {
    $form.cost_per_unit = costPerUnit;
    $form.property_id = selectedPropertyId?.toString();
    $form.type = selectedType;
    $form.reading_date = readingDate;
  });

  // Debug info (optional)
  let debugMeters = $state<string>('');

  // Derived page data
  let availableDates = $derived(data.data.availableReadingDates || []);
  let relevantMeters = $derived(data.data.meters.filter((meter: Meter) => {
    const propertyMatch = selectedPropertyId ? 
      meter.property_id === Number(selectedPropertyId) : true;
    const typeMatch = selectedType ? 
      meter.type.toUpperCase() === selectedType.toUpperCase() : true;
    return propertyMatch && typeMatch;
  }));

  let availableEndDates = $derived(availableDates.filter((date: string) => 
    selectedStartDate ? new Date(date) > new Date(selectedStartDate) : true
  ));

  // Returns the most recent reading for a given meter
  function getPreviousReading(meterId: number): { reading: number | null, date: string | null } {
    const readings = data.data.readings
      .filter((r: Reading) => r.meter_id === meterId)
      .sort((a: Reading, b: Reading) =>
        new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
      );
    return readings.length > 0 
      ? { reading: readings[0].reading, date: readings[0].reading_date }
      : { reading: null, date: null };
  }

  // Handlers for selections
  function handlePropertyChange(value: string) {
    const propertyId = parseInt(value, 10);
    if (!isNaN(propertyId)) {
      selectedPropertyId = propertyId;
      selectedStartDate = null;
      selectedEndDate = null;
      calculateBillings();
    }
  }

  function handleStartDateChange(value: string) {
    selectedStartDate = value;
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

  // (Optional) Update form values for backend processing
  function calculateBillings() {
    if (!selectedPropertyId || !selectedStartDate || !selectedEndDate || !selectedType || costPerUnit <= 0) {
      return;
    }
    $form.start_date = selectedStartDate ? new Date(selectedStartDate) : null;
    $form.end_date = selectedEndDate ? new Date(selectedEndDate) : null;
    $form.type = selectedType;
    $form.cost_per_unit = costPerUnit;
    if (selectedPropertyId !== null) {
      $form.property_id = String(selectedPropertyId);
    }
  }

  // Open the modal and initialize meter readings based on selected property and type
  function openReadingModal() {
    // Reset modal state
    meterReadings = [];
    debugMeters = '';
    
    const metersForProperty = data.data.meters.filter((meter: Meter) =>
      meter.property_id?.toString() === selectedPropertyId?.toString()
    );
    const metersToUpdate = metersForProperty.filter((meter: Meter) => 
      meter.type.toUpperCase() === selectedType?.toUpperCase()
    );
    
    debugMeters = `Found ${metersForProperty.length} meters for property ${selectedPropertyId}. 
                   Of those, ${metersToUpdate.length} match type ${selectedType}.
                   Meters: ${JSON.stringify(metersForProperty.map((m: Meter) => ({ id: m.id, name: m.name, type: m.type })))}`
    
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

  // Update reading values as the user types
  function handleReadingChange(meterId: number, value: string) {
    const readingValue = parseFloat(value);
    if (!isNaN(readingValue)) {
      const index = meterReadings.findIndex(m => m.meterId === meterId);
      if (index !== -1) {
        const previousReading = meterReadings[index].previousReading || 0;
        const consumption = Math.max(0, readingValue - previousReading);
        const cost = consumption * costPerUnit;
        meterReadings[index].currentReading = readingValue;
        meterReadings[index].consumption = consumption;
        meterReadings[index].cost = cost;
      }
    }
  }

  // Utility to get proper unit label
  function getUnitLabel(): string {
    if (!selectedType) return "Cost Per Unit";
    switch (selectedType.toUpperCase()) {
      case 'ELECTRICITY': return "Cost Per kWh";
      case 'WATER': return "Cost Per m³";
      case 'GAS': return "Cost Per m³";
      case 'INTERNET': return "Cost Per GB";
      case 'CABLE': return "Monthly Fee";
      default: return "Cost Per Unit";
    }
  }
</script>

<div class="container mx-auto py-6">
  <div class="flex justify-between items-center mb-8 border-b pb-4">
    <h1 class="text-3xl font-bold">Utility Batch Readings</h1>

  </div>

  {#if showSuccessMessage}
    <Alert.Root class="mb-6">
      <Check class="h-5 w-5 mr-2 text-green-500" />
      <Alert.Title>Readings saved successfully!</Alert.Title>
    </Alert.Root>
  {/if}

  <!-- Reading Modal -->
<Dialog.Root open={showReadingModal} onOpenChange={(open) => !open && (showReadingModal = false)}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
    <Dialog.Header>
      <Dialog.Title>Add Meter Readings</Dialog.Title>
      <Dialog.Description>
        Enter readings for selected meters. These will be used for billing calculations.
      </Dialog.Description>
    </Dialog.Header>

    <div class="grid grid-cols-2 gap-4 py-4">
      <div class="space-y-2">
        <Label>Reading Date</Label>
        <Input
          type="date"
          bind:value={readingDate}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
      <div class="space-y-2">
        <Label>{getUnitLabel()}</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          bind:value={costPerUnit}
          placeholder="Enter cost per unit"
        />
      </div>
    </div>

    <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-4">
      <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3">Meter Name</th>
            <th scope="col" class="px-6 py-3">Previous Reading</th>
            <th scope="col" class="px-6 py-3">Current Reading</th>
            <th scope="col" class="px-6 py-3 bg-gray-50">
              <div class="font-semibold">Consumption</div>
              <div class="text-sm font-normal">Units Used</div>
            </th>
            <th scope="col" class="px-6 py-3 bg-gray-50">
              <div class="font-semibold">Cost</div>
              <div class="text-sm font-normal">Amount</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each meterReadings as reading}
            <tr class="bg-white border-b hover:bg-gray-50">
              <td class="px-6 py-4 font-medium text-gray-900">{reading.meterName}</td>
              <td class="px-6 py-4">
                {#if reading.previousReading !== null}
                  {reading.previousReading.toFixed(2)}
                  {#if reading.previousDate}
                    <span class="text-xs text-gray-500 block">({reading.previousDate})</span>
                  {/if}
                {:else}
                  No previous reading
                {/if}
              </td>
              <td class="px-6 py-4">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter reading"
                  oninput={(e) => handleReadingChange(reading.meterId, (e.target as HTMLInputElement).value)}
                  value={reading.currentReading || ''}
                />
              </td>
              <td class="px-6 py-4">
                {reading.consumption !== null ? reading.consumption.toFixed(2) : '-'}
              </td>
              <td class="px-6 py-4">
                {reading.cost !== null ? formatCurrency(reading.cost) : '-'}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <Dialog.Footer class="mt-4">
      <Button variant="outline" onclick={() => showReadingModal = false}>Cancel</Button>
      <Button
        onclick={async () => {
          try {
            const readingsToSubmit = meterReadings
              .filter(r => r.currentReading !== null)
              .map(r => ({
                meter_id: r.meterId,
                reading: r.currentReading,
                reading_date: readingDate
              }));

            if (readingsToSubmit.length === 0) {
              return;
            }

            const response = await fetch('?/addBatchReadings', {
              method: 'POST',
              body: JSON.stringify({
                readings: readingsToSubmit,
                property_id: selectedPropertyId,
                type: selectedType,
                cost_per_unit: costPerUnit
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              throw new Error('Failed to save readings');
            }

            showReadingModal = false;
            showSuccessMessage = true;
            setTimeout(() => {
              showSuccessMessage = false;
            }, 3000);

            await invalidateAll();
          } catch (error) {
            console.error('Error saving readings:', error);
          }
        }}
      >
        Save Readings
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<!-- Main controls -->
  <form method="POST" action="?/addBatchReadings" use:enhance class="space-y-8">
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
        <Label for="cost_per_unit" class="text-sm font-medium mb-2 block">
          {getUnitLabel()}
        </Label>
        <Input
          type="number"
          id="cost_per_unit"
          bind:value={costPerUnit}
          min="0.01"
          step="0.01"
          oninput={(e: Event) => handleCostPerUnitChange(e)}
          disabled={!selectedPropertyId}
          class="w-full"
          placeholder="0.00"
        />
      </div>

      <!-- Button to open the modal -->
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

    <!-- Additional controls (e.g., date selectors) -->
    {#if selectedPropertyId && selectedType}
      <div class="p-6 bg-gray-50 rounded-lg shadow-sm">
        {#if availableDates.length === 0}
          <Alert.Root variant="default" class="bg-amber-50 border-amber-200 mb-6">
            <AlertCircle class="h-4 w-4 mr-2 text-amber-500" />
            <Alert.Title>No reading dates available</Alert.Title>
            <Alert.Description>
              No meter readings have been recorded for the selected property and utility type.
            </Alert.Description>
          </Alert.Root>
        {/if}
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
      </div>
    {/if}
  </form>

  <!-- Enhanced Modal for Batch Meter Readings -->
  <Dialog.Root bind:open={showReadingModal}>
    <Dialog.Portal>
      <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <Dialog.Content class="fixed left-[50%] top-[50%] z-50 w-full max-w-[94%] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-md border bg-background p-5 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        <Dialog.Header class="space-y-2">
          <Dialog.Title class="text-2xl font-semibold">Add Meter Readings</Dialog.Title>
          <Dialog.Description class="text-sm text-muted-foreground">
            Enter the meter readings for {selectedType?.toLowerCase()} utility on {new Date().toLocaleDateString()}
          </Dialog.Description>
        </Dialog.Header>
        
        <form method="POST" action="?/addBatchReadings" use:enhance class="space-y-6">
          <!-- Reading Date and Cost Per Unit in a single row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="readingDate" class="text-sm font-medium">Reading Date</Label>
              <Input 
                type="date" 
                id="readingDate" 
                name="readingDate"
                bind:value={readingDate}
                class="w-full" 
                required 
              />
              {#if $errors?.readingDate}
                <p class="text-sm text-destructive">{$errors.readingDate}</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="costPerUnit" class="text-sm font-medium">{getUnitLabel()}</Label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  id="costPerUnit" 
                  bind:value={costPerUnit} 
                  min="0.01" 
                  step="0.01" 
                  class="pl-7" 
                  required 
                />
              </div>
              {#if $errors?.cost_per_unit}
                <p class="text-sm text-destructive">{$errors.cost_per_unit}</p>
              {/if}
            </div>
          </div>

<!-- Meter Readings Table -->
<div class="space-y-4">
  <h3 class="text-sm font-medium">Meter Readings</h3>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-100">
          <th class="p-4 text-left">Name</th>
          <th class="p-4 text-left">Previous Reading</th>
          <th class="p-4 text-left">Current Reading</th>
          <th class="p-4 text-left">Consumption</th>
          <th class="p-4 text-left">Cost</th>
        </tr>
      </thead>
      <tbody>
        {#each meterReadings as reading (reading.meterId)}
          <tr class="border-b">
            <td class="p-4">
              <Label for={`reading_${reading.meterId}`} class="font-medium">
                {reading.meterName}
              </Label>
            </td>
            <td class="p-4">
              <div class="font-medium">
                {reading.previousReading !== null ? reading.previousReading : 'N/A'}
                {#if reading.previousDate}
                  <div class="text-sm text-muted-foreground">
                    on {new Date(reading.previousDate).toLocaleDateString()}
                  </div>
                {/if}
              </div>
            </td>
            <td class="p-4">
              <div class="relative">
                <Input 
                  type="number" 
                  id={`reading_${reading.meterId}`} 
                  bind:value={reading.currentReading} 
                  oninput={(e) => handleReadingChange(reading.meterId, (e.target as HTMLInputElement).value)}
                  class="w-full pr-12" 
                  required 
                  placeholder="Enter reading"
                />
                <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-sm text-muted-foreground">
                  {selectedType === 'ELECTRICITY' ? 'kWh' : selectedType === 'WATER' || selectedType === 'GAS' ? 'm³' : ''}
                </div>
              </div>
            </td>
            <td class="p-4">
              {reading.consumption !== null ? reading.consumption.toFixed(2) : '-'}
            </td>
            <td class="p-4">
              {reading.cost !== null ? formatCurrency(reading.cost) : '-'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

          <Dialog.Footer class="flex items-center justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onclick={() => showReadingModal = false}
              class="px-4"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              class="px-4"
              disabled={$delayed}
            >
              {$delayed ? 'Saving...' : 'Save Readings'}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>

  {#if import.meta.env.DEV}
    <SuperDebug data={$form} />
  {/if}
</div>
