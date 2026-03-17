/**
 * High-quality image cropping utility for template backgrounds
 * Maintains original image quality while applying UI positioning transformations
 */

export interface BackgroundPosition {
	x: number;
	y: number;
	scale: number;
}

export interface ImageDimensions {
	width: number;
	height: number;
}

export interface CropResult {
	croppedFile: File;
	wasCropped: boolean;
	originalSize: ImageDimensions;
	croppedSize: ImageDimensions;
}

/**
 * Determines if an image needs cropping based on current positioning
 */
export function needsCropping(
	originalImageSize: ImageDimensions,
	templateSize: ImageDimensions,
	backgroundPosition: BackgroundPosition
): boolean {
	// Calculate how CSS background-size: cover scales the image
	const imageAspect = originalImageSize.width / originalImageSize.height;
	const templateAspect = templateSize.width / templateSize.height;

	let coverScale: number;
	if (imageAspect > templateAspect) {
		// Image is wider - height fits, width gets cropped
		coverScale = templateSize.height / originalImageSize.height;
	} else {
		// Image is taller - width fits, height gets cropped
		coverScale = templateSize.width / originalImageSize.width;
	}

	// Apply user's additional scaling
	const totalScale = coverScale * backgroundPosition.scale;

	// Calculate scaled image dimensions
	const scaledWidth = originalImageSize.width * totalScale;
	const scaledHeight = originalImageSize.height * totalScale;

	// Check if image extends beyond template bounds, is positioned off-center, or has custom scale
	const extendsWidth = scaledWidth > templateSize.width;
	const extendsHeight = scaledHeight > templateSize.height;
	const isOffCenter = backgroundPosition.x !== 0 || backgroundPosition.y !== 0;
	const hasCustomScale = backgroundPosition.scale !== 1;

	return extendsWidth || extendsHeight || isOffCenter || hasCustomScale;
}

/**
 * Transforms UI preview coordinates to original image coordinates
 *
 * ✅ SYNCHRONIZED: This function now uses the same logic as backgroundGeometry.ts
 * to ensure consistent coordinate calculation between thumbnail preview and final crop.
 */
