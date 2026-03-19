# 3D Property Viewer — Design & Implementation Plan

## Overview

A lightweight, grid-based 3D property viewer for the dorm app. "Sims-style" — visually functional, not aesthetic. Admin-only tool for mapping out properties, floors, rental units, and furniture spatially.

## Two-Level Grid System

### Level 1: Floor View (Building Layout)
- Coarse grid per floor
- Place rental units as rectangles
- Add common areas (hallways, bathrooms, kitchens, stairs, etc.)
- Grid auto-expands as items are placed (no upfront dimension config)
- Toggle between 2D editor and 3D stacked view

### Level 2: Unit Interior (Furniture Layout)
- Sub-grid inside each rental unit (1 cell ≈ 0.5m)
- Place furniture: beds, cabinets, desks, fixtures
- 90° rotation for furniture items
- Beds link to tenant/lease assignments

---

## Data Model

### Table: `floor_layout_items`
Rooms and common areas on the floor grid.

| Field | Type | Notes |
|-------|------|-------|
| `id` | serial PK | |
| `floor_id` | integer NOT NULL | → floors.id |
| `rental_unit_id` | integer NULL | → rental_unit.id (null = common area) |
| `item_type` | enum | RENTAL_UNIT, CORRIDOR, BATHROOM, KITCHEN, COMMON_ROOM, STAIRWELL, ELEVATOR, STORAGE, OFFICE, CUSTOM |
| `grid_x` | integer NOT NULL | Column position |
| `grid_y` | integer NOT NULL | Row position |
| `grid_w` | integer NOT NULL DEFAULT 2 | Width in cells |
| `grid_h` | integer NOT NULL DEFAULT 2 | Height in cells |
| `label` | text NULL | Custom label override |
| `color` | text NULL | Hex color override |
| `created_at` | timestamp | DEFAULT now() |
| `updated_at` | timestamp | DEFAULT now() |
| `deleted_at` | timestamp NULL | Soft delete |

### Table: `unit_layout_items`
Furniture and fixtures inside rental units.

| Field | Type | Notes |
|-------|------|-------|
| `id` | serial PK | |
| `rental_unit_id` | integer NOT NULL | → rental_unit.id |
| `floor_layout_id` | integer NULL | → floor_layout_items.id (parent context) |
| `item_type` | enum | BED_SINGLE, BED_DOUBLE_DECK, CABINET, DESK, CHAIR, SHELF, AC_UNIT, MINI_FRIDGE, TOILET, SHOWER, SINK, KITCHEN_COUNTER, WASHING_MACHINE, DINING_TABLE, SOFA, TV, DOOR, WINDOW, STAIRCASE, CUSTOM |
| `grid_x` | integer NOT NULL | Position within unit sub-grid |
| `grid_y` | integer NOT NULL | |
| `grid_w` | integer NOT NULL DEFAULT 1 | Width in cells |
| `grid_h` | integer NOT NULL DEFAULT 1 | Height in cells |
| `rotation` | integer NOT NULL DEFAULT 0 | 0, 90, 180, 270 |
| `label` | text NULL | Custom label |
| `metadata` | jsonb NULL | bed_number, condition, brand, etc. |
| `created_at` | timestamp | DEFAULT now() |
| `updated_at` | timestamp | DEFAULT now() |
| `deleted_at` | timestamp NULL | Soft delete |

### Enums

```sql
floor_layout_item_type: RENTAL_UNIT, CORRIDOR, BATHROOM, KITCHEN, COMMON_ROOM, STAIRWELL, ELEVATOR, STORAGE, OFFICE, CUSTOM

unit_layout_item_type: BED_SINGLE, BED_DOUBLE_DECK, CABINET, DESK, CHAIR, SHELF, AC_UNIT, MINI_FRIDGE, TOILET, SHOWER, SINK, KITCHEN_COUNTER, WASHING_MACHINE, DINING_TABLE, SOFA, TV, DOOR, WINDOW, STAIRCASE, CUSTOM
```

---

## Furniture Reference

### Bedroom Furniture

| Item | Grid Size (cells) | Notes |
|------|-------------------|-------|
| Single Bed | 2×4 | 1 tenant slot |
| Double Deck / Bunk | 2×4, taller in 3D | 2 tenant slots (top/bottom) |
| Cabinet/Wardrobe | 2×1 | |
| Desk | 2×1 | |
| Chair | 1×1 | |
| Shelf | 2×1 | |
| AC Unit | 2×1 (wall) | |
| Mini Fridge | 1×1 | |

### Fixed Fixtures

| Item | Grid Size | Notes |
|------|-----------|-------|
| Toilet | 1×2 | |
| Shower | 2×2 | |
| Sink | 1×1 | |
| Kitchen Counter | Variable×1 | Draw like corridor |
| Washing Machine | 2×2 | |
| Door | 1×1 | Entry marker |
| Window | 1×1 | Wall marker |

### Shared Area Items

| Item | Grid Size | Notes |
|------|-----------|-------|
| Dining Table | 3×2 | |
| Sofa | 3×1 | |
| TV | 2×1 (wall) | |
| Staircase | 3×4 | |

