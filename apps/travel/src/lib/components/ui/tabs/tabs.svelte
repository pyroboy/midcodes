<script lang="ts">
  export let value: string = '';
  export let className: string = '';
  
  const baseClasses = 'w-full';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<div class={classes}>
  <slot />
</div>