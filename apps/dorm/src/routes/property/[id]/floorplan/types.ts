export type FloorLayoutItemType =
	| 'RENTAL_UNIT'
	| 'CORRIDOR'
	| 'BATHROOM'
	| 'KITCHEN'
	| 'COMMON_ROOM'
	| 'STAIRWELL'
	| 'ELEVATOR'
	| 'STORAGE'
	| 'OFFICE'
	| 'CUSTOM'
	| 'WALL'
	| 'DOOR'
	| 'WINDOW';

export interface FloorLayoutItem {
	id: string;
	floor_id: string;
	rental_unit_id: string | null;
	item_type: FloorLayoutItemType;
	grid_x: number;
	grid_y: number;
	grid_w: number;
	grid_h: number;
	label: string | null;
	color: string | null;
	created_at: string | null;
	updated_at: string | null;
	deleted_at: string | null;
}

export interface GridRect {
	grid_x: number;
	grid_y: number;
	grid_w: number;
	grid_h: number;
	id?: string;
}

export interface DragState {
	ghost: { x: number; y: number; w: number; h: number } | null;
	isOverlap: boolean;
	sourceUnit?: any;
	sourceItem?: FloorLayoutItem;
}

export const ITEM_TYPE_LABELS: Record<string, string> = {
	RENTAL_UNIT: '',
	CORRIDOR: 'Corridor',
	BATHROOM: 'Bathroom',
	KITCHEN: 'Kitchen',
	COMMON_ROOM: 'Common Room',
	STAIRWELL: 'Stairs',
	ELEVATOR: 'Elevator',
	STORAGE: 'Storage',
	OFFICE: 'Office',
	CUSTOM: 'Custom',
	WALL: 'Wall',
	DOOR: 'Door',
	WINDOW: 'Window'
};

export const ITEM_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
	RENTAL_UNIT: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
	CORRIDOR: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600' },
	BATHROOM: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800' },
	KITCHEN: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' },
	COMMON_ROOM: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
	STAIRWELL: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
	ELEVATOR: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
	STORAGE: { bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-700' },
	OFFICE: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
	CUSTOM: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
	WALL: { bg: 'bg-slate-500', border: 'border-slate-700', text: 'text-white' },
	DOOR: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
	WINDOW: { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' }
};

export const PAINT_TYPES: { value: FloorLayoutItemType; label: string }[] = [
	{ value: 'CORRIDOR', label: 'Corridor' },
	{ value: 'BATHROOM', label: 'Bathroom' },
	{ value: 'KITCHEN', label: 'Kitchen' },
	{ value: 'COMMON_ROOM', label: 'Common Room' },
	{ value: 'STAIRWELL', label: 'Stairwell' },
	{ value: 'ELEVATOR', label: 'Elevator' },
	{ value: 'STORAGE', label: 'Storage' },
	{ value: 'OFFICE', label: 'Office' },
	{ value: 'CUSTOM', label: 'Custom' }
];

// ─── Draw tool type (shared across FloorGrid, ItemSidebar, +page) ──────────

export type DrawTool = 'draw' | 'erase' | 'select' | 'door' | 'window';

// ─── Wall-first editor types ───────────────────────────────────────────────

export type EditorMode = 'wall' | 'assign';

export interface GridIntersection {
	x: number;
	y: number;
}

export interface WallDrawState {
	start: GridIntersection;
	lockedAxis: 'H' | 'V' | null;
}

export interface RoomAssignmentTarget {
	roomId: string;
	cells: { q: number; r: number }[];
	bounds: { minQ: number; minR: number; maxQ: number; maxR: number };
	anchorPx: { x: number; y: number };
}

/** Room types available for assignment (excludes WALL) */
export const ROOM_TYPES: { value: FloorLayoutItemType; label: string }[] = [
	{ value: 'RENTAL_UNIT', label: 'Rental Unit' },
	{ value: 'CORRIDOR', label: 'Corridor' },
	{ value: 'BATHROOM', label: 'Bathroom' },
	{ value: 'KITCHEN', label: 'Kitchen' },
	{ value: 'COMMON_ROOM', label: 'Common Room' },
	{ value: 'STAIRWELL', label: 'Stairwell' },
	{ value: 'ELEVATOR', label: 'Elevator' },
	{ value: 'STORAGE', label: 'Storage' },
	{ value: 'OFFICE', label: 'Office' },
	{ value: 'CUSTOM', label: 'Custom' }
];

/** Fill colors for detected rooms by assignment type */
export const ROOM_FILL_COLORS: Record<string, string> = {
	RENTAL_UNIT: '#93c5fd',  // blue-300
	CORRIDOR: '#d1d5db',     // gray-300
	BATHROOM: '#67e8f9',     // cyan-300
	KITCHEN: '#fdba74',      // orange-300
	COMMON_ROOM: '#c4b5fd',  // violet-300
	STAIRWELL: '#fde047',    // yellow-300
	ELEVATOR: '#fde047',
	STORAGE: '#d6d3d1',      // stone-300
	OFFICE: '#86efac',       // green-300
	CUSTOM: '#cbd5e1',       // slate-300
	_unassigned: '#e5e7eb'   // gray-200
};
