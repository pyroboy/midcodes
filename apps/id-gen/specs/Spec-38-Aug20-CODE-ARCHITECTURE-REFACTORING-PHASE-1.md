# Spec-38-Aug20-CODE-ARCHITECTURE-REFACTORING-PHASE-1

## Requirement Extraction

Refactor large monolithic components into smaller, focused modules and eliminate code duplication through consolidation. Current codebase has components exceeding 500 lines, duplicate type definitions across multiple files, and 15+ unused backup components creating maintenance overhead.

**Critical Architecture Issues (Priority 1)**:

1. **Monolithic Components**: `IdCanvas.svelte` (1000+ lines), `BackgroundThumbnail.svelte` (800+ lines)
2. **Type Definition Duplication**: `TemplateElement` defined in 3 different files
3. **Dead Code Accumulation**: `/backup/unused-components/` contains 15+ unused Svelte components
4. **Circular Import Risk**: Complex dependency chains between stores, utils, and components

## Context Awareness

**Tech Stack**: Svelte 5 + SvelteKit + TypeScript
**Refactoring Scope**: Focus on most impactful components and type consolidation
**Target Metrics**:

- Component max size: 300 lines
- Zero duplicate type definitions
- Remove 100% of backup/unused code
- Clear dependency hierarchy

**Problem Areas**:

- `IdCanvas.svelte`: 3D rendering + UI logic + state management in single file
- `BackgroundThumbnail.svelte`: Image processing + drag handling + thumbnail display
- Multiple `TemplateElement` interfaces across `/lib/types/` files
- Unused shadcn components in `/backup/unused-components/`

## Technical Specification

### Data Flow - Modular Architecture

```
UI Component → Composition Layer → Business Logic → Data Layer
```

### State Handling - Single Responsibility

```typescript
// Before (monolithic)
class IdCanvasComponent {
	// 3D rendering logic
	// UI state management
	// Event handling
	// Data processing
}

// After (modular)
class RenderEngine {
	/* 3D operations only */
}
class CanvasUI {
	/* UI presentation only */
}
class EventController {
	/* Input handling only */
}
class DataProcessor {
	/* Data transformations only */
}
```

### Function-Level Behavior

**1. Component Decomposition Pattern**:

```typescript
// Break large components into focused modules

// IdCanvas.svelte (1000+ lines) → Multiple focused components:
// - IdCanvasCore.svelte (rendering coordination)
// - RenderControls.svelte (UI controls)
// - CanvasViewport.svelte (3D display)
// - RenderProgress.svelte (loading states)
```

**2. Type Consolidation Strategy**:

```typescript
// Eliminate duplicate definitions
// BEFORE: TemplateElement defined in 3 files
// AFTER: Single source in /schemas/template-element.schema.ts

// Remove duplicate interfaces
export type { TemplateElement } from '../../schemas';
// Delete local definitions
```

**3. Dead Code Removal Process**:

```typescript
// Systematic removal of unused components
const unusedComponents = [
  'backup/unused-components/Card.svelte',
  'backup/unused-components/LoadingSpinner.svelte',
  // ... 13 more components
];

// Automated cleanup script
rm -rf backup/unused-components/
rm -rf backup/unused-utilities/
```

### Database & API Operations

**Component Responsibility Separation**:

- Data fetching components (server communication only)
- Display components (presentation only)
- Business logic utilities (processing only)

### Dependencies

**Analysis Tools**:

- `madge`: Circular dependency detection
- `depcheck`: Unused dependency identification
- `eslint-plugin-boundaries`: Architecture enforcement

**Refactoring Tools**:

- VSCode refactoring extensions
- TypeScript language service for safe renames

## Implementation Plan

### Step 1: Monolithic Component Breakdown (75 minutes)

**IdCanvas.svelte Refactoring** (45 minutes):

```
IdCanvas.svelte (1000+ lines) →
├── IdCanvasCore.svelte (150 lines) - Main coordination
├── RenderControls.svelte (100 lines) - UI controls
├── CanvasViewport.svelte (120 lines) - 3D display
├── RenderProgress.svelte (80 lines) - Loading states
└── renderEngine.ts (200 lines) - Core 3D logic
```

**BackgroundThumbnail.svelte Refactoring** (30 minutes):

```
BackgroundThumbnail.svelte (800+ lines) →
├── ThumbnailCore.svelte (120 lines) - Main component
├── DragHandler.svelte (100 lines) - Drag interactions
├── ImageProcessor.ts (150 lines) - Image processing
└── ThumbnailControls.svelte (80 lines) - Control UI
```

**Implementation Pattern**:

```typescript
// Extract logical sections into focused components
// 1. Identify distinct responsibilities
// 2. Create separate files for each responsibility
// 3. Use composition to combine functionality
// 4. Test each module independently
```

### Step 2: Type Definition Consolidation (30 minutes)

**Files to Update**:

- Remove duplicates from `/src/lib/types/types.ts`
- Remove duplicates from `/src/lib/types/database.ts`
- Update all imports to use `/schemas/` as single source

**Consolidation Process**:

```bash
# Find duplicate type definitions
grep -r "interface TemplateElement" src/

# Remove duplicates, keep schema version only
# Update imports across codebase
find src/ -name "*.ts" -o -name "*.svelte" \
  | xargs sed -i 's/from.*types\/types/from ..\/schemas/g'
```

### Step 3: Dead Code Removal (15 minutes)

**Directories to Remove**:

