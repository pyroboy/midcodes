import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Database } from '$lib/database.types';

// Configure ISR for report caching
export const config = {
	isr: {
		expiration: 300, // Cache for 5 minutes (300 seconds)
		allowQuery: ['year', 'month', 'propertyId']
	}
};

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
	const session = await safeGetSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Get query parameters or use defaults
	const year = url.searchParams.get('year') || new Date().getFullYear().toString();
	const month =
		url.searchParams.get('month') ||
		new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
	const propertyId = url.searchParams.get('propertyId') || null;

	console.log('URL Parameters:', { year, month, propertyId });

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

	console.log(
		`Fetching data for period: ${startDateStr} to ${endDateStr}${propertyId ? `, property: ${propertyId}` : ''}`
	);

	try {
		// Step 1: Get all properties for the filter dropdown
		const { data: properties, error: propertiesError } = await supabase
			.from('properties')
			.select('id, name');

		if (propertiesError) throw new Error(`Error fetching properties: ${propertiesError.message}`);

		// If no property is selected, return the list of properties for selection
		if (!propertyId) {
			return {
				properties,
				year,
				month,
				propertyId: null,
				reportData: null
			};
		}

		// Step 2: Get all rental units for the selected property
		const { data: propertyUnits, error: propertyUnitsError } = await supabase
			.from('rental_unit')
			.select('id')
			.eq('property_id', propertyId);

		if (propertyUnitsError)
			throw new Error(`Error fetching property units: ${propertyUnitsError.message}`);

		// Extract the unit IDs
		const unitIds = propertyUnits?.map((unit) => unit.id) || [];

		// Step 3: Get all leases for the units in this property
		const { data: leases, error: leasesError } = await supabase
			.from('leases')
			.select('id, rental_unit_id')
			.in('rental_unit_id', unitIds);

		if (leasesError) throw new Error(`Error fetching leases: ${leasesError.message}`);

		// Create a map of lease_id to rental_unit_id
		const leaseToUnitMap = new Map();
		leases?.forEach((lease) => {
			leaseToUnitMap.set(lease.id, lease.rental_unit_id);
		});

		// Step 4: Get all rental units with their floor IDs
		const { data: rentalUnits, error: unitsError } = await supabase
			.from('rental_unit')
			.select('id, floor_id')
			.eq('property_id', propertyId);

		if (unitsError) throw new Error(`Error fetching rental units: ${unitsError.message}`);

		// Create a map of rental_unit_id to floor_id
		const unitToFloorMap = new Map();
		rentalUnits?.forEach((unit) => {
			unitToFloorMap.set(unit.id, unit.floor_id);
		});

		// Step 5: Get all floors for the selected property
		const { data: floors, error: floorsError } = await supabase
			.from('floors')
			.select('id, floor_number')
			.eq('property_id', propertyId);

		if (floorsError) throw new Error(`Error fetching floors: ${floorsError.message}`);

		// Create a map of floor_id to floor_number
		const floorMap = new Map();
		floors?.forEach((floor) => {
			floorMap.set(floor.id, floor.floor_number);
		});

		// Step 6: Get all lease IDs for this property
		const leaseIds = leases?.map((lease) => lease.id) || [];

		// Initialize tenant counts for each floor
		const tenantCountByFloor = new Map<string, number>();

		// Initialize tenant counts for each floor
		floors?.forEach((floor) => {
			tenantCountByFloor.set(floor.id, 0);
		});

		// Get all lease tenants for the active leases
		const { data: leaseTenants, error: leaseTenantsError } = await supabase
			.from('lease_tenants')
			.select('lease_id, tenant_id')
			.in('lease_id', leaseIds);

		if (leaseTenantsError)
			throw new Error(`Error fetching lease tenants: ${leaseTenantsError.message}`);

		// Count tenants per floor
		leaseTenants?.forEach((leaseTenant) => {
			const rentalUnitId = leaseToUnitMap.get(leaseTenant.lease_id);
			if (rentalUnitId) {
				const floorId = unitToFloorMap.get(rentalUnitId);
				if (floorId) {
					const currentCount = tenantCountByFloor.get(floorId) || 0;
					tenantCountByFloor.set(floorId, currentCount + 1);
				}
			}
		});

		// Step 7: Get all rental income for the period
		const { data: rentalBillings, error: rentalError } = await supabase
			.from('billings')
			.select('id, amount, type, billing_date, lease_id')
			.eq('type', 'RENT')
			.gte('billing_date', startDateStr)
			.lte('billing_date', endDateStr)
			.in('lease_id', leaseIds);

		if (rentalError) throw new Error(`Error fetching rental income: ${rentalError.message}`);

		// Step 7b: Get all billings for the period (including unpaid ones) to calculate collectibles
		// Ensure we're only getting billings for the current month
		const { data: allBillings, error: allBillingsError } = await supabase
			.from('billings')
			.select('id, amount, type, billing_date, lease_id, status, balance, paid_amount')
			.gte('billing_date', startDateStr)
			.lte('billing_date', endDateStr)
			.in('lease_id', leaseIds);

		if (allBillingsError) throw new Error(`Error fetching billings: ${allBillingsError.message}`);

		// Step 7c: Get payment history to determine last collection date
		// Make sure we only get payments for this month
		const { data: payments, error: paymentsError } = await supabase
			.from('payments')
			.select('id, amount, paid_at, billing_ids, billing_changes, method')
			.gte('paid_at', startDate.toISOString()) // Use startDate with time component
			.lte('paid_at', new Date(endDate.getTime() + 86400000 - 1).toISOString()) // Include entire last day of month
			.order('paid_at', { ascending: false });

		if (paymentsError) throw new Error(`Error fetching payments: ${paymentsError.message}`);

		// Step 8: Get all expenses for the period and property
		const { data: expenses, error: expensesError } = await supabase
			.from('expenses')
			.select('id, amount, description, type, status, created_at')
			.eq('property_id', propertyId)
			.gte('created_at', startDate.toISOString())
			.lte('created_at', endDate.toISOString())
			.order('created_at', { ascending: false });

		if (expensesError) throw new Error(`Error fetching expenses: ${expensesError.message}`);

		// Initialize floorData structure for all floors
		const floorDataMap: Record<string, any> = {};

		// Initialize collections for each floor
		const floorBillingsMap: Record<string, any[]> = {};

		// Initialize all floor data structures
		floors?.forEach((floor) => {
			const floorId = floor.id;
			floorDataMap[floorId] = {
				income: 0,
				note: '',
				tenantCount: tenantCountByFloor.get(floorId) || 0,
				collectible: 0,
				collected: 0,
				lastCollectionDate: undefined,
				floorNumber: floor.floor_number,
				floorId: floorId
			};
			floorBillingsMap[floorId] = [];
		});

		// Group billings by floor - only for the current month
		allBillings?.forEach((billing) => {
			// Ensure the billing is for the current month
			const billingDate = new Date(billing.billing_date);
			if (billingDate >= startDate && billingDate <= endDate) {
				const leaseId = billing.lease_id;
				const unitId = leaseToUnitMap.get(leaseId);

				if (unitId) {
					const floorId = unitToFloorMap.get(unitId);
					if (floorId && floorBillingsMap[floorId]) {
						floorBillingsMap[floorId].push(billing);
					}
				}
			}
		});

		// Calculate collectibles and collected amounts per floor - strictly for the selected month
		for (const [floorId, billings] of Object.entries(floorBillingsMap)) {
			// Calculate Total Billable (Income) from the RENT billings for the month
			// This is the sum of all billing amounts for the floor in the current month
			const totalBillable = billings.reduce((sum, billing) => {
				if (billing.type === 'RENT') {
					return sum + Number(billing.amount || 0);
				}
				return sum;
			}, 0);

			// Set the income to the total billable amount
			floorDataMap[floorId].income = totalBillable;

			// Calculate Collectible (Unpaid) - the sum of unpaid balances for the current month
			floorDataMap[floorId].collectible = billings.reduce((sum, billing) => {
				if (
					billing.type === 'RENT' &&
					(billing.status === 'PENDING' || billing.status === 'PARTIAL')
				) {
					return sum + Number(billing.balance || 0);
				}
				return sum;
			}, 0);

			// Calculate Collected - the sum of paid amounts for the current month
			// This should be Total Billable minus Collectible
			floorDataMap[floorId].collected = totalBillable - floorDataMap[floorId].collectible;
		}

		// Find last collection dates - only looking at the current month
		for (const [floorId, billings] of Object.entries(floorBillingsMap)) {
			if (payments && payments.length > 0) {
				for (const payment of payments) {
					// Ensure payment is in the current month
					const paymentDate = new Date(payment.paid_at);
					if (
						paymentDate >= startDate &&
						paymentDate <= new Date(endDate.getTime() + 86400000 - 1)
					) {
						const billingIds = payment.billing_ids || [];

						// Check if any billing ID in this payment belongs to this floor
						const appliesToFloor = billings.some((billing) => billingIds.includes(billing.id));

						if (appliesToFloor && !floorDataMap[floorId].lastCollectionDate) {
							floorDataMap[floorId].lastCollectionDate = payment.paid_at;
							break; // Found the first payment for this floor, no need to continue
						}
					}
				}
			}
		}

		// Calculate totals - all for the current month only
		// Start with gross income (total billable amount across all floors)
		const grossIncome = Object.values(floorDataMap).reduce(
			(sum, floor: any) => sum + Number(floor.income),
			0
		);

		// Calculate collectibles (all unpaid balances) for the current month only
		const collectibles = Object.values(floorDataMap).reduce(
			(sum, floor: any) => sum + Number(floor.collectible),
			0
		);

		// Calculate collected amount for the current month only
		// This should be grossIncome minus collectibles to ensure mathematical consistency
		const collected = grossIncome - collectibles;

		// Group expenses by type
		const operationalExpenses = expenses?.filter((expense) => expense.type === 'OPERATIONAL') || [];
		const capitalExpenses = expenses?.filter((expense) => expense.type === 'CAPITAL') || [];

		// Calculate total expenses by type
		const totalOperationalExpenses = operationalExpenses.reduce(
			(sum, expense) => sum + Number(expense.amount),
			0
		);
		const totalCapitalExpenses = capitalExpenses.reduce(
			(sum, expense) => sum + Number(expense.amount),
			0
		);

		// Calculate total expenses
		const totalExpenses = totalOperationalExpenses + totalCapitalExpenses;

		// Calculate net income before capital expenses
		const netBeforeCapital = grossIncome - totalOperationalExpenses;

		// Calculate net income
		const netIncome = netBeforeCapital - totalCapitalExpenses;

		// Calculate profit sharing with new rules:
		// - Both 40% and 60% share get reduced by operational expenses proportionally
		// - Only 60% share gets reduced by capital expenses
		const fortyShare = netBeforeCapital * 0.4;
		const sixtyShareBeforeCapital = netBeforeCapital * 0.6;
		const sixtyShare = sixtyShareBeforeCapital - totalCapitalExpenses;

		// Construct the final data object
		const reportData = {
			floorData: floorDataMap,
			expenses: expenses || [],
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
				lastCollectionDate: payments && payments.length > 0 ? payments[0].paid_at : undefined
			}
		};

		return {
			reportData,
			year,
			month,
			propertyId,
			properties
		};
	} catch (err) {
		console.error('Error in reports load function:', err);
		throw error(
			500,
			`Failed to load report data: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};
