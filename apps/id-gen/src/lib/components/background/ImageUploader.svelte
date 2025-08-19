<script lang="ts">
	let {
		imageUrl = $bindable<string | null>(null)
	} = $props();

	function handleChange(files: FileList | null) {
		const file = files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			imageUrl = String(reader.result || '');
		};
		reader.readAsDataURL(file);
	}
</script>

<div class="flex flex-col gap-2">
	<label class="text-sm font-medium" for="bg-image-input">Background image</label>
	<input id="bg-image-input" type="file" accept="image/*" onchange={(e) => handleChange((e.currentTarget as HTMLInputElement).files)} />
</div>

