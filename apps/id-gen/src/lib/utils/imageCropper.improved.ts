/**
 * IMPROVED High-quality image cropping utility with enhanced error handling
 * This is a robust version of imageCropper.ts with comprehensive error handling and debugging
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
 * Enhanced file validation
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: `Invalid file type: ${file.type}. Expected image/*` };
    }

    // Check file size (max 50MB to be generous)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        return { valid: false, error: `File too large: ${file.size} bytes. Maximum allowed: ${maxSize} bytes` };
    }

    // Check file name
    if (!file.name || file.name.length === 0) {
        return { valid: false, error: 'File has no name' };
    }

    return { valid: true };
}

/**
 * Validate image dimensions and position values
 */
function validateInputs(
    originalImageSize: ImageDimensions, 
    templateSize: ImageDimensions, 
    backgroundPosition: BackgroundPosition
): { valid: boolean; error?: string } {
    // Validate original image size
    if (!originalImageSize || originalImageSize.width <= 0 || originalImageSize.height <= 0) {
        return { valid: false, error: `Invalid original image dimensions: ${JSON.stringify(originalImageSize)}` };
    }

    // Validate template size
    if (!templateSize || templateSize.width <= 0 || templateSize.height <= 0) {
        return { valid: false, error: `Invalid template dimensions: ${JSON.stringify(templateSize)}` };
    }

    // Validate background position
    if (!backgroundPosition || 
        typeof backgroundPosition.x !== 'number' || !isFinite(backgroundPosition.x) ||
        typeof backgroundPosition.y !== 'number' || !isFinite(backgroundPosition.y) ||
        typeof backgroundPosition.scale !== 'number' || !isFinite(backgroundPosition.scale) ||
        backgroundPosition.scale <= 0) {
        return { valid: false, error: `Invalid background position: ${JSON.stringify(backgroundPosition)}` };
    }

    return { valid: true };
}

/**
 * Determines if an image needs cropping based on current positioning
 */
export function needsCropping(
    originalImageSize: ImageDimensions,
    templateSize: ImageDimensions,
    backgroundPosition: BackgroundPosition
): boolean {
    try {
        const validation = validateInputs(originalImageSize, templateSize, backgroundPosition);
        if (!validation.valid) {
            console.warn('⚠️ Invalid inputs for needsCropping:', validation.error);
            return true; // Default to cropping if validation fails
        }

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
        const isOffCenter = Math.abs(backgroundPosition.x) > 0.1 || Math.abs(backgroundPosition.y) > 0.1;

        const result = extendsWidth || extendsHeight || isOffCenter;
        
        console.log('🔍 needsCropping analysis:', {
            originalImageSize,
            templateSize,
            backgroundPosition,
            coverScale,
            totalScale,
            scaledDimensions: { width: scaledWidth, height: scaledHeight },
            checks: { extendsWidth, extendsHeight, isOffCenter },
            needsCropping: result
        });

        return result;
    } catch (error) {
        console.error('❌ Error in needsCropping:', error);
        return true; // Default to cropping if error occurs
    }
}

