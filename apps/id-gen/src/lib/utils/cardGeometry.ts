export interface CardGeometry {
	frontGeometry: any;
	backGeometry: any;
	edgeGeometry: any;
}

// LRU cache for geometry - avoids expensive recreation
const geometryCache = new Map<string, CardGeometry>();
const MAX_CACHE_SIZE = 10;

function getCacheKey(width: number, height: number, depth: number, radius: number): string {
	// Round to 2 decimal places for cache key to handle floating point precision
	return `${width.toFixed(2)}-${height.toFixed(2)}-${depth.toFixed(3)}-${radius.toFixed(3)}`;
}

function addToCache(key: string, geometry: CardGeometry) {
	// LRU eviction - remove oldest entry if cache is full
	if (geometryCache.size >= MAX_CACHE_SIZE) {
		const firstKey = geometryCache.keys().next().value;
		if (firstKey) {
			const oldGeom = geometryCache.get(firstKey);
			if (oldGeom) {
				// Dispose old geometries to free GPU memory
				oldGeom.frontGeometry?.dispose?.();
				oldGeom.backGeometry?.dispose?.();
				oldGeom.edgeGeometry?.dispose?.();
			}
			geometryCache.delete(firstKey);
		}
	}
	geometryCache.set(key, geometry);
}

export async function createRoundedRectCard(
	width = 2,
	height = 1.25,
	depth = 0.007,
	radius = 0.08
): Promise<CardGeometry> {
	const cacheKey = getCacheKey(width, height, depth, radius);

	// Check cache first
	const cached = geometryCache.get(cacheKey);
	if (cached) {
		// Move to end (mark as recently used)
		geometryCache.delete(cacheKey);
		geometryCache.set(cacheKey, cached);
		return cached;
	}

	const THREE = await import('three');
	const roundedRectShape = new THREE.Shape();

	const x = -width / 2;
	const y = -height / 2;
	const w = width;
	const h = height;
	const r = radius;

	roundedRectShape.moveTo(x + r, y);
	roundedRectShape.lineTo(x + w - r, y);
	roundedRectShape.bezierCurveTo(x + w - r / 2, y, x + w, y + r / 2, x + w, y + r);
	roundedRectShape.lineTo(x + w, y + h - r);
	roundedRectShape.bezierCurveTo(x + w, y + h - r / 2, x + w - r / 2, y + h, x + w - r, y + h);
	roundedRectShape.lineTo(x + r, y + h);
	roundedRectShape.bezierCurveTo(x + r / 2, y + h, x, y + h - r / 2, x, y + h - r);
	roundedRectShape.lineTo(x, y + r);
	roundedRectShape.bezierCurveTo(x, y + r / 2, x + r / 2, y, x + r, y);
	roundedRectShape.closePath();

	// Reduced segments for better mobile performance
	const extrudeSettings = {
		depth: depth,
		bevelEnabled: true,
		bevelThickness: 0.002,
		bevelSize: 0.002,
		bevelSegments: 1, // Reduced from 2
		steps: 1,
		curveSegments: 12 // Reduced from 32
	};

	const extrudeGeometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);

	const frontGeometry = new THREE.BufferGeometry();
	const backGeometry = new THREE.BufferGeometry();
	const edgeGeometry = new THREE.BufferGeometry();

	const position = extrudeGeometry.getAttribute('position');
	const normal = extrudeGeometry.getAttribute('normal');

	const frontPositions: number[] = [];
	const frontNormals: number[] = [];
	const frontUvs: number[] = [];
	const backPositions: number[] = [];
	const backNormals: number[] = [];
	const backUvs: number[] = [];
	const edgePositions: number[] = [];
	const edgeNormals: number[] = [];

	for (let i = 0; i < position.count; i++) {
		const normalZ = normal.getZ(i);
		const px = position.getX(i);
		const py = position.getY(i);
		const pz = position.getZ(i);
		const nx = normal.getX(i);
		const ny = normal.getY(i);
		const nz = normal.getZ(i);

		if (normalZ > 0.5) {
			frontPositions.push(px, py, pz);
			frontNormals.push(nx, ny, nz);
			frontUvs.push((px - x) / w, (py - y) / h);
		} else if (normalZ < -0.5) {
			backPositions.push(px, py, pz);
			backNormals.push(nx, ny, nz);
			backUvs.push(1 - (px - x) / w, (py - y) / h);
		} else {
			edgePositions.push(px, py, pz);
			edgeNormals.push(nx, ny, nz);
		}
	}

	frontGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frontPositions, 3));
	frontGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(frontNormals, 3));
	frontGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(frontUvs, 2));

	backGeometry.setAttribute('position', new THREE.Float32BufferAttribute(backPositions, 3));
	backGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(backNormals, 3));
	backGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(backUvs, 2));

	edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
	edgeGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(edgeNormals, 3));

	// Dispose the source geometry
	extrudeGeometry.dispose();

	const cardGeometry = {
		frontGeometry,
		backGeometry,
		edgeGeometry
	};

	// Add to cache
	addToCache(cacheKey, cardGeometry);

	return cardGeometry;
}

export function getCardGeometry(): CardGeometry | null {
	// Legacy function - cache is now internal LRU cache
	// Return the most recently added geometry if any
	if (geometryCache.size > 0) {
		const entries = Array.from(geometryCache.entries());
		return entries[entries.length - 1][1];
	}
	return null;
}

export async function preloadCardGeometry(): Promise<CardGeometry> {
	return createRoundedRectCard();
}

/**
 * Convert card size in inches to 3D world units
 * Uses a scale factor to convert real-world dimensions to Three.js units
 */
export function cardSizeTo3D(
	widthInches: number,
	heightInches: number,
	scaleInchesToUnits: number = 0.5
): { width: number; height: number } {
	return {
		width: widthInches * scaleInchesToUnits,
		height: heightInches * scaleInchesToUnits
	};
}

/**
 * Create card geometry from real-world dimensions
 */
export async function createCardFromInches(
	widthInches: number,
	heightInches: number,
	depth = 0.007,
	scaleInchesToUnits: number = 0.5
): Promise<CardGeometry> {
	const { width, height } = cardSizeTo3D(widthInches, heightInches, scaleInchesToUnits);

	// Calculate radius proportional to the smaller dimension
	const minDimension = Math.min(width, height);
	const radius = minDimension * 0.04; // 4% of smaller dimension for corner radius

	return createRoundedRectCard(width, height, depth, radius);
}
