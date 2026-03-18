import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types';
import { batchReadingsSchema, meterReadingSchema } from './meterReadingSchema';
import type { z } from 'zod/v3';
import { db } from '$lib/server/db';
import { meters, readings, billings, profiles } from '$lib/server/schema';
import { eq, desc, inArray } from 'drizzle-orm';

// Use Node runtime

export const actions: Actions = {
	approvePendingReadings: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) return fail(401, { error: 'Unauthorized' });

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

		try {
			await db
				.update(readings)
				.set({ reviewStatus: 'APPROVED' })
				.where(inArray(readings.id, ids));
		} catch (err: any) {
			return fail(500, { error: `Failed to approve readings: ${err.message}` });
		}
		return { success: true };
	},

	rejectPendingReadings: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) return fail(401, { error: 'Unauthorized' });

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

		try {
			await db
				.update(readings)
				.set({ reviewStatus: 'REJECTED' })
				.where(inArray(readings.id, ids));
		} catch (err: any) {
			return fail(500, { error: `Failed to reject readings: ${err.message}` });
		}
		return { success: true };
	},

	createUtilityBillings: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const billingDataString = formData.get('billingData') as string;

		if (!billingDataString) {
			return fail(400, { error: 'Missing billingData' });
		}

		try {
			const billingsToCreate: Array<{
				lease_id: number;
				utility_type: string;
				billing_date: string;
				amount: number;
				notes: string;
				meter_id: number;
			}> = JSON.parse(billingDataString);

			const insertData = billingsToCreate.map((item) => {
				const dueDate = new Date(item.billing_date);
				dueDate.setDate(dueDate.getDate() + 15);
				return {
					leaseId: item.lease_id,
					type: 'UTILITY' as const,
					utilityType: item.utility_type as 'ELECTRICITY' | 'WATER' | 'INTERNET',
					amount: String(item.amount),
					balance: String(item.amount),
					status: 'PENDING' as const,
					dueDate: dueDate.toISOString().split('T')[0],
					billingDate: item.billing_date,
					notes: item.notes,
					meterId: item.meter_id
				};
			});

			await db.insert(billings).values(insertData);

			return { created: insertData.length, duplicates: [] };
		} catch (e: any) {
			if (e?.code === '23505') {
				return fail(409, { error: 'A billing for this period and lease already exists.' });
			}
			return fail(400, { error: 'Invalid JSON format for billingData' });
		}
	},

	addBatchReadings: async ({ request, locals }) => {
		console.log('=== Starting addBatchReadings ===');

		const formData = await request.formData();
		const rawReadingsJson = formData.get('readings_json') as string;
		const rawReadingDate = formData.get('reading_date') as string;
		const rawRateAtReading = formData.get('rate_at_reading') as string;
		const rawType = formData.get('type') as string;
		const rawBackdatingEnabled = formData.get('backdating_enabled') as string;

		const reconstructedFormData = new FormData();
		reconstructedFormData.append('readings_json', rawReadingsJson || '');
		reconstructedFormData.append('reading_date', rawReadingDate || '');
		reconstructedFormData.append('rate_at_reading', rawRateAtReading || '');
		reconstructedFormData.append('type', rawType || '');
		if (rawBackdatingEnabled !== null) {
			reconstructedFormData.append('backdating_enabled', rawBackdatingEnabled);
		}

		const form = await superValidate(reconstructedFormData, zod(batchReadingsSchema));

		if (!form.valid) {
			console.error('Validation failed', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const { user } = locals;
			if (!user) throw error(401, 'Unauthorized');

			// Check user permissions
			const profileResult = await db
				.select({ role: profiles.role })
				.from(profiles)
				.where(eq(profiles.id, user.id))
				.limit(1);
			const profile = profileResult[0];

			const isSuperAdmin = profile?.role === 'super_admin';
			const isPropertyAdmin = profile?.role === 'property_admin';
			const isPropertyUser = profile?.role === 'property_utility';

			if (!isSuperAdmin && !isPropertyAdmin && !isPropertyUser) {
				return fail(403, {
					form,
					error: 'Insufficient permissions to add meter readings.'
				});
			}

			const readingsInput: z.infer<typeof meterReadingSchema>[] = JSON.parse(
				form.data.readings_json
			);
			const { rate_at_reading, backdating_enabled } = form.data;

			const meterIds = readingsInput.map((r) => r.meter_id);

			const meterData = await db
				.select({ id: meters.id, name: meters.name, rentalUnitId: meters.rentalUnitId, type: meters.type })
				.from(meters)
				.where(inArray(meters.id, meterIds));

			const meterNameMap = Object.fromEntries(meterData.map((m) => [m.id, m.name]));

			const previousReadings = await db
				.select({ meterId: readings.meterId, reading: readings.reading, readingDate: readings.readingDate })
				.from(readings)
				.where(inArray(readings.meterId, meterIds))
				.orderBy(desc(readings.readingDate));

			const previousReadingMap: Record<number, number> = {};
			for (const r of previousReadings) {
				if (previousReadingMap[r.meterId] === undefined) previousReadingMap[r.meterId] = Number(r.reading);
			}

			const readingsToInsert = readingsInput
				.filter((r) => r.reading !== null)
				.map((r) => {
					const current = Number(r.reading);
					const previous = previousReadingMap[r.meter_id] ?? null;

					if (previous !== null && current < previous) {
						throw new Error(
							`Invalid reading for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}: ${current} is less than previous reading ${previous}`
						);
					}

					const consumption = previous !== null ? current - previous : null;

					if (consumption !== null && consumption > 50000) {
						throw new Error(
							`Unusually high consumption detected for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}: ${consumption} units.`
						);
					}

					if (consumption !== null && consumption < 0) {
						throw new Error(
							`Negative consumption detected for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}.`
						);
					}

					return {
						meterId: r.meter_id,
						reading: String(current),
						readingDate: r.reading_date,
						meterName: meterNameMap[r.meter_id] || null,
						rateAtReading: String(rate_at_reading),
						backdatingEnabled: backdating_enabled || false
					};
				});

			if (readingsToInsert.length === 0)
				return fail(400, { form, error: 'No valid readings to insert' });

			const newReadings = await db.insert(readings).values(readingsToInsert).returning();

			console.log('Readings inserted successfully');

			return {
				form,
				success: true,
				message: `Successfully added ${newReadings?.length ?? 0} meter readings`,
				readings: newReadings ?? []
			};
		} catch (err: any) {
			console.error('Error in addBatchReadings:', err);

			let userMessage = 'An unexpected error occurred while saving readings';
			if (err.message.includes('Invalid reading for meter')) {
				userMessage = err.message;
			} else if (err.message.includes('Unusually high consumption')) {
				userMessage = err.message;
			} else if (err.message.includes('Insufficient permissions')) {
				userMessage = 'You do not have permission to add meter readings';
			} else if (err.code === '23505') {
				userMessage = 'A reading for this date already exists for one or more meters';
			}

			return fail(500, {
				form,
				error: userMessage,
				details: process.env.NODE_ENV === 'development' ? err.message : undefined
			});
		}
	}
};
