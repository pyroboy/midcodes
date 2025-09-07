import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import type { Database } from '$lib/database.types';
import { batchReadingsSchema, meterReadingSchema } from './meterReadingSchema';
import type { z } from 'zod';
import { getUserPermissions } from '$lib/services/permissions';

// Use Node runtime; avoid ISR on authed routes to prevent cache/redirect issues
export const config = { runtime: 'nodejs20.x' };

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession }, depends }) => {
	const session = await safeGetSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Set up dependencies for invalidation
	depends('app:utility-billings');

	console.log('Session loaded, user authenticated:', session.user.id);

	// Create a form for superForm to use in the client, using batchReadingsSchema
	const form = await superValidate(zod(batchReadingsSchema));

	// Return minimal data for instant navigation
	return {
		form,
		// Start with empty arrays for instant rendering
		properties: [],
		meters: [],
		readings: [],
		allReadings: [], // Include all readings for pending review
		availableReadingDates: [],
		rental_unitTenantCounts: {},
		leases: [],
		meterLastBilledDates: {},
		leaseMeterBilledDates: {},
		actualBilledDates: {},
		previousReadingGroups: [],
		// Flag to indicate lazy loading
		lazy: true,
		// Return promises that resolve with the actual data
		propertiesPromise: loadPropertiesData(supabase),
		metersPromise: loadMetersData(supabase),
		readingsPromise: loadReadingsData(supabase),
		billingsPromise: loadBillingsData(supabase),
		availableReadingDatesPromise: loadAvailableReadingDatesData(supabase),
		tenantCountsPromise: loadTenantCountsData(supabase),
		leasesPromise: loadLeasesData(supabase),
		allReadingsPromise: loadAllReadingsData(supabase)
	};
};

// Separate async functions for heavy data loading
async function loadPropertiesData(supabase: any) {
	console.log('Loading properties data...');
	const result = await supabase
		.from('properties')
		.select('id, name')
		.eq('status', 'ACTIVE')
		.order('name');

	if (result.error) {
		console.error('Error fetching properties:', result.error);
		throw error(500, `Error fetching properties: ${result.error.message}`);
	}

	return result.data || [];
}

async function loadMetersData(supabase: any) {
	console.log('Loading meters data...');
	const result = await supabase.from('meters').select(`
      id,
      name,
      type,
      property_id,
      initial_reading,
      rental_unit(
        id,
        name,
        number
      )
    `);

	if (result.error) {
		console.error('Error fetching meters:', result.error);
		throw error(500, `Error fetching meters: ${result.error.message}`);
	}

	return result.data || [];
}

async function loadReadingsData(supabase: any) {
	console.log('Loading readings data...');
	const result = await supabase
		.from('readings')
		.select(
			`
      id,
      meter_id,
      reading,
      reading_date,
      rate_at_reading,
      review_status
    `
		)
		.order('reading_date', { ascending: true });

	if (result.error) {
		console.error('Error fetching readings:', result.error);
		throw error(500, `Error fetching readings: ${result.error.message}`);
	}

	return result.data || [];
}

async function loadBillingsData(supabase: any) {
	console.log('Loading billings data...');
	const result = await supabase
		.from('billings')
		.select('meter_id, lease_id, billing_date, amount')
		.eq('type', 'UTILITY')
		.not('meter_id', 'is', null);

	if (result.error) {
		console.error('Error fetching billings:', result.error);
		throw error(500, `Error fetching billings: ${result.error.message}`);
	}

	return result.data || [];
}

async function loadAvailableReadingDatesData(supabase: any) {
	console.log('Loading available reading dates...');
	const result = await supabase.from('readings').select('reading_date').order('reading_date');

	if (result.error) {
		console.error('Error fetching reading dates:', result.error);
		throw error(500, `Error fetching reading dates: ${result.error.message}`);
	}

	return result.data || [];
}

async function loadTenantCountsData(supabase: any) {
	console.log('Loading tenant counts...');
	const result = await supabase
		.from('leases')
		.select(
			`
      rental_unit_id,
      tenants:lease_tenants (
        id
      )
    `
		)
		.eq('status', 'ACTIVE');

	if (result.error) {
		console.error('Error fetching tenant counts:', result.error);
		throw error(500, `Error fetching tenant counts: ${result.error.message}`);
	}

	return result.data || [];
}

async function loadLeasesData(supabase: any) {
	console.log('Loading leases data...');
	const result = await supabase.from('leases').select(`
      id,
      name,
      rental_unit_id,
      status,
      rental_unit:rental_unit_id(
        id,
        name,
        number,
        type,
        floor_id,
        property_id
      ),
      lease_tenants(
        tenants(
          id,
          full_name:name,
          tenant_status
        )
      )
    `);

	if (result.error) {
		console.error('Error fetching leases:', result.error);
		throw error(500, `Error fetching leases: ${result.error.message}`);
	}

	return result.data || [];
}

