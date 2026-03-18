<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { rental_unitSchema } from '../../rental-unit/formSchema';
	import RentalUnitsTab from '../RentalUnitsTab.svelte';

	const rentalUnitForm = defaults(zod(rental_unitSchema));
	let triggerAdd = $state(false);

	$effect(() => {
		if ($page.url.searchParams.get('add') === '1') {
			triggerAdd = true;
			goto($page.url.pathname, { replaceState: true, keepFocus: true });
		}
	});
</script>

<RentalUnitsTab {rentalUnitForm} bind:triggerAdd />
