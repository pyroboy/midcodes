// Define error interfaces
export interface DetailedError {
	message: string;
	code: string;
	details?: string;
	hint?: string;
	statusCode?: number;
	constraint?: string;
}

export interface DatabaseResponse {
	data: any;
	error: DetailedError | null;
	status?: number;
}

// Error type mappings
const ERROR_TYPES: Record<string, string> = {
	'23505': 'Unique Constraint Violation',
	'23503': 'Foreign Key Violation',
	'23502': 'Not Null Violation',
	'23514': 'Check Constraint Violation',
	'42501': 'Insufficient Privileges',
	'42P01': 'Undefined Table',
	'42703': 'Undefined Column',
	PGRST116: 'No Results Found',
	'22P02': 'Invalid Text Representation',
	'22003': 'Numeric Value Out of Range',
	P0001: 'Raise Exception',
	'08006': 'Connection Error',
	'01000': 'Warning',
	'02000': 'No Data',
	PGRST114: 'Invalid JSON',
	'23000': 'Integrity Constraint Violation',
	'40001': 'Serialization Failure',
	'40P01': 'Deadlock Detected'
};

// Error suggestions mappings
const ERROR_SUGGESTIONS: Record<string, string[]> = {
	'23505': [
		'Check if a record with the same unique key already exists',
		'Verify the uniqueness of the affected columns',
		'Consider using UPSERT if appropriate'
	],
	'23503': [
		'Ensure the referenced record exists in the parent table',
		'Check if foreign key constraints are properly configured',
		'Verify the relationship between tables'
	],
	'23502': [
		'Ensure all required fields are provided',
		'Check if NULL values are being passed to NOT NULL columns',
		'Verify the data structure matches the schema'
	],
	'42501': [
		'Verify user permissions for this operation',
		'Check RLS policies if enabled',
		'Ensure proper role assignments'
	],
	'23514': [
		'Verify the data meets the check constraint conditions',
		'Review the constraint definition',
		'Ensure data validation on the client side'
	],
	PGRST116: [
		'Verify the query conditions',
		'Check if the record exists',
		'Consider handling the no-data case in your application'
	]
};

// Get error suggestions based on error code and constraint
const getErrorSuggestions = (code: string, constraint?: string): string[] => {
	if (constraint) {
		const constraintType = constraint.split('_')[0]?.toLowerCase();
		switch (constraintType) {
			case 'uk':
				return ['This unique key constraint ensures no duplicate values exist for these columns'];
			case 'fk':
				return ['This foreign key constraint ensures referential integrity with another table'];
			case 'ck':
				return ['This check constraint ensures the data meets specific conditions'];
			default:
				break;
		}
	}

	return (
		ERROR_SUGGESTIONS[code] || [
			'Verify the operation parameters',
			'Check the database logs for more details'
		]
	);
};

// Get human-readable error type
const getErrorType = (code: string): string => ERROR_TYPES[code] || 'Unknown Error Type';

/**
 * Enhanced Supabase response logger
 * @param operation - The database operation being performed
 * @param response - The Supabase response object
 */
export const logDatabaseResponse = (operation: string, response: DatabaseResponse): void => {
	const { data, error, status } = response;

	// Base response info
	const responseInfo = {
		operation,
		timestamp: new Date().toISOString(),
		status,
		hasData: !!data,
		dataLength: Array.isArray(data) ? data.length : null,
		data
	};

	// Enhanced error logging if error exists
	const errorInfo = error
		? {
				error: {
					message: error.message,
					code: error.code,
					details: error.details || 'No additional details provided',
					hint: error.hint || 'No hint provided',
					constraint: error.constraint,
					statusCode: error.statusCode || status,
					type: getErrorType(error.code),
					suggestions: getErrorSuggestions(error.code, error.constraint)
				}
			}
		: null;

	// Log the complete information
	console.log(`[Database Debug] ${operation} response:`, {
		...responseInfo,
		...(errorInfo && { error: errorInfo.error })
	});
};

/**
 * Get error details for handling in application logic
 * @param error - The database error object
 * @returns Detailed error information
 */
export const getErrorDetails = (error: DetailedError) => ({
	type: getErrorType(error.code),
	suggestions: getErrorSuggestions(error.code, error.constraint),
	message: error.message,
	details: error.details,
	hint: error.hint,
	code: error.code
});
