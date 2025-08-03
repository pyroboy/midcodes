<script lang="ts">
  // Main page script for utility billings
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Alert from '$lib/components/ui/alert';
  import { Check, RefreshCw, Download } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import { tick } from 'svelte';
  import type { PageData } from './$types';
  
  // Import components
  import ReadingFiltersPanel from './ReadingFiltersPanel.svelte';
  import ReadingEntryModal from './ReadingEntryModal.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import SummaryStatistics from './SummaryStatistics.svelte';
  import ConsolidatedReadingsTable from './ConsolidatedReadingsTable.svelte';
  import TenantShareModal from './TenantShareModal.svelte';
  import PrintPreviewModal from './PrintPreviewModal.svelte';
  
  // Import types
  import { propertyStore } from '$lib/stores/property';
  import type { 
    Reading, 
    Meter, 
    Property, 
    MeterReadingEntry, 
    FilterChangeEvent, 
    ReadingSaveEvent, 
    ExportEvent,
    MeterData,
    Filters,
	ShareData
  } from './types';
  
  // Props
  let { data } = $props<{data: PageData}>();
  
  // Form handling - safely access form data with optional chaining
  const { form, errors, enhance, delayed, message } = superForm(data.form ?? {}, {
    resetForm: true,
    onResult: ({ result }) => {
            if (result.type === 'success') {
        modals.reading = false; // Close modal on success
        showSuccessMessage = true;
        setTimeout(() => {
          showSuccessMessage = false;
        }, 3000);
      }
    }
  });

  // Global state
  let selectedProperty = $derived($propertyStore.selectedProperty);

  // UI state
  let showSuccessMessage = $state(false);

  // Grouped state for reading entry modal
  let readingEntry = $state({
    utilityType: '',
    meterReadings: [] as MeterReadingEntry[],
    readingDate: new Date().toISOString().split('T')[0],
    costPerUnit: 0
  });

  // Grouped state for filters
  let filters = $state({
    searchQuery: '',
    date: '',
    type: null as string | null
  });

  // Grouped state for modal visibility
  let modals = $state({
    reading: false,
    export: false,
    tenantShare: false,
    printPreview: false
  });

  // Grouped state for tenant sharing
  let tenantShare = $state({
    selectedMeter: null as MeterData | null,
    dataForPreview: [] as ShareData[],
    selectedReading: null as MeterData | null
  });

  // State for export dialog
  let fromDate = $state('');
  let toDate = $state('');
  let exportFormat = $state('csv');

  // Initialize form data
  $effect(() => {
    $form.cost_per_unit = readingEntry.costPerUnit;
    $form.property_id = selectedProperty?.id.toString();
    $form.type = filters.type;
    $form.reading_date = readingEntry.readingDate;
  });

  // Data sources - safely access with optional chaining and defaults
  const allProperties = data.properties || [];
  const allMeters = data.meters || [];
  const allReadings = data.readings || [];
  const availableDates = data.availableReadingDates || [];

  let leases = $derived(data.leases || []);

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
  const activeFilters: Filters = $derived({
    property: selectedProperty,
    type: filters.type,
    date: filters.date,
    search: filters.searchQuery
  });



  // Open the modal and initialize meter readings based on selected property and type
  function openReadingModal() {
    if (!selectedProperty) return;

    const metersForProperty = allMeters.filter((meter: Meter) => meter.property_id === selectedProperty.id);
    
    let metersToUpdate = metersForProperty;
    if (filters.type) {
      metersToUpdate = metersForProperty.filter(
        (meter: Meter) => meter.type && meter.type.toUpperCase() === filters.type!.toUpperCase()
      );
    }
    
    // Populate the centralized state object
    readingEntry.utilityType = filters.type || '';
    readingEntry.meterReadings = metersToUpdate.map((meter: Meter) => {
      const { reading: previousReading, date: previousDate } = getPreviousReading(meter.id);
      return {
        meterId: meter.id,
        meterName: meter.name,
        previousReading,
        previousDate,
        currentReading: null,
        consumption: null,
        cost: null,
        initialReading: meter.initial_reading
      };
    });
    readingEntry.readingDate = new Date().toISOString().split('T')[0];
    readingEntry.costPerUnit = 0;

    modals.reading = true;
  }

  function openTenantShareModal(meter: MeterData) {
    console.log('Opening tenant share modal for:', meter);
    // Create a new object to ensure reactivity
    tenantShare.selectedReading = {...meter};
    tenantShare.selectedMeter = {...meter};
    // Use requestAnimationFrame to ensure state is updated before showing modal
    requestAnimationFrame(() => {
      modals.tenantShare = true;
    });
  }

  function handleGeneratePreview(data: ShareData[]) {
    console.log('Generating print preview with data:', data);
    tenantShare.dataForPreview = data;
    // Close the tenant share modal before opening the print preview
    modals.tenantShare = false;
    // Use a timeout to ensure the first modal has closed before opening the next
    setTimeout(() => {
      modals.printPreview = true;
    }, 150);
  }

  function handleBackToTenantShare() {
    console.log('Navigating back to tenant share modal.');
    modals.printPreview = false;
    modals.tenantShare = true;
  }

  function handlePrint() {
    // TODO: Implement printing functionality
    console.log('Printing...');
  }



      async function handleSaveReadings(event: ReadingSaveEvent) {
    const { readings, costPerUnit, readingDate } = event;
console.log('handleSaveReadings', readings);
    // Update the form state with the latest data from the modal
    $form.readings_json = JSON.stringify(readings);            // ← add this (or replace readings_json)
    $form.cost_per_unit = costPerUnit;
    $form.reading_date = readingDate;
    $form.type = filters.type;

    console.log('Form data:', $form);

    // Wait for the DOM to update with the new form values
    await tick();

    ((document.querySelector('form[action="?/addBatchReadings"]') as HTMLFormElement)?.requestSubmit());

  }

  function resetFilters() {
    filters.type = null;
    filters.date = '';
    filters.searchQuery = '';
  }

  function handleExport(event: CustomEvent<ExportEvent>) {
    const { format, fromDate, toDate } = event.detail;
    console.log(`Exporting in ${format} format from ${fromDate} to ${toDate}`);
    modals.export = false;
    alert(`Export in ${format.toUpperCase()} format initiated!`);
  }

  // Get utility billing types from data
  import { utilityBillingTypeEnum } from './meterReadingSchema';
