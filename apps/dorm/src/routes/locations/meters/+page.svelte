<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { meterSchema } from '../../meters/formSchema';
	import MetersTab from '../MetersTab.svelte';

	const meterForm = defaults(zod(meterSchema));
	let triggerAdd = $state(false);

	$effect(() => {
		if ($page.url.searchParams.get('add') === '1') {
			triggerAdd = true;
			goto($page.url.pathname, { replaceState: true, keepFocus: true });
		}
	});
</script>

<MetersTab {meterForm} bind:triggerAdd />
