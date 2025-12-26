<script lang="ts">
	import { Edit, Save } from 'lucide-svelte';

	interface Props {
		/** Whether the review modal is closing (for fade-out animation) */
		isClosingReview: boolean;
		/** Whether variants are currently being generated */
		isGeneratingVariants: boolean;
		/** Current progress message for variant generation */
		variantGenerationProgress: string;
		/** Callback when cancel/back button is clicked */
		onCancel: () => void;
		/** Callback when confirm/save button is clicked */
		onConfirm: () => void;
	}

	let {
		isClosingReview,
		isGeneratingVariants,
		variantGenerationProgress,
		onCancel,
		onConfirm
	}: Props = $props();
</script>

<!-- Actions -->
<div
	class="flex gap-4 items-center mt-4 transition-opacity duration-300"
	class:opacity-0={isClosingReview}
>
	<button
		onclick={onCancel}
		disabled={isGeneratingVariants}
		class="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all font-medium flex items-center gap-2 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		<Edit size={18} />
		Back to Edit
	</button>

	<button
		onclick={onConfirm}
		disabled={isGeneratingVariants}
		class="px-8 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all font-bold flex items-center gap-2 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
	>
		{#if isGeneratingVariants}
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
			></div>
			{variantGenerationProgress || 'Saving...'}
		{:else}
			<Save size={18} />
			Save Template
		{/if}
	</button>
</div>
