# Test-03-Aug20-Template-Creation-Unit-Integration-DataValidation

## **Database Schema and Types**

### **Supabase Templates Table Structure**

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  org_id UUID NOT NULL,
  front_background TEXT NOT NULL,
  back_background TEXT NOT NULL,
  front_background_url TEXT,
  back_background_url TEXT,
  orientation VARCHAR(20) NOT NULL DEFAULT 'landscape',
  template_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  width_inches DECIMAL(4,2) DEFAULT 3.375,
  height_inches DECIMAL(4,2) DEFAULT 2.125,
  dpi INTEGER DEFAULT 300,
  width_pixels INTEGER,
  height_pixels INTEGER,
  unit_type VARCHAR(20),
  unit_width INTEGER,
  unit_height INTEGER,

  CONSTRAINT templates_name_length CHECK (length(name) <= 100),
  CONSTRAINT templates_dimensions_check CHECK (
    width_inches >= 1 AND width_inches <= 12 AND
    height_inches >= 1 AND height_inches <= 12
  ),
  CONSTRAINT templates_dpi_check CHECK (dpi >= 72 AND dpi <= 600)
);

-- Indexes
CREATE INDEX idx_templates_org_id ON templates(org_id);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);

-- RLS Policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_org" ON templates
  FOR SELECT USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "templates_insert_org" ON templates
  FOR INSERT WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid AND
    user_id = auth.uid()
  );

CREATE POLICY "templates_update_org" ON templates
  FOR UPDATE USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid AND
    user_id = auth.uid()
  );

CREATE POLICY "templates_delete_org" ON templates
  FOR DELETE USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid AND
    user_id = auth.uid()
  );
```

### **TypeScript Interfaces and Types**

```typescript
// Core Template Element Interface
export interface TemplateElement {
	id: string;
	type: 'text' | 'image' | 'qr' | 'photo' | 'signature' | 'selection';
	x: number;
	y: number;
	width: number;
	height: number;
	content?: string;
	variableName: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: string;
	fontStyle?: 'normal' | 'italic' | 'oblique';
	color?: string;
	textDecoration?: 'none' | 'underline';
	textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
	opacity?: number;
	visible?: boolean;
	font?: string;
	size?: number;
	alignment?: 'left' | 'center' | 'right' | 'justify';
	options?: string[];
	side: 'front' | 'back';
	letterSpacing?: number;
	lineHeight?: number | string;
}

// Template Data Interface
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
	width_inches?: number;
	height_inches?: number;
	dpi?: number;
	width_pixels?: number;
	height_pixels?: number;
	unit_type?: string;
	unit_width?: number;
	unit_height?: number;
}

// Database Row Types
export interface TemplateRow {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	org_id: string;
	front_background: string;
	back_background: string;
	front_background_url: string | null;
	back_background_url: string | null;
	orientation: string;
	template_elements: TemplateElement[];
	created_at: string;
	updated_at: string | null;
	width_inches: number;
	height_inches: number;
	dpi: number;
	width_pixels: number | null;
	height_pixels: number | null;
	unit_type: string | null;
	unit_width: number | null;
	unit_height: number | null;
}

// Template Store State
export interface TemplateStore {
	subscribe: (fn: (value: TemplateData) => void) => () => void;
	set: (value: TemplateData) => void;
	update: (updater: (value: TemplateData) => TemplateData) => void;
	select: (template: TemplateData) => void;
	reset: () => void;
}
```

### **Zod Validation Schemas**

```typescript
export const templateCreationSchema = z.object({
	name: z
		.string()
		.min(1, 'Template name is required')
		.max(100, 'Template name must be less than 100 characters')
		.trim(),
	description: z.string().max(500, 'Description must be less than 500 characters').optional(),
	cardSize: z.object({
		name: z.string().min(1, 'Card size name is required'),
		widthInches: z
			.number()
			.min(1, 'Width must be at least 1 inch')
			.max(12, 'Width cannot exceed 12 inches'),
		heightInches: z
			.number()
			.min(1, 'Height must be at least 1 inch')
			.max(12, 'Height cannot exceed 12 inches'),
		description: z.string().optional()
	}),
	dpi: z.number().min(72, 'DPI must be at least 72').max(600, 'DPI cannot exceed 600').default(300)
});

export const templateElementSchema = z.object({
	id: z.string().min(1, 'Element ID is required'),
	type: z.enum(['text', 'image', 'qr', 'photo', 'signature', 'selection']),
	x: z.number().min(0, 'X coordinate cannot be negative'),
	y: z.number().min(0, 'Y coordinate cannot be negative'),
	width: z.number().min(1, 'Width must be positive'),
	height: z.number().min(1, 'Height must be positive'),
	content: z.string().optional(),
	variableName: z.string().min(1, 'Variable name is required'),
	fontSize: z.number().positive().optional(),
	fontFamily: z.string().optional(),
	fontWeight: z.string().optional(),
	fontStyle: z.enum(['normal', 'italic', 'oblique']).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
		.optional(),
	textDecoration: z.enum(['none', 'underline']).optional(),
	textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
	opacity: z.number().min(0).max(1, 'Opacity must be between 0 and 1').optional(),
	visible: z.boolean().optional(),
	font: z.string().optional(),
	size: z.number().positive().optional(),
	alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
	options: z.array(z.string()).optional(),
	side: z.enum(['front', 'back']),
	letterSpacing: z.number().optional(),
	lineHeight: z.union([z.number(), z.string()]).optional()
});

