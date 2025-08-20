<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { Copy, Trash2, Edit, Plus, FileText } from '@lucide/svelte';
	import type { TemplateData } from '../stores/templateStore';
	import { goto } from '$app/navigation';
	import { invalidate } from '$app/navigation';
	import SizeSelectionDialog from './SizeSelectionDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { CardSize } from '$lib/utils/sizeConversion';

	let { templates = $bindable([]), onSelect, onCreateNew, units = 'in', dpi = 300 } = $props();
	type Units = 'px' | 'in' | 'mm' | 'cm';

	// Preview scaling constants (in CSS px)
	const PREVIEW_HEIGHT = 256; // increased height of the preview box for scaling

	// Compute pixel dimensions and global scale reference
	type Dim = { w: number; h: number };
	function getPixelDims(t: any): Dim {
		// Prefer explicit pixel dimensions if present
		if (t?.width_pixels && t?.height_pixels) return { w: t.width_pixels, h: t.height_pixels };
		// Fallback by orientation (legacy)
		if (t?.orientation === 'portrait') return { w: 638, h: 1013 };
		// default landscape
		return { w: 1013, h: 638 };
	}

	let maxHeightPx = $state(0);

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
		const unitLabel = units;
		return `${uw.toFixed(precision)}${unitLabel} × ${uh.toFixed(precision)}${unitLabel}`;
	}
	$effect(() => {
		if (!templates || templates.length === 0) {
			maxHeightPx = 0;
			return;
		}
		maxHeightPx = Math.max(...templates.map((t) => getPixelDims(t).h));
	});
	
	// Track template loading and 3D model readiness
	$effect(() => {
		if (templates.length > 0) {
			console.log(`📋 TemplateList: ${templates.length} templates loaded, 3D models will be generated...`);
		}
	});
	let selectedTemplate: TemplateData | null = null;
	let notification: string | null = $state(null);
	let hoveredTemplate: string | null = $state(null);
	let showSizeDialog: boolean = $state(false);

	async function deleteTemplate(template: TemplateData) {
		try {
			if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
				return;
			}

			// Create FormData
			const formData = new FormData();
			formData.append('templateId', template.id);

			// Call server action
			const response = await fetch('/templates?/delete', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to delete template');
			}

			// Remove template from list
			templates = templates.filter((t) => t.id !== template.id);
			showNotification('Template deleted successfully');
		} catch (err) {
			console.error('Error deleting template:', err);
			showNotification('Error deleting template');
		}
	}

	async function duplicateTemplate(template: TemplateData) {
		try {
			// Ensure we have all the necessary data from the original template
			if (!template || !template.id) {
				throw new Error('Invalid template data');
			}

			// Create new template data with a new ID
			const newTemplate = {
				...template, // Copy all fields including org_id
				id: crypto.randomUUID(), // New ID
				name: `Copy of ${template.name}`,
				created_at: new Date().toISOString(),
				user_id: template.user_id, // Preserve user_id
				org_id: template.org_id // Explicitly preserve org_id
			};

			console.log('Duplicating template:', {
				originalId: template.id,
				newId: newTemplate.id,
				org_id: newTemplate.org_id
			});

			// Create FormData
			const formData = new FormData();
			formData.append('templateData', JSON.stringify(newTemplate));

			// Call server action
			const response = await fetch('/templates?/create', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to duplicate template');
			}

			const result = await response.json();

			// Add new template to list and show success message
			templates = [result.data, ...templates];
			showNotification('Template duplicated successfully');

			// Instead of reloading, invalidate the data
			await invalidate('app:templates');
		} catch (err) {
			console.error('Error duplicating template:', err);
			showNotification('Error duplicating template');
		}
	}

	function useTemplate(id: string) {
		// Use data-sveltekit-reload="off" to prevent full page reload
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
		e.stopPropagation(); // Prevent the template click event from firing
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

	function handleSizeSelected(event: CustomEvent<{ cardSize: CardSize; templateName: string }>) {
		const { cardSize, templateName } = event.detail;
		showSizeDialog = false;
		onCreateNew?.(cardSize, templateName);
	}

	function handleSizeSelectionCancel() {
		showSizeDialog = false;
	}


</script>

<div class="h-full w-full overflow-y-auto bg-background p-6">
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-2xl font-bold tracking-tight">Templates</h2>
		<Button onclick={handleCreateNew} class="flex items-center gap-2">
			<Plus class="h-4 w-4" />
			Create New Template
		</Button>
	</div>

	{#if templates.length === 0}
		<!-- Empty state for templates -->
		<!-- Use base component to wire into local create flow -->
		<!-- Keeping header button as secondary affordance -->
		<EmptyState
			icon={FileText as any}
			title="No templates yet"
			description="Create your first ID card template to get started with generating professional ID cards."
			action={{ label: 'Create Template', onclick: handleCreateNew }}
		/>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
			{#each templates as template (template.id)}
				<div
					class="group relative"
					role="article"
					aria-label={`Template card for ${template.name}`}
					onmouseenter={() => (hoveredTemplate = template.id)}
					onmouseleave={() => (hoveredTemplate = null)}
				>
					<!-- Uniform Card Container with 4:3 aspect ratio and maximum width -->
						<div class="relative bg-gradient-to-br rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 h-80 sm:h-96 md:h-[25rem] max-w-xs mx-auto">
						<!-- Subtle border glow effect -->
						<div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-sm"></div>
						
						<div class="text-xs text-slate-300/90 absolute top-2 left-2 p-2">
								{formatDims(template, units as Units, dpi)}
							</div>
						<!-- Inner content container -->
						<div class="relative h-full p-4 flex flex-col">
							<!-- Image container - adaptive layout based on orientation -->
							<div class="flex-1 flex items-center justify-center mb-4">
								<div class="rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 w-full flex items-center justify-center">
									<a
										href="/use-template/{template.id}"
										class="block"
										data-sveltekit-preload-data="hover"
										data-sveltekit-noscroll
										data-sveltekit-reload="off"
									>
										<!-- Inner scaled box sized proportionally to template pixel height -->
										<div style={`height: ${PREVIEW_HEIGHT}px; width: 100%; display: flex; align-items: center; justify-content: center;`}>
											<div
												style={`
													width: ${maxHeightPx ? (getPixelDims(template).w / maxHeightPx) * PREVIEW_HEIGHT : PREVIEW_HEIGHT}px;
													height: ${maxHeightPx ? (getPixelDims(template).h / maxHeightPx) * PREVIEW_HEIGHT : PREVIEW_HEIGHT}px;
												`}
												class="relative"
											>
												{#if template.front_background}
													<img src={template.front_background} alt={template.name} class="w-full h-full object-contain" />
												{:else}
													<div class="w-full h-full flex items-center justify-center text-slate-300 text-sm">No preview</div>
												{/if}
											</div>
										</div>
									</a>
								</div>
							</div>

							<!-- Title and type indicator -->
							<div class="space-y-2">
								<!-- Center -->
								<h3 class="text-white font-semibold text-xl line-clamp-2 leading-tight text-center">{template.name}</h3>
						
						
							</div>
						</div>

						<!-- Subtle inner border -->
						<div class="absolute inset-[1px] border border-white/10 rounded-xl pointer-events-none"></div>

						<!-- Action buttons -->
						<div class="absolute right-2 top-2 flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xs rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
							<Button
								variant="ghost"
								size="sm"
								class="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200"
								onclick={(e) => handleActionClick(e, template, 'edit')}
								aria-label={`Edit ${template.name}`}
							>
								<Edit class="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200"
								onclick={(e) => handleActionClick(e, template, 'duplicate')}
								aria-label={`Duplicate ${template.name}`}
							>
								<Copy class="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200"
								onclick={(e) => handleActionClick(e, template, 'delete')}
								aria-label={`Delete ${template.name}`}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
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

{#if notification}
	<div
		class="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg"
		transition:fade
	>
		{notification}
	</div>
{/if}

<style>
</style>
