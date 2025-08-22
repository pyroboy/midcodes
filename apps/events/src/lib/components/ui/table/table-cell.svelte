<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'p-4 align-middle [&:has([role=checkbox])]:pr-0';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<td class={classes}>
  <slot />
</td>