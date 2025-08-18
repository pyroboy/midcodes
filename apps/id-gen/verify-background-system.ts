#!/usr/bin/env tsx
/**
 * Background Image System Verification Script
 * 
 * This script systematically verifies the data flow between components
 * for background image positioning, cropping, and thumbnail functionality.
 * 
 * Run with: npm run verify-background
 */

import type { BackgroundPosition, Dims, Rect } from './src/lib/utils/backgroundGeometry';
import { 
    calculateCropFrame,
    validateCropFrameAlignment,
    calculatePositionFromFrame,
    cssForBackground,
    clampBackgroundPosition,
    thumbnailToCropCoordinates,
    cropToThumbnailCoordinates,
    computeVisibleRectInImage,
    coverBase,
    computeDraw
} from './src/lib/utils/backgroundGeometry';

import type { ImageDimensions } from './src/lib/utils/imageCropper';
import { 
    needsCropping,
    getImageDimensions,
    cropBackgroundImage 
} from './src/lib/utils/imageCropper';

// Test Data Setup
const TEST_CASES = {
    // Standard business card dimensions
    template: { width: 1050, height: 600 } as Dims,
    
    // Various image dimensions to test different aspect ratios
    images: {
        landscape: { width: 1920, height: 1080 } as Dims,
        portrait: { width: 800, height: 1200 } as Dims,
        square: { width: 1000, height: 1000 } as Dims,
        wide: { width: 2400, height: 600 } as Dims,
        tall: { width: 400, height: 1800 } as Dims
    },
    
    // Various background positions to test
    positions: {
        centered: { x: 0, y: 0, scale: 1 },
        offsetRight: { x: 100, y: 0, scale: 1 },
        offsetDown: { x: 0, y: 50, scale: 1 },
        offsetBoth: { x: -75, y: 25, scale: 1 },
        scaledUp: { x: 0, y: 0, scale: 1.5 },
        scaledDown: { x: 0, y: 0, scale: 0.8 },
        scaledAndOffset: { x: 50, y: -30, scale: 1.2 }
    } as Record<string, BackgroundPosition>,
    
    thumbnailSize: 150
};

// Verification Results Tracking
interface VerificationResult {
    test: string;
    category: string;
    passed: boolean;
    message: string;
    details?: any;
}

const results: VerificationResult[] = [];

