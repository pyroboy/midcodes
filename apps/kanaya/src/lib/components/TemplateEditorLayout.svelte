<script lang="ts">
	import TemplateEdit from './TemplateEdit.svelte';
	import type { TemplateElement } from '$lib/stores/templateStore';
	import type { CardSize } from '$lib/utils/sizeConversion';

	interface Props {
		version: number;
		isLoading: boolean;
		frontElements: TemplateElement[];
		backElements: TemplateElement[];
		frontPreview: string | null;
		backPreview: string | null;
		errorMessage: string;
		cardSize: CardSize | null;
		pixelDimensions: { width: number; height: number } | null;
		isSuperAdmin: boolean;
		templateId: string | null;
		isDecomposing: boolean;
		hasChanges: boolean;

		onBack: () => void;
		onSave: () => void;
		onClear: () => void;
		onUpdateElements: (elements: TemplateElement[], side: 'front' | 'back') => void;
		onImageUpload: (files: File[], side: 'front' | 'back') => Promise<void>;
		onRemoveImage: (side: 'front' | 'back') => void;
		onUpdateBackgroundPosition: (position: any, side: 'front' | 'back') => Promise<void>;
		onDecompose: () => Promise<void>;
	}

	let {
		version,
		isLoading,
		frontElements,
		backElements,
		frontPreview,
		backPreview,
		errorMessage,
		cardSize,
		pixelDimensions,
		isSuperAdmin,
		templateId,
		isDecomposing,
		hasChanges,
		onBack,
		onSave,
		onClear,
		onUpdateElements,
		onImageUpload,
		onRemoveImage,
		onUpdateBackgroundPosition,
		onDecompose
	}: Props = $props();
</script>

<div class="col-start-1 row-start-1 w-full h-full bg-background">
	{#key version}
		<TemplateEdit
			{version}
			{isLoading}
			{frontElements}
			{backElements}
			{frontPreview}
			{backPreview}
			{errorMessage}
			{cardSize}
			{pixelDimensions}
			{hasChanges}
			{onBack}
			{onSave}
			{onClear}
			onUpdateElements={(elements, side) => onUpdateElements(elements, side)}
			onImageUpload={(files, side) => onImageUpload(files, side)}
			onRemoveImage={(side) => onRemoveImage(side)}
			onUpdateBackgroundPosition={async (position, side) => {
				await onUpdateBackgroundPosition(position, side);
			}}
			{isSuperAdmin}
			{templateId}
			{onDecompose}
			{isDecomposing}
		/>
	{/key}
</div>
