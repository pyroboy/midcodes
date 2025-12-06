/**
 * Debug verification utilities for background image movement synchronization
 *
 * This module provides debugging tools to verify visual feedback between
 * TemplateForm's background preview and BackgroundThumbnail positioning.
 */

import { browser } from '$app/environment';
import type { Dims } from './backgroundGeometry';

// Types for debug verification
export interface DebugPosition {
	x: number;
	y: number;
	scale: number;
}

export interface DebugInfo {
	component: 'TemplateForm' | 'BackgroundThumbnail';
	position: DebugPosition;
	cssValues?: { size: string; position: string };
	cropFrame?: { x: number; y: number; width: number; height: number };
	timestamp: number;
}

// Global debug state
let debugLog: DebugInfo[] = [];
let isDebugEnabled = true; // Enable by default for development

/**
 * Enable/disable debug mode globally
 */
export function setDebugMode(enabled: boolean) {
	isDebugEnabled = enabled;
	if (browser && enabled) {
		console.log('🐛 Background Debug Mode: ENABLED');
		console.log('🔧 Available utilities:');
		console.log('  - testBackgroundSync()');
		console.log('  - verifyImageLoad(url)');
		console.log('  - addPositionMarkers()');
		console.log('  - clearDebugLog()');
		console.log('  - exportDebugLog()');
	}
}

/**
 * Add a debug entry to the log
 */
export function logDebugInfo(info: DebugInfo) {
	if (!isDebugEnabled) return;

	debugLog.push(info);

	// Keep only last 50 entries
	if (debugLog.length > 50) {
		debugLog = debugLog.slice(-50);
	}

	// console.log(`📊 ${info.component} Debug:`, {
	// 	position: info.position,
	// 	cssValues: info.cssValues,
	// 	cropFrame: info.cropFrame,
	// 	time: new Date(info.timestamp).toLocaleTimeString()
	// });
}

/**
 * Test background synchronization between components
 */
export function testBackgroundSync(): void {
	if (!browser) {
		console.log('❌ Browser environment required for testing');
		return;
	}

	console.log('🧪 Testing Background Synchronization...');

	const recentLogs = debugLog.slice(-10);
	if (recentLogs.length === 0) {
		console.log('❌ No debug entries found. Enable debug mode first!');
		return;
	}

	// Group logs by component
	const templateLogs = recentLogs.filter((log) => log.component === 'TemplateForm');
	const thumbnailLogs = recentLogs.filter((log) => log.component === 'BackgroundThumbnail');

	if (templateLogs.length === 0 || thumbnailLogs.length === 0) {
		console.log('⚠️  Missing logs from both components');
		return;
	}

	// Find matching timestamps (within 100ms)
	const matches: Array<{ template: DebugInfo; thumbnail: DebugInfo; timeDiff: number }> = [];

	templateLogs.forEach((templateLog) => {
		thumbnailLogs.forEach((thumbnailLog) => {
			const timeDiff = Math.abs(templateLog.timestamp - thumbnailLog.timestamp);
			if (timeDiff < 100) {
				// Within 100ms
				matches.push({ template: templateLog, thumbnail: thumbnailLog, timeDiff });
			}
		});
	});

	if (matches.length === 0) {
		console.log('❌ No synchronized updates found');
		return;
	}

	console.log(`✅ Found ${matches.length} synchronized updates:`);

	matches.forEach((match, index) => {
		const positionDiff = {
			x: Math.abs(match.template.position.x - match.thumbnail.position.x),
			y: Math.abs(match.template.position.y - match.thumbnail.position.y),
			scale: Math.abs(match.template.position.scale - match.thumbnail.position.scale)
		};

		console.table({
			[`Match ${index + 1}`]: {
				'Time Diff (ms)': match.timeDiff.toFixed(1),
				'Template Position': `${match.template.position.x.toFixed(1)}, ${match.template.position.y.toFixed(1)}`,
				'Thumbnail Position': `${match.thumbnail.position.x.toFixed(1)}, ${match.thumbnail.position.y.toFixed(1)}`,
				'Position Difference': `${positionDiff.x.toFixed(1)}, ${positionDiff.y.toFixed(1)}`,
				'Scale Diff': positionDiff.scale.toFixed(3),
				'CSS Size': match.template.cssValues?.size || 'N/A',
				'CSS Position': match.template.cssValues?.position || 'N/A'
			}
		});
	});
}

/**
 * Verify image loading for debugging
 */
