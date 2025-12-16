<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Copy, Trash2, Edit, Plus, FileText, Image as ImageIcon, Type, MoreVertical } from '@lucide/svelte';
	import type { TemplateData, TemplateElement } from '../stores/templateStore';
	import { goto } from '$app/navigation';
	import { invalidate } from '$app/navigation';
	import SizeSelectionDialog from './SizeSelectionDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { CardSize } from '$lib/utils/sizeConversion';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import DeleteConfirmationDialog from '$lib/components/DeleteConfirmationDialog.svelte';
	import type { TemplateAsset } from '$lib/schemas/template-assets.schema';

	let { templates = $bindable([]), onSelect, onCreateNew, units = 'in', dpi = 300, savingTemplateId = null }: {
		templates: any[];
		onSelect: (id: string) => void;
		onCreateNew?: (cardSize: CardSize, templateName: string, orientation?: 'landscape' | 'portrait', frontBackgroundUrl?: string, selectedTemplateAsset?: TemplateAsset) => void;
		units?: string;
		dpi?: number;
		savingTemplateId?: string | null;
	} = $props();
	type Units = 'px' | 'in' | 'mm' | 'cm';

	// Compute pixel dimensions
	type Dim = { w: number; h: number };
	function getPixelDims(t: any): Dim {
		if (t?.width_pixels && t?.height_pixels) return { w: t.width_pixels, h: t.height_pixels };
		if (t?.orientation === 'portrait') return { w: 638, h: 1013 };
		return { w: 1013, h: 638 };
	}

	function pxToUnits(px: number, units: Units, dpi: number): number {
		if (units === 'px') return px;
		const inches = px / Math.max(dpi, 1);
		switch (units) {
			case 'in':
				return inches;
			case 'mm':
				return inches * 25.4;
			case 'cm':
				return inches * 2.54;
			default:
				return px;
		}
	}

	function formatDims(t: any, units: Units, dpi: number): string {
		const { w, h } = getPixelDims(t);
		const uw = pxToUnits(w, units, dpi);
		const uh = pxToUnits(h, units, dpi);
		const precision = units === 'px' ? 0 : 1;
		return `${uw.toFixed(precision)}${units} × ${uh.toFixed(precision)}${units}`;
	}

	// Helper to calculate percentage positions with rotation
	// Uses higher precision to ensure pixel-perfect positioning
	function getElementStyle(el: TemplateElement, templateW: number, templateH: number) {
		// Use high precision percentages to avoid sub-pixel rounding issues
		const left = ((el.x / templateW) * 100);
		const top = ((el.y / templateH) * 100);
		const width = ((el.width / templateW) * 100);
		const height = ((el.height / templateH) * 100);
		const rotation = el.rotation || 0;

		return `
			left: ${left.toFixed(6)}%;
			top: ${top.toFixed(6)}%;
			width: ${width.toFixed(6)}%;
			height: ${height.toFixed(6)}%;
			transform: rotate(${rotation}deg);
			transform-origin: center center;
		`;
	}

	// Helper to create text styling that matches TemplateForm exactly
	// Uses container query width (cqw) units for accurate scaling
	function getTextStyle(el: TemplateElement, templateW: number) {
		// Calculate font-size as percentage of container width using cqw units
		// This ensures text scales proportionally with the container
		// Use fontSize (new) with fallback to size (legacy) for backwards compatibility
		const fontSizeCqw = ((el.fontSize || el.size || 16) / templateW) * 100;
		const letterSpacingCqw = el.letterSpacing
			? (el.letterSpacing / templateW) * 100
			: null;

		return `
			font-family: "${el.fontFamily || el.font || 'Arial'}", sans-serif;
			font-weight: ${el.fontWeight || '400'};
			font-style: ${el.fontStyle || 'normal'};
			font-size: ${fontSizeCqw.toFixed(3)}cqw;
			color: ${el.color || '#000000'};
			text-align: ${el.alignment || 'left'};
			text-transform: ${el.textTransform || 'none'};
			text-decoration: ${el.textDecoration || 'none'};
			letter-spacing: ${letterSpacingCqw ? `${letterSpacingCqw.toFixed(3)}cqw` : 'normal'};
			line-height: ${el.lineHeight || '1.2'};
			opacity: ${typeof el.opacity === 'number' ? el.opacity : 1};
			display: block;
			width: 100%;
			white-space: pre-wrap;
			word-break: break-word;
		`;
	}


	let selectedTemplate: TemplateData | null = null;
	let notification: string | null = $state(null);
	let hoveredTemplate: string | null = $state(null);
	let showSizeDialog: boolean = $state(false);

	// Delete dialog state
	let showDeleteDialog = $state(false);
	let templateToDelete: TemplateData | null = $state(null);

	function deleteTemplate(template: TemplateData) {
		templateToDelete = template;
		showDeleteDialog = true;
	}

	async function handleDeleteConfirm(deleteIds: boolean) {
		if (!templateToDelete) return;

		try {
			const formData = new FormData();
			formData.append('templateId', templateToDelete.id);
			formData.append('deleteIds', deleteIds.toString());

			const response = await fetch('/templates?/delete', { method: 'POST', body: formData });
			if (!response.ok) throw new Error('Failed to delete template');

			templates = templates.filter((t) => t.id !== templateToDelete!.id);
			showNotification('Template deleted successfully');
		} catch (err) {
			console.error('Error deleting template:', err);
			showNotification('Error deleting template');
		} finally {
			templateToDelete = null;
		}
	}

	async function duplicateTemplate(template: TemplateData) {
		try {
			const formData = new FormData();
			formData.append('templateId', template.id);
			const response = await fetch('/templates?/duplicate', { method: 'POST', body: formData });
			const result = await response.json();
			if (result.type === 'failure' || result.status >= 400)
				throw new Error(result.data?.message || 'Failed to duplicate');
			const newTemplate = result.data?.data || result.data;
			if (!newTemplate) throw new Error('Server did not return the new template');
			templates = [newTemplate, ...templates];
			showNotification(`Duplicated "${template.name}" successfully`);
			await invalidate('app:templates');
		} catch (err) {
			console.error('Error duplicating template:', err);
			showNotification('Error duplicating template');
		}
	}

	function useTemplate(id: string) {
		goto(`/use-template/${id}`, { replaceState: false });
	}
	function showNotification(message: string) {
		notification = message;
		setTimeout(() => {
			notification = null;
		}, 3000);
	}
	function selectTemplate(template: TemplateData) {
		selectedTemplate = template;
		onSelect(selectedTemplate.id);
	}

	function handleActionClick(
		e: Event,
		template: TemplateData,
		action: 'edit' | 'use' | 'duplicate' | 'delete'
	) {
		e.stopPropagation();
		switch (action) {
			case 'edit':
				selectTemplate(template);
				break;
			case 'use':
				useTemplate(template.id);
				break;
			case 'duplicate':
				duplicateTemplate(template);
				break;
			case 'delete':
				deleteTemplate(template);
				break;
		}
	}

	function handleCreateNew() {
		showSizeDialog = true;
	}
	function handleSizeSelected(event: CustomEvent<{ cardSize: CardSize; templateName: string; selectedTemplateAsset?: TemplateAsset }>) {
		const { cardSize, templateName, selectedTemplateAsset } = event.detail;
		showSizeDialog = false;
		
		// Debug: Log the event details
		console.log('📤 [TemplateList] handleSizeSelected:', {
			cardSize,
			templateName,
			selectedTemplateAsset,
			selectedTemplateAsset_image_url: selectedTemplateAsset?.image_url
		});
		
		// Determine orientation from card dimensions
		const orientation = cardSize.width < cardSize.height ? 'portrait' : 'landscape';
		
		// Pass all parameters including the front background URL
		onCreateNew?.(cardSize, templateName, orientation, selectedTemplateAsset?.image_url);
	}
	function handleSizeSelectionCancel() {
		showSizeDialog = false;
	}
