# Spec-40-Aug21-TEMPLATES-LEGACY-COLUMNS-REMOVAL.md

## Senior Software Engineer Specification Process

### Step 1 – Requirement Extraction

**Core Requirements:**
- Remove unnecessary legacy columns from `templates` table in both `public` and `test_integration` schemas
- Migrate any remaining dependencies from legacy columns to modern pixel-based dimensions
- Update TypeScript types and Zod schemas to reflect the simplified structure
- Ensure test_integration schema mirrors public schema changes
- Maintain backward compatibility during migration period

**Identified Unnecessary Columns:**
- `unit_type` - Legacy field, replaced by pixel-based workflow
- `unit_width` - Legacy field, replaced by `width_pixels`
- `unit_height` - Legacy field, replaced by `height_pixels`

### Step 2 – Context Awareness

**Technology Stack:**
- **Svelte 5 + SvelteKit** - Frontend framework
- **Supabase** - Database with RLS policies
- **TypeScript** - Type safety with generated database types
- **Zod** - Schema validation

**Database Schemas:**
- `public` schema - Production data
- `test_integration` schema - Integration testing mirror

### Step 3 – Spec Expansion

#### Data Flow Analysis

**Current State:**
```sql
-- public.templates (16 columns)
id, user_id, name, front_background, back_background, orientation, 
created_at, updated_at, template_elements, org_id, width_pixels, 
height_pixels, dpi, unit_type, unit_width, unit_height

-- test_integration.templates (16 columns)  
id, user_id, org_id, name, front_background, back_background, 
orientation, template_elements, width_pixels, height_pixels, 
dpi, unit_type, unit_width, unit_height, created_at, updated_at
```

**Target State:**
```sql
-- public.templates (13 columns) - Remove 3 legacy columns
id, user_id, name, front_background, back_background, orientation,
created_at, updated_at, template_elements, org_id, width_pixels,
height_pixels, dpi

-- test_integration.templates (13 columns) - Mirror public schema
id, user_id, org_id, name, front_background, back_background,
orientation, template_elements, width_pixels, height_pixels,
dpi, created_at, updated_at
```

#### State Handling Changes

**Template Store (`templateStore.ts:41-55`)**
- Remove `unit_type`, `unit_width`, `unit_height` from TemplateStoreData interface
- Update default values to only use pixel dimensions
- Remove fallback logic to legacy unit fields

**Template Types (`types.ts:41-55`)**
- Remove legacy fields from TemplateData interface
- Ensure consistent pixel-based dimensions

**Schema Updates**
- `template-creation.schema.ts:88-90` - Remove optional legacy fields
- `template-update.schema.ts:17-19` - Remove optional legacy fields

#### Function-level Behavior

**Migration Dependencies:**
1. `src/routes/all-ids/+page.server.ts:85-96` - Currently falls back to `unit_width`, `unit_height`, `unit_type`
2. `src/routes/templates/+page.svelte:147-151` - Uses legacy fields as fallback

**Error Handling:**
- Graceful handling if legacy data exists during migration
- Clear error messages for missing pixel dimensions
- Validation to ensure pixel dimensions are present

#### Database & API Calls

**Migration SQL Steps:**
1. Migrate any remaining legacy data to pixel format
2. Update existing records with missing pixel dimensions
3. Drop legacy columns from both schemas
4. Update RLS policies if affected

**Supabase Queries to Update:**
- Template selection queries to remove legacy column references
- Template creation/update operations
- Type generation refresh

#### Dependencies

**File Dependencies:**
- Database types regeneration via Supabase CLI
- Template-related schema files
- Template store and component updates
- Integration test data updates

**External Dependencies:**
- Supabase MCP for database operations
- Testing framework updates

### Step 4 – Implementation Guidance

#### High-level Code Strategy

**Phase 1: Data Migration**
1. Create migration to populate missing pixel dimensions from legacy data
2. Verify all templates have required pixel dimensions
3. Create backup of existing data

**Phase 2: Code Updates**
1. Update TypeScript interfaces and types
2. Remove legacy field references from Zod schemas
3. Update component logic to only use pixel dimensions
4. Remove fallback logic to legacy fields

**Phase 3: Database Schema Changes**
1. Drop legacy columns from public schema
2. Mirror changes in test_integration schema
3. Refresh generated TypeScript types
4. Update RLS policies if needed

**Phase 4: Testing & Validation**
1. Run integration tests to verify functionality
2. Test template creation and update flows
3. Verify no runtime errors from removed fields
4. Validate test_integration schema mirrors public

#### Best Practices

**Error Handling:**
- Log any templates with missing pixel dimensions before migration
- Provide clear error messages if migration fails
- Implement rollback strategy if needed

**Performance:**
- Batch process large template migrations
- Use indexes on org_id for efficient queries
- Monitor query performance after column removal

**Maintainability:**
- Remove all legacy field references in single PR
- Update documentation to reflect pixel-only approach
- Add validation to prevent legacy field usage

#### Assumptions & Constraints

**Assumptions:**
- All templates can be converted to pixel-based dimensions
- No external systems depend on legacy unit fields
- Test data can be regenerated or migrated
- Current pixel dimensions are accurate and complete

**Constraints:**
- Must maintain template functionality during migration
- Cannot lose existing template data
- Test_integration schema must exactly mirror public schema
- Migration must be reversible if issues arise

### Step 5 – Implementation Plan

#### Step-by-Step Implementation

