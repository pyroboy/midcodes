<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		imageUrl,
		title,
		assetDimensions
	}: {
		open: boolean;
		imageUrl: string | null;
		title: string | null;
		assetDimensions: { width: number; height: number };
	} = $props();
</script>

{#if open && imageUrl}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
		transition:fade={{ duration: 200 }}
		onclick={() => (open = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
			onclick={(e: MouseEvent) => e.stopPropagation()}
			role="none"
		>
			<img
				src={imageUrl}
				alt="Full view"
				class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
				transition:scale={{ start: 0.95, duration: 200 }}
			/>
			<button
				class="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
				onclick={() => (open = false)}
			>
				<X class="w-6 h-6" />
			</button>
			<!-- Image info overlay -->
			<div
				class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm"
			>
				{title || 'Layer Preview'} • {assetDimensions.width} × {assetDimensions.height}px
			</div>
		</div>
	</div>
{/if}
