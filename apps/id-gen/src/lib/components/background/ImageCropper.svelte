<script lang="ts">
	let {
		imageUrl,
		position = $bindable({ x: 0, y: 0, scale: 1 }),
		templateDimensions = { width: 0, height: 0 }
	} = $props();
</script>

<div class="border rounded p-3">
	<div class="text-sm font-medium mb-2">Crop</div>
	<div class="aspect-video bg-gray-100 flex items-center justify-center text-xs text-muted-foreground">
		Cropper placeholder
	</div>
</div>

