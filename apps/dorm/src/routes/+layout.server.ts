// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user, decodedToken, permissions, supabase } = locals;

	// Debug logging for troubleshooting
	if (process.env.NODE_ENV === 'development') {
		console.log('🔍 [Layout Server] Load function called');
		console.log('🔍 [Layout Server] Session exists:', !!session);
		console.log('🔍 [Layout Server] User exists:', !!user);
		if (user) {
			console.log('🔍 [Layout Server] User ID:', user.id);
			console.log('🔍 [Layout Server] User Email:', user.email);
			console.log('🔍 [Layout Server] Decoded Token:', !!decodedToken);
			console.log('🔍 [Layout Server] Permissions:', permissions?.length || 0, 'found');
		}
	}

	// This function fetches the properties. We return the promise from the load
	// function, and SvelteKit will await it for us.
	const fetchProperties = async () => {
		if (!user) {
			// Return empty array instead of null for better handling
			if (process.env.NODE_ENV === 'development') {
				console.log('🔍 [Layout] No user found, returning empty properties array');
			}
			return [];
		}
		
		if (process.env.NODE_ENV === 'development') {
			console.log('🔍 [Layout] Fetching properties for user:', user.id);
		}
		
		try {
			// CORRECTED: The select statement now includes all fields required by the Property type.
			const { data: properties, error } = await supabase
				.from('properties')
				.select('id, name, address, type, status, created_at, updated_at')
				.eq('status', 'ACTIVE')
				.order('name');

			if (error) {
				console.error('🚨 [Layout] Error fetching properties:', error);
				return []; // Return empty array instead of null
			}
			
			if (process.env.NODE_ENV === 'development') {
				console.log(`🔍 [Layout] Found ${properties?.length || 0} active properties`);
			}
			
			// If no active properties, try without status filter
			if (!properties || properties.length === 0) {
				if (process.env.NODE_ENV === 'development') {
					console.log('🔍 [Layout] No active properties found, trying without status filter...');
				}
				
				const { data: allProperties, error: allError } = await supabase
					.from('properties')
					.select('id, name, address, type, status, created_at, updated_at')
					.order('name');
					
				if (allError) {
					console.error('🚨 [Layout] Error fetching all properties:', allError);
					return [];
				}
				
				if (process.env.NODE_ENV === 'development') {
					console.log(`🔍 [Layout] Found ${allProperties?.length || 0} total properties`);
				}
				return allProperties || [];
			}
			
			return properties || [];
		} catch (error) {
			console.error('🚨 [Layout] Exception while fetching properties:', error);
			return [];
		}
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
