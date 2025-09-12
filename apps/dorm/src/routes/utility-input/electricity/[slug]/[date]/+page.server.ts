import type { ServerLoad } from '@sveltejs/kit';
import type { ElectricityMeter } from './+page';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { readingSubmissionSchema } from './formSchema';
import type { Actions } from '@sveltejs/kit';
import { fail, error } from '@sveltejs/kit';
// import { getUserPermissions } from '$lib/services/permissions'; // COMMENTED OUT - PUBLIC ACCESS ENABLED

export const load: ServerLoad = async ({ params, locals }) => {
	const { slug: propertySlug, date } = params;
	console.log(`🔄 [LOAD] Loading utility input page for ${propertySlug}/${date}`);

	// Initialize error state
	let errors: string[] = [];
	let errorDetails: string[] = [];

	if (!propertySlug) {
		errorDetails.push('Property slug is required');
	}

	if (!date) {
		errorDetails.push('Date parameter is required');
	}

	// Create service role client for public route (bypasses RLS)
	let supabaseClient = locals.supabase;
	try {
		if (env.PRIVATE_SERVICE_ROLE) {
			supabaseClient = createClient(PUBLIC_SUPABASE_URL, env.PRIVATE_SERVICE_ROLE);
			console.log('✅ Using service role client for public access');
		} else {
			console.warn('❌ Private service role key not found, falling back to regular client');
		}
	} catch (error) {
		console.error('❌ Error creating service role client:', error);
		console.warn('Falling back to regular client with RLS');
	}

	// Fetch property details by slug (public route - no RLS restrictions)
	let property = null;
	if (propertySlug && !errorDetails.length) {
		console.log(`🔍 Looking for property with slug: "${propertySlug}"`);

		const { data: propertyData, error: propertyError } = await supabaseClient
			.from('properties')
			.select('id, name, slug, status')
			.eq('slug', propertySlug)
			.maybeSingle();

		console.log('🔍 Property query result:', { data: propertyData, error: propertyError });

		if (propertyError) {
			console.error('❌ Database error:', propertyError);
			errorDetails.push(`Database error: ${propertyError.message}`);
		} else if (!propertyData) {
			console.warn(`❌ Property with slug "${propertySlug}" not found`);
			errorDetails.push(`Property with slug "${propertySlug}" not found`);
		} else if (propertyData.status !== 'ACTIVE') {
			console.warn(`❌ Property is not active: ${propertyData.status}`);
			errorDetails.push(`Property is not active`);
		} else {
			console.log(`✅ Property found: ${propertyData.name} (${propertyData.slug})`);
			property = propertyData;
		}
	}

	// Helper function to generate future date links
	function generateFutureDateLinks(propertySlug: string, currentDate: string) {
		const serverToday = new Date().toISOString().split('T')[0];
		const currentDateObj = new Date(currentDate);
		const todayObj = new Date(serverToday);

		// Generate links for tomorrow's date only
		const futureDates = [];
		const tomorrowDate = new Date(todayObj);
		tomorrowDate.setDate(todayObj.getDate() + 1);
		const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

		const tomorrowFormatted = tomorrowDate.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'long',
			day: 'numeric'
		});

		const isCurrentViewingDate = tomorrowStr === currentDate;
		const label = tomorrowFormatted;

		// Make current viewing date non-clickable (plain text), tomorrow as link
		if (isCurrentViewingDate) {
			futureDates.push(`${label} *(current)*`);
		} else {
			futureDates.push(`[${label}](/utility-input/electricity/${propertySlug}/${tomorrowStr})`);
		}

		if (futureDates.length > 0) {
			return `\n\n📅 **Tomorrow's input:**\n${futureDates.join('')}`;
		}

		return '';
	}

	// EARLY CHECK: If property exists, check for existing readings BEFORE fetching meters
	let existingReadingsCount = 0;
	if (property && date && !errorDetails.length) {
		console.log(`🔍 [EARLY CHECK] Checking for existing readings for property ${property.id} on date ${date}`);

		// First get meter IDs for this property
		const { data: meterIds, error: meterError } = await supabaseClient
			.from('meters')
			.select('id')
			.eq('property_id', property.id)
			.eq('type', 'ELECTRICITY')
			.eq('is_active', true);

		if (meterError) {
			console.warn('⚠️ Could not fetch meter IDs:', meterError);
		} else if (meterIds && meterIds.length > 0) {
			const meterIdList = meterIds.map(m => m.id);
			console.log(`🔍 [EARLY CHECK] Found ${meterIdList.length} active electricity meters`);

			// Now check for existing readings on this date for these meters
			const { data: existingReadings, error: readingsCheckError } = await supabaseClient
				.from('readings')
				.select('id, meter_id, reading_date, reading')
				.eq('reading_date', date)
				.in('meter_id', meterIdList)
				.not('reading', 'is', null); // Ensure reading value is not null

			if (readingsCheckError) {
				console.warn('⚠️ Could not check for existing readings:', readingsCheckError);
				console.log(`🔄 [EARLY CHECK] Continuing to show input form due to error`);
			} else if (existingReadings && existingReadings.length > 0) {
				// Double-check that we have valid readings with actual values
				const validReadings = existingReadings.filter(reading => reading.reading !== null && reading.reading !== undefined);
				existingReadingsCount = validReadings.length;

				console.log(`✅ [EARLY CHECK] Found ${existingReadingsCount} valid readings for ${date}`);
				console.log(`📊 [EARLY CHECK] Reading details:`, validReadings.map(r => ({ id: r.id, meter_id: r.meter_id, reading: r.reading })));

				if (existingReadingsCount > 0) {
					// Generate future date links
					const futureDateLinks = generateFutureDateLinks(property.slug, date);

					// Format the date for display
					const displayDate = new Date(date).toLocaleDateString('en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					});

					// Create informational message for existing data
					const successMessage = `ℹ️ Information:\n📊 Existing Data Found\n\n**${displayDate}** already has ${existingReadingsCount} meter reading${existingReadingsCount > 1 ? 's' : ''} recorded.\n\nYou can view or update the existing readings below.${futureDateLinks}`;

					console.log(`🎯 [EARLY CHECK] Returning success response for ${existingReadingsCount} readings`);

					return {
						meters: [], // Empty meters since we're showing success message
						property: property,
						date: date,
						errors: [successMessage],
						form: await superValidate(zod(readingSubmissionSchema)),
						currentServerDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
					};
				} else {
					console.log(`⚠️ [EARLY CHECK] Found readings but none have valid values, showing input form`);
				}
			} else {
				console.log(`ℹ️ [EARLY CHECK] No existing readings found for ${date}, will show input form`);
			}
		} else {
			console.log(`ℹ️ [EARLY CHECK] No active electricity meters found for property, will show input form`);
		}
	}

	// Fetch active electricity meters for this property
	let meters = null;
	if (property && !errorDetails.length) {
		const { data: metersData, error: metersError } = await supabaseClient
			.from('meters')
			.select(`
				id,
				name,
				location_type,
				property_id,
				floor_id,
				rental_unit_id,
				type,
				initial_reading,
				is_active,
				notes,
				created_at,
				property:properties(
					name
				),
				floor:floors(
					floor_number,
					wing
				),
				rental_unit:rental_unit(
					number
				)
			`)
			.eq('property_id', property.id)
			.eq('type', 'ELECTRICITY')
			.eq('is_active', true)
			.order('name');

		if (metersError) {
			errorDetails.push(`Failed to fetch electricity meters: ${metersError.message}`);
		} else {
			meters = metersData;
		}
	}

	// Fetch only latest readings for these meters (optimized query)
	const meterIds = meters?.map((m: any) => m.id) || [];
	let latestReadings: Record<number, { value: number; date: string }> = {};

	console.log(`🔍 [LOAD] Looking for readings for meter IDs:`, meterIds);

	if (meterIds.length > 0 && !errorDetails.length) {
		// Use optimized query to get only latest reading per meter
		const { data: readings, error: readingsError } = await supabaseClient
			.from('readings')
			.select('meter_id, reading, reading_date')
			.in('meter_id', meterIds)
			.order('reading_date', { ascending: false });

		console.log(`🔍 [LOAD] Readings query result:`, {
			count: readings?.length || 0,
			error: readingsError,
			sample: readings?.slice(0, 3)
		});

		if (readingsError) {
			errorDetails.push(`Failed to fetch meter readings: ${readingsError.message}`);
		} else if (readings) {
			// Group latest readings by meter_id (only take first per meter due to order)
			readings.forEach((reading: any) => {
				if (!latestReadings[reading.meter_id]) {
					latestReadings[reading.meter_id] = {
						value: reading.reading,
						date: reading.reading_date
					};
				}
			});
			console.log(`✅ [LOAD] Found ${Object.keys(latestReadings).length} meters with readings`);
		}
	}

	// Attach readings to meters
	const metersWithReadings: ElectricityMeter[] = meters?.map((meter: any) => ({
		...meter,
		latest_reading: latestReadings[meter.id]
	})) || [];

	// Initialize Superforms form with meter reading fields
	const initialFormData: Record<string, any> = {
		readings_json: '',
		reading_date: date || ''
	};

	// Add reading fields for each meter
	if (metersWithReadings.length > 0) {
		metersWithReadings.forEach((meter: ElectricityMeter) => {
			initialFormData[`reading_${meter.id}`] = '';
		});
	}

	const form = await superValidate(zod(readingSubmissionSchema), { defaults: initialFormData });

	// Validate date is not before the last reading date
	if (date && metersWithReadings.length > 0) {
		console.log(`🔍 [LOAD] Checking future readings for date: ${date}`);
		console.log(`🔍 [LOAD] Meters with readings: ${metersWithReadings.length}`);

		// Find the most recent reading date across all meters
		const metersWithReadingsFiltered = metersWithReadings.filter(meter => meter.latest_reading);
		console.log(`🔍 [LOAD] Meters with latest readings: ${metersWithReadingsFiltered.length}`);

		if (metersWithReadingsFiltered.length > 0) {
			// Find the most recent reading date
			const maxTimestamp = Math.max(...metersWithReadingsFiltered
				.map(meter => new Date(meter.latest_reading!.date).getTime())
			);

			// Create date object and normalize using UTC to avoid timezone issues
			const lastReadingDate = new Date(maxTimestamp);
			lastReadingDate.setUTCHours(0, 0, 0, 0); // Set to start of day in UTC

			const requestedDate = new Date(date + 'T00:00:00.000Z'); // Parse as UTC
			requestedDate.setUTCHours(0, 0, 0, 0); // Set to start of requested date in UTC

			if (requestedDate < lastReadingDate) {
				const requestedFormatted = new Date(date).toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				const lastReadingFormatted = lastReadingDate.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				// Create date one day after the last reading
				const nextDay = new Date(lastReadingDate.getTime() + (24 * 60 * 60 * 1000)); // Add exactly 24 hours

				// Create consistent date string for both display and URL
				const year = nextDay.getFullYear();
				const month = String(nextDay.getMonth() + 1).padStart(2, '0');
				const day = String(nextDay.getDate()).padStart(2, '0');
				const dateString = `${year}-${month}-${day}`;

				console.log(`🔍 Last reading date: ${lastReadingDate.toISOString()}`);
				console.log(`🔍 Next day calculated: ${nextDay.toISOString()}`);
				console.log(`🔍 Next day URL: ${dateString}`);

				const nextDayFormatted = nextDay.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				const validDateUrl = `/utility-input/electricity/${propertySlug}/${dateString}`;
				const validDateButton = `[Next Reading Date: ${nextDayFormatted}](${validDateUrl})`;

				// Add today's date button
				const today = new Date();
				const todayYear = today.getFullYear();
				const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
				const todayDay = String(today.getDate()).padStart(2, '0');
				const todayString = `${todayYear}-${todayMonth}-${todayDay}`;
				const todayFormatted = today.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				const todayButton = `[Today's Date: ${todayFormatted}](/utility-input/electricity/${propertySlug}/${todayString})`;

				// Generate available dates between next day and today
				const availableDates = [];
				const currentDate = new Date(nextDay);

				while (currentDate <= today) {
					const dateYear = currentDate.getFullYear();
					const dateMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
					const dateDay = String(currentDate.getDate()).padStart(2, '0');
					const dateString = `${dateYear}-${dateMonth}-${dateDay}`;
					const dateFormatted = currentDate.toLocaleDateString('en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					});

					availableDates.push({
						label: dateFormatted,
						value: dateString,
						url: `/utility-input/electricity/${propertySlug}/${dateString}`
					});

					currentDate.setDate(currentDate.getDate() + 1);
				}

				// Create dropdown options
				const dropdownOptions = availableDates.map(date =>
					`<option value="${date.url}">${date.label}</option>`
				).join('');

				const dropdownHtml = `<select class="date-dropdown mt-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">${dropdownOptions}</select>`;

				errorDetails.push(`⚠️ Date Restriction\n\nYou requested: ${requestedFormatted}\nLast reading: ${lastReadingFormatted}\n\nCannot access dates before your most recent meter reading.\n\nAvailable options:\n${validDateButton}\n\nOr select any date:\n${dropdownHtml}\n\n${todayButton}`);
			}
		}
	}

	// (Removed redundant future-reading message logic; date restriction above already handles this case)

	// Pass collected messages directly to the client (avoid redundant consolidation)
	if (errorDetails.length > 0) {
		console.log(`📋 [LOAD] Returning ${errorDetails.length} message(s)`);
		errors = errorDetails;
	}

	return {
		meters: metersWithReadings,
		property: property,
		date: date || '',
		errors: errors,
		form,
		currentServerDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
	};
};

export const actions: Actions = {
	addReadings: async ({ request, locals: { supabase } }) => {
		console.log('🚀 Server: addReadings action started');

		// Validate request with Superforms
		const form = await superValidate(request, zod(readingSubmissionSchema));
		console.log('📋 Server: Form validation result:', { valid: form.valid, errors: form.errors });

		if (!form.valid) {
			console.log('❌ Server: Form validation failed:', form.errors);
			return fail(400, { form, error: 'Validation failed. Please correct the errors and try again.' });
		}

		console.log('✅ Server: Form validation passed');
		console.log('📊 Server: Form data:', form.data);

		try {
			// COMMENTED OUT AUTHENTICATION - PUBLIC ACCESS ENABLED
			/*
			const session = await safeGetSession();
			if (!session) throw error(401, 'Unauthorized');

			const userRoles = session.user.user_metadata?.user_roles || [];
			const userPermissions = await getUserPermissions(userRoles, supabase);

			let hasReadingsPermission = userPermissions.includes('readings.create');
			let isSuperAdmin = userRoles.includes('super_admin');
			let isPropertyAdmin = userRoles.includes('property_admin');
			let isPropertyUser = userRoles.includes('property_user');

			if (userRoles.length === 0) {
				const { data: profile, error: profileError } = await supabase
					.from('profiles')
					.select('role')
					.eq('id', session.user.id)
					.single();

				if (!profileError && profile) {
					isSuperAdmin = profile.role === 'super_admin';
					isPropertyAdmin = profile.role === 'property_admin';
					isPropertyUser = profile.role === 'property_user';

					const fallbackPermissions = await getUserPermissions([profile.role], supabase);
					hasReadingsPermission = fallbackPermissions.includes('readings.create');
				}
			}

			if (!hasReadingsPermission && !isSuperAdmin && !isPropertyAdmin && !isPropertyUser) {
				return fail(403, { form, error: 'Insufficient permissions to add meter readings.' });
			}
			*/

			// PUBLIC ACCESS: Skip authentication checks

			// Parse readings
			const readings = JSON.parse(form.data.readings_json) as Array<{
				meter_id: number;
				reading: number;
				reading_date: string;
			}>;

			const meterIds = readings.map((r) => r.meter_id);

			// Load previous readings to enforce monotonic increase (only readings BEFORE the current date)
			const { data: previousReadings, error: prevError } = await supabase
				.from('readings')
				.select('meter_id, reading, reading_date')
				.in('meter_id', meterIds)
				.lt('reading_date', form.data.reading_date) // Only get readings BEFORE the current input date
				.order('reading_date', { ascending: false });
			if (prevError) {
				return fail(500, { form, error: `Error fetching previous readings: ${prevError.message}` });
			}

			// Fallback to initial meter readings
			const { data: meters, error: metersError } = await supabase
				.from('meters')
				.select('id, initial_reading, name')
				.in('id', meterIds);
			if (metersError) {
				return fail(500, { form, error: `Error fetching meter data: ${metersError.message}` });
			}

			const previousReadingMap: Record<number, number> = {};
			for (const r of previousReadings || []) {
				if (previousReadingMap[r.meter_id] === undefined) previousReadingMap[r.meter_id] = r.reading;
			}
			const initialReadingMap: Record<number, number> = Object.fromEntries(
				(meters || []).map((m) => [m.id, m.initial_reading ?? 0])
			);
			const meterNameMap: Record<number, string> = Object.fromEntries(
				(meters || []).map((m) => [m.id, m.name])
			);

			const readingsToInsert = readings.map((r) => {
				const current = Number(r.reading);
				// Fix baseline calculation - properly handle null initial readings
				let previous: number;
				const hasValidPreviousReading = previousReadingMap[r.meter_id] !== undefined;
				
				if (hasValidPreviousReading) {
					previous = previousReadingMap[r.meter_id];
				} else {
					// Use initial reading if available, otherwise use current reading as baseline (no consumption validation)
					const initialReading = initialReadingMap[r.meter_id];
					if (initialReading !== null && initialReading !== undefined) {
						previous = initialReading;
					} else {
						// No previous data available - skip consumption validation entirely
						console.log(`ℹ️ [VALIDATION] Meter ${meterNameMap[r.meter_id]}: No baseline reading available, skipping consumption validation`);
						return {
							meter_id: r.meter_id,
							reading: current,
							reading_date: r.reading_date,
							review_status: 'PENDING_REVIEW'
						};
					}
				}

				const meterName = meterNameMap[r.meter_id] || `ID ${r.meter_id}`;

				// Validate reading is not less than previous reading
				if (current < previous) {
					throw new Error(
						`Invalid reading for meter ${meterName}: ${current} is less than previous reading ${previous}. Readings must be monotonically increasing.`
					);
				}

				// Calculate consumption
				const consumption = current - previous;

				// Tiered consumption validation - realistic thresholds
				const NORMAL_DAILY_MAX = 50;      // 0-50 kWh: Normal daily usage - no validation needed
				const MODERATE_DAILY_MAX = 200;   // 51-200 kWh: Moderate usage - soft warning only
				const HIGH_DAILY_MAX = 500;       // 201-500 kWh: High usage - require verification
				const EXTREME_THRESHOLD = 1000;   // >1000 kWh: Extreme - likely error

				// Determine reading context for appropriate threshold
				const isFirstReading = !hasValidPreviousReading;

				// Debug logging
				console.log(`🔍 [VALIDATION] Meter ${meterName}: current=${current}, previous=${previous}, consumption=${consumption}, isFirstReading=${isFirstReading}`);

				// Skip validation for normal daily consumption
				if (consumption <= NORMAL_DAILY_MAX) {
					console.log(`✅ [VALIDATION] Meter ${meterName}: Normal consumption (${consumption} kWh) - validation passed`);
				}
				// Moderate consumption - log warning but allow
				else if (consumption <= MODERATE_DAILY_MAX) {
					console.warn(`⚠️ [VALIDATION] Meter ${meterName}: Moderate consumption (${consumption} kWh) - monitoring for patterns`);
				}
				// High consumption - validate with context-aware thresholds
				else if (consumption <= HIGH_DAILY_MAX) {
					// Allow high consumption for first readings (could be catch-up from installation)
					if (isFirstReading) {
						console.log(`ℹ️ [VALIDATION] Meter ${meterName}: High consumption (${consumption} kWh) allowed for first reading`);
					} else {
						console.warn(`🔶 [VALIDATION] Meter ${meterName}: High consumption (${consumption} kWh) - within acceptable range but monitoring`);
					}
				}
				// Extreme consumption - block with detailed error
				else {
					// Use higher threshold for first readings to account for installation catch-up
					const threshold = isFirstReading ? EXTREME_THRESHOLD * 2 : EXTREME_THRESHOLD;
					
					if (consumption > threshold) {
						const contextMessage = isFirstReading 
							? 'first reading after installation' 
							: 'regular daily reading';
						
						throw new Error(
							`⚠️ Extreme Consumption Alert for meter ${meterName}:\n` +
							`• Current reading: ${current.toLocaleString()} kWh\n` +
							`• Previous reading: ${previous.toLocaleString()} kWh\n` +
							`• Consumption: ${consumption.toLocaleString()} kWh\n` +
							`• Threshold: ${threshold.toLocaleString()} kWh (for ${contextMessage})\n\n` +
							`This consumption level is unusually high and may indicate:\n` +
							`• Meter reading error\n` +
							`• Equipment malfunction\n` +
							`• Extended period between readings\n\n` +
							`Please verify the reading is accurate before proceeding.`
						);
					} else {
						// Consumption is between 501-999 (or 501-1999 for first reading) - log warning but allow
						const contextMessage = isFirstReading 
							? 'first reading after installation' 
							: 'regular daily reading';
						console.warn(`🔶 [VALIDATION] Meter ${meterName}: Very high consumption (${consumption} kWh) for ${contextMessage} - within threshold (${threshold} kWh) but monitoring closely`);
					}
				}

				// Additional validation: Check for unrealistic zero consumption (except for first readings)
				if (!isFirstReading && consumption === 0 && current === previous) {
					console.warn(`⚠️ Zero consumption detected for meter ${meterName}: Reading unchanged from previous value`);
				}

				return {
					meter_id: r.meter_id,
					reading: current,
					reading_date: r.reading_date,
					review_status: 'PENDING_REVIEW'
				};
			});

			if (readingsToInsert.length === 0) {
				return fail(400, { form, error: 'Please enter at least one valid reading.' });
			}

			const { data: newReadings, error: insertError } = await supabase
				.from('readings')
				.insert(readingsToInsert)
				.select();
			if (insertError) {
				return fail(500, { form, error: `Failed to insert readings: ${insertError.message}` });
			}

			return {
				form,
				success: true,
				message: `Successfully added ${newReadings?.length ?? 0} meter readings`
			};
		} catch (err: any) {
			let userMessage = 'An unexpected error occurred while saving readings';
			if (err?.message && typeof err.message === 'string') {
				userMessage = err.message;
			}
			return fail(500, { form, error: userMessage });
		}
	}
};
