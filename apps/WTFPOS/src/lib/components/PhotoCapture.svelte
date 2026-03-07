<script lang="ts">
	import { cn } from '$lib/utils';
	import { Camera, X, ImagePlus } from 'lucide-svelte';

	interface Props {
		photos: string[];
		onchange: (photos: string[]) => void;
		max?: number;
		label?: string;
	}

	let { photos, onchange, max = 3, label = 'Attach Photos' }: Props = $props();

	let fileInput: HTMLInputElement | undefined = $state();

	function openPicker() {
		fileInput?.click();
	}

	async function handleFiles(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files) return;

		const newPhotos = [...photos];
		for (const file of Array.from(input.files)) {
			if (newPhotos.length >= max) break;
			if (!file.type.startsWith('image/')) continue;
			const compressed = await compressImage(file, 1024, 0.8);
			newPhotos.push(compressed);
		}
		onchange(newPhotos);
		input.value = '';
	}

	function removePhoto(index: number) {
		const updated = photos.filter((_, i) => i !== index);
		onchange(updated);
	}

	function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const url = URL.createObjectURL(file);
			img.onload = () => {
				URL.revokeObjectURL(url);
				let { width, height } = img;
				if (width > maxDim || height > maxDim) {
					const ratio = Math.min(maxDim / width, maxDim / height);
					width = Math.round(width * ratio);
					height = Math.round(height * ratio);
				}
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) { reject(new Error('No canvas context')); return; }
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL('image/jpeg', quality));
			};
			img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
			img.src = url;
		});
	}

	let previewIndex = $state<number | null>(null);
</script>

<div class="flex flex-col gap-2">
	<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>

	<!-- Thumbnails + Add button -->
	<div class="flex flex-wrap gap-2">
		{#each photos as photo, i}
			<div
				role="button"
				tabindex="0"
				onclick={() => (previewIndex = i)}
				onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') previewIndex = i; }}
				class="relative group h-16 w-16 rounded-lg overflow-hidden border border-border hover:border-accent transition-colors cursor-pointer"
			>
				<img src={photo} alt="Attached {i + 1}" class="h-full w-full object-cover" />
				<button
					type="button"
					onclick={(e: MouseEvent) => { e.stopPropagation(); removePhoto(i); }}
					class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-status-red text-white opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<X class="w-3 h-3" />
				</button>
			</div>
		{/each}

		{#if photos.length < max}
			<button
				type="button"
				onclick={openPicker}
				class={cn(
					'flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed transition-colors',
					'border-gray-200 text-gray-400 hover:border-accent hover:text-accent hover:bg-accent-light'
				)}
			>
				<Camera class="w-4 h-4" />
				<span class="text-[9px] font-medium">
					{photos.length === 0 ? 'Add' : `${photos.length}/${max}`}
				</span>
			</button>
		{/if}
	</div>

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		capture="environment"
		multiple
		onchange={handleFiles}
		class="hidden"
	/>
</div>

<!-- Lightbox preview -->
{#if previewIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		role="presentation"
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
		onclick={() => (previewIndex = null)}
	>
		<div class="relative max-w-[90vw] max-h-[85vh]">
			<img
				src={photos[previewIndex]}
				alt="Preview"
				class="max-w-full max-h-[85vh] rounded-lg object-contain"
			/>
			<button
				onclick={() => (previewIndex = null)}
				class="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900"
			>
				<X class="w-4 h-4" />
			</button>
		</div>
	</div>
{/if}