**Step 1: Pre-migration Analysis**
- Audit all templates for missing pixel dimensions
- Identify templates using only legacy unit fields
- Create data migration strategy for incomplete records

**Step 2: Code Preparation**
- Update TypeScript interfaces to remove legacy fields
- Remove legacy fields from Zod schemas  
- Update components to use only pixel dimensions
- Remove fallback logic to unit_* fields

**Step 3: Database Migration**
- Apply migration to populate missing pixel data
- Verify all templates have width_pixels, height_pixels, dpi
- Create migration to drop legacy columns
- Apply same changes to test_integration schema

**Step 4: Testing & Validation**
- Regenerate database types from Supabase
- Run unit and integration tests
- Verify template creation/editing workflows
- Test ID card generation from templates

#### Files/Components Affected

**Schema Files:**
- `src/lib/schemas/template-creation.schema.ts`
- `src/lib/schemas/template-update.schema.ts`
- `src/lib/types/database.types.ts` (regenerated)

**Store & Types:**
- `src/lib/stores/templateStore.ts`
- `src/lib/types/types.ts`

**Components:**
- `src/routes/templates/+page.svelte`
- `src/routes/all-ids/+page.server.ts`

**Database:**
- `public.templates` table
- `test_integration.templates` table

#### Migration Strategy

**Data Migration SQL:**
```sql
-- Step 1: Populate missing pixel dimensions (if needed)
UPDATE public.templates 
SET width_pixels = COALESCE(width_pixels, unit_width * 
  CASE unit_type 
    WHEN 'inches' THEN dpi 
    ELSE 1 
  END),
height_pixels = COALESCE(height_pixels, unit_height * 
  CASE unit_type 
    WHEN 'inches' THEN dpi 
    ELSE 1 
  END)
WHERE width_pixels IS NULL OR height_pixels IS NULL;

-- Step 2: Drop legacy columns
ALTER TABLE public.templates 
DROP COLUMN IF EXISTS unit_type,
DROP COLUMN IF EXISTS unit_width, 
DROP COLUMN IF EXISTS unit_height;

-- Step 3: Mirror in test_integration
ALTER TABLE test_integration.templates 
DROP COLUMN IF EXISTS unit_type,
DROP COLUMN IF EXISTS unit_width,
DROP COLUMN IF EXISTS unit_height;
```

### Step 6 – Testing Strategy

#### Unit Tests
- Test template creation with pixel-only dimensions
- Validate Zod schemas reject legacy fields
- Test template store initialization without legacy fields

#### Integration Tests
- Test template CRUD operations through Supabase
- Verify template rendering with pixel dimensions
- Test ID card generation from updated templates

#### E2E Tests  
- Test complete template creation workflow
- Verify template editing interface works correctly
- Test ID generation from modified templates

#### Edge Cases
- Templates with missing pixel dimensions
- Very large or small pixel values
- Migration with existing template data
- Schema synchronization between public and test_integration

### Step 7 – Database Schema Details

#### Current Templates Table Structure

**Public Schema:**
```sql
public.templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  front_background text,
  back_background text,  
  orientation text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  template_elements jsonb NOT NULL,
  org_id uuid,
  width_pixels integer,
  height_pixels integer,
  dpi integer DEFAULT 300,
  unit_type varchar DEFAULT 'pixels', -- REMOVE
  unit_width numeric,                 -- REMOVE  
  unit_height numeric                 -- REMOVE
)
```

**Test Integration Schema:**
```sql
test_integration.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid NOT NULL,
  name text NOT NULL,
  front_background text,
  back_background text,
  orientation text,
  template_elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  width_pixels integer,
  height_pixels integer,
  dpi integer,
  unit_type varchar,  -- REMOVE
  unit_width numeric, -- REMOVE
  unit_height numeric,-- REMOVE  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

#### Target Schema Structure

**Simplified Templates Table:**
```sql
-- Both public and test_integration schemas
templates (
  id uuid PRIMARY KEY,
  user_id uuid,
  org_id uuid [NOT NULL in test_integration],
  name text NOT NULL,
  front_background text,
  back_background text,
  orientation text,
  template_elements jsonb NOT NULL,
  width_pixels integer,
  height_pixels integer, 
  dpi integer DEFAULT 300,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
)
```

#### TypeScript Interface Updates

**Before:**
```typescript
interface TemplateStoreData {
  // ... other fields
  width_pixels?: number;
  height_pixels?: number;
  unit_type?: string;    // REMOVE
  unit_width?: number;   // REMOVE  
  unit_height?: number;  // REMOVE
}
```

**After:**
```typescript
interface TemplateStoreData {
  // ... other fields
  width_pixels: number;  // Required
  height_pixels: number; // Required
  dpi: number;          // Required
}
```

### Step 8 – Output Checklist (Mandatory)

✅ **Checklist:**

1. **UI Changes** – Minor cosmetic adjustments to remove legacy field displays (Complexity: 2/10)
2. **UX Changes** – Minor interaction tweaks to use pixel-only workflow (Complexity: 3/10) 
3. **Data Handling** – Significant modifications to database schema and Supabase queries (Complexity: 7/10)
4. **Function Logic** – Important business logic updates to remove legacy field dependencies (Complexity: 6/10)
5. **ID/Key Consistency** – Ensure stable unique IDs/keys remain consistent across state, DB, and UI (Complexity: 3/10)

**Total Implementation Complexity: 6/10** - Moderate complexity due to database schema changes and legacy code removal, but well-defined scope and clear migration path.