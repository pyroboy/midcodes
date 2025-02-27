<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Alert from '$lib/components/ui/alert';
  import { Check, RefreshCw, Download } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  
  // Import components
  import ReadingFiltersPanel from './ReadingFiltersPanel.svelte';
  import ReadingEntryModal from './ReadingEntryModal.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import SummaryStatistics from './SummaryStatistics.svelte';
  import ConsolidatedReadingsTable from './ConsolidatedReadingsTable.svelte';
  
  // Import types
  import type { 
    Reading, 
    Meter, 
    Property, 
    MeterReadingEntry, 
    FilterChangeEvent, 
    ReadingSaveEvent, 
    ExportEvent
  } from './types';
  
  // Props
  let { data } = $props<{data: PageData}>();
  
  // Form handling - safely access form data with optional chaining
  const { form, errors, enhance, delayed, message } = superForm(data.form ?? {}, {
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

  // UI state
  let selectedPropertyId: number | null = $state(null);
  let selectedType: string | null = $state(null);
  let costPerUnit = $state(0);
  let showSuccessMessage = $state(false);
  let showReadingModal = $state(false);
  let showExportDialog = $state(false);
  let readingDate = $state(new Date().toISOString().split('T')[0]);
  let meterReadings = $state<MeterReadingEntry[]>([]);
  let searchQuery = $state('');
  let dateFilter = $state('');
  let fromDate = $state('');
  let toDate = $state('');
  let exportFormat = $state('csv');

  // Initialize form data
  $effect(() => {
    $form.cost_per_unit = costPerUnit;
    $form.property_id = selectedPropertyId?.toString();
    $form.type = selectedType;
    $form.reading_date = readingDate;
  });

  // Data sources - safely access with optional chaining and defaults
  const allProperties = data.properties || [];
  const allMeters = data.meters || [];
  const allReadings = data.readings || [];
  const availableDates = data.availableReadingDates || [];
  
  // Filter readings based on selected criteria
  function getFilteredReadings(): Reading[] {
    return allReadings.filter((reading: Reading) => {
      // Property filter
      const meter = allMeters.find((m: Meter) => m.id === reading.meter_id);
      const propertyMatch = selectedPropertyId ? 
        (meter?.property_id === Number(selectedPropertyId)) : true;
      
      // Type filter
      const typeMatch = selectedType ? 
        (meter?.type.toUpperCase() === selectedType.toUpperCase()) : true;
      
      // Date filter
      const dateMatch = dateFilter ? 
        reading.reading_date === dateFilter : true;
      
      // Search filter (meter name)
      const meterName = meter?.name || '';
      const searchMatch = searchQuery ? 
        meterName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      
      return propertyMatch && typeMatch && dateMatch && searchMatch;
    });
  }

  function getAvailableReadingDates(): string[] {
    const uniqueDates: string[] = Array.from(
      new Set(allReadings.map((r: Reading) => r.reading_date))
    );
    
    return uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }

  // Returns the most recent reading for a given meter
  function getPreviousReading(meterId: number): { reading: number | null, date: string | null } {
    const readings = allReadings
      .filter((r: Reading) => r.meter_id === meterId)
      .sort((a: Reading, b: Reading) =>
        new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
      );
    return readings.length > 0 
      ? { reading: readings[0].reading, date: readings[0].reading_date }
      : { reading: null, date: null };
  }

  // Event handlers
  function handleFilterChange(event: CustomEvent<FilterChangeEvent>) {
    const { property, type, date, search } = event.detail;
    selectedPropertyId = property;
    selectedType = type;
    dateFilter = date;
    searchQuery = search;
  }

  // Open the modal and initialize meter readings based on selected property and type
  function openReadingModal() {
    // Reset modal state
    meterReadings = [];
    
    const metersForProperty = allMeters.filter((meter: Meter) =>
      meter.property_id?.toString() === selectedPropertyId?.toString()
    );
    
    // Only include meters of the selected type if one is selected
    const metersToUpdate = selectedType ? 
      metersForProperty.filter((meter: Meter) => meter.type.toUpperCase() === selectedType!.toUpperCase()) : 
      metersForProperty;
    
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

  async function handleSaveReadings(event: CustomEvent<ReadingSaveEvent>) {
    try {
      const { readings, readingDate, costPerUnit } = event.detail;
      
      // Create a FormData object
      const formData = new FormData();
      
      // Add the base data
      formData.append('property_id', selectedPropertyId?.toString() || '');
      formData.append('type', selectedType || '');
      formData.append('cost_per_unit', costPerUnit.toString());
      
      // Add readings as stringified JSON
      formData.append('readings_json', JSON.stringify(readings));

      const response = await fetch('?/addBatchReadings', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save readings');
      }

      // Parse the response
      const result = await response.json();

      showReadingModal = false;
      showSuccessMessage = true;
      setTimeout(() => {
        showSuccessMessage = false;
      }, 3000);

      try {
        // Refresh data
        await invalidateAll();
      } catch (invalidateError) {
        console.error('Error during invalidateAll:', invalidateError);
        alert('Readings saved, but page refresh failed. Please refresh manually.');
      }
    } catch (error) {
      console.error('Error saving readings:', error);
      alert('Failed to save readings. Please try again.');
    }
  }

  function resetFilters() {
    selectedPropertyId = null;
    selectedType = null;
    dateFilter = '';
    searchQuery = '';
  }

  function handleExport(event: CustomEvent<ExportEvent>) {
    const { format, fromDate, toDate } = event.detail;
    console.log(`Exporting in ${format} format from ${fromDate} to ${toDate}`);
    showExportDialog = false;
    alert(`Export in ${format.toUpperCase()} format initiated!`);
  }

  // These call the functions to ensure reactivity
  let filteredReadings = $derived(getFilteredReadings());
  let availableReadingDates = $derived(getAvailableReadingDates());

  // Get utility billing types from data
  import { utilityBillingTypeEnum } from './meterReadingSchema';
</script>

<div class="container mx-auto py-6">
  <!-- Page Header -->
  <div class="flex justify-between items-center mb-4 border-b pb-4">
    <h1 class="text-3xl font-bold">Utility Readings Management</h1>
    
    <div class="flex items-center gap-2">
      <Button 
        class="flex items-center gap-2"
        onclick={() => openReadingModal()}
        disabled={!selectedPropertyId || !selectedType}
      >
      {#if !selectedPropertyId}
        Select a property to continue
      {:else if !selectedType}
        Select a utility type to continue
      {:else}
        Add Meter Readings
      {/if}
      </Button>
      <Button 
        variant="outline"
        class="flex items-center gap-2"
        onclick={() => invalidateAll()}
      >
        <RefreshCw class="h-4 w-4" />
        Refresh
      </Button>
    </div>
  </div>

  {#if showSuccessMessage}
    <Alert.Root class="mb-6 bg-green-50 border-green-200">
      <Check class="h-5 w-5 mr-2 text-green-500" />
      <Alert.Title>Readings saved successfully!</Alert.Title>
    </Alert.Root>
  {/if}

  <!-- Always show Filters Panel -->
  <ReadingFiltersPanel
    properties={allProperties}
    availableReadingDates={availableReadingDates}
    utilityTypes={utilityBillingTypeEnum.enum}
    bind:selectedPropertyId
    bind:selectedType
    bind:dateFilter
    bind:searchQuery
    on:filterChange={handleFilterChange}
  />

  <!-- Main Content -->
  <div class="space-y-6 mt-6">
    <!-- Readings Display Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Meter Readings</h2>
        
        <!-- Export button -->
        <Button 
          variant="outline" 
          onclick={() => showExportDialog = true}
          class="flex items-center gap-2"
          disabled={filteredReadings.length === 0}
        >
          <Download class="h-4 w-4 mr-1" />
          Export Data
        </Button>
      </div>

      {#if filteredReadings.length === 0}
        <div class="bg-gray-50 rounded-md p-6 text-center">
          <p class="text-gray-500">No readings found with the current filters.</p>
          <Button 
            variant="ghost" 
            onclick={() => resetFilters()}
            class="mt-2"
          >
            Reset Filters
          </Button>
        </div>
      {:else}
        <!-- Consolidated Readings Table -->
        <ConsolidatedReadingsTable 
          readings={filteredReadings}
          meters={allMeters}
          properties={allProperties}
        />
      {/if}
    </div>
  </div>

  <!-- Summary Statistics -->
  <SummaryStatistics
    readings={filteredReadings}
    meters={allMeters}
    readingDates={availableReadingDates}
  />

  <!-- Reading Entry Modal -->
  <ReadingEntryModal
    open={showReadingModal}
    utilityType={selectedType || ''}
    {meterReadings}
    {readingDate}
    {costPerUnit}
    on:close={() => showReadingModal = false}
    on:save={handleSaveReadings}
  />

  <!-- Export Dialog -->
  <ExportDialog
    open={showExportDialog}
    bind:fromDate
    bind:toDate
    bind:exportFormat
    on:close={() => showExportDialog = false}
    on:export={handleExport}
  />

  {#if import.meta.env.DEV}
    <SuperDebug data={$form} />
  {/if}
</div>