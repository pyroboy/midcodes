/**
 * Coordinate System Manager for Pixel-Perfect Positioning
 *
 * This class provides a single source of truth for all coordinate transformations
 * between storage coordinates (actual pixels) and preview coordinates (display pixels).
 */

export interface Point {
	x: number;
	y: number;
}

export interface Dimensions {
	width: number;
	height: number;
}

export interface Bounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

export class CoordinateSystem {
	private _storageWidth: number;
	private _storageHeight: number;
	private _previewScale: number;

	constructor(
		storageWidth: number = 1013, // Actual canvas width for storage
		storageHeight: number = 638, // Actual canvas height for storage
		previewScale: number = 1 // Scale factor for UI display
	) {
		this._storageWidth = storageWidth;
		this._storageHeight = storageHeight;
		this._previewScale = previewScale;
	}

	/** Get the actual canvas dimensions used for storage */
	get storageDimensions(): Dimensions {
		return {
			width: this._storageWidth,
			height: this._storageHeight
		};
	}

	/** Get the preview dimensions (scaled for display) */
	get previewDimensions(): Dimensions {
		return {
			width: this._storageWidth * this._previewScale,
			height: this._storageHeight * this._previewScale
		};
	}

	/** Get the scale factor being used */
	get scale(): number {
		return this._previewScale;
	}

	/** Update the scale factor (for responsive resizing) */
	updateScale(previewScale: number): void {
		this._previewScale = previewScale;
	}

	/** Update storage dimensions (for different card sizes) */
	updateStorageDimensions(width: number, height: number): void {
		this._storageWidth = width;
		this._storageHeight = height;
	}

	/** Convert storage coordinates to preview coordinates */
	storageToPreview(storagePoint: Point): Point {
		return {
			x: storagePoint.x * this._previewScale,
			y: storagePoint.y * this._previewScale
		};
	}

	/** Convert preview coordinates to storage coordinates */
	previewToStorage(previewPoint: Point): Point {
		return {
			x: previewPoint.x / this._previewScale,
			y: previewPoint.y / this._previewScale
		};
	}

	/** Convert storage dimensions to preview dimensions */
	storageToPreviewDimensions(storageDims: Dimensions): Dimensions {
		return {
			width: storageDims.width * this._previewScale,
			height: storageDims.height * this._previewScale
		};
	}

	/** Convert preview dimensions to storage dimensions */
	previewToStorageDimensions(previewDims: Dimensions): Dimensions {
		return {
			width: previewDims.width / this._previewScale,
			height: previewDims.height / this._previewScale
		};
	}

	/** Get bounds for storage coordinate system */
	getStorageBounds(): Bounds {
		return {
			x: 0,
			y: 0,
			width: this._storageWidth,
			height: this._storageHeight
		};
	}

	/** Get bounds for preview coordinate system */
	getPreviewBounds(): Bounds {
		const previewDims = this.previewDimensions;
		return {
			x: 0,
			y: 0,
			width: previewDims.width,
			height: previewDims.height
		};
	}

	/** Constrain a point to storage bounds */
	constrainToStorage(point: Point, dimensions?: Dimensions): Point {
		const bounds = this.getStorageBounds();
		const maxX = bounds.width - (dimensions?.width || 0);
		const maxY = bounds.height - (dimensions?.height || 0);

		return {
			x: Math.max(0, Math.min(point.x, maxX)),
			y: Math.max(0, Math.min(point.y, maxY))
		};
	}

	/** Constrain a point to preview bounds */
	constrainToPreview(point: Point, dimensions?: Dimensions): Point {
		const bounds = this.getPreviewBounds();
		const maxX = bounds.width - (dimensions?.width || 0);
		const maxY = bounds.height - (dimensions?.height || 0);

		return {
			x: Math.max(0, Math.min(point.x, maxX)),
			y: Math.max(0, Math.min(point.y, maxY))
		};
	}

	/** Create CSS style for positioning an element based on storage coordinates */
	createPositionStyle(
		storageX: number,
		storageY: number,
		storageWidth: number,
		storageHeight: number
	): Record<string, string> {
		const previewPos = this.storageToPreview({ x: storageX, y: storageY });
		const previewDims = this.storageToPreviewDimensions({
			width: storageWidth,
			height: storageHeight
		});

		return {
			left: `${previewPos.x}px`,
			top: `${previewPos.y}px`,
			width: `${previewDims.width}px`,
			height: `${previewDims.height}px`
		};
	}

	/** Create CSS style for text elements (font size scaling) */
	createTextStyle(fontSize: number): Record<string, string> {
		const scaledFontSize = fontSize * this._previewScale;
		return {
			'font-size': `${scaledFontSize}px`
		};
	}

	/** Scale a mouse movement delta from preview to storage coordinates */
	scaleMouseDelta(dx: number, dy: number): Point {
		return {
			x: dx / this._previewScale,
			y: dy / this._previewScale
		};
	}

	/** Check if a point is within storage bounds (with optional element dimensions) */
	isWithinStorageBounds(point: Point, dimensions?: Dimensions): boolean {
		const bounds = this.getStorageBounds();
		const maxX = dimensions ? bounds.width - dimensions.width : bounds.width;
		const maxY = dimensions ? bounds.height - dimensions.height : bounds.height;

		return point.x >= 0 && point.x <= maxX && point.y >= 0 && point.y <= maxY;
	}

	/** Check if a point is within preview bounds (with optional element dimensions) */
	isWithinPreviewBounds(point: Point, dimensions?: Dimensions): boolean {
		const bounds = this.getPreviewBounds();
		const maxX = dimensions ? bounds.width - dimensions.width : bounds.width;
		const maxY = dimensions ? bounds.height - dimensions.height : bounds.height;

		return point.x >= 0 && point.x <= maxX && point.y >= 0 && point.y <= maxY;
	}

	/** Create a new CoordinateSystem with different dimensions but same scale */
	withDimensions(width: number, height: number): CoordinateSystem {
		return new CoordinateSystem(width, height, this._previewScale);
	}

	/** Create a new CoordinateSystem with different scale but same dimensions */
	withScale(scale: number): CoordinateSystem {
		return new CoordinateSystem(this._storageWidth, this._storageHeight, scale);
	}

	/** Debug information about the coordinate system */
	getDebugInfo(): string {
		return `CoordinateSystem: Storage(${this._storageWidth}×${this._storageHeight}) → Scale(${this._previewScale.toFixed(3)}) → Preview(${this.previewDimensions.width.toFixed(1)}×${this.previewDimensions.height.toFixed(1)})`;
	}
}
