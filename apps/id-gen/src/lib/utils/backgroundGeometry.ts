/**
 * Background Geometry Utilities
 * 
 * This module provides a single source of truth for all calculations related to:
 * - CSS background-size: cover behavior with additional user scale/offset
 * - Thumbnail crop frame positioning
 * - Background position clamping
 * 
 * All functions work with intrinsic pixel coordinates and can be scaled for display.
 */

export type BackgroundPosition = {
	x: number; // Offset from center in container pixels
	y: number; // Offset from center in container pixels  
	scale: number; // Additional scale factor (1.0 = base cover size)
};

export type Dims = {
	width: number;
	height: number;
};

export type Rect = Dims & {
	x: number;
	y: number;
};

/**
 * Compute the base CSS background-size: cover dimensions
 * @param image - Natural image dimensions
 * @param container - Container dimensions
 * @returns Base scale factor and cover dimensions
 */
export function coverBase(image: Dims, container: Dims) {
	if (image.width === 0 || image.height === 0 || container.width === 0 || container.height === 0) {
		return { s0: 1, coverW: 0, coverH: 0 };
	}

	// CSS background-size: cover scales to fill container completely
	const s0 = Math.max(container.width / image.width, container.height / image.height);
	const coverW = image.width * s0;
	const coverH = image.height * s0;

	return { s0, coverW, coverH };
}

/**
 * Compute the final draw dimensions and position for a background image
 * @param image - Natural image dimensions
 * @param container - Container dimensions  
 * @param pos - User-defined position and scale
 * @returns Draw dimensions and top-left position in container coordinates
 */
export function computeDraw(image: Dims, container: Dims, pos: BackgroundPosition) {
	const { s0, coverW, coverH } = coverBase(image, container);
	
	// Apply user scale on top of cover scale
	const drawW = coverW * pos.scale;
	const drawH = coverH * pos.scale;
	
	// Center the image by default, then apply user offset
	const centerOffset = { 
		x: (container.width - drawW) / 2, 
		y: (container.height - drawH) / 2 
	};
	
	const topLeft = { 
		x: centerOffset.x + pos.x, 
		y: centerOffset.y + pos.y 
	};

	return { drawW, drawH, topLeft, s0 };
}

/**
 * Generate CSS background-size and background-position values
 * @param image - Natural image dimensions
 * @param container - Container dimensions
 * @param pos - User-defined position and scale
 * @param cssScale - Scale factor for converting to display pixels (default: 1)
 * @returns CSS-ready size and position values
 */
export function cssForBackground(
	image: Dims, 
	container: Dims, 
	pos: BackgroundPosition, 
	cssScale = 1
) {
	const { drawW, drawH } = computeDraw(image, container, pos);
	
	return {
		sizePx: { 
			w: drawW * cssScale, 
			h: drawH * cssScale 
		},
		posPx: { 
			x: pos.x * cssScale, 
			y: pos.y * cssScale 
		}
	};
}

/**
 * Compute the visible rectangle of the image in image coordinates
 * @param image - Natural image dimensions
 * @param container - Container dimensions
 * @param pos - User-defined position and scale
 * @returns Rectangle in image pixel coordinates showing what's visible
 */
export function computeVisibleRectInImage(
	image: Dims, 
	container: Dims, 
	pos: BackgroundPosition
): Rect {
	// Safety checks for valid dimensions and position
	if (!isFinite(image.width) || !isFinite(image.height) ||
		!isFinite(container.width) || !isFinite(container.height) ||
		!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.scale) ||
		image.width <= 0 || image.height <= 0 ||
		container.width <= 0 || container.height <= 0) {
		console.warn('⚠️ Invalid dimensions or position in computeVisibleRectInImage:', {
			image, container, pos
		});
		return { x: 0, y: 0, width: 0, height: 0 };
	}
	
	const { topLeft, s0 } = computeDraw(image, container, pos);
	
	if (s0 === 0 || pos.scale === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	const effectiveScale = s0 * pos.scale;
	
	// Calculate visible bounds in container coordinates
	const visibleLeft = Math.max(0, -topLeft.x);
	const visibleTop = Math.max(0, -topLeft.y);
	const visibleRight = Math.min(container.width, container.width - topLeft.x);
	const visibleBottom = Math.min(container.height, container.height - topLeft.y);
	
	// Convert back to image coordinates
	const left = visibleLeft / effectiveScale;
	const top = visibleTop / effectiveScale;
	const right = visibleRight / effectiveScale;
	const bottom = visibleBottom / effectiveScale;
	
	// Apply bounds checking to ensure visible rect stays within image bounds
	const clampedLeft = Math.max(0, Math.min(left, image.width));
	const clampedTop = Math.max(0, Math.min(top, image.height));
	const clampedRight = Math.max(clampedLeft, Math.min(right, image.width));
	const clampedBottom = Math.max(clampedTop, Math.min(bottom, image.height));
	
	return {
		x: clampedLeft,
		y: clampedTop,
		width: Math.max(0, clampedRight - clampedLeft),
		height: Math.max(0, clampedBottom - clampedTop)
	};
}

