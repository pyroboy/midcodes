<script lang="ts">
  import { createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
  import { vi } from 'vitest';
  interface Props {
    children?: import('svelte').Snippet;
    [key: string]: any
  }

  let { ...props }: Props = $props();

  type $$Props = {
    [key: string]: any;
  }

  const dispatch = vi.fn();
</script>

<button {...props} onclick={bubble('click')}>
  {@render props.children?.()}
</button>
