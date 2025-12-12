<script lang="ts">
	import { run, preventDefault } from 'svelte/legacy';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { auth, session, user } from '$lib/stores/auth';
	import IdCanvas from '$lib/components/IdCanvas.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { darkMode } from '$lib/stores/darkMode';
	import ThumbnailInput from '$lib/components/ThumbnailInput.svelte';
	import { Loader } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { TemplateElement } from '$lib/stores/templateStore';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';

	// Enhanced type definitions for better type safety
	interface SelectOption {
		value: string;
		label: string;
	}

	interface Template {
		id: string;
		name: string;
		org_id: string;
		template_elements: TemplateElement[];
		front_background: string;
		back_background: string;
		orientation: 'landscape' | 'portrait';
		width_pixels?: number;
		height_pixels?: number;
		dpi?: number;
		unit_type?: string;
		unit_width?: number;
		unit_height?: number;
	}

	interface ImagePosition {
		x: number;
		y: number;
		width: number;
		height: number;
		scale: number;
	}

	interface FileUploads {
		[key: string]: File | null;
	}

	interface Props {
		data: {
			template: {
				id: string;
				name: string;
				org_id: string;
				template_elements: TemplateElement[];
				front_background: string;
				back_background: string;
				orientation: 'landscape' | 'portrait';
			};
		};
	}

	// Props initialization
	let { data }: Props = $props();

	// State management using Svelte's reactive stores
	let templateId = $page.params.id;
	let template: Template = {
		...data.template,
		template_elements: data.template.template_elements.map((element) => ({
			...element,
			width: element.width ?? 100,
			height: element.height ?? 100
		}))
	};

	// Component state declarations with $state
	let loading = $state(false);
	let error = $state<string | null>(null);
	let formElement = $state<HTMLFormElement | null>(null);
	let debugMessages = $state<string[]>([]);
	let formData = $state<Record<string, string>>({});
	let fileUploads = $state<FileUploads>({});
	let imagePositions = $state<Record<string, ImagePosition>>({});
	let frontCanvasComponent = $state<IdCanvas | null>(null);
	let backCanvasComponent = $state<IdCanvas | null>(null);
	let frontCanvasReady = $state(false);
	let backCanvasReady = $state(false);
	let fullResolution = $state(false);
	let mouseMoving = $state(false);
	// Responsive preview state (mobile toggle vs desktop side-by-side)
	let isMobile = $state(false);
	let isFlipped = $state(false);
	let formErrors = $state<Record<string, boolean>>({});
	let fileUrls = $state<Record<string, string>>({});

	// Enhanced Select handling
	interface SelectState {
		value: string | undefined;
		label: string;
		options: SelectOption[];
	}

	let selectStates = $state<Record<string, SelectState>>({});

	// Initialize select states with getters and setters
	function initializeSelectStates() {
		template.template_elements.forEach((element) => {
			if (element.type === 'selection' && element.variableName && element.options) {
				const options = element.options.map((opt) => ({
					value: opt,
					label: opt
				}));

				selectStates[element.variableName] = {
					value: formData[element.variableName] || undefined,
					label: formData[element.variableName] || 'Select an option',
					options
				};
			}
		});
	}

	// Derived content for select triggers using $derived
	let triggerContent = $derived(
		(variableName: string) => formData[variableName] || 'Select an option'
	);

	// Lifecycle hooks
	run(() => {
		console.log('Use Template Page: Session exists:', !!$session);
		console.log('Use Template Page: User exists:', !!$user);
	});

	function initializeFormData() {
		if (!template?.template_elements) return;

		template.template_elements.forEach((element) => {
			if (!element.variableName) return;

			if (element.type === 'text' || element.type === 'selection') {
				formData[element.variableName] = element.content || '';
			} else if (element.type === 'photo' || element.type === 'signature') {
				fileUploads[element.variableName] = null;
				imagePositions[element.variableName] = {
					x: 0,
					y: 0,
					width: element.width || 100,
					height: element.height || 100,
					scale: 1
				};
			}
		});

		initializeSelectStates();
	}

	onMount(async () => {
		// initialize responsive state
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768;
		}
		if (!templateId) {
			error = 'No template ID provided';
			return;
		}

		console.log(' [Use Template] Initializing with template:', {
			id: template.id,
			name: template.name,
			elementsCount: template.template_elements?.length || 0,
			frontBackground: template.front_background,
			backBackground: template.back_background,
			frontBackgroundType: typeof template.front_background,
			backBackgroundType: typeof template.back_background
		});

		initializeFormData();
	});

	// Event handlers
	function handleCanvasReady(side: 'front' | 'back') {
		if (side === 'front') {
			frontCanvasReady = true;
		} else {
			backCanvasReady = true;
		}
	}

	function handleSelectionChange(value: string, variableName: string) {
		// Update form data
		formData[variableName] = value;

		// Update select state
		if (selectStates[variableName]) {
			selectStates[variableName] = {
				...selectStates[variableName],
				value,
				label: value
			};
		}

		// Clear any errors
		if (formErrors[variableName]) {
			formErrors[variableName] = false;
		}
	}

	function handleImageUpdate(
		event: CustomEvent<{ scale: number; x: number; y: number }>,
		variableName: string
	) {
		const { scale, x, y } = event.detail;
		imagePositions[variableName] = {
			...imagePositions[variableName],
			scale,
			x,
			y
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		try {
			if (!validateForm()) {
				error = 'Please fill in all required fields';
				return;
			}

			loading = true;
			error = null;

			if (!template || !frontCanvasComponent || !backCanvasComponent) {
				error = 'Missing required components';
				return;
			}

			const [frontBlob, backBlob] = await Promise.all([
				frontCanvasComponent.renderFullResolution(),
				backCanvasComponent.renderFullResolution()
			]);

			const form = event.target as HTMLFormElement;
			const formData = new FormData(form);

			// Add required data to form
			formData.append('templateId', $page.params.id);
			formData.append('frontImage', frontBlob, 'front.png');
			formData.append('backImage', backBlob, 'back.png');

			const response = await fetch('?/saveIdCard', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			console.log('Save response:', result);

			if (response.ok && (result.type === 'success' || (result.data && result.data[0]?.success))) {
				goto('/all-ids');
			} else {
				error = (result.data && result.data[0]?.error) || 'Failed to save ID card';
				console.error('Save error:', error);
			}
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	function handleMouseDown() {
		mouseMoving = true;
	}

	function handleMouseUp() {
		mouseMoving = false;
	}

	function handleToggle(checked: boolean) {
		darkMode.set(checked);
	}

	function handleResize() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768;
		}
	}

	function handleSelectFile(variableName: string) {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = (e) => handleFileUpload(e, variableName);
		input.click();
	}

	function handleFileUpload(event: Event, variableName: string) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;

		const file = input.files[0];
		fileUploads[variableName] = file;

		if (fileUrls[variableName]) {
			URL.revokeObjectURL(fileUrls[variableName]);
		}

		const url = URL.createObjectURL(file);
		fileUrls[variableName] = url;
	}

	function validateForm(): boolean {
		formErrors = {};
		let isValid = true;
		let emptyFields: string[] = [];

		if (!template) return false;

		template.template_elements.forEach((element) => {
			if (!element.variableName) return;

			if (element.type === 'text' || element.type === 'selection') {
				if (!formData[element.variableName]?.trim()) {
					formErrors[element.variableName] = true;
					emptyFields.push(element.variableName);
					isValid = false;
				}
			}
		});

		if (!isValid) {
			addDebugMessage(`Please fill in the following fields: ${emptyFields.join(', ')}`);
		}

		return isValid;
	}

	function addDebugMessage(message: string) {
		debugMessages = [...debugMessages, message];
	}

	onDestroy(() => {
		// Cleanup file URLs
		Object.values(fileUrls).forEach(URL.revokeObjectURL);
	});
</script>

<svelte:window on:resize={handleResize} />
<div class="container mx-auto p-4 flex flex-col md:flex-row gap-4">
	<div class="w-full md:w-1/2">
		<Card class="h-full">
			<div class="p-4">
				<h2 class="text-2xl font-bold mb-4">ID Card Preview</h2>

				{#if !isMobile}
					<!-- Desktop: show both front and back side-by-side/stacked by orientation -->
					<div
						class="canvas-wrapper"
						class:landscape={template?.orientation === 'landscape'}
						class:portrait={template?.orientation === 'portrait'}
					>
						<div class="flex-1">
							<h3 class="text-lg font-semibold mb-2 text-center">Front View</h3>
							{#if template}
								<div
									class="w-full"
									style="aspect-ratio: {template.width_pixels || 1013}/{template.height_pixels ||
										638}"
								>
									<IdCanvas
										bind:this={frontCanvasComponent}
										elements={template.template_elements.filter((el) => el.side === 'front')}
										backgroundUrl={template.front_background.startsWith('http')
											? template.front_background
											: getSupabaseStorageUrl(template.front_background)}
										{formData}
										{fileUploads}
										{imagePositions}
										{fullResolution}
										isDragging={mouseMoving}
										pixelDimensions={template.width_pixels && template.height_pixels
											? { width: template.width_pixels, height: template.height_pixels }
											: null}
										on:ready={() => handleCanvasReady('front')}
										on:error={({ detail }) =>
											addDebugMessage(`Front Canvas Error: ${detail.code} - ${detail.message}`)}
									/>
								</div>
							{/if}
						</div>
						<div class="flex-1">
							<h3 class="text-lg font-semibold mb-2 text-center">Back View</h3>
							{#if template}
								<div
									class="w-full"
									style="aspect-ratio: {template.width_pixels || 1013}/{template.height_pixels ||
										638}"
								>
									<IdCanvas
										bind:this={backCanvasComponent}
										elements={template.template_elements.filter((el) => el.side === 'back')}
										backgroundUrl={template.back_background.startsWith('http')
											? template.back_background
											: getSupabaseStorageUrl(template.back_background)}
										{formData}
										{fileUploads}
										{imagePositions}
										{fullResolution}
										isDragging={mouseMoving}
										pixelDimensions={template.width_pixels && template.height_pixels
											? { width: template.width_pixels, height: template.height_pixels }
											: null}
										on:ready={() => handleCanvasReady('back')}
										on:error={({ detail }) =>
											addDebugMessage(`Back Canvas Error: ${detail.code} - ${detail.message}`)}
									/>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<!-- Mobile: CSS flip card -->
					{#if template}
						<div class="w-full max-w-md mx-auto">
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="flip-container relative cursor-pointer group"
								onclick={() => (isFlipped = !isFlipped)}
								onkeydown={(e) => e.key === 'Enter' && (isFlipped = !isFlipped)}
								role="button"
								tabindex="0"
							>
								<!-- Tap to flip overlay hint -->
								<div
									class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
								>
									<span
										class="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm shadow-lg"
									>
										Tap to Flip
									</span>
								</div>

								<!-- Flip card inner -->
								<div
									class="flip-card-inner"
									class:flipped={isFlipped}
									style="aspect-ratio: {template.width_pixels || 1013}/{template.height_pixels || 638}"
								>
									<!-- Front face -->
									<div class="flip-card-face flip-card-front">
										<IdCanvas
											bind:this={frontCanvasComponent}
											elements={template.template_elements.filter((el) => el.side === 'front')}
											backgroundUrl={template.front_background.startsWith('http')
												? template.front_background
												: getSupabaseStorageUrl(template.front_background)}
											{formData}
											{fileUploads}
											{imagePositions}
											{fullResolution}
											isDragging={mouseMoving}
											pixelDimensions={template.width_pixels && template.height_pixels
												? { width: template.width_pixels, height: template.height_pixels }
												: null}
											on:ready={() => handleCanvasReady('front')}
											on:error={({ detail }) =>
												addDebugMessage(`Front Canvas Error: ${detail.code} - ${detail.message}`)}
										/>
									</div>
									<!-- Back face -->
									<div class="flip-card-face flip-card-back">
										<IdCanvas
											bind:this={backCanvasComponent}
											elements={template.template_elements.filter((el) => el.side === 'back')}
											backgroundUrl={template.back_background.startsWith('http')
												? template.back_background
												: getSupabaseStorageUrl(template.back_background)}
											{formData}
											{fileUploads}
											{imagePositions}
											{fullResolution}
											isDragging={mouseMoving}
											pixelDimensions={template.width_pixels && template.height_pixels
												? { width: template.width_pixels, height: template.height_pixels }
												: null}
											on:ready={() => handleCanvasReady('back')}
											on:error={({ detail }) =>
												addDebugMessage(`Back Canvas Error: ${detail.code} - ${detail.message}`)}
										/>
									</div>
								</div>
							</div>

							<!-- Side indicator -->
							<p class="text-center text-sm text-muted-foreground mt-3">
								{isFlipped ? 'Back' : 'Front'} Side
							</p>
						</div>
					{/if}
				{/if}
			</div>
		</Card>
	</div>
	<div class="w-full md:w-1/2 overflow-hidden">
		<Card class="h-full overflow-auto">
			<div class="p-6 overflow-hidden">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-2xl font-bold">ID Card Form</h2>
				</div>
				<p class="text-muted-foreground mb-6">Please fill out these details for your ID card.</p>

				{#if template && template.template_elements}
					{@const frontElements = template.template_elements.filter(el => el.side === 'front' && el.variableName)}
					{@const backElements = template.template_elements.filter(el => el.side === 'back' && el.variableName)}
					<form
						bind:this={formElement}
						action="?/saveIdCard"
						method="POST"
						enctype="multipart/form-data"
						onsubmit={preventDefault(handleSubmit)}
						use:enhance
					>
						<!-- Front Side Fields -->
						{#if frontElements.length > 0}
							<div class="flex items-center gap-3 mb-4">
								<div class="h-px flex-1 bg-border"></div>
								<span class="text-sm font-medium text-muted-foreground px-2">Front Side</span>
								<div class="h-px flex-1 bg-border"></div>
							</div>
							{#each frontElements as element (element.variableName)}
								<div
									role="button"
									tabindex="-1"
									class="grid grid-cols-[auto_1fr] gap-4 items-center mb-4 min-w-0"
									onmousedown={handleMouseDown}
									onmouseup={handleMouseUp}
								>
									<Label for={element.variableName} class="text-right">
										{element.variableName}
										{#if element.type === 'text' || element.type === 'selection'}
											<span class="text-red-500">*</span>
										{/if}
									</Label>
									{#if element.type === 'text'}
										<div class="w-full">
											<Input
												type="text"
												id={element.variableName}
												name={element.variableName}
												bind:value={formData[element.variableName]}
												class="w-full"
												placeholder={`Enter ${element.variableName}`}
											/>
											{#if formErrors[element.variableName]}
												<p class="mt-1 text-sm text-destructive">This field is required</p>
											{/if}
										</div>
									{:else if element.type === 'selection' && element.options}
										<div class="relative w-full">
											<Select.Root
												type="single"
												value={selectStates[element.variableName]?.value}
												onValueChange={(value) =>
													handleSelectionChange(value, element.variableName)}
											>
												<Select.Trigger class="w-full">
													{triggerContent(element.variableName)}
												</Select.Trigger>
												<Select.Content>
													{#each element.options as option}
														<Select.Item value={option}>
															{option}
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
											{#if formErrors[element.variableName]}
												<p class="mt-1 text-sm text-destructive">Please select an option</p>
											{/if}
										</div>
									{:else if element.type === 'photo' || element.type === 'signature'}
										<ThumbnailInput
											width={element.width}
											height={element.height}
											fileUrl={fileUrls[element.variableName]}
											initialScale={imagePositions[element.variableName]?.scale ?? 1}
											initialX={imagePositions[element.variableName]?.x ?? 0}
											initialY={imagePositions[element.variableName]?.y ?? 0}
											isSignature={element.type === 'signature'}
											on:selectfile={() => handleSelectFile(element.variableName)}
											on:update={(e) => handleImageUpdate(e, element.variableName)}
										/>
									{/if}
								</div>
							{/each}
						{/if}

						<!-- Back Side Fields -->
						{#if backElements.length > 0}
							<div class="flex items-center gap-3 mb-4 {frontElements.length > 0 ? 'mt-6' : ''}">
								<div class="h-px flex-1 bg-border"></div>
								<span class="text-sm font-medium text-muted-foreground px-2">Back Side</span>
								<div class="h-px flex-1 bg-border"></div>
							</div>
							{#each backElements as element (element.variableName)}
								<div
									role="button"
									tabindex="-1"
									class="grid grid-cols-[auto_1fr] gap-4 items-center mb-4 min-w-0"
									onmousedown={handleMouseDown}
									onmouseup={handleMouseUp}
								>
									<Label for={element.variableName} class="text-right">
										{element.variableName}
										{#if element.type === 'text' || element.type === 'selection'}
											<span class="text-red-500">*</span>
										{/if}
									</Label>
									{#if element.type === 'text'}
										<div class="w-full">
											<Input
												type="text"
												id={element.variableName}
												name={element.variableName}
												bind:value={formData[element.variableName]}
												class="w-full"
												placeholder={`Enter ${element.variableName}`}
											/>
											{#if formErrors[element.variableName]}
												<p class="mt-1 text-sm text-destructive">This field is required</p>
											{/if}
										</div>
									{:else if element.type === 'selection' && element.options}
										<div class="relative w-full">
											<Select.Root
												type="single"
												value={selectStates[element.variableName]?.value}
												onValueChange={(value) =>
													handleSelectionChange(value, element.variableName)}
											>
												<Select.Trigger class="w-full">
													{triggerContent(element.variableName)}
												</Select.Trigger>
												<Select.Content>
													{#each element.options as option}
														<Select.Item value={option}>
															{option}
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
											{#if formErrors[element.variableName]}
												<p class="mt-1 text-sm text-destructive">Please select an option</p>
											{/if}
										</div>
									{:else if element.type === 'photo' || element.type === 'signature'}
										<ThumbnailInput
											width={element.width}
											height={element.height}
											fileUrl={fileUrls[element.variableName]}
											initialScale={imagePositions[element.variableName]?.scale ?? 1}
											initialX={imagePositions[element.variableName]?.x ?? 0}
											initialY={imagePositions[element.variableName]?.y ?? 0}
											isSignature={element.type === 'signature'}
											on:selectfile={() => handleSelectFile(element.variableName)}
											on:update={(e) => handleImageUpdate(e, element.variableName)}
										/>
									{/if}
								</div>
							{/each}
						{/if}

						<div class="mt-6 space-y-4">
							<Button type="submit" class="w-full" disabled={loading}>
								{#if loading}
									<Loader class="mr-2 h-4 w-4 animate-spin" />
								{/if}
								Generate and Save ID Card
							</Button>

							{#if error}
								<p class="text-sm text-destructive">{error}</p>
							{/if}
						</div>
					</form>
				{/if}

				{#if debugMessages.length > 0}
					<div class="mt-6 p-4 rounded-lg bg-secondary/10">
						<h3 class="font-bold mb-2">Debug Messages:</h3>
						<div class="space-y-1">
							{#each debugMessages as message}
								<div class="py-1 text-muted-foreground">{message}</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</Card>
	</div>
</div>

<style>
	:global(.dark) {
		color-scheme: dark;
	}

	.canvas-wrapper {
		display: flex;
		gap: 20px;
	}

	.canvas-wrapper.landscape {
		flex-direction: column;
	}

	.canvas-wrapper.portrait {
		flex-direction: row;
	}

	/* CSS 3D Flip Card */
	.flip-container {
		perspective: 1000px;
	}

	.flip-card-inner {
		position: relative;
		width: 100%;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
	}

	.flip-card-inner.flipped {
		transform: rotateY(180deg);
	}

	.flip-card-face {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.flip-card-front {
		position: relative;
	}

	.flip-card-back {
		position: absolute;
		inset: 0;
		transform: rotateY(180deg);
	}

	:global(.select-error) {
		border-color: hsl(var(--destructive));
		--tw-ring-color: hsl(var(--destructive));
	}

	:global(.input-error) {
		border-color: hsl(var(--destructive));
		--tw-ring-color: hsl(var(--destructive));
	}
</style>
