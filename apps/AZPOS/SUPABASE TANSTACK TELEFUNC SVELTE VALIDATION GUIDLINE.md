# Supabase Schema-First Data Flow Validation Guideline

## 1. Purpose

This guideline ensures **Supabase schema serves as the single source of truth** for all data flow implementations across the application stack. Every Telefunc function, TypeScript schema, data hook, and component must conform to the database schema definitions.

---

## 2. File Structure & Validation Process Overview

### 2.1 Expected File Structure

For each feature, the following files must exist and conform to schema:

|Layer|Directory|File Pattern|Example|
|---|---|---|---|
|**Server Telefuncs**|`src/lib/server/telefuncs/`|`[feature].telefunc.ts`|`inventory.telefunc.ts`|
|**TypeScript Schemas**|`src/lib/types/`|`[feature].schema.ts`|`inventory.schema.ts`|
|**Data Hooks**|`src/lib/data/`|`[feature].ts`|`inventory.ts`|
|**Components**|`src/lib/components/`|`*.svelte`|`ProductList.svelte`|
|**Routes**|`src/routes/`|`*.svelte`|`+page.svelte`|

### 2.2 File Structure Example (Inventory Feature)

```
src/
├── lib/
│   ├── server/
│   │   └── telefuncs/
│   │       └── inventory.telefunc.ts          # onGetProducts, onUpdateStock, etc.
│   ├── types/
│   │   └── inventory.schema.ts                # Product, InventoryItem schemas
│   ├── data/
│   │   └── inventory.ts                       # useProducts, useInventoryAlerts hooks
│   └── components/
│       ├── inventory/
│       │   ├── ProductList.svelte            # Product listing component
│       │   ├── StockAdjustment.svelte        # Stock adjustment form
│       │   └── InventoryAlerts.svelte        # Alert notifications
│       └── ui/
│           └── DataTable.svelte              # Reusable table component
└── routes/
    ├── inventory/
    │   ├── +page.svelte                      # Main inventory page
    │   ├── +page.ts                          # Data prefetching
    │   ├── products/
    │   │   ├── +page.svelte                  # Products listing
    │   │   └── [id]/
    │   │       └── +page.svelte              # Product detail view
    │   └── alerts/
    │       └── +page.svelte                  # Alerts management
    └── +layout.ts                            # Global data prefetching
```

### 2.3 Validation Process Flow

For each feature, validate the complete data flow:

```
Supabase Schema → Telefunc Functions → TypeScript Schemas → Data Hooks → Components
```

---

## 3. Schema Reference Analysis

### 3.1 Table Identification

For the chosen feature, identify ALL related tables from the Supabase schema:

- **Primary tables** (main entity tables)
- **Junction tables** (many-to-many relationships)
- **Related tables** (foreign key references)
- **Dependent tables** (tables that reference the primary tables)

### 3.2 Column Mapping

For each identified table, document:

- **Column names and types** (exact spelling and casing)
- **Constraints** (NOT NULL, DEFAULT values, CHECK constraints)
- **Enums** (all possible enum values)
- **Relationships** (foreign keys and their references)
- **Computed fields** (fields with DEFAULT expressions)
- **Indexes and unique constraints**

### 3.3 Function & Trigger Analysis

Document database functions and triggers that affect the feature:

- **Trigger functions** and when they execute
- **Custom functions** and their purposes
- **RLS policies** and their implications

---

## 4. File-by-File Validation Checklist

### 4.1 Telefunc Functions (`src/lib/server/telefuncs/[feature].telefunc.ts`)

**Schema Conformance Checklist:**

- [ ]  All function names follow `on[Action][Entity]` pattern
- [ ]  All database table names match Supabase schema exactly
- [ ]  All column names match Supabase schema exactly (case-sensitive)
- [ ]  All enum values used match Supabase enum definitions exactly
- [ ]  Foreign key relationships are properly validated
- [ ]  RLS policies are considered (user context checking)
- [ ]  Database triggers are accounted for in business logic
- [ ]  Input validation covers all required NOT NULL fields
- [ ]  Default values are handled consistently with database defaults
- [ ]  Computed fields are not manually set (let database handle them)

**Function Documentation Requirements:**

- [ ]  Purpose and workflow described
- [ ]  Input parameters mapped to schema columns
- [ ]  Output structure documented
- [ ]  Database tables accessed listed
- [ ]  Columns used vs. unused documented
- [ ]  Error scenarios handled
- [ ]  Business rules implemented

### 4.2 TypeScript Schemas (`src/lib/types/[feature].schema.ts`)

**Schema Conformance Checklist:**

