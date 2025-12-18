<script lang="ts">
	import type { PageData } from './$types';
	import { fade, fly, scale } from 'svelte/transition';
	import { goto, invalidate } from '$app/navigation';
	import { onMount, onDestroy, untrack } from 'svelte';
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
		ChevronRight,
		ChevronDown,
		Settings2
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import IDThumbnailCard from '$lib/components/IDThumbnailCard.svelte';
	import IDPreviewModal from '$lib/components/IDPreviewModal.svelte';
	import SizeSelectionDialog from '$lib/components/SizeSelectionDialog.svelte';
	import DeleteConfirmationDialog from '$lib/components/DeleteConfirmationDialog.svelte';
	import DuplicateTemplateDialog from '$lib/components/DuplicateTemplateDialog.svelte';
	import { getPreloadState } from '$lib/services/preloadService';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { getSupabaseStorageUrl } from '$lib/utils/storage';
	import type { CardSize } from '$lib/utils/sizeConversion';
	import type { TemplateAsset } from '$lib/schemas/template-assets.schema';
	import { recentViewMode } from '$lib/stores/recentViewMode';
	import RecentViewModeToggle from '$lib/components/RecentViewModeToggle.svelte';
	import IDCarousel3D from '$lib/components/IDCarousel3D.svelte';
	import TemplateCard3D from '$lib/components/TemplateCard3D.svelte';
	import ClientOnly from '$lib/components/ClientOnly.svelte';
	import { Slider } from '$lib/components/ui/slider';
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { NoToneMapping } from 'three';

	interface Props {
		data: PageData & { user?: any; templates?: any[] };
	}

	let { data }: Props = $props();

	// Smart Loading State
	const preloadState = getPreloadState('/');
	let isStructureReady = $derived($preloadState?.serverData === 'ready');
	let areAssetsReady = $derived($preloadState?.assets === 'ready');
	
	// Fallback loading if preload state isn't initialized yet
	let isLoading = $state(true);

	onMount(() => {
		// If we're already here, we can show content immediately
		isLoading = false;
	});

	// Canvas resize handling
	let innerWidth = $state(0);
	let innerHeight = $state(0);

	// Template state - filter out default templates
	let templates = $state(untrack(() => data.templates || []));
	
	$effect(() => {
		templates = (data.templates || []).filter(
			(t: any) =>
				!t.name?.toLowerCase().includes('default') &&
				!t.name?.toLowerCase().includes('sample') &&
				t.name?.trim() !== ''
		);
	});
	let notification: string | null = $state(null);
	let hoveredTemplate: string | null = $state(null);

	// Dialog states
	let showSizeDialog = $state(false);
	let showDeleteDialog = $state(false);
	let showDuplicateDialog = $state(false);
	let templateToDelete: any = $state(null);
	let templateToDuplicate: any = $state(null);

	// View state
	let activeView = $state<'templates' | 'generations'>('templates');
	let gridColumns = $state(4); // Default to 4 columns
	let selectedTemplateId = $state<string | null>(null);

	// Debug panel state
	let showDebugPanel = $state(false);
	let showElementOverlays = $state(true);
	let showOverlayColors = $state(false);
	let showOverlayBorders = $state(true);
	let showOverlayText = $state(true);
	let showOverlayIcons = $state(true);
	let showAnimateText = $state(true);
	let showShadowControls = $state(false); // Collapsed by default

	// Card rotation and opacity for shadow sync
	let cardRotationY = $state(0);
	let shadowOpacity = $state(0.35);
	let shadowOblongFactor = $state(1.0); // 1.0 = full oblong, 0.0 = circular
	let shadowSizeFactor = $state(1.0); // 1.0 = full size, smaller = reduced

	// Reference to TemplateCard3D component for click-to-change
	let templateCard3D: TemplateCard3D | null = $state(null);

	// Mobile template list collapse state
	let templateListCollapsed = $state(true);

	// Texture preloading state
	let texturesLoading = $state(true);
	let texturesProgress = $state(0);
	let texturesLoaded = $state(0);
	let texturesTotal = $state(0);

	// Handle loading progress from TemplateCard3D
	function handleLoadingProgress(progress: number, loaded: number, total: number, isReady: boolean) {
		texturesProgress = progress;
		texturesLoaded = loaded;
		texturesTotal = total;
		texturesLoading = !isReady;
	}

	// Beat system state
	let beatMs = $state(1500); // Default 1.5 seconds per beat
	let currentBeatCount = $state(0);
	let lastBeatAction = $state<'texture' | 'shape' | 'spin' | null>(null);
	// Animation controls
	let spinSpeed = $state(0.04);
	let wobbleStrength = $state(0.05);
	let wobbleOscillations = $state(3);
	let wobbleLinger = $state(1.0);
	let wobbleControlsExpanded = $state(false); // Collapsed by default

	// Handle beat callback from TemplateCard3D
	function handleBeat(beatCount: number, action: 'texture' | 'shape' | 'spin') {
		currentBeatCount = beatCount;
		lastBeatAction = action;
	}

	// Tap pressure display (reactive)
	let displayTapPressure = $state(0);
	function handleTapPressureChange(pressure: number) {
		displayTapPressure = pressure;
	}

	// Shadow debug controls
	let shadowSlowOpacity = $state(0.08); // Requested: 0.08
	let shadowFastOpacity = $state(0.01); // Requested: 0.01
	let shadowSlowOblong = $state(0.75); // Requested: 0.75
	let shadowFastOblong = $state(0.55); // Requested: 0.55
	let shadowSlowSize = $state(1.00);   // Requested: 1.00
	let shadowFastSize = $state(0.80);   // Requested: 0.80
	let shadowLerpSpeed = $state(0.18);  // Requested: 0.18

	// Target values for lerping
	let targetShadowOpacity = 0.35;
	let targetShadowOblong = 1.0;
	let targetShadowSize = 1.0;

	// Handle rotation updates - direct follow, lerp shape properties
	function handleRotationChange(rotation: number, isSlowSpin: boolean) {
		cardRotationY = rotation;
		// Set targets based on debug values
		targetShadowOpacity = isSlowSpin ? shadowSlowOpacity : shadowFastOpacity;
		targetShadowOblong = isSlowSpin ? shadowSlowOblong : shadowFastOblong;
		targetShadowSize = isSlowSpin ? shadowSlowSize : shadowFastSize;

		// Dynamic lerp - faster when closer to target (ease out)
		const oblongDiff = Math.abs(targetShadowOblong - shadowOblongFactor);
		const lerpFactor = shadowLerpSpeed + (1 - oblongDiff) * 0.4;

		// Lerp towards targets
		shadowOpacity += (targetShadowOpacity - shadowOpacity) * lerpFactor;
		shadowOblongFactor += (targetShadowOblong - shadowOblongFactor) * lerpFactor;
		shadowSizeFactor += (targetShadowSize - shadowSizeFactor) * lerpFactor;
	}

	// Get selected template object
	const selectedTemplate = $derived(
		selectedTemplateId ? templates.find((t: any) => t.id === selectedTemplateId) : null
	);

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

	function handleSizeSelected(event: CustomEvent<{ cardSize: CardSize; templateName: string; selectedTemplateAsset?: TemplateAsset }>) {
		const { cardSize, templateName, selectedTemplateAsset } = event.detail;
		showSizeDialog = false;
		
		// Debug: Log event details
		console.log('📤 [Home Page] handleSizeSelected called:', {
			cardSize: cardSize,
			templateName: templateName,
			selectedTemplateAsset: selectedTemplateAsset,
			selectedTemplateAsset_image_url: selectedTemplateAsset?.image_url,
			selectedTemplateAsset_image_url_length: selectedTemplateAsset?.image_url?.length || 0
		});
		
		// Determine orientation from card dimensions
		const orientation = cardSize.width < cardSize.height ? 'portrait' : 'landscape';
		
		// Navigate to templates page with the new template params
		const params = new URLSearchParams({
			new: 'true',
			name: templateName,
			width: cardSize.width.toString(),
			height: cardSize.height.toString(),
			unit: cardSize.unit,
			orientation
		});
		
		// Add front background if template asset was selected
		if (selectedTemplateAsset?.image_url) {
			params.set('front_background', selectedTemplateAsset.image_url);
			console.log('📤 [Home Page] Setting front_background URL param:', {
				image_url: selectedTemplateAsset.image_url,
				encoded_in_params: params.get('front_background')
			});
		}
		
		const finalUrl = `/templates?${params.toString()}`;
		console.log('📤 [Home Page] Navigating to:', finalUrl);
		
		goto(finalUrl);
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

	const transformedCards = $derived(transformRecentCards(data.recentCards || []));

	const marketingPhrases = [
		"Only in the Philippines",
		"Fastest ID Generation",
		"Cheapest Rates",
		"Premium Templates",
		"Secure & Private"
	];
	let marketingIndex = $state(0);
	
	const targetAudiences = [
		"Schools",
		"Companies",
		"Events",
		"Startups",
		"Government",
		"Small Businesses",
		"Residences"
	];
	let selectedAudience = $state<string | null>(null);
	const SHOW_AUDIENCE_BADGE = false;

	$effect(() => {
		const interval = setInterval(() => {
			marketingIndex = (marketingIndex + 1) % marketingPhrases.length;
		}, 3000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" rel="stylesheet">
</svelte:head>

<div class="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
	<div class="container mx-auto px-4 py-2 flex-1 flex flex-col overflow-hidden">
		<!-- View Toggle Buttons - Mobile Only -->
		<div class="flex flex-col gap-1 w-fit flex-shrink-0 lg:hidden">
			<Button variant="outline" size="sm" onclick={() => (activeView = 'templates')}>Templates</Button
			>
			<Button variant="outline" size="sm" onclick={() => (activeView = 'generations')}
				>Generations</Button
			>
		</div>

		<!-- Templates View - 3 Column Layout -->
		{#if activeView === 'templates'}
			<section
				class="relative flex flex-row gap-2 lg:gap-6 items-center justify-center flex-1 overflow-hidden"
			>
				{#if SHOW_AUDIENCE_BADGE}
					<!-- Floating Target Audience Badge (Moved for Visibility) -->
					<div class="absolute top-28 left-0 w-full lg:left-8 lg:top-32 lg:w-auto z-50 pointer-events-none flex justify-center lg:justify-start">
						<div class="transform -rotate-2 flex items-center gap-3 pointer-events-auto">
						<!-- Brush Text -->
						<span class="text-xl md:text-2xl text-foreground bg-background/80 backdrop-blur-sm px-2 rounded-sm" style="font-family: 'Permanent Marker', cursive;">
							Great for
						</span>
						
						<!-- Dropdown Box -->
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="outline-none">
								<div class="bg-card border border-border shadow-lg rounded-md px-3 py-1.5 flex items-center gap-2 min-w-[140px] md:min-w-[200px] cursor-pointer hover:bg-accent/10 transition-colors">
									<div class="flex-1 relative h-6 w-full overflow-hidden text-sm md:text-base font-medium text-left text-foreground">
										{#if selectedAudience}
											<div class="absolute inset-0 flex items-center whitespace-nowrap" in:fade={{ duration: 200 }}>
												{selectedAudience}
											</div>
										{:else}
											{#key marketingIndex}
												<div 
													class="absolute inset-0 flex items-center whitespace-nowrap"
													in:fly={{ y: 20, duration: 300 }}
													out:fly={{ y: -20, duration: 300 }}
												>
													{targetAudiences[marketingIndex % targetAudiences.length]}
												</div>
											{/key}
										{/if}
									</div>
									<ChevronDown class="w-4 h-4 text-muted-foreground" />
								</div>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-[220px] max-h-[300px] overflow-y-auto z-[100]">
								<DropdownMenu.Label>Select Audience</DropdownMenu.Label>
								<DropdownMenu.Separator />
								{#each targetAudiences as audience}
									<DropdownMenu.Item onSelect={() => selectedAudience = audience}>
										{audience}
									</DropdownMenu.Item>
								{/each}
								<DropdownMenu.Separator />
								<DropdownMenu.Item onSelect={() => selectedAudience = null}>
									<span class="text-muted-foreground italic">Auto-cycle</span>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>
				{/if}

			<!-- Center: 3D Card Preview -->
			<div class="flex flex-col items-center justify-center flex-1">
				<!-- Marketing Header -->
				<div class="mb-6 text-center z-10 pointer-events-none select-none">
					<h1 class="text-4xl md:text-7xl font-black tracking-tighter mb-2 drop-shadow-sm flex items-center justify-center gap-3">
						<span class="text-3xl md:text-6xl text-foreground/80 font-normal">ᜃ</span>
						<span class="text-foreground">
							KINATAO
						</span>
					</h1>
					<div class="relative h-8 md:h-12 w-full flex justify-center items-center overflow-hidden">
						{#key marketingIndex}
							<p 
								class="absolute text-lg md:text-3xl font-bold text-muted-foreground whitespace-nowrap"
								in:fly={{ y: 20, duration: 400, delay: 100 }}
								out:fly={{ y: -20, duration: 400 }}
							>
								{marketingPhrases[marketingIndex]}
							</p>
						{/key}
					</div>
					
					<!-- Divider or Spacer -->
				</div>
				
				<!-- 3D Card Container - Responsive, max width on mobile -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="w-full max-w-[500px] h-[400px] sm:h-[450px] lg:max-w-[650px] lg:h-[550px] relative cursor-pointer"
					onclick={() => {
						if (!selectedTemplateId && templateCard3D) {
							// Use handleTap for center tap (triggers wobble + advance)
							templateCard3D.handleTap(0.5, 0.5);
						}
					}}
				>
					<!-- Debug toggle button -->
					<button
						type="button"
						class="absolute top-2 right-2 z-10 p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-colors"
						onclick={() => (showDebugPanel = !showDebugPanel)}
						title="Debug options"
					>
						<Settings2 class="w-4 h-4" />
					</button>
					
					<!-- Debug panel -->
					{#if showDebugPanel}
						<div class="absolute top-12 right-2 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm min-w-[180px]" transition:fade={{ duration: 150 }}>
							<div class="font-medium mb-2 text-xs uppercase tracking-wide text-white/60">Debug Options</div>
							<label class="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded p-1 -mx-1">
								<input type="checkbox" bind:checked={showElementOverlays} class="w-4 h-4 rounded" />
								<span>Element Overlays</span>
							</label>
							{#if showElementOverlays}
								<div class="ml-4 mt-1 space-y-1 border-l border-white/20 pl-2">
									<label class="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded p-1 -mx-1 text-xs">
										<input type="checkbox" bind:checked={showOverlayColors} class="w-3 h-3 rounded" />
										<span>Colors</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded p-1 -mx-1 text-xs">
										<input type="checkbox" bind:checked={showOverlayBorders} class="w-3 h-3 rounded" />
										<span>Borders</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded p-1 -mx-1 text-xs">
										<input type="checkbox" bind:checked={showOverlayText} class="w-3 h-3 rounded" />
										<span>Text</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded p-1 -mx-1 text-xs">
										<input type="checkbox" bind:checked={showOverlayIcons} class="w-3 h-3 rounded" />
										<span>Icons</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded p-1 -mx-1 text-xs">
										<input type="checkbox" bind:checked={showAnimateText} class="w-3 h-3 rounded" />
										<span>Animate Text</span>
									</label>
								</div>
							{/if}

							<div class="mt-3 pt-3 border-t border-white/20">
								<label class="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded p-1 -mx-1">
									<input type="checkbox" bind:checked={showShadowControls} class="w-4 h-4 rounded" />
									<span class="font-medium text-xs uppercase tracking-wide text-white/60">Shadow Controls</span>
								</label>
								{#if showShadowControls}
								<div class="ml-4 mt-1 space-y-2 border-l border-white/20 pl-2">
									<div>
										<label for="shadowSlowOpacity" class="text-xs text-white/70">Slow Opacity: {shadowSlowOpacity.toFixed(2)}</label>
										<input id="shadowSlowOpacity" type="range" min="0" max="0.5" step="0.01" bind:value={shadowSlowOpacity} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
									<div>
										<label for="shadowFastOpacity" class="text-xs text-white/70">Fast Opacity: {shadowFastOpacity.toFixed(2)}</label>
										<input id="shadowFastOpacity" type="range" min="0" max="0.2" step="0.005" bind:value={shadowFastOpacity} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
									<div>
										<label for="shadowSlowOblong" class="text-xs text-white/70">Slow Oblong: {shadowSlowOblong.toFixed(2)}</label>
										<input id="shadowSlowOblong" type="range" min="0" max="1" step="0.05" bind:value={shadowSlowOblong} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
									<div>
										<label for="shadowFastOblong" class="text-xs text-white/70">Fast Oblong: {shadowFastOblong.toFixed(2)}</label>
										<input id="shadowFastOblong" type="range" min="0" max="1" step="0.05" bind:value={shadowFastOblong} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
									<div>
										<label for="shadowSlowSize" class="text-xs text-white/70">Slow Size: {shadowSlowSize.toFixed(2)}</label>
										<input id="shadowSlowSize" type="range" min="0.2" max="1.5" step="0.05" bind:value={shadowSlowSize} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
									<div>
										<label for="shadowFastSize" class="text-xs text-white/70">Fast Size: {shadowFastSize.toFixed(2)}</label>
										<input id="shadowFastSize" type="range" min="0.2" max="1.5" step="0.05" bind:value={shadowFastSize} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
									<div>
										<label for="shadowLerpSpeed" class="text-xs text-white/70">Lerp Speed: {shadowLerpSpeed.toFixed(2)}</label>
										<input id="shadowLerpSpeed" type="range" min="0.05" max="0.5" step="0.01" bind:value={shadowLerpSpeed} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
								</div>
								{/if}
							</div>

							<div class="mt-3 pt-3 border-t border-white/20">
								<div class="font-medium mb-2 text-xs uppercase tracking-wide text-white/60">Beat Timing</div>
								<div class="space-y-2">
									<div>
										<label for="beatMs" class="text-xs text-white/70">Beat: {beatMs}ms</label>
										<input id="beatMs" type="range" min="50" max="3000" step="50" bind:value={beatMs} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
									</div>
									<div class="flex items-center justify-between text-xs">
										<span class="text-white/70">Count:</span>
										<span class="font-mono text-green-400">{currentBeatCount}</span>
									</div>
									<div class="flex items-center justify-between text-xs">
										<span class="text-white/70">Last:</span>
										<span class="font-mono {lastBeatAction === 'spin' ? 'text-pink-400' : lastBeatAction === 'shape' ? 'text-yellow-400' : lastBeatAction === 'texture' ? 'text-blue-400' : 'text-white/40'}">{lastBeatAction || 'none'}</span>
									</div>
									<div class="mt-2 pt-2 border-t border-white/10">
										<!-- Collapsible header -->
										<button 
											class="w-full flex items-center justify-between text-xs text-white/50 mb-1 hover:text-white/70 transition-colors"
											onclick={() => wobbleControlsExpanded = !wobbleControlsExpanded}
										>
											<span>Animation Controls</span>
											<span class="transform transition-transform {wobbleControlsExpanded ? 'rotate-180' : ''}">▼</span>
										</button>
										{#if wobbleControlsExpanded}
										<div>
											<label for="spinSpeed" class="text-xs text-white/70">Spin Speed: {spinSpeed.toFixed(2)}</label>
											<input id="spinSpeed" type="range" min="0.01" max="0.15" step="0.01" bind:value={spinSpeed} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
										</div>
										<div>
											<label for="wobbleStrength" class="text-xs text-white/70">Wobble Strength: {wobbleStrength.toFixed(2)}</label>
											<input id="wobbleStrength" type="range" min="0" max="0.3" step="0.01" bind:value={wobbleStrength} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
										</div>
										<div>
											<label for="wobbleOscillations" class="text-xs text-white/70">Wobble Oscillations: {wobbleOscillations}</label>
											<input id="wobbleOscillations" type="range" min="1" max="10" step="1" bind:value={wobbleOscillations} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
										</div>
										<div>
											<label for="wobbleLinger" class="text-xs text-white/70">Wobble Linger: {wobbleLinger.toFixed(1)}</label>
											<input id="wobbleLinger" type="range" min="0.2" max="3" step="0.1" bind:value={wobbleLinger} class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
										</div>
										{/if}
										<!-- Tap Pressure Bar - always visible -->
								<div class="pt-2 border-t border-white/10">
									<span id="tapPressureLabel" class="text-xs text-white/70">Tap Pressure: {displayTapPressure}</span>
									<div class="flex gap-1 mt-1" role="meter" aria-labelledby="tapPressureLabel" aria-valuenow={displayTapPressure} aria-valuemin="1" aria-valuemax="5">
										{#each [1, 2, 3, 4, 5] as level}
											<div 
												class="flex-1 h-3 rounded transition-all duration-150 {displayTapPressure >= level ? 'bg-emerald-500 shadow-lg' : 'bg-white/20'}"
											></div>
										{/each}
									</div>
											<div class="flex justify-between text-[10px] text-white/50 mt-1">
												<span>3°</span>
												<span>6°</span>
												<span>12°</span>
												<span>24°</span>
												<span>48°</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Loading overlay with progress bar -->
					{#if texturesLoading && !selectedTemplateId && (data.templateAssets?.length ?? 0) > 0}
						<div
							class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl"
							transition:fade={{ duration: 300 }}
						>
							<div class="flex flex-col items-center gap-4 px-8 w-full max-w-xs">
								<!-- Loading spinner -->
								<div class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>

								<!-- Progress text -->
								<p class="text-sm text-muted-foreground">
									Loading templates... {texturesLoaded}/{texturesTotal}
								</p>

								<!-- Progress bar -->
								<div class="w-full h-2 bg-muted rounded-full overflow-hidden">
									<div
										class="h-full bg-primary transition-all duration-200 ease-out rounded-full"
										style="width: {texturesProgress * 100}%"
									></div>
								</div>

								<!-- Percentage -->
								<p class="text-xs text-muted-foreground/70">
									{Math.round(texturesProgress * 100)}%
								</p>
							</div>
						</div>
					{/if}

					<ClientOnly>
						<Canvas toneMapping={NoToneMapping}>
						<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50}>
							<OrbitControls
								enableDamping
								enableZoom={true}
								enablePan={false}
								minDistance={3}
								maxDistance={10}
								minAzimuthAngle={-Math.PI / 6}
								maxAzimuthAngle={Math.PI / 6}
								minPolarAngle={Math.PI / 3}
								maxPolarAngle={Math.PI * 2 / 3}
							/>
						</T.PerspectiveCamera>
							<!-- Scene fog for depth - starts near card, fades to background -->
							<T.Fog attach="fog" args={['#1a1a2e', 3, 12]} />

							<!-- Ambient light for full color luster -->
							<T.AmbientLight intensity={1.0} color="#ffffff" />
							<!-- Main spotlight for visible reflection shape -->
							<T.SpotLight
								position={[1.5, 1.5, 5]}
								intensity={3}
								color="#ffffff"
								angle={0.8}
								penumbra={0.4}
							/>
							<!-- Second spotlight from opposite side -->
							<T.SpotLight
								position={[-2, 0.5, 5]}
								intensity={2}
								color="#ffffff"
								angle={0.7}
								penumbra={0.5}
							/>

							<!-- Shadow beneath card - oblong ellipse that rotates with card -->
							{@const cardW = selectedTemplate?.width_pixels || 1013}
							{@const cardH = selectedTemplate?.height_pixels || 638}
							{@const aspect = cardW / cardH}
							{@const baseX = aspect >= 1 ? 5.0 : 5.0 * aspect}
							{@const baseY = aspect >= 1 ? 2.5 / aspect : 2.5}
							{@const avgSize = (baseX + baseY) / 2}
							<T.Mesh
								rotation.x={-Math.PI / 2}
								rotation.z={cardRotationY}
								position.y={-1.8}
								position.z={0}
								scale.x={(baseX * shadowOblongFactor + avgSize * (1 - shadowOblongFactor)) * shadowSizeFactor}
								scale.y={(baseY * shadowOblongFactor + avgSize * (1 - shadowOblongFactor)) * shadowSizeFactor}
							>
								<T.PlaneGeometry args={[1, 1, 1, 1]} />
								<T.ShaderMaterial
									transparent={true}
									uniforms={{
										uColor: { value: [0.02, 0.02, 0.05] },
										uOpacity: { value: shadowOpacity }
									}}
									vertexShader={`
										varying vec2 vUv;
										void main() {
											vUv = uv;
											gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
										}
									`}
									fragmentShader={`
										uniform vec3 uColor;
										uniform float uOpacity;
										varying vec2 vUv;
										void main() {
											vec2 center = vUv - 0.5;
											float dist = length(center) * 2.0;
											float alpha = smoothstep(1.0, 0.0, dist) * uOpacity;
											gl_FragColor = vec4(uColor, alpha);
										}
									`}
								/>
							</T.Mesh>
							<TemplateCard3D
								bind:this={templateCard3D}
								imageUrl={selectedTemplate?.front_background
									? selectedTemplate.front_background.startsWith('http')
										? selectedTemplate.front_background
										: getSupabaseStorageUrl(selectedTemplate.front_background)
									: null}
								backImageUrl={selectedTemplate?.back_background
									? selectedTemplate.back_background.startsWith('http')
										? selectedTemplate.back_background
										: getSupabaseStorageUrl(selectedTemplate.back_background)
									: null}
								widthPixels={selectedTemplate?.width_pixels || 1013}
								heightPixels={selectedTemplate?.height_pixels || 638}
								templateId={selectedTemplateId}
								templateElements={(selectedTemplate?.template_elements || []) as any}
								showOverlays={showElementOverlays}
								showColors={showOverlayColors}
								showBorders={showOverlayBorders}
								showText={showOverlayText}
								showIcons={showOverlayIcons}
								animateText={showAnimateText}
								rotating={false}
								onRotationChange={handleRotationChange}
								showcaseImages={data.templateAssets || []}
								beatMs={beatMs}
								onBeat={handleBeat}
								spinSpeed={spinSpeed}
								wobbleStrength={wobbleStrength}
								wobbleOscillations={wobbleOscillations}
								wobbleLinger={wobbleLinger}
								onLoadingProgress={handleLoadingProgress}
								onTapPressureChange={handleTapPressureChange}

							/>
						</Canvas>
					</ClientOnly>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col sm:flex-row gap-3">
					{#if selectedTemplate}
						<Button href="/use-template/{selectedTemplate.id}" size="lg" class="gap-2">
							<Plus class="h-5 w-5" />
							Use Template
						</Button>
						<Button
							variant="outline"
							size="lg"
							class="gap-2"
							onclick={() => editTemplate(selectedTemplate)}
						>
							<Edit class="h-5 w-5" />
							Edit Template
						</Button>
					{:else}
						<Button onclick={handleCreateNew} size="lg" class="gap-2">
							<Plus class="h-5 w-5" />
							Create New Template
						</Button>
					{/if}
				</div>
			</div>

			<!-- Right: Template List with Toggle - Overlays on mobile -->
			<div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-start z-30 lg:relative lg:right-auto lg:top-auto lg:translate-y-0 lg:flex-shrink-0">
				<!-- Mobile: Collapse toggle button - always visible -->
				<button
					type="button"
					class="lg:hidden flex items-center justify-center w-8 h-20 bg-primary text-primary-foreground rounded-l-xl shadow-lg hover:bg-primary/90 transition-colors"
					onclick={() => (templateListCollapsed = !templateListCollapsed)}
					title={templateListCollapsed ? 'Show templates' : 'Hide templates'}
				>
					{#if templateListCollapsed}
						<ChevronLeft class="w-4 h-4" />
					{:else}
						<ChevronRight class="w-4 h-4" />
					{/if}
				</button>

				<!-- Template list panel -->
				<div
					class="w-64 lg:w-72 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none {templateListCollapsed ? 'max-w-0 opacity-0 overflow-hidden lg:max-w-72 lg:opacity-100' : 'max-w-72 opacity-100'}"
				>
				{#if data.user}
					<div class="bg-card border border-border rounded-xl p-3 {templateListCollapsed ? 'lg:block' : ''}">
						<!-- Desktop View Toggle Buttons -->
						<div class="hidden lg:flex gap-2 mb-4 w-full">
							<Button 
								variant={activeView === 'templates' ? 'default' : 'outline'} 
								size="sm" 
								class="flex-1"
								onclick={() => activeView = 'templates'}
							>
								Templates
							</Button>
							<Button 
								variant={(activeView as string) === 'generations' ? 'default' : 'outline'} 
								size="sm" 
								class="flex-1"
								onclick={() => activeView = 'generations'}
							>
								Generations
							</Button>
						</div>

						<h3 class="font-semibold text-foreground mb-2 text-sm">Templates</h3>

						<div class="space-y-1 max-h-[320px] overflow-y-auto">
							<!-- New Card option to go back to empty morphing state -->
							<button
								type="button"
								class="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors {selectedTemplateId === null
									? 'bg-primary text-primary-foreground'
									: 'hover:bg-muted text-foreground'}"
								onclick={() => (selectedTemplateId = null)}
							>
								<!-- Morphing card icon -->
								<div
									class="flex-shrink-0 w-14 h-10 rounded overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 border border-border/50 flex items-center justify-center"
								>
									<span class="text-blue-400 font-bold text-xs">ID</span>
								</div>
								<span class="truncate flex-1 text-left font-medium">New Card</span>
							</button>

							{#if templates.length === 0}
								<p class="text-sm text-muted-foreground py-4 text-center">No templates yet</p>
							{:else}
								{#each templates as template (template.id)}
									{@const dims = getPixelDims(template)}
									<button
										type="button"
										class="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors {selectedTemplateId ===
										template.id
											? 'bg-primary text-primary-foreground'
											: 'hover:bg-muted text-foreground'}"
										onclick={() => (selectedTemplateId = template.id)}
									>
										<!-- Thumbnail with Elements Overlay -->
										<div
											class="flex-shrink-0 w-14 h-10 rounded overflow-hidden bg-muted border border-border/50 relative"
											style="aspect-ratio: {dims.w} / {dims.h};"
										>
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
													class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700"
												>
													<FileText class="w-3 h-3 text-muted-foreground" />
												</div>
											{/if}
											<!-- Elements Overlay -->
											{#if template.template_elements?.length > 0}
												<div class="absolute inset-0 pointer-events-none">
													{#each template.template_elements.filter((el: any) => el.side === 'front') as el}
														<div
															class="absolute border border-dashed border-black/20 bg-black/5"
															style={getElementStyle(el, dims.w, dims.h)}
														>
															{#if el.type === 'text' || el.type === 'selection'}
																<span
																	class="block w-full h-full"
																	style="font-size: 2px; color: {el.color ?? '#000'}; opacity: 0.7;"
																></span>
															{/if}
														</div>
													{/each}
												</div>
											{/if}
										</div>
										<!-- Name -->
										<span class="truncate flex-1 text-left">{template.name}</span>
									</button>
								{/each}
							{/if}
						</div>

						<!-- View All Button -->
						<div class="mt-3 pt-2 border-t border-border">
							<Button variant="outline" size="sm" class="w-full" href="/templates">View All</Button>
						</div>
					</div>
				{:else}
					<!-- Not signed in - show sign in prompt -->
					<div class="bg-card border border-border rounded-xl p-4">
						<p class="text-sm text-muted-foreground text-center">Sign in to view templates</p>
					</div>
				{/if}
				</div>
			</div>
		</section>
	{/if}

	<!-- Recent Section (Generations) -->
	{#if activeView === 'generations'}
		<section class="space-y-6">
			<!-- Big Heading -->
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-foreground">Your Recent Generations</h1>
					<p class="text-muted-foreground mt-1">View and manage your generated ID cards</p>
				</div>
				<div class="flex items-center gap-3">
					<Button 
						variant="outline" 
						size="sm"
						class="hidden lg:flex" 
						onclick={() => activeView = 'templates'}
					>
						Back to 3D
					</Button>
					{#if transformedCards.length > 0}
						<RecentViewModeToggle />
					{/if}
				</div>
			</div>

			{#if $recentViewMode === 'grid'}
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground whitespace-nowrap">Columns: {gridColumns}</span
					>
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
							<svg
								class="h-5 w-5 text-red-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
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
					<div
						class={$recentViewMode === 'list' ? 'invisible absolute -z-50 pointer-events-none' : ''}
					>
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
	{/if}
	</div>
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
