<script lang="ts">
  export let value: string = '';
  export let className: string = '';
  
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<button class={classes} data-state="active">
  <slot />
</button>