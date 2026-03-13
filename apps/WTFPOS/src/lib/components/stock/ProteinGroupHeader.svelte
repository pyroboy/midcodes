<script lang="ts">
  import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-svelte';
  import { cn } from '$lib/utils';
  import { proteinConfig, type MeatProtein } from '$lib/stores/stock.svelte';

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

  // Format individual values compactly
  function formatCompact(val: number): string {
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return Math.round(val).toString();
  }

  const opacities = [1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.15];

  // Map protein to bar segment bg colors (matching proteinConfig text colors)
  const barColorMap: Record<MeatProtein, string> = {
    beef: 'bg-red-600',
    pork: 'bg-orange-600',
    chicken: 'bg-yellow-600',
    other: 'bg-gray-600'
  };

  const barColor = $derived(barColorMap[protein]);
</script>

<button
  onclick={onToggle}
  class="w-full flex flex-col sm:grid sm:grid-cols-3 items-start sm:items-center gap-2 sm:gap-0 px-3 sm:px-4 py-2.5 sm:py-3 outline-none transition-all hover:brightness-95 focus:ring-2 focus:ring-{config.borderColor.replace('border-', '')}/50 {!noBorder ? `rounded-xl border-l-4 sh-border-class ${config.borderColor}` : ''} {!noBg ? config.bgLight : 'bg-transparent'}"
>
  <style>
    .sh-border-class {
       border-left-style: solid;
    }
  </style>
  <!-- Top row on mobile / Left side on desktop: Title, alerts, and chevron -->
  <div class="flex items-center justify-between w-full sm:justify-start sm:w-auto">
    <div class="flex flex-col items-start gap-1 justify-self-start">
      <div class="flex items-center gap-2">
        <span class="font-bold text-gray-900 text-base sm:text-lg">{config.label}</span>
        <span class="text-xs sm:text-sm font-medium text-gray-500">({itemCount})</span>
      </div>
      <div class="flex gap-1.5 sm:gap-2 flex-wrap">
        {#if criticalCount > 0}
          <span class="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] sm:text-xs font-semibold">
            <AlertCircle class="w-3 h-3" />
            {criticalCount} critical
          </span>
        {/if}
        {#if lowCount > 0}
          <span class="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs font-semibold">
            {lowCount} low
          </span>
        {/if}
      </div>
    </div>
    <!-- Chevron visible on mobile only (inline with title) -->
    <div class="sm:hidden">
      {#if expanded}
        <ChevronDown class="w-5 h-5 text-gray-400" />
      {:else}
        <ChevronRight class="w-5 h-5 text-gray-400" />
      {/if}
    </div>
  </div>

  <!-- Middle: Horizontal Stacked Bar (hidden on very small screens, shown sm+) -->
  <div class="hidden sm:flex flex-col items-center gap-1.5 justify-self-center w-full max-w-[220px] pointer-events-auto">
    {#if chartData.length > 0}
      <!-- Total label -->
      <span class="text-[11px] font-bold text-gray-900">{formattedTotal()} <span class="text-[9px] font-medium text-gray-400 uppercase">total</span></span>

      <!-- Stacked bar -->
      <div class="w-full h-3 rounded-full bg-gray-100 flex overflow-hidden">
        {#each sortedData as item, index}
          {@const pct = totalStock > 0 ? (item.value / totalStock) * 100 : 0}
          <div
            role="presentation"
            class={cn(
              barColor,
              'h-full transition-all duration-150',
              hoveredItemId && hoveredItemId !== item.id && 'brightness-50'
            )}
            style="width: {pct}%; opacity: {opacities[index % opacities.length]};"
            onmouseenter={() => onHover(item.id)}
            onmouseleave={() => onHover(null)}
          ></div>
        {/each}
      </div>

      <!-- Top 3 variant labels -->
      <div class="hidden lg:flex items-center gap-1 text-[10px] text-gray-500 font-medium truncate max-w-full">
        {#each sortedData.slice(0, 3) as item, index}
          {#if index > 0}
            <span class="text-gray-300">&middot;</span>
          {/if}
          <span
            role="presentation"
            class={cn(
              'truncate transition-opacity',
              hoveredItemId === item.id ? 'text-gray-900 font-semibold' : '',
              hoveredItemId && hoveredItemId !== item.id ? 'opacity-40' : ''
            )}
            onmouseenter={() => onHover(item.id)}
            onmouseleave={() => onHover(null)}
          >{item.label} {formatCompact(item.value)}</span>
        {/each}
        {#if sortedData.length > 3}
          <span class="text-gray-300">&middot;</span>
          <span class="text-gray-400">+{sortedData.length - 3}</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Mobile mini bar (visible only on small screens) -->
  {#if chartData.length > 0}
    <div class="sm:hidden w-full">
      <div class="w-full h-2 rounded-full bg-gray-100 flex overflow-hidden">
        {#each sortedData as item, index}
          {@const pct = totalStock > 0 ? (item.value / totalStock) * 100 : 0}
          <div
            role="presentation"
            class={cn(barColor, 'h-full')}
            style="width: {pct}%; opacity: {opacities[index % opacities.length]};"
          ></div>
        {/each}
      </div>
      <span class="text-[10px] font-bold text-gray-500 mt-0.5">{formattedTotal()} total</span>
    </div>
  {/if}

  <!-- Right Side: Expand Indicator (desktop only — mobile has chevron inline with title) -->
  <div class="hidden sm:flex items-center gap-2 justify-self-end">
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