export function verifyImageLoad(url: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			console.log('✅ Image loaded successfully:', {
				url,
				naturalWidth: img.naturalWidth,
				naturalHeight: img.naturalHeight,
				aspect: (img.naturalWidth / img.naturalHeight).toFixed(2)
			});
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
		};

		img.onerror = () => {
			console.log('❌ Image failed to load:', url);
			reject(new Error('Image load failed'));
		};

		img.src = url;
	});
}

/**
 * Add visual position markers to template container for debugging
 */
export function addPositionMarkers(): void {
	if (!browser) return;

	const templateContainer = document.querySelector('.template-container') as HTMLElement;
	if (!templateContainer) {
		console.log('❌ Template container not found');
		return;
	}

	// Remove existing markers
	const existingMarkers = templateContainer.querySelectorAll('.debug-marker');
	existingMarkers.forEach((marker) => marker.remove());

	// Add center marker
	const centerMarker = document.createElement('div');
	centerMarker.className = 'debug-marker center-marker';
	centerMarker.style.cssText = `
		position: absolute;
		left: 50%;
		top: 50%;
		width: 10px;
		height: 10px;
		background: red;
		border: 2px solid white;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		z-index: 1000;
		pointer-events: none;
		box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
	`;
	centerMarker.title = 'Center (0,0)';
	templateContainer.appendChild(centerMarker);

	// Add grid markers for reference
	const positions = [
		{ x: -100, y: -100, label: '(-100,-100)' },
		{ x: 100, y: -100, label: '(100,-100)' },
		{ x: -100, y: 100, label: '(-100,100)' },
		{ x: 100, y: 100, label: '(100,100)' }
	];

	positions.forEach((pos) => {
		const marker = document.createElement('div');
		marker.className = 'debug-marker position-marker';
		marker.style.cssText = `
			position: absolute;
			left: calc(50% + ${pos.x}px);
			top: calc(50% + ${pos.y}px);
			width: 6px;
			height: 6px;
			background: orange;
			border: 1px solid white;
			border-radius: 50%;
			transform: translate(-50%, -50%);
			z-index: 1000;
			pointer-events: none;
			box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
		`;
		marker.title = pos.label;
		templateContainer.appendChild(marker);
	});

	console.log('✅ Position markers added to template');
}

/**
 * Clear the debug log
 */
export function clearDebugLog(): void {
	debugLog = [];
	console.log('🗑️  Debug log cleared');
}

/**
 * Export debug log as JSON for analysis
 */
export function exportDebugLog(): string {
	const exported = JSON.stringify(debugLog, null, 2);
	console.log('📋 Debug log exported (copied to console):');
	console.log(exported);

	// Try to copy to clipboard if available
	if (navigator.clipboard) {
		navigator.clipboard.writeText(exported).then(() => {
			console.log('📋 Debug log copied to clipboard!');
		});
	}

	return exported;
}

/**
 * CSS verification utility
 */
export function verifyCSS(image: Dims, container: Dims, position: DebugPosition): void {
	console.log('🎯 CSS Verification:', {
		imageSize: image,
		containerSize: container,
		position,
		expectedAspect: (image.width / image.height).toFixed(2),
		containerAspect: (container.width / container.height).toFixed(2)
	});
}

/**
 * Coordinate transformation test
 */
export function testCoordinateTransform(
	thumbnailPos: DebugPosition,
	templateDims: Dims,
	thumbnailSize: number
): DebugPosition {
	const scaleFactor = templateDims.width / thumbnailSize;
	const transformedPos = {
		x: thumbnailPos.x * scaleFactor,
		y: thumbnailPos.y * scaleFactor,
		scale: thumbnailPos.scale
	};

	console.log('📐 Coordinate Transform Test:', {
		input: thumbnailPos,
		scaleFactor: scaleFactor.toFixed(3),
		output: transformedPos,
		templateDims,
		thumbnailSize
	});

	return transformedPos;
}

// Global browser utilities - attach to window for easy access
if (browser) {
	// Auto-enable debug mode on startup
	setDebugMode(true);

	// Attach utilities to window for console access
	(window as any).backgroundDebug = {
		enable: () => setDebugMode(true),
		disable: () => setDebugMode(false),
		testSync: testBackgroundSync,
		verifyImage: verifyImageLoad,
		addMarkers: addPositionMarkers,
		clear: clearDebugLog,
		export: exportDebugLog,
		verifyCSS,
		testTransform: testCoordinateTransform
	};

	console.log('🔧 Background debug utilities available at window.backgroundDebug');
	console.log('   Debug mode is AUTO-ENABLED. Use backgroundDebug.disable() to turn off.');
}
