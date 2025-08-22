# ID Generation App - Test Suite

This directory contains comprehensive tests for the ID Generation application, covering all critical functionality and edge cases.

## Test Structure

### **Unit Tests** (`/tests/unit/`)
Focused tests for individual components and functions:

- **`auth-session.test.ts`** - Authentication & JWT token handling
- **`concurrent-user-actions.test.ts`** - Race conditions & concurrent operations
- **`credit-*.test.ts`** - Credit system functionality (10 files)
- **`fileValidation.test.ts`** - File upload validation & Supabase Storage
- **`multi-tenant-isolation-extension.test.ts`** - Template & ID card isolation
- **`organization*.test.ts`** - Organization management (3 files) 
- **`rbac-centralized.test.ts`** - Role-based access control matrix
- **`state-management.test.ts`** - Svelte store management
- **`template*.test.ts`** - Template creation & management (6 files)
- **`threlte-rendering.test.ts`** - 3D rendering & texture handling
- **`webgl-context-recovery.test.ts`** - WebGL context loss recovery

### **Integration Tests** (`/tests/integration/`)
Cross-system functionality tests:

- **`feature-integration.test.ts`** - Complete workflows across multiple features
- **`template-update.integration.test.ts`** - Template update operations
- **`templateCreation.supabase.test.ts`** - Database integration

### **Edge Cases** (`/tests/edge-cases/`)
Boundary condition and error scenario tests:

- **`templateCreation.edge.test.ts`** - Template creation edge cases

### **Test Utilities** (`/tests/utils/`)
Shared testing infrastructure:

- **`test-helpers.ts`** - Comprehensive testing utilities
- **`TestDataManager.ts`** - Test data lifecycle management
- **`organization-factories.ts`** - Organization test data factories
- **`creditTestUtils.ts`** - Credit system test utilities
- **`bypassTestUtils.ts`** - Permission bypass utilities

## Test Categories by Feature

### **🔐 Authentication & Security**
- Session management and JWT token lifecycle
- Multi-tenant data isolation
- Role-based access control (4 roles × 15 permissions)
- Cross-organization security boundaries

### **📋 Template Management** 
- Template CRUD operations
- Element positioning and validation
- Template-to-ID card workflows
- Concurrent template editing

### **🆔 ID Card Generation**
- Card generation from templates
- File upload and storage integration
- 3D rendering and texture management
- WebGL context recovery

### **💳 Credit System**
- Credit balance management
- Transaction history and isolation
- Payment bypass configurations
- Credit deduction workflows

### **🏢 Organization Management**
- Multi-tenant data isolation
- Organization-scoped operations
- Cross-organization access prevention
- Storage path enforcement

### **⚡ Performance & Reliability**
- Concurrent user operations
- Race condition handling
- Memory leak prevention
- High-load stability testing

## Running Tests

### **All Tests**
```bash
npm run test
```

### **Unit Tests Only**
```bash
npm run test:unit
```

### **Integration Tests Only**
```bash
npm run test:integration
```

### **Specific Feature Tests**
```bash
# Credit system tests
npm run test:credits

# Template tests
npm run test -- --run tests/unit/template*.test.ts

# Authentication tests  
npm run test -- --run tests/unit/auth*.test.ts
```

### **Watch Mode**
```bash
npm run test:credits:watch
```

## Test Quality Standards

### **Coverage Requirements**
- **Unit Tests**: >90% function coverage
- **Integration Tests**: All critical workflows
- **Edge Cases**: All identified breaking points

### **Test Categorization**
- **🔴 Critical**: Security, data integrity, multi-tenancy
- **🟡 Important**: Performance, error handling, edge cases  
- **🟢 Standard**: UI components, validation, utilities

### **Performance Benchmarks**
- Unit tests: <100ms each
- Integration tests: <5s each
- High-load tests: <30s total

## Key Testing Patterns

### **Data Isolation Testing**
```typescript
// Verify organization scoping
expect(ValidationHelpers.isOrganizationScoped(data, orgId)).toBe(true);

// Assert cross-organization prevention
AssertionHelpers.expectOrganizationIsolation(results, orgId);
```

### **Permission Testing**
```typescript
// Validate role permissions
expect(ValidationHelpers.hasRequiredPermissions(role, permissions)).toBe(true);

// Test route protection
expect(() => requirePermissions(perms)(role)).not.toThrow();
```

### **Concurrent Operation Testing**
```typescript
// Simulate race conditions
const results = await Promise.allSettled([operation1, operation2]);

// Measure performance under load
const { time } = await PerformanceHelpers.measureExecutionTime(operation);
```

### **File Upload Testing**
```typescript
// Validate file constraints
expect(ValidationHelpers.isValidFileUpload(file)).toBe(true);

// Test organization-scoped storage
expect(storagePath.startsWith(`${orgId}/`)).toBe(true);
```

## Critical Test Scenarios

### **Must-Pass Tests**
1. **Multi-tenant isolation** - No cross-organization data leakage
2. **Authentication flows** - Session handling and JWT validation  
3. **Permission boundaries** - Role-based access enforcement
4. **Template workflows** - Complete template → ID card generation
5. **Concurrent operations** - Race condition safety

### **Performance Tests**
1. **WebGL recovery** - Context loss handling <100ms
2. **File uploads** - Large file handling <5s
3. **Concurrent users** - 50+ simultaneous operations
4. **Memory usage** - No leaks during extended operations

### **Security Tests**
1. **Organization boundaries** - Cross-tenant access prevention
2. **File path validation** - Directory traversal prevention
3. **Permission escalation** - Role manipulation prevention
4. **Data sanitization** - Input validation and XSS prevention

## Debugging Test Failures

### **Common Issues**
- **Database cleanup**: Ensure `testDataManager.cleanupAll()` in `afterEach`
- **Mock timing**: Use `vi.clearAllMocks()` in `beforeEach`  
- **Async operations**: Always `await` database operations
- **Organization IDs**: Verify test data uses consistent org scoping

### **Debug Commands**
```bash
# Verbose test output
npm run test -- --reporter=verbose

# Single test debugging
npm run test -- --run tests/unit/specific.test.ts

# Watch mode for development
npm run test:unit -- --watch
```

## Test Maintenance

### **Adding New Tests**
1. Use `TestDataFactory` for consistent test data
2. Follow existing naming conventions
3. Add to appropriate category (unit/integration/edge-cases)
4. Include performance assertions for critical paths
5. Document any special setup requirements

### **Updating Tests**
1. Maintain backward compatibility when possible
2. Update shared utilities rather than duplicating code
3. Verify organization isolation in all data operations
4. Add regression tests for reported bugs

### **Test Dependencies**
- **Vitest**: Test runner and assertions
- **Testing Library**: Component testing utilities
- **MSW**: API mocking (if needed)
- **Test Data Manager**: Custom test data lifecycle
- **Supabase**: Database operations in tests

## Continuous Integration

Tests run automatically on:
- **Pull requests**: All unit and integration tests
- **Main branch**: Full test suite including performance tests
- **Releases**: Extended test suite with load testing

Quality gates:
- **All tests pass**: Required for merge
- **Coverage >90%**: Required for critical modules
- **Performance benchmarks**: Must meet established thresholds
- **Security tests**: Must pass for any auth/permission changes