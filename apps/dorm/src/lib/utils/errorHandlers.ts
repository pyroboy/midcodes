/**
 * Common Error Handlers
 *
 * Pre-built error handlers for common scenarios in the application.
 * These wrap the core error utilities with application-specific logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import {
	createUnauthorizedError,
	createForbiddenError,
	createNotFoundError,
	createValidationError,
	createDatabaseError,
	handleSupabaseError,
	throwError,
	failWithError,
	type ErrorContext,
	type AppError
} from './errors';

// ============================================================================
// Authentication & Authorization Handlers
// ============================================================================

/**
 * Ensure user is authenticated
 */
export function requireAuth(
	session: Session | null,
	context?: ErrorContext
): asserts session is Session {
	if (!session) {
		throwError(createUnauthorizedError(undefined, context));
	}
}

/**
 * Ensure user has required role
 */
export function requireRole(
	userRole: string | undefined,
	allowedRoles: string[],
	context?: ErrorContext
): void {
	if (!userRole || !allowedRoles.includes(userRole)) {
		throwError(
			createForbiddenError(
				'You do not have the required role to perform this action',
				{ ...context, userRole, metadata: { allowedRoles } }
			)
		);
	}
}

/**
 * Ensure user has required permission
 */
export function requirePermission(
	permissions: string[],
	requiredPermission: string,
	context?: ErrorContext
): void {
	if (!permissions.includes(requiredPermission)) {
		throwError(
			createForbiddenError(
				`Missing required permission: ${requiredPermission}`,
				{ ...context, metadata: { requiredPermission, userPermissions: permissions } }
			)
		);
	}
}

// ============================================================================
// Database Operation Handlers
// ============================================================================

export interface QueryOptions<T = any> {
	/** Resource type being queried */
	resourceType: string;
	/** Resource ID if querying single resource */
	resourceId?: string | number;
	/** Error context */
	context?: ErrorContext;
	/** Custom error message on failure */
	errorMessage?: string;
	/** Whether to throw on empty result */
	throwOnEmpty?: boolean;
	/** Transform function for successful result */
	transform?: (data: T) => T;
}

/**
 * Execute a Supabase query with error handling
 */
export async function executeQuery<T>(
	queryPromise: Promise<{ data: T | null; error: any }>,
	options: QueryOptions<T>
): Promise<T> {
	const {
		resourceType,
		resourceId,
		context,
		errorMessage,
		throwOnEmpty = false,
		transform
	} = options;

	const { data, error: queryError } = await queryPromise;

	// Handle query error
	if (queryError) {
		const appError = handleSupabaseError(queryError, {
			...context,
			resourceType,
			resourceId
		});

		throwError(
			errorMessage
				? { ...appError, message: errorMessage }
				: appError
		);
	}

	// Handle empty result
	if (throwOnEmpty && !data) {
		throwError(createNotFoundError(resourceType, resourceId, context));
	}

	// Transform if needed
	if (data && transform) {
		return transform(data);
	}

	return data as T;
}

/**
 * Execute a single record query (expects exactly one result)
 */
export async function querySingle<T>(
	supabase: SupabaseClient,
	table: string,
	id: number | string,
	options: Omit<QueryOptions<T>, 'resourceId' | 'throwOnEmpty'>
): Promise<T> {
	const query = supabase.from(table).select('*').eq('id', id).single();

	return executeQuery(query, {
		...options,
		resourceId: id,
		throwOnEmpty: true
	});
}

/**
 * Execute an insert operation with error handling
 */
export async function executeInsert<T>(
	supabase: SupabaseClient,
	table: string,
	data: any,
	options: Omit<QueryOptions<T>, 'resourceId' | 'throwOnEmpty'>
): Promise<T> {
	const { resourceType, context, errorMessage } = options;

	const { data: result, error: insertError } = await supabase
		.from(table)
		.insert(data)
		.select()
		.single();

	if (insertError) {
		const appError = handleSupabaseError(insertError, {
			...context,
			resourceType,
			action: 'create'
		});

		throwError(
			errorMessage
				? { ...appError, message: errorMessage }
				: appError
		);
	}

	return result as T;
}

/**
 * Execute an update operation with error handling
 */
export async function executeUpdate<T>(
	supabase: SupabaseClient,
	table: string,
	id: number | string,
	data: any,
	options: Omit<QueryOptions<T>, 'resourceId' | 'throwOnEmpty'>
): Promise<T> {
	const { resourceType, context, errorMessage } = options;

	const { data: result, error: updateError } = await supabase
		.from(table)
		.update(data)
		.eq('id', id)
		.select()
		.single();

	if (updateError) {
		const appError = handleSupabaseError(updateError, {
			...context,
			resourceType,
			resourceId: id,
			action: 'update'
		});

		throwError(
			errorMessage
				? { ...appError, message: errorMessage }
				: appError
		);
	}

	if (!result) {
		throwError(createNotFoundError(resourceType, id, context));
	}

	return result as T;
}

