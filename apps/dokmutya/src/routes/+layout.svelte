<!-- +layout.svelte -->
<script lang="ts">
  import "../app.css";
  import { base } from "$app/paths";
  import Footer from '$lib/components/Footer.svelte';
  import Navigation from '$lib/components/Navigation.svelte';

  // Use $props() without type argument
  let { children } = $props();
</script>

<Navigation />

{@render children()}
<Footer />

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>