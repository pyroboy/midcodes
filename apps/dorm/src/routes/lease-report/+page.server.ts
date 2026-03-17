import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseReportFilterSchema } from './reportSchema';
import type { Actions, PageServerLoad } from './$types';
import type { Floor, RentalUnit, Lease, Tenant, Billing, Property, LeaseTenant } from './types';
import type {
	FloorGroup,
	RentalUnitGroup,
	TenantPaymentRecord,
	MonthlyPaymentStatus,
	LeaseReportData
} from './reportSchema';
import { db } from '$lib/server/db';
import { floors, properties, rentalUnit, leases, leaseTenants, tenants, billings } from '$lib/server/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';

// Configure ISR for lease report caching
export const config = {
	isr: {
		expiration: 180,
		allowQuery: ['propertyId', 'startMonth', 'monthCount']
	}
};

function getMonthsArray(startMonth: string, monthCount: number): string[] {
	const [year, month] = startMonth.split('-').map((n) => parseInt(n));
	const months: string[] = [];
	for (let i = 0; i < monthCount; i++) {
		const newMonth = ((month + i - 1) % 12) + 1;
		const newYear = year + Math.floor((month + i - 1) / 12);
		months.push(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
	}
	return months;
}

function getMonthlyPaymentStatus(
	billingsArr: Billing[],
	month: string,
	type: 'RENT' | 'UTILITIES' | 'PENALTY'
): 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE' {
	let billingTypes: string[] = [];
	if (type === 'UTILITIES') billingTypes = ['UTILITIES', 'UTILITY'];
	else if (type === 'PENALTY') billingTypes = ['PENALTY'];
	else billingTypes = ['RENT'];

	const relevantBillings = billingsArr.filter((billing) => {
		const billingMonth = billing.due_date.substring(0, 7);
		return billingMonth === month && billingTypes.includes(billing.type);
	});

	if (relevantBillings.length === 0) return 'PENDING';
	if (relevantBillings.every((b) => b.status === 'PAID')) return 'PAID';
	if (relevantBillings.some((b) => b.status === 'OVERDUE')) return 'OVERDUE';
	if (relevantBillings.some((b) => b.status === 'PARTIAL')) return 'PARTIAL';
	return 'PENDING';
}

function getMonthlyAmount(billingsArr: Billing[], month: string, type: 'RENT' | 'UTILITIES' | 'PENALTY'): number {
	let billingTypes: string[] = [];
	if (type === 'UTILITIES') billingTypes = ['UTILITIES', 'UTILITY'];
	else if (type === 'PENALTY') billingTypes = ['PENALTY'];
	else billingTypes = ['RENT'];

	return billingsArr
		.filter((billing) => {
			const billingMonth = billing.due_date.substring(0, 7);
			return billingMonth === month && billingTypes.includes(billing.type);
		})
		.reduce((total, billing) => total + billing.amount, 0);
}

function getFloorSuffix(floorNumber: number): string {
	if (floorNumber === 1) return 'st';
	if (floorNumber === 2) return 'nd';
	if (floorNumber === 3) return 'rd';
	return 'th';
}

