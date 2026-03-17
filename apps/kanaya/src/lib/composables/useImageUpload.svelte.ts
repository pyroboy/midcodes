import type { BackgroundPosition } from '$lib/utils/imageCropper';
import { blobToDataUrl } from '$lib/utils/templateImageUpload';
import { handleBackgroundPositionUpdate as handleBgPositionUpdate, updateCropPreviews as updateCropPreviewsUtil } from '$lib/utils/backgroundPosition';
import { imageCache } from '$lib/utils/imageCache';

/** Configuration options for useImageUpload hook */
export interface UseImageUploadOptions {
	/** Getter function for required pixel dimensions - allows reactive updates */
	getRequiredPixelDimensions: () => { width: number; height: number } | null;
	/** Template ID for image cache keying */
	templateId?: string;
	initialFrontBackground?: File | null;
	initialBackBackground?: File | null;
	initialFrontPosition?: BackgroundPosition;
	initialBackPosition?: BackgroundPosition;
	/** Initial front preview URL (for editing existing templates) */
	initialFrontPreview?: string | null;
	/** Initial back preview URL (for editing existing templates) */
	initialBackPreview?: string | null;
}

/** Return type for useImageUpload hook */
export interface UseImageUploadReturn {
	frontBackground: File | null;
	backBackground: File | null;
	frontPreview: string | null;
	backPreview: string | null;
	frontCropPreview: string | null;
	backCropPreview: string | null;
	frontBackgroundPosition: BackgroundPosition;
	backBackgroundPosition: BackgroundPosition;
	isDraggingBackground: boolean;
	dragUpdateTimeout: ReturnType<typeof setTimeout> | null;
	lastPositionUpdateTime: number;
	positionUpdateCount: number;
	handleImageUpload: (files: File[], side: 'front' | 'back') => Promise<void>;
	handleRemoveImage: (side: 'front' | 'back') => void;
	handleBackgroundPositionUpdate: (position: BackgroundPosition, side: 'front' | 'back') => Promise<void>;
	updateCropPreviews: () => Promise<void>;
	/** Last error that occurred during operations */
	lastError: string | null;
	/** Clear the last error */
	clearError: () => void;
	/** Set preview URL directly (used when loading existing templates) */
	setPreview: (side: 'front' | 'back', url: string | null) => void;
	/** Reset all state */
	reset: () => void;
}

/** Default background position */
const DEFAULT_POSITION: BackgroundPosition = { x: 0, y: 0, scale: 1 };

/** Maximum file size for uploads (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed image MIME types */
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * Composable hook for managing image upload state and operations
 * Handles file uploads, preview generation, background position management with drag optimization
 */
