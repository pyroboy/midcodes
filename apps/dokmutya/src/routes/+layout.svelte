<script>
  import { base } from "$app/paths";
  import "../app.css";
  let { children } = $props();
</script>

<nav>
  <ul class="flex space-x-8 mb-4">
    <li>
      <a href="{base}/">Home</a>
    </li>
    <li>
      <a href="{base}/about">About</a>
    </li>
  </ul>
</nav>

{@render children()}