<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let {
		title = 'Template',
		onSave = null as null | (() => void),
		onCancel = null as null | (() => void)
	} = $props();
</script>

<header class="flex items-center justify-between">
	<h2 class="text-xl font-semibold">{title}</h2>
	<div class="flex items-center gap-2">
		<Button on:click={() => onCancel?.()} variant="secondary">Cancel</Button>
		<Button on:click={() => onSave?.()} variant="default">Save</Button>
	</div>
</header>

