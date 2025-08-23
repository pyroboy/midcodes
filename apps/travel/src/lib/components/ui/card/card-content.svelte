<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'p-6 pt-0';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<div class={classes}>
  <slot />
</div>