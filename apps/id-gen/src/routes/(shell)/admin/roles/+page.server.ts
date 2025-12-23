import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	// Get data from parent layout (authentication check happens there)
	const parentData = await parent();

	return {
		...parentData
	};
};