/**
 * Map a rectangle from image coordinates to thumbnail coordinates
 * @param rectInImage - Rectangle in image pixel coordinates
 * @param image - Natural image dimensions
 * @param thumb - Thumbnail dimensions
 * @returns Rectangle in thumbnail pixel coordinates
 */
export function mapImageRectToThumb(rectInImage: Rect, image: Dims, thumb: Dims): Rect {
	// Safety checks for valid dimensions
	if (!isFinite(image.width) || !isFinite(image.height) ||
		!isFinite(thumb.width) || !isFinite(thumb.height) ||
		!isFinite(rectInImage.x) || !isFinite(rectInImage.y) ||
		!isFinite(rectInImage.width) || !isFinite(rectInImage.height) ||
		image.width <= 0 || image.height <= 0 ||
		thumb.width <= 0 || thumb.height <= 0) {
		console.warn('⚠️ Invalid dimensions in mapImageRectToThumb:', {
			rectInImage, image, thumb
		});
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	// Scale to fit image in thumbnail (object-fit: contain behavior)
	const t = Math.min(thumb.width / image.width, thumb.height / image.height);
	
	// Center the image in thumbnail
	const pad = { 
		x: (thumb.width - image.width * t) / 2, 
		y: (thumb.height - image.height * t) / 2 
	};
	
	return {
		x: pad.x + rectInImage.x * t,
		y: pad.y + rectInImage.y * t,
		width: rectInImage.width * t,
		height: rectInImage.height * t
	};
}

/**
 * Clamp background position to prevent white bars/gaps
 * @param image - Natural image dimensions
 * @param container - Container dimensions
 * @param pos - Current background position
 * @returns Clamped background position
 */
export function clampBackgroundPosition(
	image: Dims, 
	container: Dims, 
	pos: BackgroundPosition
): BackgroundPosition {
	const { drawW, drawH } = computeDraw(image, container, pos);
	
	// Calculate bounds - image should always cover the container
	const minX = Math.min(0, container.width - drawW);
	const maxX = Math.max(0, drawW - container.width);
	const minY = Math.min(0, container.height - drawH);
	const maxY = Math.max(0, drawH - container.height);
	
	// Clamp position to bounds (divide by 2 for center-based positioning)
	const clampedX = Math.max(minX / 2, Math.min(maxX / 2, pos.x));
	const clampedY = Math.max(minY / 2, Math.min(maxY / 2, pos.y));
	
	return {
		...pos,
		x: clampedX,
		y: clampedY
	};
}

/**
 * Calculate the exact crop frame dimensions for thumbnail display
 * @param image - Original image dimensions
 * @param container - Template dimensions
 * @param pos - Current background position
 * @param thumbnailSize - Size of the square thumbnail (default 120)
 * @returns Rectangle in thumbnail coordinates showing exact crop area
 */
export function calculateCropFrame(
	image: Dims, 
	container: Dims, 
	pos: BackgroundPosition,
	thumbnailSize: number = 120
): Rect {
	// Safety checks for valid dimensions
	if (!isFinite(image.width) || !isFinite(image.height) ||
		!isFinite(container.width) || !isFinite(container.height) ||
		!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.scale) ||
		image.width <= 0 || image.height <= 0 ||
		container.width <= 0 || container.height <= 0) {
		console.warn('⚠️ Invalid dimensions in calculateCropFrame:', {
			image, container, pos
		});
		return { x: 0, y: 0, width: thumbnailSize, height: thumbnailSize };
	}

	// Get the visible rectangle in image coordinates
	const visibleRect = computeVisibleRectInImage(image, container, pos);
	
	// Create thumbnail dimensions (square)
	const thumbnailDims = { width: thumbnailSize, height: thumbnailSize };
	
	// Map to thumbnail coordinates
	const thumbnailRect = mapImageRectToThumb(visibleRect, image, thumbnailDims);
	
	// Ensure the crop frame shows exactly what will be cropped
	return {
		x: Math.max(0, thumbnailRect.x),
		y: Math.max(0, thumbnailRect.y),
		width: Math.max(1, Math.min(thumbnailSize, thumbnailRect.width)), // Minimum 1px, max thumbnailSize
		height: Math.max(1, Math.min(thumbnailSize, thumbnailRect.height))
	};
}

