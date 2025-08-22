<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<th class={classes}>
  <slot />
</th>