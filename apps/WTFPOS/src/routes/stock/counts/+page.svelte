<script lang="ts">
	import StockCounts from '$lib/components/stock/StockCounts.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Clean up ?action=open query param (page is the action itself)
	$effect(() => {
		if (page.url.searchParams.get('action') === 'open') {
			goto('/stock/counts', { replaceState: true, noScroll: true });
		}
	});
</script>

<StockCounts />
