import { json, error } from '@sveltejs/kit';
import { PRIVATE_ADMIN_URL } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ locals: { safeGetSession } }: RequestEvent) {
    const { profile } = await safeGetSession();

    if (!profile || profile.role !== 'super_admin') {
        throw error(403, 'Unauthorized');
    }

    return json({
        adminUrl: PRIVATE_ADMIN_URL
    });
}
