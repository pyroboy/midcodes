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

	// Check if image extends beyond template bounds or is positioned off-center
	const extendsWidth = scaledWidth > templateSize.width;
	const extendsHeight = scaledHeight > templateSize.height;
	const isOffCenter = backgroundPosition.x !== 0 || backgroundPosition.y !== 0;

	return extendsWidth || extendsHeight || isOffCenter;
}

/**
 * Transforms UI preview coordinates to original image coordinates
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
	// Calculate CSS background-size: cover scaling
	const imageAspect = originalImageSize.width / originalImageSize.height;
	const templateAspect = templateSize.width / templateSize.height;

	let coverScale: number;
	let coverWidth: number;
	let coverHeight: number;
	let coverOffsetX = 0;
	let coverOffsetY = 0;

	if (imageAspect > templateAspect) {
		// Image is wider - height fits, width gets cropped
		coverScale = templateSize.height / originalImageSize.height;
		coverHeight = templateSize.height;
		coverWidth = originalImageSize.width * coverScale;
		coverOffsetX = (templateSize.width - coverWidth) / 2;
	} else {
		// Image is taller - width fits, height gets cropped
		coverScale = templateSize.width / originalImageSize.width;
		coverWidth = templateSize.width;
		coverHeight = originalImageSize.height * coverScale;
		coverOffsetY = (templateSize.height - coverHeight) / 2;
	}

	// Apply user's additional scaling and positioning
	const userScale = backgroundPosition.scale;
	const finalScale = coverScale * userScale;

	const finalWidth = originalImageSize.width * finalScale;
	const finalHeight = originalImageSize.height * finalScale;

	// Convert UI background positioning to actual pixel offsets
	// In CSS, background-position uses percentages where 50% means centered
	// backgroundPosition.x/y are offset values from center position (0 = center)
	const centerOffsetX = (templateSize.width - finalWidth) / 2;
	const centerOffsetY = (templateSize.height - finalHeight) / 2;

	// Apply user positioning offsets
	// backgroundPosition.x/y are direct pixel offsets from the UI
	const userOffsetX = backgroundPosition.x;
	const userOffsetY = backgroundPosition.y;

	// Calculate final positioned area in template space
	const imageLeft = coverOffsetX + centerOffsetX + userOffsetX;
	const imageTop = coverOffsetY + centerOffsetY + userOffsetY;

	// Calculate what portion of the original image corresponds to the template bounds
	// Convert template coordinates back to original image coordinates
	const templateToImageScale = 1 / finalScale;

	// Find the intersection of template bounds with the positioned image
	const sourceLeft = Math.max(0, -imageLeft * templateToImageScale);
	const sourceTop = Math.max(0, -imageTop * templateToImageScale);
	const sourceRight = Math.min(
		originalImageSize.width,
		sourceLeft + templateSize.width * templateToImageScale
	);
	const sourceBottom = Math.min(
		originalImageSize.height,
		sourceTop + templateSize.height * templateToImageScale
	);

	const sourceX = sourceLeft;
	const sourceY = sourceTop;
	const sourceWidth = sourceRight - sourceLeft;
	const sourceHeight = sourceBottom - sourceTop;

	// Destination coordinates (where to place in the template)
	const destX = Math.max(0, imageLeft);
	const destY = Math.max(0, imageTop);
	const destWidth = Math.min(templateSize.width - destX, finalWidth);
	const destHeight = Math.min(templateSize.height - destY, finalHeight);

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
					imageFileName: imageFile.name
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
