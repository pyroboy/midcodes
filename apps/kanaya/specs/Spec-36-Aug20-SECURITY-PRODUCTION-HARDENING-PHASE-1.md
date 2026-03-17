# Spec-36-Aug20-SECURITY-PRODUCTION-HARDENING-PHASE-1

## Requirement Extraction

Remove security vulnerabilities from production deployment by eliminating debug routes, sanitizing production logs, securing file uploads, and implementing basic security headers. Current codebase exposes sensitive authentication data, provides unrestricted debug access, and lacks fundamental security protections.

**Critical Security Issues (Priority 1)**:

1. **Debug Route Exposure**: `/debug-user` accessible in production without proper admin guards
2. **Sensitive Data Logging**: JWT tokens, user metadata logged in production console
3. **File Upload Security**: Image uploads lack size/type validation and security checks
4. **Missing Security Headers**: No CSP, HSTS, or security middleware implementation

## Context Awareness

**Tech Stack**: SvelteKit + Supabase + Vercel deployment
**Security Surface**: Authentication flows, file uploads, admin routes, user data handling
**Current Risk Level**: MODERATE - No known exploits but significant exposure

**Vulnerable Code Locations**:

- `hooks.server.ts`: JWT token logging (lines 25, 27)
- `routes/debug-user/`: Unrestricted debug route
- File upload components: Missing validation
- `app.html`: No security headers

## Technical Specification

### Data Flow - Security Pipeline

```
Request → Security Headers Check → Authentication → Authorization → Rate Limiting → Route Handler
```

### State Handling - Secure Logging

```typescript
// Replace sensitive logging with sanitized versions
interface SanitizedLogContext {
	userId: string;
	roleLevel: 'admin' | 'user' | 'guest';
	timestamp: Date;
	// NO raw JWT tokens or metadata
}
```

### Function-Level Behavior

**1. Remove Sensitive Logging**:

```typescript
// Current (VULNERABLE)
console.log('USER_METADATA:', user.user_metadata);
console.log('USERROLES:', decodedToken?.user_roles);

// Fixed (SECURE)
logger.info('User authenticated', {
	userId: user.id,
	hasRoles: Boolean(decodedToken?.user_roles?.length)
	// No sensitive data exposed
});
```

**2. Secure Debug Routes**:

```typescript
// Add admin-only protection
export async function load({ locals }) {
	const { session, supabase } = locals;

	if (!session || !session.user) {
		throw redirect(302, '/auth');
	}

	// Only super_admin can access debug routes
	const profile = await getUserProfile(session.user.id, supabase);
	if (profile?.role !== 'super_admin') {
		throw error(403, 'Admin access required');
	}

	// Continue with debug functionality...
}
```

**3. File Upload Validation**:

```typescript
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFileUpload(file: File): { valid: boolean; error?: string } {
	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		return { valid: false, error: 'Invalid file type' };
	}

	if (file.size > MAX_FILE_SIZE) {
		return { valid: false, error: 'File too large' };
	}

	return { valid: true };
}
```

### Database & API Security

**Supabase RLS Enhancement**:

- Verify all tables have proper RLS policies
- Add audit logging for sensitive operations
- Implement row-level access controls for file uploads

### Dependencies

- **helmet**: Security headers middleware
- **rate-limiter-flexible**: Rate limiting protection
- **file-type**: MIME type validation

## Implementation Plan

### Step 1: Remove Sensitive Logging (30 minutes)

**Files to Update**:

- `src/hooks.server.ts` - Remove JWT and metadata logging
- `src/lib/components/BackgroundThumbnail.svelte` - Remove debug console logs
- `src/routes/templates/+page.svelte` - Remove debug response logging

**Pattern**:

```typescript
// Find and remove
console.log('USER_METADATA:', ...);
console.log('USERROLES:', ...);
console.log('🚨 DEBUG:', ...);

// Replace with sanitized versions
logger.info('Authentication event', { userId, timestamp });
```

### Step 2: Secure Debug Routes (20 minutes)

**Files to Update**:

- `src/routes/debug-user/+page.server.ts` - Add admin guard
- Any other debug routes found

**Implementation**:

