<script lang="ts">
	import type { PageData } from './$types';
	import {
		upscaleImage,
		removeFromImage,
		saveEnhancedImage,
		uploadImage
	} from '$lib/remote/enhance.remote';
	import { toast } from 'svelte-sonner';
	import { fade, scale } from 'svelte/transition';
	import CropModal from './CropModal.svelte';
	import { getProxiedUrl } from '$lib/utils/storage';

	let { data }: { data: PageData } = $props();

	// Active side tab
	let activeSide = $state<'front' | 'back'>('front');

	// Source image for processing
	let frontSourceUrl = $state<string>(data.asset.frontImageUrl);
	let backSourceUrl = $state<string | null>(data.asset.backImageUrl);

	// Current source based on active side
	let currentSourceUrl = $derived(activeSide === 'front' ? frontSourceUrl : backSourceUrl);

	// Results gallery
	interface ProcessedResult {
		id: string;
		imageUrl: string;
		action: string;
		timestamp: Date;
		side: 'front' | 'back';
	}

	let results = $state<ProcessedResult[]>([]);
	let filteredResults = $derived(results.filter((r) => r.side === activeSide));

	// Processing state
	let isProcessing = $state(false);
	let processingAction = $state<string | null>(null);
	let isSaving = $state(false);
	let customPrompt = $state('');

	// Image Modal state
	let imageModalOpen = $state(false);

	// Crop Modal State
	let cropModalOpen = $state(false);

	// Function to handle crop completion (from CropModal component)
	async function onCropComplete(croppedImageUrl: string) {
		isProcessing = true;
		processingAction = 'crop';

		try {
			// Convert blob URL to base64 for upload
			const response = await fetch(croppedImageUrl);
			const blob = await response.blob();

			// Convert to base64
			const reader = new FileReader();
			reader.readAsDataURL(blob);

			reader.onloadend = async () => {
				const base64data = reader.result?.toString().split(',')[1];
				if (base64data) {
					const result = await uploadImage({ base64: base64data, contentType: blob.type });

					if (result.success && result.url) {
						const newResult: ProcessedResult = {
							id: crypto.randomUUID(),
							imageUrl: result.url,
							action: 'Crop',
							timestamp: new Date(),
							side: activeSide
						};
						results = [newResult, ...results];

						// Auto-set as source
						if (activeSide === 'front') {
							frontSourceUrl = newResult.imageUrl;
						} else {
							backSourceUrl = newResult.imageUrl;
						}
						activeDropdownId = null;

						toast.success('Image cropped and set as source');
					} else {
						toast.error(result.error || 'Failed to upload cropped image');
					}
				} else {
					toast.error('Failed to process cropped image');
				}
				isProcessing = false;
				processingAction = null;
			};
		} catch (e) {
			console.error('Crop processing error:', e);
			toast.error('Failed to process cropped image');
			isProcessing = false;
			processingAction = null;
		}
	}

	// Dropdown state for result items
	let activeDropdownId = $state<string | null>(null);

	async function handleAction(
		action:
			| 'face'
			| 'text'
			| 'logo'
			| 'qr'
			| 'upscale'
			| 'esrgan-upscale'
			| 'seedvr-upscale'
			| 'ccsr-upscale'
			| 'crop'
			| 'all'
			| 'custom'
	) {
		if (!currentSourceUrl) {
			toast.error('No source image available');
			return;
		}

		isProcessing = true;
		processingAction = action;

		try {
			let result;

			if (action === 'upscale') {
				result = await upscaleImage({ imageUrl: currentSourceUrl, upscaleFactor: 2 });
			} else if (action === 'esrgan-upscale') {
				result = await upscaleImage({ imageUrl: currentSourceUrl, model: 'esrgan' });
			} else if (action === 'seedvr-upscale') {
				result = await upscaleImage({ imageUrl: currentSourceUrl, model: 'seedvr' });
			} else if (action === 'ccsr-upscale') {
				result = await upscaleImage({ imageUrl: currentSourceUrl, model: 'ccsr' });
			} else if (action === 'crop') {
				cropModalOpen = true;
				isProcessing = false;
				processingAction = null;
				return;
			} else {
				// For custom action, we use 'all' as the base type, but the custom prompt will override it
				const removeType = action === 'custom' ? 'all' : action;

				result = await removeFromImage({
					imageUrl: currentSourceUrl,
					removeType: removeType,
					customPrompt: customPrompt.trim() || undefined
				});
			}

			if (result.success && result.imageUrl) {
				// Add to results gallery
				let actionLabel = '';
				if (action === 'upscale') actionLabel = 'Upscale 2x';
				else if (action === 'esrgan-upscale') actionLabel = 'ESRGAN Upscale';
				else if (action === 'seedvr-upscale') actionLabel = 'SeedVR Upscale';
				else if (action === 'ccsr-upscale') actionLabel = 'CCSR Upscale';
				else if (action === 'custom') actionLabel = 'Custom Edit';
				else if (action === 'all') actionLabel = 'Remove All';
				else if (action === 'face') actionLabel = 'Remove Face & Body';
				else if (customPrompt.trim()) actionLabel = 'Custom Edit';
				else actionLabel = `Remove ${action}`;

				const newResult: ProcessedResult = {
					id: crypto.randomUUID(),
					imageUrl: result.imageUrl,
					action: actionLabel,
					timestamp: new Date(),
					side: activeSide
				};
				results = [newResult, ...results];
				toast.success(`${newResult.action} completed successfully`);
			} else {
				toast.error(result.error || 'Processing failed');
			}
		} catch (err) {
			console.error('Processing error:', err);
			toast.error('An error occurred during processing');
		} finally {
			isProcessing = false;
			processingAction = null;
		}
	}

	async function saveAndReplace() {
		if (!currentSourceUrl) return;

		if (
			!confirm(
				`Are you sure you want to replace the ${activeSide} template background with this image?`
			)
		) {
			return;
		}

		isSaving = true;
		try {
			const result = await saveEnhancedImage({
				assetId: data.asset.id,
				imageUrl: currentSourceUrl,
				side: activeSide
			});

			if (result.success) {
				toast.success(`Successfully updated ${activeSide} template background`);
				// Update local state to reflect the new saved URL
				if (activeSide === 'front') {
					data.asset.frontImageUrl = result.url;
					// If we were viewing the processed result, update source too if needed
					// But currentSourceUrl is derived.
				} else {
					data.asset.backImageUrl = result.url;
				}
			}
		} catch (err) {
			console.error('Save error:', err);
			toast.error('Failed to save image');
		} finally {
			isSaving = false;
		}
	}

	function useAsSource(result: ProcessedResult) {
		if (activeSide === 'front') {
			frontSourceUrl = result.imageUrl;
		} else {
			backSourceUrl = result.imageUrl;
		}
		activeDropdownId = null;
		toast.success('Source image updated');
	}

	function toggleDropdown(resultId: string) {
		activeDropdownId = activeDropdownId === resultId ? null : resultId;
	}

	function closeDropdown() {
		activeDropdownId = null;
	}
