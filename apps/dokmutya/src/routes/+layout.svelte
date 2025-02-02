<!-- +layout.svelte -->
<script lang="ts">
  import "../app.css";
  import { base } from "$app/paths";
  import Footer from '$lib/components/Footer.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import BreakPointIndicator from "$lib/components/BreakPointIndicator.svelte";

  // Use $props() without type argument
  let { children } = $props();
</script>

<svelte:head>
  <title>Dok Mutya Tirol - First District Board Member</title>
  <meta name="description" content="Official website of Dok Mutya Tirol, First District Board Member" />
  <meta name="keywords" content="Mutya Tirol, Board Member, First District, Public Service, Healthcare" />
  <meta name="author" content="Dok Mutya Tirol" />
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="shortcut icon" href="/favicon.ico" />
</svelte:head>

<BreakPointIndicator />
<Navigation />

{@render children()}
<Footer />

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>