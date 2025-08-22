# Test-01-Aug22-Template-Update-Integration.md

## Template Update Integration Test Specification

### Overview
Comprehensive integration test suite for template update functionality in the ID-Gen application, covering all aspects of template modification, validation, and data consistency.

### Database Schema Analysis

#### Templates Table Structure
```typescript
interface Template {
  id: string; // UUID primary key
  name: string; // Template name (1-100 chars)
  user_id: string | null; // FK to profiles table
  org_id: string | null; // FK to organizations table
  width_pixels: number | null; // Template width
  height_pixels: number | null; // Template height
  dpi: number | null; // Print resolution
  orientation: string | null; // 'landscape' | 'portrait'
  template_elements: Json; // Array of TemplateElement objects
  front_background: string | null; // Background image URL
  back_background: string | null; // Background image URL
  created_at: string | null; // ISO datetime
  updated_at: string | null; // ISO datetime
}
```

#### TemplateElement Interface
```typescript
interface TemplateElement {
  id: string; // UUID
  type: 'text' | 'image' | 'qr' | 'photo' | 'signature' | 'selection';
  x: number; // Position X (pixels, min 0)
  y: number; // Position Y (pixels, min 0)
  width: number; // Width (pixels, min 1)
  height: number; // Height (pixels, min 1)
  side: 'front' | 'back';
  variableName: string; // Variable identifier
  visible: boolean; // Element visibility
  opacity: number; // 0-1 opacity
  // Type-specific properties based on element type
}
```

#### Organizations and Profiles Tables
```typescript
interface Organization {
  id: string; // UUID primary key
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

interface Profile {
  id: string; // UUID primary key
  email: string | null;
  org_id: string | null; // FK to organizations
  role: 'super_admin' | 'org_admin' | 'id_gen_admin' | 'id_gen_user' | null;
  card_generation_count: number;
  template_count: number;
  unlimited_templates: boolean;
  remove_watermarks: boolean;
  credits_balance: number;
  context: Json | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### Test Environment Setup

#### Test Schema Creation
```sql
-- Mirror production tables to test_integration schema for isolated testing
CREATE SCHEMA IF NOT EXISTS test_integration;

-- Copy table structures
CREATE TABLE test_integration.organizations AS SELECT * FROM public.organizations WHERE 1=0;
CREATE TABLE test_integration.profiles AS SELECT * FROM public.profiles WHERE 1=0;
CREATE TABLE test_integration.templates AS SELECT * FROM public.templates WHERE 1=0;
CREATE TABLE test_integration.idcards AS SELECT * FROM public.idcards WHERE 1=0;

