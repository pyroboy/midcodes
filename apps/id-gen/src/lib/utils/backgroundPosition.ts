import type { BackgroundPosition } from '$lib/utils/imageCropper';
import { generateCropPreviewUrl, generateCropPreviewFromUrl } from '$lib/utils/imageCropper';

/**
 * Handle background position updates with drag performance optimization
 * 
 * This function updates the background position for a given side and manages
 * drag performance by debouncing expensive crop preview updates during drag operations.
 * 
 * @param position - The new background position (x, y, scale)
 * @param side - Which side to update ('front' or 'back')
 * @param currentFrontPosition - Current front background position
 * @param currentBackPosition - Current back background position
 * @param isDraggingBackground - Whether a drag operation is currently active
 * @param lastPositionUpdateTime - Timestamp of the last position update
 * @param positionUpdateCount - Count of position updates during current drag
 * @param dragUpdateTimeout - Existing timeout for debounced updates (if any)
 * @param updateCropPreviewsFn - Function to call for updating crop previews
 * @returns Object containing updated positions, drag state, and timeout
 */
export async function handleBackgroundPositionUpdate(
	position: BackgroundPosition,
	side: 'front' | 'back',
	currentFrontPosition: BackgroundPosition,
	currentBackPosition: BackgroundPosition,
	isDraggingBackground: boolean,
	lastPositionUpdateTime: number,
	positionUpdateCount: number,
	dragUpdateTimeout: ReturnType<typeof setTimeout> | null,
	updateCropPreviewsFn: () => Promise<void>
): Promise<{
	frontBackgroundPosition: BackgroundPosition;
	backBackgroundPosition: BackgroundPosition;
	isDraggingBackground: boolean;
	lastPositionUpdateTime: number;
	positionUpdateCount: number;
	dragUpdateTimeout: ReturnType<typeof setTimeout> | null;
}> {
	// Update position immediately for responsiveness
	let newFrontPosition = currentFrontPosition;
	let newBackPosition = currentBackPosition;

	if (side === 'front') {
		newFrontPosition = { ...position };
	} else {
		newBackPosition = { ...position };
	}

	// Detect if this is likely a drag operation based on update frequency
	const now = performance.now();
	const timeSinceLastUpdate = now - lastPositionUpdateTime;
	const newLastPositionUpdateTime = now;

	// Consider it dragging if updates come within 50ms of each other
	const isLikelyDragging = timeSinceLastUpdate < 50;

	let newIsDraggingBackground = isDraggingBackground;
	let newPositionUpdateCount = positionUpdateCount;
	let newDragUpdateTimeout = dragUpdateTimeout;

	if (isLikelyDragging) {
		newPositionUpdateCount++;
		newIsDraggingBackground = true;

		// Clear existing timeout
		if (dragUpdateTimeout) {
			clearTimeout(dragUpdateTimeout);
		}

		// Debounce expensive crop preview updates during drag
		newDragUpdateTimeout = setTimeout(async () => {
			await updateCropPreviewsFn();
			// Note: The caller is responsible for updating isDraggingBackground to false
			// and resetting positionUpdateCount to 0 after this timeout completes
		}, 150); // Wait 150ms after drag movement stops
	} else {
		// Immediate update when not dragging (single position change)
		newIsDraggingBackground = false;
		newPositionUpdateCount = 0;
		await updateCropPreviewsFn();
	}

	return {
		frontBackgroundPosition: newFrontPosition,
		backBackgroundPosition: newBackPosition,
		isDraggingBackground: newIsDraggingBackground,
		lastPositionUpdateTime: newLastPositionUpdateTime,
		positionUpdateCount: newPositionUpdateCount,
		dragUpdateTimeout: newDragUpdateTimeout
	};
}

/**
 * Generate crop previews for both front and back images
 * 
 * This function creates separate cropped preview images that show what the final
 * output will look like. It uses the File object if available, otherwise falls back
 * to generating from a URL.
 * 
 * @param frontBackground - Front background file (if available)
 * @param backBackground - Back background file (if available)
 * @param frontPreview - Front background preview URL
 * @param backPreview - Back background preview URL
 * @param requiredPixelDimensions - Required pixel dimensions for cropping
 * @param frontBackgroundPosition - Front background position settings
 * @param backBackgroundPosition - Back background position settings
 * @param isDraggingBackground - Whether a drag operation is currently active
 * @returns Object containing front and back crop preview URLs
 */
export async function updateCropPreviews(
	frontBackground: File | null,
	backBackground: File | null,
	frontPreview: string | null,
	backPreview: string | null,
	requiredPixelDimensions: { width: number; height: number } | null,
	frontBackgroundPosition: BackgroundPosition,
	backBackgroundPosition: BackgroundPosition,
	isDraggingBackground: boolean
): Promise<{
	frontCropPreview: string | null;
	backCropPreview: string | null;
}> {
	// Skip expensive operations during active drag
	if (isDraggingBackground || !requiredPixelDimensions) {
		return {
			frontCropPreview: null,
			backCropPreview: null
		};
	}

	console.log('📷 updateCropPreviews called:', {
		frontBackground: frontBackground ? 'File' : null,
		backBackground: backBackground ? 'File' : null,
		frontPreview: frontPreview ? frontPreview.substring(0, 30) + '...' : null,
		backPreview: backPreview ? backPreview.substring(0, 30) + '...' : null,
		frontPosition: { ...frontBackgroundPosition },
		backPosition: { ...backBackgroundPosition }
	});

	let frontCropPreview: string | null = null;
	let backCropPreview: string | null = null;

	// Generate front crop preview
	// Use File if available, otherwise use URL
	if (frontBackground) {
		try {
			const cropPreviewUrl = await generateCropPreviewUrl(
				frontBackground,
				requiredPixelDimensions,
				frontBackgroundPosition
			);
			frontCropPreview = cropPreviewUrl;
			console.log('✅ Front crop preview generated from File');
		} catch (e) {
			console.warn('Failed to generate front crop preview from File:', e);
			frontCropPreview = null;
		}
	} else if (frontPreview) {
		// No File, but we have a URL - try to generate from URL
		try {
			const cropPreviewUrl = await generateCropPreviewFromUrl(
				frontPreview,
				requiredPixelDimensions,
				frontBackgroundPosition
			);
			frontCropPreview = cropPreviewUrl;
			console.log('✅ Front crop preview generated from URL');
		} catch (e) {
			console.warn('Failed to generate front crop preview from URL:', e);
			frontCropPreview = null;
		}
	}

	// Generate back crop preview
	if (backBackground) {
		try {
			const cropPreviewUrl = await generateCropPreviewUrl(
				backBackground,
				requiredPixelDimensions,
				backBackgroundPosition
			);
			backCropPreview = cropPreviewUrl;
			console.log('✅ Back crop preview generated from File');
		} catch (e) {
			console.warn('Failed to generate back crop preview from File:', e);
			backCropPreview = null;
		}
	} else if (backPreview) {
		// No File, but we have a URL - try to generate from URL
		try {
			const cropPreviewUrl = await generateCropPreviewFromUrl(
				backPreview,
				requiredPixelDimensions,
				backBackgroundPosition
			);
			backCropPreview = cropPreviewUrl;
			console.log('✅ Back crop preview generated from URL');
		} catch (e) {
			console.warn('Failed to generate back crop preview from URL:', e);
			backCropPreview = null;
		}
	}

	return {
		frontCropPreview,
		backCropPreview
	};
}