export function useImageUpload(options: UseImageUploadOptions): UseImageUploadReturn {
	const {
		getRequiredPixelDimensions,
		templateId,
		initialFrontBackground = null,
		initialBackBackground = null,
		initialFrontPreview = null,
		initialBackPreview = null
	} = options;

	// State
	let frontBackground = $state<File | null>(initialFrontBackground);
	let backBackground = $state<File | null>(initialBackBackground);
	let frontPreview = $state<string | null>(initialFrontPreview);
	let backPreview = $state<string | null>(initialBackPreview);
	let frontCropPreview = $state<string | null>(null);
	let backCropPreview = $state<string | null>(null);
	let frontBackgroundPosition = $state<BackgroundPosition>(options.initialFrontPosition || { ...DEFAULT_POSITION });
	let backBackgroundPosition = $state<BackgroundPosition>(options.initialBackPosition || { ...DEFAULT_POSITION });
	let isDraggingBackground = $state<boolean>(false);
	let dragUpdateTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
	let lastPositionUpdateTime = $state<number>(0);
	let positionUpdateCount = $state<number>(0);
	let lastError = $state<string | null>(null);

	// Generate cache keys based on template ID
	function getCacheKey(side: 'front' | 'back'): string {
		return `template-${templateId || 'new'}-${side}`;
	}

	/**
	 * Validate an image file before processing
	 */
	function validateImageFile(file: File): string | null {
		if (!file) {
			return 'No file provided';
		}
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return `Invalid file type: ${file.type}. Allowed: PNG, JPEG, WebP, GIF`;
		}
		if (file.size > MAX_FILE_SIZE) {
			return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`;
		}
		if (file.size === 0) {
			return 'File is empty';
		}
		return null;
	}

	/**
	 * Handle image file upload for specified side
	 */
	async function handleImageUpload(files: File[], side: 'front' | 'back') {
		lastError = null;

		// Validate input
		if (!files || files.length === 0) {
			console.warn('[useImageUpload] No files provided');
			return;
		}

		const file = files[0];

		// Validate file
		const validationError = validateImageFile(file);
		if (validationError) {
			lastError = validationError;
			console.error('[useImageUpload] Validation error:', validationError);
			return;
		}

		try {
			const preview = await blobToDataUrl(file);
			const cacheKey = getCacheKey(side);

			// Store in image cache for consistent resolution
			imageCache.setPreview(cacheKey, preview);

			if (side === 'front') {
				frontBackground = file;
				frontPreview = imageCache.resolve(cacheKey) || preview;
				frontBackgroundPosition = { ...DEFAULT_POSITION };
			} else {
				backBackground = file;
				backPreview = imageCache.resolve(cacheKey) || preview;
				backBackgroundPosition = { ...DEFAULT_POSITION };
			}

			console.log(`📸 [useImageUpload] ${side} image uploaded and cached:`, {
				fileName: file.name,
				size: file.size,
				cacheKey
			});

			await updateCropPreviews();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to process image';
			lastError = message;
			console.error('[useImageUpload] Error processing image:', error);
		}
	}

	/**
	 * Remove image from specified side
	 */
	function handleRemoveImage(side: 'front' | 'back') {
		lastError = null;

		if (side === 'front') {
			frontBackground = null;
			frontPreview = null;
			frontCropPreview = null;
			frontBackgroundPosition = { ...DEFAULT_POSITION };
		} else {
			backBackground = null;
			backPreview = null;
			backCropPreview = null;
			backBackgroundPosition = { ...DEFAULT_POSITION };
		}
	}

	/**
	 * Update background position with drag optimization
	 */
	async function handleBackgroundPositionUpdate(position: BackgroundPosition, side: 'front' | 'back') {
		// Validate position object
		if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.scale !== 'number') {
			console.warn('[useImageUpload] Invalid position object:', position);
			return;
		}

		// Ensure scale is within reasonable bounds
		const safePosition: BackgroundPosition = {
			x: position.x,
			y: position.y,
			scale: Math.max(0.1, Math.min(10, position.scale))
		};

		try {
			const result = await handleBgPositionUpdate(
				safePosition, side, frontBackgroundPosition, backBackgroundPosition,
				isDraggingBackground, lastPositionUpdateTime, positionUpdateCount, dragUpdateTimeout, updateCropPreviews
			);
			frontBackgroundPosition = result.frontBackgroundPosition;
			backBackgroundPosition = result.backBackgroundPosition;
			isDraggingBackground = result.isDraggingBackground;
			lastPositionUpdateTime = result.lastPositionUpdateTime;
			positionUpdateCount = result.positionUpdateCount;
			dragUpdateTimeout = result.dragUpdateTimeout;
		} catch (error) {
			console.error('[useImageUpload] Error updating position:', error);
		}
	}

	/**
	 * Update crop previews for both sides
	 * Uses the getter to get current dimensions for reactive updates
	 */
	async function updateCropPreviews() {
		// Use the getter to get current dimensions (reactive)
		const currentDimensions = getRequiredPixelDimensions();

		try {
			const result = await updateCropPreviewsUtil(
				frontBackground, backBackground, frontPreview, backPreview,
				currentDimensions, frontBackgroundPosition, backBackgroundPosition, isDraggingBackground
			);
			frontCropPreview = result.frontCropPreview;
			backCropPreview = result.backCropPreview;
		} catch (error) {
			console.error('[useImageUpload] Error updating crop previews:', error);
			// Don't set lastError here - crop preview failures are not critical
		}
	}

	/**
	 * Clear the last error
	 */
	function clearError() {
		lastError = null;
	}

	/**
	 * Set previews directly (used when loading existing templates)
	 */
	function setPreview(side: 'front' | 'back', url: string | null) {
		if (side === 'front') {
			frontPreview = url;
		} else {
			backPreview = url;
		}
	}

	/**
	 * Reset all state
	 */
	function reset() {
		// Clear any pending drag timeout to prevent memory leaks
		if (dragUpdateTimeout) {
			clearTimeout(dragUpdateTimeout);
			dragUpdateTimeout = null;
		}
		frontBackground = null;
		backBackground = null;
		frontPreview = null;
		backPreview = null;
		frontCropPreview = null;
		backCropPreview = null;
		frontBackgroundPosition = { ...DEFAULT_POSITION };
		backBackgroundPosition = { ...DEFAULT_POSITION };
		isDraggingBackground = false;
		positionUpdateCount = 0;
		lastPositionUpdateTime = 0;
		lastError = null;
	}

	// Return object with getters and setters to maintain reactivity
	return {
		get frontBackground() { return frontBackground; },
		set frontBackground(value) { frontBackground = value; },
		get backBackground() { return backBackground; },
		set backBackground(value) { backBackground = value; },
		get frontPreview() { return frontPreview; },
		set frontPreview(value) { frontPreview = value; },
		get backPreview() { return backPreview; },
		set backPreview(value) { backPreview = value; },
		get frontCropPreview() { return frontCropPreview; },
		get backCropPreview() { return backCropPreview; },
		get frontBackgroundPosition() { return frontBackgroundPosition; },
		set frontBackgroundPosition(value) { frontBackgroundPosition = value; },
		get backBackgroundPosition() { return backBackgroundPosition; },
		set backBackgroundPosition(value) { backBackgroundPosition = value; },
		get isDraggingBackground() { return isDraggingBackground; },
		get dragUpdateTimeout() { return dragUpdateTimeout; },
		get lastPositionUpdateTime() { return lastPositionUpdateTime; },
		get positionUpdateCount() { return positionUpdateCount; },
		get lastError() { return lastError; },
		handleImageUpload,
		handleRemoveImage,
		handleBackgroundPositionUpdate,
		updateCropPreviews,
		clearError,
		setPreview,
		reset
	};
}
