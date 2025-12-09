/**
 * Card Detection Utility
 * Detects rectangular ID card shapes in A4 scanned images using Canvas API
 */

import type { DetectionConfig, DetectedRegion, Orientation } from '$lib/schemas/template-assets.schema';

export interface DetectedCard {
	id: string;
	bounds: { x: number; y: number; width: number; height: number };
	rotation: number;
	confidence: number;
	aspectRatio: number;
	orientation: Orientation;
}

interface Contour {
	points: [number, number][];
	boundingBox: { x: number; y: number; width: number; height: number };
	area: number;
	detectedOrientation?: Orientation;
	// Enhanced shape analysis fields
	rectangularityScore?: number;
	convexHullArea?: number;
	cornerPoints?: [number, number][];
	perimeter?: number;
	edgePoints?: [number, number][]; // Points on the boundary only
}

/**
 * CardDetector class - detects rectangular card shapes in images
 */
export class CardDetector {
	private config: DetectionConfig;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private width: number = 0;
	private height: number = 0;

	constructor(config: DetectionConfig) {
		this.config = config;
		this.canvas = document.createElement('canvas');
		const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) throw new Error('Failed to get canvas context');
		this.ctx = ctx;
	}

	/**
	 * Main detection method - uses multi-pass approach for better detection
	 */
	async detect(imageSource: HTMLImageElement | File): Promise<DetectedRegion[]> {
		// 1. Load image onto canvas
		const img =
			imageSource instanceof File ? await this.loadImageFromFile(imageSource) : imageSource;

		this.width = img.naturalWidth || img.width;
		this.height = img.naturalHeight || img.height;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.ctx.drawImage(img, 0, 0);

		// 2. Get image data
		const imageData = this.ctx.getImageData(0, 0, this.width, this.height);

		// 3. Enhanced Preprocessing pipeline for gray A4 scans
		const grayscale = this.toGrayscale(imageData);
		
		// Apply contrast enhancement for gray backgrounds
		const enhanced = this.enhanceContrast(grayscale, this.width, this.height);
		
		// Apply local contrast enhancement (CLAHE-style) for better edge visibility
		const localEnhanced = this.localContrastEnhancement(enhanced, this.width, this.height);
		
		// Apply bilateral-style denoising to reduce noise while preserving edges
		const denoised = this.bilateralFilter(localEnhanced, this.width, this.height);
		
		// Multiple gaussian blur passes for smoothing
		let blurred = this.gaussianBlur(denoised, this.width, this.height);
		blurred = this.gaussianBlur(blurred, this.width, this.height);
		
		// 4. Multi-pass detection with different sensitivities
		let allDetectedRegions: DetectedRegion[] = [];
		
		// Pass 1: High sensitivity (for well-defined edges)
		const highSensitivityRegions = this.runDetectionPass(blurred, grayscale, 'high');
		allDetectedRegions.push(...highSensitivityRegions);
		
		// Pass 2: Medium sensitivity (for moderate contrast)
		if (allDetectedRegions.length < 2) {
			const mediumSensitivityRegions = this.runDetectionPass(blurred, grayscale, 'medium');
			allDetectedRegions.push(...mediumSensitivityRegions);
		}
		
		// Pass 3: Low sensitivity (for very low contrast / gray images)
		if (allDetectedRegions.length < 1) {
			const lowSensitivityRegions = this.runDetectionPass(blurred, grayscale, 'low');
			allDetectedRegions.push(...lowSensitivityRegions);
		}
		
		// 5. Sort by confidence and remove overlaps
		allDetectedRegions = allDetectedRegions.sort((a, b) => b.confidence - a.confidence);
		return this.removeOverlaps(allDetectedRegions);
	}

	/**
	 * Run a single detection pass with specified sensitivity
	 */
	private runDetectionPass(
		blurred: Uint8Array,
		grayscale: Uint8Array,
		sensitivity: 'high' | 'medium' | 'low'
	): DetectedRegion[] {
		// Set thresholds based on sensitivity
		let lowThreshold: number, highThreshold: number;
		switch (sensitivity) {
			case 'high':
				lowThreshold = 30;
				highThreshold = 80;
				break;
			case 'medium':
				lowThreshold = 15;
				highThreshold = 50;
				break;
			case 'low':
				lowThreshold = 8;
				highThreshold = 25;
				break;
		}

		// Canny-style edge detection with non-maximum suppression
		const { magnitude, direction } = this.computeGradients(blurred, this.width, this.height);
		const suppressed = this.nonMaximumSuppression(magnitude, direction, this.width, this.height);
		const edges = this.hysteresisThreshold(suppressed, this.width, this.height, lowThreshold, highThreshold);
		
		// Apply morphological closing to connect broken edges
		const closed = this.morphologicalClose(edges, this.width, this.height);
		// Apply additional dilation to thicken edges
		const thickened = this.dilate(closed, this.width, this.height);
		
		// Adaptive threshold with dynamic constant based on image statistics
		const binary = this.adaptiveThresholdEnhanced(thickened, this.width, this.height, grayscale);

		// Find contours with enhanced boundary detection
		const contours = this.findContoursEnhanced(binary, this.width, this.height);

		// Analyze shapes and compute rectangularity
		const analyzedContours = contours.map(c => this.analyzeContourShape(c));

		// Filter rectangles by aspect ratio, area, and rectangularity
		const validRectangles = analyzedContours.filter((c) => this.isValidCardRectangleEnhanced(c));

		// Convert to DetectedRegion format with confidence based on rectangularity
		return validRectangles.map((contour, index) => this.toDetectedRegionEnhanced(contour, index, sensitivity));
	}

	/**
	 * Compute gradient magnitude and direction using Sobel operators
	 */
	private computeGradients(data: Uint8Array, w: number, h: number): { magnitude: Uint8Array; direction: Float32Array } {
		const magnitude = new Uint8Array(data.length);
		const direction = new Float32Array(data.length);
		const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
		const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				let gx = 0, gy = 0;

				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = (y + ky) * w + (x + kx);
						const kidx = (ky + 1) * 3 + (kx + 1);
						gx += data[idx] * sobelX[kidx];
						gy += data[idx] * sobelY[kidx];
					}
				}

				const idx = y * w + x;
				magnitude[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
				direction[idx] = Math.atan2(gy, gx);
			}
		}
		return { magnitude, direction };
	}

	/**
	 * Non-maximum suppression for edge thinning
	 */
	private nonMaximumSuppression(magnitude: Uint8Array, direction: Float32Array, w: number, h: number): Uint8Array {
		const result = new Uint8Array(magnitude.length);

		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				const idx = y * w + x;
				const angle = direction[idx] * (180 / Math.PI);
				const mag = magnitude[idx];

				// Determine which neighbors to compare based on gradient direction
				let neighbor1 = 0, neighbor2 = 0;
				const normalizedAngle = ((angle % 180) + 180) % 180;

				if (normalizedAngle < 22.5 || normalizedAngle >= 157.5) {
					// Horizontal edge - compare left and right
					neighbor1 = magnitude[y * w + (x - 1)];
					neighbor2 = magnitude[y * w + (x + 1)];
				} else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
					// Diagonal (45 degrees)
					neighbor1 = magnitude[(y - 1) * w + (x + 1)];
					neighbor2 = magnitude[(y + 1) * w + (x - 1)];
				} else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
					// Vertical edge - compare top and bottom
					neighbor1 = magnitude[(y - 1) * w + x];
					neighbor2 = magnitude[(y + 1) * w + x];
				} else {
					// Diagonal (135 degrees)
					neighbor1 = magnitude[(y - 1) * w + (x - 1)];
					neighbor2 = magnitude[(y + 1) * w + (x + 1)];
				}

				// Keep only if local maximum
				result[idx] = (mag >= neighbor1 && mag >= neighbor2) ? mag : 0;
			}
		}
		return result;
	}

	/**
	 * Hysteresis thresholding for edge detection
	 */
	private hysteresisThreshold(data: Uint8Array, w: number, h: number, low: number, high: number): Uint8Array {
		const result = new Uint8Array(data.length);
		const strong = 255;
		const weak = 128;

		// First pass: classify edges as strong or weak
		for (let i = 0; i < data.length; i++) {
			if (data[i] >= high) {
				result[i] = strong;
			} else if (data[i] >= low) {
				result[i] = weak;
			}
		}

		// Second pass: connect weak edges to strong edges
		const dx = [-1, 0, 1, 1, 1, 0, -1, -1];
		const dy = [-1, -1, -1, 0, 1, 1, 1, 0];
		let changed = true;

		while (changed) {
			changed = false;
			for (let y = 1; y < h - 1; y++) {
				for (let x = 1; x < w - 1; x++) {
					const idx = y * w + x;
					if (result[idx] === weak) {
						// Check if any neighbor is strong
						for (let i = 0; i < 8; i++) {
							const nidx = (y + dy[i]) * w + (x + dx[i]);
							if (result[nidx] === strong) {
								result[idx] = strong;
								changed = true;
								break;
							}
						}
					}
				}
			}
		}

		// Remove remaining weak edges
		for (let i = 0; i < result.length; i++) {
			if (result[i] === weak) {
				result[i] = 0;
			}
		}

		return result;
	}

	/**
	 * Find contours with enhanced boundary detection
	 */
	private findContoursEnhanced(binary: Uint8Array, w: number, h: number): Contour[] {
		const visited = new Uint8Array(binary.length);
		const contours: Contour[] = [];
		const minContourPoints = 50; // Lowered for better sensitivity

		// 8-connected neighbors
		const dx = [-1, 0, 1, 1, 1, 0, -1, -1];
		const dy = [-1, -1, -1, 0, 1, 1, 1, 0];

		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				const idx = y * w + x;
				if (binary[idx] === 255 && visited[idx] === 0) {
					// Trace contour using flood fill
					const points: [number, number][] = [];
					const edgePoints: [number, number][] = [];
					const stack: [number, number][] = [[x, y]];

					let minX = x, maxX = x, minY = y, maxY = y;

					while (stack.length > 0 && points.length < 100000) { // Limit to prevent infinite loops
						const [cx, cy] = stack.pop()!;
						const cidx = cy * w + cx;

						if (visited[cidx] === 1) continue;
						if (binary[cidx] !== 255) continue;

						visited[cidx] = 1;
						points.push([cx, cy]);

						minX = Math.min(minX, cx);
						maxX = Math.max(maxX, cx);
						minY = Math.min(minY, cy);
						maxY = Math.max(maxY, cy);

						// Check if this is an edge point (has at least one non-255 neighbor)
						let isEdge = false;
						for (let i = 0; i < 8; i++) {
							const nx = cx + dx[i];
							const ny = cy + dy[i];
							if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
								const nidx = ny * w + nx;
								if (binary[nidx] !== 255) {
									isEdge = true;
								}
								if (visited[nidx] === 0 && binary[nidx] === 255) {
									stack.push([nx, ny]);
								}
							}
						}
						if (isEdge) {
							edgePoints.push([cx, cy]);
						}
					}

					if (points.length >= minContourPoints) {
						const boundingBox = {
							x: minX,
							y: minY,
							width: maxX - minX,
							height: maxY - minY
						};

						contours.push({
							points,
							boundingBox,
							area: boundingBox.width * boundingBox.height,
							edgePoints
						});
					}
				}
			}
		}

		return contours;
	}

	/**
	 * Analyze contour shape to compute rectangularity and other metrics
	 */
	private analyzeContourShape(contour: Contour): Contour {
		const { points, boundingBox, edgePoints } = contour;
		
		// Use edge points if available, otherwise use all points
		const analyzePoints = edgePoints && edgePoints.length > 10 ? edgePoints : points;
		
		// Compute convex hull
		const hull = this.computeConvexHull(analyzePoints);
		const hullArea = this.computePolygonArea(hull);
		
		// Compute perimeter of convex hull
		const perimeter = this.computePolygonPerimeter(hull);
		
		// Find approximate corner points of the convex hull
		const corners = this.findCornerPoints(hull);
		
		// Compute rectangularity: how closely the shape matches a rectangle
		// Perfect rectangle has rectangularity = 1
		const boundingArea = boundingBox.width * boundingBox.height;
		const rectangularity = hullArea / boundingArea;
		
		contour.convexHullArea = hullArea;
		contour.perimeter = perimeter;
		contour.cornerPoints = corners;
		contour.rectangularityScore = rectangularity;
		
		return contour;
	}

	/**
	 * Compute convex hull using Graham scan algorithm
	 */
	private computeConvexHull(points: [number, number][]): [number, number][] {
		if (points.length < 3) return points;

		// Find the bottom-most point (or left-most in case of tie)
		let start = 0;
		for (let i = 1; i < points.length; i++) {
			if (points[i][1] > points[start][1] ||
				(points[i][1] === points[start][1] && points[i][0] < points[start][0])) {
				start = i;
			}
		}

		// Swap start point to beginning
		[points[0], points[start]] = [points[start], points[0]];
		const pivot = points[0];

		// Sort by polar angle with respect to pivot
		const sorted = points.slice(1).sort((a, b) => {
			const angleA = Math.atan2(a[1] - pivot[1], a[0] - pivot[0]);
			const angleB = Math.atan2(b[1] - pivot[1], b[0] - pivot[0]);
			if (angleA !== angleB) return angleA - angleB;
			// If angles are same, sort by distance
			const distA = (a[0] - pivot[0]) ** 2 + (a[1] - pivot[1]) ** 2;
			const distB = (b[0] - pivot[0]) ** 2 + (b[1] - pivot[1]) ** 2;
			return distA - distB;
		});

		// Build convex hull
		const stack: [number, number][] = [pivot];

		for (const point of sorted) {
			while (stack.length > 1) {
				const top = stack[stack.length - 1];
				const nextToTop = stack[stack.length - 2];
				// Cross product to check if we make a left turn
				const cross = (top[0] - nextToTop[0]) * (point[1] - nextToTop[1]) -
					(top[1] - nextToTop[1]) * (point[0] - nextToTop[0]);
				if (cross <= 0) {
					stack.pop();
				} else {
					break;
				}
			}
			stack.push(point);
		}

		return stack;
	}

	/**
	 * Compute polygon area using shoelace formula
	 */
	private computePolygonArea(points: [number, number][]): number {
		if (points.length < 3) return 0;
		
		let area = 0;
		for (let i = 0; i < points.length; i++) {
			const j = (i + 1) % points.length;
			area += points[i][0] * points[j][1];
			area -= points[j][0] * points[i][1];
		}
		return Math.abs(area) / 2;
	}

	/**
	 * Compute polygon perimeter
	 */
	private computePolygonPerimeter(points: [number, number][]): number {
		if (points.length < 2) return 0;
		
		let perimeter = 0;
		for (let i = 0; i < points.length; i++) {
			const j = (i + 1) % points.length;
			const dx = points[j][0] - points[i][0];
			const dy = points[j][1] - points[i][1];
			perimeter += Math.sqrt(dx * dx + dy * dy);
		}
		return perimeter;
	}

	/**
	 * Find corner points using Douglas-Peucker simplification
	 */
	private findCornerPoints(hull: [number, number][]): [number, number][] {
		if (hull.length < 4) return hull;
		
		// Simplify hull to approximately 4 points (corners of rectangle)
		const epsilon = this.computePolygonPerimeter(hull) * 0.02; // 2% of perimeter
		return this.douglasPeucker(hull, epsilon);
	}

	/**
	 * Douglas-Peucker algorithm for polyline simplification
	 */
	private douglasPeucker(points: [number, number][], epsilon: number): [number, number][] {
		if (points.length <= 2) return points;

		// Find the point with maximum distance from line between first and last
		let maxDist = 0;
		let maxIdx = 0;
		const start = points[0];
		const end = points[points.length - 1];

		for (let i = 1; i < points.length - 1; i++) {
			const dist = this.pointToLineDistance(points[i], start, end);
			if (dist > maxDist) {
				maxDist = dist;
				maxIdx = i;
			}
		}

		// If max distance is greater than epsilon, recursively simplify
		if (maxDist > epsilon) {
			const left = this.douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
			const right = this.douglasPeucker(points.slice(maxIdx), epsilon);
			return [...left.slice(0, -1), ...right];
		} else {
			return [start, end];
		}
	}

	/**
	 * Calculate distance from point to line segment
	 */
	private pointToLineDistance(point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number {
		const dx = lineEnd[0] - lineStart[0];
		const dy = lineEnd[1] - lineStart[1];
		const lineLengthSquared = dx * dx + dy * dy;

		if (lineLengthSquared === 0) {
			// Line is a point
			return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2);
		}

		// Project point onto line
		const t = Math.max(0, Math.min(1, 
			((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / lineLengthSquared
		));

		const projX = lineStart[0] + t * dx;
		const projY = lineStart[1] + t * dy;

		return Math.sqrt((point[0] - projX) ** 2 + (point[1] - projY) ** 2);
	}

	/**
	 * Enhanced rectangle validation with rectangularity scoring
	 */
	private isValidCardRectangleEnhanced(contour: Contour): boolean {
		const { width, height } = contour.boundingBox;
		const area = contour.area;
		const rectangularity = contour.rectangularityScore || 0;

		// Check area bounds (more lenient for edge detection results)
		const minArea = this.config.minCardArea * 0.3; // More lenient
		const maxArea = this.config.maxCardArea * 3; // More lenient
		if (area < minArea || area > maxArea) {
			return false;
		}

		// Must have minimum rectangularity (fills at least 40% of bounding box)
		if (rectangularity < 0.4) {
			return false;
		}

		// Calculate both orientation aspect ratios
		const landscapeRatio = width / height;
		const portraitRatio = height / width;
		const targetRatio = this.config.targetAspectRatio;
		const tolerance = this.config.aspectRatioTolerance * 1.5; // More lenient tolerance

		// Check if matches landscape or portrait orientation
		const matchesLandscape = Math.abs(landscapeRatio - targetRatio) <= targetRatio * tolerance && width > height;
		const matchesPortrait = Math.abs(portraitRatio - targetRatio) <= targetRatio * tolerance && height > width;

		if (!matchesLandscape && !matchesPortrait) {
			// Check normalized ratio
			const normalizedRatio = Math.max(width, height) / Math.min(width, height);
			const normalizedTarget = Math.max(targetRatio, 1 / targetRatio);
			if (Math.abs(normalizedRatio - normalizedTarget) > normalizedTarget * tolerance) {
				return false;
			}
		}

		// Store detected orientation
		if (matchesLandscape) {
			contour.detectedOrientation = 'landscape';
		} else if (matchesPortrait) {
			contour.detectedOrientation = 'portrait';
		} else {
			contour.detectedOrientation = width >= height ? 'landscape' : 'portrait';
		}

		return true;
	}

	/**
	 * Enhanced DetectedRegion conversion with better confidence scoring
	 */
	private toDetectedRegionEnhanced(contour: Contour, index: number, sensitivity: 'high' | 'medium' | 'low'): DetectedRegion {
		const { x, y, width, height } = contour.boundingBox;
		const orientation = contour.detectedOrientation || (width >= height ? 'landscape' : 'portrait');

		// Calculate aspect ratio based on detected orientation
		const aspectRatio = orientation === 'landscape' ? width / height : height / width;
		const targetRatio = this.config.targetAspectRatio;

		// Score based on aspect ratio match
		const ratioScore = 1 - Math.abs(aspectRatio - targetRatio) / targetRatio;

		// Score based on area match
		const expectedArea = (this.config.minCardArea + this.config.maxCardArea) / 2;
		const areaScore = 1 - Math.min(1, Math.abs(contour.area - expectedArea) / expectedArea);

		// Score based on rectangularity
		const rectangularityScore = contour.rectangularityScore || 0.5;

		// Sensitivity penalty (lower confidence for lower sensitivity passes)
		const sensitivityMultiplier = sensitivity === 'high' ? 1.0 : sensitivity === 'medium' ? 0.85 : 0.7;

		// Combined confidence
		const confidence = Math.max(0, Math.min(1, 
			(ratioScore * 0.3 + areaScore * 0.2 + rectangularityScore * 0.5) * sensitivityMultiplier
		));

		return {
			id: `card-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
			x,
			y,
			width,
			height,
			rotation: 0,
			confidence,
			orientation,
			isManuallyAdjusted: false,
			isSelected: true
		};
	}

	/**
	 * Enhance contrast using histogram stretching
	 * Helps with gray A4 scans where cards blend with background
	 */
	private enhanceContrast(data: Uint8Array, w: number, h: number): Uint8Array {
		const result = new Uint8Array(data.length);
		
		// Find min and max values (ignoring outliers)
		const histogram = new Uint32Array(256);
		for (let i = 0; i < data.length; i++) {
			histogram[data[i]]++;
		}
		
		// Find 1% and 99% percentiles to avoid outlier influence
		const totalPixels = w * h;
		const lowerBound = Math.floor(totalPixels * 0.01);
		const upperBound = Math.floor(totalPixels * 0.99);
		
		let count = 0;
		let minVal = 0;
		for (let i = 0; i < 256; i++) {
			count += histogram[i];
			if (count >= lowerBound) {
				minVal = i;
				break;
			}
		}
		
		count = 0;
		let maxVal = 255;
		for (let i = 255; i >= 0; i--) {
			count += histogram[i];
			if (count >= (totalPixels - upperBound)) {
				maxVal = i;
				break;
			}
		}
		
		// Apply contrast stretching
		const range = maxVal - minVal || 1;
		for (let i = 0; i < data.length; i++) {
			const normalized = (data[i] - minVal) / range;
			result[i] = Math.max(0, Math.min(255, Math.round(normalized * 255)));
		}
		
		return result;
	}

	/**
	 * Local contrast enhancement (CLAHE-style)
	 * Improves visibility of card edges in varying lighting conditions
	 */
	private localContrastEnhancement(data: Uint8Array, w: number, h: number): Uint8Array {
		const result = new Uint8Array(data.length);
		const tileSize = 64; // Process in 64x64 tiles
		const clipLimit = 3.0; // Limit contrast enhancement
		
		for (let ty = 0; ty < h; ty += tileSize) {
			for (let tx = 0; tx < w; tx += tileSize) {
				const tileW = Math.min(tileSize, w - tx);
				const tileH = Math.min(tileSize, h - ty);
				
				// Build histogram for this tile
				const histogram = new Uint32Array(256);
				let tilePixels = 0;
				
				for (let y = ty; y < ty + tileH; y++) {
					for (let x = tx; x < tx + tileW; x++) {
						histogram[data[y * w + x]]++;
						tilePixels++;
					}
				}
				
				// Clip histogram
				const avgBin = tilePixels / 256;
				const clipThreshold = Math.floor(clipLimit * avgBin);
				let excess = 0;
				
				for (let i = 0; i < 256; i++) {
					if (histogram[i] > clipThreshold) {
						excess += histogram[i] - clipThreshold;
						histogram[i] = clipThreshold;
					}
				}
				
				// Redistribute excess
				const redistribution = Math.floor(excess / 256);
				for (let i = 0; i < 256; i++) {
					histogram[i] += redistribution;
				}
				
				// Build CDF
				const cdf = new Uint32Array(256);
				cdf[0] = histogram[0];
				for (let i = 1; i < 256; i++) {
					cdf[i] = cdf[i - 1] + histogram[i];
				}
				
				// Normalize CDF
				const cdfMin = cdf.find(v => v > 0) || 0;
				const cdfRange = (cdf[255] - cdfMin) || 1;
				
				// Apply transformation
				for (let y = ty; y < ty + tileH; y++) {
					for (let x = tx; x < tx + tileW; x++) {
						const idx = y * w + x;
						const val = data[idx];
						result[idx] = Math.round(((cdf[val] - cdfMin) / cdfRange) * 255);
					}
				}
			}
		}
		
		return result;
	}

	/**
	 * Simplified bilateral filter to reduce noise while preserving edges
	 */
	private bilateralFilter(data: Uint8Array, w: number, h: number): Uint8Array {
		const result = new Uint8Array(data.length);
		const spatialSigma = 3.0;
		const rangeSigma = 30.0;
		const radius = 3;
		
		// Pre-compute spatial weights
		const spatialWeights: number[] = [];
		for (let dy = -radius; dy <= radius; dy++) {
			for (let dx = -radius; dx <= radius; dx++) {
				const spatialDist = Math.sqrt(dx * dx + dy * dy);
				spatialWeights.push(Math.exp(-(spatialDist * spatialDist) / (2 * spatialSigma * spatialSigma)));
			}
		}
		
		for (let y = radius; y < h - radius; y++) {
			for (let x = radius; x < w - radius; x++) {
				const centerVal = data[y * w + x];
				let weightSum = 0;
				let valueSum = 0;
				let kernelIdx = 0;
				
				for (let dy = -radius; dy <= radius; dy++) {
					for (let dx = -radius; dx <= radius; dx++) {
						const neighborVal = data[(y + dy) * w + (x + dx)];
						const rangeDist = Math.abs(neighborVal - centerVal);
						const rangeWeight = Math.exp(-(rangeDist * rangeDist) / (2 * rangeSigma * rangeSigma));
						const weight = spatialWeights[kernelIdx] * rangeWeight;
						
						weightSum += weight;
						valueSum += neighborVal * weight;
						kernelIdx++;
					}
				}
				
				result[y * w + x] = Math.round(valueSum / weightSum);
			}
		}
		
		// Copy border pixels
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				if (y < radius || y >= h - radius || x < radius || x >= w - radius) {
					result[y * w + x] = data[y * w + x];
				}
			}
		}
		
		return result;
	}

	/**
	 * Morphological closing operation (dilation followed by erosion)
	 * Helps connect broken edge segments
	 */
	private morphologicalClose(data: Uint8Array, w: number, h: number): Uint8Array {
		// First dilate
		const dilated = this.dilate(data, w, h);
		// Then erode
		return this.erode(dilated, w, h);
	}

	/**
	 * Morphological dilation with 3x3 structuring element
	 */
	private dilate(data: Uint8Array, w: number, h: number): Uint8Array {
		const result = new Uint8Array(data.length);
		
		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				let maxVal = 0;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						maxVal = Math.max(maxVal, data[(y + dy) * w + (x + dx)]);
					}
				}
				result[y * w + x] = maxVal;
			}
		}
		
		return result;
	}

	/**
	 * Morphological erosion with 3x3 structuring element
	 */
	private erode(data: Uint8Array, w: number, h: number): Uint8Array {
		const result = new Uint8Array(data.length);
		
		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				let minVal = 255;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						minVal = Math.min(minVal, data[(y + dy) * w + (x + dx)]);
					}
				}
				result[y * w + x] = minVal;
			}
		}
		
		return result;
	}

	/**
	 * Enhanced adaptive threshold with dynamic constant based on image statistics
	 */
	private adaptiveThresholdEnhanced(
		data: Uint8Array,
		w: number,
		h: number,
		originalGrayscale: Uint8Array
	): Uint8Array {
		const blockSize = 31;
		const result = new Uint8Array(data.length);

		// Compute image statistics to determine optimal threshold constant
		let mean = 0;
		let variance = 0;
		for (let i = 0; i < originalGrayscale.length; i++) {
			mean += originalGrayscale[i];
		}
		mean /= originalGrayscale.length;
		
		for (let i = 0; i < originalGrayscale.length; i++) {
			const diff = originalGrayscale[i] - mean;
			variance += diff * diff;
		}
		variance /= originalGrayscale.length;
		const stdDev = Math.sqrt(variance);
		
		// Dynamic C based on image contrast - lower for low contrast images
		const C = Math.max(2, Math.min(15, stdDev * 0.15));

		// Compute integral image
		const integral = new Float64Array((w + 1) * (h + 1));
		for (let y = 0; y < h; y++) {
			let rowSum = 0;
			for (let x = 0; x < w; x++) {
				rowSum += data[y * w + x];
				integral[(y + 1) * (w + 1) + (x + 1)] = rowSum + integral[y * (w + 1) + (x + 1)];
			}
		}

		// Apply threshold
		const halfBlock = Math.floor(blockSize / 2);
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const x1 = Math.max(0, x - halfBlock);
				const y1 = Math.max(0, y - halfBlock);
				const x2 = Math.min(w - 1, x + halfBlock);
				const y2 = Math.min(h - 1, y + halfBlock);

				const count = (x2 - x1 + 1) * (y2 - y1 + 1);
				const sum =
					integral[(y2 + 1) * (w + 1) + (x2 + 1)] -
					integral[(y2 + 1) * (w + 1) + x1] -
					integral[y1 * (w + 1) + (x2 + 1)] +
					integral[y1 * (w + 1) + x1];

				const localMean = sum / count;
				result[y * w + x] = data[y * w + x] > localMean - C ? 255 : 0;
			}
		}
		return result;
	}

	/**
	 * Load image from File object
	 */
	private loadImageFromFile(file: File): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				URL.revokeObjectURL(img.src);
				resolve(img);
			};
			img.onerror = () => {
				URL.revokeObjectURL(img.src);
				reject(new Error('Failed to load image'));
			};
			img.src = URL.createObjectURL(file);
		});
	}

	/**
	 * Convert image to grayscale
	 */
	private toGrayscale(imageData: ImageData): Uint8Array {
		const gray = new Uint8Array(imageData.width * imageData.height);
		const data = imageData.data;

		for (let i = 0; i < gray.length; i++) {
			const idx = i * 4;
			// Weighted average (human perception)
			gray[i] = Math.round(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
		}
		return gray;
	}

	/**
	 * Apply 3x3 Gaussian blur
	 */
	private gaussianBlur(data: Uint8Array, w: number, h: number): Uint8Array {
		const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
		const kernelSum = 16;
		const result = new Uint8Array(data.length);

		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				let sum = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = (y + ky) * w + (x + kx);
						const kidx = (ky + 1) * 3 + (kx + 1);
						sum += data[idx] * kernel[kidx];
					}
				}
				result[y * w + x] = Math.round(sum / kernelSum);
			}
		}
		return result;
	}

	/**
	 * Sobel edge detection
	 */
	private sobelEdgeDetection(data: Uint8Array, w: number, h: number): Uint8Array {
		const result = new Uint8Array(data.length);
		const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
		const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				let gx = 0,
					gy = 0;

				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = (y + ky) * w + (x + kx);
						const kidx = (ky + 1) * 3 + (kx + 1);
						gx += data[idx] * sobelX[kidx];
						gy += data[idx] * sobelY[kidx];
					}
				}

				result[y * w + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
			}
		}
		return result;
	}

	/**
	 * Adaptive threshold using integral image
	 */
	private adaptiveThreshold(data: Uint8Array, w: number, h: number): Uint8Array {
		const blockSize = 31;
		const C = 10;
		const result = new Uint8Array(data.length);

		// Compute integral image
		const integral = new Float64Array((w + 1) * (h + 1));
		for (let y = 0; y < h; y++) {
			let rowSum = 0;
			for (let x = 0; x < w; x++) {
				rowSum += data[y * w + x];
				integral[(y + 1) * (w + 1) + (x + 1)] = rowSum + integral[y * (w + 1) + (x + 1)];
			}
		}

		// Apply threshold
		const halfBlock = Math.floor(blockSize / 2);
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const x1 = Math.max(0, x - halfBlock);
				const y1 = Math.max(0, y - halfBlock);
				const x2 = Math.min(w - 1, x + halfBlock);
				const y2 = Math.min(h - 1, y + halfBlock);

				const count = (x2 - x1 + 1) * (y2 - y1 + 1);
				const sum =
					integral[(y2 + 1) * (w + 1) + (x2 + 1)] -
					integral[(y2 + 1) * (w + 1) + x1] -
					integral[y1 * (w + 1) + (x2 + 1)] +
					integral[y1 * (w + 1) + x1];

				const mean = sum / count;
				result[y * w + x] = data[y * w + x] > mean - C ? 255 : 0;
			}
		}
		return result;
	}

	/**
	 * Find contours using connected component labeling
	 */
	private findContours(binary: Uint8Array, w: number, h: number): Contour[] {
		const visited = new Uint8Array(binary.length);
		const contours: Contour[] = [];
		const minContourPoints = 100;

		// 8-connected neighbors
		const dx = [-1, 0, 1, 1, 1, 0, -1, -1];
		const dy = [-1, -1, -1, 0, 1, 1, 1, 0];

		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				const idx = y * w + x;
				if (binary[idx] === 255 && visited[idx] === 0) {
					// Trace contour using flood fill
					const points: [number, number][] = [];
					const stack: [number, number][] = [[x, y]];

					let minX = x,
						maxX = x,
						minY = y,
						maxY = y;

					while (stack.length > 0) {
						const [cx, cy] = stack.pop()!;
						const cidx = cy * w + cx;

						if (visited[cidx] === 1) continue;
						if (binary[cidx] !== 255) continue;

						visited[cidx] = 1;
						points.push([cx, cy]);

						minX = Math.min(minX, cx);
						maxX = Math.max(maxX, cx);
						minY = Math.min(minY, cy);
						maxY = Math.max(maxY, cy);

						// Check neighbors
						for (let i = 0; i < 8; i++) {
							const nx = cx + dx[i];
							const ny = cy + dy[i];
							if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
								const nidx = ny * w + nx;
								if (visited[nidx] === 0 && binary[nidx] === 255) {
									stack.push([nx, ny]);
								}
							}
						}
					}

					if (points.length >= minContourPoints) {
						const boundingBox = {
							x: minX,
							y: minY,
							width: maxX - minX,
							height: maxY - minY
						};

						contours.push({
							points,
							boundingBox,
							area: boundingBox.width * boundingBox.height
						});
					}
				}
			}
		}

		return contours;
	}

	/**
	 * Check if contour matches expected card dimensions
	 * Detects BOTH landscape and portrait orientations
	 */
	private isValidCardRectangle(contour: Contour): boolean {
		const { width, height } = contour.boundingBox;
		const area = contour.area;

		// Check area bounds
		if (area < this.config.minCardArea || area > this.config.maxCardArea) {
			return false;
		}

		// Calculate both orientation aspect ratios
		const landscapeRatio = width / height; // width > height
		const portraitRatio = height / width; // height > width
		const targetRatio = this.config.targetAspectRatio;
		const tolerance = this.config.aspectRatioTolerance;

		// Check if matches landscape orientation
		const matchesLandscape =
			Math.abs(landscapeRatio - targetRatio) <= targetRatio * tolerance && width > height;

		// Check if matches portrait orientation (inverted aspect ratio)
		const matchesPortrait =
			Math.abs(portraitRatio - targetRatio) <= targetRatio * tolerance && height > width;

		// Must match at least one orientation
		if (!matchesLandscape && !matchesPortrait) {
			// Also check if it's close to square and might match either
			const normalizedRatio = Math.max(width, height) / Math.min(width, height);
			const normalizedTarget = Math.max(targetRatio, 1 / targetRatio);
			if (Math.abs(normalizedRatio - normalizedTarget) > normalizedTarget * tolerance) {
				return false;
			}
		}

		// Store detected orientation
		if (matchesLandscape) {
			contour.detectedOrientation = 'landscape';
		} else if (matchesPortrait) {
			contour.detectedOrientation = 'portrait';
		} else {
			// Default based on dimensions
			contour.detectedOrientation = width >= height ? 'landscape' : 'portrait';
		}

		// Check rectangularity (how well the contour fills its bounding box)
		const fillRatio = contour.points.length / area;
		// For a filled rectangle on edges, expect ~10-40% fill in edge detection
		if (fillRatio < 0.05 || fillRatio > 0.8) {
			return false;
		}

		return true;
	}

	/**
	 * Convert contour to DetectedRegion
	 */
	private toDetectedRegion(contour: Contour, index: number): DetectedRegion {
		const { x, y, width, height } = contour.boundingBox;
		const orientation = contour.detectedOrientation || (width >= height ? 'landscape' : 'portrait');

		// Calculate aspect ratio based on detected orientation
		const aspectRatio = orientation === 'landscape' ? width / height : height / width;
		const targetRatio = this.config.targetAspectRatio;

		// Score based on aspect ratio match
		const ratioScore = 1 - Math.abs(aspectRatio - targetRatio) / targetRatio;

		// Score based on area match
		const expectedArea = (this.config.minCardArea + this.config.maxCardArea) / 2;
		const areaScore = 1 - Math.abs(contour.area - expectedArea) / expectedArea;

		// Combined confidence
		const confidence = Math.max(0, Math.min(1, ratioScore * 0.6 + areaScore * 0.4));

		return {
			id: `card-${index}-${Date.now()}`,
			x,
			y,
			width,
			height,
			rotation: 0,
			confidence,
			orientation,
			isManuallyAdjusted: false,
			isSelected: true
		};
	}

	/**
	 * Remove overlapping detections
	 */
	private removeOverlaps(regions: DetectedRegion[]): DetectedRegion[] {
		const result: DetectedRegion[] = [];
		const overlapThreshold = 0.5;

		for (const region of regions) {
			let hasOverlap = false;

			for (const existing of result) {
				const overlap = this.calculateOverlap(region, existing);
				if (overlap > overlapThreshold) {
					hasOverlap = true;
					break;
				}
			}

			if (!hasOverlap) {
				result.push(region);
			}
		}

		return result;
	}

	/**
	 * Calculate overlap ratio between two regions
	 */
	private calculateOverlap(a: DetectedRegion, b: DetectedRegion): number {
		const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
		const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
		const overlapArea = xOverlap * yOverlap;
		const minArea = Math.min(a.width * a.height, b.width * b.height);
		return overlapArea / minArea;
	}
}

/**
 * Convenience function to detect cards in an image
 */
export async function detectCardsInImage(
	imageSource: HTMLImageElement | File,
	config: DetectionConfig
): Promise<DetectedRegion[]> {
	const detector = new CardDetector(config);
	return detector.detect(imageSource);
}

/**
 * Crop a region from an image and return as blob
 */
export async function cropRegionFromImage(
	imageSource: HTMLImageElement | File,
	region: DetectedRegion,
	targetWidth?: number,
	targetHeight?: number
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const loadImage = (src: HTMLImageElement | File): Promise<HTMLImageElement> => {
			if (src instanceof HTMLImageElement) {
				return Promise.resolve(src);
			}
			return new Promise((res, rej) => {
				const img = new Image();
				img.onload = () => {
					URL.revokeObjectURL(img.src);
					res(img);
				};
				img.onerror = () => {
					URL.revokeObjectURL(img.src);
					rej(new Error('Failed to load image'));
				};
				img.src = URL.createObjectURL(src);
			});
		};

		loadImage(imageSource)
			.then((img) => {
				const canvas = document.createElement('canvas');
				const destWidth = targetWidth || region.width;
				const destHeight = targetHeight || region.height;
				canvas.width = destWidth;
				canvas.height = destHeight;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				// Handle rotation if needed
				if (region.rotation !== 0) {
					ctx.translate(destWidth / 2, destHeight / 2);
					ctx.rotate((region.rotation * Math.PI) / 180);
					ctx.translate(-destWidth / 2, -destHeight / 2);
				}

				ctx.drawImage(
					img,
					region.x,
					region.y,
					region.width,
					region.height,
					0,
					0,
					destWidth,
					destHeight
				);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error('Failed to create blob'));
						}
					},
					'image/jpeg',
					0.95
				);
			})
			.catch(reject);
	});
}
