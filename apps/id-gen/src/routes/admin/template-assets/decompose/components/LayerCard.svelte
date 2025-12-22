<script lang="ts">
	import {
		GripVertical,
		Eye,
		EyeOff,
		Trash2,
		ChevronDown,
		ChevronUp,
		ZoomIn,
        MoreVertical,
        ArrowUp,
        ArrowDown,
        Sparkles,
        Scissors,
        Image as ImageIcon
	} from 'lucide-svelte';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
	import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';

	let {
		layer,
		selection,
		isOriginal = false,
		isSelected = false,
		isExpanded = false,
		visible = true,
		showOriginalLayer = true,
		mergeMode = false,
		isProcessing = false,
		isSelectedForMerge = false,
		opacity = 100,
		layerSettings = { downscale: false },
		isDragged = false,
		isDragOver = false,
		// Event handlers
		onSelect,
		onToggleExpanded,
		onToggleIncluded,
		onToggleOriginalLayer,
		onDelete,
		onUpdateVariableName,
		onUpdateType,
		onSetOpacity,
		onToggleDownscale,
		onMergeSelect,
		onPreviewImage,
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop,
        onAction,
        onMoveUp,
        onMoveDown
	}: {
		layer: DecomposedLayer | { id: string; name: string; imageUrl: string; zIndex: number };
		selection: LayerSelection | undefined;
		isOriginal?: boolean;
		isSelected?: boolean;
		isExpanded?: boolean;
		visible?: boolean;
		showOriginalLayer?: boolean;
		mergeMode?: boolean;
		isProcessing?: boolean;
		isSelectedForMerge?: boolean;
		opacity?: number;
		layerSettings?: { downscale: boolean };
		isDragged?: boolean;
		isDragOver?: boolean;
		// Event handlers
		onSelect?: () => void;
		onToggleExpanded?: () => void;
		onToggleIncluded?: () => void;
		onToggleOriginalLayer?: () => void;
		onDelete?: () => void;
		onUpdateVariableName?: (name: string) => void;
		onUpdateType?: (type: LayerSelection['elementType']) => void;
		onSetOpacity?: (value: number) => void;
		onToggleDownscale?: () => void;
		onMergeSelect?: () => void;
		onPreviewImage?: (url: string, title: string) => void;
		onDragStart?: (e: DragEvent) => void;
		onDragOver?: (e: DragEvent) => void;
		onDragLeave?: () => void;
		onDrop?: (e: DragEvent) => void;
        onAction?: (action: 'decompose' | 'upscale' | 'remove' | 'crop') => void;
        onMoveUp?: () => void;
        onMoveDown?: () => void;
	} = $props();

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'image': return 'IMG';
			case 'text': return 'TXT';
			case 'photo': return 'PHO';
			case 'qr': return 'QR';
			case 'signature': return 'SIG';
			default: return 'IMG';
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative bg-muted/30 transition-colors rounded-lg border border-border/50
		{isDragged ? 'opacity-50' : ''}
		{isDragOver ? 'border-primary ring-1 ring-primary' : ''}
        {isProcessing ? 'animate-pulse' : ''}
    "
	draggable={!isOriginal}
	ondragstart={onDragStart}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
