<script lang="ts">
	import type { HeaderRow, DataRow } from '$lib/types';
	import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
	import ClientOnly from '$lib/components/ClientOnly.svelte';
	import { browser } from '$app/environment';
	import { onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import JSZip from 'jszip';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import { createCardFromInches, createRoundedRectCard } from '$lib/utils/cardGeometry';
	import ViewModeToggle from '$lib/components/ViewModeToggle.svelte';
	import { viewMode } from '$lib/stores/viewMode';
	import SimpleIDCard from '$lib/components/SimpleIDCard.svelte';
	import EmptyIDs from '$lib/components/empty-states/EmptyIDs.svelte';
	import IDCardSkeleton from '$lib/components/IDCardSkeleton.svelte';
	import AllIdsPageSkeleton from '$lib/components/skeletons/AllIdsPageSkeleton.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { goto, invalidateAll } from '$app/navigation';
	import DeleteConfirmationDialog from '$lib/components/DeleteConfirmationDialog.svelte';
	import { Loader2, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Grid, List as ListIcon, Trash2, Download } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { getPreloadState } from '$lib/services/preloadService';

	import type { PageData } from './$types';
	import type { IDCard } from './+page.server';

	let { data } = $props();
	const { idCards, metadata, templateDimensions } = data;

	// Smart Loading State
	const preloadState = getPreloadState('/all-ids');
	let isStructureReady = $derived($preloadState?.skeleton === 'ready');
	
	let isLoading = $state(true);
	let isNavigating = $state(false);

	// Reset loading state when data changes (navigation complete)
	$effect(() => {
		if (data) {
			isLoading = false;
			isNavigating = false;
		}
	});
	
	onMount(() => {
		// Small delay to ensure smooth transition from skeleton to content
		requestAnimationFrame(() => {
			isLoading = false;
		});
	});

	console.log('Id cards', idCards);

	// 3D card geometries - loaded on-demand when preview is opened (not on page load)
	const templateGeometries = $state<Record<string, any>>({});

	// Lazy load geometry only when needed (when opening preview modal)
	async function loadGeometryForTemplate(templateName: string) {
		// Skip if already loaded or no dimensions available
		if (templateGeometries[templateName] || !templateDimensions[templateName]) {
			return templateGeometries[templateName];
		}

		const dimensions = templateDimensions[templateName];
		console.log(`Lazy loading 3D geometry for template "${templateName}":`, dimensions);

		try {
			let geometry;
			if (dimensions.unit === 'inches') {
				geometry = await createCardFromInches(dimensions.width, dimensions.height);
			} else {
				const widthInches = dimensions.width / 300;
				const heightInches = dimensions.height / 300;
				geometry = await createCardFromInches(widthInches, heightInches);
			}
			templateGeometries[templateName] = geometry;
			console.log(`Loaded geometry for template "${templateName}"`);
			return geometry;
		} catch (error) {
			console.error(`Failed to load geometry for template "${templateName}":`, error);
			return null;
		}
	}

	let searchQuery = $state('');
	let dataRows = $state(idCards);
	let errorMessage = '';
	let selectedFrontImage: string | null = $state(null);
	let selectedBackImage: string | null = $state(null);
	let selectedTemplateDimensions: { width: number; height: number; unit?: string } | null =
		$state(null);
	let selectedCardGeometry: any = $state(null);
	let downloadingCards = $state(new Set<string>());
	let deletingCards = $state(new Set<string>());
	let selectedCards = $state(new Set<string>());
	let selectedCount = $derived(selectedCards.size);

	// Inline editing state
	let editingCell: { cardId: string; fieldName: string } | null = $state(null);
	let editValue = $state('');
	let savingCell = $state(false);

	// Bulk download state
	let isBulkDownloading = $state(false);
	let bulkDownloadProgress = $state({ current: 0, total: 0 });

	// Create a map to store each group's selection state
	let groupSelectionStates = $state(new Map<string, boolean>());

	$effect(() => {
		const states = new Map<string, boolean>();
		Object.entries(groupedCards).forEach(([templateName, cards]) => {
			states.set(
				templateName,
				cards.every((card) => selectedCards.has(getCardId(card)))
			);
		});
		groupSelectionStates = states;
	});

	function handleCheckboxClick(event: Event, card: IDCard) {
		event.stopPropagation();
		const cardId = getCardId(card);
		if (!cardId) return;

		const newSelectedCards = new Set(selectedCards);
		if (newSelectedCards.has(cardId)) {
			newSelectedCards.delete(cardId);
		} else {
			newSelectedCards.add(cardId);
		}
		selectedCards = newSelectedCards;
	}

	function handleGroupCheckboxClick(event: Event, cards: IDCard[]) {
		event.stopPropagation();
		const validCards = cards.filter((card) => {
			const cardId = getCardId(card);
			return !!cardId;
		});

		const allSelected = validCards.every((card) => selectedCards.has(getCardId(card)));
		const newSelectedCards = new Set(selectedCards);

		validCards.forEach((card) => {
			const cardId = getCardId(card);
			if (allSelected) {
				newSelectedCards.delete(cardId);
			} else {
				newSelectedCards.add(cardId);
			}
		});

		selectedCards = newSelectedCards;
	}

	type SelectionState = {
		isSelected: (cardId: string) => boolean;
		isGroupSelected: (cards: IDCard[]) => boolean;
		toggleSelection: (cardId: string) => void;
		toggleGroupSelection: (cards: IDCard[]) => void;
		getSelectedCount: () => number;
		clearSelection: () => void;
	};

	let isSelected = (cardId: string) => selectedCards.has(cardId);
	let isGroupSelected = (cards: IDCard[]) => {
		return cards.every((card) => {
			const cardId = getCardId(card);
			return cardId && selectedCards.has(cardId);
		});
	};

	const selectionManager: SelectionState = {
		isSelected,
		isGroupSelected,
		toggleSelection: (cardId: string) => {
			if (!cardId) return;

			const newSelectedCards = new Set(selectedCards);
			if (newSelectedCards.has(cardId)) {
				newSelectedCards.delete(cardId);
			} else {
				newSelectedCards.add(cardId);
			}
			selectedCards = newSelectedCards;
		},
		toggleGroupSelection: (cards: IDCard[]) => {
			const validCards = cards.filter((card) => {
				const cardId = getCardId(card);
				return !!cardId;
			});

			const allSelected = validCards.every((card) => selectedCards.has(getCardId(card)));
			const newSelectedCards = new Set(selectedCards);

			validCards.forEach((card) => {
				const cardId = getCardId(card);
				if (allSelected) {
					newSelectedCards.delete(cardId);
				} else {
					newSelectedCards.add(cardId);
				}
			});

			selectedCards = newSelectedCards;
		},
		getSelectedCount: () => selectedCards.size,
		clearSelection: () => {
			selectedCards = new Set();
		}
	};

	function getCardId(card: IDCard): string {
		const id = card.idcard_id?.toString();
		if (!id) return '';
		return id;
	}

	function getAllSelectedCards() {
		return dataRows.filter((card) => selectionManager.isSelected(getCardId(card)));
	}

	async function openPreview(event: MouseEvent, card: IDCard) {
		// Don't open preview if clicking on a checkbox, button, or their containers
		const target = event.target as HTMLElement;
		if (target.closest('input[type="checkbox"]') || target.closest('button')) {
			return;
		}

		console.log('Front image', card.front_image);
		console.log('Back image', card.back_image);
		selectedFrontImage = card.front_image ?? null;
		selectedBackImage = card.back_image ?? null;

		// Get template dimensions
		selectedTemplateDimensions = templateDimensions[card.template_name] || null;
		
		// Lazy load 3D geometry only when preview is opened (not on page load)
		selectedCardGeometry = await loadGeometryForTemplate(card.template_name);
		
		console.log('Template preview data for', card.template_name, ':', {
			dimensions: selectedTemplateDimensions,
			hasGeometry: !!selectedCardGeometry
		});
	}

	function closePreview() {
		selectedFrontImage = null;
		selectedBackImage = null;
		selectedTemplateDimensions = null;
		selectedCardGeometry = null;
	}

	async function downloadCard(card: IDCard) {
		const cardId = getCardId(card);
		console.log('Starting download for card:', {
			cardId,
			frontImage: card.front_image,
			backImage: card.back_image
		});

		downloadingCards.add(cardId);
		downloadingCards = downloadingCards;

		try {
			const zip = new JSZip();

			const nameField =
				card.fields?.['Name']?.value ||
				card.fields?.['name']?.value ||
				card.fields?.['Full Name']?.value ||
				`id-${cardId}`;

			console.log('Creating folder for:', { nameField });
			const folder = zip.folder(nameField);
			if (!folder) throw new Error('Failed to create folder');

			if (card.front_image) {
				const frontImageUrl = getSupabaseStorageUrl(card.front_image, 'rendered-id-cards');
				console.log('Downloading front image:', { frontImageUrl });

				if (frontImageUrl) {
					try {
						const frontResponse = await fetch(frontImageUrl);
						console.log('Front image response:', {
							status: frontResponse.status,
							ok: frontResponse.ok,
							contentType: frontResponse.headers.get('content-type')
						});

						if (!frontResponse.ok) {
							throw new Error(
								`Failed to download front image: ${frontResponse.status} ${frontResponse.statusText}`
							);
						}
						const frontBlob = await frontResponse.blob();
						folder.file(`${nameField}_front.jpg`, frontBlob);
						console.log('Front image downloaded successfully');
					} catch (frontError) {
						console.error('Error downloading front image:', frontError);
						throw frontError;
					}
				}
			}

			if (card.back_image) {
				const backImageUrl = getSupabaseStorageUrl(card.back_image, 'rendered-id-cards');
				console.log('Downloading back image:', { backImageUrl });

				if (backImageUrl) {
					try {
						const backResponse = await fetch(backImageUrl);
						console.log('Back image response:', {
							status: backResponse.status,
							ok: backResponse.ok,
							contentType: backResponse.headers.get('content-type')
						});

						if (!backResponse.ok) {
							throw new Error(
								`Failed to download back image: ${backResponse.status} ${backResponse.statusText}`
							);
						}
						const backBlob = await backResponse.blob();
						folder.file(`${nameField}_back.jpg`, backBlob);
						console.log('Back image downloaded successfully');
					} catch (backError) {
						console.error('Error downloading back image:', backError);
						throw backError;
					}
				}
			}

			console.log('Generating zip file...');
			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${nameField}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			console.log('Download completed successfully');
		} catch (error) {
			console.error('Error downloading ID card:', error);
			errorMessage = `Failed to download ID card: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			downloadingCards.delete(cardId);
			downloadingCards = downloadingCards;
		}
	}

	async function downloadSelectedCards() {
		const selectedRows = getAllSelectedCards();
		if (selectedRows.length === 0) return;

		isBulkDownloading = true;
		bulkDownloadProgress = { current: 0, total: selectedRows.length };

		try {
			const zip = new JSZip();
			const nameCount = new Map<string, number>();

			// First pass: count all names
			selectedRows.forEach((card) => {
				let baseName =
					card.fields?.['Name']?.value ||
					card.fields?.['name']?.value ||
					card.fields?.['Full Name']?.value ||
					`id-${getCardId(card)}`;
				baseName = baseName.replace(/[^a-zA-Z0-9-_() ]/g, '');
				nameCount.set(baseName, (nameCount.get(baseName) || 0) + 1);
			});

			// Second pass: create folders with proper numbering
			const usedNames = new Map<string, number>();

			for (const card of selectedRows) {
				const cardId = getCardId(card);
				downloadingCards.add(cardId);
				downloadingCards = downloadingCards;

				try {
					let baseName =
						card.fields?.['Name']?.value ||
						card.fields?.['name']?.value ||
						card.fields?.['Full Name']?.value ||
						`id-${cardId}`;

					// Clean the name field to avoid invalid characters
					baseName = baseName.replace(/[^a-zA-Z0-9-_() ]/g, '');

					// Get current count for this name
					const currentCount = usedNames.get(baseName) || 0;
					const totalCount = nameCount.get(baseName) || 1;

					// Generate unique name
					let nameField = baseName;
					if (totalCount > 1) {
						nameField = `${baseName} (${currentCount + 1})`;
					}
					usedNames.set(baseName, currentCount + 1);

					// Create folder for each card
					const folder = zip.folder(nameField);
					if (!folder) {
						console.error(`Failed to create folder for ${nameField}`);
						continue;
					}

					// Download front image
					if (card.front_image) {
						const frontImageUrl = getSupabaseStorageUrl(card.front_image, 'rendered-id-cards');
						if (frontImageUrl) {
							const frontResponse = await fetch(frontImageUrl);
							if (!frontResponse.ok) {
								console.error(`Failed to download front image for ${nameField}`);
							} else {
								const frontBlob = await frontResponse.blob();
								// Detect extension from MIME type
								const frontExt =
									frontBlob.type === 'image/png'
										? 'png'
										: frontBlob.type === 'image/jpeg'
											? 'jpg'
											: frontBlob.type === 'image/webp'
												? 'webp'
												: 'png';
								folder.file(`${nameField}_front.${frontExt}`, frontBlob);
							}
						}
					}

					// Download back image
					if (card.back_image) {
						const backImageUrl = getSupabaseStorageUrl(card.back_image, 'rendered-id-cards');
						if (backImageUrl) {
							const backResponse = await fetch(backImageUrl);
							if (!backResponse.ok) {
								console.error(`Failed to download back image for ${nameField}`);
							} else {
								const backBlob = await backResponse.blob();
								// Detect extension from MIME type
								const backExt =
									backBlob.type === 'image/png'
										? 'png'
										: backBlob.type === 'image/jpeg'
											? 'jpg'
											: backBlob.type === 'image/webp'
												? 'webp'
												: 'png';
								folder.file(`${nameField}_back.${backExt}`, backBlob);
							}
						}
					}
				} catch (cardError) {
					console.error(`Error processing card ${cardId}:`, cardError);
				} finally {
					downloadingCards.delete(cardId);
					downloadingCards = downloadingCards;
					bulkDownloadProgress.current++;
					bulkDownloadProgress = bulkDownloadProgress;
				}
			}

			// Generate and download the zip file
			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `id-cards-${new Date().toISOString().split('T')[0]}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			// Clear selection after successful download
			selectedCards.clear();
			selectedCards = new Set();
		} catch (error) {
			console.error('Error downloading ID cards:', error);
			errorMessage = 'Failed to download ID cards';
		} finally {
			isBulkDownloading = false;
			bulkDownloadProgress = { current: 0, total: 0 };
		}
	}

	async function handleDelete(card: IDCard) {
		const cardId = getCardId(card);
		if (!cardId) return;

		deletingCards.add(cardId);
		deletingCards = deletingCards;

		try {
			const formData = new FormData();
			formData.append('cardId', cardId);

			const response = await fetch('?/deleteCard', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to delete ID card');
			}

			dataRows = dataRows.filter((row) => getCardId(row) !== cardId);
			selectedCards.delete(cardId);
			selectedCards = new Set(selectedCards);
		} catch (error) {
			console.error('Error deleting ID card:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to delete ID card';
		} finally {
			deletingCards.delete(cardId);
			deletingCards = deletingCards;
		}
	}

	async function deleteSelectedCards() {
		const selectedRows = getAllSelectedCards();
		if (selectedRows.length === 0) return;

		if (
			!confirm(
				`Are you sure you want to delete ${selectedRows.length} ID card${selectedRows.length > 1 ? 's' : ''}?`
			)
		) {
			return;
		}

		try {
			const cardIds = selectedRows.map((card) => getCardId(card)).filter(Boolean);

			// Mark all cards as deleting
			cardIds.forEach((id) => {
				deletingCards.add(id);
			});
			deletingCards = deletingCards;

			const formData = new FormData();
			formData.append('cardIds', JSON.stringify(cardIds));

			const response = await fetch('?/deleteMultiple', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to delete ID cards');
			}

			// Refresh the data after deletion
			window.location.reload();
		} catch (error) {
			console.error('Error deleting ID cards:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to delete ID cards';
		} finally {
			// Clear deleting states
			deletingCards = new Set();
		}
	}

	// Inline editing functions
	function startEditing(cardId: string, fieldName: string, currentValue: string) {
		editingCell = { cardId, fieldName };
		editValue = currentValue || '';
		// Focus the input after render
		setTimeout(() => {
			const input = document.getElementById(`edit-${cardId}-${fieldName}`);
			if (input) {
				(input as HTMLInputElement).focus();
				(input as HTMLInputElement).select();
			}
		}, 0);
	}

	function cancelEditing() {
		editingCell = null;
		editValue = '';
	}

	async function saveEdit() {
		if (!editingCell || savingCell) return;

		const { cardId, fieldName } = editingCell;
		savingCell = true;

		try {
			const formData = new FormData();
			formData.append('cardId', cardId);
			formData.append('fieldName', fieldName);
			formData.append('fieldValue', editValue);

			const response = await fetch('?/updateField', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.type !== 'failure') {
				// Update local state
				dataRows = dataRows.map((card) => {
					if (getCardId(card) === cardId) {
						return {
							...card,
							fields: {
								...card.fields,
								[fieldName]: { value: editValue, side: 'front' as const }
							}
						};
					}
					return card;
				});
			} else {
				console.error('Failed to save edit:', result);
				errorMessage = result.data?.error || 'Failed to save';
			}
		} catch (error) {
			console.error('Error saving edit:', error);
			errorMessage = 'Failed to save';
		} finally {
			savingCell = false;
			editingCell = null;
			editValue = '';
		}
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveEdit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelEditing();
		}
	}

	let templateFields = $derived(metadata?.templates || {});

	let groupedCards = $derived(
		(() => {
			const groups: Record<string, IDCard[]> = {};
			dataRows.forEach((card) => {
				const templateName = card.template_name || 'Unassigned';
				if (!groups[templateName]) {
					groups[templateName] = [];
				}
				groups[templateName].push(card);
			});
			return groups;
		})()
	);

	// Card zoom control
	let cardMinWidth = $state(250); // Default min width
	const MIN_WIDTH = 150;
	const MAX_WIDTH = 450;
	const STEP = 25;

	function zoomOut() {
		cardMinWidth = Math.max(MIN_WIDTH, cardMinWidth - STEP);
	}
	function zoomIn() {
		cardMinWidth = Math.min(MAX_WIDTH, cardMinWidth + STEP);
	}
</script>

{#if isLoading && !isStructureReady}
	<AllIdsPageSkeleton />
{:else}
	<div class="h-full flex flex-col overflow-hidden" in:fade={{ duration: 200 }}>
		<div class="container mx-auto px-4 py-4 flex-1 flex flex-col min-h-0 max-w-7xl">

	<!-- Controls Header -->
	<div
		class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card border border-border p-4 rounded-xl shadow-sm"
	>
		<!-- Search -->
		<div class="relative w-full md:max-w-sm">
			<input
				type="text"
				placeholder="Search cards..."
				class="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
				bind:value={searchQuery}
			/>
			<svg
				class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/></svg
			>
		</div>

		<!-- Actions & Toggles -->
		<div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
			{#if selectedCount > 0}
				<div class="flex gap-2">
					<button
						class="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						onclick={downloadSelectedCards}
						disabled={isBulkDownloading}
					>
						{#if isBulkDownloading}
							<svg
								class="animate-spin h-3 w-3"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Downloading {bulkDownloadProgress.current}/{bulkDownloadProgress.total}...
						{:else}
							Download ({selectedCount})
						{/if}
					</button>
					<button
						class="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:bg-destructive/90 transition-colors shadow-sm"
						onclick={deleteSelectedCards}
					>
						Delete ({selectedCount})
					</button>
				</div>
			{/if}

			<div class="flex items-center gap-2 ml-auto border-l border-border pl-3">
				{#if $viewMode !== 'table'}
					<!-- Mobile-friendly Zoom Controls -->
					<div class="flex items-center bg-muted rounded-lg p-0.5">
						<button
							class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground"
							onclick={zoomOut}>−</button
						>
						<button
							class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground"
							onclick={zoomIn}>+</button
						>
					</div>
				{/if}
				<ViewModeToggle />
			</div>
		</div>
	</div>

	<!-- Content Area -->
	{#if isLoading}
		<!-- Skeleton Loading State -->
		<div class="space-y-6">
			<div class="flex items-center gap-2">
				<div class="h-6 w-1 bg-muted rounded-full animate-pulse"></div>
				<div class="h-5 w-32 bg-muted rounded animate-pulse"></div>
				<div class="h-5 w-16 bg-muted rounded-full animate-pulse ml-auto"></div>
			</div>
			<IDCardSkeleton count={8} minWidth={cardMinWidth} />
		</div>
	{:else if dataRows.length === 0}
		<EmptyIDs />
	{:else if $viewMode === 'table'}
		<!-- Table View -->
		<div class="space-y-8">
			{#each Object.entries(groupedCards) as [templateName, cards]}
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
							<div class="h-6 w-1 bg-primary rounded-full"></div>
							{templateName}
						</h3>
						<span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
							>{cards.length} items</span
						>
					</div>

					<div
						class="relative w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm"
					>
						<table class="w-full text-sm text-left">
							<thead
								class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border"
							>
								<tr>
									<th class="w-10 px-4 py-3">
										<input
											type="checkbox"
											class="rounded border-muted-foreground"
											checked={groupSelectionStates.get(templateName)}
											onchange={(e) => handleGroupCheckboxClick(e, cards)}
										/>
									</th>
									<th class="px-4 py-3 font-medium">Preview</th>
									{#if templateFields[templateName]}
										{#each templateFields[templateName] || [] as field}
											<th class="px-4 py-3 font-medium whitespace-nowrap">{field.variableName}</th>
										{/each}
									{/if}
									<th class="px-4 py-3 font-medium text-right">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each cards as card}
									<tr class="hover:bg-muted/30 transition-colors group">
										<td class="px-4 py-3">
											<input
												type="checkbox"
												class="rounded border-muted-foreground"
												checked={selectionManager.isSelected(getCardId(card))}
												onchange={(e) => handleCheckboxClick(e, card)}
											/>
										</td>
										<td class="px-4 py-2 w-24" onclick={(e) => openPreview(e, card)}>
											<div
												class="h-10 w-16 bg-muted rounded overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors"
											>
												{#if card.front_image}
													<img
														src={getSupabaseStorageUrl(card.front_image, 'rendered-id-cards')}
														alt="Thumb"
														class="w-full h-full object-cover"
														loading="lazy"
													/>
												{/if}
											</div>
										</td>
										{#if templateFields[templateName]}
											{#each templateFields[templateName] || [] as field}
												<td
													class="px-4 py-3 whitespace-nowrap text-foreground cursor-pointer hover:bg-muted/50"
													ondblclick={() =>
														startEditing(
															getCardId(card),
															field.variableName,
															card.fields?.[field.variableName]?.value || ''
														)}
													title="Double-click to edit"
												>
													{#if editingCell?.cardId === getCardId(card) && editingCell?.fieldName === field.variableName}
														<input
															id="edit-{getCardId(card)}-{field.variableName}"
															type="text"
															bind:value={editValue}
															onkeydown={handleEditKeydown}
															onblur={saveEdit}
															class="w-full px-2 py-1 text-sm border border-primary rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
															disabled={savingCell}
														/>
													{:else}
														{card.fields?.[field.variableName]?.value || '-'}
													{/if}
												</td>
											{/each}
										{/if}
										<td class="px-4 py-3 text-right">
											<div
												class="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<button
													class="p-1.5 hover:bg-muted rounded text-blue-500"
													onclick={() => downloadCard(card)}
													title="Download"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
														/></svg
													>
												</button>
												<button
													class="p-1.5 hover:bg-muted rounded text-red-500"
													onclick={() => handleDelete(card)}
													title="Delete"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/></svg
													>
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Responsive Grid View -->
		<!-- Using CSS Variables for dynamic Grid sizing -->
		<div class="space-y-10" style="--card-min-width: {cardMinWidth}px;">
			{#each Object.entries(groupedCards) as [templateName, cards]}
				<div class="space-y-4">
					<div class="flex items-center gap-3 border-b border-border pb-2">
						<h3 class="text-lg font-semibold text-foreground">{templateName}</h3>
						<span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
							>{cards.length}</span
						>
					</div>

					<div class="responsive-grid">
						{#each cards as card}
							<div class="card-wrapper">
								<SimpleIDCard
									{card}
									isSelected={selectionManager.isSelected(getCardId(card))}
									onToggleSelect={() => selectionManager.toggleSelection(getCardId(card))}
									onDownload={downloadCard}
									onDelete={handleDelete}
									onOpenPreview={openPreview}
									deleting={deletingCards.has(getCardId(card))}
									downloading={downloadingCards.has(getCardId(card))}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
	</div>
</div>
{/if}

<!-- Keep modals same as before -->
{#if selectedFrontImage || selectedBackImage}
	<ClientOnly>
		<ImagePreviewModal
			frontImageUrl={selectedFrontImage
				? getSupabaseStorageUrl(selectedFrontImage, 'rendered-id-cards')
				: null}
			backImageUrl={selectedBackImage
				? getSupabaseStorageUrl(selectedBackImage, 'rendered-id-cards')
				: null}
			cardGeometry={selectedCardGeometry}
			templateDimensions={selectedTemplateDimensions}
			onClose={closePreview}
		/>
	</ClientOnly>
{/if}

<style>
	/* Responsive Grid Logic */
	.responsive-grid {
		display: grid;
		/* Fluid grid: columns fill space, min width controlled by JS variable, max 1fr */
		grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
		gap: 1rem;
		width: 100%;
	}

	/* Ensure cards don't get too squashed on tiny screens */
	@media (max-width: 480px) {
		.responsive-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		}
	}

	/* Aspect Ratio wrapper for the grid item */
	.card-wrapper {
		height: auto;
		width: 100%;
		/* Ensure it stretches to fill the grid cell */
		display: flex;
		flex-direction: column;
	}
</style>