```bash
rm -rf backup/unused-components/
rm -rf backup/unused-utilities/

# Also remove from any import statements
grep -r "backup/" src/ # Should return no results
```

**Verification**:

```bash
# Ensure no imports reference deleted files
npm run build # Should succeed without errors
npm run check # TypeScript should have no missing references
```

### Step 4: Dependency Architecture Cleanup (30 minutes)

**Create Clear Import Hierarchy**:

```
Components → Stores → Utils → Schemas
     ↓
No circular imports allowed
```

**Files to Create**:

- `src/lib/utils/importRules.md` - Document import patterns
- `.eslintrc.js` - Add import boundary rules

**Import Rules**:

```typescript
// ALLOWED: Component imports from lower layers
import { templateStore } from '$lib/stores/templateStore';
import { validateTemplate } from '$lib/utils/validation';

// FORBIDDEN: Lower layer imports from higher layers
// utils importing from components
// schemas importing from stores
```

## Best Practices

### Component Decomposition

```typescript
// Single Responsibility Principle
// BEFORE (multiple responsibilities)
function MegaComponent() {
	// Data fetching
	// UI rendering
	// Event handling
	// State management
}

// AFTER (single responsibility each)
function DataProvider() {
	/* data only */
}
function UIRenderer() {
	/* display only */
}
function EventHandler() {
	/* events only */
}
function StateManager() {
	/* state only */
}
```

### Composition Over Inheritance

```svelte
<!-- Use component composition for complex functionality -->
<IdCanvasCore>
	<RenderControls slot="controls" />
	<CanvasViewport slot="viewport" />
	<RenderProgress slot="progress" />
</IdCanvasCore>
```

### Import Organization

```typescript
// Organize imports by layer (top to bottom)
// External dependencies
import { writable } from 'svelte/store';

// Internal schemas (data layer)
import type { TemplateElement } from '../../schemas';

// Internal utilities (logic layer)
import { validateTemplate } from '../utils/validation';

// Internal components (presentation layer)
import Button from './ui/Button.svelte';
```

## Assumptions & Constraints

### Assumptions

1. Large components can be safely broken down without losing functionality
2. Type consolidation won't break existing imports (with proper refactoring)
3. Unused code can be removed without affecting active features
4. Component APIs can be adjusted during refactoring

### Constraints

1. Must maintain existing component public APIs where possible
2. Cannot break current functionality during refactoring
3. Must preserve all current features and behaviors
4. Refactoring should be done incrementally to avoid large breaking changes

## Testing Strategy

### Component Testing

```typescript
describe('Refactored IdCanvas', () => {
	test('maintains same functionality as monolithic version', async () => {
		// Test that refactored components work together
		const result = await renderTemplate(sampleTemplate);
		expect(result).toEqual(expectedOutput);
	});

	test('individual components work independently', () => {
		// Test each component in isolation
		const controls = render(RenderControls);
		expect(controls.getByRole('button')).toBeInTheDocument();
	});
});
```

### Architecture Testing

```typescript
describe('Import architecture', () => {
	test('no circular dependencies exist', () => {
		const cycles = detectCircularDependencies();
		expect(cycles).toHaveLength(0);
	});

	test('import hierarchy is maintained', () => {
		const violations = checkImportBoundaries();
		expect(violations).toHaveLength(0);
	});
});
```

### Integration Testing

```typescript
test('refactored components integrate properly', async () => {
	// Test full user workflow with refactored components
	await userEvent.click(screen.getByText('Create Template'));
	await userEvent.upload(screen.getByLabelText('Background'), testImage);

	expect(screen.getByText('Template Created')).toBeInTheDocument();
});
```

## Validation Checklist

✅ **Architecture Refactoring Checklist:**

1. **Component Size** – Are all components under 300 lines with single responsibility? (1–10)
2. **Type Consolidation** – Is there only one source of truth for each type definition? (1–10)
3. **Dead Code Removal** – Are all unused components and utilities completely removed? (1–10)
4. **Dependency Architecture** – Is the import hierarchy clear with no circular dependencies? (1–10)
5. **Functionality Preservation** – Do refactored components maintain identical behavior? (1–10)
6. **Testing Coverage** – Are all refactored components properly tested? (1–10)
7. **Code Clarity** – Is the purpose and responsibility of each component clear? (1–10)
8. **Maintainability** – Is the codebase easier to understand and modify? (1–10)
9. **Performance** – Does refactoring maintain or improve performance? (1–10)
10. **Developer Experience** – Are components easier to work with after refactoring? (1–10)

## Expected Outcomes

### Code Quality Improvements

- **Component Focus**: Each component has single, clear responsibility
- **Type Safety**: Single source of truth eliminates type inconsistencies
- **Codebase Size**: 15+ unused components removed, reducing maintenance burden
- **Architecture Clarity**: Clear dependency hierarchy prevents circular imports

### Developer Experience Benefits

- **Easier Debugging**: Smaller components easier to understand and debug
- **Faster Development**: Focused components reduce cognitive load
- **Better Testing**: Isolated components enable better unit testing
- **Safer Refactoring**: Clear boundaries reduce risk of breaking changes

### Maintainability Gains

- **Reduced Complexity**: Breaking down 1000+ line files into manageable pieces
- **Better Separation**: Clear boundaries between UI, logic, and data layers
- **Easier Onboarding**: New developers can understand focused components faster
- **Sustainable Growth**: Architecture supports adding new features without creating technical debt

This Phase 1 refactoring addresses the most critical architectural issues while maintaining stability (approximately 2.5 hours implementation time).
