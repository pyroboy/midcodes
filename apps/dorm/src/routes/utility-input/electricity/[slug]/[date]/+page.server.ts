import type { ServerLoad } from '@sveltejs/kit';
import type { ElectricityMeter } from './+page';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { readingSubmissionSchema } from './formSchema';
import type { Actions } from '@sveltejs/kit';
import { fail, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { properties, meters, readings, floors, rentalUnit } from '$lib/server/schema';
import { eq, and, asc, desc, inArray, lt, isNotNull } from 'drizzle-orm';

export const load: ServerLoad = async ({ params, locals, setHeaders }) => {
	const { slug: propertySlug, date } = params;
	console.log(`[LOAD] Loading utility input page for ${propertySlug}/${date}`);

	// OPTIMIZATION: Cache the GET request
	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=60'
	});

	let errors: string[] = [];
	let errorDetails: string[] = [];

	if (!propertySlug) errorDetails.push('Property slug is required');
	if (!date) errorDetails.push('Date parameter is required');

	// Validate date format before any new Date() calls (EC-P0-1)
	if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		errorDetails.push('Invalid date format. Expected YYYY-MM-DD.');
	} else if (date && isNaN(new Date(date + 'T00:00:00Z').getTime())) {
		errorDetails.push('Invalid date. The date does not exist.');
	}

	// Since Drizzle doesn't have RLS, we query directly (no service role needed)

	// Fetch property details by slug
	let property = null;
	if (propertySlug && !errorDetails.length) {
		console.log(`Looking for property with slug: "${propertySlug}"`);

		// Support both numeric ID and name-based lookup for URL consistency
		const isNumericId = /^\d+$/.test(propertySlug);
		const propertyResult = await db
			.select({ id: properties.id, name: properties.name, status: properties.status })
			.from(properties)
			.where(isNumericId ? eq(properties.id, Number(propertySlug)) : eq(properties.name, propertySlug))
			.limit(1);

		const propertyData = propertyResult[0];

		if (!propertyData) {
			errorDetails.push(`Property with slug "${propertySlug}" not found`);
		} else if (propertyData.status !== 'ACTIVE') {
			errorDetails.push(`Property is not active`);
		} else {
			console.log(`Property found: ${propertyData.name}`);
			property = propertyData;
		}
	}

	// Helper function to generate future date links
	function generateFutureDateLinks(propId: number, currentDate: string) {
		const serverToday = new Date().toISOString().split('T')[0];
		const todayObj = new Date(serverToday);

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

		if (isCurrentViewingDate) {
			futureDates.push(`${label} *(current)*`);
		} else {
			futureDates.push(`[${label}](/utility-input/electricity/${propId}/${tomorrowStr})`);
		}

		if (futureDates.length > 0) {
			return `\n\nTomorrow's input:\n${futureDates.join('')}`;
		}
		return '';
	}

	// EARLY CHECK: If property exists, check for existing readings
	let existingReadingsCount = 0;
	if (property && date && !errorDetails.length) {
		const meterIdsResult = await db
			.select({ id: meters.id })
			.from(meters)
			.where(
				and(
					eq(meters.propertyId, property.id),
					eq(meters.type, 'ELECTRICITY'),
					eq(meters.isActive, true)
				)
			);

		const meterIdList = meterIdsResult.map((m) => m.id);

		if (meterIdList.length > 0) {
			const existingReadings = await db
				.select({ id: readings.id, meterId: readings.meterId, readingDate: readings.readingDate, reading: readings.reading })
				.from(readings)
				.where(
					and(
						eq(readings.readingDate, date),
						inArray(readings.meterId, meterIdList),
						isNotNull(readings.reading)
					)
				);

			const validReadings = existingReadings.filter((r) => r.reading !== null && r.reading !== undefined);
			existingReadingsCount = validReadings.length;

			if (existingReadingsCount > 0) {
				const futureDateLinks = generateFutureDateLinks(property.id, date);
				const displayDate = new Date(date).toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});

				const successMessage = `Information:\n Existing Data Found\n\n${displayDate} already has ${existingReadingsCount} meter reading${existingReadingsCount > 1 ? 's' : ''} recorded.\n\nTo enter new readings, navigate to a date without existing data.${futureDateLinks}`;

				return {
					meters: [],
					property: property,
					date: date,
					errors: [successMessage],
					form: await superValidate(zod(readingSubmissionSchema)),
					currentServerDate: new Date().toISOString().split('T')[0]
				};
			}
		}
	}

	// Fetch active electricity meters for this property
	let metersData: any[] = [];
	if (property && !errorDetails.length) {
		const metersResult = await db
			.select({
				id: meters.id,
				name: meters.name,
				locationType: meters.locationType,
				propertyId: meters.propertyId,
				floorId: meters.floorId,
				rentalUnitId: meters.rentalUnitId,
				type: meters.type,
				initialReading: meters.initialReading,
				isActive: meters.isActive,
				notes: meters.notes,
				createdAt: meters.createdAt,
				propertyName: properties.name,
				floorNumber: floors.floorNumber,
				floorWing: floors.wing,
				unitNumber: rentalUnit.number
			})
			.from(meters)
			.leftJoin(properties, eq(meters.propertyId, properties.id))
			.leftJoin(floors, eq(meters.floorId, floors.id))
			.leftJoin(rentalUnit, eq(meters.rentalUnitId, rentalUnit.id))
			.where(
				and(
					eq(meters.propertyId, property.id),
					eq(meters.type, 'ELECTRICITY'),
					eq(meters.isActive, true)
				)
			)
			.orderBy(asc(meters.name));

		metersData = metersResult.map((m) => ({
			...m,
			property: m.propertyName ? { name: m.propertyName } : null,
			floor: m.floorNumber !== null ? { floor_number: m.floorNumber, wing: m.floorWing } : null,
			rental_unit: m.unitNumber !== null ? { number: m.unitNumber } : null
		}));
	}

	// Fetch latest readings for these meters
	const meterIds = metersData.map((m: any) => m.id);
	let latestReadings: Record<number, { value: number; date: string }> = {};

	if (meterIds.length > 0 && !errorDetails.length) {
		const readingsResult = await db
			.select({ meterId: readings.meterId, reading: readings.reading, readingDate: readings.readingDate })
			.from(readings)
			.where(inArray(readings.meterId, meterIds))
			.orderBy(desc(readings.readingDate));

		readingsResult.forEach((reading: any) => {
			if (!latestReadings[reading.meterId]) {
				latestReadings[reading.meterId] = {
					value: Number(reading.reading),
					date: reading.readingDate
				};
			}
		});
	}

	// Attach readings to meters
	const metersWithReadings: ElectricityMeter[] = metersData.map((meter: any) => ({
		...meter,
		latest_reading: latestReadings[meter.id]
	}));

	// Initialize form
	const initialFormData: Record<string, any> = {
		readings_json: '',
		reading_date: date || ''
	};

	if (metersWithReadings.length > 0) {
		metersWithReadings.forEach((meter: ElectricityMeter) => {
			initialFormData[`reading_${meter.id}`] = '';
		});
	}

	const form = await superValidate(zod(readingSubmissionSchema), { defaults: initialFormData });

	// Validate date is not before last reading
	if (date && metersWithReadings.length > 0) {
		const metersWithReadingsFiltered = metersWithReadings.filter((meter) => meter.latest_reading);

		if (metersWithReadingsFiltered.length > 0) {
			const maxTimestamp = Math.max(
				...metersWithReadingsFiltered.map((meter) => new Date(meter.latest_reading!.date).getTime())
			);

			const lastReadingDate = new Date(maxTimestamp);
			lastReadingDate.setUTCHours(0, 0, 0, 0);
			const requestedDate = new Date(date + 'T00:00:00.000Z');
			requestedDate.setUTCHours(0, 0, 0, 0);

			if (requestedDate < lastReadingDate) {
				const requestedFormatted = new Date(date).toLocaleDateString('en-US', {
					weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
				});
				const lastReadingFormatted = lastReadingDate.toLocaleDateString('en-US', {
					weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
				});

				const nextDay = new Date(lastReadingDate.getTime() + 24 * 60 * 60 * 1000);
				const year = nextDay.getFullYear();
				const month = String(nextDay.getMonth() + 1).padStart(2, '0');
				const day = String(nextDay.getDate()).padStart(2, '0');
				const dateString = `${year}-${month}-${day}`;

				const nextDayFormatted = nextDay.toLocaleDateString('en-US', {
					weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
				});
				const validDateUrl = `/utility-input/electricity/${property!.id}/${dateString}`;
				const validDateButton = `[Next Reading Date: ${nextDayFormatted}](${validDateUrl})`;

				const today = new Date();
				const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
				const todayFormatted = today.toLocaleDateString('en-US', {
					weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
				});
				const todayButton = `[Today's Date: ${todayFormatted}](/utility-input/electricity/${property!.id}/${todayString})`;

				errorDetails.push(
					`Date Restriction\n\nYou requested: ${requestedFormatted}\nLast reading: ${lastReadingFormatted}\n\nCannot access dates before your most recent meter reading.\n\n${validDateButton}\n\n${todayButton}`
				);
			}
		}
	}

	if (errorDetails.length > 0) {
		errors = errorDetails;
	}

	return {
		meters: metersWithReadings,
		property: property,
		date: date || '',
		errors: errors,
		form,
		currentServerDate: new Date().toISOString().split('T')[0]
	};
};

