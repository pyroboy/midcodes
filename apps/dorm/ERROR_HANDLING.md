# Error Handling Guide

## Overview

This document describes the consistent error handling system implemented across the dorm application. The system provides standardized error types, logging, and response formatting to ensure consistent error handling throughout the application.

## Key Files

- `/src/lib/utils/errors.ts` - Core error utilities and types
- `/src/lib/utils/errorHandlers.ts` - Pre-built handlers for common scenarios

## Core Concepts

### Error Types

All errors in the application are classified using standardized error codes:

```typescript
enum ErrorCode {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED,
  FORBIDDEN,
  PERMISSION_DENIED,

  // Validation (400)
  VALIDATION_ERROR,
  INVALID_INPUT,
  DUPLICATE_ENTRY,
  CONSTRAINT_VIOLATION,

  // Resource Errors (404, 409, 410)
  RESOURCE_NOT_FOUND,
  CONFLICT,

  // Business Logic (422)
  BUSINESS_RULE_VIOLATION,
  INVALID_STATE,

  // Database (500)
  DATABASE_ERROR,
  QUERY_FAILED,

  // Internal (500)
  INTERNAL_ERROR,
  UNKNOWN_ERROR
}
```

### AppError Interface

All errors follow this standardized structure:

```typescript
interface AppError {
  code: ErrorCode;           // Error classification
  message: string;            // User-friendly message
  status: number;             // HTTP status code (400-599)
  details?: string;           // Technical details (not shown to users)
  context?: ErrorContext;     // Contextual information
  originalError?: unknown;    // Original error if any
}
```

### Error Context

Errors can include context for better debugging:

```typescript
interface ErrorContext {
  userId?: string;
  userRole?: string;
  resourceId?: string | number;
  resourceType?: string;
  action?: string;
  metadata?: Record<string, any>;
  path?: string;
}
```

## Usage Patterns

### 1. Authentication & Authorization

#### Check Authentication

```typescript
import { requireAuth } from '$lib/utils/errorHandlers';

export const load = async ({ locals: { safeGetSession } }) => {
  const session = await safeGetSession();

  // Throws 401 if not authenticated
  requireAuth(session, { action: 'load_data' });

  // Continue with authenticated logic
};
```

#### Check Role

```typescript
import { requireRole } from '$lib/utils/errorHandlers';

// Ensure user has required role
requireRole(
  userRole,
  ['super_admin', 'property_admin'],
  { userId: session.user.id, action: 'create_expense' }
);
```

#### Check Permission

```typescript
import { requirePermission } from '$lib/utils/errorHandlers';

// Ensure user has specific permission
requirePermission(
  permissions,
  'tenants.write',
  { userId: session.user.id }
);
```

### 2. Database Operations

#### Execute Query

```typescript
import { executeQuery } from '$lib/utils/errorHandlers';

const data = await executeQuery(
  supabase.from('expenses').select('*'),
  {
    resourceType: 'expense',
    errorMessage: 'Failed to load expenses',
    context: { userId: session.user.id, action: 'load_expenses' }
  }
);
```

#### Query Single Record

```typescript
import { querySingle } from '$lib/utils/errorHandlers';

const expense = await querySingle(
  supabase,
  'expenses',
  expenseId,
  {
    resourceType: 'expense',
    context: { userId: session.user.id }
  }
);
```

#### Insert Record

```typescript
import { executeInsert } from '$lib/utils/errorHandlers';

const newExpense = await executeInsert(
  supabase,
  'expenses',
  {
    property_id: 1,
    amount: 1000,
    description: 'Monthly rent',
    created_by: session.user.id
  },
  {
    resourceType: 'expense',
    errorMessage: 'Failed to create expense',
    context: { userId: session.user.id, action: 'create' }
  }
);
```

#### Update Record

```typescript
import { executeUpdate } from '$lib/utils/errorHandlers';

const updated = await executeUpdate(
  supabase,
  'expenses',
  expenseId,
  { amount: 1200 },
  {
    resourceType: 'expense',
    errorMessage: 'Failed to update expense',
    context: { userId: session.user.id, resourceId: expenseId }
  }
);
```

#### Delete Record

