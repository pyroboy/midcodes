# Template Schemas

This directory contains comprehensive Zod schemas for all template data handling in the ID Generation application.

## Structure

### Core Schema Files

- **`template-creation.schema.ts`** - Template creation, presets, and DPI handling
- **`template-element.schema.ts`** - All template element types (text, image, QR, etc.)
- **`template-update.schema.ts`** - Template updates, patches, and bulk operations
- **`display-conversion.schema.ts`** - Display units, conversions, and formatting
- **`index.ts`** - Central exports and utility types

## Design Principles

### 1. Pixel + DPI Approach

All dimensions are stored as pixels with DPI context:

```typescript
interface TemplateDimensions {
	width_pixels: number; // Primary storage
	height_pixels: number; // Primary storage
	dpi: number; // Conversion context
}
```

### 2. Type Safety

All schemas provide inferred TypeScript types:

```typescript
import { templateCreationInputSchema, type TemplateCreationInput } from '@/schemas';

const data: TemplateCreationInput = {
	name: 'Employee Card',
	width_pixels: 1013,
	height_pixels: 638,
	dpi: 300
};

const result = templateCreationInputSchema.safeParse(data);
```

### 3. Validation Layers

- **Input Validation**: User-provided data validation
- **Database Validation**: Complete data with system fields
- **Display Validation**: UI formatting and conversion

## Usage Examples

### Template Creation

```typescript
import { templateCreationInputSchema } from '@/schemas';

// Validate user input
const userInput = {
	name: 'Business Card',
	width_pixels: 1050,
	height_pixels: 600,
	dpi: 300
};

const validation = templateCreationInputSchema.safeParse(userInput);
if (validation.success) {
	// Safe to use validation.data
}
```

### Template Elements

```typescript
import { templateElementSchema, type TemplateElement } from '@/schemas';

// Type-safe element creation
const textElement: TemplateElement = {
	id: crypto.randomUUID(),
	type: 'text',
	x: 50,
	y: 30,
	width: 200,
	height: 25,
	side: 'front',
	variableName: 'employeeName',
	content: 'Employee Name',
	fontSize: 16
};

const validation = templateElementSchema.safeParse(textElement);
```

### Dimension Conversions

```typescript
import { pixelsToDisplayUnit, type DisplayUnit } from '@/schemas';

// Convert pixels to physical units
const widthInches = pixelsToDisplayUnit(1013, 'inches', 300); // 3.375
const heightMM = pixelsToDisplayUnit(638, 'mm', 300); // 54.0
```

## Schema Categories

### Template Creation (`template-creation.schema.ts`)

- `templateCreationInputSchema` - User input validation
- `templateCreationDataSchema` - Database insert data
- `templatePresetSchema` - Preset templates
- `dpiOptionSchema` - DPI selection options

### Template Elements (`template-element.schema.ts`)

- `templateElementSchema` - Union of all element types
- `textElementSchema` - Text-specific properties
- `imageElementSchema` - Image-specific properties
- `qrElementSchema` - QR code properties
- `photoElementSchema` - User photo upload
- `signatureElementSchema` - Signature capture
- `selectionElementSchema` - Dropdown/radio options

### Template Updates (`template-update.schema.ts`)

- `templateUpdateInputSchema` - Partial updates
- `templatePatchSchema` - Targeted field updates
- `templateBulkOperationSchema` - Bulk operations
- `templateDuplicateSchema` - Template duplication
- `templateArchiveSchema` - Archive/unarchive

### Display & Conversion (`display-conversion.schema.ts`)

- `dimensionConversionSchema` - Unit conversions
- `displayFormatSchema` - Display formatting options
- `sizePresetSchema` - Predefined sizes
- `printSpecificationSchema` - Print specifications

## Validation Patterns

### Safe Parsing

```typescript
const result = schema.safeParse(data);
if (result.success) {
	// Use result.data (type-safe)
} else {
	// Handle result.error.issues
}
```

### Partial Updates

```typescript
const updates = templateUpdateInputSchema.partial().parse({
	name: 'New Name' // Only update name
});
```

### Discriminated Unions

```typescript
// Template elements use discriminated unions by 'type'
switch (element.type) {
	case 'text':
		// element is now TypeScript type TextElement
		console.log(element.fontSize);
		break;
	case 'image':
		// element is now TypeScript type ImageElement
		console.log(element.src);
		break;
}
```

## Constants & Defaults

The schemas include commonly used constants:

```typescript
export const DEFAULT_DPI = 300;
export const MIN_DIMENSION_PX = 100;
export const MAX_DIMENSION_PX = 7200;
export const COMMON_CARD_SIZES = {
	creditCard: { width: 1013, height: 638 },
	businessCard: { width: 1050, height: 600 }
};
```

## Benefits

1. **Type Safety**: Compile-time type checking with inferred types
2. **Runtime Validation**: Zod provides runtime validation
3. **Single Source of Truth**: All template data structures centralized
4. **Consistency**: Uniform validation across all template operations
5. **Maintainability**: Changes to schemas automatically update types
6. **Performance**: Tree-shakable exports reduce bundle size
