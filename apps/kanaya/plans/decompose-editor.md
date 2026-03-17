# Decompose Page Graphics Editor Enhancement Plan

## Executive Summary

Transform the decompose page into a modular graphics editor with proper tool architecture, non-destructive editing, layer management improvements, and upload caching. Focus on lasso tool fixes first, then expand to support brush, eraser, selection tools, and fill tools.

---

## Part 1: Data Flow Architecture

### 1.1 Core Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              +page.svelte                                    │
│  (Orchestrator - minimal logic, connects managers to components)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│ LayerManager  │◄─────────►│ ToolManager   │◄─────────►│HistoryManager │
│ (Central Hub) │           │ (Tool State)  │           │ (Job Tracking)│
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        │ layers, masks,              │ activeTool,                 │ history,
        │ selections, cache           │ toolOptions                 │ polling
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  masks Map    │           │  Tool Classes │           │LocalHistory   │
│  cache Map    │           │  (individual) │           │ (new)         │
└───────────────┘           └───────────────┘           └───────────────┘
```

### 1.2 Tool Event Flow

```
User Interaction
        │
        ▼
┌───────────────────┐
│  CanvasStack      │ ◄── Composes: ImagePreview + DrawingCanvas + SelectionOverlay
└───────────────────┘
        │
        │ pointer events
        ▼
┌───────────────────┐
│  Active Tool      │ ◄── From ToolManager.activeTool
│  (e.g., LassoTool)│
└───────────────────┘
        │
        │ onComplete callback
        ▼
┌───────────────────┐
│  LayerManager     │
│  - addLayer()     │
│  - addToCache()   │
│  - addMask()      │
└───────────────────┘
        │
        │ state change
        ▼
┌───────────────────┐
│  HistoryManager   │
│  - addLocalEntry()│
└───────────────────┘
        │
        │ reactivity
        ▼
┌───────────────────┐
│  UI Updates       │
│  - Layer Panel    │
│  - History Panel  │
│  - Canvas Preview │
└───────────────────┘
```

### 1.3 Layer Data Structure (Enhanced)

```typescript
// Existing DecomposedLayer (extended)
interface DecomposedLayer {
  id: string
  name: string
  imageUrl: string           // R2 URL or cached blob URL
  thumbnailUrl?: string
  bounds: { x: number; y: number; width: number; height: number }
  zIndex: number
  side: 'front' | 'back'
  parentId?: string

  // NEW fields
  isCached?: boolean         // true if not yet uploaded to R2
  cachedBlob?: Blob          // temporary storage before upload
  layerType?: 'decomposed' | 'drawing' | 'copied' | 'filled'
}

// NEW: Mask storage
interface LayerMask {
  layerId: string
  maskData: string           // Base64 canvas data (localStorage)
  bounds: { x: number; y: number; width: number; height: number }
}

// NEW: Cache entry
interface CachedLayer {
  layerId: string
  blob: Blob
  side: 'front' | 'back'
  createdAt: Date
  uploadStatus: 'pending' | 'uploading' | 'failed'
  retryCount: number
}
```

### 1.4 Selection Flow

```
Selection Tool Activated (Lasso/Rect/Ellipse)
        │
        ▼
┌───────────────────┐
│ Collect Points    │ ◄── Pointer events → normalized coords (0-1)
└───────────────────┘
        │
        │ selection closed
        ▼
┌───────────────────┐
│ SelectionActions  │ ◄── Popover component
│ - Copy to Layer   │
│ - Fill Selection  │
│ - Delete Selection│
└───────────────────┘
        │
        │ user action
        ▼
┌───────────────────────────────────────────────────────────────┐
│ Action Handler (in LayerManager or ImageProcessor)            │
│                                                               │
│ Copy:   clip source → create blob → cache → add layer        │
│ Fill:   create filled canvas → cache → add layer             │
│ Delete: apply to mask (non-destructive)                       │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────┐
│ Selection Stays   │ ◄── User can perform more actions
│ Active            │
└───────────────────┘
```

### 1.5 Cache & Upload Flow

```
Layer Created (any tool)
        │
        ▼
┌───────────────────┐
│ LayerManager      │
│ .addToCache()     │ ◄── Stores blob in cache Map
└───────────────────┘
        │
        │ triggers
        ▼
┌───────────────────┐
│ Save Indicator    │ ◄── Shows "Local" or "Syncing..."
│ (separate from    │
│  "Saved" state)   │
└───────────────────┘
        │
        │ on user action (save/leave) or timer
        ▼
