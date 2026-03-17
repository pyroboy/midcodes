# Spec-17-Aug20-ALL-IDS-TABLE-CARD-TOGGLE-VIEW

## Technical Specification: All-IDs Route Dual-View System

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Medium (6/10)  
**Scope:** UI/UX Enhancement with State Management

---

## Step 1 – Requirement Extraction

### Core Requirements

- **Transform table-based ID display into dual-view system** with table/card toggle in `/all-ids/` route
- **Implement view switcher component** allowing users to toggle between table and card layouts
- **Preserve user preference** for view mode using local storage or session state
- **Improve UI aesthetics** with modern card design while maintaining table functionality
- **Maintain data integrity** across both view modes
- **Preserve all functionality** - filtering, sorting, and navigation in both views
- **Implement responsive design** - intelligent defaults (cards on mobile, table on desktop)
- **Keep bite-sized scope** - focus only on UI transformation and view switching

---

## Step 2 – Context Awareness

### Technology Stack

- **Svelte 5 + SvelteKit + Supabase** architecture
- **shadcn-svelte** UI components for design consistency
- **TailwindCSS 4.x** utility-first styling
- **Svelte stores** for state management
- **Existing auth/role system** - both views respect same access controls

### Current Implementation

- Route: `src/routes/all-ids/+page.svelte` with tabular data display
- **Supabase queries** remain unchanged - presentation layer only
- Organization-scoped data access already implemented

---

## Step 3 – Spec Expansion

### Data Flow Architecture

```
Supabase Query → Page Load → View Mode Store → Conditional Render
                                    ↓
                            [Table View | Card View]
                                    ↓
                            localStorage Persistence
```

### State Management Design

- **New Store**: `viewModeStore.ts`
  - Type: `'table' | 'card'`
  - Persistence: localStorage with fallback
  - Reactive updates across components

### Component Architecture

```
+page.svelte
├── ViewModeToggle.svelte (new)
├── {#if viewMode === 'table'}
│   └── Enhanced Table (existing)
└── {#if viewMode === 'card'}
    └── Card Grid
        └── IDCard.svelte (new) × N
```

### Function-Level Behavior

#### ViewModeToggle Component

- **Purpose**: Toggle between table/card views
- **Icons**: Table and Grid icons from Lucide
- **State**: Bound to viewModeStore
- **Styling**: shadcn-svelte toggle group pattern

#### IDCard Component

- **Props**: ID data object
- **Layout**: shadcn Card with structured content
- **Interactions**: Hover effects, click handlers
- **Responsive**: Flexible sizing in grid

#### View Mode Store

- **Persistence**: localStorage key `id-gen-view-mode`
- **Default Logic**: Device detection (mobile → card, desktop → table)
- **Reactivity**: Svelte writable store pattern

### UI Implementation Details

#### Toggle Controls

- **Position**: Top-right of page header
- **Design**: Icon-based toggle button group
- **States**: Clear active/inactive indication
- **Transitions**: Smooth state changes

#### Card Grid Layout

- **CSS Grid**: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- **Gap**: `gap-4` for proper spacing
- **Responsive**: Adapts from 1-4 columns based on screen size

#### Table Enhancement

- **Preserve**: Existing table functionality
- **Improve**: Visual polish to match card aesthetic
- **Consistency**: Shared typography and color scheme

### UX Enhancement Specifications

#### Responsive Defaults

- **Mobile (< 768px)**: Default to card view
- **Tablet (768px - 1024px)**: User preference respected
- **Desktop (> 1024px)**: Default to table view
- **Override**: User selection always takes precedence

#### Preference Persistence

- **Storage**: localStorage with JSON serialization
- **Fallback**: Graceful degradation if localStorage unavailable
- **Cross-session**: Preferences maintained between visits

### Database & API Integration

- **No Changes**: Existing Supabase queries preserved
- **Single Source**: One data fetch serves both views
- **RLS Compliance**: Both views respect organization scoping
- **Performance**: No additional API calls required

---

## Step 4 – Implementation Guidance

### Development Phases

#### Phase 1: Store Creation

```typescript
// src/lib/stores/viewMode.ts
type ViewMode = 'table' | 'card';
const defaultMode = detectDeviceDefault();
export const viewMode = writable<ViewMode>(defaultMode);
```

#### Phase 2: Toggle Component

```svelte
<!-- src/lib/components/ViewModeToggle.svelte -->
<ToggleGroup bind:value={$viewMode}>
	<ToggleGroupItem value="table">
		<Table class="h-4 w-4" />
	</ToggleGroupItem>
	<ToggleGroupItem value="card">
		<Grid class="h-4 w-4" />
	</ToggleGroupItem>
</ToggleGroup>
```

#### Phase 3: Card Component

```svelte
<!-- src/lib/components/IDCard.svelte -->
<Card class="p-4 hover:shadow-md transition-shadow">
	<CardHeader>
		<CardTitle>{id.name}</CardTitle>
	</CardHeader>
	<CardContent>
		<!-- ID fields display -->
	</CardContent>
</Card>
```

#### Phase 4: Page Integration

- Import ViewModeToggle and IDCard
- Implement conditional rendering blocks
- Add responsive grid container
- Test view switching functionality

### Files Affected

1. **New Files**:
   - `src/lib/stores/viewMode.ts`
   - `src/lib/components/ViewModeToggle.svelte`
   - `src/lib/components/IDCard.svelte`

2. **Modified Files**:
   - `src/routes/all-ids/+page.svelte`
   - `src/lib/stores/index.ts` (export new store)

### Best Practices Implementation

#### Performance Optimization

- **Conditional DOM**: Use `{#if}` blocks to prevent unnecessary rendering
- **Shared Data**: Single reactive data source for both views
- **Efficient Updates**: Svelte's reactive system handles view switching

#### Accessibility Standards

- **ARIA Labels**: Proper labeling for toggle controls
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Descriptive content for both view modes

#### Code Organization

- **Component Isolation**: ViewModeToggle reusable across app
- **Store Pattern**: Standard Svelte store conventions
- **Type Safety**: Full TypeScript typing throughout

---

## Step 5 – Output Checklist

### Implementation Complexity Assessment

✅ **Checklist:**

1. **UI Changes (Complexity: 6/10)**
   - Moderate UI overhaul with dual-view system
   - New toggle controls and card grid layout
   - Enhanced visual consistency across views

2. **UX Changes (Complexity: 5/10)**
   - Significant UX enhancement with user choice
   - Preference persistence and responsive defaults
   - Smooth transitions between view modes

3. **Data Handling (Complexity: 1/10)**
   - No modifications to database schema
   - No changes to Supabase queries
   - Single data source serves both views

4. **Function Logic (Complexity: 4/10)**
   - New state management with viewModeStore
   - View switching logic and conditional rendering
   - Device detection and preference persistence

5. **ID/Key Consistency (Complexity: 1/10)**
   - No changes to ID generation or key structures
   - Only display format modifications
   - Data integrity preserved across views

---

## Implementation Priority

⚡ **Development Sequence:**

1. Create view mode store with persistence logic
2. Build ViewModeToggle component with proper styling
3. Develop IDCard component following design system
4. Integrate dual-view system into all-ids page
5. Test responsive behavior and preference persistence

**Estimated Development Time:** 6-8 hours  
**Testing Requirements:** Both view modes, responsive behavior, preference persistence  
**Success Criteria:** Seamless switching between table/card views with user preference retention
