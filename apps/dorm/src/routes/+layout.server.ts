// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user, decodedToken, permissions, supabase } = locals;

	// // Console log to show the current user's access level on the server
	// if (user) {
	// 	console.log('--- User Access Info ---');
	// 	console.log('User ID:', user.id);
	// 	console.log('Email:', user.email);
	// 	console.log('Roles:', decodedToken?.user_roles ?? 'No roles found in token');
	// 	console.log('Permissions:', permissions ?? 'No permissions found');
	// 	console.log('------------------------');
	// }

	// This function fetches the properties. We return the promise from the load
	// function, and SvelteKit will await it for us.
	const fetchProperties = async () => {
		if (!user) {
			return null;
		}
		// CORRECTED: The select statement now includes all fields required by the Property type.
		const { data: properties, error } = await supabase
			.from('properties')
			.select('id, name, address, type, status, created_at, updated_at')
			.eq('status', 'ACTIVE')
			.order('name');

		if (error) {
			console.error('Error fetching properties in root layout:', error);
			return null; // Handle error gracefully
		}
		return properties;
	};

	return {
		session,
		user,
		decodedToken,
		permissions,
		// Return the promise for properties. SvelteKit will handle streaming.
		properties: fetchProperties()
	};
};
