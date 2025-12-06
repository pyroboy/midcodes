# Spec-20-Aug20-PIXEL-ONLY-DIMENSIONS-REFACTOR

## Overview

Refactor the ID-Gen application to use exclusively pixel-based dimensions (`width_pixels`, `height_pixels`) instead of the current mixed approach with inches, unit dimensions, and pixels.

## Current Problem Analysis

### Database Schema Issues

The `templates` table currently has multiple dimension fields:

- `width_pixels` (INTEGER) - What we want to keep
- `height_pixels` (INTEGER) - What we want to keep
- `dpi` (INTEGER, default 300) - What we want to keep for flexible print quality
- `unit_width` (NUMERIC) - Legacy field to remove
- `unit_height` (NUMERIC) - Legacy field to remove

### Code Duplication Issues

The codebase currently handles multiple dimension formats:

1. **Schema Level** (`templateSchema.ts`):
   - `templateCreationSchema.cardSize.widthInches`
   - `templateCreationSchema.cardSize.heightInches`
   - `templateUpdateSchema.width_inches`
   - `templateUpdateSchema.height_inches`

2. **Store Level** (`templateStore.ts`):
   - `width_inches?: number`
   - `height_inches?: number`
   - `width_pixels?: number`
   - `height_pixels?: number`
   - `unit_width?: number`
   - `unit_height?: number`

3. **Utility Level** (`sizeConversion.ts`, `cardGeometry.ts`):
   - Complex conversion functions between inches/pixels
   - `createCardFromInches()` functions
   - `UNIT_TO_INCHES` conversion constants

## Refactoring Strategy

### Phase 1: Database Schema Cleanup

**Target**: Remove legacy dimension fields, keep only pixels

**Database Changes**:

```sql
-- Keep these columns (primary pixel dimensions with DPI for flexibility)
-- width_pixels INTEGER
-- height_pixels INTEGER
-- dpi INTEGER DEFAULT 300

-- Remove these legacy columns
ALTER TABLE templates DROP COLUMN IF EXISTS unit_width;
ALTER TABLE templates DROP COLUMN IF EXISTS unit_height;
```

### Phase 2: Schema Simplification

**Target**: Update Zod schemas to use pixels exclusively

**File**: `src/lib/schemas/templateSchema.ts`

**Changes**:

```typescript
// REMOVE inch-based schemas
export const templateCreationSchema = z.object({
	name: z.string().min(1).max(100).trim(),
	description: z.string().max(500).optional(),
	// REPLACE cardSize with direct pixel dimensions
	width_pixels: z
		.number()
		.min(100, 'Width must be at least 100 pixels')
		.max(7200, 'Width cannot exceed 7200 pixels'), // 24" at 300 DPI
	height_pixels: z
		.number()
		.min(100, 'Height must be at least 100 pixels')
		.max(7200, 'Height cannot exceed 7200 pixels'), // 24" at 300 DPI
	dpi: z.number().min(72).max(600).default(300)
});

// REMOVE inch fields from templateUpdateSchema
export const templateUpdateSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string(),
	name: z.string().min(1).max(100).trim(),
	description: z.string().optional(),
	org_id: z.string(),
	front_background: z.string().url(),
	back_background: z.string().url(),
	front_background_url: z.string().url().optional(),
	back_background_url: z.string().url().optional(),
	orientation: z.enum(['landscape', 'portrait']),
	template_elements: z.array(templateElementSchema),
	created_at: z.string(),
	updated_at: z.string().optional(),
	// Pixel dimensions with DPI for flexible conversion
	width_pixels: z
		.number()
		.min(100, 'Width must be at least 100 pixels')
		.max(7200, 'Width cannot exceed 7200 pixels'),
	height_pixels: z
		.number()
		.min(100, 'Height must be at least 100 pixels')
		.max(7200, 'Height cannot exceed 7200 pixels'),
	dpi: z.number().min(72, 'DPI must be at least 72').max(600, 'DPI cannot exceed 600').default(300)
});
```

### Phase 3: Store Simplification

**Target**: Remove inch/unit dimensions from template store

**File**: `src/lib/stores/templateStore.ts`

**Changes**:

```typescript
export interface TemplateData {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	org_id: string;
	front_background: string;
	back_background: string;
	front_background_url?: string;
	back_background_url?: string;
	orientation: 'landscape' | 'portrait';
	template_elements: TemplateElement[];
	created_at: string;
	updated_at?: string;
	// Pixel dimensions with DPI (3 fields for complete dimension info)
	width_pixels: number;
	height_pixels: number;
	dpi: number;
	// REMOVE these fields:
	// width_inches?: number;
	// height_inches?: number;
	// unit_type?: string;
	// unit_width?: number;
	// unit_height?: number;
}

function createTemplateStore() {
	const { subscribe, set, update } = writable<TemplateData>({
		id: '',
		user_id: '',
		name: '',
		front_background: '',
		back_background: '',
		orientation: 'landscape',
		template_elements: [],
		created_at: new Date().toISOString(),
		org_id: '',
		// Default pixel dimensions (credit card at 300 DPI)
		width_pixels: 1013, // 3.375" * 300 DPI = 1012.5 → 1013
		height_pixels: 638, // 2.125" * 300 DPI = 637.5 → 638
		dpi: 300 // Standard print quality DPI
	});
}
```

