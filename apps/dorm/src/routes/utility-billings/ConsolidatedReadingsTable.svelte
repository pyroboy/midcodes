<script lang="ts">
    import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Table from '$lib/components/ui/table';
    import type { ConsolidatedReadingRow, Meter, Reading, Property } from './types';
  
    // Props using Svelte 5 runes with defaults
    let { readings = [], meters = [], properties = [] } = $props<{
      readings?: Reading[];
      meters?: Meter[];
      properties?: Property[];
    }>();
    
    // State with Svelte 5 runes
    let sortField = $state<keyof ConsolidatedReadingRow>('date');
    let sortDirection = $state<'asc' | 'desc'>('desc');
  
    // Computed values using Svelte 5 derived.by
    const consolidatedData = $derived.by(() => {
      // Create consolidated rows from readings and meters
      const rows: ConsolidatedReadingRow[] = readings.map(reading => {
        const meter = meters.find(m => m.id === reading.meter_id);
        const property = properties.find(p => p.id === meter?.property_id);
        
        return {
          id: reading.id,
          date: reading.reading_date,
          meterName: meter?.name || reading.meter_name || 'Unknown',
          meterType: meter?.type || 'Unknown',
          propertyName: property?.name || 'Unknown',
          unitName: meter?.rental_unit?.[0]?.name || meter?.rental_unit?.[0]?.number || null,
          reading: reading.reading,
          previousReading: reading.previous_reading,
          consumption: reading.consumption,
          costPerUnit: reading.cost_per_unit,
          totalCost: reading.cost
        };
      });
  
      // Sort the rows
      return rows.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
        
        // For dates, convert to timestamps for comparison
        if (sortField === 'date') {
          const aTime = new Date(a.date).getTime();
          const bTime = new Date(b.date).getTime();
          return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
        }
        
        // For strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        // For numbers
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number) 
          : (bValue as number) - (aValue as number);
      });
    });
  
    // Helper functions
    function toggleSort(field: keyof ConsolidatedReadingRow) {
      if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDirection = 'asc';
      }
    }
  
    // Format date for display
    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  
    // Format number with appropriate decimal places
    function formatNumber(value: number | null | undefined): string {
      if (value === null || value === undefined) return '-';
      
      // If value is a whole number, show no decimals
      if (value === Math.floor(value)) {
        return value.toString();
      }
      // Otherwise show up to 2 decimal places
      return value.toFixed(2);
    }
  
    // Format currency with peso sign
    function formatCurrency(amount: number | null | undefined): string {
      if (amount === null || amount === undefined) return '-';
      
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
  
    // Get utility color class
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
  
    // Get unit label based on utility type
    function getUnitLabel(type: string): string {
      switch (type.toUpperCase()) {
        case 'ELECTRICITY': return "kWh";
        case 'WATER': return "m³";
        case 'GAS': return "m³";
        case 'INTERNET': return "GB";
        case 'CABLE': return "month";
        default: return "unit";
      }
    }
  </script>
  
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row class="bg-gray-50 hover:bg-gray-50">
          <Table.Head class="w-[110px]">
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('date')}>
              <span>Date</span>
              {#if sortField === 'date'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head>
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('propertyName')}>
              <span>Property</span>
              {#if sortField === 'propertyName'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head>
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('meterName')}>
              <span>Meter</span>
              {#if sortField === 'meterName'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head>
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('meterType')}>
              <span>Type</span>
              {#if sortField === 'meterType'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head class="text-right">
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('previousReading')}>
              <span>Previous</span>
              {#if sortField === 'previousReading'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head class="text-right">
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('reading')}>
              <span>Current</span>
              {#if sortField === 'reading'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head class="text-right">
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('consumption')}>
              <span>Consumption</span>
              {#if sortField === 'consumption'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head class="text-right">
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('costPerUnit')}>
              <span>Unit Cost</span>
              {#if sortField === 'costPerUnit'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
          <Table.Head class="text-right">
            <Button variant="ghost" class="h-8 p-1" onclick={() => toggleSort('totalCost')}>
              <span>Total</span>
              {#if sortField === 'totalCost'}
                {#if sortDirection === 'asc'}
                  <ArrowUp class="ml-2 h-4 w-4" />
                {:else}
                  <ArrowDown class="ml-2 h-4 w-4" />
                {/if}
              {:else}
                <ArrowUpDown class="ml-2 h-4 w-4" />
              {/if}
            </Button>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if consolidatedData.length === 0}
          <Table.Row>
            <Table.Cell colspan="9" class="h-24 text-center">
              No readings found with the current filters.
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each consolidatedData as row (row.id)}
            <Table.Row class="hover:bg-gray-50">
              <Table.Cell class="font-medium">
                {formatDate(row.date)}
              </Table.Cell>
              <Table.Cell>
                {row.propertyName}
                {#if row.unitName}
                  <span class="text-xs text-gray-500">· {row.unitName}</span>
                {/if}
              </Table.Cell>
              <Table.Cell>{row.meterName}</Table.Cell>
              <Table.Cell>
                <span class={`px-2 py-1 rounded-full text-xs font-medium ${getUtilityColorClass(row.meterType)}`}>
                  {row.meterType}
                </span>
              </Table.Cell>
              <Table.Cell class="text-right">
                {row.previousReading !== null ? formatNumber(row.previousReading) : '-'}
              </Table.Cell>
              <Table.Cell class="text-right font-medium">
                {formatNumber(row.reading)}
              </Table.Cell>
              <Table.Cell class="text-right">
                {row.consumption !== null ? formatNumber(row.consumption) : '-'}
                <span class="text-xs text-gray-500 ml-1">{getUnitLabel(row.meterType)}</span>
              </Table.Cell>
              <Table.Cell class="text-right">
                {row.costPerUnit !== null ? formatCurrency(row.costPerUnit) : '-'}
              </Table.Cell>
              <Table.Cell class="text-right font-medium">
                {row.totalCost !== null ? formatCurrency(row.totalCost) : '-'}
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>