<script lang="ts">
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { FileText } from '@lucide/svelte';
  import { goto } from '$app/navigation';

  interface Props {
    onCreate?: () => void;
  }

  let { onCreate }: Props = $props();

  function createTemplate() {
    if (onCreate) return onCreate();
    goto('/templates');
  }
</script>

<EmptyState
  icon={FileText}
  title="No templates yet"
  description="Create your first ID card template to get started with generating professional ID cards."
  action={{
    label: 'Create Template',
    onclick: createTemplate
  }}
/>
