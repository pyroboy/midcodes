import { and, eq } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';

/**
 * Extract the `_updated_at` hidden field from FormData for optimistic locking.
 * Returns null if missing/empty — caller should skip lock check (backward compat).
 */
export function extractLockTimestamp(formData: FormData): Date | null {
	const raw = formData.get('_updated_at');
	if (!raw || typeof raw !== 'string' || raw.trim() === '') return null;
	const date = new Date(raw);
	if (isNaN(date.getTime())) return null;
	return date;
}

/**
 * Perform a Drizzle UPDATE with optional optimistic lock on `updated_at`.
 *
 * - If `lockTs` is null → regular update (no lock check, backward compatible)
 * - If `lockTs` is set → adds `AND updated_at = lockTs` to WHERE clause
 *
 * Returns `{ conflict: false, rows }` on success or `{ conflict: true, message }` on stale write.
 */
export async function optimisticLockUpdate<T extends PgTable>(
	db: NeonHttpDatabase<any>,
	table: T,
	idCol: PgColumn,
	id: number,
	updatedAtCol: PgColumn,
	lockTs: Date | null,
	setData: Record<string, unknown>
): Promise<{ conflict: false; rows: any[] } | { conflict: true; message: string }> {
	const whereClause = lockTs
		? and(eq(idCol, id), eq(updatedAtCol, lockTs))
		: eq(idCol, id);

	const rows = await (db.update(table) as any)
		.set(setData)
		.where(whereClause)
		.returning();

	if (lockTs && rows.length === 0) {
		return {
			conflict: true,
			message: 'This record was modified by someone else. Please refresh and try again.'
		};
	}

	return { conflict: false, rows };
}
