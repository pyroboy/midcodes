<script lang="ts">
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { CreditCard } from '@lucide/svelte';
</script>

<EmptyState
  icon={CreditCard}
  title="No ID cards generated"
  description="You haven't generated any ID cards yet. Browse available templates to create your first ID card."
  action={{
    label: 'Browse Templates',
    href: '/templates'
  }}
/>