-- Copy constraints and indexes
-- (Implementation to be added in actual test setup)
```

#### Test Data Seeding Strategy
```typescript
interface TestData {
  organizations: Organization[];
  profiles: Profile[];
  templates: Template[];
  testUsers: {
    superAdmin: Profile;
    orgAdmin: Profile;
    idGenAdmin: Profile;
    idGenUser: Profile;
    otherOrgUser: Profile;
  };
}
```

### Test Categories and Scenarios

## Test Category 1: Basic Template Updates

### Test 1.1: Simple Field Updates
**Scenario**: Update template name, dimensions, and basic properties
**Data**: Single template with text elements
**Test Steps**:
1. Seed test template with original values
2. Update template name: "Test Template" → "Updated Template Name"
3. Update dimensions: 800x600 → 1000x700
4. Update DPI: 300 → 600
5. Verify database consistency
6. Verify updated_at timestamp change

**Expected Results**:
- Template updated successfully
- All fields reflect new values
- updated_at timestamp is current
- created_at timestamp unchanged
- All relationships preserved

### Test 1.2: Background Image Updates
**Scenario**: Update front and back background images
**Test Steps**:
1. Create template with no backgrounds
2. Add front background URL
3. Add back background URL
4. Update both backgrounds to new URLs
5. Remove backgrounds (set to null)

**Expected Results**:
- Background URLs properly stored and updated
- Null values handled correctly
- No impact on template elements

### Test 1.3: Orientation Changes
**Scenario**: Change template orientation with dimension validation
**Test Steps**:
1. Create landscape template (1000x600)
2. Change to portrait orientation
3. Verify dimension consistency
4. Test invalid orientation value

**Expected Results**:
- Valid orientations accepted
- Invalid orientations rejected
- Dimensions remain consistent

## Test Category 2: Template Element Modifications

### Test 2.1: Add New Elements
**Scenario**: Add various element types to existing template
**Test Steps**:
1. Start with empty template
2. Add text element with full typography settings
3. Add image element with positioning
4. Add QR code element
5. Add photo placeholder
6. Add signature field
7. Add selection dropdown

**Expected Results**:
- All element types added successfully
- Element IDs properly generated
- Element positions validated
- Element properties correctly stored

### Test 2.2: Update Element Properties
**Scenario**: Modify existing element properties
**Test Steps**:
1. Create template with multiple elements
2. Update text element: font, size, color, content
3. Update image element: source, fit, border radius
4. Update QR element: content, error correction
5. Reposition elements (x, y coordinates)
6. Resize elements (width, height)

**Expected Results**:
- Element properties updated correctly
- Type-specific validations enforced
- Position and size constraints respected

### Test 2.3: Remove Elements
**Scenario**: Delete elements from template
**Test Steps**:
1. Create template with 5 different elements
2. Remove middle element
3. Remove first element
4. Remove last element
5. Verify element array integrity

**Expected Results**:
- Elements removed from template_elements array
- No orphaned references
- Array indexing remains valid
- Template still functional

### Test 2.4: Element Side Management
**Scenario**: Manage elements on front vs back sides
**Test Steps**:
1. Add elements to front side
2. Add elements to back side
3. Move element from front to back
4. Verify side-specific rendering

**Expected Results**:
- Elements correctly assigned to sides
- Side changes properly handled
- No elements on invalid sides

## Test Category 3: Validation and Error Handling

### Test 3.1: Schema Validation
**Scenario**: Test all validation rules
**Test Steps**:
1. Test name validation (empty, too long, special chars)
2. Test dimension validation (negative, zero, too large)
3. Test DPI validation (invalid values)
4. Test element position validation (negative coordinates)
5. Test color format validation (invalid hex, RGB)
6. Test URL validation for backgrounds

**Expected Results**:
- Invalid data rejected with appropriate errors
- Error messages are descriptive
- Valid edge cases accepted
- Database integrity maintained

### Test 3.2: Template Element Validation
**Scenario**: Validate element-specific constraints
**Test Steps**:
1. Test text element font size limits
2. Test image element URL validation
3. Test QR code content limits
4. Test selection element options validation
5. Test variable name uniqueness
6. Test element overlap detection (optional)

**Expected Results**:
- Element constraints enforced
- Type-specific validations work
- Cross-element validations function
- Meaningful error messages provided

### Test 3.3: Data Integrity Validation
**Scenario**: Ensure data consistency
**Test Steps**:
1. Test template_elements JSON structure
2. Verify element ID uniqueness
3. Test variable name conflicts
4. Validate element positioning within bounds
5. Test element dependency handling

**Expected Results**:
- JSON structure maintained
- No duplicate IDs
- Consistent variable naming
- Elements within template bounds

## Test Category 4: Permission and Access Control

### Test 4.1: Role-Based Update Permissions
**Scenario**: Test update permissions by role
**Test Steps**:
1. Super admin updates any template
2. Org admin updates org templates
3. ID gen admin updates org templates
4. ID gen user attempts template update
5. Cross-organization access attempts

**Expected Results**:
- Super admin: full access
- Org admin: org-scoped access
- ID gen admin: org-scoped access
- ID gen user: no update access
- Cross-org access denied

### Test 4.2: Template Ownership Validation
**Scenario**: Verify ownership-based access
**Test Steps**:
1. User A creates template
2. User B (same org) attempts update
3. User C (different org) attempts update
4. Admin override scenarios

**Expected Results**:
- Creator can update template
- Same-org access based on role
- Cross-org access properly restricted
- Admin overrides work correctly

## Test Category 5: Concurrent Updates and Race Conditions

### Test 5.1: Simultaneous Updates
**Scenario**: Handle concurrent template modifications
**Test Steps**:
1. Two users update same template simultaneously
2. One updates name, other updates elements
3. Both attempt element array modifications
4. Verify last-write-wins or conflict resolution

**Expected Results**:
- Database consistency maintained
- No data corruption
- Appropriate conflict handling
- User feedback on conflicts

### Test 5.2: Element Array Race Conditions
**Scenario**: Concurrent element modifications
**Test Steps**:
1. User A adds element to array
2. User B removes different element
3. User C reorders elements
4. Verify array integrity

**Expected Results**:
- Array modifications handled safely
- No lost elements
- Consistent ordering
- Proper error handling

## Test Category 6: Bulk Operations

### Test 6.1: Multiple Template Updates
**Scenario**: Update multiple templates in batch
**Test Steps**:
1. Create 10 test templates
2. Bulk update names with prefix
3. Bulk update dimensions
4. Bulk archive/unarchive
5. Handle partial failures

**Expected Results**:
- Batch operations complete successfully
- Partial failure handling
- Transaction consistency
- Performance within limits

### Test 6.2: Template Duplication
**Scenario**: Create copies of existing templates
**Test Steps**:
1. Duplicate template with all elements
2. Modify duplicate independently
3. Verify original unchanged
4. Test bulk duplication

**Expected Results**:
- Perfect copies created
- Independent modification
- Original preservation
- Efficient duplication process

## Test Category 7: Data Migration and Compatibility

### Test 7.1: Schema Evolution
**Scenario**: Handle template format changes
**Test Steps**:
1. Load templates with old element format
2. Update with new features
3. Verify backward compatibility
4. Test format migration

**Expected Results**:
- Old formats supported
- New features accessible
- Smooth migration process
- Data preservation

### Test 7.2: Element Type Evolution
**Scenario**: Handle new element types
**Test Steps**:
1. Add new element type to template
2. Update existing element to new type
3. Verify type validation
4. Test type-specific features

**Expected Results**:
- New types properly handled
- Type conversions work
- Validation updated
- Feature compatibility

## Test Implementation Framework

### Test Setup Function
```typescript
async function setupTestEnvironment() {
  // Create test schema
  await createTestSchema();
  
  // Seed test data
  const testData = await seedTestData();
  
  // Setup test users with different roles
  const testUsers = await createTestUsers();
  
  return { testData, testUsers };
}
```

### Test Cleanup Function
```typescript
async function cleanupTestEnvironment() {
  // Clear test data
  await clearTestData();
  
  // Reset sequences
  await resetSequences();
  
  // Verify cleanup
  await verifyCleanup();
}
```

### Test Data Verification
```typescript
async function verifyTemplateUpdate(
  templateId: string,
  expectedChanges: Partial<Template>
) {
  const template = await getTemplate(templateId);
  
  // Verify direct field changes
  Object.keys(expectedChanges).forEach(key => {
    expect(template[key]).toEqual(expectedChanges[key]);
  });
  
  // Verify timestamp updates
  expect(new Date(template.updated_at)).toBeCloseTo(new Date(), 5000);
  
  // Verify element integrity
  if (template.template_elements) {
    verifyElementIntegrity(template.template_elements);
  }
  
  return template;
}
```

### Performance Benchmarks
- Template update: < 500ms
- Bulk updates (10 templates): < 2s
- Element array modification: < 200ms
- Permission check: < 100ms

### Test Data Cleanup Strategy
1. Use test_integration schema for isolation
2. Seed known test data before each test
3. Clean up after each test completion
4. Verify no test data leakage
5. Reset auto-increment sequences

### Success Criteria
1. **Functional Tests**: All update operations work correctly
2. **Data Integrity**: No data corruption or loss
3. **Performance**: Operations complete within time limits
4. **Security**: Proper access control enforcement
5. **Reliability**: Consistent results across runs
6. **Error Handling**: Graceful failure modes

### Testing Tools and Libraries
- **Supabase Client**: Direct database operations
- **Testing Framework**: Vitest with supertest
- **Assertions**: Expect with custom matchers
- **Test Data**: Factory pattern for data generation
- **Cleanup**: Automated schema cleanup

This comprehensive test specification covers all major aspects of template updates with detailed scenarios for each category. The implementation will ensure robust, reliable template update functionality.