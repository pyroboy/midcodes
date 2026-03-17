<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { SearchX } from '@lucide/svelte';

	interface Props {
		onClear?: () => void;
	}

	let { onClear }: Props = $props();
</script>

<EmptyState
	icon={SearchX}
	title="No results found"
	description="We couldn’t find anything matching your search. Try different terms or clear the search."
	action={{
		label: 'Clear Search',
		onclick: onClear
	}}
/>
