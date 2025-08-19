<script lang="ts">
	let {
		open = $bindable(false)
	} = $props();
</script>

{#if open}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center">
		<div class="bg-white rounded p-4 shadow w-[min(600px,95vw)]">
			<h3 class="text-lg font-semibold mb-2">Edit Template</h3>
			<div class="text-sm text-muted-foreground">Modal placeholder</div>
			<div class="mt-4 flex justify-end">
				<button class="px-3 py-1 rounded bg-gray-200" onclick={() => (open = false)}>Close</button>
			</div>
		</div>
	</div>
{/if}

