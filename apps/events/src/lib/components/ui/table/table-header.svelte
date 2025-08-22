<script lang="ts">
  export let className: string = '';
  
  const baseClasses = '[&_tr]:border-b';
  
  $: classes = `${baseClasses} ${className}`;
</script>

<thead class={classes}>
  <slot />
</thead>