┌───────────────────┐
│ Upload Queue      │ ◄── Sequential upload to R2
│ .processQueue()   │
└───────────────────┘
        │
        ├── Success: Update layer.imageUrl, remove from cache
        │
        └── Failure: Show toast, keep in cache, increment retryCount
```

### 1.6 Mask Application Flow

```
Eraser Tool Active
        │
        ▼
┌───────────────────┐
│ DrawingCanvas     │ ◄── Dedicated canvas for eraser strokes
└───────────────────┘
        │
        │ pointer up (stroke complete)
        ▼
┌───────────────────┐
│ MaskManager       │
│ .updateMask()     │ ◄── Merge stroke into layer's mask
└───────────────────┘
        │
        │ mask updated
        ▼
┌───────────────────┐
│ Layer Preview     │ ◄── CSS mask-image or canvas compositing
│ (real-time)       │
└───────────────────┘
        │
        │ on session save
        ▼
┌───────────────────┐
│ localStorage      │ ◄── Masks stored as base64 per layer
└───────────────────┘
```

---

## Part 2: Architecture Explanation

### 2.1 Manager Responsibilities

| Manager | Responsibility | State Owned |
|---------|---------------|-------------|
| **LayerManager** | Central hub for all layer operations, cache, masks | `frontLayers`, `backLayers`, `selections`, `cache`, `masks`, `opacity` |
| **ToolManager** | Tool switching, tool options, cursor state | `activeTool`, `toolOptions`, `previousTool` |
| **HistoryManager** | AI job polling, local action history | `history`, `localHistory`, `pollingJobs` |
| **ImageProcessor** | Canvas operations, clipping, uploading | (stateless, uses LayerManager) |

### 2.2 Tool Architecture

Each tool implements the `CanvasTool` interface:

```typescript
interface CanvasTool {
  readonly name: string
  readonly cursor: string
  readonly requiresLayer: boolean  // Does tool need a selected layer?

  onActivate(ctx: ToolContext): void
  onDeactivate(): void
  onPointerDown(e: PointerEvent, ctx: ToolContext): void
  onPointerMove(e: PointerEvent, ctx: ToolContext): void
  onPointerUp(e: PointerEvent, ctx: ToolContext): void
  onKeyDown?(e: KeyboardEvent): void

  // For tools with visual overlays (lasso, selections)
  renderOverlay?(ctx: CanvasRenderingContext2D): void
}

interface ToolContext {
  canvasRect: DOMRect
  selectedLayerId: string | null
  layerManager: LayerManager
  imageProcessor: ImageProcessor
  color: string
  size: number
  opacity: number
}
```

### 2.3 Component Hierarchy

```
+page.svelte
├── DecomposeHeader
│   └── Side tabs, Save/Reset buttons
│
├── Main Content Area
│   ├── CanvasStack.svelte (NEW)
│   │   ├── ImagePreview.svelte (background + layers)
│   │   ├── DrawingCanvas.svelte (NEW - brush/eraser strokes)
│   │   └── SelectionOverlay.svelte (NEW - lasso/rect/ellipse)
│   │
│   ├── SelectionActions.svelte (NEW - popover for selection tools)
│   │
│   └── Toolbar Area
│       ├── ToolSelector.svelte (NEW - tool buttons)
│       └── ToolOptions.svelte (NEW - size/opacity/color)
│
└── Right Sidebar
    ├── Layers Panel
    │   ├── LayerCard.svelte (existing, extended)
    │   └── LayerActions.svelte (NEW - dropdown actions)
    │
    └── History Panel
        └── HistoryItem.svelte (existing, extended)
```

### 2.4 Layer Panel Order Change

**Current (top-to-bottom):**
```
Layer 3 (top)     ← index 2, shown first
Layer 2           ← index 1
Layer 1           ← index 0
Background        ← special, always visible
```

**New (bottom-to-top):**
```
Background        ← special, locked at bottom, can't delete
Layer 1           ← index 0
Layer 2           ← index 1
Layer 3 (top)     ← index 2, shown last
```

Implementation: Reverse the `#each` iteration and adjust move up/down logic.

### 2.5 Thumbnail Transparency

For layers with transparent backgrounds, show checkerboard pattern:

```css
.layer-thumbnail-container {
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}
```

---

## Part 3: Implementation Phases

### Phase 1: Foundation & Lasso Fix (Priority: HIGH)

