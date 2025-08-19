<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let {
		disabled = false,
		onCreate = null as null | (() => void),
		onDelete = null as null | (() => void)
	} = $props();
</script>

<footer class="flex items-center gap-2">
	<Button disabled={disabled} onclick={() => onCreate?.()}>
		Create
	</Button>
	<Button variant="destructive" disabled={disabled} onclick={() => onDelete?.()}>
		Delete
	</Button>
</footer>