function calculatePaymentTotals(leaseBillings: Billing[]) {
	let totalPaid = 0, totalRentPaid = 0, totalUtilitiesPaid = 0, totalPenaltyPaid = 0, totalPending = 0;

	leaseBillings.forEach((billing) => {
		const processType = (paidTarget: { add: (v: number) => void }) => {
			if (billing.status === 'PAID') {
				const amt = billing.paid_amount || 0;
				paidTarget.add(amt);
				totalPaid += amt;
			} else if (billing.status === 'PARTIAL') {
				const paidAmount = billing.paid_amount || 0;
				paidTarget.add(paidAmount);
				totalPaid += paidAmount;
				totalPending += billing.amount - paidAmount;
			} else if (billing.status === 'PENDING' || billing.status === 'OVERDUE') {
				totalPending += billing.amount;
			}
		};

		if (billing.type === 'RENT') {
			processType({ add: (v) => { totalRentPaid += v; } });
		} else if (billing.type === 'UTILITIES' || billing.type === 'UTILITY') {
			processType({ add: (v) => { totalUtilitiesPaid += v; } });
		} else if (billing.type === 'PENALTY') {
			processType({ add: (v) => { totalPenaltyPaid += v; } });
		}
	});

	return { totalPaid, totalRentPaid, totalUtilitiesPaid, totalPenaltyPaid, totalPending };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = locals;
	if (!user) throw error(401, 'Unauthorized');

	const today = new Date();
	const defaultStartMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

	const filterForm = await superValidate(
		{
			startMonth: url.searchParams.get('startMonth') || defaultStartMonth,
			monthCount: parseInt(url.searchParams.get('monthCount') || '6'),
			floorId: url.searchParams.get('floorId')
				? parseInt(url.searchParams.get('floorId')!)
				: undefined,
			propertyId: url.searchParams.get('propertyId')
				? parseInt(url.searchParams.get('propertyId')!)
				: undefined,
			showInactiveLeases: url.searchParams.get('showInactiveLeases') === 'true'
		},
		zod(leaseReportFilterSchema)
	);

	try {
		const startTime = performance.now();

		// Fetch all required data
		const [floorsData, propertiesData, rentalUnitsData] = await Promise.all([
			db.select().from(floors).where(eq(floors.status, 'ACTIVE')),
			db.select().from(properties).where(eq(properties.status, 'ACTIVE')),
			db
				.select({
					id: rentalUnit.id,
					name: rentalUnit.name,
					number: rentalUnit.number,
					capacity: rentalUnit.capacity,
					floorId: rentalUnit.floorId,
					propertyId: rentalUnit.propertyId,
					propertyName: properties.name,
					propertyDbId: properties.id
				})
				.from(rentalUnit)
				.leftJoin(properties, eq(rentalUnit.propertyId, properties.id))
		]);

		// Build lease query
		let leasesData;
		if (!filterForm.data.showInactiveLeases) {
			leasesData = await db.select().from(leases).where(eq(leases.status, 'ACTIVE'));
		} else {
			leasesData = await db.select().from(leases);
		}

		// Fetch lease tenants with tenant data
		const leaseIds = leasesData.map((l: any) => l.id);
		const leaseTenantsData = leaseIds.length > 0
			? await db
					.select({
						leaseId: leaseTenants.leaseId,
						tenantId: tenants.id,
						tenantName: tenants.name
					})
					.from(leaseTenants)
					.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
					.where(inArray(leaseTenants.leaseId, leaseIds))
			: [];

		// Fetch billings for these leases
		const billingsData = leaseIds.length > 0
			? await db.select().from(billings).where(inArray(billings.leaseId, leaseIds))
			: [];

		// Build lookup maps
		const ltMap = new Map<number, any[]>();
		for (const lt of leaseTenantsData) {
			if (!ltMap.has(lt.leaseId)) ltMap.set(lt.leaseId, []);
			ltMap.get(lt.leaseId)!.push({ tenant: { id: lt.tenantId, name: lt.tenantName } });
		}

		const billingsMap = new Map<number, any[]>();
		for (const b of billingsData) {
			const mapped = {
				...b,
				due_date: b.dueDate,
				paid_amount: b.paidAmount,
				lease_id: b.leaseId
			};
			if (!billingsMap.has(b.leaseId)) billingsMap.set(b.leaseId, []);
			billingsMap.get(b.leaseId)!.push(mapped);
		}

		// Generate months array
		const months = getMonthsArray(filterForm.data.startMonth, filterForm.data.monthCount);
		const endMonth = months[months.length - 1];

		const reportData: LeaseReportData = {
			floors: [],
			reportPeriod: { startMonth: filterForm.data.startMonth, endMonth, months }
		};

		let filteredFloors = floorsData || [];
		if (filterForm.data.floorId) {
			filteredFloors = filteredFloors.filter((floor: any) => floor.id === filterForm.data.floorId);
		}
		if (filterForm.data.propertyId) {
			filteredFloors = filteredFloors.filter(
				(floor: any) => floor.propertyId === filterForm.data.propertyId
			);
		}
		filteredFloors.sort((a: any, b: any) => a.floorNumber - b.floorNumber);

		for (const floor of filteredFloors as any[]) {
			const floorGroup: FloorGroup = {
				floorId: floor.id,
				floorNumber: `${floor.floorNumber}${getFloorSuffix(floor.floorNumber)} Floor`,
				wing: floor.wing,
				rentalUnits: []
			};

			const floorRentalUnits = rentalUnitsData
				.filter((unit: any) => unit.floorId === floor.id)
				.sort((a: any, b: any) => a.number - b.number);

			for (const unit of floorRentalUnits) {
				const unitGroup: RentalUnitGroup = {
					rentalUnitId: unit.id,
					roomName: unit.name,
					capacity: unit.capacity,
					tenantRecords: []
				};

				const unitLeases = leasesData.filter((l: any) => l.rentalUnitId === unit.id);

				for (const lease of unitLeases as any[]) {
					const leaseTenantsForLease = ltMap.get(lease.id) || [];

					for (const leaseTenant of leaseTenantsForLease) {
						const tenant = leaseTenant.tenant;
						if (!tenant) continue;

						const leaseBillings = billingsMap.get(lease.id) || [];

						const monthlyPayments: MonthlyPaymentStatus[] = months.map((month) => {
							const rentPaidAmount = leaseBillings
								.filter((b: any) => b.type === 'RENT' && b.due_date.substring(0, 7) === month)
								.reduce((total: number, b: any) => total + (b.paid_amount || 0), 0);

							const utilitiesPaidAmount = leaseBillings
								.filter((b: any) =>
									(b.type === 'UTILITIES' || b.type === 'UTILITY') &&
									b.due_date.substring(0, 7) === month
								)
								.reduce((total: number, b: any) => total + (b.paid_amount || 0), 0);

							const penaltyPaidAmount = leaseBillings
								.filter((b: any) => b.type === 'PENALTY' && b.due_date.substring(0, 7) === month)
								.reduce((total: number, b: any) => total + (b.paid_amount || 0), 0);

							return {
								month,
								rent: getMonthlyPaymentStatus(leaseBillings, month, 'RENT'),
								utilities: getMonthlyPaymentStatus(leaseBillings, month, 'UTILITIES'),
								penalty: getMonthlyPaymentStatus(leaseBillings, month, 'PENALTY'),
								rentAmount: getMonthlyAmount(leaseBillings, month, 'RENT'),
								utilitiesAmount: getMonthlyAmount(leaseBillings, month, 'UTILITIES'),
								penaltyAmount: getMonthlyAmount(leaseBillings, month, 'PENALTY'),
								rentPaidAmount,
								utilitiesPaidAmount,
								penaltyPaidAmount
							};
						});

						const paymentTotals = calculatePaymentTotals(leaseBillings);

						const tenantRecord: TenantPaymentRecord = {
							tenantId: tenant.id,
							tenantName: tenant.name,
							leaseId: lease.id,
							leaseName: lease.name,
							securityDeposit: lease.securityDeposit,
							startDate: lease.startDate,
							monthlyPayments,
							totalPaid: paymentTotals.totalPaid,
							totalRentPaid: paymentTotals.totalRentPaid,
							totalUtilitiesPaid: paymentTotals.totalUtilitiesPaid,
							totalPenaltyPaid: paymentTotals.totalPenaltyPaid,
							totalPending: paymentTotals.totalPending
						};

						unitGroup.tenantRecords.push(tenantRecord);
					}
				}

				if (unitGroup.tenantRecords.length > 0) {
					floorGroup.rentalUnits.push(unitGroup);
				}
			}

			if (floorGroup.rentalUnits.length > 0) {
				reportData.floors.push(floorGroup);
			}
		}

		const queryTime = performance.now() - startTime;
		console.log('Data fetch completed:', {
			floors: reportData.floors.length,
			time: `${queryTime.toFixed(2)}ms`
		});

		return {
			filterForm,
			reportData,
			properties: propertiesData || []
		};
	} catch (err) {
		console.error('LR-1005 - Error in load function:', err);
		throw error(500, 'LR-1005 - Internal server error');
	}
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const params = new URLSearchParams();

		const startMonth = formData.get('startMonth') as string;
		const monthCount = formData.get('monthCount') as string;
		const propertyId = formData.get('propertyId') as string;
		const floorId = formData.get('floorId') as string;
		const showInactiveLeases = formData.get('showInactiveLeases') as string;

		if (startMonth) params.set('startMonth', startMonth);
		if (monthCount) params.set('monthCount', monthCount);
		if (propertyId) params.set('propertyId', propertyId);
		if (floorId) params.set('floorId', floorId);
		if (showInactiveLeases) params.set('showInactiveLeases', 'true');

		const newUrl = url.pathname + '?' + params.toString();
		throw redirect(302, newUrl);
	}
};