**Goal:** Fix lasso tool, add transparency indicators, fix layer ordering

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/logic/tools/BaseTool.ts` | CREATE | Tool interface definition |
| `src/lib/logic/tools/LassoTool.svelte.ts` | CREATE | Extract lasso logic from ImagePreview |
| `src/lib/logic/LayerManager.svelte.ts` | MODIFY | Add `masks` Map, layer ordering fix |
| `src/routes/.../components/LayerCard.svelte` | MODIFY | Add checkerboard thumbnail background |
| `src/routes/.../components/SelectionActions.svelte` | CREATE | Unified selection popover |

**Tasks:**
1. Create `BaseTool.ts` with `CanvasTool` interface
2. Extract lasso logic into `LassoTool.svelte.ts`
3. Fix layer ordering (reverse display, update move logic)
4. Add checkerboard CSS to thumbnail containers
5. Create `SelectionActions.svelte` with Copy/Fill/Delete buttons
6. Ensure lasso-created layers show transparency properly
7. Add "COPY" tag to history for lasso operations

**Acceptance Criteria:**
- Lasso creates layers with visible transparency on canvas
- Thumbnails show checkerboard behind transparent areas
- Layer panel shows BG at bottom, top layers at top
- History shows "COPY" badge for lasso operations

---

### Phase 2: Tool Architecture & Manager Setup (Priority: HIGH)

**Goal:** Establish tool system architecture for future tools

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/logic/LayerManager.svelte.ts` | MODIFY | Add `activeTool`, `toolOptions`, cache methods |
| `src/routes/.../components/ToolSelector.svelte` | CREATE | Tool button grid |
| `src/routes/.../components/ToolOptions.svelte` | CREATE | Size/opacity/color controls |
| `src/routes/.../components/CanvasStack.svelte` | CREATE | Layer composition container |
| `src/lib/logic/tools/index.ts` | CREATE | Tool registry and factory |

**Tasks:**
1. Add tool state to LayerManager (`activeTool`, `toolOptions`, `previousTool`)
2. Create `ToolSelector.svelte` with tool button grid
3. Create `ToolOptions.svelte` with dynamic options based on active tool
4. Create `CanvasStack.svelte` to compose canvas layers
5. Create tool registry for instantiating tools
6. Implement keyboard shortcuts (B=brush, E=eraser, L=lasso, etc.)
7. Implement cursor changes per tool

**Acceptance Criteria:**
- Tools can be switched via toolbar and keyboard
- Tool options panel shows relevant controls
- Cursor changes based on active tool
- Tool state persists in session

---

### Phase 3: Selection Tools (Priority: MEDIUM)

**Goal:** Add rectangle and ellipse selection tools

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/logic/tools/RectangleTool.svelte.ts` | CREATE | Rectangle selection |
| `src/lib/logic/tools/EllipseTool.svelte.ts` | CREATE | Ellipse selection |
| `src/routes/.../components/SelectionOverlay.svelte` | CREATE | Render all selection types |
| `src/lib/logic/LayerManager.svelte.ts` | MODIFY | Add `currentSelection` state |

**Tasks:**
1. Create `RectangleTool.svelte.ts` with click-drag selection
2. Create `EllipseTool.svelte.ts` with click-drag selection
3. Create `SelectionOverlay.svelte` for unified selection rendering
4. Add selection state to LayerManager
5. Integrate with `SelectionActions.svelte` popover
6. Add marching ants animation for all selection types
7. Implement Shift+drag for constrained proportions

**Acceptance Criteria:**
- Rectangle and ellipse selections work with click-drag
- All selections show marching ants
- Popover appears with Copy/Fill/Delete options
- Shift constrains to square/circle

---

### Phase 4: Layer Actions (Priority: MEDIUM)

**Goal:** Add duplicate layer, improve layer actions

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/routes/.../components/LayerActions.svelte` | CREATE | Dropdown with all actions |
| `src/lib/logic/LayerManager.svelte.ts` | MODIFY | Add `duplicateLayer()` method |
| `src/routes/.../components/LayerCard.svelte` | MODIFY | Use LayerActions component |

**Tasks:**
1. Create `LayerActions.svelte` dropdown component
2. Implement `duplicateLayer()` in LayerManager
3. Handle duplicate naming: "Name (Copy)", "Name (Copy 2)", etc.
4. Add Ctrl+D keyboard shortcut
5. Implement drag-and-drop reordering (HTML5 native)
6. Add drop indicator line between layers
7. Add confirmation dialogs for delete/clear actions

**Acceptance Criteria:**
- Duplicate creates layer with "(Copy)" suffix
- Subsequent duplicates increment: "(Copy 2)", "(Copy 3)"
- Drag-and-drop reordering works with visual feedback
- Delete shows confirmation dialog

