<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'flex flex-col space-y-1.5 p-6';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<div class={classes}>
  <slot />
</div>