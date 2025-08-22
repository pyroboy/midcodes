<script lang="ts">
  export let className: string = '';
  
  const baseClasses = '[&_tr:last-child]:border-0';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<tbody class={classes}>
  <slot />
</tbody>