---

### Phase 5: Drawing Canvas & Brush Tool (Priority: MEDIUM)

**Goal:** Implement brush tool with new drawing layer

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/logic/tools/BrushTool.svelte.ts` | CREATE | Brush implementation |
| `src/routes/.../components/DrawingCanvas.svelte` | CREATE | Canvas for drawing |
| `src/lib/logic/LayerManager.svelte.ts` | MODIFY | Add drawing layer creation |

**Tasks:**
1. Create `DrawingCanvas.svelte` positioned over ImagePreview
2. Implement `BrushTool.svelte.ts` with pointer event handling
3. Auto-create "Drawing Layer" when brush starts on no layer
4. Draw directly to canvas, snapshot on pointer up
5. Auto-size layer bounds to drawn content bounding box
6. Implement brush size (+/- keyboard, slider in options)
7. Implement brush opacity slider
8. Add to history as "DRAW" action

**Acceptance Criteria:**
- Brush creates strokes on dedicated drawing layer
- Stroke batched as single history entry on mouse up
- Brush size/opacity adjustable via toolbar and keyboard
- Drawing layer auto-sized to content

---

### Phase 6: Eraser & Mask System (Priority: MEDIUM)

**Goal:** Non-destructive eraser with mask system

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/logic/tools/EraserTool.svelte.ts` | CREATE | Eraser implementation |
| `src/lib/logic/LayerManager.svelte.ts` | MODIFY | Add mask management |
| `src/lib/utils/decomposeSession.ts` | MODIFY | Add mask persistence |

**Tasks:**
1. Add `masks: Map<string, LayerMask>` to LayerManager
2. Implement `EraserTool.svelte.ts` with stroke collection
3. On pointer up, merge stroke into layer's mask
4. Apply masks to layer preview via CSS `mask-image` or canvas compositing
5. Store masks in localStorage as base64
6. Add eraser size controls (shared with brush)
7. Add to history as "ERASE" action

**Acceptance Criteria:**
- Eraser creates transparent areas without modifying source image
- Masks persist across page reloads (localStorage)
- Erased areas show through to layers below
- Original layer can be restored by clearing mask

---

### Phase 7: Fill Tools (Priority: LOW)

**Goal:** Bucket fill and gradient tools

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/logic/tools/BucketTool.svelte.ts` | CREATE | Flood fill implementation |
| `src/lib/logic/tools/GradientTool.svelte.ts` | CREATE | Gradient fill |
| `src/lib/logic/ImageProcessor.svelte.ts` | MODIFY | Add flood fill algorithm |

**Tasks:**
1. Implement `BucketTool.svelte.ts` with click-to-fill
2. Add flood fill algorithm to ImageProcessor (with tolerance)
3. Implement tolerance slider in tool options
4. Fill works on: contiguous area OR current selection
5. Implement `GradientTool.svelte.ts` with click-drag direction
6. Simple two-color gradient (current color → transparent)
7. Add to history as "FILL" / "GRADIENT" actions

**Acceptance Criteria:**
- Bucket fill respects tolerance setting
- Fill works within selection if active
- Gradient follows drag direction
- Both create new layers with results

---

### Phase 8: Cache & Upload System (Priority: MEDIUM)

**Goal:** Implement upload caching with batch upload

**Files to Create/Modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/logic/LayerManager.svelte.ts` | MODIFY | Add cache management |
| `src/routes/.../+page.svelte` | MODIFY | Add sync indicator, beforeunload warning |

**Tasks:**
1. Add `cache: Map<string, CachedLayer>` to LayerManager
2. Implement `addToCache()` for new layer blobs
3. Implement `processUploadQueue()` for sequential upload
4. Add "Local" / "Syncing..." / "Synced" indicator (separate from save state)
5. Add `beforeunload` warning if cache has pending uploads
6. Handle upload failures: toast + keep in cache
7. Implement retry logic with backoff

**Acceptance Criteria:**
- New layers cache locally before upload
- Sequential upload to R2 on save or timer
- Warning before leaving with pending uploads
- Failed uploads show error and can retry

---

### Phase 9: Polish & UX (Priority: LOW)

**Goal:** Tooltips, keyboard shortcuts, touch support

**Files to Modify:**

| File | Action | Purpose |
|------|--------|---------|
| Various components | MODIFY | Add tooltips, shortcuts, touch events |

