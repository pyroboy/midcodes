import { json, type RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { Database } from '$lib/database.types';

interface UpdateLeaseRequest {
  id: number | string;
  name: string;
  start_date: string;
  end_date?: string;
  terms_month: number;
  status: Database['public']['Enums']['lease_status'];
  unit_type: 'BEDSPACER' | 'PRIVATE_ROOM';
  notes?: string;
  rental_unit_id: number;
  tenantIds: number[];
}

// Test endpoint to verify the route is working
export const GET: RequestHandler = async () => {
  return json({ message: 'Lease update API is working' });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const data = await request.json() as UpdateLeaseRequest;
    const { id, tenantIds, ...leaseUpdates } = data;
    
    // Ensure ID is a number
    const leaseId = Number(id);
    
    if (!leaseId || leaseId <= 0 || isNaN(leaseId)) {
      return json(
        { success: false, error: 'Valid lease ID is required' },
        { status: 400 }
      );
    }

    // First, get the existing lease to preserve required fields
    const { data: existingLease, error: fetchError } = await supabase
      .from('leases')
      .select('*')
      .eq('id', leaseId)
      .single();

    if (fetchError || !existingLease) {
      console.error('Lease not found:', fetchError);
      return json(
        { success: false, error: 'Lease not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!leaseUpdates.name?.trim()) {
      return json(
        { success: false, error: 'Lease name is required' },
        { status: 400 }
      );
    }

    if (!leaseUpdates.start_date) {
      return json(
        { success: false, error: 'Start date is required' },
        { status: 400 }
      );
    }

    if (leaseUpdates.terms_month < 0 || leaseUpdates.terms_month > 60) {
      return json(
        { success: false, error: 'Terms must be between 0 and 60 months' },
        { status: 400 }
      );
    }

    if (leaseUpdates.rental_unit_id <= 0) {
      return json(
        { success: false, error: 'Valid rental unit must be selected' },
        { status: 400 }
      );
    }

    if (!tenantIds || tenantIds.length === 0) {
      return json(
        { success: false, error: 'At least one tenant must be selected' },
        { status: 400 }
      );
    }

    // Calculate end_date if not provided
    let calculatedEndDate = leaseUpdates.end_date;
    if (!calculatedEndDate && leaseUpdates.start_date && leaseUpdates.terms_month > 0) {
      const start = new Date(leaseUpdates.start_date);
      const end = new Date(start);
      end.setMonth(end.getMonth() + leaseUpdates.terms_month);
      calculatedEndDate = end.toISOString().split('T')[0];
    }

    // Create the update object, preserving required financial fields
    const updateData: Database['public']['Tables']['leases']['Update'] = {
      name: leaseUpdates.name.trim(),
      start_date: leaseUpdates.start_date,
      end_date: calculatedEndDate,
      terms_month: leaseUpdates.terms_month,
      status: leaseUpdates.status,
      notes: leaseUpdates.notes?.trim() || null,
      rental_unit_id: leaseUpdates.rental_unit_id,
      // Preserve existing financial fields since they're required
      rent_amount: existingLease.rent_amount,
      security_deposit: existingLease.security_deposit,
      balance: existingLease.balance,
      updated_at: new Date().toISOString()
    };

    // Update the lease
    const { data: updatedLease, error: leaseError } = await supabase
      .from('leases')
      .update(updateData)
      .eq('id', leaseId)
      .select('*')
      .single();

    if (leaseError) {
      console.error('Supabase error updating lease:', leaseError);
      return json(
        { success: false, error: `Database error: ${leaseError.message}` },
        { status: 500 }
      );
    }

    // Update tenant relationships
    if (tenantIds && tenantIds.length > 0) {
      // First, delete existing tenant relationships
      const { error: deleteError } = await supabase
        .from('lease_tenants')
        .delete()
        .eq('lease_id', leaseId);

      if (deleteError) {
        console.error('Error deleting existing tenant relationships:', deleteError);
        return json(
          { success: false, error: 'Failed to update tenant relationships' },
          { status: 500 }
        );
      }

      // Then, create new tenant relationships
      const leaseTenants = tenantIds.map(tenant_id => ({
        lease_id: leaseId,
        tenant_id
      }));

      const { error: relationError } = await supabase
        .from('lease_tenants')
        .insert(leaseTenants);

      if (relationError) {
        console.error('Error creating tenant relationships:', relationError);
        return json(
          { success: false, error: 'Failed to update tenant relationships' },
          { status: 500 }
        );
      }
    }

    return json({ 
      success: true, 
      data: updatedLease,
      message: 'Lease updated successfully'
    });
    
  } catch (error) {
    console.error('Error in API endpoint:', error);
    return json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
};
