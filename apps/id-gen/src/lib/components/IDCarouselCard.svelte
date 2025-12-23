<script lang="ts">
	// Types
	interface IDCard {
		idcard_id?: number;
		template_name: string;
		front_image?: string | null;
		back_image?: string | null;
		created_at?: string;
		fields?: Record<string, { value: string }>;
	}

	import { getProxiedUrl } from '$lib/utils/storage';

	// Props
	let {
		card,
		onPreview = () => {},
		className = ''
	} = $props<{
		card: IDCard;
		onPreview?: (card: IDCard) => void;
		className?: string;
	}>();

	// Derived values
	let frontImageUrl = $derived(card.front_image ? getProxiedUrl(card.front_image, 'cards') : null);

	// Event handlers
	function handleClick() {
		onPreview(card);
	}
</script>

<button
	type="button"
	class="group relative aspect-[3/2] w-full max-w-[300px] rounded-xl overflow-hidden bg-muted shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 {className}"
	onclick={handleClick}
	aria-label="Preview ID card"
>
	{#if frontImageUrl}
		<img
			src={frontImageUrl}
			alt="ID Card Preview"
			class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
			loading="lazy"
		/>
	{:else}
		<div class="w-full h-full flex items-center justify-center text-muted-foreground">
			<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				></path>
			</svg>
		</div>
	{/if}

	<!-- Hover Overlay with eye icon -->
	<div
		class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center"
	>
		<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
			<div class="bg-background/90 rounded-full p-3 shadow-md">
				<svg class="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					></path>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					></path>
				</svg>
			</div>
		</div>
	</div>
</button>
