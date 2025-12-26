<script lang="ts">
	import { X } from 'lucide-svelte';
	import TemplateCardPreview from './TemplateCardPreview.svelte';
	import TemplateActions from './TemplateActions.svelte';
	import TemplateMetadata from './TemplateMetadata.svelte';
	import type { TemplateElement } from '$lib/stores/templateStore';
	import type { DatabaseTemplate } from '$lib/types/template';

	interface Props {
		/** Whether the modal is open/visible */
		isOpen: boolean;
		/** Front side cropped preview URL */
		frontCropPreview: string | null;
		/** Back side cropped preview URL */
		backCropPreview: string | null;
		/** Front side full preview URL (fallback) */
		frontPreview: string | null;
		/** Back side full preview URL (fallback) */
		backPreview: string | null;
		/** Front side template elements */
		frontElements: TemplateElement[];
		/** Back side template elements */
		backElements: TemplateElement[];
		/** Required pixel dimensions for the template */
		requiredPixelDimensions: { width: number; height: number } | null;
		/** Current template being reviewed */
		currentTemplate: DatabaseTemplate | null;
		/** Current side being reviewed ('front' | 'back') */
		reviewSide: 'front' | 'back';
		/** Current rotation angle for flip animation */
		reviewRotation: number;
		/** Whether the review modal is closing (for fly animation) */
		isClosingReview: boolean;
		/** Target coordinates for fly-out animation */
		flyTarget: { top: number; left: number; width: number; height: number } | null;
		/** Whether variants are currently being generated */
		isGeneratingVariants: boolean;
		/** Current progress message for variant generation */
		variantGenerationProgress: string;
		/** Callback when card is flipped */
		onFlip: () => void;
		/** Callback when modal is cancelled/closed */
		onCancel: () => void;
		/** Callback when template is confirmed/saved */
		onConfirm: () => void;
	}

	let {
		isOpen,
		frontCropPreview,
		backCropPreview,
		frontPreview,
		backPreview,
		frontElements,
		backElements,
		requiredPixelDimensions,
		currentTemplate,
		reviewSide,
		reviewRotation,
		isClosingReview,
		flyTarget,
		isGeneratingVariants,
		variantGenerationProgress,
		onFlip,
		onCancel,
		onConfirm
	}: Props = $props();

	// Handle backdrop click to close
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget && !isClosingReview && !isGeneratingVariants) {
			onCancel();
		}
	}

	// Handle escape key to close
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isClosingReview && !isGeneratingVariants) {
			onCancel();
		}
	}
</script>

<!-- Robust Review Overlay -->
{#if isOpen && requiredPixelDimensions}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<!-- Backdrop with fade out -->
		<div
			class="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-600"
			class:opacity-0={isClosingReview}
		></div>

		<div
			class="relative w-full max-w-4xl flex flex-col items-center animate-in fade-in zoom-in duration-200"
		>
			<!-- Header -->
			<div
				class="w-full flex items-center justify-center mb-8 relative transition-opacity duration-300"
				class:opacity-0={isClosingReview}
			>
				<h2 class="text-2xl font-bold text-white">Review Template</h2>
				<button
					onclick={onCancel}
					disabled={isGeneratingVariants}
					class="absolute right-0 p-2 text-white/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<X size={24} />
				</button>
			</div>

			<!-- 3D Card Preview -->
			<TemplateCardPreview
				{frontCropPreview}
				{backCropPreview}
				{frontPreview}
				{backPreview}
				{frontElements}
				{backElements}
				{requiredPixelDimensions}
				{reviewSide}
				{reviewRotation}
				{isClosingReview}
				{flyTarget}
				{onFlip}
			/>

			<!-- Action Buttons -->
			<TemplateActions
				{isClosingReview}
				{isGeneratingVariants}
				{variantGenerationProgress}
				{onCancel}
				{onConfirm}
			/>

			<!-- Metadata Display -->
			<TemplateMetadata
				{currentTemplate}
				{requiredPixelDimensions}
				{frontElements}
				{backElements}
				{isGeneratingVariants}
				{variantGenerationProgress}
				{isClosingReview}
			/>
		</div>
	</div>
{/if}
