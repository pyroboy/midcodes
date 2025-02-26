<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Badge } from '$lib/components/ui/badge';
    import type { MeterReadingEntry, ReadingSaveEvent } from './types';
    
    // Props
    export let open: boolean = false;
    // export let propertyName: string = '';
    export let utilityType: string = '';
    export let meterReadings: MeterReadingEntry[] = [];
    export let readingDate: string = new Date().toISOString().split('T')[0];
    export let costPerUnit: number = 0;
    
    const dispatch = createEventDispatcher<{
      close: void;
      save: ReadingSaveEvent;
    }>();
    
    // Helper: Format currency with peso sign
    function formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount);
    }
    
    // Format date for display
    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Update reading values as the user types
    function handleReadingChange(meterId: number, value: string): void {
      const readingValue = parseFloat(value);
      if (!isNaN(readingValue)) {
        const index = meterReadings.findIndex(m => m.meterId === meterId);
        if (index !== -1) {
          const previousReading = meterReadings[index].previousReading || 0;
          // Calculate the consumption (could be negative if reading is less than previous)
          const consumption = readingValue - previousReading;
          // Only calculate cost if consumption is positive
          const cost = consumption > 0 ? consumption * costPerUnit : 0;
          
          meterReadings[index].currentReading = readingValue;
          meterReadings[index].consumption = consumption;
          meterReadings[index].cost = cost;
        }
      }
    }
    
    // Utility to get proper unit label
    function getUnitLabel(): string {
      if (!utilityType) return "Cost Per Unit";
      switch (utilityType.toUpperCase()) {
        case 'ELECTRICITY': return "Cost Per kWh";
        case 'WATER': return "Cost Per m³";
        case 'GAS': return "Cost Per m³";
        case 'INTERNET': return "Cost Per GB";
        case 'CABLE': return "Monthly Fee";
        default: return "Cost Per Unit";
      }
    }
    
    // Utility to get utility color class 
    function getUtilityColorClass(type: string): string {
      switch (type.toUpperCase()) {
        case 'ELECTRICITY': return "bg-amber-100 text-amber-800 border-amber-200";
        case 'WATER': return "bg-blue-100 text-blue-800 border-blue-200";
        case 'GAS': return "bg-red-100 text-red-800 border-red-200";
        case 'INTERNET': return "bg-purple-100 text-purple-800 border-purple-200";
        case 'CABLE': return "bg-green-100 text-green-800 border-green-200";
        default: return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }
    
    function getUtilityBadgeColor(type: string): string {
      switch (type.toUpperCase()) {
        case 'ELECTRICITY': return "bg-amber-500";
        case 'WATER': return "bg-blue-500";
        case 'GAS': return "bg-red-500";
        case 'INTERNET': return "bg-purple-500";
        case 'CABLE': return "bg-green-500";
        default: return "bg-gray-500";
      }
    }
    
    function handleClose(): void {
      dispatch('close');
    }
    
    function handleSave(): void {
      const readingsToSubmit = meterReadings
        .filter(r => r.currentReading !== null)
        .map(r => ({
          meter_id: r.meterId,
          reading: r.currentReading,
          reading_date: readingDate,
          // The server will calculate these values, but we include them for reference
          consumption: r.consumption,
          previous_reading: r.previousReading,
          cost: r.cost
        }));
  
      if (readingsToSubmit.length === 0) {
        alert("Please enter at least one reading.");
        return;
      }
      
      dispatch('save', {
        readings: readingsToSubmit,
        readingDate,
        costPerUnit
      });
    }
  </script>
  
  <Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
    <Dialog.Portal>
      <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[94%] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto">
        <Dialog.Header class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Dialog.Title class="text-2xl font-bold">Add Meter Readings</Dialog.Title>
            {#if utilityType}
              <Badge class="{getUtilityBadgeColor(utilityType)} text-white px-3 py-1">
                {utilityType} - 
                {#if meterReadings.length > 0}
                <p class="text-sm font-medium"> {meterReadings.length} meter{meterReadings.length !== 1 ? 's' : ''} found</p>
              {/if}
              </Badge>
            {/if}
          </div>
          <!-- <Dialog.Description class="text-base text-muted-foreground">
            Enter readings for {utilityType?.toLowerCase() || 'selected'} meters at {propertyName}
          </Dialog.Description> -->
        </Dialog.Header>
  

  
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div class="space-y-2">
            <Label>Reading Date <span class="text-red-500">*</span></Label>
            <Input
              type="date"
              bind:value={readingDate}
              max={new Date().toISOString().split('T')[0]}
              class="w-full"
            />
          </div>
          <div class="space-y-2">
            <Label>{getUnitLabel()} <span class="text-red-500">*</span></Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                bind:value={costPerUnit}
                placeholder="Enter cost per unit"
                class="pl-7"
              />
            </div>
          </div>
        </div>
  
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-4">
          {#if meterReadings.length === 0}
            <div class="p-6 text-center bg-gray-50">
              <p class="text-gray-500">No {utilityType.toLowerCase()} meters found for this property.</p>
            </div>
          {:else}
            <table class="w-full text-sm text-left text-gray-500">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" class="px-4 py-3">Meter Name</th>
                  <th scope="col" class="px-4 py-3">Previous Reading</th>
                  <th scope="col" class="px-4 py-3">Current Reading <span class="text-red-500">*</span></th>
                  <th scope="col" class="px-4 py-3 bg-gray-50">
                    <div class="font-semibold">Consumption</div>
                    <div class="text-xs font-normal">Units Used</div>
                  </th>
                  <th scope="col" class="px-4 py-3 bg-gray-50">
                    <div class="font-semibold">Cost</div>
                    <div class="text-xs font-normal">Amount (₱)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each meterReadings as reading}
                  <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{reading.meterName}</td>
                    <td class="px-4 py-3">
                      {#if reading.previousReading !== null}
                        {reading.previousReading.toFixed(2)}
                        {#if reading.previousDate}
                          <span class="text-xs text-gray-500 block">({formatDate(reading.previousDate)})</span>
                        {/if}
                      {:else}
                        <span class="text-gray-400">No previous reading</span>
                      {/if}
                    </td>
                    <td class="px-4 py-3">
                      <div class="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter reading"
                          oninput={(e) => handleReadingChange(reading.meterId, (e.target as HTMLInputElement).value)}
                          value={reading.currentReading || ''}
                          class="w-full"
                        />
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      {reading.consumption !== null ? reading.consumption.toFixed(2) : '-'}
                    </td>
                    <td class="px-4 py-3">
                      {reading.cost !== null ? formatCurrency(reading.cost) : '-'}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
  
        <Dialog.Footer class="mt-4">
          <Button variant="outline" onclick={() => handleClose()} class="mr-2">Cancel</Button>
          <Button
            onclick={() => handleSave()}
            disabled={meterReadings.filter(r => r.currentReading !== null).length === 0}
          >
            Save Readings
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>