---

## Onboarding UX (Game-Style)

### Step 0: Auto-Setup
- No upfront config — grid auto-calculated from existing unit count
- Formula: units × avg size + corridor padding
- Grid auto-expands when dragging near edges

### Step 1: Place Your Rooms
- Left sidebar: unplaced units (from RxDB)
- Drag units onto grid, snap-to-grid
- Auto-size by capacity: 1-2 → 2×2, 3-4 → 3×2, 5+ → 4×3
- Progress counter: "4 of 12 placed"
- Visual feedback: green glow on valid snap, red on overlap

### Step 2: Add Common Areas (Optional)
- Tool palette: Corridor, Bathroom, Kitchen, Common Room, Stairwell, Elevator, Storage, Office, Custom
- Click-drag to paint areas on grid
- Skip-able — 3D view works with just units

### Step 3: View in 3D
- Toggle button on same page (not separate route)
- Instant stacked floor view

### Editing (Same as Onboarding)
- Click to select → resize handles
- Drag to move
- Delete → item returns to "unplaced" sidebar
- New units in system auto-appear in sidebar
- Auto-save (optimistic write to RxDB)
- Undo: Ctrl+Z, 20-step history

---

## Overlay Modes (Toggle)

| Mode | Visualization | Use Case |
|------|--------------|----------|
| Occupancy | Green=vacant, Red=occupied, Yellow=reserved, Gray=maintenance | Availability |
| Tenant | Unit label + tenant name(s) | "Who's in 305?" |
| Billing | Heatmap by outstanding balance | Debt overview |
| Meters | Icons showing meter type per unit | Sub-meter tracking |

---

## Tech Stack

- **2D Grid Editor**: DOM-based grid with Tailwind (simpler to build, style with existing design system)
- **3D Viewer**: Threlte (Three.js + Svelte, reactive with $state/$derived)
- **State**: RxDB collections for layout items, reactive stores
- **Auto-save**: Optimistic writes, no save button

---

## Route Structure

```
/property/[id]/floorplan          — Floor plan editor + 3D viewer
```

Or tab within existing property detail page (TBD).

---

## Build Phases

### Phase 1 — Floor Grid MVP
1. Drizzle migration: `floor_layout_items` table + `floor_layout_item_type` enum
2. RxDB schema + replication for `floor_layout_items` collection
3. 2D grid editor component:
   - Grid rendering (DOM cells)
   - Sidebar with unplaced units
   - Drag-and-drop placement with snap
   - Resize handles
   - Overlap detection
   - Tool palette for common areas (corridor, bathroom, etc.)
   - Auto-save to RxDB
4. Basic 3D stacked view with Threlte:
   - Floor slabs at stacked heights
   - Units as colored extruded rectangles
   - Orbit controls (rotate, zoom, pan)
   - Click unit → info popup
5. Floor navigation (switch between floors)

### Phase 2 — Unit Interiors
6. Drizzle migration: `unit_layout_items` table + `unit_layout_item_type` enum
7. RxDB schema + replication for `unit_layout_items` collection
8. Unit interior sub-grid editor:
   - Zoom-in view when clicking a unit
   - Furniture palette sidebar
   - Drag-and-drop with snap
   - 90° rotation (R key or button)
   - Breadcrumb navigation: Property > Floor > Unit
9. 3D interior view:
   - Furniture as simple colored 3D blocks
   - Double deck beds taller than single beds
   - Camera inside unit

### Phase 3 — Smart Features
10. Bed ↔ tenant/lease linking (metadata.bed_number → lease assignment)
11. Overlay modes (occupancy, billing, meters)
12. Clone floor layout (copy one floor's grid to another)
13. Bulk furniture placement ("add 4 single beds to this unit")
14. Auto-layout suggestions

---

## Grid Specifications

### Floor Grid
- Cell size: abstract (no real-world unit mapping for MVP)
- Default starting grid: auto-calculated from unit count
- Auto-expand on edge proximity
- No max limit (practical limit ~100×100)

### Unit Interior Sub-Grid
- Cell size: ~0.5m equivalent
- Grid dimensions derived from unit's grid_w × grid_h on floor (scaled up)
- Example: unit is 3×2 on floor grid → interior is 6×4 sub-grid cells (at 2x multiplier)
- Multiplier configurable per property if needed

---

## Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rotation for rooms | No (swap w/h instead) | Simpler, same result |
| Rotation for furniture | Yes, 90° increments | Beds against different walls |
| Curved walls | No | Dorms are rectangular, complexity not justified |
| L-shaped rooms | Phase 2+ (use 2 rectangles) | Rare, can approximate |
| Custom wall drawing | No | Overkill for dorm management |
| Grid cell real-world size | Abstract for floor, ~0.5m for unit interior | Avoids "how big is my building" question |
| Canvas vs DOM for editor | DOM grid with Tailwind | Easier to build, style, accessible |
| 3D library | Threlte (Three.js + Svelte) | Reactive, Svelte-native |
| Furniture storage | Separate table (unit_layout_items) | Clean separation from floor layout |
| Auto-save | Yes, optimistic RxDB writes | Game-like feel, no save button |
