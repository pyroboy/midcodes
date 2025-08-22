<script lang="ts">
  export let className: string = '';
  
  const baseClasses = 'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<div class={classes}>
  <slot />
</div>