- [ ]  All Zod schemas match database column types exactly
- [ ]  Enum schemas include ALL database enum values
- [ ]  Required/optional fields match database NOT NULL constraints
- [ ]  Default values match database DEFAULT expressions
- [ ]  String length validations match database column constraints
- [ ]  Numeric constraints match database precision/scale
- [ ]  Date/timestamp types properly handled
- [ ]  Foreign key relationships typed correctly
- [ ]  Union types used for enums match database enums exactly

**Type Export Requirements:**

- [ ]  Input types for each Telefunc function
- [ ]  Output types for each Telefunc function
- [ ]  Database entity types
- [ ]  Filtered/paginated response types
- [ ]  Enum types exported separately

### 4.3 Data Hooks (`src/lib/data/[feature].ts`)

**Schema Conformance Checklist:**

- [ ]  Query keys reference correct table/entity names
- [ ]  TanStack Query types match Telefunc return types
- [ ]  Error handling covers database constraint violations
- [ ]  Cache invalidation considers related tables
- [ ]  Optimistic updates respect database relationships
- [ ]  Loading states handled appropriately

**Hook Structure Requirements:**

- [ ]  Stable query key factory implemented
- [ ]  All CRUD operations covered where needed
- [ ]  Derived stores return correct data types
- [ ]  Error states properly exposed
- [ ]  Loading states properly exposed

### 4.4 Components (`*.svelte` files)

**Schema Conformance Checklist:**

- [ ]  Form fields match database column requirements
- [ ]  Validation messages reference actual column constraints
- [ ]  Enum dropdowns include all database enum values
- [ ]  Display formatting matches database types
- [ ]  Error handling covers database-specific errors
- [ ]  Loading states prevent invalid operations

---

## 5. Documentation Template: [FEATURE]_DATA_FLOW_[YYYYMMDD].md

> **Note**: Replace `[YYYYMMDD]` with today's date in format YYYYMMDD (e.g., 20250801 for August 1, 2025)

markdown

```markdown
# [FEATURE_NAME]_DATA_FLOW.md

## Database Schema Overview
### Tables Involved
- **Primary Tables**: [list]
- **Related Tables**: [list]
- **Junction Tables**: [list]

### Key Relationships
[Document foreign key relationships]

### Enums Used
[List all enums with their values]

### Triggers & Functions
[Document relevant database functions]

## Telefunc Functions Analysis

### Function: on[Action][Entity]
- **Purpose**: [describe workflow]
- **Tables Accessed**: [list tables]
- **Columns Used**: [list used columns]
- **Columns Unused**: [list unused columns with reasons]
- **Input Validation**: [describe validation logic]
- **Business Rules**: [describe implemented rules]
- **Error Scenarios**: [list handled errors]
- **Schema Compliance**: ✅/❌ [status]

## Schema Compliance Summary
- **Tables Covered**: [X/Y]
- **Columns Utilized**: [X/Y]
- **Enums Implemented**: [X/Y]
- **RLS Policies Considered**: ✅/❌
- **Triggers Accounted For**: ✅/❌

## Recommendations
[List any improvements needed]

## Unused Schema Elements
[Document unused tables/columns and explain why]
```

---

## 6. Validation Commands

### 6.1 Pre-Validation Setup

1. Extract all table definitions for the feature
2. List all related enums
3. Identify all relevant functions/triggers
4. Map all foreign key relationships

### 6.2 File-by-File Validation

1. **Telefunc Validation**: Check each function against schema
2. **Type Validation**: Ensure TypeScript types match database types
3. **Hook Validation**: Verify data flow consistency
4. **Component Validation**: Check UI matches schema constraints

### 6.3 Cross-Reference Validation

1. **Type Consistency**: Same types used across all layers
2. **Enum Consistency**: Same enum values across all files
3. **Relationship Consistency**: Foreign keys properly handled
4. **Error Consistency**: Database errors properly surfaced

---

## 7. Success Criteria

A feature's data flow is considered **validated** when:

- [ ]  All Telefunc functions conform to database schema
- [ ]  All TypeScript types match database column types exactly
- [ ]  All enums include complete database enum values
- [ ]  All foreign key relationships are properly handled
- [ ]  All database constraints are reflected in validation
- [ ]  All triggers/functions are accounted for in business logic
- [ ]  RLS policies are properly considered
- [ ]  Error scenarios are properly handled
- [ ]  Documentation is complete and accurate

---

## 8. Red Flags (Immediate Fixes Required)

- ❌ Column names don't match database (case sensitivity)
- ❌ Enum values missing or incorrect
- ❌ Foreign key relationships not validated
- ❌ Required fields not marked as required
- ❌ Database defaults not respected
- ❌ Triggers not accounted for in business logic
- ❌ RLS policies ignored
- ❌ Type mismatches between layers