import { db } from '$lib/server/db';
import { billings, leases } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export async function createPaymentSchedules(
	leaseId: number,
	startDate: string,
	endDate: string,
	monthlyRent: number,
	proratedAmount?: number | null
) {
	const schedules: any[] = [];
	const billingRecords: any[] = [];
	const start = new Date(startDate);
	const end = new Date(endDate);
	const today = new Date();

	// Add prorated payment if exists
	if (proratedAmount) {
		schedules.push({
			lease_id: leaseId,
			due_date: startDate,
			expected_amount: proratedAmount,
			type: 'RENT',
			frequency: 'ONE_TIME',
			notes: 'Prorated rent'
		});

		billingRecords.push({
			leaseId: leaseId,
			type: 'RENT' as const,
			amount: String(proratedAmount),
			paidAmount: '0',
			balance: String(proratedAmount),
			status: 'PENDING' as const,
			dueDate: startDate,
			billingDate: today.toISOString().split('T')[0],
			penaltyAmount: '0',
			notes: 'Prorated rent billing',
			updatedAt: new Date()
		});
	}

	// Generate monthly schedules and billings
	let currentDate = new Date(start);
	if (proratedAmount) {
		currentDate.setMonth(currentDate.getMonth() + 1);
		currentDate.setDate(1);
	}

	while (currentDate <= end) {
		const dueDate = currentDate.toISOString().split('T')[0];

		schedules.push({
			lease_id: leaseId,
			due_date: dueDate,
			expected_amount: monthlyRent,
			type: 'RENT',
			frequency: 'MONTHLY',
			notes: 'Monthly rent'
		});

		billingRecords.push({
			leaseId: leaseId,
			type: 'RENT' as const,
			amount: String(monthlyRent),
			paidAmount: '0',
			balance: String(monthlyRent),
			status: 'PENDING' as const,
			dueDate: dueDate,
			billingDate: today.toISOString().split('T')[0],
			penaltyAmount: '0',
			notes: 'Monthly rent billing',
			updatedAt: new Date()
		});

		currentDate.setMonth(currentDate.getMonth() + 1);
	}

	// Calculate total expected amount
	const totalExpected = schedules.reduce((sum, schedule) => sum + schedule.expected_amount, 0);

	try {
		// Insert billings (payment_schedules table may not exist in Drizzle schema yet)
		if (billingRecords.length > 0) {
			await db.insert(billings).values(billingRecords);
		}

		return { schedules, billings: billingRecords };
	} catch (error) {
		console.error('Error in createPaymentSchedules:', error);
		throw error;
	}
}
