<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import type { Reading, Meter, ChartDataset, ChartData, ConsumptionByType, ConsumptionTrend, ChartProps } from './types';
    
    // Props using proper Svelte 5 syntax
    let props = $props();
    
    // Format date for display
    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  
    // Format for chart labels
    function formatShortDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Get utility color
    function getUtilityColor(type: string): string {
      switch (type.toUpperCase()) {
        case 'ELECTRICITY': return '#F59E0B'; // amber-500
        case 'WATER': return '#3B82F6'; // blue-500
        case 'GAS': return '#EF4444'; // red-500
        case 'INTERNET': return '#8B5CF6'; // purple-500
        case 'CABLE': return '#10B981'; // green-500
        default: return '#6B7280'; // gray-500
      }
    }
    
    // Get consumption by utility type
    function getConsumptionByType(): ChartDataset {
      const consumptionByType: ConsumptionByType = {};
      
      // Filter readings that have consumption data
      const validReadings = props.readings.filter((r: Reading) => r.consumption !== null && r.consumption !== undefined);
      
      // Group by utility type
      validReadings.forEach((reading: Reading) => {
        const meter = props.meters.find((m: Meter) => m.id === reading.meter_id);
        if (!meter) return;
        
        const type = meter.type.toUpperCase();
        if (!consumptionByType[type]) {
          consumptionByType[type] = 0;
        }
        
        consumptionByType[type] += reading.consumption || 0;
      });
      
      // Convert to chart data format
      const labels: string[] = [];
      const values: number[] = [];
      const colors: string[] = [];
      
      Object.entries(consumptionByType).forEach(([type, consumption]) => {
        labels.push(type);
        values.push(consumption);
        colors.push(getUtilityColor(type));
      });
      
      return { labels, values, colors };
    }
    
    // Get consumption trend over time
    function getConsumptionTrend(): ChartDataset {
      const trend: Map<string, number> = new Map();
      const trendData: ConsumptionTrend[] = [];
      
      // Filter to only include readings for the selected type if one is selected
      const filteredReadings = props.selectedType 
        ? props.readings.filter((reading: Reading) => {
            const meter = props.meters.find((m: Meter) => m.id === reading.meter_id);
            return meter && meter.type.toUpperCase() === props.selectedType?.toUpperCase();
          })
        : props.readings;
      
      // Group by date
      filteredReadings.forEach((reading: Reading) => {
        if (reading.consumption === null || reading.consumption === undefined) return;
        
        const date = reading.reading_date;
        const currentTotal = trend.get(date) || 0;
        trend.set(date, currentTotal + reading.consumption);
      });
      
      // Convert to sorted array
      Array.from(trend.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .forEach(([date, consumption]) => {
          trendData.push({ date, consumption });
        });
      
      // Get last 6 points for the chart
      const chartData = trendData.slice(-6);
      
      return {
        labels: chartData.map(d => formatShortDate(d.date)),
        values: chartData.map(d => d.consumption),
        colors: Array(chartData.length).fill(props.selectedType ? getUtilityColor(props.selectedType) : '#3B82F6')
      };
    }
  
    // Calculate chart dimensions
    function getChartBarHeight(value: number, maxValue: number, maxHeight: number): number {
      if (maxValue === 0) return 0;
      return (value / maxValue) * maxHeight;
    }
  
    // Create responsive chart with dynamic scale
    function getChartScale(values: number[]): string[] {
      if (values.length === 0) return ['0'];
      
      const maxValue = Math.max(...values);
      const scale = [
        '0',
        (maxValue * 0.25).toFixed(1),
        (maxValue * 0.5).toFixed(1),
        (maxValue * 0.75).toFixed(1),
        maxValue.toFixed(1)
      ];
      
      return scale;
    }
    
    // Reactive data
    let consumptionByType = $derived.by(() => getConsumptionByType());
    let consumptionTrend = $derived.by(() => getConsumptionTrend());
    
    // Max values for scaling charts
    let maxTypeValue = $derived(consumptionByType.values.length > 0 ? Math.max(...consumptionByType.values) : 0);
    let maxTrendValue = $derived(consumptionTrend.values.length > 0 ? Math.max(...consumptionTrend.values) : 0);
    
    // Chart scales
    let typeScale = $derived(getChartScale(consumptionByType.values));
    let trendScale = $derived(getChartScale(consumptionTrend.values));
  </script>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
    <!-- Consumption by Type Chart -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Consumption by Utility Type</Card.Title>
        <Card.Description>
          Distribution of consumption across different utility types
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if consumptionByType.labels.length === 0}
          <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p class="text-gray-500">No consumption data available</p>
          </div>
        {:else}
          <div class="relative h-64">
            <!-- Y-axis labels -->
            <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
              {#each [...typeScale].reverse() as value}
                <span>{value}</span>
              {/each}
            </div>
            
            <!-- Chart -->
            <div class="ml-10 h-full flex items-end justify-around">
              {#each consumptionByType.labels as label, i}
                <div class="flex flex-col items-center w-full max-w-16">
                  <div 
                    class="w-12 rounded-t-md transition-all duration-500" 
                    style="height: {getChartBarHeight(consumptionByType.values[i], maxTypeValue, 200)}px; background-color: {consumptionByType.colors[i]};"
                  ></div>
                  <span class="mt-2 text-xs font-medium">{label}</span>
                  <span class="text-xs text-gray-500">{consumptionByType.values[i].toFixed(1)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
    
    <!-- Consumption Trend Chart -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Consumption Trend</Card.Title>
        <Card.Description>
          {props.selectedType 
            ? `${props.selectedType} consumption over time` 
            : 'Total consumption over time'}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if consumptionTrend.labels.length === 0}
          <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p class="text-gray-500">No trend data available</p>
          </div>
        {:else}
          <div class="relative h-64">
            <!-- Y-axis labels -->
            <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
              {#each [...trendScale].reverse() as value}
                <span>{value}</span>
              {/each}
            </div>
            
            <!-- Chart -->
            <div class="ml-10 h-full flex items-end justify-around">
              {#each consumptionTrend.labels as label, i}
                <div class="flex flex-col items-center w-full max-w-16">
                  <div 
                    class="w-12 rounded-t-md transition-all duration-500" 
                    style="height: {getChartBarHeight(consumptionTrend.values[i], maxTrendValue, 200)}px; background-color: {consumptionTrend.colors[i]};"
                  ></div>
                  <span class="mt-2 text-xs font-medium">{label}</span>
                  <span class="text-xs text-gray-500">{consumptionTrend.values[i].toFixed(1)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>