// src/routes/dorm/tenants/+page.server.ts

import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { tenantFormSchema, tenantResponseSchema, type TenantFormData, type EmergencyContact } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { checkAccess } from '$lib/utils/roleChecks';

// Type definitions aligned with database schema
type BaseTenant = {
  id: number;
  name: string;
  contact_number: string | null;
  email: string | null;
  tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
  auth_id: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  emergency_contact: EmergencyContact | null;
};

type Tenant = BaseTenant;

// Keeping necessary interface definitions for relationships
interface RawLeaseData {
  id: string | number;
  type: 'BEDSPACER' | 'PRIVATEROOM';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED';
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  balance: number;
  notes: string | null;
  tenant: {
    id: string | number;
  }[];
  location: {
    id: string | number;
    number: string | number;
    property: {
      id: string | number;
      name: string;
    }[];
  }[];
}

interface LeaseWithRelations {
  id: string;
  type: 'BEDSPACER' | 'PRIVATEROOM';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED';
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  balance: number;
  notes: string | null;
  tenant: {
    id: string;
  };
  location: {
    id: string;
    number: string;
    property: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const { session, user, profile } = await safeGetSession();

  if (!session || !user) {
    throw error(401, { message: 'Unauthorized' });
  }

  // Initialize form with schema and default values

  const form = await superValidate(zod(tenantFormSchema))


  // Fetch properties (maintaining existing functionality)
  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .order('name');

  const properties = propertiesData || [];

  if (propertiesError) {
  }

  // Fetch rental_unit (maintaining existing functionality)
  const { data: rental_unitData, error: rental_unitError } = await supabase
    .from('rental_unit')
    .select('*')
    .order('number');

  const rental_unit = rental_unitData || [];

  if (rental_unitError) {
    console.error('Error fetching rental_unit:', rental_unitError);
  }

  // Fetch tenants with schema-aligned fields
  const { data: tenantsData, error: tenantsError } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      contact_number,
      email,
      tenant_status,
      auth_id,
      created_by,
      created_at,
      updated_at,
      emergency_contact
    `)
    .order('name');

  const tenantsBasic: Tenant[] = tenantsData || [];

  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
    return {
      form,
      tenants: [],
      rental_unit,
      properties,
      profile: null,
      isAdminLevel: false,
      isStaffLevel: false
    };
  }

  // Fetch leases (maintaining relationship logic)
  const { data: leasesData, error: leasesError } = await supabase
    .from('leases')
    .select(`
      id,
      tenant:tenants!inner (
        id
      ),
      location:rental_unit (
        id,
        number,
        property:properties (
          id,
          name
        )
      )
    `);

  // Transform lease data (maintaining existing logic)
  const rawLeases = (leasesData || []) as RawLeaseData[];
  const leases: LeaseWithRelations[] = rawLeases.map(lease => ({
    id: String(lease.id),
    type: lease.type || 'BEDSPACER',
    status: lease.status || 'INACTIVE',
    start_date: lease.start_date || new Date().toISOString().split('T')[0],
    end_date: lease.end_date || new Date().toISOString().split('T')[0],
    rent_amount: lease.rent_amount || 0,
    security_deposit: lease.security_deposit || 0,
    balance: lease.balance || 0,
    notes: lease.notes || null,
    tenant: {
      id: String(lease.tenant?.[0]?.id || '')
    },
    location: lease.location?.[0] ? {
      id: String(lease.location[0].id),
      number: String(lease.location[0].number),
      property: lease.location[0].property?.[0] ? {
        id: String(lease.location[0].property[0].id),
        name: lease.location[0].property[0].name
      } : null
    } : null
  }));

  if (leasesError) {
    console.error('Error fetching leases:', leasesError);
  }

  // Combine tenant and lease data (maintaining relationship)
  const tenants = tenantsBasic.map((tenant: Tenant) => {
    const matchingLease = leases.find(lease => 
      lease.tenant && lease.tenant.id === String(tenant.id)
    );
    const lease = matchingLease || null;
    return {
      ...tenant,
      lease,
      lease_type: lease?.type || 'BEDSPACER',
      lease_status: lease?.status || 'INACTIVE',
      start_date: lease?.start_date || new Date().toISOString().split('T')[0],
      end_date: lease?.end_date || new Date().toISOString().split('T')[0],
      outstanding_balance: lease?.balance || 0,
      created_by: tenant.created_by
    };
  });

  // Access control (maintaining existing logic)
  const isAdminLevel = checkAccess(profile?.role, 'admin');
  const isStaffLevel = checkAccess(profile?.role, 'staff') && !isAdminLevel;

  return {
    form,
    tenants,
    rental_unit,
    properties,
    isAdminLevel,
    isStaffLevel,
    profile
  };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user, profile } = await safeGetSession();
    if (!session || !user) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await superValidate(request, zod(tenantFormSchema));
    console.log('POST', form);

    if (!form.valid) {
      return fail(400, { form });
    }

    const hasAccess = checkAccess(profile?.role, 'admin');
    if (!hasAccess) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    try {
      // Create tenant with schema-aligned fields only
      const insertData: Partial<Tenant> = {
        name: form.data.name,
        contact_number: form.data.contact_number,
        email: form.data.email,
        emergency_contact: form.data.emergency_contact,
        tenant_status: 'PENDING'
      };

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([insertData])
        .select()
        .single();

      if (tenantError) throw tenantError;

      return { form };
    } catch (err) {
      console.error('Error creating tenant:', err);
      return fail(500, {
        form,
        message: 'Error creating tenant. Transaction rolled back.'
      });
    }
  },

  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession();
    if (!session || !user) {
      return fail(401, { message: 'Unauthorized' });
    }


    const form = await superValidate(request, zod(tenantResponseSchema));
    console.log('PUT', form);

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const updateData: Partial<Tenant> = {
        name: form.data.name,
        contact_number: form.data.contact_number,
        email: form.data.email,
        emergency_contact: form.data.emergency_contact,
        tenant_status: form.data.tenant_status,
        updated_at: new Date().toISOString()
      };

      const { error: tenantError } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', form.data.id);

      if (tenantError) throw tenantError;

      return { form };
    } catch (err) {
      console.error('Error updating tenant:', err);
      return fail(500, {
        form,
        message: 'Error updating tenant. Transaction rolled back.'
      });
    }
  }
};
