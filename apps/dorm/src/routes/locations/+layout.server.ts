import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { permissions } = locals;
	if (!permissions?.includes('properties.read')) {
		throw error(403, 'Forbidden: You do not have permission to view locations.');
	}
};
