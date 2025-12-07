<script lang="ts">
	import type { PageData } from './$types';
	import { fade } from 'svelte/transition';
	import { goto, invalidate } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		Copy,
		Trash2,
		Edit,
		Plus,
		FileText,
		Image as ImageIcon,
		MoreVertical,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import IDThumbnailCard from '$lib/components/IDThumbnailCard.svelte';
	import IDPreviewModal from '$lib/components/IDPreviewModal.svelte';
	import SizeSelectionDialog from '$lib/components/SizeSelectionDialog.svelte';
	import DeleteConfirmationDialog from '$lib/components/DeleteConfirmationDialog.svelte';
	import DuplicateTemplateDialog from '$lib/components/DuplicateTemplateDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import type { CardSize } from '$lib/utils/sizeConversion';
	import { recentViewMode } from '$lib/stores/recentViewMode';
	import RecentViewModeToggle from '$lib/components/RecentViewModeToggle.svelte';
	import IDCarousel3D from '$lib/components/IDCarousel3D.svelte';
	import ClientOnly from '$lib/components/ClientOnly.svelte';
	import { Slider } from '$lib/components/ui/slider';

	interface Props {
		data: PageData & { user?: any; templates?: any[] };
	}

	let { data }: Props = $props();

	// Template state - filter out default templates
	let templates = $state(
		(data.templates || []).filter(
			(t: any) =>
				!t.name?.toLowerCase().includes('default') &&
				!t.name?.toLowerCase().includes('sample') &&
				t.name?.trim() !== ''
		)
	);
	let notification: string | null = $state(null);
	let hoveredTemplate: string | null = $state(null);

	// Dialog states
	let showSizeDialog = $state(false);
	let showDeleteDialog = $state(false);
	let showDuplicateDialog = $state(false);
	let templateToDelete: any = $state(null);
	let templateToDuplicate: any = $state(null);

	// View state
	let gridColumns = $state(4); // Default to 4 columns

	// Listen for pinch-to-change-columns events from IDCarousel3D
	function handleColumnsChange(e: Event) {
		const customEvent = e as CustomEvent<{ columns: number }>;
		gridColumns = customEvent.detail.columns;
	}

	onMount(() => {
		document.addEventListener('columnschange', handleColumnsChange);
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('columnschange', handleColumnsChange);
		}
	});

	// ID Preview modal state
	let modalOpen = $state(false);
	interface PreviewCard {
		idcard_id?: number;
		template_name: string;
		front_image?: string | null;
		back_image?: string | null;
		created_at?: string;
		fields?: Record<string, { value: string }>;
	}
	let selectedCards = $state<PreviewCard[]>([]);
	let selectedIndex = $state(0);
	let downloadingCards = $state(new Set<string>());

	// Template dimension helpers
	type Dim = { w: number; h: number };
	function getPixelDims(t: any): Dim {
		if (t?.width_pixels && t?.height_pixels) return { w: t.width_pixels, h: t.height_pixels };
		if (t?.orientation === 'portrait') return { w: 638, h: 1013 };
		return { w: 1013, h: 638 };
	}

	function getElementStyle(el: any, templateW: number, templateH: number) {
		const left = (el.x / templateW) * 100;
		const top = (el.y / templateH) * 100;
		const width = (el.width / templateW) * 100;
		const height = (el.height / templateH) * 100;
		return `left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%;`;
	}

	// Card data helpers
	function getIdNumber(cardData: any) {
		try {
			return cardData?.id_number || 'N/A';
		} catch (e) {
			return 'N/A';
		}
	}

	function getName(cardData: any) {
		try {
			return cardData?.full_name || cardData?.name || 'N/A';
		} catch (e) {
			return 'N/A';
		}
	}

	// Notification helper
	function showNotification(message: string) {
		notification = message;
		setTimeout(() => (notification = null), 3000);
	}

	// Template actions
	function editTemplate(template: any) {
		goto(`/templates?id=${template.id}`);
	}

	function openDuplicateDialog(template: any) {
		templateToDuplicate = template;
		showDuplicateDialog = true;
	}

	async function handleDuplicateConfirm(newName: string) {
		if (!templateToDuplicate) return;

		try {
			const formData = new FormData();
			formData.append('templateId', templateToDuplicate.id);
			formData.append('newName', newName);

			const response = await fetch('/?/duplicate', { method: 'POST', body: formData });
			const result = await response.json();

			if (result.type === 'failure' || result.status >= 400) {
				throw new Error(result.data?.message || 'Failed to duplicate');
			}

			const newTemplate = result.data?.data || result.data;
			if (newTemplate) {
				templates = [newTemplate, ...templates];
			}

			showNotification(`Duplicated "${templateToDuplicate.name}" successfully`);
			await invalidate('app:templates');
		} catch (err) {
			console.error('Error duplicating template:', err);
			showNotification('Error duplicating template');
		} finally {
			templateToDuplicate = null;
		}
	}

	function openDeleteDialog(template: any) {
		templateToDelete = template;
		showDeleteDialog = true;
	}

	async function handleDeleteConfirm(deleteIds: boolean) {
		if (!templateToDelete) return;

		try {
			const formData = new FormData();
			formData.append('templateId', templateToDelete.id);
			formData.append('deleteIds', deleteIds.toString());

			const response = await fetch('/?/delete', { method: 'POST', body: formData });
			if (!response.ok) throw new Error('Failed to delete template');

			templates = templates.filter((t: any) => t.id !== templateToDelete!.id);
			showNotification('Template deleted successfully');
		} catch (err) {
			console.error('Error deleting template:', err);
			showNotification('Error deleting template');
		} finally {
			templateToDelete = null;
		}
	}

	// Create new template
	function handleCreateNew() {
		showSizeDialog = true;
	}

	function handleSizeSelected(event: CustomEvent<{ cardSize: CardSize; templateName: string }>) {
		const { cardSize, templateName } = event.detail;
		showSizeDialog = false;
		// Navigate to templates page with the new template params
		const params = new URLSearchParams({
			new: 'true',
			name: templateName,
			width: cardSize.width.toString(),
			height: cardSize.height.toString(),
			unit: cardSize.unit
		});
		goto(`/templates?${params.toString()}`);
	}

	// ID Card preview functions
	function transformRecentCards(cards: any[]) {
		return cards.map((card) => ({
			idcard_id: card.id,
			template_name: card.template_name || 'Unknown Template',
			front_image: card.front_image,
			back_image: card.back_image,
			created_at: card.created_at,
			fields: {
				Name: { value: getName(card.data) },
				ID: { value: getIdNumber(card.data) }
			}
		}));
	}

	function openSinglePreview(card: PreviewCard) {
		const cardIndex = transformedCards.findIndex((c) => c.idcard_id === card.idcard_id);
		selectedCards = transformedCards;
		selectedIndex = cardIndex >= 0 ? cardIndex : 0;
		modalOpen = true;
	}

	function closePreview() {
		modalOpen = false;
		selectedCards = [];
		selectedIndex = 0;
	}

	async function downloadCard(card: any) {
		const cardId = card.id?.toString();
		if (!cardId) return;

		downloadingCards.add(cardId);
		downloadingCards = downloadingCards;

		try {
			console.log('Downloading card:', cardId);
		} catch (error) {
			console.error('Download failed:', error);
		} finally {
			downloadingCards.delete(cardId);
			downloadingCards = downloadingCards;
		}
	}

	function editCard(card: any) {
		window.location.href = `/templates?edit=${card.id}`;
	}

	const transformedCards = transformRecentCards(data.recentCards || []);
