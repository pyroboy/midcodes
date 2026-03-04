<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  
  interface ChartData {
    id: string;      // The item ID
    label: string;   // The item Name
    value: number;   // Current Stock quantity
  }
  
  interface Props {
    data: ChartData[];
    proteinColorClass?: string; // The Tailwind text color class, e.g., 'text-red-500'
    size?: number;             // Width/Height of the SVG
    strokeWidth?: number;      // Thickness of the donut
    hoveredItemId?: string | null;  // Bound state to highlight a specific slice
    onHover?: (id: string | null) => void;
    children?: import('svelte').Snippet;
  }

  let { 
    data, 
    proteinColorClass = 'text-gray-500', 
    size = 120, 
    strokeWidth = 20,
    hoveredItemId = null,
    onHover = () => {},
    children
  } : Props = $props();

  const radius = $derived((size - strokeWidth) / 2);
  const cx = $derived(size / 2);
  const cy = $derived(size / 2);
  const circumference = $derived(2 * Math.PI * radius);

  // We animate the total progress of the chart on mount
  const progress = tweened(0, {
    duration: 1000,
    easing: cubicOut
  });

  onMount(() => {
    progress.set(1);
  });

  // Default color palette modifiers based on index to create a gradient effect
  const opacities = [1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.15];

  // Calculate slice paths dynamically based on data values
  const slices = $derived(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0; // Start at 0, SVG wrapper is already rotated -90deg to start at top
    
    return data.map((item, index) => {
      // Handle empty data
      if (total === 0) return { ...item, path: '', opacity: 0, percentage: 0, dasharray: '', dashoffset: 0, rotateAngle: 0, scale: 1, isHovered: false };
      
      const percentage = item.value / total;
      const angle = percentage * 360 * $progress; // Animate the angle
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const isHovered = hoveredItemId === item.id;
      // Slight scale effect if hovered
      const scale = isHovered ? 1.05 : 1;
      
      // Calculate arc stroke properties
      const dasharray = `${circumference} ${circumference}`;
      const dashoffset = circumference - (percentage * circumference * $progress);
      
      // We calculate the rotation for this specific slice
      const rotateAngle = startAngle;

      return {
        ...item,
        percentage,
        opacity: opacities[index % opacities.length],
        dasharray,
        dashoffset,
        rotateAngle,
        scale,
        isHovered
      };
    });
  });

</script>

<div class="relative flex items-center justify-center group/chart flex-shrink-0" style="width: {size}px; height: {size}px;">
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 {size} {size}" 
    class="rotate-[-90deg] overflow-visible rounded-full"
  >
    <!-- Background track -->
    <circle
      cx="{cx}"
      cy="{cy}"
      r="{radius}"
      fill="transparent"
      stroke="currentColor"
      stroke-width={strokeWidth}
      class="text-gray-100 dark:text-gray-800 transition-colors"
    />
    
    <!-- Slices -->
    {#each slices() as slice (slice.id)}
      {#if slice.percentage > 0}
        <circle
          cx="{cx}"
          cy="{cy}"
          r="{radius}"
          fill="transparent"
          stroke="currentColor"
          stroke-width="{strokeWidth}"
          stroke-dasharray="{slice.dasharray}"
          stroke-dashoffset="{slice.dashoffset}"
          style="transform: rotate({slice.rotateAngle}deg) scale({slice.scale}); transform-origin: {cx}px {cy}px; transition: stroke-dashoffset 1s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), stroke-width 0.2s;"
          class="{proteinColorClass} cursor-pointer outline-none hover:brightness-110"
          style:opacity={slice.opacity}
          onmouseenter={() => onHover(slice.id)}
          onmouseleave={() => onHover(null)}
          onfocus={() => onHover(slice.id)}
          onblur={() => onHover(null)}
          role="graphics-symbol"
          aria-label="{slice.label}: {Math.round(slice.percentage * 100)}%"
        />
      {/if}
    {/each}
  </svg>
  
  <!-- Center content (optional, e.g., total count) -->
  {#if children}
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
      {@render children()}
    </div>
  {/if}
</div>
