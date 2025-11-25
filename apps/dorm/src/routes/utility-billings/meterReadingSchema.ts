import { z } from 'zod';

export const utilityBillingTypeEnum = {
	enum: {
		WATER: 'WATER',
		ELECTRICITY: 'ELECTRICITY',
		GAS: 'GAS',
		INTERNET: 'INTERNET',
		CABLE: 'CABLE',
		OTHER: 'OTHER'
	}
} as const;

export const utilityBillingSchema = z.object({
	start_date: z.coerce.date(),
	end_date: z.coerce.date(),
	type: z.enum(Object.values(utilityBillingTypeEnum.enum) as [string, ...string[]]),
	rate_at_reading: z.coerce.number().positive(),
	org_id: z.string().uuid(),
	property_id: z.string() // Add property_id to the schema
});

export const meterBillingSchema = z.object({
	meter_id: z.number(),
	meter_name: z.string(),
	start_reading: z.number(),
	end_reading: z.number(),
	consumption: z.number(),
	total_cost: z.number(),
	tenant_count: z.coerce.number(),
	per_tenant_cost: z.number()
});

export const utilityBillingCreationSchema = utilityBillingSchema.extend({
	meter_billings: z.array(meterBillingSchema)
});

// Enhanced schema for a single meter reading with flexible date validation
export const meterReadingSchema = z
	.object({
		meter_id: z.number().positive('Meter is required'),
		reading: z
			.number()
			.positive('Reading must be a positive number')
			.max(999999999, 'Reading value is too high (max 999,999,999)')
			.refine((val) => Number.isFinite(val) && val >= 0, {
				message: 'Reading must be a valid positive number'
			}),
		reading_date: z
			.string()
			.refine((val) => !isNaN(Date.parse(val)), {
				message: 'Invalid date format'
			})
			.refine(
				(val) => {
					const date = new Date(val);
					const now = new Date();
					// Relaxed future date validation: Allow at least 31 days in future
					const thirtyOneDaysFromNow = new Date(now);
					thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);
					// Backdating support: Allow up to 1 year in the past
					const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
					return date >= oneYearAgo && date <= thirtyOneDaysFromNow;
				},
				{
					message:
						'Reading date must be within the last year and not more than 31 days in the future'
				}
			),
		// New field to track if backdating was enabled for audit purposes
		backdating_enabled: z.boolean().optional().default(false)
	});

// Enhanced schema for batch meter readings with flexible validation
export const batchReadingsSchema = z
	.object({
		readings_json: z
			.string()
			.min(1, 'Readings data is required')
			.refine(
				(val) => {
					try {
						const parsed = JSON.parse(val);
						if (!Array.isArray(parsed)) {
							console.error('Parsed readings is not an array:', parsed);
							return false;
						}
						if (parsed.length === 0) {
							console.error('No readings provided in array');
							return false;
						}

						// Validate each reading with detailed logging
						const validationResults = parsed.map((reading, index) => {
							const validation = meterReadingSchema.safeParse(reading);
							if (!validation.success) {
								console.error(
									`Reading ${index} validation failed:`,
									validation.error.errors,
									'Reading data:',
									reading
								);
							}
							return validation.success;
						});

						const allValid = validationResults.every(Boolean);
						console.log('All readings valid:', allValid, 'Results:', validationResults);
						return allValid;
					} catch (error) {
						console.error('JSON parsing error:', error, 'Value:', val);
						return false;
					}
				},
				{
					message:
						'Invalid readings data. Please check that all readings have valid meter IDs, positive numbers, and correct dates.'
				}
			),
		reading_date: z
			.string()
			.min(1, 'Reading date is required')
			.refine(
				(val) => {
					const parsed = Date.parse(val);
					const isValid = !isNaN(parsed);
					if (!isValid) {
						console.error('Invalid date format:', val);
					}
					return isValid;
				},
				{
					message: 'Invalid date format. Please use YYYY-MM-DD format.'
				}
			)
			.refine(
				(val) => {
					const date = new Date(val + 'T00:00:00'); // Ensure local timezone
					const now = new Date();
					// Relaxed future date validation: Allow at least 31 days in future
					const thirtyOneDaysFromNow = new Date(now);
					thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);
					// Backdating support: Allow up to 1 year in the past
					const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
					const isInRange = date >= oneYearAgo && date <= thirtyOneDaysFromNow;
					if (!isInRange) {
						console.error(
							'Date out of range:',
							val,
							'Parsed:',
							date,
							'Range:',
							oneYearAgo,
							'to',
							thirtyOneDaysFromNow
						);
					}
					return isInRange;
				},
				{
					message:
						'Reading date must be within the last year and not more than 31 days in the future'
				}
			),
		rate_at_reading: z.coerce
			.number()
			.positive('Rate per unit must be a positive number')
			.max(1000, 'Rate per unit is too high (max ₱1,000)')
			.min(0.01, 'Rate per unit must be at least ₱0.01'),
		type: z.enum(['WATER', 'ELECTRICITY', 'GAS', 'INTERNET', 'CABLE', 'OTHER']).optional(),
		// New field to track backdating state for the batch
		backdating_enabled: z.boolean().optional().default(false)
	})
	.refine(
		(data) => {
			// Enhanced business rule: Check for reasonable reading values
			try {
				const readings = JSON.parse(data.readings_json);
				const invalidReadings: string[] = [];

				const allValid = readings.every((reading: any) => {
					// Flag unusually high readings (adjust threshold as needed)
					if (reading.reading > 999999999) {
						invalidReadings.push(`Meter ID ${reading.meter_id}: reading too high (${reading.reading})`);
						return false;
					}
					if (reading.reading < 0) {
						invalidReadings.push(
							`Meter ID ${reading.meter_id}: negative reading (${reading.reading})`
						);
						return false;
					}
					return true;
				});

				if (!allValid) {
					console.error('Reading validation failed for readings:', invalidReadings);
				}

				return allValid;
			} catch (error) {
				console.error('Error validating readings:', error);
				return false;
			}
		},
		{
			message: 'One or more readings show invalid values. Please verify the readings.',
			path: ['readings_json']
		}
	)
	.refine(
		(data) => {
			// Enhanced date validation with flexible warnings instead of strict errors
			const currentDate = new Date(data.reading_date);
			const now = new Date();

			// Warn about future dates (more than 1 day ahead) but allow
			const oneDayFromNow = new Date(now);
			oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

			if (currentDate > oneDayFromNow) {
				console.warn('Reading date is in the future:', data.reading_date);
				// Allow future dates but warn
			}

			// Enhanced: Warn about weekend readings for business properties (informational)
			const dayOfWeek = currentDate.getDay();
			const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

			if (isWeekend) {
				console.warn('Reading scheduled for weekend:', data.reading_date);
			}

			return true; // Always pass validation, warnings are handled in UI
		},
		{
			message: 'Reading date validation failed. Please check the selected date.',
			path: ['reading_date']
		}
	);

export type MeterReadingSchema = typeof meterReadingSchema;
export type BatchReadingsSchema = typeof batchReadingsSchema;