**Tasks:**
1. Add tooltips to all tools showing name + shortcut
2. Implement all keyboard shortcuts:
   - `B` = Brush, `E` = Eraser, `L` = Lasso
   - `M` = Rectangle, `O` = Ellipse (or similar)
   - `G` = Gradient, `K` = Bucket
   - `Delete` = Delete layer
   - `Ctrl+D` = Duplicate
   - `Shift+[` / `Shift+]` = Move layer down/up
   - `+` / `-` = Brush size
3. Add touch event support for drawing tools
4. Add pinch-to-zoom on canvas (if feasible)
5. Add canvas memory warning when approaching limits
6. Ensure confirmation dialogs for destructive actions

**Acceptance Criteria:**
- All tools have tooltips with shortcuts
- Keyboard shortcuts work globally
- Basic touch drawing works on tablets
- Memory warning appears before hitting limits

---

### Phase 10: Testing (Priority: MEDIUM)

**Goal:** Unit tests for core logic

**Files to Create:**

| File | Purpose |
|------|---------|
| `tests/unit/LayerManager.test.ts` | Layer operations tests |
| `tests/unit/tools/*.test.ts` | Individual tool tests |
| `tests/unit/ImageProcessor.test.ts` | Canvas operations tests |

**Tasks:**
1. Test LayerManager: add, remove, duplicate, reorder, masks
2. Test each tool: activation, event handling, completion
3. Test ImageProcessor: clipping, flood fill, gradient
4. Test cache: add, upload, failure handling
5. Test session persistence: save, load, masks

---

## Part 4: File Structure Summary

```
src/lib/logic/
├── LayerManager.svelte.ts        # MODIFY - add masks, cache, tool state
├── HistoryManager.svelte.ts      # MODIFY - add local history entries
├── ImageProcessor.svelte.ts      # MODIFY - add flood fill, gradient
└── tools/
    ├── BaseTool.ts               # NEW - interface definition
    ├── index.ts                  # NEW - tool registry
    ├── LassoTool.svelte.ts       # NEW - extracted from ImagePreview
    ├── BrushTool.svelte.ts       # NEW
    ├── EraserTool.svelte.ts      # NEW
    ├── RectangleTool.svelte.ts   # NEW
    ├── EllipseTool.svelte.ts     # NEW
    ├── BucketTool.svelte.ts      # NEW
    └── GradientTool.svelte.ts    # NEW

src/routes/(shell)/admin/template-assets/decompose/
├── +page.svelte                  # MODIFY - use new components
└── components/
    ├── ImagePreview.svelte       # MODIFY - simplify, delegate to tools
    ├── CanvasToolbar.svelte      # REMOVE - split into below
    ├── ToolSelector.svelte       # NEW - tool buttons
    ├── ToolOptions.svelte        # NEW - size/opacity/color
    ├── CanvasStack.svelte        # NEW - layer composition
    ├── DrawingCanvas.svelte      # NEW - brush/eraser canvas
    ├── SelectionOverlay.svelte   # NEW - selection rendering
    ├── SelectionActions.svelte   # NEW - copy/fill/delete popover
    ├── LayerCard.svelte          # MODIFY - checkerboard, purple border
    ├── LayerActions.svelte       # NEW - dropdown actions
    └── HistoryItem.svelte        # MODIFY - add local action tags

src/lib/utils/
└── decomposeSession.ts           # MODIFY - add mask persistence

src/lib/schemas/
└── decompose.schema.ts           # MODIFY - add LayerMask, CachedLayer types

tests/unit/
├── LayerManager.test.ts          # NEW
├── ImageProcessor.test.ts        # NEW
└── tools/
    └── *.test.ts                 # NEW - per tool
```

---

## Part 5: Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Canvas memory limits | Add layer count warning, suggest flattening |
| Large mask data in localStorage | Compress masks, limit history depth |
| Upload failures | Retry with backoff, keep in cache, user notification |
| Tool state conflicts | Cancel current action on tool switch |
| Touch event complexity | Start with basic support, iterate |
| Performance with many layers | Lazy thumbnail loading, virtualized list if needed |

---

## Part 6: Success Metrics

1. **Lasso Fix**: Layers show transparency, thumbnails have checkerboard
2. **Layer Ordering**: BG at bottom, intuitive top-to-bottom visual stacking
3. **Tool Architecture**: Adding new tool requires only new tool file + registry entry
4. **Non-Destructive Editing**: Eraser masks can be cleared to restore original
5. **Cache System**: No data loss on browser close (warning + localStorage)
6. **User Experience**: Non-technical users can draw, erase, select, fill intuitively
