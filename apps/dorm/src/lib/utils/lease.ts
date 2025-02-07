import type { LeaseTenant, PaymentSchedule } from '$lib/types/lease';
import type { SupabaseClient } from '@supabase/supabase-js';

export function mapLeaseData(lease: any, floorsMap: Map<number, any>) {
  const tenants = lease.lease_tenants?.map((lt: LeaseTenant) => lt.tenant) || [];
  const paymentSchedules = lease.payment_schedules || [];

  const totalExpected = calculateTotalExpected(paymentSchedules);
  const floor = lease.rental_unit?.floor_id ? floorsMap.get(lease.rental_unit.floor_id) : null;

  return {
    ...lease,
    name: lease.name || `Lease #${lease.id}`,
    balance: totalExpected,
    payment_schedules: paymentSchedules,
    lease_tenants: mapTenants(tenants),
    rental_unit: mapRentalUnit(lease.rental_unit, floor),
    type: lease.type || 'STANDARD',
    status: lease.status || 'ACTIVE',
    security_deposit: Number(lease.security_deposit || 0),
    rent_amount: Number(lease.rent_amount || 0)
  };
}

function calculateTotalExpected(schedules: PaymentSchedule[]): number {
  return schedules.reduce((sum: number, schedule: PaymentSchedule) => {
    return sum + (schedule.expected_amount || 0);
  }, 0);
}

function mapTenants(tenants: any[]) {
  return tenants.map(tenant => ({
    tenant: {
      name: tenant.name,
      contact_number: tenant.contact_number || undefined,
      email: tenant.email || undefined
    }
  }));
}

function mapRentalUnit(unit: any, floor: any) {
  if (!unit) return undefined;

  return {
    rental_unit_number: unit.number || '',
    property: unit.property ? {
      name: unit.property.name
    } : undefined,
    floor: floor ? {
      floor_number: floor.floor_number,
      wing: floor.wing || ''
    } : {
      floor_number: '',
      wing: ''
    }
  };
}

export async function getLeaseData(supabase: SupabaseClient) {
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select(`
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
      payment_schedules (*)
    `)
    .order('created_at', { ascending: false });

  return { leases, error: leasesError };
}
