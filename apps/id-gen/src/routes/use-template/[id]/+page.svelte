<script lang="ts">
	import { run, preventDefault } from 'svelte/legacy';
	import { onMount, onDestroy, untrack } from 'svelte';
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
	import { Loader, CheckCircle } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	// Note: Not using enhance - we use manual fetch for custom handling
	import type { TemplateElement } from '$lib/stores/templateStore';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import { idCardsCache, recentCardsCache } from '$lib/stores/dataCache';
	import { clearAllIdsCache } from '../../all-ids/allIdsCache';
	import { clearRemoteFunctionCacheByPrefix } from '$lib/remote/remoteFunctionCache';

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
		borderSize: number;
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
	let templateId = $derived($page.params.id);
	let template: Template = $state(
		untrack(() => ({
			...data.template,
			template_elements: data.template.template_elements.map((element) => ({
				...element,
				width: element.width ?? 100,
				height: element.height ?? 100
			}))
		}))
	);

	$effect(() => {
		template = {
			...data.template,
			template_elements: data.template.template_elements.map((element) => ({
				...element,
				width: element.width ?? 100,
				height: element.height ?? 100
			}))
		};
	});

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
	// Sticky preview scroll state
	let scrollY = $state(0);
	let previewContainerRef = $state<HTMLDivElement | null>(null);
	let cardScalingWrapperRef = $state<HTMLDivElement | null>(null);
	let formContainerRef = $state<HTMLDivElement | null>(null);
	let cardOriginalHeight = $state(0);
	let cardOriginalWidth = $state(0);
	const NAVBAR_HEIGHT = 64; // h-16 = 64px
	const MIN_SCALE = 0.5;
	const GAP = 16; // gap-4 = 16px
	const FIXED_ELEMENTS_HEIGHT = 100; // title (~50px) + face label (~30px) + margins (~20px)
	
	// Calculate the scale based on scroll position
	// Simple approach: scale from 1 to MIN_SCALE based on scroll amount
	let previewScale = $derived.by(() => {
		// At scroll 0, scale is 1. As you scroll, scale decreases.
		// Scale reaches MIN_SCALE after scrolling ~300px
		const scrollThreshold = 300;
		
		if (scrollY <= 0) return 1;
		if (scrollY >= scrollThreshold) return MIN_SCALE;
		
		// Linear interpolation between 1 and MIN_SCALE
		const progress = scrollY / scrollThreshold;
		return 1 - (progress * (1 - MIN_SCALE));
	});
	
	// Calculate the margin compensation in pixels (not percentage - CSS % margins are relative to width, not height!)
	let cardMarginCompensation = $derived((1 - previewScale) * cardOriginalHeight);
	
	// Calculate opacity and height for title and face label (fade out as card scales down)
	// At scale 1.0 -> opacity 1, full height | At MIN_SCALE (0.5) -> opacity 0, height 0
	let labelOpacity = $derived(Math.max(0, (previewScale - MIN_SCALE) / (1 - MIN_SCALE)));
	
	// Combined Backlash + Hysteresis algorithm for anti-jitter
	// Backlash: larger dead zone window around stable scroll position
	let stableScrollY = $state(0);
	const BACKLASH_WINDOW = 50; // Dead zone: ±50px from stable position
	
	$effect(() => {
		// Only update stable scroll if we've moved outside the backlash window
		const diff = Math.abs(scrollY - stableScrollY);
		if (diff > BACKLASH_WINDOW) {
			stableScrollY = scrollY;
		}
	});
	
	// Calculate stable scale from the filtered stable scroll position
	const scrollThreshold = 300;
	let stableScale = $derived.by(() => {
		if (stableScrollY <= 0) return 1;
		if (stableScrollY >= scrollThreshold) return MIN_SCALE;
		return 1 - ((stableScrollY / scrollThreshold) * (1 - MIN_SCALE));
	});
	
	// Hysteresis: different thresholds for collapse vs expand
	// Collapse at scale < 0.75 (scrollY ~150), expand at scale > 0.95 (scrollY ~30)
	let labelsCollapsed = $state(false);
	$effect(() => {
		if (!labelsCollapsed && stableScale < 0.75) {
			labelsCollapsed = true;
		}
		if (labelsCollapsed && stableScale > 0.95) {
			labelsCollapsed = false;
		}
	});
	
	// Height snaps based on collapsed state
	let titleHeight = $derived(labelsCollapsed ? 0 : 50);
	let faceLabelHeight = $derived(labelsCollapsed ? 0 : 30);
	let labelMargins = $derived(labelsCollapsed ? 0 : 1);
	
	// Calculate the minimum container height: padding + scaled card (title/label collapse to 0)
	let containerMinHeight = $derived((cardOriginalHeight * MIN_SCALE) + 32); // 32px for padding
	// Smart auto-flip based on focused input
	let currentInputSide = $state<'front' | 'back'>('front');
	let formErrors = $state<Record<string, boolean>>({});
	
	// Highlight glow state for focused input elements (form -> preview mapping)
	let focusedVariableName = $state<string | null>(null);
	let highlightState = $state<'off' | 'idle' | 'active'>('off');
	let highlightTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Zoom state
	let zoomState = $state<'idle' | 'zoomed'>('idle');
	
	// Dynamic zoom transform calculation (derived from state + scroll position)
	let zoomTransform = $derived.by(() => {
		if (!focusedVariableName || !template?.template_elements || !cardOriginalWidth || !cardOriginalHeight) {
			return { x: 0, y: 0, scale: 1 };
		}

		// 1. Find the element
		const element = template.template_elements.find(el => el.variableName === focusedVariableName && el.side === (isFlipped ? 'back' : 'front'));
		if (!element) return { x: 0, y: 0, scale: 1 };

		// 2. Get Card Dimensions (Template vs Rendered)
		const tmplWidth = template.width_pixels || 1013;
		const tmplHeight = template.height_pixels || 638;
		
		// Conversion ratio (Template Pixels -> Rendered DOM Pixels)
		const widthRatio = cardOriginalWidth / tmplWidth;
		const heightRatio = cardOriginalHeight / tmplHeight;
		// Use width ratio as primary if aspect ratio is preserved (it is)
		const pxScale = widthRatio; 

		// 3. Get Element Dimensions & Position (Converted to DOM Pixels)
		const elX = (element.x || 0) * pxScale;
		const elY = (element.y || 0) * pxScale;
		const elW = (element.width || 100) * pxScale;
		const elH = (element.height || 100) * pxScale;

		// 4. Calculate Center of Element (in DOM Pixels)
		const elCenterX = elX + (elW / 2);
		const elCenterY = elY + (elH / 2);

		// 5. Determine Zoom Scale
		// Aim for element filling ~40-60% of container
		// We use the rendered dimensions for this calculation
		const wRatioScale = cardOriginalWidth / elW;
		const hRatioScale = cardOriginalHeight / elH;
		
		let rawScale = Math.min(wRatioScale, hRatioScale) * 0.5;
		rawScale = Math.min(Math.max(rawScale, 1.0), 3.0); // Allow slightly deeper zoom (3.0x) since we are accurate now

		// 6. Calculate Translation to Center
		// Visible viewport logic matches our previous mask fix
		const VISIBLE_HEIGHT = cardOriginalHeight * previewScale; 
		const VIEWPORT_CENTER_X = 0; 
		const VIEWPORT_CENTER_Y = VISIBLE_HEIGHT / 2;

		// Relative position from Transform Origin (Top-Center of rendered card)
		const relX = elCenterX - (cardOriginalWidth / 2);
		const relY = elCenterY;

		// Formula: translate(tx, ty) scale(s)
		const tx = VIEWPORT_CENTER_X - (rawScale * relX);
		const ty = VIEWPORT_CENTER_Y - (rawScale * relY);

		return {
			x: tx,
			y: ty,
			scale: rawScale
		};
	});
	
	let fileUrls = $state<Record<string, string>>({});

	// Overlay states for confirmation and success flows
	let showConfirmation = $state(false);
	let showSuccess = $state(false);
	let redirectCountdown = $state(3);
	let confirmationShowingFront = $state(true);
	let renderedFrontUrl = $state<string | null>(null);
	let renderedBackUrl = $state<string | null>(null);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

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
					scale: 1,
					borderSize: 0
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
		
		// Measure card scaling wrapper height after a tick to ensure it's rendered
		await new Promise(resolve => setTimeout(resolve, 100));
		if (cardScalingWrapperRef) {
			cardOriginalHeight = cardScalingWrapperRef.offsetHeight;
			cardOriginalWidth = cardScalingWrapperRef.offsetWidth;
		}
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

		// Pulse highlight to show where the change applied
		handleInputChange();
	}

	function handleImageUpdate(
		event: CustomEvent<{ scale: number; x: number; y: number; borderSize: number }>,
		variableName: string
	) {
		const { scale, x, y, borderSize } = event.detail;
		// Use immutable assignment to ensure reactivity during drag/resize
		imagePositions = {
			...imagePositions,
			[variableName]: {
				...imagePositions[variableName],
				scale,
				x,
				y,
				borderSize
			}
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		try {
			if (!validateForm()) {
				error = 'Please fill in all required fields including photos';
				return;
			}

			error = null;

			if (!template || !frontCanvasComponent || !backCanvasComponent) {
				error = 'Missing required components';
				return;
			}

			// Render preview images for confirmation overlay
			const [frontBlob, backBlob] = await Promise.all([
				frontCanvasComponent.renderFullResolution(),
				backCanvasComponent.renderFullResolution()
			]);

			// Create URLs for preview
			if (renderedFrontUrl) URL.revokeObjectURL(renderedFrontUrl);
			if (renderedBackUrl) URL.revokeObjectURL(renderedBackUrl);
			renderedFrontUrl = URL.createObjectURL(frontBlob);
			renderedBackUrl = URL.createObjectURL(backBlob);

			// Show confirmation overlay instead of submitting
			confirmationShowingFront = true;
			showConfirmation = true;
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		}
	}

	function toggleConfirmationCard() {
		confirmationShowingFront = !confirmationShowingFront;
	}

	function cancelConfirmation() {
		showConfirmation = false;
	}

	async function confirmAndSubmit() {
		// Keep the overlay OPEN while loading so we can see the loading state
		loading = true;
		error = null;

		try {
			if (!template || !frontCanvasComponent || !backCanvasComponent || !formElement) {
				error = 'Missing required components';
				loading = false;
				return;
			}

			// Re-render at full resolution for submission
			const [frontBlob, backBlob] = await Promise.all([
				frontCanvasComponent.renderFullResolution(),
				backCanvasComponent.renderFullResolution()
			]);

			const submitFormData = new FormData(formElement);
			submitFormData.append('templateId', $page.params.id);
			submitFormData.append('frontImage', frontBlob, 'front.png');
			submitFormData.append('backImage', backBlob, 'back.png');

			const response = await fetch('?/saveIdCard', {
				method: 'POST',
				body: submitFormData
			});

			const result = await response.json();
			console.log('[Save] Full response:', JSON.stringify(result, null, 2));

			const isSuccess =
				result.type === 'success' ||
				result?.data?.[0]?.success === true ||
				result?.data?.[1]?.type === 'success' ||
				(response.ok && result?.data?.[0]?.idCardId);

			if (isSuccess) {
				console.log('[Save] Success! Clearing ALL caches aggressively...');

				clearAllIdsCache();

				const userId = $user?.id ?? 'anon';
				const orgId = $page.data?.org_id ?? 'no-org';
				const scopeKey = `${userId}:${orgId}`;
				clearRemoteFunctionCacheByPrefix(`idgen:rf:v1:${scopeKey}:all-ids:`);

				try {
					const keysToRemove: string[] = [];
					for (let i = 0; i < window.sessionStorage.length; i++) {
						const key = window.sessionStorage.key(i);
						if (key && (key.includes('idgen') || key.includes('all-ids'))) {
							keysToRemove.push(key);
						}
					}
					keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
				} catch (e) {
					console.error('[Save] Error clearing sessionStorage:', e);
				}

				idCardsCache.invalidate();
				recentCardsCache.invalidate();
				
				// Hide confirmation overlay and show success overlay
				showConfirmation = false;
				showSuccess = true;
				startSuccessCountdown();
			} else {
				const errorMsg = result?.data?.[0]?.error || result?.error || 'Failed to save ID card';
				error = errorMsg;
				showConfirmation = false; // Return to form on error
				console.error('[Save] Error:', errorMsg, 'Full result:', result);
			}
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
			showConfirmation = false; // Return to form on error
		} finally {
			loading = false;
		}
	}

	function startSuccessCountdown() {
		redirectCountdown = 3;
		// Wait for flip animation to complete (1.2s), then start countdown
		setTimeout(() => {
			countdownInterval = setInterval(() => {
				redirectCountdown--;
				if (redirectCountdown <= 0) {
					if (countdownInterval) clearInterval(countdownInterval);
					window.location.href = '/all-ids';
				}
			}, 1000);
		}, 1200);
	}

	function createAnotherCard() {
		// Stop countdown if running
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}

		// Reset state
		showSuccess = false;
		showConfirmation = false;
		formData = {};
		fileUploads = {};
		fileUrls = {};
		imagePositions = {};
		formErrors = {};
		error = '';
		redirectCountdown = 3;

		// Re-initialize form data
		initializeFormData();
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

	function handleScroll() {
		if (typeof window !== 'undefined') {
			scrollY = window.scrollY;
		}
	}

	// Smart auto-flip: detect which side the focused input belongs to
	function handleInputFocus(side: 'front' | 'back', variableName?: string) {
		currentInputSide = side;
		isFlipped = side === 'back';
		
		// Show highlight for this element
		if (variableName) {
			focusedVariableName = variableName;
			highlightState = 'idle';
			
			// Clear any existing highlight timer
			if (highlightTimeout) {
				clearTimeout(highlightTimeout);
				highlightTimeout = null;
			}
			
			// Reset zoom on fresh focus change (wait for type to zoom)
			zoomState = 'idle';
		}
	}
	
	// Handle input blur - fade out highlight and reset zoom
	function handleInputBlur() {
		// Start fade-out animation
		highlightState = 'off';
		zoomState = 'idle';
		
		// Clear the focused variable after fade animation completes
		if (highlightTimeout) clearTimeout(highlightTimeout);
		highlightTimeout = setTimeout(() => {
			focusedVariableName = null;
		}, 250); // Match the CSS transition duration
	}
	
	// Trigger highlight pulse on value change (pulse, then minimize)
	function handleInputChange() {
		if (focusedVariableName) {
			// Boost the highlight briefly
			highlightState = 'active';

			// Activate Zoom (calculation is now derived)
			zoomState = 'zoomed';

			// Clear existing timeout
			if (highlightTimeout) clearTimeout(highlightTimeout);

			// Return to a subtle idle highlight after a brief moment
			highlightTimeout = setTimeout(() => {
				// Only minimize if we're still highlighting something
				if (focusedVariableName) highlightState = 'idle';
			}, 500);
		}
	}

	function handleSelectFile(variableName: string, file: File) {
		// Use immutable assignment to ensure Svelte reactivity triggers for IdCanvas
		fileUploads = {
			...fileUploads,
			[variableName]: file
		};

		if (fileUrls[variableName]) {
			URL.revokeObjectURL(fileUrls[variableName]);
		}

		const url = URL.createObjectURL(file);
		fileUrls[variableName] = url;

		// Pulse highlight to show where the change applied
		handleInputChange();
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
			// Validate photo and signature fields - prevent blank IDs
			if (element.type === 'photo' || element.type === 'signature') {
				if (!fileUploads[element.variableName]) {
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
		// Cleanup rendered URLs
		if (renderedFrontUrl) URL.revokeObjectURL(renderedFrontUrl);
		if (renderedBackUrl) URL.revokeObjectURL(renderedBackUrl);
		// Clear countdown interval
		if (countdownInterval) clearInterval(countdownInterval);
	});
</script>

<svelte:window on:resize={handleResize} on:scroll={handleScroll} />
<div class="container mx-auto p-4 flex flex-col gap-4 max-w-2xl">
	<!-- Sticky Preview Container -->
	<div 
		class="sticky top-[68px] z-10" 
		bind:this={previewContainerRef}
		style="min-height: {containerMinHeight}px;"
	>
		<Card>
			<div class="p-4">
				<h2 
					class="text-2xl font-bold overflow-hidden"
					style="opacity: {labelOpacity}; height: {titleHeight}px; margin-bottom: {labelMargins * 16}px; transition: opacity 200ms ease-out, height 200ms ease-out, margin-bottom 200ms ease-out; will-change: opacity, height;"
				>ID Card Preview</h2>

				{#if template}
					<!-- Masking Container with Border -->
					<div 
						class="w-full mx-auto relative overflow-hidden rounded-lg transition-all duration-300 {zoomState === 'zoomed' ? 'max-w-full' : 'max-w-md'}"
						style="
							height: {cardOriginalHeight ? `${cardOriginalHeight * previewScale}px` : 'auto'};
						"
					>
						<!-- Scaling wrapper - only the card scales -->
						<div 
							bind:this={cardScalingWrapperRef}
							class="origin-top w-full max-w-md mx-auto"
							style="
								transform: {zoomState === 'zoomed' 
									? `translate(${zoomTransform.x}px, ${zoomTransform.y}px) scale(${zoomTransform.scale})` 
									: `scale(${previewScale})`};
								margin-bottom: -{cardMarginCompensation}px;
								transition: transform 300ms cubic-bezier(0.2, 0, 0.2, 1), margin-bottom 300ms ease-out;
								will-change: transform;
								z-index: 10;
								position: relative;
							"
						>
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
									style="aspect-ratio: {template.width_pixels || 1013}/{template.height_pixels ||
										638}"
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
										<!-- Highlight overlay for front elements -->
										{#if focusedVariableName}
											{@const focusedElement = template.template_elements.find(
												(el) => el.variableName === focusedVariableName && el.side === 'front'
											)}
											{#if focusedElement}
												{@const cardWidth = template.width_pixels || 1013}
												{@const cardHeight = template.height_pixels || 638}
										<div 
											class="element-highlight-overlay state-{highlightState}"
											style="
												left: {((focusedElement.x || 0) / cardWidth) * 100}%;
												top: {((focusedElement.y || 0) / cardHeight) * 100}%;
												width: {((focusedElement.width || 100) / cardWidth) * 100}%;
												height: {((focusedElement.height || 100) / cardHeight) * 100}%;
											"
										></div>
											{/if}
										{/if}
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
										<!-- Highlight overlay for back elements -->
										{#if focusedVariableName}
											{@const focusedElement = template.template_elements.find(
												(el) => el.variableName === focusedVariableName && el.side === 'back'
											)}
											{#if focusedElement}
												{@const cardWidth = template.width_pixels || 1013}
												{@const cardHeight = template.height_pixels || 638}
										<div 
											class="element-highlight-overlay state-{highlightState}"
											style="
												left: {((focusedElement.x || 0) / cardWidth) * 100}%;
												top: {((focusedElement.y || 0) / cardHeight) * 100}%;
												width: {((focusedElement.width || 100) / cardWidth) * 100}%;
												height: {((focusedElement.height || 100) / cardHeight) * 100}%;
											"
										></div>
											{/if}
										{/if}
									</div>
								</div>
							</div>
						</div>

						<!-- Side indicator - fades out with collapse -->
						<p 
							class="text-center text-sm text-muted-foreground overflow-hidden"
							style="opacity: {labelOpacity}; height: {faceLabelHeight}px; margin-top: {labelMargins * 12}px; transition: opacity 200ms ease-out, height 200ms ease-out, margin-top 200ms ease-out; will-change: opacity, height;"
						>
							{isFlipped ? 'Back' : 'Front'} Side
						</p>
					</div>
				{/if}
			</div>
		</Card>
	</div>
	<div class="w-full overflow-hidden" bind:this={formContainerRef}>
		<Card class="h-full overflow-auto">
			<div class="p-6 overflow-hidden">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-2xl font-bold">ID Card Form</h2>
				</div>

				<!-- Warning marquee -->
				<div class="overflow-hidden mb-6">
					<div class="marquee-track">
						<span class="marquee-content">All data submitted is final. Please double check before saving.&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;</span>
						<span class="marquee-content">All data submitted is final. Please double check before saving.&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;</span>
						<span class="marquee-content">All data submitted is final. Please double check before saving.&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;</span>
						<span class="marquee-content">All data submitted is final. Please double check before saving.&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;</span>
					</div>
				</div>

				{#if template && template.template_elements}
					{@const frontElements = template.template_elements.filter(
						(el) => el.side === 'front' && el.variableName
					)}
					{@const backElements = template.template_elements.filter(
						(el) => el.side === 'back' && el.variableName
					)}
					<form
						bind:this={formElement}
						action="?/saveIdCard"
						method="POST"
						enctype="multipart/form-data"
						onsubmit={preventDefault(handleSubmit)}
					>
						<!-- Front Side Fields -->
						{#if frontElements.length > 0}
							<div class="flex items-center gap-3 mb-4">
								<div class="h-px flex-1 bg-border"></div>
								<span class="text-sm font-medium text-muted-foreground px-2">Front Side</span>
								<div class="h-px flex-1 bg-border"></div>
							</div>
							{#each frontElements as element (element.variableName)}
								{#if element.type === 'photo' || element.type === 'signature'}
									<!-- Photo/Signature with dedicated container -->
									<div class="mb-6">
										{#if !isMobile}
											<div class="grid grid-cols-[7rem_1fr] gap-4 items-start">
												<Label for={element.variableName} class="text-right pt-2 text-sm font-medium">
													{element.variableName}
													<span class="text-red-500">*</span>
												</Label>
													<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-h-80 flex items-center justify-center" onclick={() => handleInputFocus('front', element.variableName)} onkeydown={(e) => e.key === 'Enter' && handleInputFocus('front', element.variableName)} role="button" tabindex="0">
													<div class="flex-shrink-0">
														<ThumbnailInput
															width={element.width}
															height={element.height}
															fileUrl={fileUrls[element.variableName]}
															initialScale={imagePositions[element.variableName]?.scale ?? 1}
															initialX={imagePositions[element.variableName]?.x ?? 0}
															initialY={imagePositions[element.variableName]?.y ?? 0}
															initialBorderSize={imagePositions[element.variableName]?.borderSize ?? 0}
															isSignature={element.type === 'signature'}
															on:selectfile={(e) => handleSelectFile(element.variableName, e.detail.file)}
															on:update={(e) => handleImageUpdate(e, element.variableName)}
															on:dragstart={() => (mouseMoving = true)}
															on:dragend={() => (mouseMoving = false)}
														/>
													</div>
												</div>
											</div>
										{:else}
											<Label for={element.variableName} class="block mb-2 text-sm font-medium">
												{element.variableName}
												<span class="text-red-500">*</span>
											</Label>
											<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-h-80 flex items-center justify-center" onclick={() => handleInputFocus('front', element.variableName)} onkeydown={(e) => e.key === 'Enter' && handleInputFocus('front', element.variableName)} role="button" tabindex="0">
												<div class="flex-shrink-0">
													<ThumbnailInput
														width={element.width}
														height={element.height}
														fileUrl={fileUrls[element.variableName]}
														initialScale={imagePositions[element.variableName]?.scale ?? 1}
														initialX={imagePositions[element.variableName]?.x ?? 0}
														initialY={imagePositions[element.variableName]?.y ?? 0}
														initialBorderSize={imagePositions[element.variableName]?.borderSize ?? 0}
														isSignature={element.type === 'signature'}
														on:selectfile={(e) => handleSelectFile(element.variableName, e.detail.file)}
														on:update={(e) => handleImageUpdate(e, element.variableName)}
														on:dragstart={() => (mouseMoving = true)}
														on:dragend={() => (mouseMoving = false)}
													/>
												</div>
											</div>
										{/if}
										{#if formErrors[element.variableName]}
											<p class="mt-2 text-sm text-destructive {!isMobile ? 'ml-[7.5rem]' : ''}">
												{element.type === 'signature' ? 'Signature' : 'Photo'} is required
											</p>
										{/if}
									</div>
								{:else}
									<!-- Text/Selection inputs -->
									<div
										role="button"
										tabindex="-1"
										class="{!isMobile ? 'grid grid-cols-[7rem_1fr] gap-4 items-center' : ''} mb-4"
										onmousedown={handleMouseDown}
										onmouseup={handleMouseUp}
									>
										<Label for={element.variableName} class="{!isMobile ? 'text-right' : 'block mb-2'} text-sm font-medium">
											{element.variableName}
											<span class="text-red-500">*</span>
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
														onfocus={() => handleInputFocus('front', element.variableName)}
														onblur={handleInputBlur}
														oninput={handleInputChange}
													/>
												{#if formErrors[element.variableName]}
													<p class="mt-1 text-sm text-destructive">This field is required</p>
												{/if}
											</div>
										{:else if element.type === 'selection' && element.options}
														<div
															class="w-full"
															onfocusin={() => handleInputFocus('front', element.variableName)}
															onfocusout={handleInputBlur}
														>
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
										{/if}
									</div>
								{/if}
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
								{#if element.type === 'photo' || element.type === 'signature'}
									<!-- Photo/Signature with dedicated container -->
									<div class="mb-6">
										{#if !isMobile}
											<div class="grid grid-cols-[7rem_1fr] gap-4 items-start">
												<Label for={element.variableName} class="text-right pt-2 text-sm font-medium">
													{element.variableName}
													<span class="text-red-500">*</span>
												</Label>
													<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-h-80 flex items-center justify-center" onclick={() => handleInputFocus('back', element.variableName)} onkeydown={(e) => e.key === 'Enter' && handleInputFocus('back', element.variableName)} role="button" tabindex="0">
													<div class="flex-shrink-0">
														<ThumbnailInput
															width={element.width}
															height={element.height}
															fileUrl={fileUrls[element.variableName]}
															initialScale={imagePositions[element.variableName]?.scale ?? 1}
															initialX={imagePositions[element.variableName]?.x ?? 0}
															initialY={imagePositions[element.variableName]?.y ?? 0}
															initialBorderSize={imagePositions[element.variableName]?.borderSize ?? 0}
															isSignature={element.type === 'signature'}
															on:selectfile={(e) => handleSelectFile(element.variableName, e.detail.file)}
															on:update={(e) => handleImageUpdate(e, element.variableName)}
															on:dragstart={() => (mouseMoving = true)}
															on:dragend={() => (mouseMoving = false)}
														/>
													</div>
												</div>
											</div>
										{:else}
											<Label for={element.variableName} class="block mb-2 text-sm font-medium">
												{element.variableName}
												<span class="text-red-500">*</span>
											</Label>
											<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-h-80 flex items-center justify-center" onclick={() => handleInputFocus('back', element.variableName)} onkeydown={(e) => e.key === 'Enter' && handleInputFocus('back', element.variableName)} role="button" tabindex="0">
												<div class="flex-shrink-0">
													<ThumbnailInput
														width={element.width}
														height={element.height}
														fileUrl={fileUrls[element.variableName]}
														initialScale={imagePositions[element.variableName]?.scale ?? 1}
														initialX={imagePositions[element.variableName]?.x ?? 0}
														initialY={imagePositions[element.variableName]?.y ?? 0}
														initialBorderSize={imagePositions[element.variableName]?.borderSize ?? 0}
														isSignature={element.type === 'signature'}
														on:selectfile={(e) => handleSelectFile(element.variableName, e.detail.file)}
														on:update={(e) => handleImageUpdate(e, element.variableName)}
														on:dragstart={() => (mouseMoving = true)}
														on:dragend={() => (mouseMoving = false)}
													/>
												</div>
											</div>
										{/if}
										{#if formErrors[element.variableName]}
											<p class="mt-2 text-sm text-destructive {!isMobile ? 'ml-[7.5rem]' : ''}">
												{element.type === 'signature' ? 'Signature' : 'Photo'} is required
											</p>
										{/if}
									</div>
								{:else}
									<!-- Text/Selection inputs -->
									<div
										role="button"
										tabindex="-1"
										class="{!isMobile ? 'grid grid-cols-[7rem_1fr] gap-4 items-center' : ''} mb-4"
										onmousedown={handleMouseDown}
										onmouseup={handleMouseUp}
									>
										<Label for={element.variableName} class="{!isMobile ? 'text-right' : 'block mb-2'} text-sm font-medium">
											{element.variableName}
											<span class="text-red-500">*</span>
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
														onfocus={() => handleInputFocus('back', element.variableName)}
														onblur={handleInputBlur}
														oninput={handleInputChange}
													/>
												{#if formErrors[element.variableName]}
													<p class="mt-1 text-sm text-destructive">This field is required</p>
												{/if}
											</div>
										{:else if element.type === 'selection' && element.options}
														<div
															class="w-full"
															onfocusin={() => handleInputFocus('back', element.variableName)}
															onfocusout={handleInputBlur}
														>
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
										{/if}
									</div>
								{/if}
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

<!-- Confirmation Overlay -->
<!-- Confirmation Overlay -->
{#if showConfirmation}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<!-- Heading -->
		<h2 class="text-2xl font-bold text-center mb-8 text-white">
			Confirm Your ID Card
		</h2>

		<!-- Flippable Card Preview Container -->
		<div
			class="confirmation-flip-container mx-auto cursor-pointer mb-8 relative"
			style="max-width: 300px; width: 100%;"
			onclick={toggleConfirmationCard}
			onkeydown={(e) => e.key === 'Enter' && toggleConfirmationCard()}
			role="button"
			tabindex="0"
		>
			<!-- Card Flipping Content -->
			<div
				class="confirmation-flip-inner"
				class:flipped={!confirmationShowingFront}
				style="aspect-ratio: {template?.width_pixels || 1013}/{template?.height_pixels || 638}"
			>
				<div class="confirmation-flip-face confirmation-flip-front">
					{#if renderedFrontUrl}
						<img
							src={renderedFrontUrl}
							alt="ID Card Front"
							class="w-full h-full object-contain rounded-lg shadow-2xl"
						/>
					{/if}
				</div>
				<div class="confirmation-flip-face confirmation-flip-back">
					{#if renderedBackUrl}
						<img
							src={renderedBackUrl}
							alt="ID Card Back"
							class="w-full h-full object-contain rounded-lg shadow-2xl"
						/>
					{/if}
				</div>
			</div>

			<!-- Loading Overlay ON TOP of the card (seamless transition to success) -->
			{#if loading}
				<div 
					class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 rounded-lg backdrop-blur-[2px]"
					transition:fade={{ duration: 200 }}
				>
					<Loader class="w-12 h-12 text-white animate-spin drop-shadow-lg" />
					<p class="text-white font-medium mt-2 drop-shadow-md">Saving...</p>
				</div>
			{/if}
		</div>

		<p class="text-center text-sm text-white/50 mb-8">
			Tap card to flip • Showing {confirmationShowingFront ? 'Front' : 'Back'}
		</p>

		<!-- Action Buttons -->
		<div class="flex flex-col gap-3 w-full max-w-xs px-4">
			<Button 
				size="lg" 
				class="w-full bg-white text-black hover:bg-gray-200 font-semibold" 
				onclick={confirmAndSubmit} 
				disabled={loading}
			>
				Yes, create card
			</Button>
			<Button 
				variant="ghost" 
				class="w-full text-white hover:bg-white/10" 
				onclick={cancelConfirmation}
				disabled={loading}
			>
				No, go back
			</Button>
		</div>
	</div>
{/if}

<!-- Success Overlay -->
{#if showSuccess}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
		transition:fade={{ duration: 200 }}
	>
		<!-- Flipping Card Animation -->
		<div class="success-flip-container mb-6" style="max-width: 300px; width: 100%;">
			<div
				class="success-flip-animation"
				style="aspect-ratio: {template?.width_pixels || 1013}/{template?.height_pixels || 638}"
			>
				{#if renderedFrontUrl}
					<img
						src={renderedFrontUrl}
						alt="ID Card"
						class="w-full h-full object-contain rounded-lg shadow-2xl"
					/>
				{/if}
			</div>
		</div>

		<!-- Success Message -->
		<div class="text-center px-4">
			<div class="flex items-center justify-center gap-2 mb-2">
				<CheckCircle size={28} class="text-green-400" />
				<h2 class="text-2xl font-bold text-white">
					"{template?.name}" card created!
				</h2>
			</div>

			<p class="text-white/70 mb-6">
				Redirecting to All IDs in {redirectCountdown}...
			</p>

			<Button variant="secondary" onclick={createAnotherCard} class="min-w-[200px]">
				Create Another Card
			</Button>
		</div>
	</div>
{/if}

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

	/* Form -> Preview highlight overlay */
	.element-highlight-overlay {
		position: absolute;
		z-index: 5;
		pointer-events: none;
		box-sizing: border-box;
		border: 2px solid rgba(59, 130, 246, 0.9);
		opacity: 0;
		transform: scale(1);
		transition:
			opacity 250ms ease,
			box-shadow 250ms ease,
			transform 250ms ease;
	}

	.element-highlight-overlay.state-idle {
		opacity: 0.35;
		box-shadow:
			0 0 0 2px rgba(59, 130, 246, 0.12),
			0 0 14px rgba(59, 130, 246, 0.22);
	}

	.element-highlight-overlay.state-active {
		opacity: 0.95;
		animation: elementGlowPulse 900ms ease-out;
		box-shadow:
			0 0 0 2px rgba(59, 130, 246, 0.45),
			0 0 18px rgba(59, 130, 246, 0.6),
			0 0 48px rgba(59, 130, 246, 0.25);
		transform: scale(1.01);
	}

	.element-highlight-overlay.state-off {
		opacity: 0;
		box-shadow: none;
		transform: scale(1);
	}

	@keyframes elementGlowPulse {
		0% {
			box-shadow:
				0 0 0 2px rgba(59, 130, 246, 0.65),
				0 0 22px rgba(59, 130, 246, 0.65),
				0 0 60px rgba(59, 130, 246, 0.3);
			transform: scale(1.02);
		}
		100% {
			box-shadow:
				0 0 0 2px rgba(59, 130, 246, 0.12),
				0 0 14px rgba(59, 130, 246, 0.22);
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.element-highlight-overlay.state-active {
			animation: none;
		}
	}

	:global(.select-error) {
		border-color: hsl(var(--destructive));
		--tw-ring-color: hsl(var(--destructive));
	}

	:global(.input-error) {
		border-color: hsl(var(--destructive));
		--tw-ring-color: hsl(var(--destructive));
	}

	/* Confirmation Overlay Flip Card */
	.confirmation-flip-container {
		perspective: 1000px;
	}

	.confirmation-flip-inner {
		position: relative;
		width: 100%;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
	}

	.confirmation-flip-inner.flipped {
		transform: rotateY(180deg);
	}

	.confirmation-flip-face {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.confirmation-flip-front {
		position: relative;
	}

	.confirmation-flip-back {
		position: absolute;
		inset: 0;
		transform: rotateY(180deg);
	}

	/* Success Overlay 3x Flip Animation */
	.success-flip-container {
		perspective: 1000px;
	}

	.success-flip-animation {
		animation: flipCard3x 1.2s ease-in-out;
		transform-style: preserve-3d;
	}

	@keyframes flipCard3x {
		0% {
			transform: rotateY(0deg);
		}
		33% {
			transform: rotateY(180deg);
		}
		66% {
			transform: rotateY(360deg);
		}
		100% {
			transform: rotateY(540deg);
		}
	}

	/* Marquee animation - continuous loop */
	.marquee-track {
		display: flex;
		width: max-content;
		animation: marquee 30s linear infinite;
	}

	.marquee-content {
		flex-shrink: 0;
		font-size: 0.875rem;
		font-style: italic;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
</style>