/**
 * Validate that the crop frame alignment is correct
 * @param image - Original image dimensions
 * @param container - Template dimensions
 * @param pos - Current background position
 * @returns True if the crop frame matches the expected template size
 */
export function validateCropFrameAlignment(
	image: Dims,
	container: Dims,
	pos: BackgroundPosition
): boolean {
	const visibleRect = computeVisibleRectInImage(image, container, pos);
	
	// Check if visible area reasonably matches template dimensions
	// Allow for small floating point differences
	const tolerance = 1; // 1 pixel tolerance
	return Math.abs(visibleRect.width - container.width) < tolerance && 
		   Math.abs(visibleRect.height - container.height) < tolerance;
}

/**
 * Map thumbnail coordinates to actual crop coordinates
 * @param thumbPos - Position in thumbnail (0-120px coordinate space)
 * @param image - Original image dimensions
 * @param container - Template dimensions
 * @returns Equivalent position in template coordinates
 */
export function thumbnailToCropCoordinates(
	thumbPos: BackgroundPosition,
	image: Dims,
	container: Dims
): BackgroundPosition {
	const { s0 } = coverBase(image, container);
	const cropScale = Math.max(container.width / image.width, container.height / image.height);
	
	return {
		x: thumbPos.x * (container.width / 120), // Scale from thumbnail to template
		y: thumbPos.y * (container.height / 120),
		scale: 1 + (thumbPos.scale - 1) * (cropScale / s0)
	};
}

/**
 * Map crop coordinates back to thumbnail coordinate space
 * @param cropPos - Position in template coordinates
 * @param image - Original image dimensions
 * @param container - Template dimensions
 * @returns Equivalent position in thumbnail coordinates
 */
export function cropToThumbnailCoordinates(
	cropPos: BackgroundPosition,
	image: Dims,
	container: Dims
): BackgroundPosition {
	const { s0 } = coverBase(image, container);
	const cropScale = Math.max(container.width / image.width, container.height / image.height);
	
	return {
		x: cropPos.x * (120 / container.width),
		y: cropPos.y * (120 / container.height),
		scale: 1 + (cropPos.scale - 1) * (s0 / cropScale)
	};
}

/**
 * Calculate background position from crop frame dimensions
 * @param frameWidth - Width of the crop frame in thumbnail pixels
 * @param frameHeight - Height of the crop frame in thumbnail pixels
 * @param frameX - X position of the crop frame in thumbnail pixels
 * @param frameY - Y position of the crop frame in thumbnail pixels
 * @param image - Original image dimensions
 * @param container - Template dimensions
 * @param thumbnailSize - Size of the thumbnail (default 120)
 * @returns BackgroundPosition that produces the given crop frame
 */
