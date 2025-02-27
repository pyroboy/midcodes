import { fail, error, json } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema, deleteLeaseSchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import type { PostgrestError } from '@supabase/postgrest-js';
import { createPaymentSchedules } from './utils';
import { mapLeaseData, getLeaseData } from '$lib/utils/lease';
import type { LeaseResponse } from '$lib/types/lease';

interface PaymentAllocation {
  billingId: number;
  amount: number;
}

interface BillingChange {
  previous_amount: number;
  new_amount: number;
  allocated_amount: number;
  previous_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  new_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}

interface PaymentDetails {
  amount: number;
  method: 'CASH' | 'GCASH' | 'BANK_TRANSFER';
  reference_number: string | null;
  paid_by: string;
  paid_at: string;
  notes: string | null;
  billing_ids: number[];
  billing_changes: Record<number, BillingChange>;
}

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  // console.log('🔄 Starting leases load');
  
  const { user } = await safeGetSession();
  if (!user) throw error(401, 'Unauthorized');

  // console.log('📊 Fetching leases data');
  const startTime = performance.now();
  
  try {
    const { leases, error: leasesError } = await getLeaseData(supabase);
    if (leasesError) throw error(500, 'Failed to load leases');

    const { data: floors } = await supabase.from('floors').select('*');
    const floorsMap = new Map(floors?.map(floor => [floor.id, floor]));

    // Transform the data structure using utility function
    const mappedLeases = leases?.map(lease => mapLeaseData(lease, floorsMap)) || [];

    // Fetch form data with proper type handling
    const [tenantsResponse, unitsResponse] = await Promise.all([
      supabase.from('tenants').select('id, name, email, contact_number'),
      supabase.from('rental_unit').select(`
        *,
        property:properties!rental_unit_property_id_fkey(id, name)
      `)
    ]);

    const queryTime = performance.now() - startTime;
    // console.log('⏱️ Data fetch completed:', {
    //   leases: mappedLeases?.length || 0,
    //   units: unitsResponse.data?.length || 0,
    //   tenants: tenantsResponse.data?.length || 0,
    //   time: `${queryTime.toFixed(2)}ms`
    // });

    if (tenantsResponse.error) {
      throw error(500, 'L-1000 - Failed to load tenants');
    }

    if (unitsResponse.error) {
      throw error(500, 'L-1001 - Failed to load rental units');
    }

    const form = await superValidate(zod(leaseSchema));
    const deleteForm = await superValidate(zod(deleteLeaseSchema));

    return {
      form,
      deleteForm,
      leases: mappedLeases,
      tenants: tenantsResponse.data || [],
      rental_units: unitsResponse.data || []
    };
  } catch (err) {
    console.error('L-1002 -Error in load function:', err);
    throw error(500, 'L-1002 - Internal server error');
  }
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log('🚀 Creating lease');
    const form = await superValidate(request, zod(leaseSchema));
    
    if (!form.valid) {
      console.error('L-1003 - ❌ Form validation failed:', form.errors);
      return fail(400, { form });
    }

    const { user } = await safeGetSession();
    if (!user) return fail(403, { form, message: ['Unauthorized'] });

    try {
      // Validate rental unit status
      // const { data: rentalUnit } = await supabase
      //   .from('rental_unit')
      //   .select('capacity')
      //   .eq('id', form.data.rental_unit_id)
      //   .single();

      // if (rentalUnit?.capacity !== 10) {
      //   form.errors.rental_unit_id = ['Unit must be not full to create lease'];
      //   return fail(400, { form });
      // }

      // Get unit details for lease name
      const { data: unit } = await supabase
        .from('rental_unit')
        .select(`
          name,
          floor:floors (
            floor_number,
            wing
          )
        `)
        .eq('id', form.data.rental_unit_id)
        .single();

      // Generate lease name with fallback
      let leaseName: string;
      if (!unit?.floor?.[0]) {
        leaseName = unit?.name ?? `Unit ${form.data.rental_unit_id}`;
      } else {
        const floorInfo = unit.floor[0];
        leaseName = `${floorInfo.floor_number}F${floorInfo.wing ? ` ${floorInfo.wing}` : ''} - ${unit.name}`;
      }

      // Extract tenant IDs and prepare lease data matching the schema
      const { tenantIds, ...leaseData } = form.data;
      
      // Start a transaction
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
          rental_unit_id: leaseData.rental_unit_id,
          name: leaseName,
          start_date: leaseData.start_date,
          end_date: leaseData.end_date,
          rent_amount: leaseData.rent_amount,
          security_deposit: leaseData.security_deposit,
          notes: leaseData.notes || null,
          created_by: user.id,
          terms_month: leaseData.terms_month,
          status: leaseData.status,
          unit_type: leaseData.unit_type, // Add unit_type
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (leaseError) throw leaseError;

      // Create lease-tenant relationships
      const leaseTenants = tenantIds.map(tenant_id => ({
        lease_id: lease.id,
        tenant_id
      }));

      const { error: relationError } = await supabase
        .from('lease_tenants')
        .insert(leaseTenants);

      if (relationError) {
        // Rollback lease creation if tenant relationship fails
        await supabase.from('leases').delete().eq('id', lease.id);
        throw relationError;
      }

      // Billing creation
      const startDate = new Date(form.data.start_date);
      const endDate = new Date(form.data.end_date);
      const billings = [];

      if (form.data.prorated_first_month) {
        // Calculate prorated first month
        const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
        const daysInFirstMonth = lastDayOfMonth - startDate.getDate() + 1;
        const dailyRate = form.data.rent_amount / lastDayOfMonth;
        const proratedAmount = form.data.prorated_amount || Math.round(dailyRate * daysInFirstMonth);

        // Add prorated first month
        billings.push({
          lease_id: lease.id,
          amount: proratedAmount,
          due_date: startDate.toISOString().split('T')[0],
          type: 'RENT',
          status: 'PENDING',
          notes: `Prorated rent for ${daysInFirstMonth} days`,
          billing_date: new Date().toISOString().split('T')[0],
          balance: proratedAmount,
          paid_amount: 0
        });

        // Start full months from next month at same date
        const nextMonth = new Date(startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        // Keep same day of month for subsequent billings
        nextMonth.setDate(1);

        for (let date = nextMonth; date <= endDate; date.setMonth(date.getMonth() + 1)) {
          billings.push({
            lease_id: lease.id,
            amount: form.data.rent_amount,
            due_date: new Date(date).toISOString().split('T')[0],
            type: 'RENT',
            status: 'PENDING',
            billing_date: new Date().toISOString().split('T')[0],
            balance: form.data.rent_amount,
            paid_amount: 0
          });
        }
      } else {
        // No proration - start with full amount from first month
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          billings.push({
            lease_id: lease.id,
            amount: form.data.rent_amount,
            due_date: currentDate.toISOString().split('T')[0],
            type: 'RENT',
            status: 'PENDING',
            billing_date: new Date().toISOString().split('T')[0],
            balance: form.data.rent_amount,
            paid_amount: 0
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      const { error: billingsError } = await supabase
        .from('billings')
        .insert(billings);

      if (billingsError) throw billingsError;

      return { form };

    } catch (err) {
      console.error('💥 Lease creation error:', err);
      const error = err as PostgrestError;
      
      if (error.message?.includes('Policy check failed')) {
        return fail(403, { 
          form, 
          message: ['Permission denied'],
          errors: [error.message] 
        });
      }
      
      return fail(500, { 
        form, 
        message: ['Failed to create lease and payment schedules'],
        errors: [error.message] 
      });
    }
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const form = await superValidate(request, zod(deleteLeaseSchema));
    
    if (!form.valid) {
      console.error('❌ Delete validation failed:', form.errors);
      return fail(400, { form });
    }

    const { user } = await safeGetSession();
    if (!user) return fail(403, { form, message: ['Unauthorized'] });

    try {
      // First delete billings
      const { error: billingsError } = await supabase
        .from('billings')
        .delete()
        .eq('lease_id', form.data.id);

      if (billingsError) {
        console.error('Error deleting billings:', billingsError);
        throw new Error('Failed to delete billings');
      }

      // Then delete payment schedules
      const { error: schedulesError } = await supabase
        .from('payment_schedules')
        .delete()
        .eq('lease_id', form.data.id);

      if (schedulesError) {
        console.error('Error deleting payment schedules:', schedulesError);
        throw new Error('Failed to delete payment schedules');
      }

      // Then delete lease_tenants
      const { error: tenantsError } = await supabase
        .from('lease_tenants')
        .delete()
        .eq('lease_id', form.data.id);

      if (tenantsError) {
        console.error('Error deleting lease tenants:', tenantsError);
        throw new Error('Failed to delete lease tenants');
      }

      // Finally delete the lease
      const { error: leaseError } = await supabase
        .from('leases')
        .delete()
        .eq('id', form.data.id);

      if (leaseError) {
        console.error('Error deleting lease:', leaseError);
        throw new Error('Failed to delete lease');
      }

      return { success: true };
    } catch (error) {
      console.error('Delete transaction failed:', error);
      return fail(500, {
        message: 'Failed to delete lease and associated records'
      });
    }
  },

  submitPayment: async ({ request, locals: { supabase, safeGetSession } }) => {
    try {
      const session = await safeGetSession();
      // if (!session?.user?.id) {
      //   console.error('No authenticated user found');
      //   return fail(401, { error: 'Unauthorized' });
      // }

      const formData = await request.formData();
      const paymentDetailsStr = formData.get('paymentDetails');
      
      if (!paymentDetailsStr) {
        console.error('Missing payment details in request');
        return fail(400, { error: 'Payment details are required' });
      }

      let paymentDetails: PaymentDetails;
      try {
        paymentDetails = JSON.parse(paymentDetailsStr.toString()) as PaymentDetails;
      } catch (e) {
        console.error('Failed to parse payment details:', e);
        return fail(400, { error: 'Invalid payment details format' });
      }

      // Validate payment details
      if (!paymentDetails.amount || paymentDetails.amount <= 0) {
        console.error('Invalid payment amount:', paymentDetails.amount);
        return fail(400, { error: 'Invalid payment amount' });
      }

      if (!paymentDetails.billing_ids?.length) {
        console.error('No billing IDs provided');
        return fail(400, { error: 'No billings selected for payment' });
      }

      if (!paymentDetails.billing_changes) {
        console.error('No billing changes provided');
        return fail(400, { error: 'Missing billing allocation details' });
      }

      console.log('Processing payment:', {
        amount: paymentDetails.amount,
        method: paymentDetails.method,
        billings: paymentDetails.billing_ids.length
      });

      // Insert the payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          amount: paymentDetails.amount,
          method: paymentDetails.method,
          reference_number: paymentDetails.reference_number,
          paid_by: paymentDetails.paid_by,
          paid_at: paymentDetails.paid_at,
          notes: paymentDetails.notes,
          billing_ids: paymentDetails.billing_ids,
          billing_changes: paymentDetails.billing_changes,
          created_by: session.user.id
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Database error creating payment:', paymentError);
        return fail(500, { 
          error: paymentError.message,
          code: paymentError.code,
          details: paymentError.details
        });
      }

      console.log('Payment created successfully:', payment.id);
      
      // Make sure the response is properly structured
      return {
        type: 'success',
        status: 200,
        data: payment,
        dependencies: ['app:leases', 'app:billings'] // Add dependencies for invalidation
      };

    } catch (error) {
      console.error('Payment submission error:', error);
      return fail(500, {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  },

  updateName: async ({ request, locals: { supabase } }) => {
    const data = await request.formData();
    const id = data.get('id');
    const name = data.get('name');

    if (!id || !name) {
      return fail(400, { error: 'Missing required fields' });
    }

    const { error } = await supabase
      .from('leases')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Error updating lease name:', error);
      return fail(500, { error: 'Failed to update lease name' });
    }

    return { success: true };
  },

  updateStatus: async ({ request, locals: { supabase } }) => {
    console.log('🔄 Updating lease status');
    const formData = await request.formData();
    const id = formData.get('id');
    const status = formData.get('status');

    console.log('Update details:', { id, status });

    if (!id || !status) {
      return {
        success: false,
        message: 'Missing required fields'
      };
    }

    try {
      const { error: updateError } = await supabase
        .from('leases')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      return {
        success: true,
        status: 200,
        data: { id, status }
      };

    } catch (error) {
      console.error('Error updating lease status:', error);
      return {
        success: false,
        status: 500,
        message: error instanceof Error ? error.message : 'Failed to update lease status'
      };
    }
  }
};