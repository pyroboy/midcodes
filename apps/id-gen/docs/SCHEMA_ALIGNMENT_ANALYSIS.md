# Schema Alignment Analysis Report

## Executive Summary

**Status: CRITICAL MISMATCHES FOUND**

The database schema and TypeScript type definitions have significant alignment issues that need immediate attention. The primary issues are:

1. **Missing ID-Gen Tables** in primary database types file
2. **Incomplete Column Definitions** in existing table types
3. **Missing New Columns** in several core tables
4. **Type Mismatches** between database and TypeScript definitions

## Detailed Analysis

### Database Tables (Actual Schema)

#### Templates Table ✅ MOSTLY ALIGNED
**Database Columns:**
- `id` (uuid, NOT NULL, uuid_generate_v4())
- `user_id` (uuid, nullable)
- `name` (text, NOT NULL)
- `front_background` (text, nullable)
- `back_background` (text, nullable)
- `orientation` (text, nullable)
- `created_at` (timestamptz, CURRENT_TIMESTAMP)
- `updated_at` (timestamptz, CURRENT_TIMESTAMP)
- `template_elements` (jsonb, NOT NULL)
- `org_id` (uuid, nullable)
- `width_pixels` (integer, nullable)
- `height_pixels` (integer, nullable)
- `dpi` (integer, nullable, default 300)
- `unit_type` (varchar(10), nullable, default 'pixels')
- `unit_width` (numeric(10,3), nullable)
- `unit_height` (numeric(10,3), nullable)

**Missing in Types:**
- `width_pixels`
- `height_pixels`
- `dpi`
- `unit_type`
- `unit_width`
- `unit_height`

#### IDCards Table ❌ COMPLETELY MISSING
**Database Columns:**
- `id` (uuid, NOT NULL, uuid_generate_v4())
- `template_id` (uuid, nullable, FK to templates.id)
- `front_image` (text, nullable)
- `back_image` (text, nullable)
- `data` (jsonb, nullable)
- `created_at` (timestamptz, now())
- `org_id` (uuid, NOT NULL, FK to organizations.id)

**TypeScript Status:** MISSING ENTIRELY

#### Organizations Table ✅ ALIGNED

#### Profiles Table ⚠️ PARTIAL MISMATCH
**Database Columns:**
- `id` (uuid, NOT NULL)
- `email` (text, nullable)
- `role` (user_role enum, default 'user')
- `created_at` (timestamptz, now())
- `updated_at` (timestamptz, now())
- `org_id` (uuid, nullable)
- `context` (jsonb, default '{}')
- `credits_balance` (integer, NOT NULL, default 0)
- `card_generation_count` (integer, NOT NULL, default 0)
- `template_count` (integer, NOT NULL, default 0)
- `unlimited_templates` (boolean, NOT NULL, default false)
- `remove_watermarks` (boolean, NOT NULL, default false)

**Missing in Types:**
- `credits_balance`
- `card_generation_count`
- `template_count`
- `unlimited_templates`
- `remove_watermarks`

**Mismatched Types:**
- `role`: Should be enum `user_role`, not string

### TypeScript Type Files Analysis

#### Primary Issues with `/src/lib/types/database.types.ts`:
1. **Missing Tables**: `templates`, `idcards` entirely absent
2. **Incomplete Profiles**: Missing 5 new columns
3. **Wrong Enums**: Has comprehensive enum definition but not used in profiles
4. **Outdated Structure**: Contains mostly property/rental management tables

#### Secondary File `/src/lib/types/database.ts`:
1. **Better Coverage**: Has templates table definition
2. **Outdated Profiles**: Missing new columns, wrong role type
3. **Missing IDCards**: No idcards table definition
4. **No Enums**: Missing user_role enum definition

### Critical Missing Definitions

#### IDCards Table (Completely Missing)
```typescript
idcards: {
  Row: {
    id: string;
    template_id: string | null;
    front_image: string | null;
    back_image: string | null;
    data: Record<string, any> | null;
    created_at: string;
    org_id: string;
  };
  Insert: {
    id?: string;
    template_id?: string | null;
    front_image?: string | null;
    back_image?: string | null;
    data?: Record<string, any> | null;
    created_at?: string;
    org_id: string;
  };
  Update: {
    id?: string;
    template_id?: string | null;
    front_image?: string | null;
    back_image?: string | null;
    data?: Record<string, any> | null;
    created_at?: string;
    org_id?: string;
  };
};
```

### Database Relationships (Foreign Keys)

✅ **Properly Configured:**
- `idcards.template_id → templates.id`
- `idcards.org_id → organizations.id`
- `templates.org_id → organizations.id`
- `profiles.org_id → organizations.id`
- `templates.user_id → auth.users.id` (Supabase auth)
- `profiles.id → auth.users.id` (Supabase auth)

### Enum Definitions

**Database Enum `user_role`:**
- `'super_admin'`
- `'org_admin'`
- `'user'`
- `'event_admin'`
- `'event_qr_checker'`
- `'property_admin'`
- `'property_manager'`
- `'property_accountant'`
- `'property_maintenance'`
- `'property_utility'`
- `'property_frontdesk'`
- `'property_tenant'`
- `'property_guest'`
- `'id_gen_admin'`
- `'id_gen_user'`

## Recommendations

### Immediate Actions Required

1. **Update Primary Database Types** (`database.types.ts`):
   - Add complete `templates` table definition with all columns
   - Add complete `idcards` table definition
   - Update `profiles` table with new columns and correct role enum
   - Use proper `user_role` enum type

2. **Consolidate Type Files**:
   - Choose primary type file (recommend `database.types.ts`)
   - Remove duplicate `database.ts` file after merging definitions
   - Ensure all imports use primary type file

3. **Generate Fresh Types**:
   - Use Supabase CLI to generate types: `npx supabase gen types typescript`
   - Validate generated types match actual database schema
   - Update all imports across codebase

4. **Schema Migration**:
   - If any columns are truly missing in database, create migration
   - Verify all foreign key constraints are properly indexed
   - Add any missing RLS policies for new columns

### Quality Assurance

- **Test Type Safety**: Compile TypeScript to verify no type errors
- **Verify CRUD Operations**: Test all database operations with new types
- **Check Component Usage**: Update any components using old type definitions
- **RLS Policy Review**: Ensure all new columns have appropriate security policies

## Impact Assessment

**High Priority**: Application will fail TypeScript compilation and runtime errors will occur when:
- Accessing `idcards` table (completely missing types)
- Using new profile columns (credits, counts, flags)
- Working with template dimensions and units
- Performing type-safe database operations

**Medium Priority**: Development experience issues:
- IntelliSense not working for missing properties
- No compile-time safety for new database columns
- Potential runtime errors in production

This analysis indicates the schema alignment needs immediate attention before any production deployments.