function calculateCropArea(
	originalImageSize: ImageDimensions,
	templateSize: ImageDimensions,
	backgroundPosition: BackgroundPosition
): {
	sourceX: number;
	sourceY: number;
	sourceWidth: number;
	sourceHeight: number;
	destX: number;
	destY: number;
	destWidth: number;
	destHeight: number;
} {
	// ✅ Use the same coverBase logic as backgroundGeometry.ts
	const imageAspect = originalImageSize.width / originalImageSize.height;
	const templateAspect = templateSize.width / templateSize.height;

	// Calculate cover scale (background-size: cover behavior)
	const scaleX = templateSize.width / originalImageSize.width;
	const scaleY = templateSize.height / originalImageSize.height;
	const s0 = Math.max(scaleX, scaleY); // Cover uses the larger scale factor

	// Apply user's additional scaling
	const effectiveScale = s0 * backgroundPosition.scale;

	// Calculate draw dimensions (same as computeDraw)
	const drawW = originalImageSize.width * effectiveScale;
	const drawH = originalImageSize.height * effectiveScale;

	// Center the image by default, then apply user offset (same as computeDraw)
	const centerOffset = {
		x: (templateSize.width - drawW) / 2,
		y: (templateSize.height - drawH) / 2
	};

	const topLeft = {
		x: centerOffset.x + backgroundPosition.x,
		y: centerOffset.y + backgroundPosition.y
	};

	// ✅ SYNCHRONIZED: Use the same viewport calculation as computeContainerViewportInImage
	// Map container viewport (0,0,templateWidth,templateHeight) back to image coordinates
	const viewportLeft = 0;
	const viewportTop = 0;
	const viewportRight = templateSize.width;
	const viewportBottom = templateSize.height;

	// Convert viewport corners to image coordinates
	const imageLeft = (viewportLeft - topLeft.x) / effectiveScale;
	const imageTop = (viewportTop - topLeft.y) / effectiveScale;
	const imageRight = (viewportRight - topLeft.x) / effectiveScale;
	const imageBottom = (viewportBottom - topLeft.y) / effectiveScale;

	// Clamp to image bounds
	const sourceLeft = Math.max(0, imageLeft);
	const sourceTop = Math.max(0, imageTop);
	const sourceRight = Math.min(originalImageSize.width, imageRight);
	const sourceBottom = Math.min(originalImageSize.height, imageBottom);

	// Calculate final source rectangle
	const sourceX = sourceLeft;
	const sourceY = sourceTop;
	const sourceWidth = Math.max(0, sourceRight - sourceLeft);
	const sourceHeight = Math.max(0, sourceBottom - sourceTop);

	// For destination, we need to account for where the image actually starts drawing
	const destX = Math.max(0, topLeft.x);
	const destY = Math.max(0, topLeft.y);
	const destWidth = Math.min(templateSize.width - destX, drawW);
	const destHeight = Math.min(templateSize.height - destY, drawH);

	// ✅ DEBUG: Log coordinate transformation for validation
	console.log('🎯 calculateCropArea debug:', {
		originalImageSize,
		templateSize,
		backgroundPosition,
		scales: { scaleX, scaleY, s0, effectiveScale },
		drawDimensions: { drawW, drawH },
		centerOffset,
		topLeft,
		viewportBounds: { viewportLeft, viewportTop, viewportRight, viewportBottom },
		imageCoords: { imageLeft, imageTop, imageRight, imageBottom },
		sourceBounds: { sourceLeft, sourceTop, sourceRight, sourceBottom },
		finalResult: {
			source: { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight },
			dest: { x: destX, y: destY, width: destWidth, height: destHeight }
		}
	});

	return {
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		destX,
		destY,
		destWidth,
		destHeight
	};
}

/**
 * Crops a background image based on current positioning while maintaining quality
 */
export async function cropBackgroundImage(
	imageFile: File,
	templateSize: ImageDimensions,
	backgroundPosition: BackgroundPosition,
	format: 'image/jpeg' | 'image/png' = 'image/jpeg',
	quality: number = 0.95
): Promise<CropResult> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			try {
				const originalSize = { width: img.width, height: img.height };
				const wasCropped = needsCropping(originalSize, templateSize, backgroundPosition);

				console.log('🖼️ Cropping debug:', {
					originalSize,
					templateSize,
					backgroundPosition,
					wasCropped,
					imageFileName: imageFile.name,
					aspectRatio: {
						image: (originalSize.width / originalSize.height).toFixed(3),
						template: (templateSize.width / templateSize.height).toFixed(3)
					}
				});

				// Create high-resolution canvas
				const canvas = document.createElement('canvas');
				canvas.width = templateSize.width;
				canvas.height = templateSize.height;
				const ctx = canvas.getContext('2d', { alpha: false });

				if (!ctx) {
					throw new Error('Failed to get canvas context');
				}

				// Fill with white background
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, templateSize.width, templateSize.height);

				if (wasCropped) {
					// Calculate crop area for positioning
					const cropArea = calculateCropArea(originalSize, templateSize, backgroundPosition);

					console.log('🔍 Crop area calculated:', cropArea);

					// Validate crop area values
					if (
						cropArea.sourceWidth <= 0 ||
						cropArea.sourceHeight <= 0 ||
						cropArea.destWidth <= 0 ||
						cropArea.destHeight <= 0
					) {
						console.error('❌ Invalid crop area:', cropArea);
						throw new Error('Invalid crop area calculated');
					}

					// Draw the cropped/positioned image
					ctx.drawImage(
						img,
						Math.max(0, cropArea.sourceX),
						Math.max(0, cropArea.sourceY),
						Math.min(originalSize.width, cropArea.sourceWidth),
						Math.min(originalSize.height, cropArea.sourceHeight),
						cropArea.destX,
						cropArea.destY,
						cropArea.destWidth,
						cropArea.destHeight
					);
				} else {
					console.log('📐 No cropping needed, scaling image to template size');
					// No cropping needed, draw image to fit template exactly
					ctx.drawImage(img, 0, 0, templateSize.width, templateSize.height);
				}

				// Convert canvas to blob with high quality
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error('Failed to create blob from canvas'));
							return;
						}

						// Create new file with same name but indicate it's processed
						const filename = imageFile.name.replace(/\.[^/.]+$/, '_cropped$&');
						const croppedFile = new File([blob], filename, { type: format });

						resolve({
							croppedFile,
							wasCropped,
							originalSize,
							croppedSize: templateSize
						});
					},
					format,
					quality
				);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			reject(new Error('Failed to load image'));
		};

		// Load the original image file
		img.src = URL.createObjectURL(imageFile);
	});
}

