<script lang="ts">
	import WasteLog from '$lib/components/stock/WasteLog.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let autoOpen = $state(false);

	$effect(() => {
		if (page.url.searchParams.get('action') === 'open') {
			autoOpen = true;
			goto('/stock/waste', { replaceState: true, noScroll: true });
		}
	});
</script>

<WasteLog {autoOpen} />
