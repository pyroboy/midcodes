#!/usr/bin/env node
/**
 * Debug script to test image cropping functionality
 * Run this in the browser console to test the cropping system
 */

// Browser-based debugging script for image cropping
console.log('🔧 Image Cropping Debug Script');
console.log('================================');

// Test function to debug image cropping issues
async function debugImageCropping() {
    try {
        // Create a test canvas with a simple pattern
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Draw a test pattern
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = 'red';
        ctx.fillRect(50, 50, 100, 100);
        ctx.fillStyle = 'green';
        ctx.fillRect(650, 450, 100, 100);
        
        // Convert to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
        
        console.log('📷 Created test image:', {
            name: testFile.name,
            size: testFile.size,
            type: testFile.type
        });
        
        // Test different scenarios
        const scenarios = [
            {
                name: 'Centered, no scaling',
                templateSize: { width: 400, height: 300 },
                position: { x: 0, y: 0, scale: 1 }
            },
            {
                name: 'Scaled up 1.5x',
                templateSize: { width: 400, height: 300 },
                position: { x: 0, y: 0, scale: 1.5 }
            },
            {
                name: 'Scaled down 0.8x',
                templateSize: { width: 400, height: 300 },
                position: { x: 0, y: 0, scale: 0.8 }
            },
            {
                name: 'Offset right and down',
                templateSize: { width: 400, height: 300 },
                position: { x: 50, y: 30, scale: 1 }
            }
        ];
        
        // Import the cropping functions (assuming they're available)
        if (typeof cropBackgroundImage === 'undefined') {
            console.error('❌ cropBackgroundImage function not available. Make sure you\'re running this on a page with the cropping utilities loaded.');
            return;
        }
        
        for (const scenario of scenarios) {
            console.group(`🧪 Testing: ${scenario.name}`);
            
            try {
                console.log('📋 Scenario details:', scenario);
                
                const startTime = performance.now();
                
                const result = await cropBackgroundImage(
                    testFile,
                    scenario.templateSize,
                    scenario.position
                );
                
                const endTime = performance.now();
                
                console.log('✅ Cropping completed:', {
                    wasCropped: result.wasCropped,
                    originalSize: result.originalSize,
                    croppedSize: result.croppedSize,
                    outputFileSize: result.croppedFile.size,
                    processingTime: `${(endTime - startTime).toFixed(2)}ms`
                });
                
                // Create a preview URL to visually inspect
                const previewUrl = URL.createObjectURL(result.croppedFile);
                console.log('🖼️ Preview URL (paste in new tab to view):', previewUrl);
                
                // Clean up after a delay
                setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
                
            } catch (error) {
                console.error('❌ Cropping failed:', error);
                console.error('Stack trace:', error.stack);
            }
            
            console.groupEnd();
        }
        
        console.log('🎉 Debug test completed!');
        
    } catch (error) {
        console.error('💥 Debug script failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Export for manual execution
window.debugImageCropping = debugImageCropping;

console.log('✅ Debug script loaded. Run debugImageCropping() to test image cropping.');
console.log('Note: Make sure you\'re on a page where the cropping functions are available.');
