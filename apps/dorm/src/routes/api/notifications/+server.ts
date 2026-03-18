import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { notifications } from '$lib/server/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';

/**
 * GET /api/notifications — Fetch notifications (most recent first).
 * Query params: ?limit=20&status=UNREAD
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100);
	const status = url.searchParams.get('status');

	const conditions = [];
	if (status && ['UNREAD', 'READ', 'DISMISSED'].includes(status)) {
		conditions.push(eq(notifications.status, status as 'UNREAD' | 'READ' | 'DISMISSED'));
	}

	const rows = await db
		.select()
		.from(notifications)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(notifications.createdAt))
		.limit(limit);

	// Count unread
	const unreadRows = await db
		.select({ id: notifications.id })
		.from(notifications)
		.where(eq(notifications.status, 'UNREAD'));

	return json({
		notifications: rows,
		unreadCount: unreadRows.length
	});
};

/**
 * PATCH /api/notifications — Mark notifications as read/dismissed.
 * Body: { ids: number[], action: 'read' | 'dismiss' | 'read_all' }
 */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { ids, action } = body as { ids?: number[]; action: string };

	if (action === 'read_all') {
		await db
			.update(notifications)
			.set({ status: 'READ', readAt: new Date() })
			.where(eq(notifications.status, 'UNREAD'));

		return json({ ok: true, message: 'All notifications marked as read' });
	}

	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		return json({ error: 'ids array required' }, { status: 400 });
	}

	const newStatus = action === 'dismiss' ? 'DISMISSED' : 'READ';

	await db
		.update(notifications)
		.set({
			status: newStatus,
			...(newStatus === 'READ' ? { readAt: new Date() } : {})
		})
		.where(inArray(notifications.id, ids));

	return json({ ok: true, updated: ids.length });
};
