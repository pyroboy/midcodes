<script lang="ts">
	import TemplateFormHeader from './TemplateFormHeader.svelte';
	import TemplateFormFields from './TemplateFormFields.svelte';
	import TemplateFormActions from './TemplateFormActions.svelte';

	let {
		title = 'Template',
		disabled = false
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<TemplateFormHeader {title} />
	<TemplateFormFields />
	<TemplateFormActions {disabled} />
</div>

<style>
	/* Placeholder styles for layout only */
</style>

