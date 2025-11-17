import { z } from 'zod';

// Base schema for individual readings
export const singleReadingSchema = z.object({
	meter_id: z.number().positive('Meter is required'),
	reading: z
		.number()
		.min(0, 'Reading must be a positive number')
		.max(999_999_999, 'Reading value is too high (max 999,999,999)')
		.refine((val) => Number.isFinite(val), { message: 'Reading must be a valid number' }),
	reading_date: z
		.string()
		.refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
});

// Schema for individual meter reading input fields
export const meterReadingFieldSchema = z
	.string()
	.min(1, 'Reading is required')
	.refine((val) => {
		// Allow decimal values with up to 2 decimal places
		const decimalRegex = /^\d+(\.\d{0,2})?$/;
		return decimalRegex.test(val);
	}, 'Must be a valid number (max 2 decimal places)')
	.refine((val) => {
		const num = Number(val);
		return Number.isFinite(num) && num >= 0;
	}, 'Reading must be a valid positive number')
	.refine((val) => {
		const num = Number(val);
		return num <= 999_999_999;
	}, 'Reading value is too high (max 999,999,999)');

export const readingSubmissionSchema = z.object({
	readings_json: z
		.string()
		.min(1, 'Readings data is required')
		.refine((val) => {
			try {
				const parsed = JSON.parse(val);
				if (!Array.isArray(parsed) || parsed.length === 0) return false;
				return parsed.every((r) => singleReadingSchema.safeParse(r).success);
			} catch {
				return false;
			}
		}, {
			message:
				'Invalid readings data. Please ensure each reading has meter_id, reading, and reading_date.'
		}),
	reading_date: z
		.string()
		.min(1, 'Reading date is required')
		.refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
});

export type ReadingSubmissionSchema = typeof readingSubmissionSchema;
