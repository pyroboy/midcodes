<!-- +layout.svelte -->
<script lang="ts">
  import "../app.css";
  import Navigation from '$lib/components/Navigation.svelte';

  // Use $props() without type argument
  let { children } = $props();
</script>

<svelte:head>
  <title>Arjo Magno's Side Projects</title>

</svelte:head>

<!-- <BreakPointIndicator /> -->
<!-- <Navigation /> -->

{@render children()}

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>