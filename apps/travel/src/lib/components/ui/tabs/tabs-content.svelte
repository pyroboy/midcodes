<script lang="ts">
  export let value: string = '';
  export let className: string = '';
  
  const baseClasses = 'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<div class={classes}>
  <slot />
</div>