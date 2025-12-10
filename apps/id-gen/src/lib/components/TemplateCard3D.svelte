<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { Text, interactivity } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount, onDestroy } from 'svelte';
	import { createRoundedRectCard } from '$lib/utils/cardGeometry';
	import {
		CARD3D_CONSTANTS,
		MORPH_SHAPES,
		getRotationSpeed,
		getCardDimensions,
		getShapeOrientation,
		// Animation controller
		updateSpinAnimation,
		initWobble,
		updateWobble,
		updateOscillation,
		triggerTemplateChangeSpin,
		triggerBeatSpin,
		// Beat controller
		checkBeat,
		getNextShapeIndex,
		getNextShowcaseIndex,
		// Overlay helpers
		elementTo3D,
		getElementColor,
		getFontUrl,
		generateRandomText,
		mutateText,
		// Tap controller
		initTapWobble,
		updateTapWobble,
		uvToLocalCoords
	} from './card3d';
	import { TextureManager } from './card3d';
	import type {
		TemplateElementOverlay,
		ShowcaseImage,
		CachedGeometry,
		WobbleState,
		TapWobbleState
	} from './card3d';


	interface Props {
		imageUrl?: string | null;
		backImageUrl?: string | null;
		rotating?: boolean;
		widthPixels?: number;
		heightPixels?: number;
		templateId?: string | null;
		templateElements?: TemplateElementOverlay[];
		showOverlays?: boolean;
		showColors?: boolean;
		showBorders?: boolean;
		showText?: boolean;
		showIcons?: boolean;
		animateText?: boolean;
		onRotationChange?: (rotationY: number, isSlowSpin: boolean) => void;
		// Showcase mode: cycle through images while morphing
		showcaseImages?: ShowcaseImage[];
		// Unified beat timing - controls texture swaps, shape morphs, and spins
		beatMs?: number;
		// Click handler for immediate image change
		onCardClick?: () => void;
		// Loading progress callback for preloading bar
		onLoadingProgress?: (progress: number, loaded: number, total: number, isReady: boolean) => void;
		// Beat callback for parent UI (beat counter, current action)
		onBeat?: (beatCount: number, action: 'texture' | 'shape' | 'spin') => void;
		// Animation controls
		spinSpeed?: number;
		wobbleStrength?: number;
		wobbleOscillations?: number;
		wobbleLinger?: number;
		// Tap pressure callback for debug panel
		onTapPressureChange?: (pressure: number) => void;
	}

	let {
		imageUrl = null,
		backImageUrl = null,
		rotating = true,
		widthPixels = 1013,
		heightPixels = 638,
		templateId = null,
		templateElements = [],
		showOverlays = true,
		showColors = false,
		showBorders = true,
		showText = true,
		showIcons = true,
		animateText = true,
		onRotationChange,
		showcaseImages = [],
		beatMs = 1500,
		onCardClick,
		onLoadingProgress,
		onBeat,
		spinSpeed = 0.04,
		wobbleStrength = 0.05,
		wobbleOscillations = 3,
		wobbleLinger = 1.0,
		onTapPressureChange
	}: Props = $props();

	// Enable interactivity for mesh click events with UV coordinates
	interactivity();

	// TextureManager handles all texture loading/caching
	let textureManager: TextureManager;

	// Geometry state
	let frontGeometry = $state<THREE.BufferGeometry | null>(null);
	let backGeometry = $state<THREE.BufferGeometry | null>(null);
	let edgeGeometry = $state<THREE.BufferGeometry | null>(null);

	// Texture state
	let texture = $state<THREE.Texture | null>(null);
	let backTexture = $state<THREE.Texture | null>(null);
	let loading = $state(false);
	let error = $state(false);

	// Rotation/spin state
	let rotationY = $state(0);
	let spinAnimation = $state(false);
	let spinTarget = $state(0);
	let spinStartRotation = $state(0);
	let spinProgress = $state(0);
	let finalAngle = $state(0);

	// Oscillating tilt
	let oscillateTime = $state(0);
	let tiltX = $state(CARD3D_CONSTANTS.BASE_TILT_X);

	// Wobble effect (multi-axis)
	let wobbleActive = $state(false);
	let wobbleProgress = $state(0);
	let wobbleSpinDirection = $state(1);
	let wobbleIntensity = $state(0);
	let wobbleOscillationCount = $state(3);
	let wobbleEffectiveLinger = $state(1.0);
	let wobbleOffsetX = $state(0);
	let wobbleOffsetY = $state(0);
	let wobbleOffsetZ = $state(0);
	let wobblePhaseX = $state(0);
	let wobblePhaseY = $state(0);
	let wobblePhaseZ = $state(0);
	let wobblePreCalculated = $state(false);
	let wobbleInitialOffsets = $state({ x: 0, y: 0, z: 0 });

	// Tap wobble state (separate from spin wobble, runs in parallel)
	let tapWobbleActive = $state(false);
	let tapWobbleProgress = $state(0);
	let tapPressure = $state(0);
	let tapWobbleIntensity = $state(0);
	let tapWobbleLinger = $state(2.0);
	let tapX = $state(0);
	let tapY = $state(0);
	let tapOffsetX = $state(0);
	let tapOffsetY = $state(0);
	let tapOffsetZ = $state(0);
	let lastTapTime = $state(0); // Track time for succession stacking



	// Morphing animation state
	let morphTime = $state(0);
	let morphGeometries = $state<CachedGeometry[]>([]);
	let morphGeometriesLoaded = $state(false);

	// Available orientations from showcase images
	const availableOrientations = $derived(() => {
		const orientations = new Set<'landscape' | 'portrait'>();
		showcaseImages.forEach(img => {
			if (img.orientation) orientations.add(img.orientation);
		});
		return orientations;
	});

	// Valid shapes (only those with matching textures)
	const validMorphShapeIndices = $derived(() => {
		const orientations = availableOrientations();
		if (orientations.size === 0) return [0]; // Fallback to first shape if no textures

		const indices: number[] = [];
		MORPH_SHAPES.forEach((shape, index) => {
			const shapeOrientation = shape.w >= shape.h ? 'landscape' : 'portrait';
			if (orientations.has(shapeOrientation)) {
				indices.push(index);
			}
		});
		return indices.length > 0 ? indices : [0]; // Fallback to first shape
	});

	// Morph state
	let currentMorphIndex = $state(0);
	let currentValidIndex = $state(0);
	let morphScaleX = $state(1.0);
	let morphScaleY = $state(1.0);

	// Showcase cycling state
	let showcaseIndex = $state(0);
	let showcaseLastChange = $state(0);
	let showcaseTexture = $state<THREE.Texture | null>(null);
	// Track current showcase image orientation for conditional rendering
	let currentShowcaseImageOrientation = $state<'landscape' | 'portrait' | null>(null);
	// Loading and error tracking for showcase textures
	let showcaseTextureLoading = $state(false);
	let showcaseTextureError = $state(false);
	let showcaseTextureValid = $state(false); // Only true when texture is fully loaded and ready
	let showcaseLoadingDebounceStart = $state(0); // Time when loading started (for debounced indicator)

	// Showcase cache ready flag - actual cache is managed by TextureManager
	let showcaseCacheReady = $state(false);

	// Beat system state
	let beatCount = $state(0);
	let lastBeatTime = $state(0);
	let lastHalfRotationCount = $state(0);

	// Preload progress
	let preloadProgress = $state(0); // 0 to 1
	let preloadTotal = $state(0);
	let preloadLoaded = $state(0);

	// Export loading state for parent
	export function getLoadingState() {
		return {
			isLoading: !showcaseCacheReady && showcaseImages.length > 0,
			progress: preloadProgress,
			loaded: preloadLoaded,
			total: preloadTotal
		};
	}

	// Handle tap with position for directional wobble
	export function handleTap(u: number = 0.5, v: number = 0.5) {
		const now = performance.now();
		// Debounce: ignore taps within 50ms to prevent double-triggering (mesh + div bubbling)
		if (now - lastTapTime < 50) return;

		// Convert UV to local coords (-1 to 1)
		const localCoords = uvToLocalCoords(u, v);
		
		// If card is facing back (cos(rotationY) < 0), invert X direction
		// to ensure correct "Look At" behavior (Back Face looks at finger)
		const isBackFacing = Math.cos(rotationY) < 0;
		tapX = isBackFacing ? -localCoords.x : localCoords.x;
		tapY = localCoords.y;
		
		// Initialize tap wobble - only stacks if tapping quickly in succession
		const tapState = initTapWobble(tapX, tapY, tapPressure, wobbleStrength * 2, tapWobbleLinger, lastTapTime);
		tapWobbleActive = tapState.active;
		tapWobbleProgress = tapState.progress;
		tapPressure = tapState.pressure;
		tapWobbleIntensity = tapState.intensity;
		
		// Notify parent of pressure change for debug display
		onTapPressureChange?.(tapPressure);
		
		// Update last tap time for succession detection
		lastTapTime = performance.now();
		
		// Also advance showcase image (existing behavior)
		advanceShowcaseImage();
	}

	// Get current tap pressure for debug panel
	export function getTapPressure(): number {
		return tapPressure;
	}

	// Advance to next showcase image (called on click)
	export function advanceShowcaseImage() {
		if (showcaseImages.length === 0) return;

		// Determine current morph shape orientation
		const currentShape = MORPH_SHAPES[currentMorphIndex] || MORPH_SHAPES[0];
		const currentMorphOrientation = currentShape.w >= currentShape.h ? 'landscape' : 'portrait';

		// Filter images by matching orientation
		const matchingImages = showcaseImages.filter(img =>
			img.orientation === currentMorphOrientation
		);

		if (matchingImages.length > 0) {
			// Move to next image in the filtered set
			showcaseIndex = (showcaseIndex + 1) % matchingImages.length;
			const nextImage = matchingImages[showcaseIndex];
			if (nextImage?.image_url) {
				loadShowcaseTexture(nextImage.image_url);
				currentShowcaseImageOrientation = nextImage.orientation || null;
				showcaseLastChange = performance.now();
			}
		}
	}

	
	// Get current morph orientation
	const getCurrentMorphOrientation = () => {
		const shape = MORPH_SHAPES[currentMorphIndex] || MORPH_SHAPES[0];
		return shape.w >= shape.h ? 'landscape' : 'portrait';
	};
	
	// Should show showcase texture (orientation match + texture valid)
	const shouldShowShowcaseTexture = $derived(
		showcaseTexture !== null && 
		showcaseTextureValid &&
		!showcaseTextureError &&
		currentShowcaseImageOrientation !== null && 
		currentShowcaseImageOrientation === getCurrentMorphOrientation()
	);
	
	// Check texture ready for orientation (prevents blank cards)
	function hasReadyTextureForOrientation(orientation: 'landscape' | 'portrait'): boolean {
		return textureManager?.hasReadyTextureForOrientation(showcaseImages, orientation) ?? false;
	}
	
	// Show loading indicator after debounce delay
	const shouldShowLoadingIndicator = $derived(
		showcaseTextureLoading &&
		(performance.now() - showcaseLoadingDebounceStart) >= CARD3D_CONSTANTS.LOADING_DEBOUNCE_MS
	);

	// Track previous values
	let prevTemplateId: string | null = null;
	let prevImageUrl: string | null = null;
	let prevBackImageUrl: string | null = null;
	let prevWidthPixels = widthPixels;
	let prevHeightPixels = heightPixels;

	// Text animation state (uses imported helper functions)
	let animatedTexts = $state<Map<number, string>>(new Map());
	let textAnimationFrame = $state(0);

	// Get animated text for element (cached per element index)
	function getAnimatedText(idx: number): string {
		if (!animatedTexts.has(idx)) {
			animatedTexts.set(idx, generateRandomText());
		}
		return animatedTexts.get(idx) || '';
	}


	// Load geometry (front, back, edge) for card
	async function loadGeometry(w: number, h: number) {
		// Dispose previous non-cached geometries
		const isCached = morphGeometries.some((g) => g.front === frontGeometry);
		if (!isCached && frontGeometry) {
			frontGeometry.dispose();
			if (backGeometry) backGeometry.dispose();
			if (edgeGeometry) edgeGeometry.dispose();
		}

		const dims = getCardDimensions(w, h);
		const radius = Math.min(dims.width, dims.height) * 0.04;
		const cardGeometry = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
		frontGeometry = cardGeometry.frontGeometry;
		backGeometry = cardGeometry.backGeometry;
		edgeGeometry = cardGeometry.edgeGeometry;
	}

	// Pre-cache all morph geometries at startup
	async function preCacheMorphGeometries() {
		const cached: CachedGeometry[] = [];
		for (const shape of MORPH_SHAPES) {
			const dims = getCardDimensions(shape.w, shape.h);
			const radius = Math.min(dims.width, dims.height) * 0.04;
			const geo = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
			cached.push({ front: geo.frontGeometry, back: geo.backGeometry, edge: geo.edgeGeometry, dims });
		}
		morphGeometries = cached;
		morphGeometriesLoaded = true;
		if (cached.length > 0) {
			frontGeometry = cached[0].front;
			backGeometry = cached[0].back;
			edgeGeometry = cached[0].edge;
		}
	}

	// Load texture - delegates to TextureManager
	function loadTexture(url: string, aspect: number) {
		loading = true;
		error = false;
		textureManager.loadFrontTexture(
			url,
			aspect,
			(loadedTexture) => {
				texture = loadedTexture;
				loading = false;
			},
			() => {
				error = true;
				loading = false;
			}
		);
	}

	// Load back texture - delegates to TextureManager
	function loadBackTexture(url: string, aspect: number) {
		textureManager.loadBackTexture(
			url,
			aspect,
			(loadedTexture) => {
				backTexture = loadedTexture;
			},
			() => {
				console.error('[TemplateCard3D] Back texture error');
			}
		);
	}


	// Load showcase texture - delegates to TextureManager
	function loadShowcaseTexture(url: string) {
		// Don't load if URL is empty or invalid
		if (!url || url.trim() === '') {
			showcaseTextureError = true;
			showcaseTextureLoading = false;
			showcaseTextureValid = false;
			return;
		}
		
		textureManager.loadShowcaseTexture(
			url,
			(loadedTexture) => {
				showcaseTexture = loadedTexture;
				showcaseTextureLoading = false;
				showcaseTextureError = false;
				showcaseTextureValid = true;
			},
			() => {
				showcaseTextureError = true;
				showcaseTextureLoading = false;
				showcaseTextureValid = false;
			},
			() => {
				// onLoadStart callback
				showcaseTextureLoading = true;
				showcaseTextureError = false;
				showcaseTextureValid = false;
				showcaseLoadingDebounceStart = performance.now();
			}
		);
	}
	
	// Preload all showcase textures - delegates to TextureManager
	async function preloadShowcaseTextures() {
		await textureManager.preloadShowcaseTextures(showcaseImages);
		showcaseCacheReady = textureManager.isCacheReady();
	}

	// Initial load
	onMount(() => {
		// Initialize TextureManager with progress callback
		textureManager = new TextureManager((progress) => {
			preloadProgress = progress.progress;
			preloadLoaded = progress.loaded;
			preloadTotal = progress.total;
			showcaseCacheReady = progress.isReady;
			onLoadingProgress?.(progress.progress, progress.loaded, progress.total, progress.isReady);
		});
		
		// Pre-cache morph geometries for empty state
		preCacheMorphGeometries();
		
		// Preload all showcase textures into cache for instant swapping
		if (!templateId && showcaseImages.length > 0) {
			preloadShowcaseTextures().then(() => {
				// After preloading, load the first matching image
				const firstShape = MORPH_SHAPES[0];
				const firstOrientation = firstShape.w >= firstShape.h ? 'landscape' : 'portrait';
				
				const matchingImages = showcaseImages.filter(img => 
					img.orientation === firstOrientation
				);
				const firstImage = matchingImages[0];
				
				if (firstImage?.image_url) {
					loadShowcaseTexture(firstImage.image_url);
					currentShowcaseImageOrientation = firstImage.orientation || null;
					showcaseLastChange = performance.now();
				}
			});
		}

		// If we have a template, load its geometry and texture
		if (imageUrl) {
			loadGeometry(widthPixels, heightPixels);
			loadTexture(imageUrl, widthPixels / heightPixels);
		}
		if (backImageUrl) {
			loadBackTexture(backImageUrl, widthPixels / heightPixels);
		}
		
		prevImageUrl = imageUrl;
		prevBackImageUrl = backImageUrl;
		prevTemplateId = templateId;
		prevWidthPixels = widthPixels;
		prevHeightPixels = heightPixels;
	});

	// Cleanup
	onDestroy(() => {
		textureManager?.dispose();
		showcaseTexture = null;
	});


	// Animation loop
	useTask(() => {
		// Check for template change - trigger spin with random front-facing end angle
		if (templateId !== prevTemplateId && prevTemplateId !== null) {
			spinAnimation = true;
			// Generate random angle within ±30° of front-facing (0°)
			const randomOffset = (Math.random() - 0.5) * 2 * CARD3D_CONSTANTS.FRONT_FACING_TOLERANCE;
			// Single half rotation (180°) - briefly show back, then land on front
			const halfSpin = Math.PI;
			finalAngle = randomOffset; // End near front-facing with random offset
			spinTarget = rotationY + halfSpin; // One spin only

			// Clear animated texts cache
			animatedTexts.clear();
			textAnimationFrame = 0;
			
			// Notify parent of spin beat
			beatCount++;
			onBeat?.(beatCount, 'spin');
		}

		if (widthPixels !== prevWidthPixels || heightPixels !== prevHeightPixels) {
			loadGeometry(widthPixels, heightPixels);
			prevWidthPixels = widthPixels;
			prevHeightPixels = heightPixels;
		}

		if (imageUrl !== prevImageUrl) {
			if (imageUrl) {
				loadTexture(imageUrl, widthPixels / heightPixels);
				// Also update geometry to match template dimensions
				loadGeometry(widthPixels, heightPixels);
			} else {
				if (texture) {
					texture.dispose();
					texture = null;
				}
				loading = false;
				error = false;
			}
			prevImageUrl = imageUrl;
		}

		// Handle back image URL changes
		const templateChanged = templateId !== prevTemplateId;
		if (backImageUrl !== prevBackImageUrl || (templateChanged && backImageUrl)) {
			if (backImageUrl) {
				loadBackTexture(backImageUrl, widthPixels / heightPixels);
			} else {
				if (backTexture) {
					backTexture.dispose();
					backTexture = null;
				}
			}
			prevBackImageUrl = backImageUrl;
		}

		prevTemplateId = templateId;

		// Rotation animation
		// In showcase mode with cache ready: rotation ONLY happens during spin beats (no freeloader spins)
		// Outside showcase mode: continuous rotation with variable speed
		const inShowcaseWithCache = !templateId && showcaseImages.length > 0 && showcaseCacheReady;
		
		if (spinAnimation) {
			// Use animation controller for spin calculation
			const spinResult = updateSpinAnimation(spinProgress, spinTarget, spinStartRotation, spinSpeed);
			spinProgress = spinResult.newProgress;
			
			// Pre-calculate wobble state at spin START for seamless multi-axis interpolation
			if (!wobblePreCalculated && spinResult.newProgress > 0.01) {
				const preWobble = initWobble(spinTarget, spinStartRotation, spinSpeed, wobbleStrength, wobbleOscillations, wobbleLinger);
				wobblePreCalculated = true;
				wobbleSpinDirection = preWobble.spinDirection;
				wobbleIntensity = preWobble.intensity;
				wobbleOscillationCount = preWobble.oscillations;
				wobbleEffectiveLinger = preWobble.effectiveLinger;
				wobblePhaseX = preWobble.phaseX;
				wobblePhaseY = preWobble.phaseY;
				wobblePhaseZ = preWobble.phaseZ;
				wobbleInitialOffsets = preWobble.initialOffsets;
			}
			
			// Blend wobble offsets throughout ENTIRE spin using easeOut
			// This makes spin interpolate all axes toward wobble peak, not just Y
			if (wobblePreCalculated && !spinResult.complete) {
				const easeOut = 1 - Math.pow(1 - spinResult.newProgress, 3);
				wobbleOffsetX = wobbleInitialOffsets.x * easeOut;
				wobbleOffsetY = wobbleInitialOffsets.y * easeOut;
				wobbleOffsetZ = wobbleInitialOffsets.z * easeOut;
			}
			
			if (spinResult.complete) {
				// Spin complete - at first wobble peak
				rotationY = finalAngle;
				spinAnimation = false;
				wobbleActive = true;
				wobblePreCalculated = false;
				wobbleProgress = 0;
				wobbleOffsetX = wobbleInitialOffsets.x;
				wobbleOffsetY = wobbleInitialOffsets.y;
				wobbleOffsetZ = wobbleInitialOffsets.z;
			} else {
				rotationY = spinResult.rotationY;
			}

		} else if (!inShowcaseWithCache) {
			// Only do continuous rotation when NOT in showcase mode
			rotationY += getRotationSpeed(rotationY);
		}




		// else: In showcase mode without spin animation, card stays still
		
		// Wobble effect - use controller for calculations
		if (wobbleActive) {
			const wobbleState: WobbleState = {
				active: wobbleActive,
				progress: wobbleProgress,
				intensity: wobbleIntensity,
				oscillations: wobbleOscillationCount,
				effectiveLinger: wobbleEffectiveLinger,
				spinDirection: wobbleSpinDirection,
				phaseX: wobblePhaseX,
				phaseY: wobblePhaseY,
				phaseZ: wobblePhaseZ
			};
			const wobbleResult = updateWobble(wobbleState);
			wobbleProgress = wobbleResult.newProgress;
			wobbleOffsetX = wobbleResult.offsets.x;
			wobbleOffsetY = wobbleResult.offsets.y;
			wobbleOffsetZ = wobbleResult.offsets.z;
			if (wobbleResult.complete) {
				wobbleActive = false;
			}
		}

		// Tap wobble - runs in parallel with spin wobble
		if (tapWobbleActive) {
			const tapState: TapWobbleState = {
				active: tapWobbleActive,
				progress: tapWobbleProgress,
				tapX,
				tapY,
				pressure: tapPressure,
				intensity: tapWobbleIntensity,
				linger: tapWobbleLinger
			};
			const tapResult = updateTapWobble(tapState);
			tapWobbleProgress = tapResult.newProgress;
			tapOffsetX = tapResult.offsets.x;
			tapOffsetY = tapResult.offsets.y;
			tapOffsetZ = tapResult.offsets.z;
			tapPressure = tapResult.newPressure;
			
			// Update debug panel with decaying pressure
			// Update debug panel with decaying pressure
			onTapPressureChange?.(tapPressure);
			
			if (tapResult.complete) {
				tapWobbleActive = false;
			}
		} else if (tapPressure > 0) {
			// Decay pressure even when wobble animation is complete (match TapController rate)
			tapPressure = Math.max(0, tapPressure - 0.05);
			onTapPressureChange?.(tapPressure);
		}

		// Oscillating tilt animation - use controller
		const oscillation = updateOscillation(oscillateTime);
		oscillateTime = oscillation.newTime;
		// Combine spin wobble + tap wobble with oscillation
		tiltX = oscillation.tiltX + wobbleOffsetX + tapOffsetX;


		// Notify parent of rotation change for shadow sync
		const currentSpeed = getRotationSpeed(rotationY);
		const isSlowSpin = !spinAnimation && currentSpeed === CARD3D_CONSTANTS.ROTATION_SPEED_FACE;
		onRotationChange?.(rotationY, isSlowSpin);
		
		// Define isShowcaseMode for use in beat system and morphing
		const isShowcaseMode = !templateId && showcaseImages.length > 0;

		// Morphing animation - runs in empty state OR showcase mode (when no specific template selected)
		// Now controlled by unified beat system
		// Note: isShowcaseMode is already defined above in spin beat detection
		const shouldMorph = (
			(!imageUrl && !isShowcaseMode) || isShowcaseMode
		) && !loading && !error && !spinAnimation && morphGeometriesLoaded && morphGeometries.length > 0;

		// === UNIFIED BEAT SYSTEM ===
		// Use BeatController for timing and action decisions
		if (isShowcaseMode && showcaseImages.length > 0 && showcaseCacheReady) {
			const now = performance.now();
			const beatResult = checkBeat(now, lastBeatTime, beatMs, beatCount);
			
			if (beatResult.shouldTrigger) {
				lastBeatTime = beatResult.lastBeatTime;
				beatCount = beatResult.beatCount;
				
				if (beatResult.action === 'shape' && shouldMorph) {
					// === SHAPE CHANGE BEAT ===
					const validIndices = validMorphShapeIndices();
					const cycleLength = validIndices.length;
					
					if (cycleLength > 0) {
						// Use controller for next index calculation
						const nextValidIdx = getNextShapeIndex(currentValidIndex, cycleLength);
						const actualShapeIndex = validIndices[nextValidIdx];

						const newShape = MORPH_SHAPES[actualShapeIndex];
						const newOrientation: 'landscape' | 'portrait' = newShape.w >= newShape.h ? 'landscape' : 'portrait';
						
						// Only switch if we have a cached texture ready for the new orientation
						if (hasReadyTextureForOrientation(newOrientation)) {
							currentValidIndex = nextValidIdx;
							currentMorphIndex = actualShapeIndex;
							frontGeometry = morphGeometries[actualShapeIndex].front;
							backGeometry = morphGeometries[actualShapeIndex].back;
							edgeGeometry = morphGeometries[actualShapeIndex].edge;
							
							// Immediately load a matching texture from cache to prevent any flash
							const cached = textureManager.findCachedImageForOrientation(showcaseImages, newOrientation);
							if (cached) {
								showcaseTexture = cached.texture;
								currentShowcaseImageOrientation = newOrientation;
								showcaseTextureValid = true;
								showcaseTextureError = false;
								// Reset showcaseIndex for new orientation
								const matchingImages = textureManager.getMatchingImages(showcaseImages, newOrientation);
								showcaseIndex = matchingImages.indexOf(cached.image);
							}
							
							// Notify parent of shape change beat
							onBeat?.(beatCount, 'shape');

							// === TRIGGER MIXED SPIN ===
							// Spin while morphing shape for dynamic effect
							const spinSetup = triggerBeatSpin(rotationY);
							spinStartRotation = spinSetup.spinStartRotation;
							spinProgress = 0;
							spinAnimation = true;
							spinTarget = spinSetup.spinTarget;
							finalAngle = spinSetup.finalAngle;
						}
					}
				} else if (beatResult.action === 'spin') {
					// === SPIN BEAT ===
					// Use controller for spin setup
					const spinSetup = triggerBeatSpin(rotationY);
					spinStartRotation = spinSetup.spinStartRotation;
					spinProgress = 0;
					spinAnimation = true;
					spinTarget = spinSetup.spinTarget;
					finalAngle = spinSetup.finalAngle;
					
					// Notify parent of spin beat
					onBeat?.(beatCount, 'spin');
				} else if (beatResult.action === 'texture') {

					// === TEXTURE CHANGE BEAT ===
					const currentShape = MORPH_SHAPES[currentMorphIndex] || MORPH_SHAPES[0];
					const currentMorphOrientation = currentShape.w >= currentShape.h ? 'landscape' : 'portrait';
					
					// Filter images by matching orientation
					const matchingImages = showcaseImages.filter(img =>
						img.orientation === currentMorphOrientation
					);
					
					if (matchingImages.length > 0) {
						// Move to next image in the filtered set
						showcaseIndex = (showcaseIndex + 1) % matchingImages.length;
						const nextImage = matchingImages[showcaseIndex];
						if (nextImage?.image_url) {
							// Use cache for instant swap
							const cachedTex = textureManager.getCached(nextImage.image_url);
							if (cachedTex) {
								showcaseTexture = cachedTex;
								currentShowcaseImageOrientation = nextImage.orientation || null;
								showcaseTextureValid = true;
								showcaseTextureError = false;
							} else {
								// Fallback to loading (should rarely happen with preloading)
								loadShowcaseTexture(nextImage.image_url);
								currentShowcaseImageOrientation = nextImage.orientation || null;
							}
						}
					}
					
					// Notify parent of texture change beat
					onBeat?.(beatCount, 'texture');
				}
			}
		}

		// Keep morph scale at 1.0 - geometry switching handles size changes instantly
		if (shouldMorph) {
			morphScaleX = 1.0;
			morphScaleY = 1.0;
		}

		// Text animation - mutate text every ~5 frames (~83ms at 60fps) for fast per-character effect
		// Only run if animateText is enabled
		if (animateText) {
			textAnimationFrame++;
			if (textAnimationFrame >= 5) {
				textAnimationFrame = 0;
				// Mutate each animated text (1-3 characters change)
				const newTexts = new Map<number, string>();
				animatedTexts.forEach((text, key) => {
					newTexts.set(key, mutateText(text));
				});
				animatedTexts = newTexts;
			}
		}
	});