export const actions: Actions = {
	addReadings: async ({ request }) => {
		console.log('Server: addReadings action started');

		const form = await superValidate(request, zod(readingSubmissionSchema));

		if (!form.valid) {
			return fail(400, { form, error: 'Validation failed. Please correct the errors and try again.' });
		}

		try {
			// PUBLIC ACCESS: Skip authentication checks (since Drizzle has no RLS)

			const readingsInput = JSON.parse(form.data.readings_json) as Array<{
				meter_id: number;
				reading: number;
				reading_date: string;
			}>;

			const meterIds = readingsInput.map((r) => r.meter_id);

			// Check for duplicate readings
			const existingReadings = await db
				.select({ meterId: readings.meterId, readingDate: readings.readingDate })
				.from(readings)
				.where(
					and(
						inArray(readings.meterId, meterIds),
						eq(readings.readingDate, form.data.reading_date)
					)
				);

			if (existingReadings.length > 0) {
				const duplicateMeters = existingReadings.map((r) => r.meterId);
				const meterNames = await db
					.select({ id: meters.id, name: meters.name })
					.from(meters)
					.where(inArray(meters.id, duplicateMeters));
				const names = meterNames.map((m) => m.name).join(', ') || 'Unknown meters';
				return fail(400, {
					form,
					error: `Readings already exist for ${form.data.reading_date} for: ${names}.`
				});
			}

			// Load previous readings
			const previousReadings = await db
				.select({ meterId: readings.meterId, reading: readings.reading, readingDate: readings.readingDate })
				.from(readings)
				.where(
					and(
						inArray(readings.meterId, meterIds),
						lt(readings.readingDate, form.data.reading_date)
					)
				)
				.orderBy(desc(readings.readingDate));

			// Fallback to initial meter readings
			const metersData = await db
				.select({ id: meters.id, initialReading: meters.initialReading, name: meters.name })
				.from(meters)
				.where(inArray(meters.id, meterIds));

			const previousReadingMap: Record<number, number> = {};
			for (const r of previousReadings) {
				if (previousReadingMap[r.meterId] === undefined) previousReadingMap[r.meterId] = Number(r.reading);
			}
			const initialReadingMap: Record<number, number> = Object.fromEntries(
				metersData.map((m) => [m.id, Number(m.initialReading ?? 0)])
			);
			const meterNameMap: Record<number, string> = Object.fromEntries(
				metersData.map((m) => [m.id, m.name])
			);

			const readingsToInsert = readingsInput.map((r) => {
				const current = Number(r.reading);
				const hasValidPreviousReading = previousReadingMap[r.meter_id] !== undefined;
				let previous: number;

				if (hasValidPreviousReading) {
					previous = previousReadingMap[r.meter_id];
				} else {
					const initialReading = initialReadingMap[r.meter_id];
					if (initialReading !== null && initialReading !== undefined) {
						previous = initialReading;
					} else {
						const meterName = meterNameMap[r.meter_id] || `ID ${r.meter_id}`;
						const FIRST_READING_MAX = 999999;
						if (current > FIRST_READING_MAX) {
							throw new Error(
								`First Reading Validation for meter ${meterName}: ${current.toLocaleString()} kWh exceeds maximum of ${FIRST_READING_MAX.toLocaleString()} kWh.`
							);
						}
						return {
							meterId: r.meter_id,
							reading: String(current),
							readingDate: r.reading_date,
							reviewStatus: 'PENDING_REVIEW'
						};
					}
				}

				const meterName = meterNameMap[r.meter_id] || `ID ${r.meter_id}`;

				if (current < previous) {
					throw new Error(
						`Invalid reading for meter ${meterName}: ${current} is less than previous reading ${previous}.`
					);
				}

				const consumption = current - previous;
				const isFirstReading = !hasValidPreviousReading;
				const EXTREME_THRESHOLD = 1000;
				const threshold = isFirstReading ? EXTREME_THRESHOLD * 2 : EXTREME_THRESHOLD;

				if (consumption > threshold) {
					throw new Error(
						`Extreme Consumption Alert for meter ${meterName}: consumption ${consumption.toLocaleString()} kWh exceeds threshold ${threshold.toLocaleString()} kWh.`
					);
				}

				return {
					meterId: r.meter_id,
					reading: String(current),
					readingDate: r.reading_date,
					reviewStatus: 'PENDING_REVIEW'
				};
			});

			if (readingsToInsert.length === 0) {
				return fail(400, { form, error: 'Please enter at least one valid reading.' });
			}

			const newReadings = await db.insert(readings).values(readingsToInsert).returning();

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
