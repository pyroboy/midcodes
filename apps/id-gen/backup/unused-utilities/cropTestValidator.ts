/**
 * Test validation utility for verifying cropping accuracy
 * Provides helpers to validate that crop frames match final crop output
 */

import {
	needsCropping,
	cropBackgroundImage,
	getImageDimensions,
	generateCropPreviewUrl,
	type BackgroundPosition
} from './imageCropper';
import {
	computeContainerViewportInImage,
	mapImageRectToThumb,
	coverBase
} from './backgroundGeometry';

export interface CropValidationResult {
	success: boolean;
	testName: string;
	errors: string[];
	warnings: string[];
	details: {
		originalSize: { width: number; height: number };
		requiredSize: { width: number; height: number };
		position: BackgroundPosition;
		needsCropping: boolean;
		thumbnailSize: { width: number; height: number };
		cropFrameRect?: { x: number; y: number; width: number; height: number };
		expectedCropArea?: { x: number; y: number; width: number; height: number };
	};
}

/**
 * Validates crop frame accuracy for a given image and settings
 */
export async function validateCropFrame(
	imageFile: File,
	requiredDimensions: { width: number; height: number },
	backgroundPosition: BackgroundPosition,
	thumbnailSize: { width: number; height: number },
	testName: string = 'Crop Frame Test'
): Promise<CropValidationResult> {
	const result: CropValidationResult = {
		success: false,
		testName,
		errors: [],
		warnings: [],
		details: {
			originalSize: { width: 0, height: 0 },
			requiredSize: requiredDimensions,
			position: backgroundPosition,
			needsCropping: false,
			thumbnailSize
		}
	};

	try {
		// Get original image dimensions
		const originalSize = await getImageDimensions(imageFile);
		result.details.originalSize = originalSize;

		// Check if cropping is needed
		const cropRequired = needsCropping(originalSize, requiredDimensions, backgroundPosition);
		result.details.needsCropping = cropRequired;

		if (!cropRequired) {
			result.warnings.push('No cropping required for this image/position combination');
		}

		// Calculate thumbnail crop frame using BackgroundThumbnail logic
		const containerViewport = computeContainerViewportInImage(
			originalSize.width,
			originalSize.height,
			requiredDimensions.width,
			requiredDimensions.height,
			backgroundPosition.x,
			backgroundPosition.y,
			backgroundPosition.scale
		);

		const cropFrameRect = mapImageRectToThumb(
			containerViewport,
			originalSize.width,
			originalSize.height,
			thumbnailSize.width,
			thumbnailSize.height
		);

		result.details.cropFrameRect = cropFrameRect;

		// Calculate expected crop area using imageCropper logic
		const coverInfo = coverBase(originalSize.width, originalSize.height, requiredDimensions.width, requiredDimensions.height);
		const scaledImageWidth = coverInfo.scaledWidth * backgroundPosition.scale;
		const scaledImageHeight = coverInfo.scaledHeight * backgroundPosition.scale;
		
		const offsetX = (requiredDimensions.width - scaledImageWidth) / 2 + backgroundPosition.x;
		const offsetY = (requiredDimensions.height - scaledImageHeight) / 2 + backgroundPosition.y;

		// Expected crop area in image space
		const cropX = Math.max(0, -offsetX * (originalSize.width / scaledImageWidth));
		const cropY = Math.max(0, -offsetY * (originalSize.height / scaledImageHeight));
		const cropWidth = Math.min(
			originalSize.width - cropX,
			requiredDimensions.width * (originalSize.width / scaledImageWidth)
		);
		const cropHeight = Math.min(
			originalSize.height - cropY,
			requiredDimensions.height * (originalSize.height / scaledImageHeight)
		);

		result.details.expectedCropArea = {
			x: Math.round(cropX),
			y: Math.round(cropY), 
			width: Math.round(cropWidth),
			height: Math.round(cropHeight)
		};

		// Validate consistency (convert thumbnail frame back to image coordinates for comparison)
		const imageFrameFromThumb = {
			x: (cropFrameRect.x / thumbnailSize.width) * originalSize.width,
			y: (cropFrameRect.y / thumbnailSize.height) * originalSize.height,
			width: (cropFrameRect.width / thumbnailSize.width) * originalSize.width,
			height: (cropFrameRect.height / thumbnailSize.height) * originalSize.height
		};

		// Allow small rounding differences (2 pixels tolerance)
		const tolerance = 2;
		const xDiff = Math.abs(imageFrameFromThumb.x - result.details.expectedCropArea.x);
		const yDiff = Math.abs(imageFrameFromThumb.y - result.details.expectedCropArea.y);
		const wDiff = Math.abs(imageFrameFromThumb.width - result.details.expectedCropArea.width);
		const hDiff = Math.abs(imageFrameFromThumb.height - result.details.expectedCropArea.height);

		if (xDiff > tolerance) {
			result.errors.push(`Crop frame X coordinate mismatch: thumbnail shows ${imageFrameFromThumb.x.toFixed(1)}, expected ${result.details.expectedCropArea.x} (diff: ${xDiff.toFixed(1)})`);
		}
		if (yDiff > tolerance) {
			result.errors.push(`Crop frame Y coordinate mismatch: thumbnail shows ${imageFrameFromThumb.y.toFixed(1)}, expected ${result.details.expectedCropArea.y} (diff: ${yDiff.toFixed(1)})`);
		}
		if (wDiff > tolerance) {
			result.errors.push(`Crop frame width mismatch: thumbnail shows ${imageFrameFromThumb.width.toFixed(1)}, expected ${result.details.expectedCropArea.width} (diff: ${wDiff.toFixed(1)})`);
		}
		if (hDiff > tolerance) {
			result.errors.push(`Crop frame height mismatch: thumbnail shows ${imageFrameFromThumb.height.toFixed(1)}, expected ${result.details.expectedCropArea.height} (diff: ${hDiff.toFixed(1)})`);
		}

		result.success = result.errors.length === 0;

	} catch (error) {
		result.errors.push(`Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	return result;
}

/**
 * Runs a comprehensive test suite with various image scenarios
 */
export async function runCropTestSuite(
	testImages: File[],
	requiredDimensions: { width: number; height: number },
	thumbnailSize: { width: number; height: number } = { width: 120, height: 120 }
): Promise<CropValidationResult[]> {
	const results: CropValidationResult[] = [];

	// Test positions: centered, scaled up, scaled down, offset
	const testPositions: Array<{ position: BackgroundPosition; name: string }> = [
		{ position: { x: 0, y: 0, scale: 1 }, name: 'Centered Default' },
		{ position: { x: 0, y: 0, scale: 1.5 }, name: 'Scaled Up 1.5x' },
		{ position: { x: 0, y: 0, scale: 0.8 }, name: 'Scaled Down 0.8x' },
		{ position: { x: 50, y: -30, scale: 1 }, name: 'Offset Right+Up' },
		{ position: { x: -40, y: 60, scale: 1.2 }, name: 'Offset Left+Down Scaled' }
	];

	for (const image of testImages) {
		for (const { position, name } of testPositions) {
			const testName = `${image.name} - ${name}`;
			const result = await validateCropFrame(
				image,
				requiredDimensions,
				position,
				thumbnailSize,
				testName
			);
			results.push(result);
		}
	}

	return results;
}

/**
 * Generates a summary report of test results
 */
export function generateTestReport(results: CropValidationResult[]): string {
	const passed = results.filter(r => r.success).length;
	const failed = results.filter(r => !r.success).length;
	const warnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

	let report = `
=== CROP VALIDATION TEST REPORT ===
Total Tests: ${results.length}
✅ Passed: ${passed}
❌ Failed: ${failed}
⚠️  Warnings: ${warnings}

`;

	if (failed > 0) {
		report += `FAILED TESTS:\n`;
		results.filter(r => !r.success).forEach(result => {
			report += `\n📋 ${result.testName}\n`;
			result.errors.forEach(error => {
				report += `   ❌ ${error}\n`;
			});
			if (result.warnings.length > 0) {
				result.warnings.forEach(warning => {
					report += `   ⚠️  ${warning}\n`;
				});
			}
		});
	}

	if (warnings > 0 && failed === 0) {
		report += `WARNINGS:\n`;
		results.filter(r => r.warnings.length > 0).forEach(result => {
			report += `\n📋 ${result.testName}\n`;
			result.warnings.forEach(warning => {
				report += `   ⚠️  ${warning}\n`;
			});
		});
	}

	return report;
}

/**
 * Console logging helper for test results
 */
export function logTestResults(results: CropValidationResult[]): void {
	console.group('🧪 Crop Frame Validation Results');
	
	results.forEach(result => {
		const icon = result.success ? '✅' : '❌';
		console.group(`${icon} ${result.testName}`);
		
		console.log('Details:', result.details);
		
		if (result.errors.length > 0) {
			console.error('Errors:', result.errors);
		}
		
		if (result.warnings.length > 0) {
			console.warn('Warnings:', result.warnings);
		}
		
		console.groupEnd();
	});
	
	console.groupEnd();
	
	// Print summary
	const report = generateTestReport(results);
	console.log(report);
}