/**
 * Generate a crop preview data URL for dialog display
 * Uses the same logic as cropBackgroundImage but returns a data URL instead of File
 */
export async function generateCropPreviewUrl(
	imageFile: File,
	templateSize: ImageDimensions,
	backgroundPosition: BackgroundPosition,
	format: 'image/jpeg' | 'image/png' = 'image/jpeg',
	quality: number = 0.85 // Slightly lower quality for preview
): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			try {
				const originalSize = { width: img.width, height: img.height };
				const wasCropped = needsCropping(originalSize, templateSize, backgroundPosition);

				// Create preview canvas - use smaller dimensions for performance
				const previewScale = Math.min(1, 400 / Math.max(templateSize.width, templateSize.height));
				const previewWidth = Math.round(templateSize.width * previewScale);
				const previewHeight = Math.round(templateSize.height * previewScale);

				const canvas = document.createElement('canvas');
				canvas.width = previewWidth;
				canvas.height = previewHeight;
				const ctx = canvas.getContext('2d', { alpha: false });

				if (!ctx) {
					throw new Error('Failed to get canvas context for preview');
				}

				// Fill with white background
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, previewWidth, previewHeight);

				if (wasCropped) {
					// Use same crop area calculation as the main function
					const cropArea = calculateCropArea(originalSize, templateSize, backgroundPosition);

					// Validate crop area
					if (
						cropArea.sourceWidth <= 0 ||
						cropArea.sourceHeight <= 0 ||
						cropArea.destWidth <= 0 ||
						cropArea.destHeight <= 0
					) {
						throw new Error('Invalid crop area calculated for preview');
					}

					// Scale crop area to preview dimensions
					const scaledDestX = cropArea.destX * previewScale;
					const scaledDestY = cropArea.destY * previewScale;
					const scaledDestWidth = cropArea.destWidth * previewScale;
					const scaledDestHeight = cropArea.destHeight * previewScale;

					// Draw the cropped/positioned image at preview scale
					ctx.drawImage(
						img,
						Math.max(0, cropArea.sourceX),
						Math.max(0, cropArea.sourceY),
						Math.min(originalSize.width, cropArea.sourceWidth),
						Math.min(originalSize.height, cropArea.sourceHeight),
						scaledDestX,
						scaledDestY,
						scaledDestWidth,
						scaledDestHeight
					);
				} else {
					// No cropping needed, draw scaled to fit preview exactly
					ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
				}

				// Convert to data URL
				const dataUrl = canvas.toDataURL(format, quality);
				resolve(dataUrl);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			reject(new Error('Failed to load image for preview'));
		};

		// Load the original image file
		img.src = URL.createObjectURL(imageFile);
	});
}

/**
 * Generate a crop preview from an image URL (instead of File)
 * This is useful for existing templates with URL-based backgrounds
 */
