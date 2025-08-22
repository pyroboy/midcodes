<script lang="ts">
  export let htmlFor: string = '';
  export let className: string = '';
  
  const baseClasses = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<label for={htmlFor} class={classes}>
  <slot />
</label>