</script>

<div class="container mx-auto px-4 py-6 space-y-8">
	<!-- Hero Section: Templates -->
	<section class="space-y-6">
		{#if templates.length === 0}
			<!-- Empty State -->
			<div class="flex justify-center py-12">
				<EmptyState
					icon={FileText}
					title="No templates yet"
					description="Create your first ID card template to get started."
					action={{ label: 'Create Template', onclick: handleCreateNew }}
				/>
			</div>
		{:else}
			<!-- Templates Grid -->
			<div
				class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6"
			>
				{#each templates as template (template.id)}
					{@const dims = getPixelDims(template)}
					<div
						class="group relative flex flex-col bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50 overflow-hidden h-full"
						role="article"
						aria-label={`Template card for ${template.name}`}
						onmouseenter={() => (hoveredTemplate = template.id)}
						onmouseleave={() => (hoveredTemplate = null)}
					>
						<!-- Preview Container -->
						<div
							class="relative w-full pt-2 px-2 sm:pt-4 sm:px-4 flex-1 flex items-center justify-center bg-muted/30"
						>
							<a
								href="/use-template/{template.id}"
								class="relative w-full flex items-center justify-center"
								style="height: 120px;"
							>
								<div
									class="relative shadow-md rounded-lg overflow-hidden bg-white transition-transform duration-300 group-hover:scale-105"
									style="aspect-ratio: {dims.w} / {dims.h}; width: 100%; max-height: 100%; container-type: size;"
								>
									<!-- Background Image -->
									{#if template.front_background}
										<img
											src={template.front_background.startsWith('http')
												? template.front_background
												: getSupabaseStorageUrl(template.front_background)}
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

									<!-- Elements Overlay -->
									{#if template.template_elements && template.template_elements.length > 0}
										<div class="absolute inset-0 pointer-events-none overflow-hidden">
											{#each template.template_elements.filter((el: any) => el.side === 'front') as el}
												<div
													class="absolute flex items-center overflow-hidden border border-dashed leading-none select-none"
													class:justify-center={!el.alignment || el.alignment === 'center'}
													class:justify-start={el.alignment === 'left'}
													class:justify-end={el.alignment === 'right'}
													style="{getElementStyle(el, dims.w, dims.h)};
														background-color: {el.type === 'photo' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0)'};
														border-color: rgba(0,0,0,0.1);"
												>
													{#if el.type === 'photo'}
														<ImageIcon class="w-3 h-3 text-blue-500/50" />
													{:else if el.type === 'text' || el.type === 'selection'}
														<span
															class="truncate px-0.5 block"
															style="
															width: 100%;
															color: {el.color ?? '#000000'};
															font-family: {el.fontFamily ?? 'Arial'}, sans-serif;
															font-weight: {el.fontWeight ?? 'normal'};
															font-style: {el.fontStyle ?? 'normal'};
															text-decoration: {el.textDecoration ?? 'none'};
															text-align: {el.alignment ?? 'left'};
															line-height: {el.lineHeight ?? '1.2'};
															font-size: {((el.size ?? 16) / dims.w) * 100}cqw;
														"
														>
															{el.content || el.variableName || 'Text'}
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
								</div>
							</a>
						</div>

						<!-- Footer Info -->
						<div class="p-2 sm:p-4 border-t border-border bg-card z-10">
							<h3
								class="font-semibold text-foreground truncate text-xs sm:text-base"
								title={template.name}
							>
								{template.name}
							</h3>
						</div>

						<!-- 3-Dot Menu (Top Right) - Always visible on mobile -->
						<div class="absolute top-1 right-1 sm:top-2 sm:right-2 z-20">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 sm:h-8 sm:w-8 bg-background/90 backdrop-blur-sm border border-border shadow-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
									>
										<MoreVertical class="h-4 w-4" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Item onSelect={() => editTemplate(template)}>
										<Edit class="mr-2 h-4 w-4" />
										<span>Edit</span>
									</DropdownMenu.Item>
									<DropdownMenu.Item onSelect={() => openDuplicateDialog(template)}>
										<Copy class="mr-2 h-4 w-4" />
										<span>Duplicate</span>
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item
										class="text-destructive focus:text-destructive"
										onSelect={() => openDeleteDialog(template)}
									>
										<Trash2 class="mr-2 h-4 w-4" />
										<span>Delete</span>
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Create New Template Button -->
		<div class="flex justify-center pt-4">
			<Button onclick={handleCreateNew} size="lg" class="gap-2">
				<Plus class="h-5 w-5" />
				Create New Template
			</Button>
		</div>
	</section>

	<!-- Horizontal Divider -->
	<hr class="border-border" />

	<!-- Recent Section -->
	<section class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold text-foreground">Recent</h2>
			{#if transformedCards.length > 0}
				<RecentViewModeToggle />
			{/if}
		</div>

		{#if $recentViewMode === 'grid'}
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground whitespace-nowrap">Columns: {gridColumns}</span>
			<Slider
					type="multiple"
					value={[gridColumns]}
					min={3}
					max={7}
					step={1}
					onValueChange={(v: number[]) => (gridColumns = v[0])}
					class="w-32"
				/>
			</div>
		{/if}

		{#if data.error}
			<Card class="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
				<CardContent class="p-6">
					<div class="flex items-center gap-3">
						<svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="text-red-700 dark:text-red-300">
							Error loading recent activity. Please try again later.
						</p>
					</div>
				</CardContent>
			</Card>
		{:else if transformedCards.length > 0}
			<div class="space-y-4">

			<!-- Carousel View (3D) - Always mounted to preserve texture cache -->
				<div class={$recentViewMode === 'list' ? 'invisible absolute -z-50 pointer-events-none' : ''}>
					<ClientOnly>
						<IDCarousel3D
							cards={transformedCards}
							viewMode={$recentViewMode === 'grid' ? 'grid' : 'carousel'}
							columns={gridColumns}
							onCardClick={(card) => openSinglePreview(card)}
						/>
					</ClientOnly>
				</div>

				<!-- Grid View - NOW HANDLED BY 3D COMPONENT -->

				<!-- List View -->
				{#if $recentViewMode === 'list'}
					<div class="space-y-3">
						{#each transformedCards.slice(0, 10) as card}
							<button
								type="button"
								class="w-full flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:shadow-md hover:border-primary/50 transition-all cursor-pointer text-left"
								onclick={() => openSinglePreview(card)}
							>
								<div class="flex-none w-20 h-14 rounded-md overflow-hidden bg-muted">
									{#if card.front_image}
										<img
											src={getSupabaseStorageUrl(card.front_image, 'rendered-id-cards')}
											alt="ID Preview"
											class="w-full h-full object-cover"
											loading="lazy"
										/>
									{:else}
										<div
											class="w-full h-full flex items-center justify-center text-muted-foreground"
										>
											<ImageIcon class="w-6 h-6" />
										</div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p class="font-medium text-foreground truncate">{card.template_name}</p>
									{#if card.created_at}
										<p class="text-xs text-muted-foreground">
											{new Date(card.created_at).toLocaleDateString()}
										</p>
									{/if}
								</div>
								<ChevronRight class="flex-none w-5 h-5 text-muted-foreground" />
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<Card>
				<CardContent class="p-12 text-center">
					<div
						class="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
					>
						<svg
							class="h-10 w-10 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"
							/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-foreground mb-3">No ID Cards Yet</h3>
					<p class="text-muted-foreground mb-6 max-w-md mx-auto">
						Get started by creating your first ID card. Choose from your templates and customize
						them to your needs.
					</p>
					{#if templates.length > 0}
						<Button href={`/use-template/${templates[0].id}`} size="lg">
							<Plus class="w-4 h-4 mr-2" />
							Create Your First ID
						</Button>
					{/if}
				</CardContent>
			</Card>
		{/if}
	</section>
</div>

<!-- Dialogs -->
<SizeSelectionDialog
	bind:open={showSizeDialog}
	on:sizeSelected={handleSizeSelected}
	on:cancel={() => (showSizeDialog = false)}
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

{#if templateToDuplicate}
	<DuplicateTemplateDialog
		bind:open={showDuplicateDialog}
		templateName={templateToDuplicate.name}
		onConfirm={handleDuplicateConfirm}
		onCancel={() => {
			showDuplicateDialog = false;
			templateToDuplicate = null;
		}}
	/>
{/if}

<!-- ID Preview Modal -->
{#if modalOpen}
	<IDPreviewModal
		open={modalOpen}
		cards={selectedCards}
		initialIndex={selectedIndex}
		mode="simple"
		onClose={closePreview}
		onDownload={downloadCard}
		onEdit={editCard}
	/>
{/if}

<!-- Notification Toast -->
{#if notification}
	<div
		class="fixed bottom-4 right-4 z-50 rounded-lg bg-foreground text-background px-4 py-2 shadow-lg"
		transition:fade
	>
		{notification}
	</div>
{/if}

<style>
	:global(.dark) {
		color-scheme: dark;
	}
</style>