```typescript
import { executeDelete } from '$lib/utils/errorHandlers';

await executeDelete(
  supabase,
  'expenses',
  expenseId,
  {
    resourceType: 'expense',
    context: { userId: session.user.id, resourceId: expenseId }
  }
);
```

#### Soft Delete Record

```typescript
import { executeSoftDelete } from '$lib/utils/errorHandlers';

await executeSoftDelete(
  supabase,
  'tenants',
  tenantId,
  {
    resourceType: 'tenant',
    context: { userId: session.user.id, resourceId: tenantId }
  }
);
```

### 3. Form Validation

#### Handle Validation Errors

```typescript
import { handleValidationError } from '$lib/utils/errorHandlers';

const form = await superValidate(request, zod(schema));

if (!form.valid) {
  return handleValidationError(
    form,
    'Please check the form for errors',
    undefined,
    { userId: session.user.id, action: 'create_expense' }
  );
}
```

#### Validate Required Fields

```typescript
import { validateRequired } from '$lib/utils/errorHandlers';

validateRequired(
  formData,
  ['name', 'email', 'property_id'],
  { userId: session.user.id, action: 'create_tenant' }
);
```

#### Check for Duplicates

```typescript
import { checkDuplicate } from '$lib/utils/errorHandlers';

await checkDuplicate(
  supabase,
  'tenants',
  'email',
  email,
  excludeId, // Optional: exclude this ID from check (for updates)
  { userId: session.user.id, action: 'create_tenant' }
);
```

#### Validate Amount

```typescript
import { validateAmount } from '$lib/utils/errorHandlers';

validateAmount(
  paymentAmount,
  billingBalance,
  {
    userId: session.user.id,
    action: 'create_payment',
    metadata: { billingId }
  }
);
```

#### Validate Date Range

```typescript
import { validateDateRange } from '$lib/utils/errorHandlers';

validateDateRange(
  startDate,
  endDate,
  {
    userId: session.user.id,
    action: 'create_lease',
    metadata: { leaseId }
  }
);
```

### 4. Error Responses

#### Throw Error (navigates to error page)

```typescript
import { throwError, createNotFoundError } from '$lib/utils/errors';

// Throws and navigates to error page
throwError(
  createNotFoundError('tenant', tenantId, {
    userId: session.user.id
  })
);
```

#### Fail Response (stays on same page)

```typescript
import { failWithError, createValidationError } from '$lib/utils/errors';

// Returns fail response, stays on page
return failWithError(
  createValidationError('Invalid email format', undefined, {
    userId: session.user.id
  }),
  form
);
```

#### JSON Error Response (for APIs)

```typescript
import { jsonError, createInternalError } from '$lib/utils/errors';

// Returns JSON error response
return jsonError(
  createInternalError('Upload failed', err, {
    action: 'upload_image'
  })
);
```

### 5. Error Recovery

#### Retry with Exponential Backoff

```typescript
import { withRetry } from '$lib/utils/errors';

const result = await withRetry(
  async () => {
    return await fetchExternalAPI();
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (err, attempt) => {
      // Only retry on network errors
      return err instanceof NetworkError;
    }
  }
);
```

#### Rollback on Failure

```typescript
import { withRollback } from '$lib/utils/errors';

const result = await withRollback(
  async () => {
    // Main operation
    await createPayment();
    await updateBilling();
  },
  async () => {
    // Rollback operation
    await deletePayment();
  },
  { userId: session.user.id, action: 'create_payment' }
);
```

### 6. Audit Logging

```typescript
import { logAuditEvent } from '$lib/utils/errorHandlers';

// Logs audit event (doesn't fail the operation)
await logAuditEvent(supabase, {
  action: 'expense_created',
  user_id: session.user.id,
  user_role: userRole,
  details: { expense_id: result.id, amount: 1000 }
});
```

## Migration Guide

### Before (Inconsistent)

```typescript
export const load = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const { data, error: queryError } = await supabase
    .from('expenses')
    .select('*');

  if (queryError) {
    console.error('Error:', queryError);
    throw error(500, 'Failed to load expenses');
  }

  return { expenses: data };
};
```

### After (Consistent)

