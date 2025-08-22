<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<tr class={classes}>
  <slot />
</tr>