/**
 * Enhanced crop area calculation with comprehensive error handling
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
    console.log('🎯 calculateCropArea inputs:', {
        originalImageSize,
        templateSize,
        backgroundPosition
    });

    // Validate inputs
    const validation = validateInputs(originalImageSize, templateSize, backgroundPosition);
    if (!validation.valid) {
        throw new Error(`Invalid inputs for crop calculation: ${validation.error}`);
    }

    try {
        // Use the same coverBase logic as backgroundGeometry.ts
        const imageAspect = originalImageSize.width / originalImageSize.height;
        const templateAspect = templateSize.width / templateSize.height;

        // Calculate cover scale (background-size: cover behavior)
        const scaleX = templateSize.width / originalImageSize.width;
        const scaleY = templateSize.height / originalImageSize.height;
        const s0 = Math.max(scaleX, scaleY); // Cover uses the larger scale factor

        console.log('📏 Scale calculations:', { scaleX, scaleY, s0, userScale: backgroundPosition.scale });

        // Apply user's additional scaling
        const effectiveScale = s0 * backgroundPosition.scale;

        // Validate effective scale
        if (!isFinite(effectiveScale) || effectiveScale <= 0) {
            throw new Error(`Invalid effective scale calculated: ${effectiveScale}`);
        }

        // Calculate draw dimensions
        const drawW = originalImageSize.width * effectiveScale;
        const drawH = originalImageSize.height * effectiveScale;

        console.log('📐 Draw dimensions:', { drawW, drawH, effectiveScale });

        // Center the image by default, then apply user offset
        const centerOffset = {
            x: (templateSize.width - drawW) / 2,
            y: (templateSize.height - drawH) / 2
        };

        const topLeft = {
            x: centerOffset.x + backgroundPosition.x,
            y: centerOffset.y + backgroundPosition.y
        };

        console.log('📍 Positioning:', { centerOffset, topLeft });

        // Map container viewport back to image coordinates
        const viewportLeft = 0;
        const viewportTop = 0;
        const viewportRight = templateSize.width;
        const viewportBottom = templateSize.height;

        // Convert viewport corners to image coordinates
        const imageLeft = (viewportLeft - topLeft.x) / effectiveScale;
        const imageTop = (viewportTop - topLeft.y) / effectiveScale;
        const imageRight = (viewportRight - topLeft.x) / effectiveScale;
        const imageBottom = (viewportBottom - topLeft.y) / effectiveScale;

        console.log('🗺️ Image coordinates:', { imageLeft, imageTop, imageRight, imageBottom });

        // Clamp to image bounds with additional validation
        const sourceLeft = Math.max(0, Math.min(imageLeft, originalImageSize.width));
        const sourceTop = Math.max(0, Math.min(imageTop, originalImageSize.height));
        const sourceRight = Math.min(originalImageSize.width, Math.max(imageRight, sourceLeft));
        const sourceBottom = Math.min(originalImageSize.height, Math.max(imageBottom, sourceTop));

        // Calculate final source rectangle
        const sourceX = sourceLeft;
        const sourceY = sourceTop;
        const sourceWidth = Math.max(0, sourceRight - sourceLeft);
        const sourceHeight = Math.max(0, sourceBottom - sourceTop);

        // Validate source dimensions
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            console.warn('⚠️ Invalid source dimensions calculated, using fallback');
            return {
                sourceX: 0,
                sourceY: 0,
                sourceWidth: originalImageSize.width,
                sourceHeight: originalImageSize.height,
                destX: 0,
                destY: 0,
                destWidth: templateSize.width,
                destHeight: templateSize.height
            };
        }

        // For destination, account for where the image actually starts drawing
        const destX = Math.max(0, topLeft.x);
        const destY = Math.max(0, topLeft.y);
        const destWidth = Math.min(templateSize.width - destX, drawW);
        const destHeight = Math.min(templateSize.height - destY, drawH);

        const result = {
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            destX,
            destY,
            destWidth,
            destHeight
        };

        console.log('✅ Crop area calculated:', result);

        // Final validation
        if (result.sourceWidth <= 0 || result.sourceHeight <= 0 || 
            result.destWidth <= 0 || result.destHeight <= 0) {
            throw new Error(`Invalid crop area calculated: ${JSON.stringify(result)}`);
        }

        return result;
        
    } catch (error) {
        console.error('❌ Error in calculateCropArea:', error);
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Crop area calculation failed: ${message}`);
    }
}

/**
 * Enhanced image cropping with comprehensive error handling and debugging
 */