</script>

<div class="h-full w-full overflow-y-auto bg-background p-6">
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">Templates</h2>
		<Button onclick={handleCreateNew} class="flex items-center gap-2">
			<Plus class="h-4 w-4" />
			Create New Template
		</Button>
	</div>

	{#if templates.length === 0}
		<EmptyState
			icon={FileText as any}
			title="No templates yet"
			description="Create your first ID card template to get started."
			action={{ label: 'Create Template', onclick: handleCreateNew }}
		/>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
			{#each templates as template (template.id)}
				{@const dims = getPixelDims(template)}
				{@const isPortrait = dims.h > dims.w}
				{@const longEdge = Math.max(dims.w, dims.h)}
				{@const shortEdge = Math.min(dims.w, dims.h)}
				{@const cardWidthPercent = isPortrait ? (shortEdge / longEdge) * 100 : 100}
				<div
					id="template-card-{template.id}"
					class="group relative flex flex-col bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50 overflow-hidden h-full"
					role="article"
					aria-label={`Template card for ${template.name}`}
					onmouseenter={() => (hoveredTemplate = template.id)}
					onmouseleave={() => (hoveredTemplate = null)}
				>
					<!-- Aspect Ratio Container - uniform sizing: both orientations constrain the long edge equally -->
					<div
						class="relative w-full pt-4 px-4 flex-1 flex items-center justify-center bg-muted/30"
					>
						<a
							href="/use-template/{template.id}"
							class="relative flex items-center justify-center w-full"
							style="height: 220px;"
							data-sveltekit-reload="off"
						>
							<div
								class="relative shadow-md rounded-lg overflow-hidden bg-white transition-transform duration-300 group-hover:scale-105"
								style="aspect-ratio: {dims.w} / {dims.h}; width: {cardWidthPercent}%; max-height: 100%; container-type: size;"
							>
								<!-- 1. Background Image -->
								{#if template.front_background}
									<img
										src={(() => {
                                            // Prefer low-res if available
                                            const url = template.front_background_low_res || template.front_background;
                                            if (!url) return '';
                                            return (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:'))
												? url
												: getSupabaseStorageUrl(url);
                                        })()}
										alt={template.name}
										class="w-full h-full object-cover"
										loading="lazy"
									/>
								{:else}
									<div
										class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs"
									>
										No Preview
									</div>
								{/if}

								<!-- 2. Elements Overlay (Preview) -->
								{#if template.template_elements && template.template_elements.length > 0}
									<div class="absolute inset-0 pointer-events-none overflow-hidden">
										{#each template.template_elements.filter((el: any) => el.side === 'front') as el}
											<div
												class="absolute flex items-center overflow-hidden border border-dashed leading-none select-none"
												class:justify-center={!el.alignment || el.alignment === 'center'}
												class:justify-start={el.alignment === 'left'}
												class:justify-end={el.alignment === 'right'}
												style="{getElementStyle(el, dims.w, dims.h)}; 
													box-sizing: border-box;
													background-color: {el.type === 'photo' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0)'};
													border-color: rgba(0,0,0,0.1);"
											>
												{#if el.type === 'photo'}
													<ImageIcon class="w-3 h-3 text-blue-500/50" />
												{:else if el.type === 'text' || el.type === 'selection'}
									<span
										class="truncate px-0.5"
										style="{getTextStyle(el, dims.w)}"
									>
										{el.type === 'selection' 
											? (el.content || el.options?.[0] || '')
											: (el.content || '')}
									</span>
												{:else if el.type === 'qr'}
													<div class="w-full h-full bg-black/10 flex items-center justify-center">
														<div class="w-1/2 h-1/2 bg-black/20"></div>
													</div>
												{:else if el.type === 'signature'}
													<span class="text-slate-400 italic" style="font-size: 3cqw;"
														>Signature</span
													>
												{/if}
											</div>
										{/each}
									</div>
								{/if}

								<!-- Hover Overlay -->
								<div
									class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200"
								></div>
								
								<!-- Loading Overlay -->
								{#if savingTemplateId === template.id}
									<div class="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-20 transition-all duration-300">
										<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
									</div>
								{/if}
							</div>
						</a>
					</div>

					<!-- Footer Info -->
					<div class="p-4 border-t border-border bg-card z-10">
						<h3 class="font-semibold text-foreground truncate" title={template.name}>
							{template.name}
						</h3>
						<p class="text-xs text-muted-foreground mt-1">
							{formatDims(template, units as Units, dpi)}
						</p>
					</div>

					<!-- Action Dropdown Menu (Persistent) -->
					<div class="absolute top-2 right-2 z-20">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										variant="ghost"
										size="sm"
										class="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-accent"
									>
										<MoreVertical class="h-4 w-4" />
										<span class="sr-only">Template actions</span>
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-40">
								<DropdownMenu.Item
									onclick={(e) => handleActionClick(e, template, 'edit')}
									class="flex items-center gap-2 cursor-pointer"
								>
									<Edit class="h-4 w-4" />
									<span>Edit</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={(e) => handleActionClick(e, template, 'duplicate')}
									class="flex items-center gap-2 cursor-pointer"
								>
									<Copy class="h-4 w-4" />
									<span>Duplicate</span>
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									onclick={(e) => handleActionClick(e, template, 'delete')}
									class="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
								>
									<Trash2 class="h-4 w-4" />
									<span>Delete</span>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Size Selection Dialog -->
<SizeSelectionDialog
	bind:open={showSizeDialog}
	on:sizeSelected={handleSizeSelected}
	on:cancel={handleSizeSelectionCancel}
/>

{#if templateToDelete}
	<DeleteConfirmationDialog
		bind:open={showDeleteDialog}
		templateName={templateToDelete.name}
		onConfirm={handleDeleteConfirm}
		onCancel={() => {
			showDeleteDialog = false;
			templateToDelete = null;
		}}
	/>
{/if}

{#if notification}
	<div
		class="fixed bottom-4 right-4 z-50 rounded-lg bg-foreground text-background px-4 py-2 shadow-lg"
		transition:fade
	>
		{notification}
	</div>
{/if}
