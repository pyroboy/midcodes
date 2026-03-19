/**
 * Wall geometry with proper rectangular openings (doors/windows).
 *
 * Uses THREE.Shape holes + ExtrudeGeometry to cut openings in walls
 * instead of splitting into multiple BoxGeometry segments.
 *
 * Shape is drawn in XY plane (X = along wall, Y = up).
 * Extrusion goes along +Z (wall thickness).
 *
 * Geometries are cached by parameter signature to avoid expensive
 * re-triangulation on every render frame.
 */

import { Shape, Path, ExtrudeGeometry } from 'three';

export interface WallOpening {
	/** Center offset along the wall (meters from wall start) */
	offsetAlongWall: number;
	/** Width of the opening (meters) */
	width: number;
	/** Bottom of opening (meters from floor, 0 = floor level) */
	bottomY: number;
	/** Top of opening (meters from floor) */
	topY: number;
}

// ─── Geometry Cache ──────────────────────────────────────────────────────
const _geomCache = new Map<string, ExtrudeGeometry>();

function cacheKey(
	wallLength: number,
	wallHeight: number,
	wallThickness: number,
	openings: WallOpening[]
): string {
	if (openings.length === 0) return `${wallLength}|${wallHeight}|${wallThickness}`;
	const ops = openings
		.map((o) => `${o.offsetAlongWall},${o.width},${o.bottomY},${o.topY}`)
		.join(';');
	return `${wallLength}|${wallHeight}|${wallThickness}|${ops}`;
}

/** Dispose all cached geometries. Call on component destroy. */
export function clearWallGeomCache(): void {
	for (const geom of _geomCache.values()) geom.dispose();
	_geomCache.clear();
}

/**
 * Create a wall geometry with rectangular cutouts for doors/windows.
 * Results are cached — identical parameters return the same geometry instance.
 */
export function createWallWithOpenings(
	wallLength: number,
	wallHeight: number,
	wallThickness: number,
	openings: WallOpening[]
): ExtrudeGeometry {
	const key = cacheKey(wallLength, wallHeight, wallThickness, openings);
	const cached = _geomCache.get(key);
	if (cached) return cached;

	// Outer wall rectangle in XY plane
	const shape = new Shape();
	shape.moveTo(0, 0);
	shape.lineTo(wallLength, 0);
	shape.lineTo(wallLength, wallHeight);
	shape.lineTo(0, wallHeight);
	shape.lineTo(0, 0);

	// Cut holes for each opening
	for (const op of openings) {
		const EPS = 0.005;
		const halfW = op.width / 2;
		const left = Math.max(EPS, op.offsetAlongWall - halfW);
		const right = Math.min(wallLength - EPS, op.offsetAlongWall + halfW);
		const bottom = Math.max(EPS, op.bottomY);
		const top = Math.min(wallHeight - EPS, op.topY);

		if (right <= left || top <= bottom) continue;

		const actualBottom = op.bottomY <= 0 ? 0 : bottom;

		const hole = new Path();
		hole.moveTo(left, actualBottom);
		hole.lineTo(right, actualBottom);
		hole.lineTo(right, top);
		hole.lineTo(left, top);
		hole.lineTo(left, actualBottom);

		shape.holes.push(hole);
	}

	const geom = new ExtrudeGeometry(shape, {
		depth: wallThickness,
		bevelEnabled: false
	});
	_geomCache.set(key, geom);
	return geom;
}
