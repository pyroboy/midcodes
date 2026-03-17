<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let visible = $state(false);
	let message = $state('');

	const messages: Record<string, string> = {
		created: 'Created successfully',
		updated: 'Updated successfully',
		deleted: 'Deleted successfully'
	};

	$effect(() => {
		const success = $page.url.searchParams.get('success');
		if (success && messages[success]) {
			message = messages[success];
			visible = true;
			// Clean URL without reload
			const url = new URL($page.url);
			url.searchParams.delete('success');
			goto(url.pathname, { replaceState: true, noScroll: true });
			// Auto-dismiss
			setTimeout(() => { visible = false; }, 3000);
		}
	});
</script>

{#if visible}
	<div class="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
		<svg class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
		{message}
		<button onclick={() => visible = false} class="ml-2 hover:opacity-70">
			<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
		</button>
	</div>
{/if}
