<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Wallet } from '@lucide/svelte';
</script>

<EmptyState
	icon={Wallet}
	title="No credits available"
	description="You’ve run out of credits. Purchase more to continue generating ID cards."
	action={{
		label: 'Purchase Credits',
		href: '/pricing'
	}}
/>
