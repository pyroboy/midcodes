<script lang="ts">
	import type { TemplateElement } from '$lib/stores/templateStore';
	import type { DatabaseTemplate } from '$lib/types/template';

	interface Props {
		/** Current template being reviewed */
		currentTemplate: DatabaseTemplate | null;
		/** Required pixel dimensions for the template */
		requiredPixelDimensions: { width: number; height: number };
		/** Front side template elements */
		frontElements: TemplateElement[];
		/** Back side template elements */
		backElements: TemplateElement[];
		/** Whether variants are currently being generated */
		isGeneratingVariants: boolean;
		/** Current progress message for variant generation */
		variantGenerationProgress: string;
		/** Whether the review modal is closing (for fade-out animation) */
		isClosingReview: boolean;
	}

	let {
		currentTemplate,
		requiredPixelDimensions,
		frontElements,
		backElements,
		isGeneratingVariants,
		variantGenerationProgress,
		isClosingReview
	}: Props = $props();

	// Computed total element count
	const totalElements = $derived(frontElements.length + backElements.length);
</script>

<!-- Metadata -->
<div
	class="mt-8 text-center text-white/40 text-sm transition-opacity duration-300"
	class:opacity-0={isClosingReview}
>
	{#if isGeneratingVariants}
		<!-- Variant Generation Progress Indicator -->
		<div class="mb-4 flex items-center justify-center gap-2 text-white">
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
			></div>
			<span class="text-sm font-medium">{variantGenerationProgress}</span>
		</div>
	{/if}
	<p class="font-medium">{currentTemplate?.name || 'Untitled Template'}</p>
	<p>
		{requiredPixelDimensions.width}px × {requiredPixelDimensions.height}px • {totalElements} Elements
	</p>
</div>
