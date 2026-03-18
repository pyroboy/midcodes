import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import {
	rentalUnit,
	leases,
	leaseTenants,
	floors,
	billings,
	payments,
	expenses
} from '$lib/server/schema';
import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { session, user } = locals;
	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	// Get query parameters
	const propertyId = url.searchParams.get('propertyId');
	const year = url.searchParams.get('year') || new Date().getFullYear().toString();
	const month =
		url.searchParams.get('month') ||
		new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();

	if (!propertyId) {
		return json({ error: 'Property ID is required' }, { status: 400 });
	}

	console.log('API: Fetching report data for', { propertyId, year, month });

	// Convert month name to month number (1-12)
	const months = [
		'january',
		'february',
		'march',
		'april',
		'may',
		'june',
		'july',
		'august',
		'september',
		'october',
		'november',
		'december'
	];
	const monthIndex = months.indexOf(month.toLowerCase()) + 1;

	// Calculate date range for the selected month
	const startDate = new Date(parseInt(year), monthIndex - 1, 1);
	const endDate = new Date(parseInt(year), monthIndex, 0); // Last day of the month

	// Format dates for database queries
	const startDateStr = startDate.toISOString().split('T')[0];
	const endDateStr = endDate.toISOString().split('T')[0];

	try {
		const propId = Number(propertyId);
		if (!Number.isFinite(propId)) {
			return json({ error: 'Invalid property ID' }, { status: 400 });
		}

		// Step 1: Get all rental units for the selected property
		const propertyUnits = await db
			.select({ id: rentalUnit.id })
			.from(rentalUnit)
			.where(eq(rentalUnit.propertyId, propId));

		const unitIds = propertyUnits.map((unit) => unit.id);

		// Step 2: Get all leases for the units in this property
		const leasesData =
			unitIds.length > 0
				? await db
						.select({ id: leases.id, rentalUnitId: leases.rentalUnitId })
						.from(leases)
						.where(inArray(leases.rentalUnitId, unitIds))
				: [];

		// Create a map of lease_id to rental_unit_id
		const leaseToUnitMap = new Map<number, number>();
		leasesData.forEach((lease) => {
			leaseToUnitMap.set(lease.id, lease.rentalUnitId);
		});

		// Step 3: Get all rental units with their floor IDs
		const rentalUnitsData = await db
			.select({ id: rentalUnit.id, floorId: rentalUnit.floorId })
			.from(rentalUnit)
			.where(eq(rentalUnit.propertyId, propId));

		// Create a map of rental_unit_id to floor_id
		const unitToFloorMap = new Map<number, number>();
		rentalUnitsData.forEach((unit) => {
			unitToFloorMap.set(unit.id, unit.floorId);
		});

		// Step 4: Get all floors for the selected property
		const floorsData = await db
			.select({ id: floors.id, floorNumber: floors.floorNumber })
			.from(floors)
			.where(eq(floors.propertyId, propId));

		// Create a map of floor_id to floor_number
		const floorMap = new Map<number, number>();
		floorsData.forEach((floor) => {
			floorMap.set(floor.id, floor.floorNumber);
		});

		// Step 5: Get all lease IDs for this property
		const leaseIds = leasesData.map((lease) => lease.id);

		// Initialize tenant counts for each floor
		const tenantCountByFloor = new Map<number, number>();
		floorsData.forEach((floor) => {
			tenantCountByFloor.set(floor.id, 0);
		});

		// Get all lease tenants for the active leases
		const leaseTenantsData =
			leaseIds.length > 0
				? await db
						.select({ leaseId: leaseTenants.leaseId, tenantId: leaseTenants.tenantId })
						.from(leaseTenants)
						.where(inArray(leaseTenants.leaseId, leaseIds))
				: [];

		// Count tenants per floor
		leaseTenantsData.forEach((leaseTenant) => {
			const rentalUnitId = leaseToUnitMap.get(leaseTenant.leaseId);
			if (rentalUnitId) {
				const floorId = unitToFloorMap.get(rentalUnitId);
				if (floorId) {
					const currentCount = tenantCountByFloor.get(floorId) || 0;
					tenantCountByFloor.set(floorId, currentCount + 1);
				}
			}
		});

		// Step 6: Get all billings for the period
		const allBillings =
			leaseIds.length > 0
				? await db
						.select({
							id: billings.id,
							amount: billings.amount,
							type: billings.type,
							billingDate: billings.billingDate,
							leaseId: billings.leaseId,
							status: billings.status,
							balance: billings.balance,
							paidAmount: billings.paidAmount
						})
						.from(billings)
						.where(
							and(
								gte(billings.billingDate, startDateStr),
								lte(billings.billingDate, endDateStr),
								inArray(billings.leaseId, leaseIds)
							)
						)
				: [];

		// Step 7: Get payment history for the month
		const paymentsData = await db
			.select({
				id: payments.id,
				amount: payments.amount,
				paidAt: payments.paidAt,
				billingIds: payments.billingIds,
				method: payments.method
			})
			.from(payments)
			.where(
				and(
					gte(payments.paidAt, startDate),
					lte(payments.paidAt, new Date(endDate.getTime() + 86400000 - 1))
				)
			)
			.orderBy(desc(payments.paidAt));

		// Step 8: Get all expenses for the period and property
		const expensesData = await db
			.select({
				id: expenses.id,
				amount: expenses.amount,
				description: expenses.description,
				type: expenses.type,
				status: expenses.status,
				createdAt: expenses.createdAt
			})
			.from(expenses)
			.where(
				and(
					eq(expenses.propertyId, propId),
					gte(expenses.createdAt, startDate),
					lte(expenses.createdAt, endDate)
				)
			)
			.orderBy(desc(expenses.createdAt));

		// Initialize floorData structure for all floors
		const floorDataMap: Record<number, any> = {};
		const floorBillingsMap: Record<number, any[]> = {};

		floorsData.forEach((floor) => {
			const floorId = floor.id;
			floorDataMap[floorId] = {
				income: 0,
				note: '',
				tenantCount: tenantCountByFloor.get(floorId) || 0,
				collectible: 0,
				collected: 0,
				lastCollectionDate: undefined,
				floorNumber: floor.floorNumber,
				floorId: floorId
			};
			floorBillingsMap[floorId] = [];
		});

		// Group billings by floor - only for the current month
		allBillings.forEach((billing) => {
			const billingDate = new Date(billing.billingDate);
			if (billingDate >= startDate && billingDate <= endDate) {
				const leaseId = billing.leaseId;
				const unitId = leaseToUnitMap.get(leaseId);

				if (unitId) {
					const floorId = unitToFloorMap.get(unitId);
					if (floorId && floorBillingsMap[floorId]) {
						floorBillingsMap[floorId].push(billing);
					}
				}
			}
		});

		// Calculate collectibles and collected amounts per floor
		for (const [floorIdStr, floorBillings] of Object.entries(floorBillingsMap)) {
			const floorId = Number(floorIdStr);

			const totalBillable = floorBillings.reduce((sum, billing) => {
				if (billing.type === 'RENT') {
					return sum + Number(billing.amount || 0);
				}
				return sum;
			}, 0);

			floorDataMap[floorId].income = totalBillable;

			floorDataMap[floorId].collectible = floorBillings.reduce((sum, billing) => {
				if (
					billing.type === 'RENT' &&
					(billing.status === 'PENDING' || billing.status === 'PARTIAL')
				) {
					return sum + Number(billing.balance || 0);
				}
				return sum;
			}, 0);

			floorDataMap[floorId].collected = totalBillable - floorDataMap[floorId].collectible;
		}

		// Find last collection dates
		for (const [floorIdStr, floorBillings] of Object.entries(floorBillingsMap)) {
			const floorId = Number(floorIdStr);
			if (paymentsData.length > 0) {
				for (const payment of paymentsData) {
					const paymentDate = new Date(payment.paidAt);
					if (
						paymentDate >= startDate &&
						paymentDate <= new Date(endDate.getTime() + 86400000 - 1)
					) {
						const billingIds = payment.billingIds || [];
						const appliesToFloor = floorBillings.some((billing) =>
							billingIds.includes(billing.id)
						);

						if (appliesToFloor && !floorDataMap[floorId].lastCollectionDate) {
							floorDataMap[floorId].lastCollectionDate = payment.paidAt;
							break;
						}
					}
				}
			}
		}

		// Calculate totals
		const grossIncome = Object.values(floorDataMap).reduce(
			(sum, floor: any) => sum + Number(floor.income),
			0
		);

		const collectibles = Object.values(floorDataMap).reduce(
			(sum, floor: any) => sum + Number(floor.collectible),
			0
		);

		const collected = grossIncome - collectibles;

		// Group expenses by type
		const operationalExpenses =
			expensesData.filter((expense) => expense.type === 'OPERATIONAL') || [];
		const capitalExpenses = expensesData.filter((expense) => expense.type === 'CAPITAL') || [];

		const totalOperationalExpenses = operationalExpenses.reduce(
			(sum, expense) => sum + Number(expense.amount),
			0
		);
		const totalCapitalExpenses = capitalExpenses.reduce(
			(sum, expense) => sum + Number(expense.amount),
			0
		);

		const totalExpenses = totalOperationalExpenses + totalCapitalExpenses;
		const netBeforeCapital = grossIncome - totalOperationalExpenses;
		const netIncome = netBeforeCapital - totalCapitalExpenses;

		const fortyShare = netBeforeCapital * 0.4;
		const sixtyShareBeforeCapital = netBeforeCapital * 0.6;
		const sixtyShare = sixtyShareBeforeCapital - totalCapitalExpenses;

		const reportData = {
			floorData: floorDataMap,
			expenses: expensesData,
			profitSharing: {
				forty: fortyShare,
				sixty: sixtyShare
			},
			totals: {
				grossIncome,
				totalExpenses,
				netIncome,
				collectibles,
				collected,
				lastCollectionDate:
					paymentsData.length > 0 ? paymentsData[0].paidAt : undefined
			}
		};

		return json({ reportData });
	} catch (err) {
		console.error('Error in reports API:', err);
		return json(
			{
				error: `Failed to load report data: ${err instanceof Error ? err.message : 'Unknown error'}`
			},
			{ status: 500 }
		);
	}
};