</script>

<svelte:head>
	<title>Enhance Asset | Admin</title>
</svelte:head>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="min-h-screen bg-background" onclick={closeDropdown}>
	<!-- Header -->
	<div class="border-b border-border bg-card px-6 py-4">
		<div class="flex items-center gap-3">
			<a
				href="/admin"
				class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Admin
			</a>
			<span class="text-muted-foreground">/</span>
			<a
				href="/admin/template-assets/manage"
				class="text-sm text-muted-foreground hover:text-foreground"
			>
				Manage Assets
			</a>
			<span class="text-muted-foreground">/</span>
			<span class="text-sm font-medium text-foreground">Enhance</span>
		</div>
		<h1 class="mt-3 text-xl font-bold text-foreground">{data.asset.name}</h1>
	</div>

	<!-- Front/Back Tabs -->
	<div class="border-b border-border bg-card/50">
		<div class="flex gap-1 px-6">
			<button
				class="relative px-6 py-3 text-sm font-medium transition-colors
					{activeSide === 'front' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeSide = 'front')}
			>
				Front
				{#if activeSide === 'front'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
				{/if}
			</button>
			<button
				class="relative px-6 py-3 text-sm font-medium transition-colors
					{activeSide === 'back' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
					{!data.asset.backImageUrl ? 'opacity-50 cursor-not-allowed' : ''}"
				onclick={() => data.asset.backImageUrl && (activeSide = 'back')}
				disabled={!data.asset.backImageUrl}
			>
				Back
				{#if !data.asset.backImageUrl}
					<span class="ml-1 text-xs">(N/A)</span>
				{/if}
				{#if activeSide === 'back'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
				{/if}
			</button>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex h-[calc(100vh-140px)]">
		<!-- Left Sidebar -->
		<div class="w-80 flex-shrink-0 border-r border-border bg-card p-4 overflow-y-auto">
			<!-- Source Image -->
			<div class="mb-6">
				<h3 class="mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">
					Source Image
				</h3>
				<div
					class="relative aspect-[1.586/1] w-full overflow-hidden rounded-lg border border-border bg-muted"
				>
					{#if currentSourceUrl}
						<button
							class="absolute inset-0 w-full h-full cursor-zoom-in"
							onclick={() => (imageModalOpen = true)}
							title="Click to view full image"
						>
							<img src={currentSourceUrl} alt="Source" class="h-full w-full object-contain p-2" />
						</button>
					{:else}
						<div class="flex h-full items-center justify-center text-muted-foreground">
							No image available
						</div>
					{/if}
				</div>
				<p class="mt-2 text-xs text-muted-foreground text-center">
					{data.asset.widthPixels} × {data.asset.heightPixels}px
				</p>

				<!-- Save & Replace Button -->
				<button
					class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
						border border-border bg-primary/10 hover:bg-primary/20 text-primary
						transition-all text-sm font-medium disabled:opacity-50"
					onclick={saveAndReplace}
					disabled={isSaving || !currentSourceUrl}
				>
					{#if isSaving}
						<div
							class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
						></div>
						Saving...
					{:else}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
							/>
						</svg>
						Save & Replace {activeSide === 'front' ? 'Front' : 'Back'}
					{/if}
				</button>
			</div>

			<!-- Separator -->
			<div class="border-t border-border my-4"></div>

			<!-- Action Buttons -->
			<div class="space-y-3">
				<h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">Actions</h3>

				<!-- Crop -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-gray-500/10 to-slate-500/10 hover:from-gray-500/20 hover:to-slate-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('crop')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						/>
					</svg>
					<span class="font-medium">Crop & Resize</span>
				</button>

				<!-- Remove Face -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-rose-500/10 to-pink-500/10 hover:from-rose-500/20 hover:to-pink-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('face')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="font-medium">Remove Face & Body</span>
					{#if isProcessing && processingAction === 'face'}
						<div
							class="ml-auto w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- Remove Text -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('text')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<span class="font-medium">Remove Text</span>
					{#if isProcessing && processingAction === 'text'}
						<div
							class="ml-auto w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- Remove Logo -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('logo')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg
						class="w-5 h-5 text-violet-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
						/>
					</svg>
					<span class="font-medium">Remove Logo</span>
					{#if isProcessing && processingAction === 'logo'}
						<div
							class="ml-auto w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- Remove QR Code -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('qr')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg
						class="w-5 h-5 text-orange-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h-2v4h6v-4m2-15h2m-6 0v2m0 0h2m-2 0v20m0-2h2m-2-2h2m-2-2h2m-2-2h2"
						/>
					</svg>
					<span class="font-medium">Remove QR/Barcode</span>
					{#if isProcessing && processingAction === 'qr'}
						<div
							class="ml-auto w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- Remove All -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('all')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					<span class="font-medium">Remove All</span>
					{#if isProcessing && processingAction === 'all'}
						<div
							class="ml-auto w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- Separator -->
				<div class="border-t border-border my-2"></div>

				<!-- Upscale -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('upscale')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg
						class="w-5 h-5 text-emerald-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
						/>
					</svg>
					<span class="font-medium">Upscale 2x</span>
					{#if isProcessing && processingAction === 'upscale'}
						<div
							class="ml-auto w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- ESRGAN Upscale -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('esrgan-upscale')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg
						class="w-5 h-5 text-emerald-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					<span class="font-medium">ESRGAN Upscale (Denoise)</span>
					{#if isProcessing && processingAction === 'esrgan-upscale'}
						<div
							class="ml-auto w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- SeedVR Upscale -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('seedvr-upscale')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<span class="font-medium">SeedVR Upscale</span>
					{#if isProcessing && processingAction === 'seedvr-upscale'}
						<div
							class="ml-auto w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- CCSR Upscale -->
				<button
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border
						bg-gradient-to-r from-teal-500/10 to-cyan-500/10 hover:from-teal-500/20 hover:to-cyan-500/20
						text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={() => handleAction('ccsr-upscale')}
					disabled={isProcessing || !currentSourceUrl}
				>
					<svg class="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
						/>
					</svg>
					<span class="font-medium">CCSR Upscale (1.5x)</span>
					{#if isProcessing && processingAction === 'ccsr-upscale'}
						<div
							class="ml-auto w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
				</button>

				<!-- Custom Prompt -->
				<div class="pt-2">
					<label
						for="custom-prompt"
						class="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
					>
						Custom Prompt
					</label>
					<div class="flex gap-2">
						<textarea
							id="custom-prompt"
							bind:value={customPrompt}
							placeholder="e.g. remove the red hat"
							class="flex-1 px-3 py-2 rounded-md border border-input bg-background ring-offset-background
								placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
								focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm resize-none"
							rows="2"
							disabled={isProcessing}
							onkeydown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									if (customPrompt.trim()) handleAction('custom');
								}
							}}
						></textarea>
						<button
							class="flex-shrink-0 px-3 py-2 rounded-md border border-border bg-muted hover:bg-muted/80
								text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
							onclick={() => handleAction('custom')}
							disabled={isProcessing || !currentSourceUrl || !customPrompt.trim()}
							title="Run custom prompt"
						>
							{#if isProcessing && processingAction === 'custom'}
								<div
									class="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"
								></div>
							{:else}
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Processing Indicator -->
			{#if isProcessing}
				<div class="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
					<div class="flex items-center gap-3">
						<div
							class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"
						></div>
						<span class="text-sm text-primary font-medium">Processing...</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right Content - Results Gallery -->
		<div class="flex-1 p-6 overflow-y-auto">
			<h3 class="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
				Results Gallery
				{#if filteredResults.length > 0}
					<span class="ml-2 text-muted-foreground font-normal">({filteredResults.length})</span>
				{/if}
			</h3>

			{#if filteredResults.length === 0}
				<div
					class="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-border bg-muted/30"
				>
					<svg
						class="w-12 h-12 text-muted-foreground/50 mb-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<p class="text-muted-foreground text-sm">No processed images yet</p>
					<p class="text-muted-foreground/70 text-xs mt-1">
						Use the actions on the left to process images
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each filteredResults as result (result.id)}
						<div
							class="group relative rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
						>
							<!-- Image -->
							<div class="aspect-[1.586/1] bg-muted relative">
								<img
									src={result.imageUrl}
									alt={result.action}
									class="absolute inset-0 w-full h-full object-contain p-1"
								/>

								<!-- Overlay on hover -->
								<div
									class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
								>
									<button
										class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
										onclick={(e) => {
											e.stopPropagation();
											useAsSource(result);
										}}
									>
										Use as Source
									</button>
								</div>
							</div>

							<!-- Info -->
							<div class="p-3 flex items-center justify-between">
								<div>
									<span
										class="inline-block px-2 py-0.5 rounded text-xs font-medium
										{result.action.includes('Face')
											? 'bg-rose-100 text-rose-700'
											: result.action.includes('Text')
												? 'bg-blue-100 text-blue-700'
												: result.action.includes('Logo')
													? 'bg-violet-100 text-violet-700'
													: 'bg-emerald-100 text-emerald-700'}"
									>
										{result.action}
									</span>
								</div>

								<!-- Dropdown Menu -->
								<div class="relative">
									<button
										class="p-1 rounded hover:bg-muted transition-colors"
										title="More options"
										onclick={(e) => {
											e.stopPropagation();
											toggleDropdown(result.id);
										}}
									>
										<svg
											class="w-4 h-4 text-muted-foreground"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
											/>
										</svg>
									</button>

									{#if activeDropdownId === result.id}
										<div
											class="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-md shadow-lg z-10"
											onclick={(e) => e.stopPropagation()}
										>
											<button
												class="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
												onclick={() => useAsSource(result)}
											>
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
													/>
												</svg>
												Use as Source
											</button>
											<a
												href={result.imageUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
											>
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
													/>
												</svg>
												Open in New Tab
											</a>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Image Modal -->
	{#if imageModalOpen && currentSourceUrl}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
			transition:fade={{ duration: 200 }}
			onclick={() => (imageModalOpen = false)}
			role="dialog"
			aria-modal="true"
		>
			<div
				class="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
				onclick={(e) => e.stopPropagation()}
			>
				<img
					src={currentSourceUrl}
					alt="Full view"
					class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
					transition:scale={{ start: 0.95, duration: 200 }}
				/>
				<button
					class="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
					onclick={() => (imageModalOpen = false)}
				>
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Crop Modal -->
	{#if cropModalOpen && currentSourceUrl}
		<CropModal
			bind:isOpen={cropModalOpen}
			imageUrl={getProxiedUrl(currentSourceUrl) ?? currentSourceUrl}
			aspectRatio={data.asset.widthPixels / data.asset.heightPixels}
			targetWidth={data.asset.widthPixels}
			targetHeight={data.asset.heightPixels}
			{onCropComplete}
		/>
	{/if}
</div>
