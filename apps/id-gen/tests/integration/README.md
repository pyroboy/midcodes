# Template Update Integration Tests

## Overview

This directory contains comprehensive integration tests for template update functionality in the ID-Gen application. The tests directly interact with the Supabase database to verify all aspects of template modification, validation, and data consistency.

## Test Files

- **`template-update.integration.test.ts`** - Main test suite with 7 categories of tests
- **`template-update.config.ts`** - Test configuration and utilities
- **`Test-01-Aug22-Template-Update-Integration.md`** - Detailed test specification document

## Prerequisites

1. **Environment Variables**: Create a `.env.test` file with:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Dependencies**: Ensure you have the required packages:
   ```bash
   npm install vitest @supabase/supabase-js uuid
   npm install --save-dev @types/uuid
   ```

3. **Database Access**: The tests require service role access to the Supabase database for:
   - Creating test data
   - Performing CRUD operations
   - Cleaning up test data

## Running the Tests

### Run All Template Update Tests
```bash
npm run test tests/integration/template-update.integration.test.ts
```

### Run Specific Test Categories
```bash
# Basic template updates
npm run test tests/integration/template-update.integration.test.ts -t "Category 1"

# Element modifications
npm run test tests/integration/template-update.integration.test.ts -t "Category 2"

# Validation and error handling
npm run test tests/integration/template-update.integration.test.ts -t "Category 3"

# Permission and access control
npm run test tests/integration/template-update.integration.test.ts -t "Category 4"

# Concurrent updates
npm run test tests/integration/template-update.integration.test.ts -t "Category 5"

# Bulk operations
npm run test tests/integration/template-update.integration.test.ts -t "Category 6"

# Performance and edge cases
npm run test tests/integration/template-update.integration.test.ts -t "Category 7"
```

### Run with Debug Output
```bash
npm run test tests/integration/template-update.integration.test.ts -- --reporter=verbose
```

## Test Categories

### Category 1: Basic Template Updates
Tests fundamental template property updates including:
- Simple field updates (name, dimensions, DPI)
- Background image updates
- Orientation changes
- Timestamp management

### Category 2: Template Element Modifications
Tests template element array operations:
- Adding new elements of all types
- Updating element properties
- Removing elements
- Side management (front/back)

### Category 3: Validation and Error Handling
Tests data validation and error scenarios:
- Schema validation
- Element validation
- Data integrity checks
- Error message verification

### Category 4: Permission and Access Control
Tests role-based access control:
- Role-based update permissions
- Template ownership validation
- Cross-organization access restrictions
- Admin override scenarios

### Category 5: Concurrent Updates and Race Conditions
Tests handling of simultaneous operations:
- Simultaneous template updates
- Element array race conditions
- Conflict resolution
- Data consistency under concurrent load

### Category 6: Bulk Operations
Tests batch operations:
- Multiple template updates
- Template duplication
- Bulk data modifications
- Transaction consistency

### Category 7: Performance and Edge Cases
Tests performance and complex scenarios:
- Large element array performance
- Complex element structures
- Unicode and special character handling
- Memory and processing limits

## Test Data Management

### Automatic Test Data Seeding
The tests automatically create:
- 2 test organizations
- 5 test user profiles with different roles
- 2 sample templates with various elements

### Data Isolation
- Tests use real database tables (not mocked)
- Each test run creates fresh test data
- Automatic cleanup after all tests complete
- Unique UUIDs prevent data conflicts

### Test Users
- **Super Admin**: Full system access
- **Org Admin**: Organization-scoped access
- **ID Gen Admin**: Template management access
- **ID Gen User**: Limited template access
- **Other Org User**: Cross-organization test user

## Performance Benchmarks

The tests include performance assertions:
- Template update: < 500ms
- Bulk updates (10 templates): < 2 seconds
- Element array modification: < 200ms
- Large element arrays (100 elements): < 2 seconds

## Troubleshooting

### Common Issues

1. **Service Role Key Missing**
   ```
   Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required
   ```
   Solution: Add the service role key to your `.env.test` file

2. **Database Connection Timeout**
   ```
   Error: Failed to connect to Supabase
   ```
   Solution: Check network connection and service key validity

3. **Permission Denied**
   ```
   Error: Permission denied for relation templates
   ```
   Solution: Verify service role key has correct permissions

4. **Test Data Conflicts**
   ```
   Error: duplicate key value violates unique constraint
   ```
   Solution: Ensure proper test cleanup or use fresh database instance

### Debug Mode
Set the log level to debug in the test config:
```typescript
export const defaultConfig: TestConfig = {
  // ...
  logLevel: 'debug'
};
```

## Database Schema Dependencies

The tests expect these database tables to exist:
- `organizations`
- `profiles` 
- `templates`
- `idcards`

With the relationships defined in the database types file.

## Contributing

When adding new test scenarios:

1. Follow the existing category structure
2. Include proper cleanup in test setup/teardown
3. Add performance assertions for new operations
4. Update this README with new test descriptions
5. Ensure tests are independent and can run in any order

## Test Data Cleanup

The test suite includes comprehensive cleanup:
- Automatic cleanup after all tests complete
- Cleanup on test failure (configurable)
- Verification of complete cleanup
- No test data leakage between runs

## Integration with CI/CD

For continuous integration:
1. Set `SUPABASE_SERVICE_ROLE_KEY` in CI environment
2. Run tests against dedicated test database
3. Include cleanup verification in test pipeline
4. Monitor test performance benchmarks