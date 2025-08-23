<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'text-sm text-gray-500';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<p class={classes}>
  <slot />
</p>