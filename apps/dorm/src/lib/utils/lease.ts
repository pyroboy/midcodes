import type { LeaseTenant, Billing } from '$lib/types/lease';

export function mapLeaseData(lease: any, floorsMap: Map<number, any>) {
	// Ensure lease_tenants exists and has tenant data
	const tenantsList =
		lease.lease_tenants
			?.filter((lt: LeaseTenant) => lt?.tenant)
			?.map((lt: LeaseTenant) => lt.tenant) || [];
	const billingsList = lease.billings || [];

	const totalBalance = calculateTotalBalance(billingsList);
	const floor = lease.rental_unit?.floor_id ? floorsMap.get(lease.rental_unit.floor_id) : null;

	return {
		...lease,
		name: lease.name || `Lease #${lease.id}`,
		balance: totalBalance,
		billings: billingsList,
		lease_tenants: mapTenants(tenantsList),
		rental_unit: mapRentalUnit(lease.rental_unit, floor),
		type: lease.type || 'STANDARD',
		status: lease.status || 'ACTIVE',
		security_deposit: Number(lease.security_deposit || 0),
		rent_amount: Number(lease.rent_amount || 0)
	};
}

function calculateTotalBalance(billingsList: Billing[]): number {
	return billingsList.reduce((sum, billing) => {
		const totalDue = (billing.amount || 0) + (billing.penalty_amount || 0);
		const balance = totalDue - (billing.paid_amount || 0);
		return sum + balance;
	}, 0);
}

function mapTenants(tenantsList: any[]) {
	return tenantsList
		.filter((tenant) => tenant)
		.map((tenant) => ({
			...tenant,
			name: tenant?.name || 'Unnamed Tenant'
		}));
}

function mapRentalUnit(unit: any, floor: any) {
	if (!unit) return null;
	return {
		...unit,
		name: unit.name || `Unit ${unit.number}`,
		floor: floor
	};
}

/**
 * Calculate security deposit status with usage information
 * @param lease - The lease object with billings
 * @returns object with status information
 */
export function getSecurityDepositStatus(lease: any): {
	hasSecurityDeposit: boolean;
	isFullyPaid: boolean;
	availableAmount: number;
	totalPaid: number;
	amountUsed: number;
	status: 'none' | 'unpaid' | 'fully-paid' | 'partially-used' | 'fully-used';
} {
	if (!lease?.billings) {
		return {
			hasSecurityDeposit: false,
			isFullyPaid: false,
			availableAmount: 0,
			totalPaid: 0,
			amountUsed: 0,
			status: 'none'
		};
	}

	// Get all security deposit billings
	const securityDepositBillings = lease.billings.filter(
		(billing: Billing) => billing.type === 'SECURITY_DEPOSIT'
	);

	// If no security deposit billings exist
	if (securityDepositBillings.length === 0) {
		return {
			hasSecurityDeposit: false,
			isFullyPaid: false,
			availableAmount: 0,
			totalPaid: 0,
			amountUsed: 0,
			status: 'none'
		};
	}

	// Calculate total paid to security deposits
	const totalPaid = securityDepositBillings.reduce((sum: number, billing: Billing) => {
		return sum + (billing.paid_amount || 0);
	}, 0);

	// Check if all security deposit billings are fully paid
	const isFullyPaid = securityDepositBillings.every((billing: Billing) => {
		const totalDue = (billing.amount || 0) + (billing.penalty_amount || 0);
		const paidAmount = billing.paid_amount || 0;
		const balance = totalDue - paidAmount;
		return balance <= 0; // Fully paid or overpaid
	});

	// Calculate amount used from security deposit for other billings
	const allBillings = lease.billings || [];
	let amountUsed = 0;

	allBillings.forEach((billing: any) => {
		if (billing.type !== 'SECURITY_DEPOSIT' && billing.allocations) {
			billing.allocations.forEach((allocation: any) => {
				if (allocation.payment && allocation.payment.method === 'SECURITY_DEPOSIT') {
					amountUsed += allocation.amount || 0;
				}
			});
		}
	});

	const availableAmount = totalPaid - amountUsed;

	// Determine status
	let status: 'none' | 'unpaid' | 'fully-paid' | 'partially-used' | 'fully-used' = 'none';

	if (!isFullyPaid) {
		status = 'unpaid';
	} else if (availableAmount <= 0) {
		status = 'fully-used';
	} else if (amountUsed > 0) {
		status = 'partially-used';
	} else {
		status = 'fully-paid';
	}

	return {
		hasSecurityDeposit: true,
		isFullyPaid,
		availableAmount,
		totalPaid,
		amountUsed,
		status
	};
}

/**
 * Legacy function for backward compatibility
 * @param lease - The lease object with billings
 * @returns true if all security deposit billings are fully paid, false otherwise
 */
export function isSecurityDepositFullyPaid(lease: any): boolean {
	const status = getSecurityDepositStatus(lease);
	return status.isFullyPaid;
}

// Server-only getLeaseData() moved to $lib/utils/lease.server.ts