function logResult(test: string, category: string, passed: boolean, message: string, details?: any) {
    results.push({ test, category, passed, message, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} [${category}] ${test}: ${message}`);
    if (details && !passed) {
        console.log(`   Details:`, JSON.stringify(details, null, 2));
    }
}

function validateNumber(value: number, name: string): boolean {
    if (!isFinite(value) || isNaN(value)) {
        return false;
    }
    return true;
}

function validateDimensions(dims: Dims, name: string): boolean {
    return validateNumber(dims.width, `${name}.width`) && 
           validateNumber(dims.height, `${name}.height`) &&
           dims.width > 0 && dims.height > 0;
}

function validatePosition(pos: BackgroundPosition, name: string): boolean {
    return validateNumber(pos.x, `${name}.x`) && 
           validateNumber(pos.y, `${name}.y`) && 
           validateNumber(pos.scale, `${name}.scale`) &&
           pos.scale > 0;
}

function validateRect(rect: Rect, name: string): boolean {
    return validateNumber(rect.x, `${name}.x`) && 
           validateNumber(rect.y, `${name}.y`) && 
           validateNumber(rect.width, `${name}.width`) && 
           validateNumber(rect.height, `${name}.height`) &&
           rect.width >= 0 && rect.height >= 0;
}

// 2.1 Background Position Data Flow Verification
function verifyPositionDataFlow() {
    console.log('\n🔍 2.1 Background Position Data Flow Verification\n');
    
    Object.entries(TEST_CASES.positions).forEach(([posName, position]) => {
        Object.entries(TEST_CASES.images).forEach(([imgName, imageDims]) => {
            const testName = `${posName} position with ${imgName} image`;
            
            try {
                // Test basic position validation
                if (!validatePosition(position, 'position')) {
                    logResult(testName, 'Position Validation', false, 'Invalid position values', position);
                    return;
                }
                
                // Test that position can be processed by background geometry functions
                const { s0, coverW, coverH } = coverBase(imageDims, TEST_CASES.template);
                const { drawW, drawH, topLeft } = computeDraw(imageDims, TEST_CASES.template, position);
                
                if (!validateNumber(s0, 's0') || !validateNumber(drawW, 'drawW') || 
                    !validateNumber(drawH, 'drawH') || !validateNumber(topLeft.x, 'topLeft.x') || 
                    !validateNumber(topLeft.y, 'topLeft.y')) {
                    logResult(testName, 'Position Processing', false, 'Invalid computed values', {
                        s0, drawW, drawH, topLeft
                    });
                    return;
                }
                
                logResult(testName, 'Position Processing', true, 'Position processed correctly');
                
            } catch (error) {
                logResult(testName, 'Position Processing', false, `Error: ${error}`, { error: error.toString() });
            }
        });
    });
}

// 2.2 BackgroundThumbnail → backgroundGeometry Integration
function verifyThumbnailGeometryIntegration() {
    console.log('\n🔍 2.2 BackgroundThumbnail → backgroundGeometry Integration\n');
    
    Object.entries(TEST_CASES.positions).forEach(([posName, position]) => {
        Object.entries(TEST_CASES.images).forEach(([imgName, imageDims]) => {
            const testName = `Crop frame calculation: ${posName} + ${imgName}`;
            
            try {
                // Test calculateCropFrame
                const cropFrame = calculateCropFrame(
                    imageDims, 
                    TEST_CASES.template, 
                    position, 
                    TEST_CASES.thumbnailSize
                );
                
                if (!validateRect(cropFrame, 'cropFrame')) {
                    logResult(testName, 'Crop Frame', false, 'Invalid crop frame values', cropFrame);
                    return;
                }
                
                // Verify crop frame is within thumbnail bounds
                const withinBounds = 
                    cropFrame.x >= 0 && 
                    cropFrame.y >= 0 && 
                    (cropFrame.x + cropFrame.width) <= TEST_CASES.thumbnailSize &&
                    (cropFrame.y + cropFrame.height) <= TEST_CASES.thumbnailSize;
                
                if (!withinBounds) {
                    logResult(testName, 'Crop Frame', false, 'Crop frame extends beyond thumbnail bounds', cropFrame);
                    return;
                }
                
                // Test calculatePositionFromFrame (reverse calculation)
                const reversePosition = calculatePositionFromFrame(
                    cropFrame.width,
                    cropFrame.height,
                    cropFrame.x,
                    cropFrame.y,
                    imageDims,
                    TEST_CASES.template,
                    TEST_CASES.thumbnailSize
                );
                
                if (!validatePosition(reversePosition, 'reversePosition')) {
                    logResult(testName, 'Position Calculation', false, 'Invalid reverse position calculation', reversePosition);
                    return;
                }
                
                // Test validateCropFrameAlignment
                const isValidAlignment = validateCropFrameAlignment(imageDims, TEST_CASES.template, position);
                
                logResult(testName, 'Crop Frame', true, `Frame calculated correctly. Alignment: ${isValidAlignment ? 'valid' : 'invalid'}`);
                
            } catch (error) {
                logResult(testName, 'Crop Frame', false, `Error: ${error}`, { error: error.toString() });
            }
        });
    });
}

// 2.3 Cropping Workflow Verification
function verifyCroppingWorkflow() {
    console.log('\n🔍 2.3 Cropping Workflow Verification\n');
    
    Object.entries(TEST_CASES.positions).forEach(([posName, position]) => {
        Object.entries(TEST_CASES.images).forEach(([imgName, imageDims]) => {
            const testName = `Cropping workflow: ${posName} + ${imgName}`;
            
            try {
                // Test needsCropping function
                const croppingRequired = needsCropping(
                    imageDims as ImageDimensions, 
                    TEST_CASES.template as ImageDimensions, 
                    position
                );
                
                // Test clampBackgroundPosition
                const clampedPosition = clampBackgroundPosition(
                    imageDims, 
                    TEST_CASES.template, 
                    position
                );
                
                if (!validatePosition(clampedPosition, 'clampedPosition')) {
                    logResult(testName, 'Position Clamping', false, 'Invalid clamped position', clampedPosition);
                    return;
                }
                
                // Verify clamping works correctly (position should not extend beyond reasonable bounds)
                const { drawW, drawH } = computeDraw(imageDims, TEST_CASES.template, clampedPosition);
                const centerOffset = {
                    x: (TEST_CASES.template.width - drawW) / 2,
                    y: (TEST_CASES.template.height - drawH) / 2
                };
                
                const topLeft = {
                    x: centerOffset.x + clampedPosition.x,
                    y: centerOffset.y + clampedPosition.y
                };
                
                // Check if image still covers the template after clamping
                const coversTemplate = 
                    topLeft.x <= 0 && 
                    topLeft.y <= 0 && 
                    (topLeft.x + drawW) >= TEST_CASES.template.width &&
                    (topLeft.y + drawH) >= TEST_CASES.template.height;
                
                if (!coversTemplate && clampedPosition.scale >= 1) {
                    logResult(testName, 'Position Clamping', false, 'Clamped position may expose white edges', {
                        clampedPosition,
                        topLeft,
                        drawSize: { w: drawW, h: drawH },
                        templateSize: TEST_CASES.template
                    });
                    return;
                }
                
                logResult(testName, 'Cropping Workflow', true, 
                    `Cropping: ${croppingRequired ? 'required' : 'not required'}. Position clamped correctly.`);
                
            } catch (error) {
                logResult(testName, 'Cropping Workflow', false, `Error: ${error}`, { error: error.toString() });
            }
        });
    });
}

// 2.4 Cropping Data Integrity Testing
function verifyCroppingDataIntegrity() {
    console.log('\n🔍 2.4 Cropping Data Integrity Testing\n');
    
    // This section focuses on testing the mathematical integrity of cropping calculations
    // without requiring actual file objects
    
    Object.entries(TEST_CASES.positions).forEach(([posName, position]) => {
        Object.entries(TEST_CASES.images).forEach(([imgName, imageDims]) => {
            const testName = `Data integrity: ${posName} + ${imgName}`;
            
            try {
                // Test if positions would create valid crop areas
                const croppingRequired = needsCropping(
                    imageDims as ImageDimensions,
                    TEST_CASES.template as ImageDimensions,
                    position
                );
                
                if (croppingRequired) {
                    // Test coordinate calculations that would be used in actual cropping
                    const visibleRect = computeVisibleRectInImage(imageDims, TEST_CASES.template, position);
                    
                    if (!validateRect(visibleRect, 'visibleRect')) {
                        logResult(testName, 'Data Integrity', false, 'Invalid visible rectangle calculation', visibleRect);
                        return;
                    }
                    
                    // Verify visible rect is within image bounds
                    const withinImageBounds = 
                        visibleRect.x >= 0 && 
                        visibleRect.y >= 0 &&
                        visibleRect.x <= imageDims.width &&
                        visibleRect.y <= imageDims.height &&
                        (visibleRect.x + visibleRect.width) <= imageDims.width &&
                        (visibleRect.y + visibleRect.height) <= imageDims.height;
                    
                    if (!withinImageBounds) {
                        logResult(testName, 'Data Integrity', false, 'Visible rect extends beyond image bounds', {
                            visibleRect,
                            imageDims
                        });
                        return;
                    }
                }
                
                logResult(testName, 'Data Integrity', true, 'Calculations produce valid values');
                
            } catch (error) {
                logResult(testName, 'Data Integrity', false, `Error: ${error}`, { error: error.toString() });
            }
        });
    });
}

// 2.5 Coordinate Translation Verification
function verifyCoordinateTranslation() {
    console.log('\n🔍 2.5 Coordinate Translation Verification\n');
    
    Object.entries(TEST_CASES.positions).forEach(([posName, position]) => {
        Object.entries(TEST_CASES.images).forEach(([imgName, imageDims]) => {
            const testName = `Coordinate translation: ${posName} + ${imgName}`;
            
            try {
                // Test thumbnail to crop coordinate conversion
                const cropPosition = thumbnailToCropCoordinates(
                    position,
                    imageDims,
                    TEST_CASES.template
                );
                
                if (!validatePosition(cropPosition, 'cropPosition')) {
                    logResult(testName, 'Coordinate Translation', false, 'Invalid crop position from thumbnail conversion', cropPosition);
                    return;
                }
                
                // Test reverse conversion
                const thumbPosition = cropToThumbnailCoordinates(
                    cropPosition,
                    imageDims,
                    TEST_CASES.template
                );
                
                if (!validatePosition(thumbPosition, 'thumbPosition')) {
                    logResult(testName, 'Coordinate Translation', false, 'Invalid thumb position from crop conversion', thumbPosition);
                    return;
                }
                
                // Test roundtrip accuracy (should be close to original)
                const tolerance = 0.1; // Allow small floating point differences
                const roundtripAccuracy = 
                    Math.abs(thumbPosition.x - position.x) < tolerance &&
                    Math.abs(thumbPosition.y - position.y) < tolerance &&
                    Math.abs(thumbPosition.scale - position.scale) < tolerance;
                
                if (!roundtripAccuracy) {
                    logResult(testName, 'Coordinate Translation', false, 'Poor roundtrip accuracy', {
                        original: position,
                        afterRoundtrip: thumbPosition,
                        differences: {
                            x: Math.abs(thumbPosition.x - position.x),
                            y: Math.abs(thumbPosition.y - position.y),
                            scale: Math.abs(thumbPosition.scale - position.scale)
                        }
                    });
                    return;
                }
                
                logResult(testName, 'Coordinate Translation', true, 'Roundtrip conversion maintains accuracy');
                
            } catch (error) {
                logResult(testName, 'Coordinate Translation', false, `Error: ${error}`, { error: error.toString() });
            }
        });
    });
}

// 2.6 CSS Generation and 3D Texture Mapping
function verifyCSSGeneration() {
    console.log('\n🔍 2.6 CSS Generation and 3D Texture Mapping\n');
    
    Object.entries(TEST_CASES.positions).forEach(([posName, position]) => {
        Object.entries(TEST_CASES.images).forEach(([imgName, imageDims]) => {
            const testName = `CSS generation: ${posName} + ${imgName}`;
            
            try {
                // Test CSS generation with different scales
                const scales = [1, 0.5, 2];
                
                scales.forEach(scale => {
                    const css = cssForBackground(imageDims, TEST_CASES.template, position, scale);
                    
                    // Verify CSS values are valid numbers
                    if (!validateNumber(css.sizePx.w, 'css.sizePx.w') || 
                        !validateNumber(css.sizePx.h, 'css.sizePx.h') ||
                        !validateNumber(css.posPx.x, 'css.posPx.x') || 
                        !validateNumber(css.posPx.y, 'css.posPx.y')) {
                        logResult(`${testName} (scale ${scale})`, 'CSS Generation', false, 'Invalid CSS values', css);
                        return;
                    }
                    
                    // Verify CSS values are positive for size
                    if (css.sizePx.w <= 0 || css.sizePx.h <= 0) {
                        logResult(`${testName} (scale ${scale})`, 'CSS Generation', false, 'Non-positive size values', css);
                        return;
                    }
                    
                    // Verify scaling consistency
                    const css1x = cssForBackground(imageDims, TEST_CASES.template, position, 1);
                    const expectedScaledW = css1x.sizePx.w * scale;
                    const expectedScaledH = css1x.sizePx.h * scale;
                    const expectedScaledX = css1x.posPx.x * scale;
                    const expectedScaledY = css1x.posPx.y * scale;
                    
                    const scalingAccuracy = 
                        Math.abs(css.sizePx.w - expectedScaledW) < 0.01 &&
                        Math.abs(css.sizePx.h - expectedScaledH) < 0.01 &&
                        Math.abs(css.posPx.x - expectedScaledX) < 0.01 &&
                        Math.abs(css.posPx.y - expectedScaledY) < 0.01;
                    
                    if (!scalingAccuracy) {
                        logResult(`${testName} (scale ${scale})`, 'CSS Generation', false, 'Inconsistent scaling', {
                            css,
                            expected: { w: expectedScaledW, h: expectedScaledH, x: expectedScaledX, y: expectedScaledY }
                        });
                        return;
                    }
                });
                
                logResult(testName, 'CSS Generation', true, 'CSS values generated correctly with consistent scaling');
                
            } catch (error) {
                logResult(testName, 'CSS Generation', false, `Error: ${error}`, { error: error.toString() });
            }
        });
    });
}

// Summary Report
function generateSummary() {
    console.log('\n📊 VERIFICATION SUMMARY\n');
    
    const categories = [...new Set(results.map(r => r.category))];
    let totalPassed = 0;
    let totalTests = results.length;
    
    categories.forEach(category => {
        const categoryResults = results.filter(r => r.category === category);
        const passed = categoryResults.filter(r => r.passed).length;
        const total = categoryResults.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`${category}: ${passed}/${total} (${percentage}%) ${passed === total ? '✅' : '⚠️'}`);
        totalPassed += passed;
    });
    
    console.log(`\nOVERALL: ${totalPassed}/${totalTests} (${Math.round((totalPassed/totalTests)*100)}%)`);
    
    // Show failures
    const failures = results.filter(r => !r.passed);
    if (failures.length > 0) {
        console.log('\n❌ FAILED TESTS:\n');
        failures.forEach(failure => {
            console.log(`• [${failure.category}] ${failure.test}: ${failure.message}`);
        });
    } else {
        console.log('\n🎉 ALL TESTS PASSED!');
    }
    
    return {
        totalTests,
        totalPassed,
        passRate: totalPassed / totalTests,
        categories: categories.map(category => {
            const categoryResults = results.filter(r => r.category === category);
            return {
                category,
                passed: categoryResults.filter(r => r.passed).length,
                total: categoryResults.length
            };
        }),
        failures
    };
}

// Main Verification Runner
async function runVerification() {
    console.log('🔍 BACKGROUND IMAGE SYSTEM VERIFICATION');
    console.log('=====================================\n');
    console.log('Systematically verifying data flow between components for');
    console.log('background image positioning, cropping, and thumbnail functionality.\n');
    
    try {
        // Run all verification sections
        verifyPositionDataFlow();
        verifyThumbnailGeometryIntegration(); 
        verifyCroppingWorkflow();
        verifyCroppingDataIntegrity();
        verifyCoordinateTranslation();
        verifyCSSGeneration();
        
        // Generate summary
        const summary = generateSummary();
        
        // Exit with appropriate code
        process.exit(summary.passRate === 1 ? 0 : 1);
        
    } catch (error) {
        console.error('\n💥 VERIFICATION FAILED WITH ERROR:', error);
        process.exit(1);
    }
}

// Run verification immediately when script is loaded
runVerification();

export { runVerification };