```typescript
// Add to all debug route +page.server.ts files
export async function load({ locals }) {
	await requireAuth(locals, 'super_admin');
	// ... rest of debug functionality
}
```

### Step 3: File Upload Security (45 minutes)

**Files to Update**:

- Create `src/lib/utils/fileValidation.ts`
- Update upload components to use validation
- Add server-side validation in API routes

**Security Checks**:

```typescript
export function validateImageUpload(file: File) {
  // File type validation
  // File size limits
  // File name sanitization
  // Magic number verification (not just extension)
  return { valid: boolean, error?: string, sanitizedName?: string };
}
```

### Step 4: Basic Security Headers (15 minutes)

**Files to Update**:

- `src/hooks.server.ts` - Add security headers
- `vercel.json` - Add Vercel security headers

**Headers to Add**:

```typescript
event.setHeaders({
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
});
```

## Best Practices

### Security Logging Standards

```typescript
// GOOD - Sanitized logging
logger.info('Template created', {
	templateId: template.id,
	userId: user.id,
	organizationId: user.org_id
});

// BAD - Sensitive data exposure
console.log('Full user object:', user);
console.log('JWT token:', session.access_token);
```

### Error Handling Security

```typescript
// Don't expose internal errors to users
try {
	await sensitiveOperation();
} catch (error) {
	logger.error('Internal operation failed', { error, context });
	throw new Error('Operation failed. Please try again.'); // Generic message
}
```

## Assumptions & Constraints

### Assumptions

1. Vercel deployment allows custom headers
2. Current authentication flow can be modified safely
3. File upload functionality won't break with validation
4. Debug routes are not needed in production

### Constraints

1. Cannot break existing user authentication
2. Must maintain current API compatibility
3. Changes must be backward compatible
4. No breaking changes to file upload UX

## Testing Strategy

### Security Testing

**File Upload Tests**:

```typescript
describe('File upload security', () => {
	test('rejects files over size limit', () => {
		const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg');
		expect(validateImageUpload(largeFile).valid).toBe(false);
	});

	test('rejects invalid MIME types', () => {
		const txtFile = new File(['content'], 'file.txt', { type: 'text/plain' });
		expect(validateImageUpload(txtFile).valid).toBe(false);
	});
});
```

**Debug Route Tests**:

```typescript
test('debug route requires super_admin role', async () => {
	const response = await fetch('/debug-user', {
		headers: { Authorization: `Bearer ${userToken}` }
	});
	expect(response.status).toBe(403);
});
```

### Integration Tests

**Authentication Flow**:

- Test that authentication still works after logging changes
- Verify admin routes are properly protected
- Confirm file uploads work with new validation

## Validation Checklist

✅ **Security Hardening Checklist:**

1. **Sensitive Data Removal** – Are all JWT tokens and metadata removed from production logs? (1–10)
2. **Debug Route Protection** – Are debug routes restricted to super_admin only? (1–10)
3. **File Upload Security** – Are uploads validated for type, size, and content? (1–10)
4. **Security Headers** – Are basic security headers implemented in responses? (1–10)
5. **Error Message Security** – Do errors not expose internal system details? (1–10)
6. **Authentication Flow** – Does user authentication still work correctly after changes? (1–10)
7. **Admin Access Control** – Are admin-only routes properly protected? (1–10)
8. **Production Logging** – Is production logging sanitized and secure? (1–10)
9. **File Validation** – Are malicious file uploads prevented? (1–10)
10. **Security Testing** – Are security measures tested and verified? (1–10)

## Expected Outcomes

### Immediate Security Improvements

- **Data Protection**: No sensitive authentication data in production logs
- **Access Control**: Debug routes restricted to authorized admins only
- **Upload Security**: File uploads validated and sanitized
- **Basic Hardening**: Security headers protect against common attacks

### Risk Reduction

- **Information Disclosure**: Eliminated JWT token exposure
- **Unauthorized Access**: Secured debug and admin functionality
- **File Upload Attacks**: Prevented malicious file uploads
- **Cross-Site Attacks**: Basic XSS and clickjacking protection

This Phase 1 security hardening addresses the most critical vulnerabilities with minimal complexity and implementation time (approximately 2 hours total).
