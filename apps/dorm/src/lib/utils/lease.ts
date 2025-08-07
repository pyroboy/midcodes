import type { LeaseTenant, Billing } from '$lib/types/lease';
import type { SupabaseClient } from '@supabase/supabase-js';

export function mapLeaseData(lease: any, floorsMap: Map<number, any>) {
	// Ensure lease_tenants exists and has tenant data
	const tenants =
		lease.lease_tenants
			?.filter((lt: LeaseTenant) => lt?.tenant)
			?.map((lt: LeaseTenant) => lt.tenant) || [];
	const billings = lease.billings || [];

	const totalBalance = calculateTotalBalance(billings);
	const floor = lease.rental_unit?.floor_id ? floorsMap.get(lease.rental_unit.floor_id) : null;

	return {
		...lease,
		name: lease.name || `Lease #${lease.id}`,
		balance: totalBalance,
		billings: billings,
		lease_tenants: mapTenants(tenants),
		rental_unit: mapRentalUnit(lease.rental_unit, floor),
		type: lease.type || 'STANDARD',
		status: lease.status || 'ACTIVE',
		security_deposit: Number(lease.security_deposit || 0),
		rent_amount: Number(lease.rent_amount || 0)
	};
}

function calculateTotalBalance(billings: Billing[]): number {
	return billings.reduce((sum, billing) => {
		const totalDue = (billing.amount || 0) + (billing.penalty_amount || 0);
		const balance = totalDue - (billing.paid_amount || 0);
		return sum + balance;
	}, 0);
}

function mapTenants(tenants: any[]) {
	return tenants
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

export async function getLeaseData(supabase: SupabaseClient) {
	const { data: leases, error: leasesError } = await supabase
		.from('leases')
		.select(
			`
      *,
      lease_tenants (
        tenant:tenants (
          id,
          name,
          email,
          contact_number,
          created_at,
          updated_at,
          auth_id
        )
      ),
      rental_unit:rental_unit (
        id,
        name,
        number,
        floor_id,
        property:properties!rental_unit_property_id_fkey(id, name)
      ),
      billings!billings_lease_id_fkey(*)
    `
		)
		.order('created_at', { ascending: false });

	return { leases, error: leasesError };
}
