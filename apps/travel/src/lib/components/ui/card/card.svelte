<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<div class={classes}>
  <slot />
</div>