async function loadAllReadingsData(supabase: any) {
	console.log('Loading all readings data...');
	
	// Enhanced query with context-aware filtering
	// Only load readings from the last 2 years for performance
	const twoYearsAgo = new Date();
	twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
	
	const result = await supabase
		.from('readings')
		.select(`
			id,
			meter_id,
			reading,
			reading_date,
			rate_at_reading,
			review_status,
			meters!inner(
				id,
				name,
				type,
				property_id
			)
		`)
		.gte('reading_date', twoYearsAgo.toISOString().split('T')[0])
		.order('reading_date', { ascending: false });

	if (result.error) {
		console.error('Error fetching all readings:', result.error);
		throw error(500, `Error fetching all readings: ${result.error.message}`);
	}

	return result.data || [];
}



// Helper function to group readings by month with enhanced metadata
function groupReadingsByMonth(readings: any[]) {
	const groups: { [key: string]: any } = {};
	
	readings.forEach(reading => {
		const date = new Date(reading.reading_date);
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		
		if (!groups[monthKey]) {
			groups[monthKey] = {
				date: monthKey,
				readings: [],
				monthName: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
				meterCount: new Set(),
				readingCount: 0,
				displayName: ''
			};
		}
		
		groups[monthKey].readings.push(reading);
		groups[monthKey].meterCount.add(reading.meter_id);
		groups[monthKey].readingCount++;
	});
	
	// Convert to array and add display names
	const result = Object.values(groups).map(group => ({
		...group,
		meterCount: group.meterCount.size,
		displayName: `${group.monthName} (${group.meterCount} meters, ${group.readingCount} readings)`
	}));
	
	// Sort by date descending (most recent first)
	return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const actions: Actions = {
	approvePendingReadings: async ({ request, locals: { supabase, safeGetSession } }) => {
		const session = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const idsJson = formData.get('reading_ids') as string;
		if (!idsJson) return fail(400, { error: 'Missing reading_ids' });
		let ids: number[] = [];
		try {
			ids = JSON.parse(idsJson);
			if (!Array.isArray(ids)) throw new Error('reading_ids must be an array');
		} catch (e: any) {
			return fail(400, { error: 'Invalid reading_ids payload' });
		}

		const { error: updateError } = await supabase
			.from('readings')
			.update({ review_status: 'APPROVED' })
			.in('id', ids);
		if (updateError) return fail(500, { error: `Failed to approve readings: ${updateError.message}` });
		return { success: true };
	},
	rejectPendingReadings: async ({ request, locals: { supabase, safeGetSession } }) => {
		const session = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const idsJson = formData.get('reading_ids') as string;
		if (!idsJson) return fail(400, { error: 'Missing reading_ids' });
		let ids: number[] = [];
		try {
			ids = JSON.parse(idsJson);
			if (!Array.isArray(ids)) throw new Error('reading_ids must be an array');
		} catch (e: any) {
			return fail(400, { error: 'Invalid reading_ids payload' });
		}

		const { error: updateError } = await supabase
			.from('readings')
			.update({ review_status: 'REJECTED' })
			.in('id', ids);
		if (updateError) return fail(500, { error: `Failed to reject readings: ${updateError.message}` });
		return { success: true };
	},


	createUtilityBillings: async ({ request, locals: { supabase, safeGetSession } }) => {
		const session = await safeGetSession();
		if (!session) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const billingDataString = formData.get('billingData') as string;

		if (!billingDataString) {
			return fail(400, { error: 'Missing billingData' });
		}

		try {
			const billings: Array<{
				lease_id: number;
				utility_type: string;
				billing_date: string;
				amount: number;
				notes: string;
				meter_id: number;
				lease: { name: string };
			}> = JSON.parse(billingDataString);

			// REMOVED: Pre-emptive duplicate check to eliminate race condition
			// The database unique constraint will handle this more reliably

			// Transactional Data Insertion
			const billingsToCreate = billings.map((item) => {
				const dueDate = new Date(item.billing_date);
				dueDate.setDate(dueDate.getDate() + 15); // Due 15 days from billing date
				return {
					lease_id: item.lease_id,
					type: 'UTILITY',
					utility_type: item.utility_type,
					amount: item.amount,
					balance: item.amount,
					status: 'PENDING',
					due_date: dueDate.toISOString().split('T')[0],
					billing_date: item.billing_date,
					notes: item.notes,
					meter_id: item.meter_id
				};
			});

			const { error: insertError } = await supabase.from('billings').insert(billingsToCreate);

			if (insertError) {
				console.error('Error creating billings:', insertError);
				// Check for unique constraint violation
				if (insertError.code === '23505') {
					// Unique violation error code in PostgreSQL
					return fail(409, { error: 'A billing for this period and lease already exists.' });
				}
				return fail(500, { error: 'Failed to create billings.' });
			}

			return { created: billingsToCreate.length, duplicates: [] };
		} catch (e: any) {
			return fail(400, { error: 'Invalid JSON format for billingData' });
		}
	},
	// Add batch readings with full data saving
	addBatchReadings: async ({ request, locals: { supabase, safeGetSession } }) => {
		/* 1. Validate the form once and only once. */
		console.log('=== Starting addBatchReadings ===');

		// Log raw form data for debugging
		const formData = await request.formData();
		const rawReadingsJson = formData.get('readings_json') as string;
		const rawReadingDate = formData.get('reading_date') as string;
		const rawRateAtReading = formData.get('rate_at_reading') as string;
		const rawType = formData.get('type') as string;

		console.log('Raw form data:', {
			readings_json: rawReadingsJson,
			reading_date: rawReadingDate,
			rate_at_reading: rawRateAtReading,
			type: rawType
		});

		// Reconstruct request for superValidate
		const reconstructedFormData = new FormData();
		reconstructedFormData.append('readings_json', rawReadingsJson || '');
		reconstructedFormData.append('reading_date', rawReadingDate || '');
		reconstructedFormData.append('rate_at_reading', rawRateAtReading || '');
		reconstructedFormData.append('type', rawType || '');
		
		// Add backdating field if present
		const rawBackdatingEnabled = formData.get('backdating_enabled') as string;
		if (rawBackdatingEnabled !== null) {
			reconstructedFormData.append('backdating_enabled', rawBackdatingEnabled);
		}

		console.log('Reconstructed form data for validation:', {
			readings_json: rawReadingsJson,
			reading_date: rawReadingDate,
			rate_at_reading: rawRateAtReading,
			type: rawType,
			backdating_enabled: rawBackdatingEnabled
		});

		const form = await superValidate(reconstructedFormData, zod(batchReadingsSchema));
		console.log('form.data received:', form.data);
		console.log('form.errors:', form.errors);
		console.log('form.valid:', form.valid);

		if (!form.valid) {
			console.error('❌ Validation failed', {
				errors: form.errors,
				data: form.data,
				rawData: {
					readings_json: rawReadingsJson?.substring(0, 200),
					reading_date: rawReadingDate,
					rate_at_reading: rawRateAtReading
				}
			});
			return fail(400, { form });
		}

		try {
			const session = await safeGetSession();
			if (!session) throw error(401, 'Unauthorized');

			// Check user permissions for utility management
			const userRoles = session.user.user_metadata?.user_roles || [];
			const userPermissions = await getUserPermissions(userRoles, supabase);
			
			console.log('🔐 Permission check for meter readings:', {
				userId: session.user.id,
				userRoles,
				userPermissions,
				hasReadingsPermission: userPermissions.includes('readings.create')
			});
			
			// Fallback: If JWT doesn't have roles, check directly from profiles table
			let hasReadingsPermission = userPermissions.includes('readings.create');
			let isSuperAdmin = userRoles.includes('super_admin');
			let isPropertyAdmin = userRoles.includes('property_admin');
			let isPropertyUser = userRoles.includes('property_user');
			
			// If no roles found in JWT, check the profiles table directly
			if (userRoles.length === 0) {
				console.log('⚠️ No roles found in JWT, checking profiles table...');
				const { data: profile, error: profileError } = await supabase
					.from('profiles')
					.select('role')
					.eq('id', session.user.id)
					.single();
				
				if (!profileError && profile) {
					console.log('📋 Found role in profiles table:', profile.role);
					isSuperAdmin = profile.role === 'super_admin';
					isPropertyAdmin = profile.role === 'property_admin';
					isPropertyUser = profile.role === 'property_user';
					
					// Get permissions for this role
					const fallbackPermissions = await getUserPermissions([profile.role], supabase);
					hasReadingsPermission = fallbackPermissions.includes('readings.create');
					
					console.log('🔐 Fallback permissions:', {
						role: profile.role,
						permissions: fallbackPermissions,
						hasReadingsPermission
					});
				}
			}
			
			if (!hasReadingsPermission && !isSuperAdmin && !isPropertyAdmin && !isPropertyUser) {
				console.log('❌ Permission denied for user:', {
					userId: session.user.id,
					userRoles,
					userPermissions,
					hasReadingsPermission,
					isSuperAdmin,
					isPropertyAdmin,
					isPropertyUser
				});
				return fail(403, { form, error: 'Insufficient permissions to add meter readings. You need readings.create permission or appropriate role.' });
			}
			
			console.log('✅ Permission granted for user:', {
				userId: session.user.id,
				userRoles,
				hasReadingsPermission,
				isSuperAdmin,
				isPropertyAdmin,
				isPropertyUser
			});

			// Manually parse the JSON string after successful validation
			console.log('Parsing validated readings JSON:', form.data.readings_json);
			const readings: z.infer<typeof meterReadingSchema>[] = JSON.parse(form.data.readings_json);
			const { rate_at_reading, backdating_enabled } = form.data;

			console.log('Parsed readings:', readings);
			console.log('Rate at reading:', rate_at_reading, typeof rate_at_reading);
			console.log('Backdating enabled:', backdating_enabled);

			const meterIds = readings.map((r) => r.meter_id);

			const { data: meterData, error: meterError } = await supabase
				.from('meters')
				.select('id, name, rental_unit_id, type')
				.in('id', meterIds);
			if (meterError)
				return fail(500, { form, error: `Error fetching meter data: ${meterError.message}` });

			const meterNameMap = Object.fromEntries((meterData ?? []).map((m) => [m.id, m.name]));

			const { data: previousReadings, error: prevError } = await supabase
				.from('readings')
				.select('meter_id, reading, reading_date')
				.in('meter_id', meterIds)
				.order('reading_date', { ascending: false });
			if (prevError)
				return fail(500, { form, error: `Error fetching previous readings: ${prevError.message}` });

			const previousReadingMap: Record<number, number> = {};
			for (const r of previousReadings || []) {
				if (previousReadingMap[r.meter_id] === undefined)
					previousReadingMap[r.meter_id] = r.reading;
			}

			const readingsToInsert = readings
				.filter((r) => r.reading !== null)
				.map((r) => {
					const current = Number(r.reading);
					const previous = previousReadingMap[r.meter_id] ?? null;

					// VALIDATE: Current reading must be >= previous reading
					if (previous !== null && current < previous) {
						throw new Error(
							`Invalid reading for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}: ${current} is less than previous reading ${previous}`
						);
					}

					// Calculate consumption for validation purposes (not stored in DB)
					const consumption = previous !== null ? current - previous : null;

					// VALIDATE: Reasonable consumption limits (flag unusually high usage)
					if (consumption !== null && consumption > 50000) {
						throw new Error(
							`Unusually high consumption detected for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}: ${consumption} units. Please verify the reading.`
						);
					}

					// VALIDATE: Negative consumption (reading error)
					if (consumption !== null && consumption < 0) {
						throw new Error(
							`Negative consumption detected for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}. Current reading must be greater than previous reading.`
						);
					}

					return {
						meter_id: r.meter_id,
						reading: current,
						reading_date: r.reading_date,
						meter_name: meterNameMap[r.meter_id] || null,
						rate_at_reading: rate_at_reading,
						backdating_enabled: backdating_enabled || false
					};
				});

			if (readingsToInsert.length === 0)
				return fail(400, { form, error: 'No valid readings to insert' });

			const { data: newReadings, error: insertError } = await supabase
				.from('readings')
				.insert(readingsToInsert)
				.select();
			if (insertError) {
				console.error('Database insertion error:', insertError);
				return fail(500, {
					form,
					error: `Failed to insert readings: ${insertError.message}`,
					details: insertError
				});
			}

			return {
				form, // ← required by Superforms
				success: true,
				message: `Successfully added ${newReadings?.length ?? 0} meter readings`,
				readings: newReadings ?? []
			};
		} catch (err: any) {
			console.error('Error in addBatchReadings:', err);

			// Provide more specific error messages based on error type
			let userMessage = 'An unexpected error occurred while saving readings';

			if (err.message.includes('Invalid reading for meter')) {
				userMessage = err.message; // Use the specific validation message
			} else if (err.message.includes('Unusually high consumption')) {
				userMessage = err.message; // Use the specific consumption warning
			} else if (err.message.includes('Insufficient permissions')) {
				userMessage = 'You do not have permission to add meter readings';
			} else if (err.code === '23505') {
				userMessage = 'A reading for this date already exists for one or more meters';
			} else if (err.message.includes('database')) {
				userMessage = 'Database error occurred. Please try again.';
			}

			return fail(500, {
				form,
				error: userMessage,
				details: process.env.NODE_ENV === 'development' ? err.message : undefined
			});
		}
	}
};
