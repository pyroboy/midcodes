<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'w-full caption-bottom text-sm';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<table class={classes}>
  <slot />
</table>