```typescript
import { requireAuth, executeQuery } from '$lib/utils/errorHandlers';

export const load = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();

  // Clear authentication check
  requireAuth(session, { action: 'load_expenses' });

  // Consistent error handling with context
  const expenses = await executeQuery(
    supabase.from('expenses').select('*'),
    {
      resourceType: 'expense',
      errorMessage: 'Failed to load expenses',
      context: { userId: session.user.id, action: 'load_expenses' }
    }
  );

  return { expenses };
};
```

## Best Practices

### 1. Always Provide Context

```typescript
// ❌ Bad: No context
throwError(createNotFoundError('tenant', tenantId));

// ✅ Good: Include context
throwError(
  createNotFoundError('tenant', tenantId, {
    userId: session.user.id,
    action: 'load_tenant',
    path: '/tenants/[id]'
  })
);
```

### 2. Use Appropriate Error Types

```typescript
// ❌ Bad: Generic error for specific cases
throw error(500, 'Something went wrong');

// ✅ Good: Specific error type
throwError(
  createBusinessRuleError(
    'Payment amount exceeds billing balance',
    undefined,
    { billingId, amount, balance }
  )
);
```

### 3. Don't Expose Internal Details

```typescript
// ❌ Bad: Exposes database structure
return fail(500, {
  message: 'foreign key constraint "fk_tenant_lease" violated'
});

// ✅ Good: User-friendly message
return failWithError(
  createBusinessRuleError(
    'Cannot delete tenant with active leases',
    'Foreign key constraint violated', // Technical details (logged)
    { tenantId }
  )
);
```

### 4. Log Audit Events for Critical Operations

```typescript
// Always log audit events for:
// - Financial transactions
// - Data modifications
// - Permission changes
// - Security-sensitive operations

await executeInsert(supabase, 'payments', paymentData, options);

await logAuditEvent(supabase, {
  action: 'payment_created',
  user_id: session.user.id,
  user_role: userRole,
  details: { payment_id: result.id, amount, billing_id }
});
```

### 5. Handle Errors at the Right Level

```typescript
// ❌ Bad: Silently swallow errors
try {
  await updateExpense();
} catch (err) {
  console.error(err); // User never sees the error
}

// ✅ Good: Propagate or handle appropriately
try {
  await updateExpense();
} catch (err) {
  return failWithError(
    createInternalError('Failed to update expense', err, context),
    form
  );
}
```

## Error Logging

All errors are automatically logged with:
- Timestamp
- Error code and message
- HTTP status
- Context information
- Stack trace (for server errors)
- Original error details

Logs can be viewed in:
- Development: Console
- Production: Log aggregation service (future: Sentry, LogRocket, etc.)

## Testing Error Handling

When writing tests, you can verify error handling:

```typescript
import { expect, test } from 'vitest';
import { createValidationError } from '$lib/utils/errors';

test('validates required fields', async () => {
  const error = createValidationError(
    'Email is required',
    undefined,
    { userId: 'test-user' }
  );

  expect(error.code).toBe('VALIDATION_ERROR');
  expect(error.status).toBe(400);
  expect(error.message).toBe('Email is required');
});
```

## Common Pitfalls

### 1. Catching Without Re-throwing

```typescript
// ❌ Bad
try {
  await operation();
} catch (err) {
  console.error(err);
  // Error is lost!
}

// ✅ Good
try {
  await operation();
} catch (err) {
  return failWithError(createInternalError('Operation failed', err), form);
}
```

### 2. Using Generic Error Messages

```typescript
// ❌ Bad
throw error(500, 'Error');

// ✅ Good
throwError(
  createDatabaseError('Failed to create tenant', err, {
    userId: session.user.id,
    action: 'create_tenant'
  })
);
```

### 3. Not Including User Context

```typescript
// ❌ Bad
throwError(createNotFoundError('tenant', tenantId));

// ✅ Good
throwError(
  createNotFoundError('tenant', tenantId, {
    userId: session.user.id,
    action: 'load_tenant'
  })
);
```

## Future Enhancements

- Integration with Sentry for error tracking
- Error rate monitoring and alerting
- User-facing error feedback improvements
- Retry strategies for transient failures
- Circuit breaker pattern for external services

## Questions?

For questions or suggestions about error handling, please:
1. Check this documentation
2. Review existing implementations in `/src/routes/expenses/` and `/src/routes/api/upload-image/`
3. Consult `/src/lib/utils/errors.ts` for all available utilities
