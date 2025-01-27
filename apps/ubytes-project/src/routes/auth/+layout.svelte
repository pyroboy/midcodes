<script lang="ts">
  import { page } from '$app/stores';
  $: path = $page.url.pathname;
</script>

<div class="auth-layout">
  <slot />
</div>

<style>
  .auth-layout {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }

  /* Reset default margins and paddings */
  :global(body),
  :global(html) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Ensure fullscreen layout */
  :global(body) {
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Remove any default margins from main content */
  :global(.auth-layout > :global(*)) {
    margin: 0;
    width: 100%;
    height: 100%;
  }
</style>