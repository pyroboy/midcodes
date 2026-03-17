import { db } from '$lib/server/db';
import { prayerRequests } from '$lib/server/schema';
import { eq, desc, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const requests = await db
		.select()
		.from(prayerRequests)
		.where(and(eq(prayerRequests.isApproved, true), eq(prayerRequests.isPublic, true)))
		.orderBy(desc(prayerRequests.createdAt));

	return { requests };
};

export const actions: Actions = {
	submit: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const email = formData.get('email')?.toString().trim() || null;
		const prayerRequest = formData.get('request')?.toString().trim();

		if (!name) {
			return fail(400, { error: 'Please enter your name.', name, email, request: prayerRequest });
		}

		if (!prayerRequest) {
			return fail(400, { error: 'Please enter your prayer request.', name, email, request: prayerRequest });
		}

		await db.insert(prayerRequests).values({
			name,
			email,
			request: prayerRequest,
			isApproved: false,
			isPublic: true
		});

		return { success: true };
	}
};