export function calculatePositionFromFrame(
	frameWidth: number,
	frameHeight: number,
	frameX: number,
	frameY: number,
	image: Dims,
	container: Dims,
	thumbnailSize: number = 120
): BackgroundPosition {
	// Safety checks for valid dimensions
	if (!isFinite(frameWidth) || !isFinite(frameHeight) ||
		!isFinite(frameX) || !isFinite(frameY) ||
		!isFinite(image.width) || !isFinite(image.height) ||
		!isFinite(container.width) || !isFinite(container.height) ||
		frameWidth <= 0 || frameHeight <= 0 ||
		image.width <= 0 || image.height <= 0 ||
		container.width <= 0 || container.height <= 0) {
		console.warn('⚠️ Invalid dimensions in calculatePositionFromFrame:', {
			frame: { width: frameWidth, height: frameHeight, x: frameX, y: frameY },
			image, container, thumbnailSize
		});
		return { x: 0, y: 0, scale: 1 };
	}

	const { s0 } = coverBase(image, container);
	if (s0 === 0) {
		return { x: 0, y: 0, scale: 1 };
	}
	
	// First, we need to convert the thumbnail frame back to image coordinates
	// The thumbnail shows the image with object-fit: contain behavior
	const imageAspect = image.width / image.height;
	const thumbAspect = 1; // Square thumbnail
	
	let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number;
	if (imageAspect > thumbAspect) {
		// Image is wider - fit to width
		displayWidth = thumbnailSize;
		displayHeight = thumbnailSize / imageAspect;
		offsetX = 0;
		offsetY = (thumbnailSize - displayHeight) / 2;
	} else {
		// Image is taller - fit to height
		displayHeight = thumbnailSize;
		displayWidth = thumbnailSize * imageAspect;
		offsetX = (thumbnailSize - displayWidth) / 2;
		offsetY = 0;
	}

	// Convert frame coordinates from thumbnail space to image space
	const scaleX = image.width / displayWidth;
	const scaleY = image.height / displayHeight;
	
	// Adjust frame position for the image offset in thumbnail
	const frameInImageX = (frameX - offsetX) * scaleX;
	const frameInImageY = (frameY - offsetY) * scaleY;
	const frameInImageWidth = frameWidth * scaleX;
	const frameInImageHeight = frameHeight * scaleY;
	
	// Now calculate what background position would create this visible rectangle
	// The frame represents what should be visible in the container
	// We need to determine the scale and position that makes this frame fill the container
	
	// Calculate the scale needed to make the frame fill the container
	const scaleToFitX = container.width / frameInImageWidth;
	const scaleToFitY = container.height / frameInImageHeight;
	const scaleToFit = Math.max(scaleToFitX, scaleToFitY);
	
	// Convert to background position scale (relative to s0)
	const backgroundScale = Math.max(0.1, Math.min(3, scaleToFit / s0));
	
	// Calculate the position offset needed to center this frame in the container
	// When scaled by backgroundScale * s0, where should the image be positioned?
	const finalScale = backgroundScale * s0;
	
	// The center of our frame in image coordinates
	const frameCenterX = frameInImageX + frameInImageWidth / 2;
	const frameCenterY = frameInImageY + frameInImageHeight / 2;
	
	// We want this center to align with the container center
	const containerCenterX = container.width / 2;
	const containerCenterY = container.height / 2;
	
	// Calculate the offset needed
	const offsetToCenter = {
		x: containerCenterX - frameCenterX * finalScale,
		y: containerCenterY - frameCenterY * finalScale
	};
	
	// The background position is relative to the natural center
	const naturalCenterOffset = {
		x: (container.width - image.width * finalScale) / 2,
		y: (container.height - image.height * finalScale) / 2
	};
	
	const position = {
		x: offsetToCenter.x - naturalCenterOffset.x,
		y: offsetToCenter.y - naturalCenterOffset.y,
		scale: backgroundScale
	};
	
	return position;
}

/**
 * Utility function to clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Validate that a rectangle is within image bounds
 * @param rect - Rectangle to validate
 * @param imageDims - Image dimensions to check against
 * @returns True if rectangle is valid and within bounds
 */
export function isValidRect(rect: Rect, imageDims: Dims): boolean {
	if (!isFinite(rect.x) || !isFinite(rect.y) || !isFinite(rect.width) || !isFinite(rect.height)) {
		return false;
	}
	
	if (rect.width < 0 || rect.height < 0) {
		return false;
	}
	
	if (rect.x < 0 || rect.y < 0) {
		return false;
	}
	
	if (rect.x + rect.width > imageDims.width || rect.y + rect.height > imageDims.height) {
		return false;
	}
	
	return true;
}
