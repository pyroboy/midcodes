<script lang="ts">
	import { T, useThrelte, useTask } from '@threlte/core';
	import { OrbitControls, HTML, interactivity } from '@threlte/extras';
	import { Vector3, MeshStandardMaterial, BoxGeometry, Shape, ExtrudeGeometry, DoubleSide, CustomBlending, AddEquation, OneFactor, OneMinusSrcAlphaFactor, Color, BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, CanvasTexture, SpriteMaterial, LinearFilter } from 'three';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import type { FloorLayoutItem } from './types';
	import { ITEM_TYPE_LABELS } from './types';
	import { itemsToWallSet, edgesToLines, edgeKey, buildWallMetaMap, type WallStorageItem, type WallMeta, type WallLine } from './wallEngine';
	import { createWallWithOpenings, clearWallGeomCache, type WallOpening } from './wallGeometry';

	let {
		floors,
		allItems,
		rentalUnits,
		unitTenantsMap,
		selectedFloorId,
		onUnitClick
	}: {
		floors: any[];
		allItems: FloorLayoutItem[];
		rentalUnits: any[];
		unitTenantsMap: Map<string, { name: string; status: string }[]>;
		selectedFloorId: string | null;
		onUnitClick: (rentalUnitId: string) => void;
	} = $props();

	interactivity();

	function parseAreaCells(item: FloorLayoutItem): string[] | null {
		if (!item.color || item.color.startsWith('#')) return null;
		return item.color.split(';');
	}

	function areaLabel(item: FloorLayoutItem): string {
		if (item.item_type === 'RENTAL_UNIT' && item.rental_unit_id) {
			const unit = rentalUnits.find((u: any) => String(u.id) === String(item.rental_unit_id));
			return unit?.name ?? 'Rental Unit';
		}
		// Avoid showing raw numeric IDs as labels — fall back to type label
		const raw = item.label ?? ITEM_TYPE_LABELS[item.item_type] ?? item.item_type;
		if (/^\d{6,}$/.test(raw)) return ITEM_TYPE_LABELS[item.item_type] ?? item.item_type;
		return raw;
	}

	/** Clamp grid dimensions to prevent oversized rooms in 3D */
	const MAX_GRID_DIM = 12;
	function clampDim(val: number): number {
		return Math.min(Math.max(val, 1), MAX_GRID_DIM);
	}

	/** Detect mobile/touch device where HTML overlay labels may not render */
	const isMobile = browser && (
		/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
		(navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
	);

	/** Create a canvas-based sprite texture for 3D text labels (mobile fallback) */
	const spriteTexCache = new Map<string, SpriteMaterial>();
	function getSpriteLabelMat(text: string): SpriteMaterial {
		let mat = spriteTexCache.get(text);
		if (mat) return mat;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		const fontSize = 48;
		ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
		const metrics = ctx.measureText(text);
		const padding = 24;
		canvas.width = Math.ceil(metrics.width + padding * 2);
		canvas.height = fontSize + padding * 2;
		// Redraw after resize
		ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
		ctx.fillStyle = 'rgba(255,255,255,0.92)';
		const r = 12;
		const w = canvas.width, h = canvas.height;
		ctx.beginPath();
		ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
		ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
		ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
		ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = '#1e293b';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, w / 2, h / 2);
		const tex = new CanvasTexture(canvas);
		tex.minFilter = LinearFilter;
		mat = new SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
		spriteTexCache.set(text, mat);
		return mat;
	}

	/** Offset a polygon outward by `dist` — intersects adjacent offset edges for clean right-angle corners */
	function offsetPoly(pts: [number, number][], dist: number): [number, number][] {
		const n = pts.length;
		const out: [number, number][] = [];
		for (let i = 0; i < n; i++) {
			const prev = pts[(i - 1 + n) % n];
			const curr = pts[i];
			const next = pts[(i + 1) % n];
			// Previous edge direction + outward normal
			const pdx = curr[0] - prev[0], pdz = curr[1] - prev[1];
			const pLen = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
			const pnx = pdz / pLen, pnz = -pdx / pLen;
			// Current edge direction + outward normal
			const cdx = next[0] - curr[0], cdz = next[1] - curr[1];
			const cLen = Math.sqrt(cdx * cdx + cdz * cdz) || 1;
			const cnx = cdz / cLen, cnz = -cdx / cLen;
			// If parallel edges, just offset
			const det = pdx * cdz - pdz * cdx;
			if (Math.abs(det) < 0.0001) {
				out.push([curr[0] + pnx * dist, curr[1] + pnz * dist]);
				continue;
			}
			// Intersect the two offset lines to get the clean corner point
			const px = prev[0] + pnx * dist, pz = prev[1] + pnz * dist;
			const qx = curr[0] + cnx * dist, qz = curr[1] + cnz * dist;
			const t = ((qx - px) * cdz - (qz - pz) * cdx) / det;
			out.push([px + t * pdx, pz + t * pdz]);
		}
		return out;
	}

	// Near-invisible click target material (tiny opacity so raycaster still hits it)
	const areaClickMat = new MeshStandardMaterial({ transparent: true, opacity: 0.01, depthWrite: false });

	const CORNER_RADIUS = 0.3;
	const CORNER_SEGMENTS = 5;

	/** Round an XZ outline's corners with quadratic bezier interpolation */
	function roundOutline(pts: [number, number][], radius: number): [number, number][] {
		const n = pts.length;
		const out: [number, number][] = [];
		for (let i = 0; i < n; i++) {
			const prev = pts[(i - 1 + n) % n];
			const curr = pts[i];
			const next = pts[(i + 1) % n];
			const dpx = prev[0] - curr[0], dpz = prev[1] - curr[1];
			const dnx = next[0] - curr[0], dnz = next[1] - curr[1];
			const lp = Math.sqrt(dpx * dpx + dpz * dpz) || 1;
			const ln = Math.sqrt(dnx * dnx + dnz * dnz) || 1;
			const r = Math.min(radius, lp * 0.4, ln * 0.4);
			const ax = curr[0] + (dpx / lp) * r, az = curr[1] + (dpz / lp) * r;
			const bx = curr[0] + (dnx / ln) * r, bz = curr[1] + (dnz / ln) * r;
			out.push([ax, az]);
			for (let s = 1; s < CORNER_SEGMENTS; s++) {
				const t = s / CORNER_SEGMENTS;
				const u = 1 - t;
				out.push([u * u * ax + 2 * u * t * curr[0] + t * t * bx, u * u * az + 2 * u * t * curr[1] + t * t * bz]);
			}
			out.push([bx, bz]);
		}
		return out;
	}

	/** Create a Shape with rounded corners from a polygon (in shape XY space) */
	function roundedShapeFromPoints(pts: [number, number][], radius: number): Shape {
		const n = pts.length;
		const s = new Shape();
		for (let i = 0; i < n; i++) {
			const prev = pts[(i - 1 + n) % n];
			const curr = pts[i];
			const next = pts[(i + 1) % n];
			// Directions to prev and next
			const dpx = prev[0] - curr[0], dpy = prev[1] - curr[1];
			const dnx = next[0] - curr[0], dny = next[1] - curr[1];
			const lprev = Math.sqrt(dpx * dpx + dpy * dpy) || 1;
			const lnext = Math.sqrt(dnx * dnx + dny * dny) || 1;
			// Clamp radius to half the shorter edge
			const r = Math.min(radius, lprev * 0.4, lnext * 0.4);
			// Points where the arc starts/ends (inset from corner along each edge)
			const ax = curr[0] + (dpx / lprev) * r, ay = curr[1] + (dpy / lprev) * r;
			const bx = curr[0] + (dnx / lnext) * r, by = curr[1] + (dny / lnext) * r;
			if (i === 0) s.moveTo(ax, ay);
			else s.lineTo(ax, ay);
			// Quadratic bezier through the corner point to round it
			s.quadraticCurveTo(curr[0], curr[1], bx, by);
		}
		s.closePath();
		return s;
	}

	/** Build a single solid ExtrudeGeometry from cell keys + return outline for laser edges */
	function buildCellSolidGeom(cellKeys: string[]): { geom: BufferGeometry; expandedGeom: BufferGeometry; outline: [number, number][] } | null {
		if (cellKeys.length === 0) return null;
		const cellSet = new Set(cellKeys);
		const edges: [number, number, number, number][] = [];
		for (const key of cellKeys) {
			const [q, r] = key.split(',').map(Number);
			if (!cellSet.has(`${q},${r - 1}`)) edges.push([q * CELL, -r * CELL, (q + 1) * CELL, -r * CELL]);
			if (!cellSet.has(`${q + 1},${r}`)) edges.push([(q + 1) * CELL, -r * CELL, (q + 1) * CELL, -(r + 1) * CELL]);
			if (!cellSet.has(`${q},${r + 1}`)) edges.push([(q + 1) * CELL, -(r + 1) * CELL, q * CELL, -(r + 1) * CELL]);
			if (!cellSet.has(`${q - 1},${r}`)) edges.push([q * CELL, -(r + 1) * CELL, q * CELL, -r * CELL]);
		}
		if (edges.length === 0) return null;
		const adj = new Map<string, number[]>();
		for (let i = 0; i < edges.length; i++) {
			const k = `${edges[i][0]},${edges[i][1]}`;
			if (!adj.has(k)) adj.set(k, []);
			adj.get(k)!.push(i);
		}
		const used = new Set<number>();
		used.add(0);
		const e0 = edges[0];
		const points: [number, number][] = [[e0[0], e0[1]]];
		let cx = e0[2], cy = e0[3];
		for (let s = 0; s < edges.length + 1; s++) {
			if (cx === e0[0] && cy === e0[1]) break;
			points.push([cx, cy]);
			const cands = adj.get(`${cx},${cy}`) ?? [];
			let found = false;
			for (const idx of cands) {
				if (!used.has(idx)) { used.add(idx); cx = edges[idx][2]; cy = edges[idx][3]; found = true; break; }
			}
			if (!found) break;
		}
		if (points.length < 3) return null;
		// Floor shape with rounded corners
		const shape = roundedShapeFromPoints(points as [number, number][], CORNER_RADIUS);
		const geom = new ExtrudeGeometry(shape, { depth: FLOOR_THICK, bevelEnabled: false });
		geom.rotateX(-Math.PI / 2);
		// Outline in world XZ coords (negate Y back to Z)
		const outline: [number, number][] = points.map(([x, y]) => [x, -y]);
		// Offset outline outward so it bleeds past walls
		const offsetOutline = offsetPoly(outline, 0.3);
		// Build expanded floor geom with rounded corners too
		const oPts: [number, number][] = offsetOutline.map(([x, z]) => [x, -z]);
		const oShape = roundedShapeFromPoints(oPts, CORNER_RADIUS);
		const expandedGeom = new ExtrudeGeometry(oShape, { depth: FLOOR_THICK, bevelEnabled: false });
		expandedGeom.rotateX(-Math.PI / 2);
		return { geom, expandedGeom, outline: offsetOutline };
	}

	const { camera, invalidate } = useThrelte();

	// OrbitControls ref for updating target
	let controlsRef = $state<any>(null);

	const CELL = 1;
	const FLOOR_GAP = 5;
	const WALL_HEIGHT = 2.8;
	const WALL_THICK = 0.08;
	const SLAB_THICK = 0.15;
	const FLOOR_THICK = 0.02;
	const SLAB_PAD = 0.5;       // padding around items for the slab

	const WALL_3D_THICK = 0.12;
	const WALL_3D_HEIGHT = 3.0;
	const WALL_3D_COLOR = '#64748b';  // slate-500

	// ─── Shared materials (reused across all meshes to reduce draw calls) ────
	const wallMatCache = new Map<string, MeshStandardMaterial>();
	function getWallMat(color: string): MeshStandardMaterial {
		let mat = wallMatCache.get(color);
		if (!mat) {
			mat = new MeshStandardMaterial({ color, roughness: 0.85 });
			wallMatCache.set(color, mat);
		}
		return mat;
	}

	const doorFrameMat = new MeshStandardMaterial({ color: '#5C4A1E', roughness: 0.7 });
	const doorPanelMat = new MeshStandardMaterial({ color: '#8B6914', roughness: 0.6 });
	const doorBackMat = new MeshStandardMaterial({ color: '#7A5C12', roughness: 0.6 });
	const frenchDoorMat = new MeshStandardMaterial({ color: '#93c5fd', roughness: 0.1, transparent: true, opacity: 0.4 });
	const handleMat = new MeshStandardMaterial({ color: '#C0C0C0', metalness: 0.8, roughness: 0.2 });
	const windowFrameMat = new MeshStandardMaterial({ color: '#E8E8E8', roughness: 0.3 });
	const glassMat = new MeshStandardMaterial({ color: '#93c5fd', transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1 });
	const slabSelectedMat = new MeshStandardMaterial({ color: '#dbeafe', roughness: 0.9 });
	const slabDefaultMat = new MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.9 });
	// Invisible click target for door openings (transparent but raycasted)
	const doorClickMat = new MeshStandardMaterial({ transparent: true, opacity: 0, depthWrite: false });

	const floorMatCache = new Map<string, MeshStandardMaterial>();
	function getFloorMat(color: string): MeshStandardMaterial {
		let mat = floorMatCache.get(color);
		if (!mat) {
			mat = new MeshStandardMaterial({ color, roughness: 0.7 });
			floorMatCache.set(color, mat);
		}
		return mat;
	}

	// ─── Floor tile hover / select state ─────────────────────────────────────
	let hoveredItemId = $state<string | null>(null);
	let labelHovered = $state(false); // true when pointer is over a label, prevents 3D mesh pointerleave from clearing hover
	let selectedItemId = $state<string | null>(null);
	let glowTime = $state(0);

	// Breathing glow tick (runs when something is hovered or selected)
	useTask((delta) => {
		if (hoveredItemId || selectedItemId) {
			glowTime += delta;
			invalidate(); // glow animation needs re-render
		}
	}, { autoInvalidate: false });

	// ─── Glow shaders (floor overlay + laser walls) ─────────────────────────

	const glowVertexShader = `
		varying vec2 vUv;
		varying vec3 vWorldPos;
		void main() {
			vUv = uv;
			vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	// Shared noise functions (injected into both shaders)
	const noiseFuncs = `
		float hash(vec2 p) {
			return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
		}
		float noise(vec2 p) {
			vec2 i = floor(p);
			vec2 f = fract(p);
			f = f * f * (3.0 - 2.0 * f);
			return mix(
				mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
				mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
				f.y
			);
		}
	`;

	// Floor glow: animated noise + edge glow, premultiplied alpha output
	const floorGlowFragShader = `
		uniform vec3 uColor;
		uniform float uTime;
		uniform float uIntensity;
		uniform float uSpeed;
		varying vec2 vUv;
		varying vec3 vWorldPos;
		${noiseFuncs}

		void main() {
			vec2 wp = vWorldPos.xz;
			float t = uTime * uSpeed;
			float n1 = noise(wp * 3.0 + t * 0.4);
			float n2 = noise(wp * 6.0 - t * 0.6);
			float n3 = noise(wp * 1.5 + vec2(t * 0.2, -t * 0.3));
			float smoke = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

			float ex = min(vUv.x, 1.0 - vUv.x);
			float ey = min(vUv.y, 1.0 - vUv.y);
			float edgeDist = min(ex, ey);
			float edgeGlow = 1.0 - smoothstep(0.0, 0.15, edgeDist);

			float alpha = (smoke * 0.3 + edgeGlow * 0.7) * uIntensity;
			alpha = clamp(alpha, 0.0, 0.8);
			// Premultiplied alpha: color * alpha in RGB, alpha in A
			gl_FragColor = vec4(uColor * alpha, alpha);
		}
	`;

	// Laser wall: gradient + energy streaks, premultiplied alpha output
	const laserFragShader = `
		uniform vec3 uColor;
		uniform float uOpacity;
		uniform float uSpeed;
		uniform float uTime;
		varying vec2 vUv;
		varying vec3 vWorldPos;
		${noiseFuncs}

		void main() {
			float h = 1.0 - vUv.y;
			// Long smooth ombre — full color at base, gentle fade all the way to top
			float fade = h * h * (3.0 - 2.0 * h); // smoothstep S-curve across full height
			// Soft animated energy wisps
			float streak = noise(vec2(vWorldPos.x + vWorldPos.z, vUv.y * 3.0 - uTime * uSpeed) * 2.5);
			streak *= h;

			float alpha = (fade * 0.8 + streak * 0.2) * uOpacity;
			alpha = clamp(alpha, 0.0, 0.85);
			gl_FragColor = vec4(uColor * alpha, alpha);
		}
	`;

	/** Build a single laser wall geometry from outline — a vertical strip extruded from the shape's edges */
	function buildLaserWallGeom(outline: [number, number][], height: number): BufferGeometry {
		const n = outline.length;
		const positions = new Float32Array(n * 2 * 3);
		const uvs = new Float32Array(n * 2 * 2);
		const indices: number[] = [];

		for (let i = 0; i < n; i++) {
			const [x, z] = outline[i];
			const bi = i * 6;
			positions[bi] = x;     positions[bi + 1] = 0;      positions[bi + 2] = z;     // bottom
			positions[bi + 3] = x; positions[bi + 4] = height; positions[bi + 5] = z;     // top
			uvs[i * 4] = 0;     uvs[i * 4 + 1] = 0; // bottom v=0
			uvs[i * 4 + 2] = 0; uvs[i * 4 + 3] = 1; // top v=1
		}

		for (let i = 0; i < n; i++) {
			const next = (i + 1) % n;
			const b0 = i * 2, t0 = i * 2 + 1, b1 = next * 2, t1 = next * 2 + 1;
			indices.push(b0, b1, t0, t0, b1, t1);
		}

		const geom = new BufferGeometry();
		geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
		geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
		geom.setIndex(indices);
		geom.computeVertexNormals();
		return geom;
	}

	// ─── Shared geometries (reused for identical dimensions) ─────────────────
	const handleGeomH = new BoxGeometry(0.03, 0.12, 0.04);
	const handleGeomV = new BoxGeometry(0.04, 0.12, 0.03);
	const handleGeomSmallH = new BoxGeometry(0.03, 0.1, 0.03);
	const cellTileGeom = new BoxGeometry(CELL - 0.02, FLOOR_THICK, CELL - 0.02);

	// Items grouped by floor
	let itemsByFloor = $derived.by(() => {
		const map = new Map<string, FloorLayoutItem[]>();
		for (const item of allItems) {
			const list = map.get(item.floor_id) ?? [];
			list.push(item);
			map.set(item.floor_id, list);
		}
		return map;
	});

	// Per-floor bounding box (only floors with items)
	let floorBounds = $derived.by(() => {
		const map = new Map<string, { minX: number; minZ: number; maxX: number; maxZ: number }>();
		for (const [floorId, items] of itemsByFloor) {
			if (items.length === 0) continue;
			let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
			for (const item of items) {
				minX = Math.min(minX, item.grid_x);
				minZ = Math.min(minZ, item.grid_y);
				maxX = Math.max(maxX, item.grid_x + clampDim(item.grid_w));
				maxZ = Math.max(maxZ, item.grid_y + clampDim(item.grid_h));
			}
			map.set(floorId, {
				minX: minX * CELL - SLAB_PAD,
				minZ: minZ * CELL - SLAB_PAD,
				maxX: maxX * CELL + SLAB_PAD,
				maxZ: maxZ * CELL + SLAB_PAD
			});
		}
		return map;
	});

	let occupancyMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const unit of rentalUnits) map.set(unit.id, unit.rental_unit_status);
		return map;
	});

	function floorColor(item: FloorLayoutItem): string {
		const hexColor = item.color && item.color.startsWith('#') ? item.color : null;
		if (item.item_type !== 'RENTAL_UNIT') {
			const areaColors: Record<string, string> = {
				CORRIDOR: '#e2e8f0',
				BATHROOM: '#cffafe',
				KITCHEN: '#ffedd5',
				COMMON_ROOM: '#ede9fe',
				STAIRWELL: '#fef9c3',
				ELEVATOR: '#fef9c3',
				STORAGE: '#f5f5f4',
				OFFICE: '#dcfce7',
				CUSTOM: '#f1f5f9'
			};
			return hexColor || areaColors[item.item_type] || '#f1f5f9';
		}
		if (hexColor) return hexColor;
		const status = occupancyMap.get(item.rental_unit_id ?? '');
		if (status === 'OCCUPIED') return '#60a5fa'; // blue-400
		if (status === 'RESERVED') return '#fbbf24'; // amber-400
		return '#4ade80'; // green-400
	}

	// Only render floors that have items placed
	let floorsWithItems = $derived(
		[...floors]
			.filter((f: any) => (itemsByFloor.get(f.id)?.length ?? 0) > 0)
			.sort((a: any, b: any) => a.floor_number - b.floor_number)
	);

	// Pre-compute wall topology per floor (cached in $derived, not in template)
	let floorWallData = $derived.by(() => {
		const map = new Map<string, { lines: WallLine[]; metaMap: Map<string, WallMeta> }>();
		for (const [floorId, items] of itemsByFloor) {
			const wallItems = items.filter((i) => i.item_type === 'WALL') as unknown as WallStorageItem[];
			if (wallItems.length === 0) continue;
			const wallSet = itemsToWallSet(wallItems);
			map.set(floorId, {
				lines: edgesToLines(wallSet),
				metaMap: buildWallMetaMap(wallItems)
			});
		}
		return map;
	});

	// Compute target center for the selected floor
	let selectedFloorCenter = $derived.by(() => {
		if (!selectedFloorId) return null;
		const bounds = floorBounds.get(selectedFloorId);
		if (!bounds) return null;
		// Find the floor's vertical position
		const floorIdx = floorsWithItems.findIndex((f: any) => f.id === selectedFloorId);
		const yBase = (floorIdx >= 0 ? floorIdx : 0) * FLOOR_GAP;
		return {
			x: (bounds.minX + bounds.maxX) / 2,
			y: yBase + WALL_HEIGHT / 2,
			z: (bounds.minZ + bounds.maxZ) / 2
		};
	});

	// Smooth camera animation to selected floor
	let animating = $state(false);
	$effect(() => {
		const center = selectedFloorCenter;
		if (!center || !controlsRef) return;

		// Animate target + camera position
		const controls = controlsRef;
		const cam = camera.current;
		if (!cam || !controls.target) return;

		const targetPos = new Vector3(center.x, center.y, center.z);
		const startTarget = controls.target.clone();
		const startCam = cam.position.clone();

		// Camera offset from target (keep same viewing angle, just re-center)
		const offset = new Vector3(12, 14, 12);
		const endCam = targetPos.clone().add(offset);

		animating = true;
		const duration = 600; // ms
		const startTime = performance.now();

		function animate() {
			const elapsed = performance.now() - startTime;
			const t = Math.min(elapsed / duration, 1);
			// Ease out cubic
			const ease = 1 - Math.pow(1 - t, 3);

			controls.target.lerpVectors(startTarget, targetPos, ease);
			cam.position.lerpVectors(startCam, endCam, ease);
			controls.update();

			if (t < 1) {
				invalidate(); // request render for on-demand mode
				requestAnimationFrame(animate);
			} else {
				animating = false;
				invalidate();
			}
		}
		requestAnimationFrame(animate);
	});

	// ─── Interactive door open/close with tweened animation ──────────────────
	// Tracks which doors are closed. By default all doors render OPEN.
	let closedDoors = $state<Set<string>>(new Set());

	function toggleDoor(doorKey: string) {
		const next = new Set(closedDoors);
		if (next.has(doorKey)) next.delete(doorKey);
		else next.add(doorKey);
		closedDoors = next;
		_anyAnimating = true; // wake up the tween loop
	}

	const OPEN_ANGLE = Math.PI * 0.44; // ~80° swing

	// Tween system: plain objects (not $state) to avoid state_unsafe_mutation.
	// useTask lerps currents toward targets each frame, then bumps a $state
	// tick counter to trigger template re-render.
	const _animTargets = new Map<string, number>();
	const _animCurrents: Record<string, number> = {};
	let _animTick = $state(0);

	/** Returns an animated (tweened) value that smoothly approaches `target`. */
	function animatedVal(key: string, target: number): number {
		_animTargets.set(key, target);
		if (!(key in _animCurrents)) _animCurrents[key] = target;
		void _animTick; // subscribe to tick for re-renders
		return _animCurrents[key];
	}

	let _anyAnimating = false;

	useTask((delta) => {
		if (!_anyAnimating) return; // skip when all doors are at rest
		let stillMoving = false;
		for (const [key, target] of _animTargets) {
			const current = _animCurrents[key] ?? target;
			const diff = target - current;
			if (Math.abs(diff) > 0.001) {
				// Laser walls shoot fast, doors animate slower
				const speed = key.startsWith('laser-') ? 18 : 6;
				_animCurrents[key] = current + diff * Math.min(1, speed * delta);
				stillMoving = true;
			} else if (current !== target) {
				_animCurrents[key] = target;
			}
		}
		_anyAnimating = stillMoving;
		if (stillMoving) {
			_animTick++;
			invalidate(); // only request render frame when doors are actually moving
		}
	}, { autoInvalidate: false });

	// Dispose all cached materials + geometries on component destroy
	onDestroy(() => {
		clearWallGeomCache();
		// Dispose shared materials
		doorFrameMat.dispose(); doorPanelMat.dispose(); doorBackMat.dispose();
		frenchDoorMat.dispose(); handleMat.dispose(); windowFrameMat.dispose(); doorClickMat.dispose();
		glassMat.dispose(); slabSelectedMat.dispose(); slabDefaultMat.dispose();
		wallMatCache.forEach((m) => m.dispose());
		floorMatCache.forEach((m) => m.dispose());
		// Dispose sprite label textures
		spriteTexCache.forEach((m) => { m.map?.dispose(); m.dispose(); });
		spriteTexCache.clear();
		// Dispose shared geometries
		handleGeomH.dispose(); handleGeomV.dispose(); handleGeomSmallH.dispose();
		cellTileGeom.dispose();
	});

	// ─── Door/Window opening computation ─────────────────────────────────────
	const DOOR_HEIGHT = 2.1; // meters

	function computeOpenings(meta: WallMeta, wallLength: number): WallOpening[] {
		if (meta.door) {
			const doorW = Math.min((meta.doorWidth ?? 80) / 100, wallLength * 0.9);
			return [{ offsetAlongWall: wallLength / 2, width: doorW, bottomY: 0, topY: DOOR_HEIGHT }];
		}
		if (meta.window) {
			const winW = Math.min((meta.windowWidth ?? 100) / 100, wallLength * 0.9);
			const sill = meta.sill ?? 0.9;
			const winH = (meta.windowHeight ?? 120) / 100;
			return [{ offsetAlongWall: wallLength / 2, width: winW, bottomY: sill, topY: Math.min(sill + winH, WALL_3D_HEIGHT) }];
		}
		return [];
	}
</script>

<T.AmbientLight intensity={0.7} />
<T.DirectionalLight position={[15, 30, 15]} intensity={0.8} />
<T.DirectionalLight position={[-10, 20, -5]} intensity={0.3} />

<T.PerspectiveCamera makeDefault position={[15, 18, 15]} fov={45}>
	<OrbitControls bind:ref={controlsRef} enablePan enableZoom enableDamping />
</T.PerspectiveCamera>

<!-- Only render floors that have items -->
{#each floorsWithItems as floor, floorIndex (floor.id)}
	{@const yBase = floorIndex * FLOOR_GAP}
	{@const floorItems = itemsByFloor.get(floor.id) ?? []}
	{@const isSelected = String(floor.id) === String(selectedFloorId)}
	{@const bounds = floorBounds.get(floor.id)}

	<!-- Floor slab + perimeter walls -->
	{#if bounds}
		{@const slabW = bounds.maxX - bounds.minX}
		{@const slabD = bounds.maxZ - bounds.minZ}
		{@const cx = bounds.minX + slabW / 2}
		{@const cz = bounds.minZ + slabD / 2}

		<!-- Slab (click to deselect) -->
		<T.Mesh
			position.x={cx}
			position.y={yBase - SLAB_THICK / 2}
			position.z={cz}
			material={isSelected ? slabSelectedMat : slabDefaultMat}
			dispose={false}
			onclick={() => { selectedItemId = null; hoveredItemId = null; _anyAnimating = true; invalidate(); }}
		>
			<T.BoxGeometry args={[slabW, SLAB_THICK, slabD]} />
		</T.Mesh>

	{/if}

	<!-- Wall segments from pre-computed wall data -->
	{@const wallData = floorWallData.get(floor.id)}
	{@const floorWallLines = wallData?.lines ?? []}
	{@const floorWallMetaMap = wallData?.metaMap ?? new Map()}

	{#each floorWallLines as line (`w-${line.x1},${line.y1},${line.x2},${line.y2}`)}
		{@const isHoriz = line.y1 === line.y2}
		{@const totalLen = isHoriz ? (line.x2 - line.x1) * CELL : (line.y2 - line.y1) * CELL}
		{@const eKey = isHoriz
			? edgeKey(Math.min(line.x1, line.x2), line.y1, 'N')
			: edgeKey(line.x1, Math.min(line.y1, line.y2), 'W')}
		{@const meta = floorWallMetaMap.get(eKey) ?? {}}
		{@const wallColor = meta.color ?? WALL_3D_COLOR}
		{@const openings = computeOpenings(meta, totalLen)}
		{@const wallGeom = createWallWithOpenings(totalLen, WALL_3D_HEIGHT, WALL_3D_THICK, openings)}

		<!-- Wall mesh with proper cutouts via ExtrudeGeometry -->
		{@const wallMat = getWallMat(wallColor)}
		{#if isHoriz}
			<T.Mesh
				position.x={line.x1 * CELL}
				position.y={yBase}
				position.z={line.y1 * CELL - WALL_3D_THICK / 2}
				geometry={wallGeom}
				material={wallMat}
				dispose={false}
			/>
		{:else}
			<T.Mesh
				position.x={line.x1 * CELL + WALL_3D_THICK / 2}
				position.y={yBase}
				position.z={line.y1 * CELL}
				rotation.y={-Math.PI / 2}
				geometry={wallGeom}
				material={wallMat}
				dispose={false}
			/>
		{/if}

		<!-- 3D Door models — only rendered on selected floor (LOD) -->
		{#if isSelected && meta.door && openings.length > 0}
			{@const op = openings[0]}
			{@const doorH = op.topY - op.bottomY}
			{@const dType = meta.door}
			{@const DOOR_THICK = 0.04}
			{@const FRAME_W = 0.05}
			{@const isOpen = !closedDoors.has(eKey)}
			{@const swingLeft = (meta.swing ?? 'left') === 'left'}
			{@const inward = (meta.openDir ?? 'inward') === 'inward'}
			{@const panelMat = dType === 'french' ? frenchDoorMat : doorPanelMat}

			{#if isHoriz}
				{@const fx = line.x1 * CELL + op.offsetAlongWall}
				{@const fz = line.y1 * CELL}
				{@const doorTarget = isOpen ? -(swingLeft ? 1 : -1) * (inward ? 1 : -1) * OPEN_ANGLE : 0}
				{@const doorAngle = animatedVal(eKey, doorTarget)}

				<!-- Door frame (static) -->
				<T.Mesh position.x={fx} position.y={yBase + op.topY + FRAME_W / 2} position.z={fz} material={doorFrameMat} dispose={false}>
					<T.BoxGeometry args={[op.width + FRAME_W * 2, FRAME_W, WALL_3D_THICK + 0.02]} />
				</T.Mesh>
				<T.Mesh position.x={fx - op.width / 2 - FRAME_W / 2} position.y={yBase + doorH / 2} position.z={fz} material={doorFrameMat} dispose={false}>
					<T.BoxGeometry args={[FRAME_W, doorH, WALL_3D_THICK + 0.02]} />
				</T.Mesh>
				<T.Mesh position.x={fx + op.width / 2 + FRAME_W / 2} position.y={yBase + doorH / 2} position.z={fz} material={doorFrameMat} dispose={false}>
					<T.BoxGeometry args={[FRAME_W, doorH, WALL_3D_THICK + 0.02]} />
				</T.Mesh>

				<!-- Invisible click target covering the door opening -->
				<T.Mesh
					position.x={fx}
					position.y={yBase + doorH / 2}
					position.z={fz}
					material={doorClickMat}
					dispose={false}
					onclick={() => toggleDoor(eKey)}
				>
					<T.BoxGeometry args={[op.width, doorH, WALL_3D_THICK]} />
				</T.Mesh>

				<!-- Door panel(s) — pivot group at hinge edge -->
				{#if dType === 'single' || dType === 'pocket' || dType === 'french'}
					{@const hingeX = swingLeft ? fx - op.width / 2 : fx + op.width / 2}
					{@const panelOff = swingLeft ? (op.width - 0.02) / 2 : -(op.width - 0.02) / 2}
					<T.Group position.x={hingeX} position.y={yBase + doorH / 2} position.z={fz} rotation.y={doorAngle}>
						<T.Mesh position.x={panelOff} material={panelMat} dispose={false}>
							<T.BoxGeometry args={[op.width - 0.02, doorH - 0.02, DOOR_THICK]} />
						</T.Mesh>
						{@const handleOff = swingLeft ? op.width - 0.1 : -(op.width - 0.1)}
						<T.Mesh position.x={handleOff} position.y={-doorH * 0.05} position.z={DOOR_THICK / 2 + 0.02} geometry={handleGeomH} material={handleMat} dispose={false} />
					</T.Group>
				{:else if dType === 'double' || dType === 'bifold'}
					{@const halfW = op.width / 2 - 0.01}
					{@const leftTarget = isOpen ? -(inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const rightTarget = isOpen ? (inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const leftAngle = animatedVal(`${eKey}-L`, leftTarget)}
					{@const rightAngle = animatedVal(`${eKey}-R`, rightTarget)}
					<T.Group position.x={fx - op.width / 2} position.y={yBase + doorH / 2} position.z={fz} rotation.y={leftAngle}>
						<T.Mesh position.x={halfW / 2} material={doorPanelMat} dispose={false}>
							<T.BoxGeometry args={[halfW, doorH - 0.02, DOOR_THICK]} />
						</T.Mesh>
						<T.Mesh position.x={halfW - 0.06} position.y={-doorH * 0.05} position.z={DOOR_THICK / 2 + 0.02} geometry={handleGeomSmallH} material={handleMat} dispose={false} />
					</T.Group>
					<T.Group position.x={fx + op.width / 2} position.y={yBase + doorH / 2} position.z={fz} rotation.y={rightAngle}>
						<T.Mesh position.x={-halfW / 2} material={doorPanelMat} dispose={false}>
							<T.BoxGeometry args={[halfW, doorH - 0.02, DOOR_THICK]} />
						</T.Mesh>
						<T.Mesh position.x={-(halfW - 0.06)} position.y={-doorH * 0.05} position.z={DOOR_THICK / 2 + 0.02} geometry={handleGeomSmallH} material={handleMat} dispose={false} />
					</T.Group>
				{:else if dType === 'sliding'}
					{@const slideTarget = isOpen ? op.width * 0.42 : 0}
					{@const slideOff = animatedVal(`${eKey}-slide`, slideTarget)}
					<T.Mesh position.x={fx - op.width * 0.13} position.y={yBase + doorH / 2} position.z={fz - DOOR_THICK / 2} material={doorBackMat} dispose={false}>
						<T.BoxGeometry args={[op.width * 0.55, doorH - 0.02, DOOR_THICK * 0.7]} />
					</T.Mesh>
					<T.Mesh position.x={fx + op.width * 0.13 - slideOff} position.y={yBase + doorH / 2} position.z={fz + DOOR_THICK / 2} material={doorPanelMat} dispose={false}>
						<T.BoxGeometry args={[op.width * 0.55, doorH - 0.02, DOOR_THICK * 0.7]} />
					</T.Mesh>
				{/if}

			{:else}
				{@const fx = line.x1 * CELL}
				{@const fz = line.y1 * CELL + op.offsetAlongWall}
				{@const doorTarget = isOpen ? (swingLeft ? 1 : -1) * (inward ? 1 : -1) * OPEN_ANGLE : 0}
				{@const doorAngle = animatedVal(eKey, doorTarget)}

				<!-- Door frame (static) -->
				<T.Mesh position.x={fx} position.y={yBase + op.topY + FRAME_W / 2} position.z={fz} material={doorFrameMat} dispose={false}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.02, FRAME_W, op.width + FRAME_W * 2]} />
				</T.Mesh>
				<T.Mesh position.x={fx} position.y={yBase + doorH / 2} position.z={fz - op.width / 2 - FRAME_W / 2} material={doorFrameMat} dispose={false}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.02, doorH, FRAME_W]} />
				</T.Mesh>
				<T.Mesh position.x={fx} position.y={yBase + doorH / 2} position.z={fz + op.width / 2 + FRAME_W / 2} material={doorFrameMat} dispose={false}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.02, doorH, FRAME_W]} />
				</T.Mesh>

				<!-- Invisible click target covering the door opening -->
				<T.Mesh
					position.x={fx}
					position.y={yBase + doorH / 2}
					position.z={fz}
					material={doorClickMat}
					dispose={false}
					onclick={() => toggleDoor(eKey)}
				>
					<T.BoxGeometry args={[WALL_3D_THICK, doorH, op.width]} />
				</T.Mesh>

				<!-- Door panel(s) — pivot group at hinge edge -->
				{#if dType === 'single' || dType === 'pocket' || dType === 'french'}
					{@const hingeZ = swingLeft ? fz - op.width / 2 : fz + op.width / 2}
					{@const panelOff = swingLeft ? (op.width - 0.02) / 2 : -(op.width - 0.02) / 2}
					<T.Group position.x={fx} position.y={yBase + doorH / 2} position.z={hingeZ} rotation.y={doorAngle}>
						<T.Mesh position.z={panelOff} material={panelMat} dispose={false}>
							<T.BoxGeometry args={[DOOR_THICK, doorH - 0.02, op.width - 0.02]} />
						</T.Mesh>
						{@const handleOff = swingLeft ? op.width - 0.1 : -(op.width - 0.1)}
						<T.Mesh position.x={DOOR_THICK / 2 + 0.02} position.y={-doorH * 0.05} position.z={handleOff} geometry={handleGeomV} material={handleMat} dispose={false} />
					</T.Group>
				{:else if dType === 'double' || dType === 'bifold'}
					{@const halfW = op.width / 2 - 0.01}
					{@const leftTarget = isOpen ? (inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const rightTarget = isOpen ? -(inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const leftAngle = animatedVal(`${eKey}-L`, leftTarget)}
					{@const rightAngle = animatedVal(`${eKey}-R`, rightTarget)}
					<T.Group position.x={fx} position.y={yBase + doorH / 2} position.z={fz - op.width / 2} rotation.y={leftAngle}>
						<T.Mesh position.z={halfW / 2} material={doorPanelMat} dispose={false}>
							<T.BoxGeometry args={[DOOR_THICK, doorH - 0.02, halfW]} />
						</T.Mesh>
						<T.Mesh position.x={DOOR_THICK / 2 + 0.02} position.y={-doorH * 0.05} position.z={halfW - 0.06} geometry={handleGeomSmallH} material={handleMat} dispose={false} />
					</T.Group>
					<T.Group position.x={fx} position.y={yBase + doorH / 2} position.z={fz + op.width / 2} rotation.y={rightAngle}>
						<T.Mesh position.z={-halfW / 2} material={doorPanelMat} dispose={false}>
							<T.BoxGeometry args={[DOOR_THICK, doorH - 0.02, halfW]} />
						</T.Mesh>
						<T.Mesh position.x={DOOR_THICK / 2 + 0.02} position.y={-doorH * 0.05} position.z={-(halfW - 0.06)} geometry={handleGeomSmallH} material={handleMat} dispose={false} />
					</T.Group>
				{:else if dType === 'sliding'}
					{@const slideTarget = isOpen ? op.width * 0.42 : 0}
					{@const slideOff = animatedVal(`${eKey}-slide`, slideTarget)}
					<T.Mesh position.x={fx - DOOR_THICK / 2} position.y={yBase + doorH / 2} position.z={fz - op.width * 0.13} material={doorBackMat} dispose={false}>
						<T.BoxGeometry args={[DOOR_THICK * 0.7, doorH - 0.02, op.width * 0.55]} />
					</T.Mesh>
					<T.Mesh position.x={fx + DOOR_THICK / 2} position.y={yBase + doorH / 2} position.z={fz + op.width * 0.13 - slideOff} material={doorPanelMat} dispose={false}>
						<T.BoxGeometry args={[DOOR_THICK * 0.7, doorH - 0.02, op.width * 0.55]} />
					</T.Mesh>
				{/if}
			{/if}
		{/if}

		<!-- 3D Window model — only rendered on selected floor (LOD) -->
		{#if isSelected && meta.window && openings.length > 0}
			{@const op = openings[0]}
			{@const glassH = op.topY - op.bottomY}
			{@const glassCenterY = yBase + (op.bottomY + op.topY) / 2}
			{@const wType = meta.window}
			{@const FRAME_T = 0.04}

			{#if isHoriz}
				{@const wx = line.x1 * CELL + op.offsetAlongWall}
				{@const wz = line.y1 * CELL}

				<!-- Window frame (4 sides) -->
				<T.Mesh position.x={wx} position.y={yBase + op.topY - FRAME_T / 2} position.z={wz} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[op.width, FRAME_T, WALL_3D_THICK * 0.8]} />
				</T.Mesh>
				<T.Mesh position.x={wx} position.y={yBase + op.bottomY + FRAME_T / 2} position.z={wz} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[op.width + 0.06, FRAME_T, WALL_3D_THICK + 0.04]} />
				</T.Mesh>
				<T.Mesh position.x={wx - op.width / 2 + FRAME_T / 2} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[FRAME_T, glassH, WALL_3D_THICK * 0.8]} />
				</T.Mesh>
				<T.Mesh position.x={wx + op.width / 2 - FRAME_T / 2} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[FRAME_T, glassH, WALL_3D_THICK * 0.8]} />
				</T.Mesh>

				<!-- Glass pane -->
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={glassMat} dispose={false}>
					<T.BoxGeometry args={[op.width - FRAME_T * 2, glassH - FRAME_T * 2, 0.01]} />
				</T.Mesh>

				<!-- Type-specific mullions -->
				{#if wType === 'fixed'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[0.02, glassH - FRAME_T * 2, 0.03]} />
					</T.Mesh>
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[op.width - FRAME_T * 2, 0.02, 0.03]} />
					</T.Mesh>
				{:else if wType === 'sliding' || wType === 'casement'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[0.025, glassH - FRAME_T * 2, 0.03]} />
					</T.Mesh>
				{:else if wType === 'awning'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[op.width - FRAME_T * 2, 0.025, 0.03]} />
					</T.Mesh>
				{/if}
			{:else}
				{@const wx = line.x1 * CELL}
				{@const wz = line.y1 * CELL + op.offsetAlongWall}

				<!-- Window frame (4 sides) - vertical wall -->
				<T.Mesh position.x={wx} position.y={yBase + op.topY - FRAME_T / 2} position.z={wz} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[WALL_3D_THICK * 0.8, FRAME_T, op.width]} />
				</T.Mesh>
				<T.Mesh position.x={wx} position.y={yBase + op.bottomY + FRAME_T / 2} position.z={wz} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.04, FRAME_T, op.width + 0.06]} />
				</T.Mesh>
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz - op.width / 2 + FRAME_T / 2} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[WALL_3D_THICK * 0.8, glassH, FRAME_T]} />
				</T.Mesh>
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz + op.width / 2 - FRAME_T / 2} material={windowFrameMat} dispose={false}>
					<T.BoxGeometry args={[WALL_3D_THICK * 0.8, glassH, FRAME_T]} />
				</T.Mesh>

				<!-- Glass pane -->
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={glassMat} dispose={false}>
					<T.BoxGeometry args={[0.01, glassH - FRAME_T * 2, op.width - FRAME_T * 2]} />
				</T.Mesh>

				<!-- Type-specific mullions -->
				{#if wType === 'fixed'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[0.03, glassH - FRAME_T * 2, 0.02]} />
					</T.Mesh>
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[0.03, 0.02, op.width - FRAME_T * 2]} />
					</T.Mesh>
				{:else if wType === 'sliding' || wType === 'casement'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[0.03, glassH - FRAME_T * 2, 0.025]} />
					</T.Mesh>
				{:else if wType === 'awning'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz} material={windowFrameMat} dispose={false}>
						<T.BoxGeometry args={[0.03, 0.025, op.width - FRAME_T * 2]} />
					</T.Mesh>
				{/if}
			{/if}
		{/if}
	{/each}

	<!-- Room floor tiles (non-wall items only) -->
	{#each floorItems.filter((i) => i.item_type !== 'WALL') as item (item.id)}
		{@const isUnit = item.item_type === 'RENTAL_UNIT'}
		{@const color = floorColor(item)}
		{@const cells = parseAreaCells(item)}
		{@const floorMat = getFloorMat(color)}

		{@const isHovered = hoveredItemId === item.id}
		{@const isSel = selectedItemId === item.id}
		{@const glowIntensity = isSel ? 0.6 + Math.sin(glowTime * 2.0) * 0.25 : (isHovered ? 0.35 + Math.sin(glowTime * 3.0) * 0.15 : 0)}

		{#if cells}
			<!-- Cell-based area: single solid shape -->
			{@const solid = buildCellSolidGeom(cells)}
			{#if solid}
				<!-- Expanded floor tile (bleeds past walls, no gap) -->
				<T.Mesh
					position.y={yBase}
					geometry={solid.expandedGeom}
					material={floorMat}
					receiveShadow
					dispose={false}
					onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
					onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
					onclick={() => {
						selectedItemId = selectedItemId === item.id ? null : item.id;
						_anyAnimating = true;
						if (isUnit && item.rental_unit_id) onUnitClick(item.rental_unit_id);
					}}
				/>

				<!-- Invisible click-target wall (taller, easier to click) -->
				{@const clickWallGeom = buildLaserWallGeom(solid.outline, WALL_3D_HEIGHT)}
				<T.Mesh
					position.y={yBase}
					geometry={clickWallGeom}
					material={areaClickMat}
					dispose={false}
					onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
					onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
					onclick={() => {
						selectedItemId = selectedItemId === item.id ? null : item.id;
						_anyAnimating = true;
						if (isUnit && item.rental_unit_id) onUnitClick(item.rental_unit_id);
					}}
				/>

				{#if isHovered || isSel}
					<!-- Glow overlay (additive shader on top of expanded floor) -->
					<T.Mesh position.y={yBase + 0.005} geometry={solid.expandedGeom} dispose={false}
						onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
						onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
						onclick={() => { selectedItemId = selectedItemId === item.id ? null : item.id; _anyAnimating = true; }}
					>
						<T.ShaderMaterial
							vertexShader={glowVertexShader}
							fragmentShader={floorGlowFragShader}
							transparent
							side={DoubleSide}
							depthWrite={false}
							blending={CustomBlending}
							blendEquation={AddEquation}
							blendSrc={OneFactor}
							blendDst={OneMinusSrcAlphaFactor}
							uniforms={{
								uColor: { value: new Color(color) },
								uTime: { value: glowTime },
								uIntensity: { value: glowIntensity },
								uSpeed: { value: isSel ? 1.5 : 2.5 }
							}}
						/>
					</T.Mesh>

					<!-- Laser edge wall -->
					{@const laserTarget = isSel ? 4.5 : (isHovered ? 0.75 : 0)}
					{@const laserBase = animatedVal(`laser-h-${item.id}`, laserTarget)}
					{@const laserBreath = isSel ? Math.sin(glowTime * 2.0) * 0.8 : (isHovered ? Math.sin(glowTime * 3.0) * 0.2 : 0)}
					{@const laserH = Math.max(0.01, laserBase + laserBreath)}
					{@const laserOpacity = Math.min(0.55, isSel ? 0.4 + Math.sin(glowTime * 2.0) * 0.1 : 0.3 + Math.sin(glowTime * 3.0) * 0.08)}
					{@const laserGeom = buildLaserWallGeom(roundOutline(solid.outline, CORNER_RADIUS), laserH)}
					<T.Mesh position.y={yBase + FLOOR_THICK} geometry={laserGeom}
						onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
						onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
						onclick={() => { selectedItemId = selectedItemId === item.id ? null : item.id; _anyAnimating = true; }}
					>
						<T.ShaderMaterial
							vertexShader={glowVertexShader}
							fragmentShader={laserFragShader}
							transparent
							side={DoubleSide}
							depthWrite={false}
							blending={CustomBlending}
							blendEquation={AddEquation}
							blendSrc={OneFactor}
							blendDst={OneMinusSrcAlphaFactor}
							uniforms={{
								uColor: { value: new Color(color) },
								uOpacity: { value: laserOpacity },
								uTime: { value: glowTime },
								uSpeed: { value: isSel ? 1.5 : 2.5 }
							}}
						/>
					</T.Mesh>
				{/if}
			{/if}
		{:else}
			<!-- Rectangle-based area (dimensions clamped to prevent oversized cubes) -->
			{@const x = item.grid_x * CELL}
			{@const z = item.grid_y * CELL}
			{@const w = clampDim(item.grid_w) * CELL}
			{@const d = clampDim(item.grid_h) * CELL}
			{@const rectOutlineBase = [[x, z], [x + w, z], [x + w, z + d], [x, z + d]] as [number, number][]}
			{@const rectOutlineOffset = offsetPoly(rectOutlineBase, 0.3)}
			<!-- Expanded floor tile (bleeds past walls) -->
			{@const pad = 0.3}
			<T.Mesh
				position.x={x + w / 2}
				position.y={yBase + FLOOR_THICK / 2}
				position.z={z + d / 2}
				receiveShadow
				material={floorMat}
				dispose={false}
				onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
				onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
				onclick={() => {
					selectedItemId = selectedItemId === item.id ? null : item.id;
					_anyAnimating = true;
					if (isUnit && item.rental_unit_id) onUnitClick(item.rental_unit_id);
				}}
			>
				<T.BoxGeometry args={[w + pad * 2, FLOOR_THICK, d + pad * 2]} />
			</T.Mesh>

			<!-- Invisible click-target wall for rectangle -->
			{@const rectClickGeom = buildLaserWallGeom(rectOutlineOffset, WALL_3D_HEIGHT)}
			<T.Mesh
				position.y={yBase}
				geometry={rectClickGeom}
				material={areaClickMat}
				dispose={false}
				onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
				onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
				onclick={() => {
					selectedItemId = selectedItemId === item.id ? null : item.id;
					_anyAnimating = true;
					if (isUnit && item.rental_unit_id) onUnitClick(item.rental_unit_id);
				}}
			/>

			{#if isHovered || isSel}
				<!-- Glow overlay for rectangle -->
				<T.Mesh position.x={x + w / 2} position.y={yBase + FLOOR_THICK / 2 + 0.005} position.z={z + d / 2}
					onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
					onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
					onclick={() => { selectedItemId = selectedItemId === item.id ? null : item.id; _anyAnimating = true; }}
				>
					<T.BoxGeometry args={[w + pad * 2, 0.01, d + pad * 2]} />
					<T.ShaderMaterial
						vertexShader={glowVertexShader}
						fragmentShader={floorGlowFragShader}
						transparent
						side={DoubleSide}
						depthWrite={false}
						blending={CustomBlending}
							blendEquation={AddEquation}
							blendSrc={OneFactor}
							blendDst={OneMinusSrcAlphaFactor}
						uniforms={{
							uColor: { value: new Color(color) },
							uTime: { value: glowTime },
							uIntensity: { value: glowIntensity },
							uSpeed: { value: isSel ? 1.5 : 2.5 }
						}}
					/>
				</T.Mesh>

				<!-- Laser edge wall for rectangle -->
				{@const rx = item.grid_x * CELL}
				{@const rz = item.grid_y * CELL}
				{@const rw = clampDim(item.grid_w) * CELL}
				{@const rd = clampDim(item.grid_h) * CELL}
				{@const rectOutline = offsetPoly([[rx, rz], [rx + rw, rz], [rx + rw, rz + rd], [rx, rz + rd]] as [number, number][], 0.3)}
				{@const laserTarget = isSel ? 4.5 : (isHovered ? 0.75 : 0)}
					{@const laserBase = animatedVal(`laser-h-${item.id}`, laserTarget)}
					{@const laserBreath = isSel ? Math.sin(glowTime * 2.0) * 0.8 : (isHovered ? Math.sin(glowTime * 3.0) * 0.2 : 0)}
					{@const laserH = Math.max(0.01, laserBase + laserBreath)}
				{@const laserOpacity = Math.min(0.55, isSel ? 0.4 + Math.sin(glowTime * 2.0) * 0.1 : 0.3 + Math.sin(glowTime * 3.0) * 0.08)}
				{@const laserGeom = buildLaserWallGeom(roundOutline(rectOutline, CORNER_RADIUS), laserH)}
				<T.Mesh position.y={yBase + FLOOR_THICK} geometry={laserGeom}
					onpointerenter={() => { hoveredItemId = item.id; _anyAnimating = true; }}
					onpointerleave={() => { if (hoveredItemId === item.id && !labelHovered) hoveredItemId = null; }}
					onclick={() => { selectedItemId = selectedItemId === item.id ? null : item.id; _anyAnimating = true; }}
				>
					<T.ShaderMaterial
						vertexShader={glowVertexShader}
						fragmentShader={laserFragShader}
						transparent
						side={DoubleSide}
						depthWrite={false}
						blending={CustomBlending}
							blendEquation={AddEquation}
							blendSrc={OneFactor}
							blendDst={OneMinusSrcAlphaFactor}
						uniforms={{
							uColor: { value: new Color(color) },
							uOpacity: { value: laserOpacity },
							uTime: { value: glowTime },
							uSpeed: { value: isSel ? 1.5 : 2.5 }
						}}
					/>
				</T.Mesh>
			{/if}
		{/if}

		<!-- Floating label -->
		{@const label = areaLabel(item)}
		{#if label}
			{@const lx = (item.grid_x + clampDim(item.grid_w) / 2) * CELL}
			{@const lz = (item.grid_y + clampDim(item.grid_h) / 2) * CELL}

			{#if isMobile}
				<!-- Sprite-based label fallback for mobile (HTML overlay unreliable) -->
				{@const spriteMat = getSpriteLabelMat(label)}
				{@const spriteAspect = (spriteMat.map?.image?.width ?? 120) / (spriteMat.map?.image?.height ?? 64)}
				<T.Sprite
					position.x={lx}
					position.y={yBase + 3.2}
					position.z={lz}
					material={spriteMat}
					scale.x={spriteAspect * 1.2}
					scale.y={1.2}
					dispose={false}
				/>
			{:else}
				<HTML position.x={lx} position.y={yBase + 3.2} position.z={lz} center pointerEvents="auto">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="flex flex-col items-center select-none cursor-pointer"
						style="pointer-events: auto;"
						role="button"
						tabindex="-1"
						onpointerenter={() => { labelHovered = true; hoveredItemId = item.id; invalidate(); }}
						onpointerleave={() => { labelHovered = false; if (hoveredItemId === item.id) { hoveredItemId = null; invalidate(); } }}
						onpointerdown={() => {
							selectedItemId = selectedItemId === item.id ? null : item.id;
							_anyAnimating = true;
							if (isUnit && item.rental_unit_id) onUnitClick(item.rental_unit_id);
							invalidate();
						}}
					>
						<!-- GPS pin shape via SVG -->
						<svg width="auto" height="64" viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg hover:drop-shadow-xl transition-all" style="min-width: max-content;">
							<!-- Pin body: rounded rectangle + pointed bottom -->
							<path d="M8 0 H112 Q120 0 120 8 V30 Q120 38 112 38 H68 L60 54 L52 38 H8 Q0 38 0 30 V8 Q0 0 8 0Z" fill="rgba(255,255,255,0.95)" />
							<!-- Label text -->
							<text x="60" y="23" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" font-family="system-ui, -apple-system, sans-serif" fill="#1e293b">{label}</text>
						</svg>

						<!-- Tenant popup (shown when selected + is rental unit) -->
						{#if isSel && isUnit && item.rental_unit_id}
							{@const tenants = unitTenantsMap.get(String(item.rental_unit_id)) ?? []}
							{@const unit = rentalUnits.find((u) => String(u.id) === String(item.rental_unit_id))}
							<div class="mt-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl px-3 py-2.5 min-w-[160px] max-w-[220px] text-left" style="pointer-events: auto;">
								{#if unit}
									<div class="flex items-center justify-between mb-1.5">
										<span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Unit Info</span>
										<span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium
											{unit.rental_unit_status === 'OCCUPIED' ? 'bg-blue-100 text-blue-700' :
											 unit.rental_unit_status === 'RESERVED' ? 'bg-amber-100 text-amber-700' :
											 'bg-green-100 text-green-700'}">
											{unit.rental_unit_status ?? 'VACANT'}
										</span>
									</div>
									<div class="text-[11px] text-slate-600 mb-1">Cap. {unit.capacity} · {unit.type}</div>
								{/if}
								{#if tenants.length > 0}
									<div class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 {unit ? 'border-t pt-1.5 mt-1' : ''}">
										Tenants ({tenants.length})
									</div>
									<div class="space-y-1">
										{#each tenants as tenant}
											<div class="flex items-center gap-1.5">
												<div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
													{tenant.name.charAt(0).toUpperCase()}
												</div>
												<span class="text-xs text-slate-800 truncate">{tenant.name}</span>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-[11px] text-slate-400 italic {unit ? 'border-t pt-1.5 mt-1' : ''}">No tenants assigned</div>
								{/if}
							</div>
						{/if}
					</div>
				</HTML>
			{/if}
		{/if}
	{/each}
{/each}