</script>

<div class="container mx-auto py-6">
  <!-- Page Header -->
  <div class="flex justify-between items-center mb-4 border-b pb-4">
    <h1 class="text-3xl font-bold">Utility Readings Management</h1>
    
    <div class="flex items-center gap-2">

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
    availableReadingDates={availableDates}
    utilityTypes={utilityBillingTypeEnum.enum}
    selectedProperty={selectedProperty}
    bind:filters
    addReadings={openReadingModal}
  />

  <TenantShareModal
    bind:open={modals.tenantShare}
    reading={tenantShare.selectedMeter}
    leases={data.leases || []}
    leaseMeterBilledDates={data.leaseMeterBilledDates}
    generatePreview={handleGeneratePreview}
    close={() => {
      modals.tenantShare = false;
      tenantShare.selectedMeter = null;
    }}
  />

  <PrintPreviewModal
    bind:open={modals.printPreview}
    reading={tenantShare.selectedReading}
    data={tenantShare.dataForPreview}
    onBack={handleBackToTenantShare}
    close={() => (modals.printPreview = false)}
  />

  <form method="POST" action="?/addBatchReadings" use:enhance>
    <input type="hidden" name="type"          bind:value={$form.type} />
    <input type="hidden" name="cost_per_unit" bind:value={$form.cost_per_unit} />
    <input type="hidden" name="reading_date"  bind:value={$form.reading_date} />
    <input type="hidden" name="readings_json" bind:value={$form.readings_json} />
  {#if modals.reading && selectedProperty}
    <ReadingEntryModal
      bind:open={modals.reading}
      previousReadingGroups={data.previousReadingGroups}
      property={selectedProperty}
      utilityType={readingEntry.utilityType}
      meters={allMeters}
      meterReadings={readingEntry.meterReadings}
      readingDate={readingEntry.readingDate}
      costPerUnit={readingEntry.costPerUnit}
      onSave={handleSaveReadings}
      close={() => (modals.reading = false)}
    />
  {/if}
</form>

  <ExportDialog
    bind:open={modals.export}
    bind:fromDate
    bind:toDate
    bind:exportFormat
    on:export={handleExport}
    on:close={() => (modals.export = false)}
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
          onclick={() => modals.export = true}
          class="flex items-center gap-2"
          disabled={allReadings.length === 0}
        >
          <Download class="h-4 w-4 mr-1" />
          Export Data
        </Button>
      </div>

      <ConsolidatedReadingsTable 
        readings={allReadings}
        meters={allMeters}
        properties={allProperties}
        filters={activeFilters}
        onShareReading={openTenantShareModal}
        meterLastBilledDates={data.meterLastBilledDates}
      />
    </div>
  </div>

  <!-- Summary Statistics -->
  <SummaryStatistics
    readings={allReadings}
    meters={allMeters}
    readingDates={availableDates}
  />

  {#if import.meta.env.DEV}
    <SuperDebug data={$form} />
  {/if}
</div>