### Phase 4: Utility Function Cleanup

**Target**: Simplify geometry and conversion utilities

**File**: `src/lib/utils/cardGeometry.ts`

**Changes**:

```typescript
// REPLACE createCardFromInches with createCardFromPixels
export async function createCardFromPixels(
	widthPixels: number,
	heightPixels: number,
	dpi: number = 300,
	scalePixelsToUnits: number = 0.5 / 300 // Scale factor for 3D units based on DPI
): Promise<BufferGeometry> {
	// Convert pixels to physical size, then to 3D world units
	const widthInches = widthPixels / dpi;
	const heightInches = heightPixels / dpi;
	const width3D = widthInches * 0.5; // 0.5 units per inch for 3D world
	const height3D = heightInches * 0.5;

	return createRoundedRectCard(width3D, height3D);
}

// REMOVE createCardFromInches function entirely
// REMOVE cardSizeTo3D function
```

**File**: `src/lib/utils/sizeConversion.ts`

**Changes**:

```typescript
// SIMPLIFY to only handle display conversions - DPI enables flexible unit display
export type DisplayUnit = 'inches' | 'mm' | 'cm';

// Helper functions for UI display only (not for storage)
export function pixelsToDisplayUnit(pixels: number, unit: DisplayUnit, dpi: number): number {
	const inches = pixels / dpi;
	switch (unit) {
		case 'inches':
			return Number(inches.toFixed(3));
		case 'mm':
			return Number((inches * 25.4).toFixed(1));
		case 'cm':
			return Number((inches * 2.54).toFixed(2));
	}
}

// Convert user input in any unit to pixels for storage
export function displayUnitToPixels(value: number, unit: DisplayUnit, dpi: number): number {
	let inches: number;
	switch (unit) {
		case 'inches':
			inches = value;
			break;
		case 'mm':
			inches = value / 25.4;
			break;
		case 'cm':
			inches = value / 2.54;
			break;
	}
	return Math.round(inches * dpi);
}

// Format dimensions for display with DPI context
export function formatDimensionsWithDpi(
	widthPx: number,
	heightPx: number,
	dpi: number,
	displayUnit: DisplayUnit = 'inches'
): string {
	const w = pixelsToDisplayUnit(widthPx, displayUnit, dpi);
	const h = pixelsToDisplayUnit(heightPx, displayUnit, dpi);
	const unit = displayUnit === 'inches' ? '"' : displayUnit;
	return `${widthPx}×${heightPx}px (${w}×${h}${unit} @ ${dpi} DPI)`;
}

// REMOVE all other complex conversion utilities
// REMOVE PREDEFINED_SIZES (use pixel presets instead)
// REMOVE UNIT_TO_INCHES constants
```

### Phase 5: Component Updates

**Target**: Update all components to work with pixels exclusively

**Key Files to Update**:

1. **`SizeSelectionDialog.svelte`**:
   - Replace inch-based presets with pixel presets that include DPI
   - Allow user to set DPI (72, 150, 300, 600) for different print qualities
   - Show real-time inch/mm equivalents based on selected DPI

2. **`TemplateForm.svelte` & `TemplateEdit.svelte`**:
   - Update form fields to accept pixel dimensions and DPI
   - Add display helpers showing inch equivalents using current DPI
   - Remove cardSize object complexity, use simple pixel + DPI inputs

3. **`ImagePreviewModal.svelte`**:
   - Simplify to work directly with pixels and DPI
   - Remove complex inch conversion logic
   - Use `createCardFromPixels(widthPx, heightPx, dpi)` for accurate 3D scaling

4. **`TemplateList.svelte`**:
   - Simplify dimension display logic
   - Remove complex unit conversions

5. **Route Pages** (`/templates/+page.svelte`, `/all-ids/+page.svelte`):
   - Update to use pixel-based geometry creation
   - Remove inch-based calculations

## Implementation Plan

### Step 1: Database Migration

```sql
-- Run migration to remove legacy columns
ALTER TABLE templates DROP COLUMN IF EXISTS unit_width;
ALTER TABLE templates DROP COLUMN IF EXISTS unit_height;

-- Ensure width_pixels and height_pixels are NOT NULL
UPDATE templates
SET width_pixels = COALESCE(width_pixels, 1013),
    height_pixels = COALESCE(height_pixels, 638)
WHERE width_pixels IS NULL OR height_pixels IS NULL;

ALTER TABLE templates
ALTER COLUMN width_pixels SET NOT NULL,
ALTER COLUMN height_pixels SET NOT NULL;
```

### Step 2: Schema Updates

- Update `templateCreationSchema` to use pixels only
- Update `templateUpdateSchema` to remove inch fields
- Update `imageUploadSchema` to work with pixel expectations
- Update TypeScript interfaces

