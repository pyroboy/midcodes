<script lang="ts">
	import ImageUploader from './ImageUploader.svelte';
	import ImageCropper from './ImageCropper.svelte';
	import ThumbnailPreview from './ThumbnailPreview.svelte';

	let {
		imageUrl = $bindable<string | null>(null),
		position = $bindable({ x: 0, y: 0, scale: 1 }),
		templateDimensions = { width: 0, height: 0 }
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<ImageUploader bind:imageUrl />
	{#if imageUrl}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<ImageCropper bind:position {imageUrl} {templateDimensions} />
			<ThumbnailPreview bind:position {imageUrl} {templateDimensions} />
		</div>
	{/if}
</div>

