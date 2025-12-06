<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { UsersRound } from '@lucide/svelte';

	interface Props {
		onInvite?: () => void;
		isFiltered?: boolean;
	}

	let { onInvite, isFiltered = false }: Props = $props();
</script>

<EmptyState
	icon={UsersRound}
	title="No users found"
	description={isFiltered
		? 'Try adjusting your search or filter criteria.'
		: 'Get started by adding a new user to your organization.'}
	action={{
		label: isFiltered ? 'Clear filters' : 'Invite Users',
		onclick: onInvite
	}}
/>
