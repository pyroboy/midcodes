<script lang="ts">
	import ImageUploader from './ImageUploader.svelte';
	import ImageCropper from './ImageCropper.svelte';
	import ThumbnailPreview from './ThumbnailPreview.svelte';
    import LegacyBackgroundThumbnail from '../BackgroundThumbnail.svelte';

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
			<!-- Transitional: Render legacy cropper until migration completes -->
			<LegacyBackgroundThumbnail
				imageUrl={imageUrl}
				templateDimensions={templateDimensions}
				position={position}
				onPositionChange={(p) => (position = p)}
			/>
			<ThumbnailPreview bind:position {imageUrl} {templateDimensions} />
		</div>
	{/if}
</div>

