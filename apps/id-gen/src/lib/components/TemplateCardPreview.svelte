<script lang="ts">
	import { RotateCcw } from 'lucide-svelte';
	import IdCanvas from '$lib/components/IdCanvas.svelte';
	import type { TemplateElement } from '$lib/stores/templateStore';

	interface Props {
		/** Front side cropped preview URL (preferred for display) */
		frontCropPreview: string | null;
		/** Back side cropped preview URL (preferred for display) */
		backCropPreview: string | null;
		/** Front side full preview URL (fallback) */
		frontPreview: string | null;
		/** Back side full preview URL (fallback) */
		backPreview: string | null;
		/** Front side template elements */
		frontElements: TemplateElement[];
		/** Back side template elements */
		backElements: TemplateElement[];
		/** Required pixel dimensions for the card */
		requiredPixelDimensions: { width: number; height: number };
		/** Current side being reviewed ('front' | 'back') */
		reviewSide: 'front' | 'back';
		/** Current rotation angle for flip animation */
		reviewRotation: number;
		/** Whether the review modal is closing */
		isClosingReview: boolean;
		/** Target coordinates for fly-out animation */
		flyTarget: { top: number; left: number; width: number; height: number } | null;
		/** Callback when card is clicked to flip */
		onFlip: () => void;
	}

	let {
		frontCropPreview,
		backCropPreview,
		frontPreview,
		backPreview,
		frontElements,
		backElements,
		requiredPixelDimensions,
		reviewSide,
		reviewRotation,
		isClosingReview,
		flyTarget,
		onFlip
	}: Props = $props();

	// Computed display scale (60% of original for review modal)
	const displayScale = 0.6;
</script>

<!-- 3D Flip Preview Area -->
<!-- Scale down large cards to fit screen -->
<div
	class="relative perspective-1000 mb-8 select-none"
	style="
		width: {isClosingReview && flyTarget
		? flyTarget.width
		: requiredPixelDimensions.width * displayScale}px; 
		height: {isClosingReview && flyTarget
		? flyTarget.height
		: requiredPixelDimensions.height * displayScale}px;
		position: {isClosingReview ? 'fixed' : 'relative'};
		top: {isClosingReview && flyTarget ? flyTarget.top : ''}px;
		left: {isClosingReview && flyTarget ? flyTarget.left : ''}px;
		transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		z-index: 100;
		pointer-events: {isClosingReview ? 'none' : 'auto'};
	"
>
	<!-- Flip Container -->
	<div
		class="w-full h-full relative transition-transform duration-700 ease-in-out transform-style-3d cursor-pointer"
		style="transform: rotateY({isClosingReview ? 0 : reviewRotation}deg);"
		onclick={onFlip}
		onkeydown={(e) => e.key === 'Enter' && onFlip()}
		role="button"
		tabindex="0"
	>
		<!-- Front Face -->
		<div class="absolute inset-0 backface-hidden shadow-2xl rounded-lg overflow-hidden bg-white">
			<IdCanvas
				pixelDimensions={requiredPixelDimensions}
				backgroundUrl={frontCropPreview || frontPreview || ''}
				elements={frontElements}
				showBoundingBoxes={false}
				formData={{}}
				fileUploads={{}}
				imagePositions={{}}
			/>
			<div
				class="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-md z-10"
			>
				FRONT
			</div>
		</div>

		<!-- Back Face -->
		<div
			class="absolute inset-0 backface-hidden shadow-2xl rounded-lg overflow-hidden bg-white"
			style="transform: rotateY(180deg);"
		>
			<IdCanvas
				pixelDimensions={requiredPixelDimensions}
				backgroundUrl={backCropPreview || backPreview || ''}
				elements={backElements}
				showBoundingBoxes={false}
				formData={{}}
				fileUploads={{}}
				imagePositions={{}}
			/>
			<div
				class="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-md z-10"
			>
				BACK
			</div>
		</div>
	</div>

	<div
		class="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-sm flex items-center gap-2 pointer-events-none whitespace-nowrap transition-opacity duration-300"
		class:opacity-0={isClosingReview}
	>
		<RotateCcw size={14} />
		Click card to flip • Verify your design before saving
	</div>
</div>

<style>
	.perspective-1000 {
		perspective: 1000px;
	}
	.transform-style-3d {
		transform-style: preserve-3d;
	}
	.backface-hidden {
		backface-visibility: hidden;
	}
</style>
