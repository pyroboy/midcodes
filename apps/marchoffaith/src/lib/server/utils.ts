import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { db } from './db';

// Re-export shared slugify so server files can import from one place
export { slugify } from '$lib/utils';

/**
 * Check if a slug already exists in a table. Returns true if taken.
 */
export async function isSlugTaken(
	table: PgTable,
	slugColumn: PgColumn,
	slug: string,
	excludeId?: number | null,
	idColumn?: PgColumn
): Promise<boolean> {
	const results = await db
		.select({ id: idColumn ?? slugColumn })
		.from(table)
		.where(eq(slugColumn, slug))
		.limit(1);

	if (results.length === 0) return false;

	// If excluding a specific ID (update path), check it's not the same record
	if (excludeId != null && idColumn) {
		return results[0].id !== excludeId;
	}

	return true;
}

/**
 * Validate and parse a date string. Returns null if invalid.
 */
export function parseDate(dateStr: string | undefined | null): Date | null {
	if (!dateStr) return null;
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return null;
	return date;
}

/**
 * Safely parse a number from form data. Returns null if invalid.
 */
export function parseIntSafe(value: string | undefined | null): number | null {
	if (!value) return null;
	const num = parseInt(value, 10);
	if (isNaN(num)) return null;
	return num;
}

/**
 * Wrap a database operation with error handling.
 */
export async function dbAction<T>(
	operation: () => Promise<T>,
	errorMessage = 'A database error occurred. Please try again.'
): Promise<T> {
	try {
		return await operation();
	} catch (err) {
		console.error('[DB Action Error]', err);
		throw fail(500, { error: errorMessage });
	}
}

/**
 * Generic delete-by-ID action for admin list pages.
 */
export async function deleteById(
	table: PgTable,
	idColumn: PgColumn,
	request: Request,
	entityName: string
) {
	const formData = await request.formData();
	const id = Number(formData.get('id'));
	if (!id || isNaN(id)) return fail(400, { error: `Invalid ${entityName} ID` });

	await dbAction(async () => {
		const result = await db.delete(table).where(eq(idColumn, id)).returning({ id: idColumn });
		if (result.length === 0) throw new Error('Record not found');
	}, `Failed to delete ${entityName}. It may have already been removed.`);

	return { success: true };
}
