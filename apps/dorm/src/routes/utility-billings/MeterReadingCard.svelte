<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import { ChevronDown, ChevronRight } from 'lucide-svelte';
    import type { Meter, Reading, Property } from './types';
  
    export let meter: Meter;
    export let readings: Reading[] = [];
    export let allReadings: Reading[] = [];
    export let costPerUnit: number = 0;
    export let properties: Property[] = [];
  
    // UI state
    let expanded = false;
  
    // Get a color class based on utility type
    function getUtilityColorClass(type: string): string {
      switch (type.toUpperCase()) {
        case 'ELECTRICITY': return "bg-amber-100 text-amber-800";
        case 'WATER': return "bg-blue-100 text-blue-800";
        case 'GAS': return "bg-red-100 text-red-800";
        case 'INTERNET': return "bg-purple-100 text-purple-800";
        case 'CABLE': return "bg-green-100 text-green-800";
        default: return "bg-gray-100 text-gray-800";
      }
    }
  
    // Property name lookup helper
    function getPropertyName(propertyId: number | null): string {
      if (!propertyId) return 'N/A';
      const property = properties.find(p => p.id === propertyId);
      return property ? property.name : 'Unknown';
    }
  
    // Format date for display
    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  
    // Helper: Format numeric value with appropriate decimal places
    function formatNumber(value: number): string {
      // If value is a whole number, show no decimals
      if (value === Math.floor(value)) {
        return value.toString();
      }
      // Otherwise show up to 2 decimal places
      return value.toFixed(2);
    }
  
    // Helper: Format currency with peso sign
    function formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
  
    // Get consumption from database or calculate it
    function getConsumption(reading: Reading): number | null {
      // First check if consumption is already stored in the database
      if (reading.consumption !== undefined && reading.consumption !== null) {
        return reading.consumption;
      }
      
      // Otherwise calculate it based on the previous reading
      const meterReadings = allReadings
        .filter(r => r.meter_id === meter.id)
        .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());
      
      const currentIndex = meterReadings.findIndex(r => 
        r.reading_date === reading.reading_date && r.reading === reading.reading);
        
      if (currentIndex < 0 || currentIndex === meterReadings.length - 1) return null;
      
      // Get the previous reading (the one after this one in the sorted array)
      const previousReading = meterReadings[currentIndex + 1].reading;
      return reading.reading - previousReading;
    }
    
    // Get unit cost - using cost_per_unit from database if available
    function getUnitCost(reading: Reading): number | null {
      // First check if cost_per_unit is stored in the database
      if (reading.cost_per_unit !== undefined && reading.cost_per_unit !== null) {
        return reading.cost_per_unit;
      }
      
      // Otherwise use the costPerUnit prop
      return costPerUnit > 0 ? costPerUnit : null;
    }
    
    // Get total cost - using cost from database if available
    function getTotalCost(reading: Reading): number | null {
      // First check if cost is already stored in the database
      if (reading.cost !== undefined && reading.cost !== null) {
        return reading.cost;
      }
      
      // Otherwise calculate it based on consumption and unit cost
      const consumption = getConsumption(reading);
      const unitCost = getUnitCost(reading);
      
      if (consumption !== null && unitCost !== null && consumption > 0) {
        return consumption * unitCost;
      }
      
      return null;
    }
  
    // Helper functions for summary data
    function getLatestReading(): Reading | null {
      if (readings.length === 0) return null;
      
      // Sort by date, newest first
      const sortedReadings = [...readings].sort((a, b) => 
        new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());
        
      return sortedReadings[0];
    }
    
    function getPreviousReading(): Reading | null {
      if (readings.length <= 1) return null;
      
      // Sort by date, newest first
      const sortedReadings = [...readings].sort((a, b) => 
        new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());
        
      return sortedReadings[1];
    }
    
    function getTotalConsumption(): number {
      return readings.reduce((total, reading) => {
        const consumption = getConsumption(reading);
        return total + (consumption || 0);
      }, 0);
    }
    
    function getTotalCostSum(): number {
      return readings.reduce((total, reading) => {
        const cost = getTotalCost(reading);
        return total + (cost || 0);
      }, 0);
    }
    
    // Toggle expanded state
    function toggleExpanded() {
      expanded = !expanded;
    }
    
    // Get unit label based on utility type
    function getUnitLabel(): string {
      switch (meter.type.toUpperCase()) {
        case 'ELECTRICITY': return "kWh";
        case 'WATER': return "m³";
        case 'GAS': return "m³";
        case 'INTERNET': return "GB";
        case 'CABLE': return "month";
        default: return "unit";
      }
    }
  </script>
  
  <Card.Root class="mb-4 cursor-pointer hover:shadow-md transition-shadow" onclick={toggleExpanded}>
    <div class="p-4">
      <!-- Header with toggle icon -->
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          {#if expanded}
            <ChevronDown class="h-5 w-5 text-gray-500" />
          {:else}
            <ChevronRight class="h-5 w-5 text-gray-500" />
          {/if}
          <h3 class="text-lg font-semibold">{meter.name}</h3>
          <span class={`px-2 py-1 rounded-full text-xs font-medium ${getUtilityColorClass(meter.type)}`}>
            {meter.type}
          </span>
        </div>
        <span class="text-sm text-gray-500">{readings.length} readings</span>
      </div>
      
      <!-- Property and unit info -->
      <div class="text-sm text-gray-500 mb-3">
        {getPropertyName(meter.property_id)}
        {#if meter.rental_unit_id && meter.rental_unit && meter.rental_unit.length > 0}
          · Unit: {meter.rental_unit[0].name || meter.rental_unit[0].number}
        {/if}
      </div>
      
      <!-- Summary Row -->
      <div class="grid grid-cols-4 gap-4 bg-gray-50 p-3 rounded-md">
        {#if getPreviousReading()}
          {@const prevReading = getPreviousReading()}
          {#if prevReading}
            <div>
              <p class="text-xs text-gray-500">Previous Reading</p>
              <p class="font-medium">{formatNumber(prevReading.reading)} {getUnitLabel()}</p>
              <p class="text-xs text-gray-400">{formatDate(prevReading.reading_date)}</p>
            </div>
          {:else}
            <div>
              <p class="text-xs text-gray-500">Previous Reading</p>
              <p class="font-medium">N/A</p>
            </div>
          {/if}
        {:else}
          <div>
            <p class="text-xs text-gray-500">Previous Reading</p>
            <p class="font-medium">N/A</p>
          </div>
        {/if}
        
        {#if getLatestReading()}
          {@const latestReading = getLatestReading()}
          {#if latestReading}
            <div>
              <p class="text-xs text-gray-500">Current Reading</p>
              <p class="font-medium">{formatNumber(latestReading.reading)} {getUnitLabel()}</p>
              <p class="text-xs text-gray-400">{formatDate(latestReading.reading_date)}</p>
            </div>
          {:else}
            <div>
              <p class="text-xs text-gray-500">Current Reading</p>
              <p class="font-medium">N/A</p>
            </div>
          {/if}
        {:else}
          <div>
            <p class="text-xs text-gray-500">Current Reading</p>
            <p class="font-medium">N/A</p>
          </div>
        {/if}
        
        <div>
          <p class="text-xs text-gray-500">Cost Per {getUnitLabel()}</p>
          <p class="font-medium">
            {#if getLatestReading()}
              {@const latestReading = getLatestReading()}
              {#if latestReading && getUnitCost(latestReading) !== null}
                {formatCurrency(getUnitCost(latestReading) || 0)}
              {:else if costPerUnit > 0}
                {formatCurrency(costPerUnit)}
              {:else}
                N/A
              {/if}
            {:else if costPerUnit > 0}
              {formatCurrency(costPerUnit)}
            {:else}
              N/A
            {/if}
          </p>
        </div>
        
        <div>
          <p class="text-xs text-gray-500">Total Cost</p>
          <p class="font-medium">
            {#if getTotalCostSum() > 0}
              {formatCurrency(getTotalCostSum())}
            {:else}
              N/A
            {/if}
          </p>
        </div>
      </div>
      
      <!-- Expanded Details -->
      {#if expanded}
        <div class="mt-4 border-t pt-4">
          <h4 class="font-medium mb-2">Reading History</h4>
          <div class="relative overflow-x-auto sm:rounded-lg">
            <table class="w-full text-sm text-left text-gray-500">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" class="px-4 py-3">Date</th>
                  <th scope="col" class="px-4 py-3">Reading</th>
                  <th scope="col" class="px-4 py-3">Consumption</th>
                  <th scope="col" class="px-4 py-3">Unit Cost</th>
                  <th scope="col" class="px-4 py-3">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {#each [...readings].sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()) as reading (reading.id)}
                  {@const consumption = getConsumption(reading)}
                  {@const unitCost = getUnitCost(reading)}
                  {@const totalCost = getTotalCost(reading)}
                  <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{formatDate(reading.reading_date)}</td>
                    <td class="px-4 py-3">{formatNumber(reading.reading)}</td>
                    <td class="px-4 py-3">
                      {consumption !== null ? formatNumber(consumption) : '-'}
                    </td>
                    <td class="px-4 py-3">
                      {unitCost !== null ? formatCurrency(unitCost) : '-'}
                    </td>
                    <td class="px-4 py-3">
                      {totalCost !== null ? formatCurrency(totalCost) : '-'}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  </Card.Root>