</script>

{#if frontGeometry}
	<!-- Card Group -->
	<T.Group rotation.x={tiltX} rotation.y={rotationY + wobbleOffsetY + tapOffsetY} rotation.z={wobbleOffsetZ + tapOffsetZ}>
		{#if loading}
			<T.Mesh 
				geometry={frontGeometry}
				onclick={(e) => {
					const uv = e.uv;
					if (uv) {
						handleTap(uv.x, uv.y);
					} else {
						handleTap(0.5, 0.5);
					}
				}}
			>
				<T.MeshStandardMaterial color="#f8fafc" side={THREE.FrontSide} transparent opacity={0.9} />
			</T.Mesh>
			{#if edgeGeometry}
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial
						color="#e2e8f0"
						side={THREE.DoubleSide}
						metalness={0.3}
						roughness={0.7}
					/>
				</T.Mesh>
			{/if}
			<Text
				text="Loading..."
				fontSize={0.22}
				color="white"
				anchorX="center"
				anchorY="middle"
				position.z={0.06}
			/>
		{:else if error}
			<T.Mesh 
				geometry={frontGeometry}
				onclick={(e) => {
					const uv = e.uv;
					if (uv) {
						handleTap(uv.x, uv.y);
					} else {
						handleTap(0.5, 0.5);
					}
				}}
			>
				<T.MeshStandardMaterial color="#ef4444" side={THREE.FrontSide} transparent opacity={0.9} />
			</T.Mesh>
			{#if edgeGeometry}
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial
						color="#b91c1c"
						side={THREE.DoubleSide}
						metalness={0.3}
						roughness={0.7}
					/>
				</T.Mesh>
			{/if}
			<Text
				text="Error"
				fontSize={0.22}
				color="white"
				anchorX="center"
				anchorY="middle"
				position.z={0.06}
			/>
		{:else if texture}
			<!-- Front: Full color texture - clickable for tap wobble -->
			<T.Mesh 
				geometry={frontGeometry}
				onclick={(e) => {
					const uv = e.uv;
					if (uv) {
						handleTap(uv.x, uv.y);
					} else {
						handleTap(0.5, 0.5);
					}
				}}
			>
				<T.MeshBasicMaterial
					map={texture}
					side={THREE.DoubleSide}
				/>
			</T.Mesh>
			<!-- Front: Shiny overlay for reflections -->
			<T.Mesh geometry={frontGeometry} position.z={0.001}>
				<T.MeshPhysicalMaterial
					transparent={true}
					opacity={0.08}
					roughness={0.1}
					metalness={0.0}
					clearcoat={1.0}
					clearcoatRoughness={0.1}
					side={THREE.FrontSide}
				/>
			</T.Mesh>
			{#if backGeometry}
				{#key backTexture}
					<!-- Back: Full color texture -->
					<T.Mesh geometry={backGeometry}>
						<T.MeshBasicMaterial
							map={backTexture}
							color={backTexture ? undefined : '#94a3b8'}
							side={THREE.DoubleSide}
						/>
					</T.Mesh>
					<!-- Back: Shiny overlay for reflections -->
					<T.Mesh geometry={backGeometry} position.z={-0.001}>
						<T.MeshPhysicalMaterial
							transparent={true}
							opacity={0.08}
							roughness={0.1}
							metalness={0.0}
							clearcoat={1.0}
							clearcoatRoughness={0.1}
							side={THREE.FrontSide}
						/>
					</T.Mesh>
				{/key}
			{/if}
			{#if edgeGeometry}
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshPhysicalMaterial
						color="#f0f4f8"
						side={THREE.DoubleSide}
						roughness={0.2}
						metalness={0.0}
						clearcoat={0.6}
						clearcoatRoughness={0.15}
					/>
				</T.Mesh>
			{/if}
			<!-- Template element overlays - only show when enabled -->
			{#if showOverlays}
				<!-- Front side overlays -->
				{#each templateElements.filter((el) => el.side === 'front') as el, idx (idx)}
					{@const pos3d = elementTo3D(el, widthPixels, heightPixels)}
					{@const isTextType = el.type === 'text' || el.type === 'selection'}
					<!-- Colored background overlay -->
					{#if showColors}
						<T.Mesh position.x={pos3d.x} position.y={pos3d.y} position.z={0.025}>
							<T.PlaneGeometry args={[pos3d.width, pos3d.height]} />
							<T.MeshBasicMaterial
								color={getElementColor(el.type)}
								transparent={true}
								opacity={isTextType ? 0.15 : 0.4}
								side={THREE.DoubleSide}
								depthWrite={false}
							/>
						</T.Mesh>
					{/if}
					<!-- Animated text for text elements -->
					{#if isTextType && showText}
						{@const _ = getAnimatedText(idx)}
						{@const textColor = el.color || '#10b981'}
						{@const textAlign = el.alignment || 'left'}
						{@const elFontSize = el.fontSize || el.size}
						{@const fontSize3D = elFontSize
							? (elFontSize / widthPixels) * 3.6 * 0.8
							: Math.min(pos3d.height * 0.6, 0.12)}
						{@const fontFamily = el.fontFamily || el.font || 'Roboto'}
						{@const fontWeight = el.fontWeight || '400'}
						{@const fontStyle = el.fontStyle || 'normal'}
						<Text
							text={animatedTexts.get(idx) || generateRandomText()}
							font={getFontUrl(fontFamily, fontWeight, fontStyle)}
							fontSize={fontSize3D}
							color={textColor}
							anchorX={textAlign}
							anchorY="middle"
							position.x={textAlign === 'left'
								? pos3d.x - pos3d.width / 2 + 0.02
								: textAlign === 'right'
									? pos3d.x + pos3d.width / 2 - 0.02
									: pos3d.x}
							position.y={pos3d.y}
							position.z={0.027}
							maxWidth={pos3d.width * 0.95}
						/>
					{/if}
					<!-- Element border -->
					{#if showBorders}
						<T.LineLoop position.x={pos3d.x} position.y={pos3d.y} position.z={0.026}>
							<T.BufferGeometry>
								<T.Float32BufferAttribute
									attach="attributes-position"
									args={[
										new Float32Array([
											-pos3d.width / 2,
											-pos3d.height / 2,
											0,
											pos3d.width / 2,
											-pos3d.height / 2,
											0,
											pos3d.width / 2,
											pos3d.height / 2,
											0,
											-pos3d.width / 2,
											pos3d.height / 2,
											0
										]),
										3
									]}
								/>
							</T.BufferGeometry>
							<T.LineBasicMaterial color={getElementColor(el.type)} linewidth={2} />
						</T.LineLoop>
					{/if}
				{/each}
				<!-- Template element overlays - back side -->
				{#each templateElements.filter((el) => el.side === 'back') as el, idx (idx)}
					{@const pos3d = elementTo3D(el, widthPixels, heightPixels)}
					{@const isTextType = el.type === 'text' || el.type === 'selection'}
					{@const backIdx = idx + 1000}
					<!-- Colored background overlay -->
					{#if showColors}
						<T.Mesh position.x={-pos3d.x} position.y={pos3d.y} position.z={-0.025}>
							<T.PlaneGeometry args={[pos3d.width, pos3d.height]} />
							<T.MeshBasicMaterial
								color={getElementColor(el.type)}
								transparent={true}
								opacity={isTextType ? 0.15 : 0.4}
								side={THREE.DoubleSide}
								depthWrite={false}
							/>
						</T.Mesh>
					{/if}
					<!-- Animated text for back side text elements -->
					{#if isTextType && showText}
						{@const _ = getAnimatedText(backIdx)}
						{@const textColor = el.color || '#10b981'}
						{@const textAlign = el.alignment || 'left'}
						{@const elFontSize = el.fontSize || el.size}
						{@const fontSize3D = elFontSize
							? (elFontSize / widthPixels) * 3.6 * 0.8
							: Math.min(pos3d.height * 0.6, 0.12)}
						{@const fontFamily = el.fontFamily || el.font || 'Roboto'}
						{@const fontWeight = el.fontWeight || '400'}
						{@const fontStyle = el.fontStyle || 'normal'}
						<Text
							text={animatedTexts.get(backIdx) || generateRandomText()}
							font={getFontUrl(fontFamily, fontWeight, fontStyle)}
							fontSize={fontSize3D}
							color={textColor}
							anchorX={textAlign === 'left' ? 'right' : textAlign === 'right' ? 'left' : 'center'}
							anchorY="middle"
							position.x={textAlign === 'left'
								? -pos3d.x + pos3d.width / 2 - 0.02
								: textAlign === 'right'
									? -pos3d.x - pos3d.width / 2 + 0.02
									: -pos3d.x}
							position.y={pos3d.y}
							position.z={-0.027}
							maxWidth={pos3d.width * 0.95}
							rotation.y={Math.PI}
						/>
					{/if}
					<!-- Element border -->
					{#if showBorders}
						<T.LineLoop position.x={-pos3d.x} position.y={pos3d.y} position.z={-0.026}>
							<T.BufferGeometry>
								<T.Float32BufferAttribute
									attach="attributes-position"
									args={[
										new Float32Array([
											-pos3d.width / 2,
											-pos3d.height / 2,
											0,
											pos3d.width / 2,
											-pos3d.height / 2,
											0,
											pos3d.width / 2,
											pos3d.height / 2,
											0,
											-pos3d.width / 2,
											pos3d.height / 2,
											0
										]),
										3
									]}
								/>
							</T.BufferGeometry>
							<T.LineBasicMaterial color={getElementColor(el.type)} linewidth={2} />
						</T.LineLoop>
					{/if}
				{/each}
			{/if}
		{:else}
		<!-- Morphing card - Persistent Hit Box + Conditional Texture -->
			<T.Group scale.x={morphScaleX} scale.y={morphScaleY}>
				<!-- Invisible Hit Box - always captures taps even if texture is loading/swapping -->
				<T.Mesh 
					geometry={frontGeometry}
					visible={false}
					onclick={(e) => {
						const uv = e.uv;
						if (uv) {
							handleTap(uv.x, uv.y);
						} else {
							handleTap(0.5, 0.5);
						}
					}}
				>
					<T.MeshBasicMaterial side={THREE.DoubleSide} />
				</T.Mesh>

				<!-- Visible Content -->
				{#if shouldShowShowcaseTexture}
					<!-- Front face with showcase texture -->
					<T.Mesh geometry={frontGeometry}>
						<T.MeshBasicMaterial
							map={showcaseTexture}
							side={THREE.FrontSide}
						/>
					</T.Mesh>
				<!-- Shiny overlay for reflections -->
				<T.Mesh geometry={frontGeometry} position.z={0.001}>
					<T.MeshPhysicalMaterial
						transparent={true}
						opacity={0.08}
						roughness={0.1}
						metalness={0.0}
						clearcoat={1.0}
						clearcoatRoughness={0.1}
						side={THREE.FrontSide}
					/>
				</T.Mesh>
				{#if backGeometry}
					<!-- Back face with showcase texture -->
					<T.Mesh geometry={backGeometry}>
						<T.MeshBasicMaterial
							map={showcaseTexture}
							side={THREE.FrontSide}
						/>
					</T.Mesh>
					<!-- Shiny overlay for reflections -->
					<T.Mesh geometry={backGeometry} position.z={-0.001}>
						<T.MeshPhysicalMaterial
							transparent={true}
							opacity={0.08}
							roughness={0.1}
							metalness={0.0}
							clearcoat={1.0}
							clearcoatRoughness={0.1}
							side={THREE.FrontSide}
						/>
					</T.Mesh>
				{/if}
				{#if edgeGeometry}
					<T.Mesh geometry={edgeGeometry}>
						<T.MeshPhysicalMaterial
							color="#475569"
							side={THREE.DoubleSide}
							metalness={0.0}
							roughness={0.2}
							clearcoat={0.6}
							clearcoatRoughness={0.15}
						/>
					</T.Mesh>
				{/if}
				{/if}
			</T.Group>
		<!-- No else block - we NEVER show a gray/plain card. Loading overlay in parent handles waiting state -->
		{/if}
	</T.Group>
{/if}
