<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'text-2xl font-semibold leading-none tracking-tight';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<h3 class={classes}>
  <slot />
</h3>