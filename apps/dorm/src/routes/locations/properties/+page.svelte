<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { propertySchema } from '../../properties/formSchema';
	import PropertiesTab from '../PropertiesTab.svelte';

	const propertyForm = defaults(zod(propertySchema));
	let triggerAdd = $state(false);

	$effect(() => {
		if ($page.url.searchParams.get('add') === '1') {
			triggerAdd = true;
			goto($page.url.pathname, { replaceState: true, keepFocus: true });
		}
	});
</script>

<PropertiesTab {propertyForm} bind:triggerAdd />
