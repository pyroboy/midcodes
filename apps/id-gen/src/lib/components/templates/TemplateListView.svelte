<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	let {
		items = [] as Array<{ id: string; name: string }>
	} = $props();
</script>

<section class="flex flex-col gap-2">
	<div class="text-sm text-muted-foreground">Templates</div>
	<ul class="divide-y rounded border">
		{#each items as item}
			<li class="p-3 flex items-center justify-between">
				<span>{item.name}</span>
				<button class="text-primary" onclick={() => dispatch('edit', { id: item.id })}>Edit</button>
			</li>
		{/each}
	</ul>
</section>