/**
 * Execute a delete operation with error handling
 */
export async function executeDelete(
	supabase: SupabaseClient,
	table: string,
	id: number | string,
	options: Omit<QueryOptions, 'throwOnEmpty'>
): Promise<void> {
	const { resourceType, context, errorMessage } = options;

	const { error: deleteError } = await supabase
		.from(table)
		.delete()
		.eq('id', id);

	if (deleteError) {
		const appError = handleSupabaseError(deleteError, {
			...context,
			resourceType,
			resourceId: id,
			action: 'delete'
		});

		throwError(
			errorMessage
				? { ...appError, message: errorMessage }
				: appError
		);
	}
}

/**
 * Execute a soft delete operation with error handling
 */
export async function executeSoftDelete(
	supabase: SupabaseClient,
	table: string,
	id: number | string,
	options: Omit<QueryOptions, 'throwOnEmpty'>
): Promise<void> {
	const timestamp = new Date().toISOString();

	await executeUpdate(
		supabase,
		table,
		id,
		{
			deleted_at: timestamp,
			updated_at: timestamp
		},
		options
	);
}

// ============================================================================
// Form Validation Handlers
// ============================================================================

/**
 * Handle form validation errors
 */
export function handleValidationError(
	form: any,
	message: string,
	fieldErrors?: Record<string, string[]>,
	context?: ErrorContext
) {
	// Set field errors if provided
	if (fieldErrors) {
		Object.entries(fieldErrors).forEach(([field, errors]) => {
			form.errors[field] = errors;
		});
	}

	return failWithError(
		createValidationError(message, undefined, context),
		form
	);
}

/**
 * Validate required fields
 */
export function validateRequired(
	data: Record<string, any>,
	requiredFields: string[],
	context?: ErrorContext
): void {
	const missingFields = requiredFields.filter(
		field => data[field] === null || data[field] === undefined || data[field] === ''
	);

	if (missingFields.length > 0) {
		throwError(
			createValidationError(
				`Missing required fields: ${missingFields.join(', ')}`,
				undefined,
				{ ...context, metadata: { missingFields } }
			)
		);
	}
}

// ============================================================================
// Business Logic Handlers
// ============================================================================

/**
 * Check for duplicate records
 */
export async function checkDuplicate(
	supabase: SupabaseClient,
	table: string,
	field: string,
	value: any,
	excludeId?: number | string,
	context?: ErrorContext
): Promise<void> {
	let query = supabase
		.from(table)
		.select('id')
		.eq(field, value)
		.is('deleted_at', null);

	if (excludeId) {
		query = query.neq('id', excludeId);
	}

	const { data, error: queryError } = await query.single();

	if (queryError && queryError.code !== 'PGRST116') {
		// PGRST116 = no rows returned
		throwError(handleSupabaseError(queryError, context));
	}

	if (data) {
		throwError(
			createValidationError(
				`A record with this ${field} already exists`,
				undefined,
				{ ...context, metadata: { field, value } }
			)
		);
	}
}

/**
 * Validate amount against balance
 */
export function validateAmount(
	amount: number,
	balance: number,
	context?: ErrorContext
): void {
	if (amount <= 0) {
		throwError(
			createValidationError(
				'Amount must be greater than zero',
				undefined,
				context
			)
		);
	}

	if (amount > balance) {
		throwError(
			createValidationError(
				`Amount (₱${amount.toFixed(2)}) exceeds balance (₱${balance.toFixed(2)})`,
				undefined,
				{ ...context, metadata: { amount, balance } }
			)
		);
	}
}

/**
 * Validate date range
 */
export function validateDateRange(
	startDate: string | Date,
	endDate: string | Date,
	context?: ErrorContext
): void {
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (start >= end) {
		throwError(
			createValidationError(
				'End date must be after start date',
				undefined,
				{ ...context, metadata: { startDate, endDate } }
			)
		);
	}
}

// ============================================================================
// Audit Logging with Error Handling
// ============================================================================

/**
 * Log audit event with error handling (doesn't fail the operation)
 */
export async function logAuditEvent(
	supabase: SupabaseClient,
	event: {
		action: string;
		user_id?: string;
		user_role?: string;
		details?: any;
	}
): Promise<void> {
	try {
		await supabase.from('audit_events').insert({
			...event,
			created_at: new Date().toISOString()
		});
	} catch (error) {
		// Don't fail the operation, just log the error
		console.error('Failed to log audit event:', error);
	}
}
