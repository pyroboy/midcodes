<script lang="ts">
  import { vi } from 'vitest';

  type $$Props = {
    [key: string]: any;
  }

  const dispatch = vi.fn();
</script>

<button {...$$props} on:click>
  <slot />
</button>