export async function generateCropPreviewFromUrl(
	imageUrl: string,
	templateSize: ImageDimensions,
	backgroundPosition: BackgroundPosition,
	format: 'image/jpeg' | 'image/png' = 'image/jpeg',
	quality: number = 0.85
): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous'; // Required for CORS

		img.onload = () => {
			try {
				const originalSize = { width: img.width, height: img.height };
				const wasCropped = needsCropping(originalSize, templateSize, backgroundPosition);

				console.log('🖼️ generateCropPreviewFromUrl:', {
					originalSize,
					templateSize,
					backgroundPosition,
					wasCropped
				});

				// Create preview canvas - use smaller dimensions for performance
				const previewScale = Math.min(1, 400 / Math.max(templateSize.width, templateSize.height));
				const previewWidth = Math.round(templateSize.width * previewScale);
				const previewHeight = Math.round(templateSize.height * previewScale);

				const canvas = document.createElement('canvas');
				canvas.width = previewWidth;
				canvas.height = previewHeight;
				const ctx = canvas.getContext('2d', { alpha: false });

				if (!ctx) {
					throw new Error('Failed to get canvas context for preview');
				}

				// Fill with white background
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, previewWidth, previewHeight);

				if (wasCropped) {
					// Use same crop area calculation as the main function
					const cropArea = calculateCropArea(originalSize, templateSize, backgroundPosition);

					// Validate crop area
					if (
						cropArea.sourceWidth <= 0 ||
						cropArea.sourceHeight <= 0 ||
						cropArea.destWidth <= 0 ||
						cropArea.destHeight <= 0
					) {
						throw new Error('Invalid crop area calculated for preview');
					}

					// Scale crop area to preview dimensions
					const scaledDestX = cropArea.destX * previewScale;
					const scaledDestY = cropArea.destY * previewScale;
					const scaledDestWidth = cropArea.destWidth * previewScale;
					const scaledDestHeight = cropArea.destHeight * previewScale;

					// Draw the cropped/positioned image at preview scale
					ctx.drawImage(
						img,
						Math.max(0, cropArea.sourceX),
						Math.max(0, cropArea.sourceY),
						Math.min(originalSize.width, cropArea.sourceWidth),
						Math.min(originalSize.height, cropArea.sourceHeight),
						scaledDestX,
						scaledDestY,
						scaledDestWidth,
						scaledDestHeight
					);
				} else {
					// No cropping needed, draw scaled to fit preview exactly
					ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
				}

				// Convert to data URL
				const dataUrl = canvas.toDataURL(format, quality);
				resolve(dataUrl);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			reject(new Error(`Failed to load image from URL: ${imageUrl.substring(0, 50)}...`));
		};

		// Load the image from URL
		img.src = imageUrl;
	});
}

/**
 * Utility to get image dimensions without loading full image
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			URL.revokeObjectURL(img.src);
			resolve({ width: img.width, height: img.height });
		};

		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			reject(new Error('Failed to load image'));
		};

		img.src = URL.createObjectURL(file);
	});
}

/**
 * Creates a low-resolution version of an image for thumbnail display.
 * Max dimension set to 300px (standard thumbnail size).
 */
export async function createLowResVersion(
	imageFile: File,
	maxDimension: number = 300,
	quality: number = 0.8
): Promise<File> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(img.src);
			try {
				let { width, height } = img;

				// Calculate new dimensions maintaining aspect ratio
				if (width > height) {
					if (width > maxDimension) {
						height = Math.round((height * maxDimension) / width);
						width = maxDimension;
					}
				} else {
					if (height > maxDimension) {
						width = Math.round((width * maxDimension) / height);
						height = maxDimension;
					}
				}

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (!ctx) throw new Error('Failed to get canvas context');

				// Use better interpolation for downscaling
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = 'high';

				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error('Failed to create low-res blob'));
							return;
						}
						const filename = imageFile.name.replace(/\.[^/.]+$/, '_low$&');
						resolve(new File([blob], filename, { type: 'image/jpeg' }));
					},
					'image/jpeg',
					quality
				);
			} catch (e) {
				reject(e);
			}
		};
		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			reject(new Error('Failed to load image for resizing'));
		};
		img.src = URL.createObjectURL(imageFile);
	});
}
