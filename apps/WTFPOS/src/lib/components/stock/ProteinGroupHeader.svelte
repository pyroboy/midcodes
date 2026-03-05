<script lang="ts">
  import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-svelte';
  import { cn } from '$lib/utils';
  import { proteinConfig, type MeatProtein } from '$lib/stores/stock.svelte';
  import ProteinDonutChart from './ProteinDonutChart.svelte';
  
  interface Props {
    protein: MeatProtein;
    itemCount: number;
    criticalCount: number;
    lowCount: number;
    expanded: boolean;
    onToggle: () => void;
    // For Chart
    chartData?: { id: string; label: string; value: number; }[];
    hoveredItemId?: string | null;
    onHover?: (id: string | null) => void;
    noBorder?: boolean;
    noBg?: boolean;
  }
  
  let { 
    protein, 
    itemCount, 
    criticalCount, 
    lowCount, 
    expanded, 
    onToggle,
    chartData = [],
    hoveredItemId = null,
    onHover = () => {},
    noBorder = false,
    noBg = false
  }: Props = $props();
  const config = $derived(proteinConfig[protein]);
  
  // Sort data by value for both chart and legend
  const sortedData = $derived([...chartData].sort((a, b) => b.value - a.value));
  const totalStock = $derived(chartData.reduce((sum, item) => sum + item.value, 0));
  
  // Format total stock for display (e.g., "12.5k" or "450")
  const formattedTotal = $derived(() => {
    if (totalStock >= 1000) return (totalStock / 1000).toFixed(1) + 'k';
    return Math.round(totalStock).toString();
  });

  const opacities = [1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.15];
</script>

<button 
  onclick={onToggle}
  class="w-full grid grid-cols-3 items-center px-4 py-3 outline-none transition-all hover:brightness-95 focus:ring-2 focus:ring-{config.borderColor.replace('border-', '')}/50 {!noBorder ? `rounded-xl border-l-4 sh-border-class ${config.borderColor}` : ''} {!noBg ? config.bgLight : 'bg-transparent'}"
>
  <style>
    .sh-border-class {
       border-left-style: solid;
    }
  </style>
  <!-- Left Side: Title and Alerts -->
  <div class="flex flex-col items-start gap-1 justify-self-start">
    <div class="flex items-center gap-2">
      <span class="font-bold text-gray-900 text-lg">{config.label}</span>
      <span class="text-sm font-medium text-gray-500">({itemCount} items)</span>
    </div>
    <div class="flex gap-2">
      {#if criticalCount > 0}
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
          <AlertCircle class="w-3 h-3" />
          {criticalCount} critical
        </span>
      {/if}
      {#if lowCount > 0}
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
          {lowCount} low
        </span>
      {/if}
    </div>
  </div>

  <!-- Middle: Donut Chart & Legend -->
  <div class="flex items-center gap-6 justify-self-center pointer-events-auto">
    <!-- Donut Container -->
    <div class="w-16 h-16 flex-shrink-0 relative flex items-center justify-center">
      {#if chartData.length > 0}
        <ProteinDonutChart 
          data={sortedData} 
          size={64} 
          strokeWidth={10} 
          proteinColorClass={config.color} 
          {hoveredItemId} 
          {onHover} 
        >
          <div class="flex flex-col items-center justify-center leading-none">
            <span class="text-[11px] font-bold text-gray-900">{formattedTotal()}</span>
            <span class="text-[8px] font-medium text-gray-400 uppercase">Total</span>
          </div>
        </ProteinDonutChart>
      {/if}
    </div>

    <!-- Variant Legend (Top 3-4 variants) -->
    <div class="hidden lg:flex flex-col gap-1 min-w-[120px]">
      {#each sortedData.slice(0, 3) as item, index}
        <div 
          role="presentation"
          class="flex items-center gap-2 transition-all"
          class:opacity-100={hoveredItemId === item.id || !hoveredItemId}
          class:opacity-40={hoveredItemId && hoveredItemId !== item.id}
          onmouseenter={() => onHover(item.id)}
          onmouseleave={() => onHover(null)}
        >
          <div 
            class="w-2 h-2 rounded-full {config.color} flex-shrink-0 transition-transform"
            style="opacity: {opacities[index % opacities.length]}; transform: scale({hoveredItemId === item.id ? 1.5 : 1})"
          ></div>
          <span class="text-[10px] font-semibold text-gray-700 truncate max-w-[80px]">{item.label}</span>
          <span class="text-[10px] font-mono text-gray-400 ml-auto whitespace-nowrap">{Math.round(item.value).toLocaleString()}</span>
        </div>
      {/each}
      {#if sortedData.length > 3}
        <span class="text-[9px] text-gray-400 font-medium pl-4">+ {sortedData.length - 3} more</span>
      {/if}
    </div>
  </div>
  
  <!-- Right Side: Expand Indicator -->
  <div class="flex items-center gap-2 justify-self-end">
    <div class="hidden md:flex flex-col items-end mr-2">
      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Variants</span>
      <span class="text-sm font-black text-gray-900 leading-none">{itemCount}</span>
    </div>
    {#if expanded}
      <ChevronDown class="w-5 h-5 text-gray-400" />
    {:else}
      <ChevronRight class="w-5 h-5 text-gray-400" />
    {/if}
  </div>
</button>
