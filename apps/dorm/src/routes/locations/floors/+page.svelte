<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { floorSchema } from '../../floors/formSchema';
	import FloorsTab from '../FloorsTab.svelte';

	const floorForm = defaults(zod(floorSchema));
	let triggerAdd = $state(false);

	$effect(() => {
		if ($page.url.searchParams.get('add') === '1') {
			triggerAdd = true;
			goto($page.url.pathname, { replaceState: true, keepFocus: true });
		}
	});
</script>

<FloorsTab {floorForm} bind:triggerAdd />
