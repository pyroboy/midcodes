<script lang="ts">
    import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Table from '$lib/components/ui/table';
    import * as Accordion from '$lib/components/ui/accordion';
    import * as Card from '$lib/components/ui/card';
    import type { Meter, Reading, Property } from './types';
    
    // Props using Svelte 5 runes with defaults
    let { readings = [], meters = [], properties = [] } = $props();
    
    // Explicitly initialize active meter ID
    let activeMeterId = $state(null);
    
    // Computed values using Svelte 5 derived.by
    const groupedReadings = $derived.by(() => {
      // First group by date
      const byDate: Record<string, Reading[]> = {};
      
      readings.forEach(reading => {
        if (!byDate[reading.reading_date]) {
          byDate[reading.reading_date] = [];
        }
        byDate[reading.reading_date].push(reading);
      });
      
      // Then for each date, group by property
      const result: {
        date: string;
        properties: {
          propertyId: number;
          propertyName: string;
          uniqueMeters: {
            meterId: number;
            meterName: string;
            meterType: string;
            unitName: string | null;
            reading: number;
            previousReading: number | null;
            consumption: number | null;
            costPerUnit: number | null;
            totalCost: number | null;
            history: Reading[];
          }[];
          totalConsumption: number;
          totalCost: number;
        }[];
        totalConsumption: number;
        totalCost: number;
      }[] = [];
      
      // Sort dates in descending order (newest first)
      const sortedDates = Object.keys(byDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      sortedDates.forEach(date => {
        const readingsForDate = byDate[date];
        
        // Group by property
        const propertiesMap: Record<number, {
          propertyId: number;
          propertyName: string;
          meterMap: Record<number, {
            meterId: number;
            meterName: string;
            meterType: string;
            unitName: string | null;
            reading: number;
            previousReading: number | null;
            consumption: number | null;
            costPerUnit: number | null;
            totalCost: number | null;
            history: Reading[];
          }>;
          totalConsumption: number;
          totalCost: number;
        }> = {};
        
        readingsForDate.forEach(reading => {
          const meter = meters.find(m => m.id === reading.meter_id);
          if (!meter || !meter.property_id) return;
          
          const property = properties.find(p => p.id === meter.property_id);
          if (!property) return;
          
          if (!propertiesMap[property.id]) {
            propertiesMap[property.id] = {
              propertyId: property.id,
              propertyName: property.name,
              meterMap: {},
              totalConsumption: 0,
              totalCost: 0
            };
          }
          
          // Get reading history for this meter
          const meterHistory = readings
            .filter(r => r.meter_id === meter.id)
            .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());
          
          // Store in map by meter ID to ensure uniqueness
          propertiesMap[property.id].meterMap[meter.id] = {
            meterId: meter.id,
            meterName: meter.name,
            meterType: meter.type,
            unitName: meter.rental_unit?.[0]?.name || meter.rental_unit?.[0]?.number || null,
            reading: reading.reading,
            previousReading: reading.previous_reading,
            consumption: reading.consumption,
            costPerUnit: reading.cost_per_unit,
            totalCost: reading.cost,
            history: meterHistory
          };
          
          // Add to property totals
          propertiesMap[property.id].totalConsumption += reading.consumption || 0;
          propertiesMap[property.id].totalCost += reading.cost || 0;
        });
        
        // Calculate date totals
        let dateTotalConsumption = 0;
        let dateTotalCost = 0;
        
        // Convert meterMap to array for each property
        const propertiesWithUniqueMeters = Object.values(propertiesMap).map(prop => {
          dateTotalConsumption += prop.totalConsumption;
          dateTotalCost += prop.totalCost;
          
          return {
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            uniqueMeters: Object.values(prop.meterMap),
            totalConsumption: prop.totalConsumption,
            totalCost: prop.totalCost
          };
        });
        
        // Add to result
        result.push({
          date,
          properties: propertiesWithUniqueMeters,
          totalConsumption: dateTotalConsumption,
          totalCost: dateTotalCost
        });
      });
      
      return result;
    });
    
    // Toggle meter expansion - only one open at a time
    function toggleMeterExpansion(meterId: number): void {
      if (activeMeterId === meterId) {
        activeMeterId = null;
      } else {
        activeMeterId = meterId;
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
  
  {#if groupedReadings.length === 0}
    <div class="bg-gray-50 rounded-md p-6 text-center">
      <p class="text-gray-500">No readings found with the current filters.</p>
    </div>
  {:else}
    {#each groupedReadings as dateGroup}
      <div class="mb-8">
        <div class="flex justify-between items-center p-3 bg-gray-100 rounded-t-md mb-2">
          <h3 class="text-lg font-semibold">Readings for {formatDate(dateGroup.date)}</h3>
          <div class="text-right">
            {#if dateGroup.properties.length > 0 && dateGroup.properties[0].uniqueMeters.length > 0}
              <div class="text-sm">
                Unit Cost: <span class="font-bold">
                  {formatCurrency(dateGroup.properties[0].uniqueMeters[0].costPerUnit || 0)}
                  /{getUnitLabel(dateGroup.properties[0].uniqueMeters[0].meterType)}
                </span>
              </div>
            {/if}
          </div>
        </div>
        
        {#each dateGroup.properties as propertyGroup}
          <Card.Root class="mb-4">
            <Card.Header class="py-3">
              <div class="flex justify-between items-center">
                <Card.Title>{propertyGroup.propertyName}</Card.Title>
              </div>
            </Card.Header>
            <Card.Content>
              <div class="rounded-md border">
                <Table.Root>
                  <Table.Header>
                    <Table.Row class="bg-gray-50 hover:bg-gray-50">
                      <Table.Head>Meter</Table.Head>
                      <Table.Head class="text-right">Previous</Table.Head>
                      <Table.Head class="text-right">Current</Table.Head>
                      <Table.Head class="text-right">Consumption</Table.Head>
                      <Table.Head class="text-right">Total</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each propertyGroup.uniqueMeters as meter}
                      <Table.Row 
                        class="hover:bg-gray-50 border-b cursor-pointer"
                        onclick={() => toggleMeterExpansion(meter.meterId)}
                      >
                        <Table.Cell class="font-medium">
                          {meter.meterName}
                          {#if meter.unitName}
                            <span class="text-xs text-gray-500">· {meter.unitName}</span>
                          {/if}
                          <span class="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium {getUtilityColorClass(meter.meterType)}">
                            {meter.meterType}
                          </span>
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {meter.previousReading !== null ? formatNumber(meter.previousReading) : '-'}
                        </Table.Cell>
                        <Table.Cell class="text-right font-medium">
                          {formatNumber(meter.reading)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {meter.consumption !== null ? formatNumber(meter.consumption) : '-'}
                          <span class="text-xs text-gray-500 ml-1">{getUnitLabel(meter.meterType)}</span>
                        </Table.Cell>
                        <Table.Cell class="text-right font-medium">
                          {meter.totalCost !== null ? formatCurrency(meter.totalCost) : '-'}
                        </Table.Cell>
                      </Table.Row>
                      
                      {#if activeMeterId === meter.meterId && meter.history.length > 1}
                        <Table.Row class="bg-gray-50">
                          <Table.Cell colspan="5" class="p-0">
                            <div class="p-4">
                              <h4 class="text-sm font-medium mb-2">Reading History for {meter.meterName}</h4>
                              <div class="rounded-md border bg-white">
                                <Table.Root>
                                  <Table.Header>
                                    <Table.Row class="bg-gray-50 hover:bg-gray-50">
                                      <Table.Head>Date</Table.Head>
                                      <Table.Head class="text-right">Reading</Table.Head>
                                      <Table.Head class="text-right">Consumption</Table.Head>
                                      <Table.Head class="text-right">Cost</Table.Head>
                                    </Table.Row>
                                  </Table.Header>
                                  <Table.Body>
                                    {#if meter.history.length <= 1}
                                      <Table.Row>
                                        <Table.Cell colspan="4" class="text-center py-4 text-gray-500">
                                          No previous reading history available for this meter.
                                        </Table.Cell>
                                      </Table.Row>
                                    {:else}
                                      {#each meter.history as historyItem}
                                        <Table.Row class="hover:bg-gray-50">
                                          <Table.Cell>{formatDate(historyItem.reading_date)}</Table.Cell>
                                          <Table.Cell class="text-right">{formatNumber(historyItem.reading)}</Table.Cell>
                                          <Table.Cell class="text-right">
                                            {historyItem.consumption !== null ? formatNumber(historyItem.consumption) : '-'}
                                            <span class="text-xs text-gray-500 ml-1">{getUnitLabel(meter.meterType)}</span>
                                          </Table.Cell>
                                          <Table.Cell class="text-right">
                                            {historyItem.cost !== null ? formatCurrency(historyItem.cost) : '-'}
                                          </Table.Cell>
                                        </Table.Row>
                                      {/each}
                                    {/if}
                                  </Table.Body>
                                </Table.Root>
                              </div>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      {/if}
                    {/each}
                  </Table.Body>
                  <Table.Footer>
                    <Table.Row class="bg-gray-50 font-medium">
                      <Table.Cell colspan="3" class="text-right">Property Totals:</Table.Cell>
                      <Table.Cell class="text-right">{formatNumber(propertyGroup.totalConsumption)}</Table.Cell>
                      <Table.Cell class="text-right">{formatCurrency(propertyGroup.totalCost)}</Table.Cell>
                    </Table.Row>
                  </Table.Footer>
                </Table.Root>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/each}
  {/if}