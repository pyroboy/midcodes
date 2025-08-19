<script lang="ts">
	import TemplateListView from './TemplateListView.svelte';
	import TemplateEditModal from './TemplateEditModal.svelte';
	import TemplateActions from './TemplateActions.svelte';

	let {
		// wire-up props later during migration
		open = $bindable(false)
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<TemplateActions />
	<TemplateListView on:edit={() => (open = true)} />
	<TemplateEditModal bind:open />
</div>

