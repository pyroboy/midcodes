<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { Text } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount, onDestroy } from 'svelte';
	import { createRoundedRectCard } from '$lib/utils/cardGeometry';
	import { FONT_CDN_URLS } from '$lib/config/fonts';

	// Template element type for overlays
	// NOTE: Database stores 'font' and 'size', but newer code uses 'fontFamily' and 'fontSize'
	// We support both for backwards compatibility
	interface TemplateElementOverlay {
		id: string;
		type: 'text' | 'image' | 'qr' | 'photo' | 'signature' | 'selection';
		x: number;
		y: number;
		width: number;
		height: number;
		side: 'front' | 'back';
		variableName?: string;
		content?: string;
		// Font styling - support both old (font/size) and new (fontFamily/fontSize) field names
		fontSize?: number;
		size?: number; // Legacy field name
		fontFamily?: string;
		font?: string; // Legacy field name
		fontWeight?: string;
		fontStyle?: string;
		color?: string;
		alignment?: 'left' | 'center' | 'right';
	}

	interface ShowcaseImage {
		image_url: string;
		width_pixels?: number;
		height_pixels?: number;
		orientation?: 'landscape' | 'portrait';
	}

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
		// Wobble effect controls
		wobbleAmount?: number;
		wobbleVariance?: number;
		wobbleLinger?: number; // How long wobble lasts (0.1 = fast decay, 1.0 = slow decay)
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
		wobbleAmount = 0.05,
		wobbleVariance = 0.10,
		wobbleLinger = 0.95
	}: Props = $props();

	// Base scale for 3D units
	const BASE_SCALE = 3.6;

	// Geometry state - includes front, back, and edge for full 3D card
	let frontGeometry = $state<THREE.BufferGeometry | null>(null);
	let backGeometry = $state<THREE.BufferGeometry | null>(null);
	let edgeGeometry = $state<THREE.BufferGeometry | null>(null);

	// Texture state - front and back
	let texture = $state<THREE.Texture | null>(null);
	let backTexture = $state<THREE.Texture | null>(null);
	let loading = $state(false);
	let error = $state(false);

	// Rotation state
	let rotationY = $state(0);
	let spinAnimation = $state(false);
	let spinTarget = $state(0);
	let spinStartRotation = $state(0); // Starting rotation for eased animation
	let spinProgress = $state(0); // 0 to 1 progress for easing
	let finalAngle = $state(0); // Target angle after spin
	const BASE_TILT_X = -0.12;

	// Oscillating tilt animation
	let oscillateTime = $state(0);
	let tiltX = $state(BASE_TILT_X);
	const OSCILLATE_SPEED = 0.008; // Slow oscillation
	const OSCILLATE_AMPLITUDE = (5 * Math.PI) / 180; // 5 degrees in radians

	// Wobble effect after spin - multi-axis (X, Y, Z)
	let wobbleActive = $state(false);
	let wobbleProgress = $state(0);
	let wobbleSpinDirection = $state(1); // Direction of the spin that triggered wobble (1 = positive, -1 = negative)
	let wobbleIntensity = $state(0); // Current wobble intensity (with variance applied)
	let wobbleEffectiveLinger = $state(0.5); // Effective linger with variance applied
	// Wobble offsets for each axis
	let wobbleOffsetX = $state(0);
	let wobbleOffsetY = $state(0);
	let wobbleOffsetZ = $state(0);
	// Random phase offsets for each axis to create organic movement
	let wobblePhaseX = $state(0);
	let wobblePhaseY = $state(0);
	let wobblePhaseZ = $state(0);
	const WOBBLE_FREQUENCY = 8; // Oscillation frequency (slightly slower for smoothness)

	// Rotation speeds - dynamic based on which face is visible
	const ROTATION_SPEED_FACE = 0.002; // Front & back facing speed (linger longer on faces)
	const ROTATION_SPEED_EDGE = 0.12; // Edge transition speed (very fast through edges)
	const SPIN_SPEED = 0.08; // Eased spin speed (progress increment per frame)

	// Thresholds for speed zones (in radians)
	const FACE_THRESHOLD = (15 * Math.PI) / 180; // 15 degrees - slow zone around front & back

	// Front-facing tolerance for final angle: random within ±30 degrees
	const FRONT_FACING_TOLERANCE = Math.PI / 6; // 30 degrees

	// Morphing animation - pre-cached geometry with smooth scale interpolation
	let morphTime = $state(0);
	const MORPH_SPEED = 0.008; // Speed of cycling
	const HOLD_DURATION = 0.6; // Hold at each shape (0-1 range, 0.6 = 60% of cycle is holding)

	// Pre-defined morph shapes - Real-world card sizes at 300 DPI
	// Based on standard card dimensions used in printing
	const MORPH_SHAPES = [
		// Credit Card / CR80 (3.375" x 2.125" = 1013 x 638 px)
		{ w: 1013, h: 638 },  // CR80 Landscape
		{ w: 638, h: 1013 },  // CR80 Portrait
		
		// Business Card (3.5" x 2.0" = 1050 x 600 px)
		{ w: 1050, h: 600 },  // Business Card Landscape
		{ w: 600, h: 1050 },  // Business Card Portrait
		
		// ID Badge (4.0" x 3.0" = 1200 x 900 px)
		{ w: 1200, h: 900 },  // ID Badge Landscape
		{ w: 900, h: 1200 },  // ID Badge Portrait
		
		// Mini Card (2.5" x 1.5" = 750 x 450 px)
		{ w: 750, h: 450 },   // Mini Card Landscape
		{ w: 450, h: 750 },   // Mini Card Portrait
		
		// Jumbo Card (4.25" x 2.75" = 1275 x 825 px)
		{ w: 1275, h: 825 },  // Jumbo Card Landscape
		{ w: 825, h: 1275 },  // Jumbo Card Portrait
	];

	// Pre-cached geometries for each morph shape (created once, never recreated)
	interface CachedGeometry {
		front: THREE.BufferGeometry;
		back: THREE.BufferGeometry;
		edge: THREE.BufferGeometry;
		// Store the 3D dimensions for scale calculation
		dims: { width: number; height: number };
	}
	let morphGeometries = $state<CachedGeometry[]>([]);
	let morphGeometriesLoaded = $state(false);

	// Compute available orientations from showcase images - only morph to shapes with textures
	const availableOrientations = $derived(() => {
		const orientations = new Set<'landscape' | 'portrait'>();
		showcaseImages.forEach(img => {
			if (img.orientation) orientations.add(img.orientation);
		});
		return orientations;
	});

	// Filter MORPH_SHAPES to only include shapes that have matching textures
	// This ensures we NEVER show a blank card without texture
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

	// Current morph state - uses geometry from currentIndex, scales toward nextIndex
	let currentMorphIndex = $state(0);
	let currentValidIndex = $state(0); // Index within validMorphShapeIndices
	// Smooth scale factors for interpolation between keyframes
	let morphScaleX = $state(1.0);
	let morphScaleY = $state(1.0);

	// Showcase image cycling state
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
	const LOADING_DEBOUNCE_MS = 200; // Show loading icon only after 200ms delay
	
	// Texture cache for preloaded showcase images - eliminates blank card flashes
	let showcaseTextureCache = $state<Map<string, THREE.Texture>>(new Map());
	let showcaseCacheReady = $state(false);
	
	// Unified beat system - controls all timing (texture swap, shape morph, spin)
	let beatCount = $state(0);
	let lastBeatTime = $state(0);
	// Beat actions cycle: texture, texture, texture, shape+texture (every 4th beat changes shape)
	// This creates a predictable rhythm where shape changes are less frequent than texture changes
	const BEATS_PER_SHAPE_CHANGE = 4;
	
	// Spin beat tracking - detect 180-degree rotation crossings
	// A "half rotation" is when the card completes 180 degrees, showing front or back
	let lastHalfRotationCount = $state(0); // Tracks which 180-degree boundary we last crossed

	// Loading progress tracking for preloading bar
	let preloadProgress = $state(0); // 0 to 1
	let preloadTotal = $state(0);
	let preloadLoaded = $state(0);

	// Export loading state for parent component to show loading bar
	export function getLoadingState() {
		return {
			isLoading: !showcaseCacheReady && showcaseImages.length > 0,
			progress: preloadProgress,
			loaded: preloadLoaded,
			total: preloadTotal
		};
	}

	// Function to advance to next showcase image immediately (called on click)
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
				showcaseLastChange = performance.now(); // Reset timer
			}
		}
	}
	
	// Compute current morph shape orientation for template conditional rendering
	const getCurrentMorphOrientation = () => {
		const shape = MORPH_SHAPES[currentMorphIndex] || MORPH_SHAPES[0];
		return shape.w >= shape.h ? 'landscape' : 'portrait';
	};
	
	// Check if showcase texture should be shown (orientation must match AND texture must be valid)
	const shouldShowShowcaseTexture = $derived(
		showcaseTexture !== null && 
		showcaseTextureValid &&
		!showcaseTextureError &&
		currentShowcaseImageOrientation !== null && 
		currentShowcaseImageOrientation === getCurrentMorphOrientation()
	);
	
	// Helper: Check if we have a cached texture ready for a given orientation
	// This prevents shape changes that would cause the card to disappear
	function hasReadyTextureForOrientation(orientation: 'landscape' | 'portrait'): boolean {
		const matchingImages = showcaseImages.filter(img => img.orientation === orientation);
		return matchingImages.some(img => showcaseTextureCache.has(img.image_url));
	}
	
	// Show loading indicator after debounce delay
	const shouldShowLoadingIndicator = $derived(
		showcaseTextureLoading && 
		(performance.now() - showcaseLoadingDebounceStart) >= LOADING_DEBOUNCE_MS
	);

	// Track previous values
	let prevTemplateId: string | null = null;
	let prevImageUrl: string | null = null;
	let prevBackImageUrl: string | null = null;
	let prevWidthPixels = widthPixels;
	let prevHeightPixels = heightPixels;

	// Texture loader instance
	const textureLoader = new THREE.TextureLoader();
	textureLoader.crossOrigin = 'anonymous';

	// Calculate card dimensions
	function getCardDimensions(w: number, h: number) {
		const aspect = w / h;
		if (aspect >= 1) {
			return { width: BASE_SCALE, height: BASE_SCALE / aspect };
		} else {
			return { width: BASE_SCALE * aspect, height: BASE_SCALE };
		}
	}

	// Convert element pixel coordinates to 3D world coordinates
	// Card center is (0,0,0), top-left in pixels maps to (-width/2, height/2) in 3D
	function elementTo3D(el: TemplateElementOverlay, cardW: number, cardH: number) {
		const dims = getCardDimensions(cardW, cardH);
		// Convert from pixel units to 3D units
		const scaleX = dims.width / cardW;
		const scaleY = dims.height / cardH;

		// Element center in pixels (origin top-left)
		const centerX = el.x + el.width / 2;
		const centerY = el.y + el.height / 2;

		// Convert to 3D coords (origin center, Y inverted)
		const x3d = (centerX - cardW / 2) * scaleX;
		const y3d = (cardH / 2 - centerY) * scaleY;
		const w3d = el.width * scaleX;
		const h3d = el.height * scaleY;

		return { x: x3d, y: y3d, width: w3d, height: h3d };
	}

	// Get element color based on type
	function getElementColor(type: string): string {
		switch (type) {
			case 'photo':
				return '#3b82f6'; // blue
			case 'image':
				return '#8b5cf6'; // purple
			case 'text':
				return '#10b981'; // green
			case 'qr':
				return '#f59e0b'; // amber
			case 'signature':
				return '#ec4899'; // pink
			case 'selection':
				return '#06b6d4'; // cyan
			default:
				return '#6b7280'; // gray
		}
	}

	// Get dynamic rotation speed based on current angle
	// ONLY slow at faces (front 0° and back 180°), full speed everywhere else
	function getRotationSpeed(angle: number): number {
		// Normalize angle to 0-2π range
		const twoPi = Math.PI * 2;
		const normalized = ((angle % twoPi) + twoPi) % twoPi;

		// Convert to degrees for easier reasoning (0-360)
		const degrees = (normalized * 180) / Math.PI;

		// Front face: 0° (or 360°), Back face: 180°
		// Check if we're within FACE_THRESHOLD of either face
		const degreesThreshold = (FACE_THRESHOLD * 180) / Math.PI; // 15 degrees

		const nearFront = degrees <= degreesThreshold || degrees >= 360 - degreesThreshold;
		const nearBack = degrees >= 180 - degreesThreshold && degrees <= 180 + degreesThreshold;

		if (nearFront || nearBack) {
			return ROTATION_SPEED_FACE;
		}
		return ROTATION_SPEED_EDGE;
	}

	// Font URL map for 3D text rendering - imported from centralized fonts.ts
	// Using FONT_CDN_URLS from '$lib/config/fonts'

	// Get font URL for a font family (fallback to Roboto Regular)
	function getFontUrl(
		fontFamily: string,
		fontWeight: string = '400',
		fontStyle: string = 'normal'
	): string {
		const defaultFont = FONT_CDN_URLS['Roboto']['400']['normal'];

		if (!fontFamily) return defaultFont;

		// Normalize family (case-insensitive lookup)
		const normalizedFamily = fontFamily.toLowerCase().trim();
		const familyKey =
			Object.keys(FONT_CDN_URLS).find((key) => key.toLowerCase() === normalizedFamily) || 'Roboto';

		// Normalize weight (map 'bold' to '700', default to '400')
		const weightKey = fontWeight === 'bold' || parseInt(fontWeight) >= 600 ? '700' : '400';

		// Normalize style
		const styleKey = fontStyle === 'italic' ? 'italic' : 'normal';

		// Traverse map safely with fallbacks
		try {
			const familyObj = FONT_CDN_URLS[familyKey];
			if (!familyObj) return defaultFont;

			const weightObj = familyObj[weightKey] || familyObj['400'];
			if (!weightObj) return defaultFont;

			return weightObj[styleKey] || weightObj['normal'] || defaultFont;
		} catch {
			return defaultFont;
		}
	}

	// Random text animation for text overlays - per-character randomizing
	const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let animatedTexts = $state<Map<number, string>>(new Map());
	let textAnimationFrame = $state(0);

	// Generate random character
	function randomChar(): string {
		return CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}

	// Generate initial random string of 8-12 characters
	function generateRandomText(): string {
		const length = Math.floor(Math.random() * 5) + 8; // 8 to 12 chars
		let result = '';
		for (let i = 0; i < length; i++) {
			result += randomChar();
		}
		return result;
	}

	// Mutate 1-3 random characters in the string (per-character animation)
	function mutateText(text: string): string {
		const chars = text.split('');
		const mutationCount = Math.floor(Math.random() * 3) + 1; // 1-3 chars
		for (let i = 0; i < mutationCount; i++) {
			const pos = Math.floor(Math.random() * chars.length);
			chars[pos] = randomChar();
		}
		return chars.join('');
	}

	// Get animated text for element (cached per element index)
	function getAnimatedText(idx: number): string {
		if (!animatedTexts.has(idx)) {
			animatedTexts.set(idx, generateRandomText());
		}
		return animatedTexts.get(idx) || '';
	}

	// Load geometry with front, back, and edge for full 3D effect
	async function loadGeometry(w: number, h: number) {
		// Dispose of previous dynamic geometries (if they aren't the pre-cached ones)
		// We check if the current geometry is in the morph cache to avoid disposing shared assets
		const isCached = morphGeometries.some((g) => g.front === frontGeometry);
		if (!isCached && frontGeometry) {
			frontGeometry.dispose();
			if (backGeometry) backGeometry.dispose();
			if (edgeGeometry) edgeGeometry.dispose();
		}

		const dims = getCardDimensions(w, h);
		const radius = Math.min(dims.width, dims.height) * 0.04;
		// Card thickness - thin like a real ID card
		const cardGeometry = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
		frontGeometry = cardGeometry.frontGeometry;
		backGeometry = cardGeometry.backGeometry;
		edgeGeometry = cardGeometry.edgeGeometry;
	}

	// Lerp helper for smooth interpolation
	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}

	// Pre-cache all morph geometries at startup (called once)
	async function preCacheMorphGeometries() {
		const cached: CachedGeometry[] = [];
		for (const shape of MORPH_SHAPES) {
			const dims = getCardDimensions(shape.w, shape.h);
			const radius = Math.min(dims.width, dims.height) * 0.04;
			const geo = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
			cached.push({
				front: geo.frontGeometry,
				back: geo.backGeometry,
				edge: geo.edgeGeometry,
				dims: dims // Store for scale interpolation
			});
		}
		morphGeometries = cached;
		morphGeometriesLoaded = true;
		// Set initial geometry from first cached shape
		if (cached.length > 0) {
			frontGeometry = cached[0].front;
			backGeometry = cached[0].back;
			edgeGeometry = cached[0].edge;
		}
		console.log('[TemplateCard3D] Pre-cached', cached.length, 'morph geometries with dims');
	}

	// Load texture
	function loadTexture(url: string, aspect: number) {
		loading = true;
		error = false;

		// Dispose old texture
		if (texture) {
			texture.dispose();
			texture = null;
		}

		console.log('[TemplateCard3D] Loading front:', url);

		textureLoader.load(
			url,
			(loadedTexture) => {
				// Configure texture
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

				// Aspect ratio correction
				if (loadedTexture.image?.width && loadedTexture.image?.height) {
					const imageAspect = loadedTexture.image.width / loadedTexture.image.height;
					if (imageAspect > aspect) {
						const scale = aspect / imageAspect;
						loadedTexture.repeat.set(scale, 1);
						loadedTexture.offset.set((1 - scale) / 2, 0);
					} else {
						const scale = imageAspect / aspect;
						loadedTexture.repeat.set(1, scale);
						loadedTexture.offset.set(0, (1 - scale) / 2);
					}
				}
				loadedTexture.needsUpdate = true;

				texture = loadedTexture;
				loading = false;
				console.log('[TemplateCard3D] Front loaded successfully');
			},
			undefined,
			(err) => {
				console.error('[TemplateCard3D] Front error:', err);
				error = true;
				loading = false;
			}
		);
	}

	// Load back texture
	function loadBackTexture(url: string, aspect: number) {
		// Dispose old back texture
		if (backTexture) {
			backTexture.dispose();
			backTexture = null;
		}

		console.log('[TemplateCard3D] Loading back:', url);

		textureLoader.load(
			url,
			(loadedTexture) => {
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

				// Aspect ratio correction
				if (loadedTexture.image?.width && loadedTexture.image?.height) {
					const imageAspect = loadedTexture.image.width / loadedTexture.image.height;
					if (imageAspect > aspect) {
						const scale = aspect / imageAspect;
						loadedTexture.repeat.set(scale, 1);
						loadedTexture.offset.set((1 - scale) / 2, 0);
					} else {
						const scale = imageAspect / aspect;
						loadedTexture.repeat.set(1, scale);
						loadedTexture.offset.set(0, (1 - scale) / 2);
					}
				}
				loadedTexture.needsUpdate = true;
				backTexture = loadedTexture;
				// Force a state update to trigger reactivity
				backTexture = backTexture;
				console.log('[TemplateCard3D] Back loaded successfully');
			},
			undefined,
				(err) => {
				console.error('[TemplateCard3D] Back error:', err);
			}
		);
	}

	// Load showcase texture (for cycling through images) - uses cache if available
	function loadShowcaseTexture(url: string) {
		// Don't load if URL is empty or invalid
		if (!url || url.trim() === '') {
			showcaseTextureError = true;
			showcaseTextureLoading = false;
			showcaseTextureValid = false;
			return;
		}
		
		// Check cache first - instant swap if available
		const cachedTexture = showcaseTextureCache.get(url);
		if (cachedTexture) {
			// Dispose old showcase texture if different
			if (showcaseTexture && showcaseTexture !== cachedTexture) {
				// Don't dispose - it might be in cache still
			}
			showcaseTexture = cachedTexture;
			showcaseTextureLoading = false;
			showcaseTextureError = false;
			showcaseTextureValid = true;
			return;
		}
		
		// Start loading state with debounce timer (fallback for non-cached images)
		showcaseTextureLoading = true;
		showcaseTextureError = false;
		showcaseTextureValid = false;
		showcaseLoadingDebounceStart = performance.now();
		
		const showcaseLoader = new THREE.TextureLoader();
		showcaseLoader.crossOrigin = 'anonymous';
		
		showcaseLoader.load(
			url,
			(loadedTexture) => {
				// Validate texture has actual image data
				if (!loadedTexture.image || loadedTexture.image.width === 0 || loadedTexture.image.height === 0) {
					console.error('[TemplateCard3D] Showcase texture invalid - no image data');
					showcaseTextureError = true;
					showcaseTextureLoading = false;
					showcaseTextureValid = false;
					loadedTexture.dispose();
					return;
				}
				
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
				loadedTexture.needsUpdate = true;
				
				// Add to cache for future use
				showcaseTextureCache.set(url, loadedTexture);
				
				showcaseTexture = loadedTexture;
				
				// Mark as loaded and valid
				showcaseTextureLoading = false;
				showcaseTextureError = false;
				showcaseTextureValid = true;
			},
			undefined,
			(err) => {
				console.error('[TemplateCard3D] Showcase texture error:', err);
				showcaseTextureLoading = false;
				showcaseTextureError = true;
				showcaseTextureValid = false;
			}
		);
	}
	
	// Preload all showcase textures into cache on mount
	async function preloadShowcaseTextures() {
		if (showcaseImages.length === 0) {
			showcaseCacheReady = true;
			preloadProgress = 1;
			onLoadingProgress?.(1, 0, 0, true);
			return;
		}

		// Filter valid images
		const validImages = showcaseImages.filter(img => img.image_url && img.image_url.trim() !== '');
		preloadTotal = validImages.length;
		preloadLoaded = 0;
		preloadProgress = 0;

		// Notify parent of initial loading state
		onLoadingProgress?.(0, 0, preloadTotal, false);

		console.log('[TemplateCard3D] Preloading', preloadTotal, 'showcase textures...');

		const loader = new THREE.TextureLoader();
		loader.crossOrigin = 'anonymous';

		const loadPromises = validImages.map((img) => {
			return new Promise<void>((resolve) => {
				// Skip if already in cache
				if (showcaseTextureCache.has(img.image_url)) {
					preloadLoaded++;
					preloadProgress = preloadTotal > 0 ? preloadLoaded / preloadTotal : 1;
					onLoadingProgress?.(preloadProgress, preloadLoaded, preloadTotal, false);
					resolve();
					return;
				}

				loader.load(
					img.image_url,
					(loadedTexture) => {
						if (loadedTexture.image && loadedTexture.image.width > 0 && loadedTexture.image.height > 0) {
							loadedTexture.colorSpace = THREE.SRGBColorSpace;
							loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
							loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
							loadedTexture.needsUpdate = true;
							showcaseTextureCache.set(img.image_url, loadedTexture);
						}
						preloadLoaded++;
						preloadProgress = preloadTotal > 0 ? preloadLoaded / preloadTotal : 1;
						onLoadingProgress?.(preloadProgress, preloadLoaded, preloadTotal, false);
						resolve();
					},
					undefined,
					() => {
						// Still count failed loads toward progress
						preloadLoaded++;
						preloadProgress = preloadTotal > 0 ? preloadLoaded / preloadTotal : 1;
						onLoadingProgress?.(preloadProgress, preloadLoaded, preloadTotal, false);
						resolve();
					}
				);
			});
		});

		await Promise.all(loadPromises);
		showcaseCacheReady = true;
		preloadProgress = 1;
		onLoadingProgress?.(1, preloadLoaded, preloadTotal, true);
		console.log('[TemplateCard3D] Preloaded', showcaseTextureCache.size, 'showcase textures into cache');
	}

	// Initial load
	onMount(() => {
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
		if (texture) {
			texture.dispose();
		}
		if (backTexture) {
			backTexture.dispose();
		}
		// Dispose all cached showcase textures
		showcaseTextureCache.forEach((tex) => {
			tex.dispose();
		});
		showcaseTextureCache.clear();
		showcaseTexture = null;
	});

	// Animation loop
	useTask(() => {
		// Check for template change - trigger spin with random front-facing end angle
		if (templateId !== prevTemplateId && prevTemplateId !== null) {
			spinAnimation = true;
			// Generate random angle within ±30° of front-facing (0°)
			const randomOffset = (Math.random() - 0.5) * 2 * FRONT_FACING_TOLERANCE;
			// Single half rotation (180°) - briefly show back, then land on front
			const halfSpin = Math.PI;
			finalAngle = randomOffset; // End near front-facing with random offset
			spinTarget = rotationY + halfSpin; // One spin only

			// Clear animated texts cache to prevent memory leak and ensure fresh animations
			animatedTexts.clear();
			textAnimationFrame = 0;
			console.log('[TemplateCard3D] Template changed, cleared animated texts cache');
			
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

		// Handle back image URL changes - also reload when template changes
		const templateChanged = templateId !== prevTemplateId;
		if (backImageUrl !== prevBackImageUrl || (templateChanged && backImageUrl)) {
			console.log('[TemplateCard3D] Back image change detected:', {
				backImageUrl,
				prevBackImageUrl,
				templateChanged
			});
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
			// Eased spin animation using ease-out cubic
			spinProgress += SPIN_SPEED;
			if (spinProgress >= 1) {
				// Spin complete - snap to final angle and start wobble
				spinProgress = 0;
				rotationY = finalAngle;
				spinAnimation = false;
				
				// Start wobble effect - use spin direction as initial influence
				wobbleActive = true;
				wobbleProgress = 0;
				// Capture spin direction for wobble (positive = clockwise, negative = counter-clockwise)
				wobbleSpinDirection = spinTarget > spinStartRotation ? 1 : -1;
				
				// Apply variance as random range to BOTH amount and linger
				// variance=0: exact value, variance=1: ±100% range centered on base value
				// Example: amount=0.07, variance=0.5 → range is 0.07 ± (0.07 * 0.5) = 0.035 to 0.105
				const randomAmount = (Math.random() - 0.5) * 2; // -1 to 1
				const randomLinger = (Math.random() - 0.5) * 2; // -1 to 1
				
				// Calculate effective values with variance applied
				const amountVariation = wobbleAmount * wobbleVariance * randomAmount;
				const lingerVariation = wobbleLinger * wobbleVariance * randomLinger;
				
				// Clamp to valid ranges
				wobbleIntensity = Math.max(0, wobbleAmount + amountVariation);
				wobbleEffectiveLinger = Math.max(0.1, Math.min(1, wobbleLinger + lingerVariation));
				
				// Random phase offsets for organic multi-axis movement
				wobblePhaseX = Math.random() * Math.PI * 2;
				wobblePhaseY = Math.random() * Math.PI * 2;
				wobblePhaseZ = Math.random() * Math.PI * 2;
			} else {
				// Ease-out cubic: 1 - (1-t)^3
				const easeOut = 1 - Math.pow(1 - spinProgress, 3);
				const rotationDelta = spinTarget - spinStartRotation;
				rotationY = spinStartRotation + rotationDelta * easeOut;
			}
		} else if (!inShowcaseWithCache) {
			// Only do continuous rotation when NOT in showcase mode
			// In showcase mode, rotation is controlled by spin beats only
			rotationY += getRotationSpeed(rotationY);
		}
		// else: In showcase mode without spin animation, card stays still
		
		// Wobble effect - multi-axis damped oscillation after spin
		// Uses ease-out exponential for strong start and slow decay
		if (wobbleActive) {
			// wobbleEffectiveLinger has variance applied, controls decay speed
			const wobbleSpeed = (0.03 + (1 - wobbleEffectiveLinger) * 0.27) / 3;
			wobbleProgress += wobbleSpeed;
			if (wobbleProgress >= 1) {
				wobbleActive = false;
				wobbleProgress = 0;
				wobbleOffsetX = 0;
				wobbleOffsetY = 0;
				wobbleOffsetZ = 0;
			} else {
				// Ease-out exponential decay: e^(-5*t) for strong start, slow decay
				const decayFactor = Math.exp(-5 * wobbleProgress);
				
				// Multi-axis wobble with different frequencies for organic feel
				// X-axis (tilt forward/back): main wobble
				const wobbleX = Math.sin(wobbleProgress * WOBBLE_FREQUENCY * Math.PI + wobblePhaseX);
				// Y-axis (rotation): subtle, influenced by spin direction
				const wobbleY = Math.sin(wobbleProgress * (WOBBLE_FREQUENCY * 0.7) * Math.PI + wobblePhaseY) * wobbleSpinDirection;
				// Z-axis (bank/roll): subtle variation
				const wobbleZ = Math.sin(wobbleProgress * (WOBBLE_FREQUENCY * 1.3) * Math.PI + wobblePhaseZ);
				
				// Apply intensity and decay with axis-specific scaling
				wobbleOffsetX = wobbleIntensity * wobbleX * decayFactor;
				wobbleOffsetY = wobbleIntensity * 0.3 * wobbleY * decayFactor; // Y is subtler
				wobbleOffsetZ = wobbleIntensity * 0.5 * wobbleZ * decayFactor; // Z is medium
			}
		}

		// Oscillating tilt animation (up and down by 5 degrees) + wobble on X-axis
		oscillateTime += OSCILLATE_SPEED;
		tiltX = BASE_TILT_X + Math.sin(oscillateTime) * OSCILLATE_AMPLITUDE + wobbleOffsetX;

		// Notify parent of rotation change for shadow sync
		const currentSpeed = getRotationSpeed(rotationY);
		const isSlowSpin = !spinAnimation && currentSpeed === ROTATION_SPEED_FACE;
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
		// All visual changes happen on the beat timer: texture, shape, and spin
		// Beat cycle pattern example: texture, spin, texture, shape+spin, texture, spin, texture, shape...
		if (isShowcaseMode && showcaseImages.length > 0 && showcaseCacheReady) {
			const now = performance.now();
			
			// Check if it's time for a beat
			if (now - lastBeatTime >= beatMs) {
				lastBeatTime = now;
				beatCount++;
				
				// Determine beat action based on beat count
				// - Every 4th beat: shape change
				// - Every 2nd beat: spin (fast 180° rotation)
				// - Otherwise: texture change
				const isShapeBeat = beatCount % BEATS_PER_SHAPE_CHANGE === 0;
				const isSpinBeat = beatCount % 2 === 0; // Every other beat is a spin
				
				if (isShapeBeat && shouldMorph) {
					// === SHAPE CHANGE BEAT ===
					const validIndices = validMorphShapeIndices();
					const cycleLength = validIndices.length;
					
					if (cycleLength > 0) {
						// Move to next valid shape
						const nextValidIdx = (currentValidIndex + 1) % cycleLength;
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
							const matchingImages = showcaseImages.filter(img => img.orientation === newOrientation);
							const cachedImage = matchingImages.find(img => showcaseTextureCache.has(img.image_url));
							if (cachedImage) {
								const cachedTex = showcaseTextureCache.get(cachedImage.image_url);
								if (cachedTex) {
									showcaseTexture = cachedTex;
									currentShowcaseImageOrientation = newOrientation;
									showcaseTextureValid = true;
									showcaseTextureError = false;
									// Reset showcaseIndex for new orientation
									showcaseIndex = matchingImages.indexOf(cachedImage);
								}
							}
							
							// Notify parent of shape change beat
							onBeat?.(beatCount, 'shape');
						}
					}
				} else if (isSpinBeat) {
					// === SPIN BEAT ===
					// Trigger an eased 180-degree spin with wobble at the end
					const halfRotation = Math.PI;
					const targetRotation = Math.ceil(rotationY / halfRotation) * halfRotation + halfRotation;
					
					// Set up eased spin animation
					spinStartRotation = rotationY;
					spinProgress = 0;
					spinAnimation = true;
					spinTarget = targetRotation;
					finalAngle = targetRotation; // Land exactly at the 180° boundary
					
					// Notify parent of spin beat
					onBeat?.(beatCount, 'spin');
				} else {
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
							const cachedTex = showcaseTextureCache.get(nextImage.image_url);
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
	<T.Group rotation.x={tiltX} rotation.y={rotationY + wobbleOffsetY} rotation.z={wobbleOffsetZ}>
		{#if loading}
			<T.Mesh geometry={frontGeometry}>
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
			<T.Mesh geometry={frontGeometry}>
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
			<!-- Front: Full color texture -->
			<T.Mesh geometry={frontGeometry}>
				<T.MeshBasicMaterial
					map={texture}
					side={THREE.FrontSide}
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
		<!-- Morphing card - ONLY render when textures are ready -->
		<!-- NEVER show gray/plain card - wait for texture to be available -->
		{#if shouldShowShowcaseTexture}
			<T.Group scale.x={morphScaleX} scale.y={morphScaleY}>
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
			</T.Group>
		{/if}
		<!-- No else block - we NEVER show a gray/plain card. Loading overlay in parent handles waiting state -->
		{/if}
	</T.Group>
{/if}