export async function cropBackgroundImage(
    imageFile: File,
    templateSize: ImageDimensions,
    backgroundPosition: BackgroundPosition,
    format: 'image/jpeg' | 'image/png' = 'image/jpeg',
    quality: number = 0.95
): Promise<CropResult> {
    console.log('🖼️ Starting cropBackgroundImage:', {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        templateSize,
        backgroundPosition,
        format,
        quality
    });

    // Validate file
    const fileValidation = validateImageFile(imageFile);
    if (!fileValidation.valid) {
        throw new Error(`File validation failed: ${fileValidation.error}`);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        let imageObjectUrl: string | null = null;

        // Enhanced error handling for image load
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Image loading timed out after 30 seconds'));
        }, 30000);

        const cleanup = () => {
            clearTimeout(timeout);
            if (imageObjectUrl) {
                URL.revokeObjectURL(imageObjectUrl);
                imageObjectUrl = null;
            }
        };

        img.onload = () => {
            clearTimeout(timeout);
            
            try {
                const originalSize = { width: img.width, height: img.height };
                console.log('🖼️ Image loaded successfully:', originalSize);

                // Validate loaded image
                if (originalSize.width <= 0 || originalSize.height <= 0) {
                    throw new Error(`Invalid loaded image dimensions: ${originalSize.width}x${originalSize.height}`);
                }

                const wasCropped = needsCropping(originalSize, templateSize, backgroundPosition);

                console.log('📊 Processing decision:', {
                    originalSize,
                    templateSize,
                    backgroundPosition,
                    wasCropped
                });

                // Create canvas with enhanced error handling
                const canvas = document.createElement('canvas');
                if (!canvas) {
                    throw new Error('Failed to create canvas element');
                }

                canvas.width = templateSize.width;
                canvas.height = templateSize.height;

                const ctx = canvas.getContext('2d', { 
                    alpha: false,
                    willReadFrequently: false // Optimize for drawing
                });

                if (!ctx) {
                    throw new Error('Failed to get 2D rendering context from canvas');
                }

                console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);

                // Fill with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, templateSize.width, templateSize.height);

                if (wasCropped) {
                    // Calculate crop area with error handling
                    const cropArea = calculateCropArea(originalSize, templateSize, backgroundPosition);

                    console.log('🔍 Drawing cropped image:', cropArea);

                    // Validate all drawing parameters
                    const sx = Math.max(0, Math.min(cropArea.sourceX, originalSize.width));
                    const sy = Math.max(0, Math.min(cropArea.sourceY, originalSize.height));
                    const sWidth = Math.max(1, Math.min(cropArea.sourceWidth, originalSize.width - cropArea.sourceX));
                    const sHeight = Math.max(1, Math.min(cropArea.sourceHeight, originalSize.height - cropArea.sourceY));
                    const dx = Math.max(0, Math.min(cropArea.destX, templateSize.width));
                    const dy = Math.max(0, Math.min(cropArea.destY, templateSize.height));
                    const dWidth = Math.max(1, Math.min(cropArea.destWidth, templateSize.width - cropArea.destX));
                    const dHeight = Math.max(1, Math.min(cropArea.destHeight, templateSize.height - cropArea.destY));

                    console.log('🎨 Final draw parameters:', [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight]);

                    // Validate parameters before drawing
                    const allParams = [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight];
                    if (allParams.some(param => !isFinite(param) || param < 0)) {
                        throw new Error(`Invalid drawing parameters: ${JSON.stringify(allParams)}`);
                    }

                    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
                } else {
                    console.log('📐 Drawing image to fit template exactly');
                    ctx.drawImage(img, 0, 0, templateSize.width, templateSize.height);
                }

                console.log('🎨 Image drawn successfully, converting to blob...');

                // Convert canvas to blob with error handling
                canvas.toBlob(
                    (blob) => {
                        cleanup();
                        
                        if (!blob) {
                            reject(new Error('Failed to create blob from canvas - canvas.toBlob returned null'));
                            return;
                        }

                        console.log('✅ Blob created:', blob.size, 'bytes');

                        try {
                            // Create new file with processed suffix
                            const originalName = imageFile.name;
                            const extension = originalName.substring(originalName.lastIndexOf('.'));
                            const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
                            const processedName = `${baseName}_processed${extension}`;
                            
                            const croppedFile = new File([blob], processedName, { type: format });

                            const result: CropResult = {
                                croppedFile,
                                wasCropped,
                                originalSize,
                                croppedSize: templateSize
                            };

                            console.log('🎉 cropBackgroundImage completed successfully:', {
                                outputFileName: croppedFile.name,
                                outputFileSize: croppedFile.size,
                                wasCropped,
                                originalSize,
                                croppedSize: templateSize
                            });

                            resolve(result);
                            
                        } catch (fileError) {
                            const message = fileError instanceof Error ? fileError.message : String(fileError);
                            reject(new Error(`Failed to create result file: ${message}`));
                        }
                    },
                    format,
                    quality
                );

            } catch (processingError) {
                cleanup();
                console.error('❌ Error during image processing:', processingError);
                const message = processingError instanceof Error ? processingError.message : String(processingError);
                reject(new Error(`Image processing failed: ${message}`));
            }
        };

        img.onerror = (errorEvent) => {
            cleanup();
            console.error('❌ Image load error:', errorEvent);
            reject(new Error(`Failed to load image: ${imageFile.name}. The image file may be corrupted or in an unsupported format.`));
        };

        // Load the image
        try {
            imageObjectUrl = URL.createObjectURL(imageFile);
            img.src = imageObjectUrl;
            console.log('📂 Image loading started...');
        } catch (urlError) {
            cleanup();
            const message = urlError instanceof Error ? urlError.message : String(urlError);
            reject(new Error(`Failed to create object URL for image: ${message}`));
        }
    });
}

/**
 * Utility to get image dimensions with enhanced error handling
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
    console.log('📏 Getting image dimensions for:', file.name);

    const fileValidation = validateImageFile(file);
    if (!fileValidation.valid) {
        return Promise.reject(new Error(`File validation failed: ${fileValidation.error}`));
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        let objectUrl: string | null = null;

        const cleanup = () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        };

        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Image dimension detection timed out'));
        }, 10000);

        img.onload = () => {
            clearTimeout(timeout);
            
            try {
                const dimensions = { width: img.width, height: img.height };
                
                if (dimensions.width <= 0 || dimensions.height <= 0) {
                    throw new Error(`Invalid image dimensions: ${dimensions.width}x${dimensions.height}`);
                }

                console.log('✅ Image dimensions:', dimensions);
                cleanup();
                resolve(dimensions);
                
            } catch (error) {
                cleanup();
                const message = error instanceof Error ? error.message : String(error);
                reject(new Error(`Failed to get valid image dimensions: ${message}`));
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            cleanup();
            reject(new Error(`Failed to load image for dimension detection: ${file.name}`));
        };

        try {
            objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
        } catch (error) {
            cleanup();
            const message = error instanceof Error ? error.message : String(error);
            reject(new Error(`Failed to create object URL: ${message}`));
        }
    });
}