>
	<!-- Active/Selected Indicator Bar -->
	<div
		class="absolute left-0 top-0 bottom-0 w-1 rounded-l transition-colors {isSelected
			? 'bg-cyan-500'
			: isExpanded
				? 'bg-cyan-500/50'
				: 'bg-transparent'}"
	></div>

	<!-- Layer Row (Collapsed View) -->
	<div
		class="flex items-center gap-3 p-3 pl-4 cursor-pointer hover:bg-muted/50 rounded-lg"
		onclick={onSelect}
		onkeydown={(e) => e.key === 'Enter' && onSelect?.()}
		tabindex={0}
		role="button"
	>
		<!-- Drag Handle / Merge Checkbox -->
        {#if mergeMode && !isOriginal}
             <div class="flex items-center justify-center w-5" onclick={e => e.stopPropagation()}>
                <input 
                    type="checkbox" 
                    checked={isSelectedForMerge} 
                    onchange={onMergeSelect}
                    class="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
             </div>
		{:else if !isOriginal}
			<div class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0">
				<GripVertical class="h-4 w-4" />
			</div>
		{:else}
			<div class="w-4 flex-shrink-0"></div>
		{/if}

		<!-- Visibility Toggle -->
		{#if isOriginal}
			<button
				class="flex-shrink-0 text-muted-foreground hover:text-foreground"
				onclick={(e) => {
					e.stopPropagation();
					onToggleOriginalLayer?.();
				}}
				title={showOriginalLayer ? 'Hide original' : 'Show original'}
			>
				{#if showOriginalLayer}
					<Eye class="h-4 w-4" />
				{:else}
					<EyeOff class="h-4 w-4 opacity-50" />
				{/if}
			</button>
		{:else}
			<button
				class="flex-shrink-0 text-muted-foreground hover:text-foreground"
				onclick={(e) => {
					e.stopPropagation();
					onToggleIncluded?.();
				}}
				title={selection?.included ? 'Exclude layer' : 'Include layer'}
			>
				{#if selection?.included}
					<Eye class="h-4 w-4" />
				{:else}
					<EyeOff class="h-4 w-4 opacity-50" />
				{/if}
			</button>
		{/if}

		<!-- Layer Thumbnail -->
		<button
			class="w-14 h-14 rounded-lg border border-border bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center cursor-zoom-in group relative"
			onclick={(e) => {
				e.stopPropagation();
				onPreviewImage?.(layer.imageUrl, 'layer.name');
			}}
			title="Click to view full image"
		>
			{#if selection?.elementType === 'qr'}
				<span class="text-[10px] text-muted-foreground font-medium">QR<br />Code</span>
			{:else}
				<img
					src={layer.imageUrl}
					alt="Thumbnail"
					class="w-full h-full object-contain"
					style="opacity: {isOriginal ? 1 : (opacity ?? 100) / 100}"
				/>
			{/if}
			<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
				<ZoomIn class="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
			</div>
		</button>

		<!-- Layer Info -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-foreground truncate">
					{layer.name || 'Untitled Layer'}
				</span>
				<!-- Type Badge -->
				<span
					class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0
						{isOriginal
						? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
						: 'bg-muted text-muted-foreground border border-border'}"
				>
					{isOriginal ? 'BG' : getTypeIcon(selection?.elementType || 'image')}
				</span>
			</div>
			<div class="flex items-center gap-2 mt-0.5">
				<span class="text-xs text-muted-foreground">
					z-index: {layer.zIndex}
				</span>
				<!-- Status Dot -->
				{#if !isOriginal && selection?.included}
					<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
				{/if}
			</div>
		</div>

		<!-- Right Side Controls -->
		<div class="flex items-center gap-1 flex-shrink-0" onclick={(e) => e.stopPropagation()}>
            <!-- Move Up/Down -->
            {#if !isOriginal && !mergeMode}
                 <div class="flex flex-col mr-1">
                    <button class="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" onclick={onMoveUp}>
                        <ArrowUp class="w-3 h-3 text-muted-foreground"/>
                    </button>
                    <button class="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" onclick={onMoveDown}>
                        <ArrowDown class="w-3 h-3 text-muted-foreground"/>
                    </button>
                 </div>
            {/if}

            <!-- Actions Menu -->
            {#if !mergeMode}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        {#snippet child({ props })}
                            <Button {...props} variant="ghost" size="icon" class="h-8 w-8">
                                <MoreVertical class="h-4 w-4" />
                            </Button>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Item onclick={() => onAction?.('upscale')}>
                            <Sparkles class="mr-2 h-4 w-4" /> Upscale
                        </DropdownMenu.Item>
                         <DropdownMenu.Item onclick={() => onAction?.('decompose')}>
                            <ImageIcon class="mr-2 h-4 w-4" /> Decompose
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onclick={() => onAction?.('crop')}>
                            <Scissors class="mr-2 h-4 w-4" /> Crop
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item onclick={() => onAction?.('remove')}>
                            <Trash2 class="mr-2 h-4 w-4" /> Remove Element
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            {/if}

			<!-- Delete Button (Quick access) -->
			{#if !isOriginal && !mergeMode}
				<button
					class="p-2 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
					onclick={onDelete}
					title="Delete layer"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			{/if}

			<!-- Expand/Collapse Chevron -->
			{#if !isOriginal}
				<button
					class="p-2 text-muted-foreground hover:text-foreground transition-colors"
					onclick={onToggleExpanded}
					title={isExpanded ? 'Collapse' : 'Expand settings'}
				>
					{#if isExpanded}
						<ChevronUp class="h-4 w-4" />
					{:else}
						<ChevronDown class="h-4 w-4" />
					{/if}
				</button>
			{/if}
		</div>
	</div>

	<!-- Expanded Settings Panel -->
	{#if !isOriginal && isExpanded && selection}
		<div class="px-4 pb-4 space-y-4 border-t border-border/30 bg-background/50">
			<!-- Variable Name -->
			<div class="pt-4">
				<label
					for="varName-{layer.id}"
					class="text-xs font-medium text-cyan-600 dark:text-cyan-400 block mb-2"
				>
					Variable Name
				</label>
				<input
					id="varName-{layer.id}"
					type="text"
					value={selection.variableName}
					oninput={(e) => onUpdateVariableName?.((e.target as HTMLInputElement).value)}
					class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
					placeholder="layer_1"
				/>
			</div>

			<!-- Element Type -->
			<div>
				<label
					for="type-{layer.id}"
					class="text-xs font-medium text-cyan-600 dark:text-cyan-400 block mb-2"
				>
					Element Type
				</label>
				<div class="relative">
					<select
						id="type-{layer.id}"
						value={selection.elementType}
						onchange={(e) =>
							onUpdateType?.((e.target as HTMLSelectElement).value as LayerSelection['elementType'])}
						class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm appearance-none pr-10"
					>
						<option value="image">Image (Static graphic)</option>
						<option value="text">Text (Dynamic field)</option>
						<option value="photo">Photo (User upload)</option>
						<option value="qr">QR Code</option>
						<option value="signature">Signature</option>
					</select>
					<ChevronDown
						class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
					/>
				</div>
			</div>

			<!-- Opacity Control -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-medium text-cyan-600 dark:text-cyan-400">Opacity</span>
					<span class="text-sm font-medium text-foreground">{opacity}%</span>
				</div>
				<Slider
					min={0}
					max={100}
					step={1}
					value={[opacity]}
					type="multiple"
					onValueChange={(v: number[]) => onSetOpacity?.(v[0])}
					class="w-full"
				/>
			</div>

			<!-- Pre-shrink Toggle -->
			<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
				<div>
					<p class="text-sm font-medium text-foreground">Pre-shrink before upscale</p>
					<p class="text-xs text-muted-foreground">Make artificially low-res</p>
				</div>
				<Switch
					id="downscale-{layer.id}"
					checked={layerSettings?.downscale}
					onCheckedChange={onToggleDownscale}
				/>
			</div>
		</div>
	{/if}
</div>
