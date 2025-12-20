<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { env } from '$env/dynamic/public';
	import { deserialize } from '$app/forms';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// State
	let selectedTemplateId = $state('');
	let newTemplateName = $state('');
	let frontOverlayFile: File | null = $state(null);
	let backOverlayFile: File | null = $state(null);
	let frontPreview = $state('');
	let backPreview = $state('');
	let bulkKey = $state('');
	let bulkValue = $state('');

	// Processing state
	let isProcessing = $state(false);
	let currentStep = $state('');
	let processedCount = $state(0);
	let totalCount = $state(0);
	let errorMessage = $state('');
	let successMessage = $state('');
	let newTemplateId: string = $state('');
	let errors: string[] = $state([]);
	let generatedTemplate: any = $state(null);
	let generatedCards: any[] = $state([]);

	// Type for source cards
	interface SourceCard {
		id: string;
		front_image: string | null;
		back_image: string | null;
		data: Record<string, any>;
	}

	// Derived values
	let selectedTemplate = $derived(data.templates.find((t) => t.id === selectedTemplateId));
	let cardCount = $derived(
		selectedTemplateId ? data.templateCardCounts[selectedTemplateId] || 0 : 0
	);
	let canGenerate = $derived(
		selectedTemplateId && newTemplateName.trim() && (frontOverlayFile || backOverlayFile)
	);

	function getStorageUrl(path: string): string {
		if (path.startsWith('http')) return path;
		const supabaseUrl = env.PUBLIC_SUPABASE_URL;
		if (!supabaseUrl) return 'about:blank';
		return `${supabaseUrl}/storage/v1/object/public/cards/${path}`;
	}

	function getTemplateStorageUrl(path: string): string {
		if (path.startsWith('http')) return path;
		const supabaseUrl = env.PUBLIC_SUPABASE_URL;
		if (!supabaseUrl) return 'about:blank';
		return `${supabaseUrl}/storage/v1/object/public/templates/${path}`;
	}

	function handleFrontOverlay(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			frontOverlayFile = file;
			frontPreview = URL.createObjectURL(file);
		}
	}

	function handleBackOverlay(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			backOverlayFile = file;
			backPreview = URL.createObjectURL(file);
		}
	}

	async function loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = (e) => {
				const msg = typeof e === 'string' ? e : (e as Event).type;
				reject(new Error(`Failed to load image: ${src} (Error: ${msg})`));
			};
			img.src = src;
		});
	}

	async function compositeImage(
		originalUrl: string,
		overlayImg: HTMLImageElement | null,
		width: number,
		height: number
	): Promise<Blob> {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d')!;

		// Draw original image first
		const originalImg = await loadImage(originalUrl);
		ctx.drawImage(originalImg, 0, 0, width, height);

		// Draw overlay on top (if any)
		if (overlayImg) {
			ctx.drawImage(overlayImg, 0, 0, width, height);
		}

		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error('Failed to create blob'));
				},
				'image/png',
				1.0
			);
		});
	}

	async function startProcessing() {
		// Reset state
		errorMessage = '';
		errors = [];
		successMessage = '';
		generatedTemplate = null;
		generatedCards = [];

		// Explicit validation with user feedback
		if (!selectedTemplateId) {
			errorMessage = 'Please select a source template.';
			return;
		}
		if (!newTemplateName.trim()) {
			errorMessage = 'Please enter a name for the new template.';
			return;
		}
		if (!frontOverlayFile && !backOverlayFile) {
			errorMessage = 'Please upload at least one overlay image (Front or Back).';
			return;
		}

		if (!selectedTemplate) {
			errorMessage = 'Selected template data not found. Please refresh the page.';
			return;
		}

		isProcessing = true;
		processedCount = 0;
		generatedTemplate = null;
		generatedCards = [];
		generatedTemplate = null;
		generatedCards = [];

		try {
			// Load overlay images first
			let loadedFrontOverlay: HTMLImageElement | null = null;
			let loadedBackOverlay: HTMLImageElement | null = null;

			if (frontOverlayFile) {
				loadedFrontOverlay = await loadImage(URL.createObjectURL(frontOverlayFile));
			}
			if (backOverlayFile) {
				loadedBackOverlay = await loadImage(URL.createObjectURL(backOverlayFile));
			}

			// Step 1: Create new template
			currentStep = 'Creating new template...';
			const createFormData = new FormData();
			createFormData.set('sourceTemplateId', selectedTemplateId);
			createFormData.set('newTemplateName', newTemplateName.trim());

			// Composite template backgrounds (Source + Overlay)
			const width = selectedTemplate.width_pixels || 1013;
			const height = selectedTemplate.height_pixels || 638;

			// Prepare front background
			let templateFrontBlob: Blob | null = null;
			if (selectedTemplate.front_background) {
				const frontUrl = getTemplateStorageUrl(selectedTemplate.front_background);
				templateFrontBlob = await compositeImage(frontUrl, loadedFrontOverlay, width, height);
			} else if (loadedFrontOverlay) {
				// If no source background, just use the overlay on white/transparent
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d')!;
				// Fill white? Or transparent? Templates usually have a base.
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, width, height);
				if (loadedFrontOverlay) ctx.drawImage(loadedFrontOverlay, 0, 0, width, height);
				templateFrontBlob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
			}

			// Prepare back background
			let templateBackBlob: Blob | null = null;
			if (selectedTemplate.back_background) {
				const backUrl = getTemplateStorageUrl(selectedTemplate.back_background);
				templateBackBlob = await compositeImage(backUrl, loadedBackOverlay, width, height);
			} else if (loadedBackOverlay) {
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d')!;
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, width, height);
				if (loadedBackOverlay) ctx.drawImage(loadedBackOverlay, 0, 0, width, height);
				templateBackBlob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
			}

			if (templateFrontBlob) {
				console.log('Adding templateFront blob:', templateFrontBlob.size, templateFrontBlob.type);
				createFormData.set('templateFront', templateFrontBlob);
			} else {
				console.log('No templateFront blob created');
			}
			if (templateBackBlob) {
				console.log('Adding templateBack blob:', templateBackBlob.size, templateBackBlob.type);
				createFormData.set('templateBack', templateBackBlob);
			} else {
				console.log('No templateBack blob created');
			}

			const createRes = await fetch('?/createTemplate', {
				method: 'POST',
				body: createFormData
			});
			const createResult = deserialize(await createRes.text());
			console.log('Create result:', createResult);

			if (createResult.type !== 'success') {
				throw new Error('Failed to create template');
			}

			const resultData = createResult.data as any;
			if (!resultData?.success) {
				let msg: string = resultData?.error || 'Failed to create template';
				if (!resultData?.error && !resultData?.details) {
					msg += ` (Raw Result: ${JSON.stringify(createResult)})`;
				}
				throw new Error(msg);
			}

			newTemplateId = resultData.newTemplateId as string;
			generatedTemplate = resultData.newTemplate;

			// Step 2: Get source cards
			currentStep = 'Fetching source cards...';
			const cardsFormData = new FormData();
			cardsFormData.set('sourceTemplateId', selectedTemplateId);

			const cardsRes = await fetch('?/getSourceCards', {
				method: 'POST',
				body: cardsFormData
			});
			const cardsResult = deserialize(await cardsRes.text());
			console.log('[startProcessing] Raw cardsResult:', cardsResult);

			if (cardsResult.type !== 'success') {
				throw new Error('Failed to fetch source cards');
			}

			const cardsData = cardsResult.data as any;
			console.log('[startProcessing] Initial cardsData:', cardsData);

			if (!cardsData?.cards) {
				let msg: string = cardsData?.error || 'Failed to fetch cards';
				if (!cardsData?.error) {
					msg += ` (Raw Result: ${JSON.stringify(cardsResult)})`;
				}
				throw new Error(msg);
			}

			let cards: SourceCard[] = cardsData.cards as SourceCard[];
			console.log('Cards data type:', typeof cards, 'Is Array:', Array.isArray(cards));

			if (!Array.isArray(cards)) {
				console.warn('Cards is not an array, attempting to wrap:', cards);
				cards = [cards as unknown as SourceCard];
			}

			totalCount = cards.length;
			console.log(`Starting processing for ${totalCount} cards`);

			if (totalCount === 0) {
				successMessage = 'Template created but no cards to process.';
				isProcessing = false;
				return;
			}

			// Step 3: Process each card
			currentStep = 'Processing cards...';

			console.log(`[startProcessing] Starting loop for ${cards.length} cards`);
			for (const card of cards) {
				console.log(`[startProcessing] Processing card ${card.id}`);
				try {
					if (!card.front_image || !card.back_image) {
						console.warn(`Card ${card.id} missing images, skipping`);
						processedCount++;
						continue;
					}

					const frontUrl = getStorageUrl(card.front_image);
					const backUrl = getStorageUrl(card.back_image);

					// Composite front with front overlay, back with back overlay
					const newFrontBlob = await compositeImage(frontUrl, loadedFrontOverlay, width, height);
					const newBackBlob = await compositeImage(backUrl, loadedBackOverlay, width, height);

					// Save the new card
					const saveFormData = new FormData();
					saveFormData.set('newTemplateId', newTemplateId);
					saveFormData.set('cardData', JSON.stringify(card.data));
					saveFormData.set('frontImage', newFrontBlob);
					saveFormData.set('backImage', newBackBlob);
					if (bulkKey && bulkValue) {
						saveFormData.set('bulkKey', bulkKey);
						saveFormData.set('bulkValue', bulkValue);
					}

					console.log(`[startProcessing] Saving card ${card.id}...`);
					const saveRes = await fetch('?/saveCard', {
						method: 'POST',
						body: saveFormData
					});
					const saveResult = deserialize(await saveRes.text());
					console.log(`[startProcessing] Save result for ${card.id}:`, saveResult);

					if (saveResult.type === 'success' && saveResult.data?.success) {
						// Keep track of generated cards (limit to 6 for preview)
						if (generatedCards.length < 6 && saveResult.data.newCard) {
							generatedCards = [...generatedCards, saveResult.data.newCard];
						}
					} else {
						const errorMsg = `Card ${card.id}: ${(saveResult as any).data?.error || 'Unknown error'}`;
						console.error(errorMsg);
						errors = [...errors, errorMsg];
					}
				} catch (cardErr) {
					const errorMsg = `Card ${card.id} failed: ${cardErr instanceof Error ? cardErr.message : String(cardErr)}`;
					console.error(errorMsg);
					errors = [...errors, errorMsg];
				} finally {
					processedCount++;
				}
			}

			if (errors.length > 0) {
				errorMessage = `Completed with ${errors.length} errors. See details below.`;
			} else {
				successMessage = `Successfully created ${processedCount} cards in "${newTemplateName}"`;
			}
			currentStep = 'Complete!';
		} catch (err) {
			console.error('Processing error:', err);
			if (err instanceof Error) {
				errorMessage = err.message;
			} else if (typeof err === 'string') {
				errorMessage = err;
			} else {
				errorMessage = 'An unexpected error occurred: ' + JSON.stringify(err);
			}
			currentStep = '';
		} finally {
			isProcessing = false;
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Batch Overlay ID Cards</h1>
		<p class="text-muted-foreground">
			Apply overlay images on top of the front and/or back of all ID cards from an existing
			template.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Section 1: Template Selection -->
		<Card>
			<CardHeader>
				<CardTitle>1. Select Source Template</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label for="template">Template</Label>
					<select
						id="template"
						class="w-full mt-1 p-2 border rounded-md bg-background"
						bind:value={selectedTemplateId}
						disabled={isProcessing}
					>
						<option value="">Select a template...</option>
						{#each data.templates as template}
							{@const count = data.templateCardCounts[template.id] || 0}
							<option value={template.id}>
								{template.name} ({count} cards)
							</option>
						{/each}
					</select>
				</div>

				{#if selectedTemplate}
					<div class="text-sm text-muted-foreground">
						<p>Dimensions: {selectedTemplate.width_pixels} x {selectedTemplate.height_pixels} px</p>
						<p>DPI: {selectedTemplate.dpi || 300}</p>
						<p>Orientation: {selectedTemplate.orientation || 'landscape'}</p>
						<p class="font-medium mt-2">Cards to process: {cardCount}</p>

						<div class="grid grid-cols-2 gap-4 mt-4">
							<div>
								<p class="text-xs font-medium mb-1">Source Front Background:</p>
								{#if selectedTemplate.front_background}
									<img
										src={getTemplateStorageUrl(selectedTemplate.front_background)}
										alt="Source Front"
										class="w-full rounded border bg-gray-100"
									/>
								{:else}
									<div
										class="w-full h-24 bg-gray-100 rounded border flex items-center justify-center text-xs"
									>
										No Front Background
									</div>
								{/if}
							</div>
							<div>
								<p class="text-xs font-medium mb-1">Source Back Background:</p>
								{#if selectedTemplate.back_background}
									<img
										src={getTemplateStorageUrl(selectedTemplate.back_background)}
										alt="Source Back"
										class="w-full rounded border bg-gray-100"
									/>
								{:else}
									<div
										class="w-full h-24 bg-gray-100 rounded border flex items-center justify-center text-xs"
									>
										No Back Background
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Section 2: Overlay Images -->
		<Card>
			<CardHeader>
				<CardTitle>2. Upload Overlay Images</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label for="frontOverlay">Front Side Overlay (optional)</Label>
					<p class="text-xs text-muted-foreground mb-1">
						Will be drawn ON TOP of each ID card's front image
					</p>
					<Input
						id="frontOverlay"
						type="file"
						accept="image/png"
						onchange={handleFrontOverlay}
						disabled={isProcessing}
					/>
					{#if frontPreview}
						<img
							src={frontPreview}
							alt="Front overlay preview"
							class="mt-2 max-h-24 rounded border"
						/>
					{/if}
				</div>

				<div>
					<Label for="backOverlay">Back Side Overlay (optional)</Label>
					<p class="text-xs text-muted-foreground mb-1">
						Will be drawn ON TOP of each ID card's back image
					</p>
					<Input
						id="backOverlay"
						type="file"
						accept="image/png"
						onchange={handleBackOverlay}
						disabled={isProcessing}
					/>
					{#if backPreview}
						<img
							src={backPreview}
							alt="Back overlay preview"
							class="mt-2 max-h-24 rounded border"
						/>
					{/if}
				</div>

				{#if !frontOverlayFile && !backOverlayFile}
					<p class="text-sm text-yellow-600">At least one overlay image is required.</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Section 3: Bulk Data Update (Optional) -->
		<Card>
			<CardHeader>
				<CardTitle>3. Bulk Data Update (Optional)</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="bulkKey">Field Name (Key)</Label>
						<Input
							id="bulkKey"
							type="text"
							placeholder="e.g., valid"
							bind:value={bulkKey}
							disabled={isProcessing}
						/>
						<p class="text-xs text-muted-foreground mt-1">
							The JSON key to update in the card data.
						</p>
					</div>
					<div>
						<Label for="bulkValue">New Value</Label>
						<Input
							id="bulkValue"
							type="text"
							placeholder="e.g., 01/01/2026"
							bind:value={bulkValue}
							disabled={isProcessing}
						/>
						<p class="text-xs text-muted-foreground mt-1">
							The value to set for all generated cards.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Section 4: New Template Name -->
		<Card>
			<CardHeader>
				<CardTitle>4. New Template Name</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label for="newName">Template Name</Label>
					<Input
						id="newName"
						type="text"
						placeholder="e.g., 2024 Updated IDs"
						bind:value={newTemplateName}
						disabled={isProcessing}
					/>
				</div>

				<Button onclick={startProcessing} disabled={isProcessing} class="w-full">
					{#if isProcessing}
						Processing...
					{:else}
						Generate {cardCount} New Cards
					{/if}
				</Button>
			</CardContent>
		</Card>

		<!-- Section 5: Status -->
		<Card>
			<CardHeader>
				<CardTitle>5. Status</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if isProcessing}
					<div class="space-y-2">
						<p class="text-sm font-medium">{currentStep}</p>
						<div class="w-full bg-gray-200 rounded-full h-2.5">
							<div
								class="bg-blue-600 h-2.5 rounded-full transition-all"
								style="width: {totalCount > 0 ? (processedCount / totalCount) * 100 : 0}%"
							></div>
						</div>
						<p class="text-sm text-muted-foreground">
							{processedCount} of {totalCount} cards processed
						</p>
					</div>
				{:else if successMessage}
					<div class="p-3 bg-green-50 border border-green-200 rounded-md">
						<p class="text-green-800">{successMessage}</p>
						{#if newTemplateId}
							<a
								href="/use-template/{newTemplateId}"
								class="text-green-600 underline text-sm mt-1 block"
							>
								View new template →
							</a>
						{/if}

						{#if generatedTemplate}
							<div class="mt-4 border-t border-green-200 pt-4">
								<p class="font-medium text-sm mb-2 text-green-900">
									Generated Template Backgrounds:
								</p>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<p class="text-xs mb-1 text-green-800">Front:</p>
										{#if generatedTemplate.front_background}
											<img
												src={getTemplateStorageUrl(generatedTemplate.front_background)}
												alt="New Front"
												class="w-full rounded border border-green-200"
											/>
										{:else}
											<div
												class="w-full h-24 bg-white/50 rounded border border-green-200 flex items-center justify-center text-xs text-green-700"
											>
												No Front
											</div>
										{/if}
									</div>
									<div>
										<p class="text-xs mb-1 text-green-800">Back:</p>
										{#if generatedTemplate.back_background}
											<img
												src={getTemplateStorageUrl(generatedTemplate.back_background)}
												alt="New Back"
												class="w-full rounded border border-green-200"
											/>
										{:else}
											<div
												class="w-full h-24 bg-white/50 rounded border border-green-200 flex items-center justify-center text-xs text-green-700"
											>
												No Back
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}

						{#if generatedCards.length > 0}
							<div class="mt-4 border-t border-green-200 pt-4">
								<p class="font-medium text-sm mb-2 text-green-900">
									Generated Cards Preview (First {generatedCards.length}):
								</p>
								<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
									{#each generatedCards as card}
										<div class="border border-green-200 rounded p-2 bg-white/80">
											<p class="text-xs font-medium mb-1 truncate text-green-900">ID: {card.id}</p>
											<div class="grid grid-cols-2 gap-1">
												<img
													src={getStorageUrl(card.front_image)}
													alt="Front"
													class="w-full rounded border border-green-100"
												/>
												<img
													src={getStorageUrl(card.back_image)}
													alt="Back"
													class="w-full rounded border border-green-100"
												/>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else if errorMessage}
					<div class="p-3 bg-red-50 border border-red-200 rounded-md">
						<p class="text-red-800">{errorMessage}</p>
					</div>
				{/if}

				{#if errors.length > 0}
					<div class="p-3 bg-red-50 border border-red-200 rounded-md mt-4">
						<p class="font-medium text-red-900 mb-2">Detailed Errors:</p>
						<ul class="list-disc pl-5 space-y-1 text-sm text-red-800 max-h-60 overflow-y-auto">
							{#each errors as error}
								<li>{error}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if !isProcessing && !successMessage && !errorMessage}
					<p class="text-muted-foreground text-sm">
						Select a template, upload at least one overlay, enter a name, then click Generate.
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