### Step 3: Store Refactor

- Remove inch/unit fields from `TemplateData` interface
- Update store defaults to use pixels
- Update store methods to handle pixels only

### Step 4: Utility Simplification

- Replace `createCardFromInches()` with `createCardFromPixels()`
- Simplify `sizeConversion.ts` to display-only helpers
- Remove complex conversion constants and functions

### Step 5: Component Updates

- Update all template components to work with pixels
- Add display helpers for showing inch/mm equivalents
- Remove unit selection complexity

### Step 6: Testing Updates

- Update all test files to use pixel-based expectations
- Remove inch-based validation tests
- Add pixel range validation tests

## Benefits of Pixel + DPI Approach

### 1. **Simplified Data Model**

- Primary storage: pixels + DPI (3 fields total)
- No conversion errors between units
- Consistent storage format with flexible display

### 2. **Reduced Complexity**

- Eliminate complex conversion utilities
- Simpler component logic
- DPI provides context for all conversions

### 3. **Better Performance**

- No runtime conversions for storage/retrieval
- Direct pixel calculations for rendering
- DPI-based conversions only for display

### 4. **Easier Maintenance**

- Single dimension format to debug
- Clearer data flow with DPI context
- Reduced cognitive load

### 5. **Improved User Experience**

- Consistent behavior across features
- Flexible DPI selection for different use cases
- Precise pixel control with meaningful physical dimensions
- Users can choose print quality (DPI) based on their needs

### 6. **Future-Proof Flexibility**

- Support for different print qualities (72-600 DPI)
- Easy conversion to any physical unit
- Scalable for high-DPI displays and printing

## Migration Strategy

### Backward Compatibility

- Preserve existing templates during migration
- Convert any inch-stored templates to pixels (inch × DPI)
- Maintain display helpers for user-friendly units

### Default Presets

Replace inch-based presets with pixel equivalents including DPI options:

```typescript
export const PIXEL_PRESETS = {
	creditCard: {
		width: 1013,
		height: 638,
		dpi: 300,
		description: 'Credit Card (3.375" × 2.125")'
	},
	businessCard: {
		width: 1050,
		height: 600,
		dpi: 300,
		description: 'Business Card (3.5" × 2")'
	},
	badge: {
		width: 900,
		height: 1200,
		dpi: 300,
		description: 'ID Badge (3" × 4")'
	},
	lanyard: {
		width: 780,
		height: 1170,
		dpi: 300,
		description: 'Lanyard Card (2.6" × 3.9")'
	}
};

// DPI options for different print qualities
export const DPI_OPTIONS = [
	{ value: 72, label: '72 DPI (Screen/Draft)', description: 'Basic quality, smaller files' },
	{ value: 150, label: '150 DPI (Standard)', description: 'Good quality, moderate file size' },
	{ value: 300, label: '300 DPI (High Quality)', description: 'Print quality, recommended' },
	{ value: 600, label: '600 DPI (Premium)', description: 'Professional print, large files' }
];
```

### Testing Strategy

- Unit tests for pixel validation ranges
- Integration tests for template creation with pixels
- E2E tests for user workflows with pixel inputs
- Regression tests to ensure no data loss during migration

## Files Requiring Changes

### Database

- Migration script for `templates` table

### Core Schema/Types

- `src/lib/schemas/templateSchema.ts` - Remove inch schemas
- `src/lib/stores/templateStore.ts` - Remove inch fields
- `src/lib/types/database.types.ts` - Update generated types

### Utilities

- `src/lib/utils/cardGeometry.ts` - Replace inch functions
- `src/lib/utils/sizeConversion.ts` - Simplify to display only

### Components

- `src/lib/components/SizeSelectionDialog.svelte` - Pixel presets
- `src/lib/components/TemplateForm.svelte` - Pixel inputs
- `src/lib/components/TemplateEdit.svelte` - Pixel display
- `src/lib/components/TemplateList.svelte` - Pixel rendering
- `src/lib/components/ImagePreviewModal.svelte` - Pixel geometry

### Routes

- `src/routes/templates/+page.svelte` - Pixel calculations
- `src/routes/all-ids/+page.svelte` - Pixel geometry
- Any server-side validation in `+page.server.ts` files

### Tests

- All test files to use pixel expectations
- Remove inch-based test cases
- Add pixel validation tests

## Success Criteria

- ✅ All templates stored with pixel dimensions only
- ✅ No conversion errors or data loss
- ✅ Simplified component logic throughout
- ✅ All tests passing with pixel validation
- ✅ User interface shows helpful inch/mm equivalents
- ✅ 3D rendering works correctly with pixel inputs
- ✅ Template creation/editing flows work seamlessly
- ✅ Existing templates migrate successfully

## Risk Mitigation

- **Data Loss Risk**: Create database backup before migration
- **User Confusion**: Maintain inch/mm display helpers in UI
- **Breaking Changes**: Update all dependent code simultaneously
- **Performance Risk**: Test with large templates to ensure efficiency
- **Regression Risk**: Comprehensive test suite before deployment
