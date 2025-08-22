<script lang="ts">
  export let value: string = '';
  export let disabled = false;
  export let className: string = '';
  
  const baseClasses = 'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<select
  {value}
  {disabled}
  class={classes}
  on:change
  {...$$restProps}
>
  <slot />
</select>