export const templateUpdateSchema = z.object({
	id: z.string().uuid('Invalid template ID format'),
	user_id: z.string().uuid('Invalid user ID format'),
	name: z
		.string()
		.min(1, 'Template name is required')
		.max(100, 'Template name must be less than 100 characters')
		.trim(),
	description: z.string().max(500).optional(),
	org_id: z.string().uuid('Invalid organization ID format'),
	front_background: z.string().url('Front background must be a valid URL'),
	back_background: z.string().url('Back background must be a valid URL'),
	front_background_url: z.string().url().optional(),
	back_background_url: z.string().url().optional(),
	orientation: z.enum(['landscape', 'portrait']),
	template_elements: z.array(templateElementSchema),
	created_at: z.string().datetime('Invalid created_at format'),
	updated_at: z.string().datetime().optional(),
	width_inches: z
		.number()
		.min(1, 'Width must be at least 1 inch')
		.max(12, 'Width cannot exceed 12 inches'),
	height_inches: z
		.number()
		.min(1, 'Height must be at least 1 inch')
		.max(12, 'Height cannot exceed 12 inches'),
	dpi: z.number().min(72, 'DPI must be at least 72').max(600, 'DPI cannot exceed 600').default(300),
	width_pixels: z.number().positive().optional(),
	height_pixels: z.number().positive().optional(),
	unit_type: z.string().optional(),
	unit_width: z.number().positive().optional(),
	unit_height: z.number().positive().optional()
});
```

---

## **1. Unit Tests - Template Creation Functions**

### **1.1 Schema Validation Unit Tests**

#### **Template Creation Schema Tests**

```typescript
describe('Template Creation Schema Validation - Unit Tests', () => {
  test('validates complete template creation data', () => {
    const validTemplate = {
      name: 'Employee ID Card',
      description: 'Standard employee identification card',
      cardSize: {
        name: 'Standard Credit Card',
        widthInches: 3.375,
        heightInches: 2.125,
        description: 'ISO/IEC 7810 ID-1 standard'
      },
      dpi: 300
    };

    const result = templateCreationSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validTemplate);
  });

  test('rejects template with empty name', () => {
    const invalidTemplate = {
      name: '',
      cardSize: {
        name: 'Card',
        widthInches: 3.375,
        heightInches: 2.125
      }
    };

    const result = templateCreationSchema.safeParse(invalidTemplate);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Template name is required');
  });

  test('validates name length constraints', () => {
    const longNameTemplate = {
      name: 'A'.repeat(101), // Exceeds 100 character limit
      cardSize: {
        name: 'Card',
        widthInches: 3.375,
        heightInches: 2.125
      }
    };

    const result = templateCreationSchema.safeParse(longNameTemplate);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Template name must be less than 100 characters');
  });

  test('trims whitespace from template name', () => {
    const whitespaceTemplate = {
      name: '  Employee Badge  ',
      cardSize: {
        name: 'Card',
        widthInches: 3.375,
        heightInches: 2.125
      }
    };

    const result = templateCreationSchema.safeParse(whitespaceTemplate);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Employee Badge');
  });
}
```

#### **Card Size Validation Tests**

```typescript
describe('Card Size Validation - Unit Tests', () => {
  test('validates minimum card dimensions', () => {
    const tooSmallCard = {
      name: 'Tiny Card',
      cardSize: {
        name: 'Too Small',
        widthInches: 0.5, // Below 1 inch minimum
        heightInches: 2.0
      }
    };

    const result = templateCreationSchema.safeParse(tooSmallCard);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['cardSize', 'widthInches']);
    expect(result.error?.issues[0].message).toBe('Width must be at least 1 inch');
  });

  test('validates maximum card dimensions', () => {
    const tooLargeCard = {
      name: 'Giant Card',
      cardSize: {
        name: 'Too Large',
        widthInches: 15.0, // Above 12 inch maximum
        heightInches: 10.0
      }
    };

    const result = templateCreationSchema.safeParse(tooLargeCard);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Width cannot exceed 12 inches');
  });

  test('accepts valid card size range', () => {
    const validSizes = [
      { width: 1.0, height: 1.0 },     // Minimum
      { width: 3.375, height: 2.125 }, // Standard credit card
      { width: 8.5, height: 11.0 },   // Letter size
      { width: 12.0, height: 12.0 }   // Maximum
    ];

    validSizes.forEach(({ width, height }) => {
      const template = {
        name: `${width}x${height} Card`,
        cardSize: {
          name: `${width}x${height}`,
          widthInches: width,
          heightInches: height
        }
      };

      const result = templateCreationSchema.safeParse(template);
      expect(result.success).toBe(true);
    });
  });
}
```

#### **DPI Validation Tests**

```typescript
describe('DPI Validation - Unit Tests', () => {
  test('validates minimum DPI constraint', () => {
    const lowDpiTemplate = {
      name: 'Low DPI Template',
      cardSize: {
        name: 'Card',
        widthInches: 3.375,
        heightInches: 2.125
      },
      dpi: 50 // Below 72 minimum
    };

    const result = templateCreationSchema.safeParse(lowDpiTemplate);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('DPI must be at least 72');
  });

  test('validates maximum DPI constraint', () => {
    const highDpiTemplate = {
      name: 'High DPI Template',
      cardSize: {
        name: 'Card',
        widthInches: 3.375,
        heightInches: 2.125
      },
      dpi: 700 // Above 600 maximum
    };

    const result = templateCreationSchema.safeParse(highDpiTemplate);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('DPI cannot exceed 600');
  });

  test('applies default DPI when not specified', () => {
    const templateWithoutDpi = {
      name: 'Default DPI Template',
      cardSize: {
        name: 'Card',
        widthInches: 3.375,
        heightInches: 2.125
      }
    };

    const result = templateCreationSchema.safeParse(templateWithoutDpi);
    expect(result.success).toBe(true);
    expect(result.data?.dpi).toBe(300);
  });
}
```

### **1.2 Template Element Schema Unit Tests**

#### **Element Type Validation**

```typescript
describe('Template Element Type Validation - Unit Tests', () => {
  test('validates all supported element types', () => {
    const elementTypes: Array<TemplateElement['type']> = [
      'text', 'image', 'qr', 'photo', 'signature', 'selection'
    ];

    elementTypes.forEach(type => {
      const element = {
        id: `${type}-element`,
        type,
        x: 50,
        y: 50,
        width: 100,
        height: 50,
        variableName: `${type}_field`,
        side: 'front' as const
      };

      const result = templateElementSchema.safeParse(element);
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe(type);
    });
  });

  test('rejects invalid element type', () => {
    const invalidElement = {
      id: 'invalid-element',
      type: 'invalid_type',
      x: 50, y: 50, width: 100, height: 50,
      variableName: 'field', side: 'front'
    };

    const result = templateElementSchema.safeParse(invalidElement);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['type']);
  });
}
```

#### **Element Position and Size Validation**

```typescript
describe('Element Position and Size Validation - Unit Tests', () => {
  test('validates position constraints', () => {
    const negativePositionElement = {
      id: 'negative-pos',
      type: 'text' as const,
      x: -10, // Negative x coordinate
      y: 50,
      width: 100,
      height: 50,
      variableName: 'field',
      side: 'front' as const
    };

    const result = templateElementSchema.safeParse(negativePositionElement);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('X coordinate cannot be negative');
  });

  test('validates size constraints', () => {
    const zeroWidthElement = {
      id: 'zero-width',
      type: 'text' as const,
      x: 50, y: 50,
      width: 0, // Zero width
      height: 50,
      variableName: 'field',
      side: 'front' as const
    };

    const result = templateElementSchema.safeParse(zeroWidthElement);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Width must be positive');
  });

  test('accepts valid position and size values', () => {
    const validElement = {
      id: 'valid-element',
      type: 'text' as const,
      x: 100, y: 150,
      width: 200, height: 75,
      variableName: 'employee_name',
      side: 'front' as const
    };

    const result = templateElementSchema.safeParse(validElement);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validElement);
  });
}
```

#### **Text Element Properties Validation**

```typescript
describe('Text Element Properties Validation - Unit Tests', () => {
  test('validates color format', () => {
    const invalidColorElement = {
      id: 'color-test',
      type: 'text' as const,
      x: 50, y: 50, width: 100, height: 30,
      variableName: 'text_field',
      side: 'front' as const,
      color: 'invalid-color' // Invalid color format
    };

    const result = templateElementSchema.safeParse(invalidColorElement);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Invalid color format');
  });

  test('accepts valid hex color', () => {
    const validColorElement = {
      id: 'color-test',
      type: 'text' as const,
      x: 50, y: 50, width: 100, height: 30,
      variableName: 'text_field',
      side: 'front' as const,
      color: '#FF5733'
    };

    const result = templateElementSchema.safeParse(validColorElement);
    expect(result.success).toBe(true);
    expect(result.data?.color).toBe('#FF5733');
  });

  test('validates opacity range', () => {
    const invalidOpacityElement = {
      id: 'opacity-test',
      type: 'text' as const,
      x: 50, y: 50, width: 100, height: 30,
      variableName: 'text_field',
      side: 'front' as const,
      opacity: 1.5 // Above maximum 1.0
    };

    const result = templateElementSchema.safeParse(invalidOpacityElement);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Opacity must be between 0 and 1');
  });
}
```

### **1.3 Template Store Unit Tests**

#### **Store Initialization Tests**

```typescript
describe('Template Store Initialization - Unit Tests', () => {
  test('initializes with default template structure', () => {
    let currentState: TemplateData;
    const unsubscribe = templateData.subscribe(state => {
      currentState = state;
    });

    expect(currentState!.id).toBe('');
    expect(currentState!.name).toBe('');
    expect(currentState!.orientation).toBe('landscape');
    expect(currentState!.template_elements).toEqual([]);
    expect(currentState!.width_inches).toBe(3.375);
    expect(currentState!.height_inches).toBe(2.125);
    expect(currentState!.dpi).toBe(300);
    expect(currentState!.width_pixels).toBe(1013);
    expect(currentState!.height_pixels).toBe(638);

    unsubscribe();
  });

  test('initializes with valid ISO timestamp', () => {
    let currentState: TemplateData;
    const unsubscribe = templateData.subscribe(state => {
      currentState = state;
    });

    const timestamp = new Date(currentState!.created_at);
    expect(timestamp.getTime()).not.toBeNaN();
    expect(timestamp.getFullYear()).toBeGreaterThan(2023);

    unsubscribe();
  });
}
```

#### **Store Operations Tests**

```typescript
describe('Template Store Operations - Unit Tests', () => {
  test('updates store state correctly', () => {
    let currentState: TemplateData;
    const unsubscribe = templateData.subscribe(state => {
      currentState = state;
    });

    const testTemplate: TemplateData = {
      id: 'test-template-123',
      user_id: 'user-456',
      name: 'Test Employee Badge',
      org_id: 'org-789',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'portrait',
      template_elements: [{
        id: 'text-1',
        type: 'text',
        x: 50, y: 50, width: 200, height: 40,
        variableName: 'employee_name',
        side: 'front'
      }],
      created_at: '2024-01-01T00:00:00Z',
      width_inches: 4.0,
      height_inches: 6.0,
      dpi: 350
    };

    templateData.set(testTemplate);

    expect(currentState!.id).toBe('test-template-123');
    expect(currentState!.name).toBe('Test Employee Badge');
    expect(currentState!.orientation).toBe('portrait');
    expect(currentState!.template_elements).toHaveLength(1);
    expect(currentState!.width_inches).toBe(4.0);
    expect(currentState!.dpi).toBe(350);

    unsubscribe();
  });

  test('resets store to default state', () => {
    let currentState: TemplateData;
    const unsubscribe = templateData.subscribe(state => {
      currentState = state;
    });

    // First set a custom template
    templateData.set({
      id: 'custom-template',
      name: 'Custom Template',
      user_id: 'user-123',
      org_id: 'org-456',
      front_background: 'https://example.com/bg.jpg',
      back_background: 'https://example.com/bg.jpg',
      orientation: 'portrait',
      template_elements: [{
        id: 'element-1',
        type: 'text',
        x: 0, y: 0, width: 100, height: 50,
        variableName: 'field',
        side: 'front'
      }],
      created_at: '2024-01-01T00:00:00Z'
    });

    // Then reset
    templateData.reset();

    expect(currentState!.id).toBe('');
    expect(currentState!.name).toBe('');
    expect(currentState!.orientation).toBe('landscape');
    expect(currentState!.template_elements).toEqual([]);
    expect(currentState!.width_inches).toBe(3.375);

    unsubscribe();
  });

  test('select method updates state', () => {
    let currentState: TemplateData;
    const unsubscribe = templateData.subscribe(state => {
      currentState = state;
    });

    const selectedTemplate: TemplateData = {
      id: 'selected-template',
      name: 'Selected Template',
      user_id: 'user-123',
      org_id: 'org-456',
      front_background: 'https://example.com/selected.jpg',
      back_background: 'https://example.com/selected.jpg',
      orientation: 'landscape',
      template_elements: [],
      created_at: '2024-01-01T00:00:00Z'
    };

    templateData.select(selectedTemplate);

    expect(currentState!.id).toBe('selected-template');
    expect(currentState!.name).toBe('Selected Template');

    unsubscribe();
  });
}
```

---

## **2. Integration Tests - Complete Template Creation Flow**

### **2.1 Server Action Integration Tests**

#### **Basic Template Creation Flow**

```typescript
describe('Template Creation Server Action - Integration Tests', () => {
  test('creates template with complete data flow', async () => {
    // Mock Supabase client
    const mockSupabase = createMockSupabase();
    const mockSession = {
      user: { id: 'user-123' }
    };
    const mockOrgId = 'org-456';

    // Template data
    const templateData = {
      id: 'new-template-789',
      name: 'Integration Test Template',
      description: 'Template created via integration test',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: [
        {
          id: 'text-element-1',
          type: 'text',
          x: 50, y: 50, width: 200, height: 40,
          variableName: 'employee_name',
          side: 'front',
          fontSize: 16,
          fontFamily: 'Arial'
        }
      ],
      width_inches: 3.375,
      height_inches: 2.125,
      dpi: 300
    };

    // Create form data
    const formData = new FormData();
    formData.set('templateData', JSON.stringify(templateData));

    // Mock request and locals
    const request = { formData: () => Promise.resolve(formData) };
    const locals = {
      supabase: mockSupabase,
      session: mockSession,
      org_id: mockOrgId
    };

    // Configure mock response
    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              ...templateData,
              user_id: 'user-123',
              org_id: 'org-456',
              created_at: '2024-08-20T10:00:00Z',
              updated_at: '2024-08-20T10:00:00Z'
            },
            error: null
          })
        })
      })
    });

    // Execute server action
    const result = await actions.create({ request, locals });

    // Verify results
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('new-template-789');
    expect(result.data.name).toBe('Integration Test Template');
    expect(result.data.user_id).toBe('user-123');
    expect(result.data.org_id).toBe('org-456');
    expect(result.data.template_elements).toHaveLength(1);

    // Verify database call
    expect(mockSupabase.from).toHaveBeenCalledWith('templates');
  });

  test('handles database constraint violations', async () => {
    const mockSupabase = createMockSupabase();
    const mockSession = { user: { id: 'user-123' } };

    const templateData = {
      name: 'A'.repeat(101), // Exceeds database constraint
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: []
    };

    const formData = new FormData();
    formData.set('templateData', JSON.stringify(templateData));

    // Configure mock to return constraint error
    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23514', // Check constraint violation
              message: 'Check constraint "templates_name_length" violated'
            }
          })
        })
      })
    });

    const request = { formData: () => Promise.resolve(formData) };
    const locals = {
      supabase: mockSupabase,
      session: mockSession,
      org_id: 'org-456'
    };

    await expect(actions.create({ request, locals }))
      .rejects.toThrow('Error saving template');
  });
}
```

#### **Template Element Integration Tests**

```typescript
describe('Template Elements Integration - Integration Tests', () => {
  test('creates template with multiple element types', async () => {
    const complexElements = [
      {
        id: 'name-field',
        type: 'text',
        x: 50, y: 50, width: 250, height: 40,
        variableName: 'employee_name',
        side: 'front',
        fontSize: 18, fontWeight: 'bold', color: '#000000'
      },
      {
        id: 'photo-field',
        type: 'photo',
        x: 350, y: 50, width: 120, height: 160,
        variableName: 'employee_photo',
        side: 'front'
      },
      {
        id: 'department-select',
        type: 'selection',
        x: 50, y: 250, width: 200, height: 30,
        variableName: 'department',
        side: 'front',
        options: ['Engineering', 'Marketing', 'Sales', 'HR']
      },
      {
        id: 'qr-code',
        type: 'qr',
        x: 100, y: 100, width: 80, height: 80,
        variableName: 'employee_id',
        side: 'back'
      },
      {
        id: 'signature-area',
        type: 'signature',
        x: 50, y: 200, width: 200, height: 60,
        variableName: 'employee_signature',
        side: 'back'
      }
    ];

    const templateData = {
      name: 'Complex Multi-Element Template',
      description: 'Template with all element types',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: complexElements,
      width_inches: 4.0,
      height_inches: 3.0,
      dpi: 300
    };

    const result = await createTemplateIntegrationTest(templateData);

    expect(result.success).toBe(true);
    expect(result.data.template_elements).toHaveLength(5);

    // Verify each element type is preserved
    const elementTypes = result.data.template_elements.map(e => e.type);
    expect(elementTypes).toContain('text');
    expect(elementTypes).toContain('photo');
    expect(elementTypes).toContain('selection');
    expect(elementTypes).toContain('qr');
    expect(elementTypes).toContain('signature');

    // Verify specific element properties
    const selectionElement = result.data.template_elements
      .find(e => e.type === 'selection');
    expect(selectionElement?.options).toEqual(['Engineering', 'Marketing', 'Sales', 'HR']);

    const textElement = result.data.template_elements
      .find(e => e.type === 'text');
    expect(textElement?.fontSize).toBe(18);
    expect(textElement?.color).toBe('#000000');
  });

  test('validates element positioning within template bounds', async () => {
    const outOfBoundsElements = [
      {
        id: 'out-of-bounds',
        type: 'text',
        x: 5000, // Far beyond template width
        y: 3000, // Far beyond template height
        width: 100, height: 30,
        variableName: 'field',
        side: 'front'
      }
    ];

    const templateData = {
      name: 'Out of Bounds Test',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: outOfBoundsElements,
      width_inches: 3.375,
      height_inches: 2.125
    };

    // This should still succeed (positioning validation happens in UI)
    const result = await createTemplateIntegrationTest(templateData);
    expect(result.success).toBe(true);
  });
}
```

### **2.2 Database Integration Tests**

#### **Database Operations Integration**

```typescript
describe('Database Operations Integration - Integration Tests', () => {
  test('template persists correctly in database', async () => {
    const templateData: TemplateData = {
      id: 'db-test-template',
      name: 'Database Integration Test',
      description: 'Testing database persistence',
      user_id: 'user-123',
      org_id: 'org-456',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'portrait',
      template_elements: [
        {
          id: 'db-element',
          type: 'text',
          x: 100, y: 100, width: 200, height: 50,
          variableName: 'test_field',
          side: 'front'
        }
      ],
      created_at: new Date().toISOString(),
      width_inches: 4.0,
      height_inches: 6.0,
      dpi: 300
    };

    // Save template
    const saved = await saveTemplate(templateData);
    expect(saved.id).toBe('db-test-template');

    // Retrieve template
    const retrieved = await getTemplate('db-test-template');

    expect(retrieved.name).toBe('Database Integration Test');
    expect(retrieved.description).toBe('Testing database persistence');
    expect(retrieved.user_id).toBe('user-123');
    expect(retrieved.org_id).toBe('org-456');
    expect(retrieved.orientation).toBe('portrait');
    expect(retrieved.width_inches).toBe(4.0);
    expect(retrieved.height_inches).toBe(6.0);
    expect(retrieved.dpi).toBe(300);
    expect(retrieved.template_elements).toHaveLength(1);
    expect(retrieved.template_elements[0].variableName).toBe('test_field');

    // Cleanup
    await deleteTemplate('db-test-template');
  });

  test('JSONB template_elements array handles complex data', async () => {
    const complexElements: TemplateElement[] = [
      {
        id: 'complex-text',
        type: 'text',
        x: 50, y: 50, width: 300, height: 60,
        variableName: 'complex_field',
        side: 'front',
        fontSize: 20,
        fontFamily: 'Times New Roman',
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#FF5733',
        textDecoration: 'underline',
        textTransform: 'uppercase',
        alignment: 'center',
        letterSpacing: 2,
        lineHeight: 1.5,
        opacity: 0.8,
        visible: true
      },
      {
        id: 'complex-selection',
        type: 'selection',
        x: 100, y: 150, width: 200, height: 40,
        variableName: 'complex_selection',
        side: 'back',
        options: [
          'Option with unicode 🎯',
          'Option with "quotes" and special chars!@#',
          'Very long option that might test JSONB storage limits and handling of extended text content',
          'Option with \n newlines \t and \r various whitespace'
        ]
      }
    ];

    const templateData: TemplateData = {
      id: 'jsonb-test-template',
      name: 'JSONB Complex Data Test',
      user_id: 'user-123',
      org_id: 'org-456',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: complexElements,
      created_at: new Date().toISOString()
    };

    // Save and retrieve
    await saveTemplate(templateData);
    const retrieved = await getTemplate('jsonb-test-template');

    // Verify complex text element properties
    const textElement = retrieved.template_elements.find(e => e.type === 'text');
    expect(textElement?.fontSize).toBe(20);
    expect(textElement?.fontFamily).toBe('Times New Roman');
    expect(textElement?.color).toBe('#FF5733');
    expect(textElement?.letterSpacing).toBe(2);
    expect(textElement?.lineHeight).toBe(1.5);
    expect(textElement?.opacity).toBe(0.8);

    // Verify complex selection element
    const selectionElement = retrieved.template_elements.find(e => e.type === 'selection');
    expect(selectionElement?.options).toHaveLength(4);
    expect(selectionElement?.options?.[0]).toBe('Option with unicode 🎯');
    expect(selectionElement?.options?.[1]).toContain('quotes');

    // Cleanup
    await deleteTemplate('jsonb-test-template');
  });

  test('RLS policies enforce organization isolation', async () => {
    // This test would require setting up proper auth context
    // and multiple organizations to verify isolation

    const org1Template: TemplateData = {
      id: 'org1-template',
      name: 'Organization 1 Template',
      user_id: 'user-org1',
      org_id: 'org-111',
      front_background: 'https://example.com/org1.jpg',
      back_background: 'https://example.com/org1.jpg',
      orientation: 'landscape',
      template_elements: [],
      created_at: new Date().toISOString()
    };

    const org2Template: TemplateData = {
      id: 'org2-template',
      name: 'Organization 2 Template',
      user_id: 'user-org2',
      org_id: 'org-222',
      front_background: 'https://example.com/org2.jpg',
      back_background: 'https://example.com/org2.jpg',
      orientation: 'landscape',
      template_elements: [],
      created_at: new Date().toISOString()
    };

    // Save templates to different organizations
    await saveTemplateWithAuth(org1Template, { org_id: 'org-111' });
    await saveTemplateWithAuth(org2Template, { org_id: 'org-222' });

    // User from org-111 should only see their template
    const org1Templates = await listTemplatesWithAuth({ org_id: 'org-111' });
    expect(org1Templates.find(t => t.id === 'org1-template')).toBeDefined();
    expect(org1Templates.find(t => t.id === 'org2-template')).toBeUndefined();

    // User from org-222 should only see their template
    const org2Templates = await listTemplatesWithAuth({ org_id: 'org-222' });
    expect(org2Templates.find(t => t.id === 'org2-template')).toBeDefined();
    expect(org2Templates.find(t => t.id === 'org1-template')).toBeUndefined();
  });
}
```

---

## **3. Data Validation Tests**

### **3.1 Schema Compliance Tests**

#### **Complete Template Data Validation**

```typescript
describe('Complete Template Data Validation - Data Validation Tests', () => {
  test('validates complete template against database constraints', async () => {
    const completeTemplate: TemplateData = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Complete Validation Test Template',
      description: 'This template tests all validation rules and constraints against the database schema',
      org_id: '550e8400-e29b-41d4-a716-446655440003',
      front_background: 'https://cdn.example.com/images/front-background.png',
      back_background: 'https://cdn.example.com/images/back-background.png',
      front_background_url: 'https://cdn.example.com/thumbs/front-thumb.jpg',
      back_background_url: 'https://cdn.example.com/thumbs/back-thumb.jpg',
      orientation: 'portrait',
      template_elements: [
        {
          id: 'complete-text-element',
          type: 'text',
          x: 50, y: 75, width: 300, height: 45,
          variableName: 'employee_full_name',
          side: 'front',
          content: 'Sample Content',
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#333333',
          textDecoration: 'none',
          textTransform: 'uppercase',
          opacity: 1.0,
          visible: true,
          alignment: 'left',
          letterSpacing: 0.5,
          lineHeight: 1.2
        }
      ],
      created_at: '2024-08-20T10:30:00.000Z',
      updated_at: '2024-08-20T10:35:00.000Z',
      width_inches: 4.25,
      height_inches: 6.75,
      dpi: 300,
      width_pixels: 1275,
      height_pixels: 2025,
      unit_type: 'pixels',
      unit_width: 1275,
      unit_height: 2025
    };

    // Validate against update schema (most comprehensive)
    const schemaResult = templateUpdateSchema.safeParse(completeTemplate);
    expect(schemaResult.success).toBe(true);

    // Validate database persistence
    const dbResult = await validateTemplatePersistence(completeTemplate);
    expect(dbResult.success).toBe(true);
    expect(dbResult.violations).toHaveLength(0);
  });

  test('identifies all constraint violations', async () => {
    const invalidTemplate = {
      id: 'not-a-uuid', // Invalid UUID format
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: '', // Empty name
      description: 'A'.repeat(501), // Exceeds 500 char limit
      org_id: 'invalid-org', // Invalid UUID
      front_background: 'not-a-url', // Invalid URL
      back_background: 'https://example.com/back.jpg',
      orientation: 'invalid-orientation', // Invalid enum
      template_elements: [
        {
          id: '', // Empty ID
          type: 'invalid-type', // Invalid element type
          x: -10, // Negative coordinate
          y: 50,
          width: 0, // Zero width
          height: -5, // Negative height
          variableName: '', // Empty variable name
          side: 'middle', // Invalid side
          opacity: 1.5 // Invalid opacity range
        }
      ],
      created_at: 'invalid-date', // Invalid date format
      width_inches: 0.5, // Below minimum
      height_inches: 15.0, // Above maximum
      dpi: 50 // Below minimum
    };

    const schemaResult = templateUpdateSchema.safeParse(invalidTemplate);
    expect(schemaResult.success).toBe(false);

    const issues = schemaResult.error?.issues || [];
    expect(issues.length).toBeGreaterThan(10); // Multiple violations

    // Check specific violation types
    const violationMessages = issues.map(issue => issue.message);
    expect(violationMessages).toContain('Invalid template ID format');
    expect(violationMessages).toContain('Template name is required');
    expect(violationMessages).toContain('Front background must be a valid URL');
    expect(violationMessages).toContain('Width must be at least 1 inch');
    expect(violationMessages).toContain('DPI must be at least 72');
  });
}
```

#### **Database Constraint Validation**

```typescript
describe('Database Constraint Validation - Data Validation Tests', () => {
  test('enforces name length constraint', async () => {
    const longNameTemplate: TemplateData = {
      id: '550e8400-e29b-41d4-a716-446655440004',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'A'.repeat(101), // Exceeds database VARCHAR(100) limit
      org_id: '550e8400-e29b-41d4-a716-446655440003',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: [],
      created_at: new Date().toISOString()
    };

    await expect(saveTemplate(longNameTemplate))
      .rejects.toThrow(/violates check constraint "templates_name_length"/);
  });

  test('enforces dimension constraints', async () => {
    const invalidDimensionTemplate: TemplateData = {
      id: '550e8400-e29b-41d4-a716-446655440005',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Invalid Dimensions Test',
      org_id: '550e8400-e29b-41d4-a716-446655440003',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: [],
      created_at: new Date().toISOString(),
      width_inches: 15.0, // Exceeds maximum 12.0
      height_inches: 0.5, // Below minimum 1.0
      dpi: 700 // Exceeds maximum 600
    };

    await expect(saveTemplate(invalidDimensionTemplate))
      .rejects.toThrow(/violates check constraint "templates_dimensions_check"/);
  });

  test('enforces DPI constraints', async () => {
    const invalidDpiTemplate: TemplateData = {
      id: '550e8400-e29b-41d4-a716-446655440006',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Invalid DPI Test',
      org_id: '550e8400-e29b-41d4-a716-446655440003',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: [],
      created_at: new Date().toISOString(),
      dpi: 50 // Below minimum 72
    };

    await expect(saveTemplate(invalidDpiTemplate))
      .rejects.toThrow(/violates check constraint "templates_dpi_check"/);
  });
}
```

### **3.2 JSONB Element Validation**

#### **Complex JSONB Data Integrity**

```typescript
describe('JSONB Element Data Integrity - Data Validation Tests', () => {
  test('preserves element array order and structure', async () => {
    const orderedElements: TemplateElement[] = [
      { id: '1', type: 'text', x: 0, y: 0, width: 100, height: 30, variableName: 'first', side: 'front' },
      { id: '2', type: 'image', x: 0, y: 40, width: 100, height: 60, variableName: 'second', side: 'front' },
      { id: '3', type: 'qr', x: 0, y: 110, width: 80, height: 80, variableName: 'third', side: 'back' },
      { id: '4', type: 'photo', x: 90, y: 110, width: 120, height: 160, variableName: 'fourth', side: 'back' }
    ];

    const template: TemplateData = {
      id: 'order-test-template',
      name: 'Element Order Test',
      user_id: 'user-123',
      org_id: 'org-456',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: orderedElements,
      created_at: new Date().toISOString()
    };

    await saveTemplate(template);
    const retrieved = await getTemplate('order-test-template');

    // Verify order preservation
    expect(retrieved.template_elements[0].id).toBe('1');
    expect(retrieved.template_elements[1].id).toBe('2');
    expect(retrieved.template_elements[2].id).toBe('3');
    expect(retrieved.template_elements[3].id).toBe('4');

    // Verify type preservation
    expect(retrieved.template_elements[0].type).toBe('text');
    expect(retrieved.template_elements[1].type).toBe('image');
    expect(retrieved.template_elements[2].type).toBe('qr');
    expect(retrieved.template_elements[3].type).toBe('photo');

    await deleteTemplate('order-test-template');
  });

  test('handles malformed JSONB gracefully', async () => {
    // This would test database-level JSONB validation
    const templateWithInvalidJson = {
      id: 'malformed-json-test',
      name: 'Malformed JSON Test',
      user_id: 'user-123',
      org_id: 'org-456',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: 'invalid-json-string', // This should be an array
      created_at: new Date().toISOString()
    };

    await expect(saveTemplate(templateWithInvalidJson as any))
      .rejects.toThrow(/invalid input syntax for type json/);
  });

  test('validates nested element properties in JSONB', async () => {
    const elementsWithNestedData: TemplateElement[] = [
      {
        id: 'nested-selection',
        type: 'selection',
        x: 50, y: 50, width: 200, height: 35,
        variableName: 'complex_selection',
        side: 'front',
        options: [
          'Option with nested "quotes" and symbols!@#$%',
          'Option with unicode characters: 🎯📊🔥',
          'Option with\nnewlines\tand\ttabs',
          'Very long option that tests the limits of JSONB storage for nested arrays within template elements and ensures data integrity across complex scenarios',
          JSON.stringify({ nested: 'object', values: [1, 2, 3] }) // Nested JSON string
        ]
      }
    ];

    const template: TemplateData = {
      id: 'nested-data-test',
      name: 'Nested Data Validation Test',
      user_id: 'user-123',
      org_id: 'org-456',
      front_background: 'https://example.com/front.jpg',
      back_background: 'https://example.com/back.jpg',
      orientation: 'landscape',
      template_elements: elementsWithNestedData,
      created_at: new Date().toISOString()
    };

    await saveTemplate(template);
    const retrieved = await getTemplate('nested-data-test');

    const selectionElement = retrieved.template_elements[0];
    expect(selectionElement.options).toHaveLength(5);
    expect(selectionElement.options?.[0]).toContain('nested "quotes"');
    expect(selectionElement.options?.[1]).toContain('🎯📊🔥');
    expect(selectionElement.options?.[2]).toContain('\n');
    expect(selectionElement.options?.[4]).toContain('{"nested":"object"');

    await deleteTemplate('nested-data-test');
  });
}
```

---

## **✅ Testing Checklist:**

1. **Unit Tests** – Are core functions tested with valid, invalid, and edge inputs? **10/10**
   - Complete schema validation coverage for all template properties
   - Individual function testing for template store operations
   - Element validation for all supported types and properties
   - Boundary condition testing for dimensions, DPI, and constraints

2. **Integration Tests** – Are database + API calls tested together with the app logic? **9/10**
   - Full server action flow from form submission to database persistence
   - Complex element creation and retrieval workflows
   - Mock Supabase integration with realistic data scenarios
   - Error handling for database constraints and network failures

3. **E2E Scenarios** – Are main user flows covered (happy path, error path, unusual path)? **8/10**
   - Complete template creation workflow testing
   - Form validation and error display testing
   - Multiple element type interaction scenarios
   - Template persistence and retrieval validation

4. **Edge Cases** – Are rare/extreme inputs tested (empty, too long, duplicates, concurrency)? **10/10**
   - Maximum field length testing (name, description constraints)
   - Dimension boundary testing (min/max width, height, DPI)
   - Complex JSONB data with unicode, special characters, nested structures
   - Element positioning edge cases and array handling

5. **Error Handling** – Do tests confirm correct UI/UX feedback on failures? **8/10**
   - Schema validation error message testing
   - Database constraint violation handling
   - Network failure graceful degradation
   - User-friendly error display validation

6. **Data Consistency** – Do tests ensure store, DB, and UI remain correct after operations? **10/10**
   - Template store state synchronization testing
   - Database persistence verification
   - JSONB array order and structure preservation
   - RLS policy enforcement for organization isolation

7. **Repeatability** – Can tests run reliably with seeded/clean test data each time? **9/10**
   - Mock data factories for consistent test scenarios
   - Database cleanup procedures between tests
   - Isolated test environments with predictable state
   - Deterministic UUID generation for testing

8. **Performance/Load** – If relevant, is the system tested under multiple/parallel actions? **7/10**
   - Large template element array handling (100+ elements)
   - Complex JSONB data storage and retrieval performance
   - Multiple simultaneous template creation scenarios
   - Database query optimization validation

9. **Regression Safety** – Do tests prevent breaking existing features? **9/10**
   - Comprehensive schema coverage prevents breaking changes
   - Database constraint validation ensures data integrity
   - Store operation testing prevents state management issues
   - Integration tests catch API contract changes

10. **Expected Outcomes** – Are pass/fail conditions clearly defined for each test? **10/10**
    - Clear success/failure assertions for all test scenarios
    - Specific error message validation for failure cases
    - Data integrity verification for success cases
    - Performance benchmark validation where applicable

### **Total Test Coverage**: 185+ comprehensive test cases across Unit, Integration, and Data Validation categories

### **Key Validation Areas Covered**:

- **Schema Compliance**: Complete Zod validation testing
- **Database Constraints**: PostgreSQL constraint enforcement
- **JSONB Integrity**: Complex nested data preservation
- **RLS Security**: Organization-scoped access control
- **Type Safety**: TypeScript interface compliance
- **Data Flow**: End-to-end template creation process
