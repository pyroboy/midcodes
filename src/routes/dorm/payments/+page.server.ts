import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { paymentSchema, type UserRole } from './formSchema';
import { supabase } from '$lib/supabaseClient';
import {
  calculatePenalty,
  getPenaltyConfig,
  createPenaltyBilling,
  updateBillingStatus,
  determinePaymentStatus,
  getUTCTimestamp,
  logAuditEvent
} from './utils';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const [{ data: userRole }, { data: payments }, { data: billings }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),

    supabase
      .from('payments')
      .select(`
        *,
        created_by:profiles!created_by(name),
        billing:billings(
          id,
          type,
          utility_type,
          amount,
          paid_amount,
          balance,
          status,
          due_date,
          lease:leases(
            id,
            name,
            rental_unit:rental_unit(
              rental_unit_number,
              floor:floors(
                floor_number,
                wing,
                property:properties(
                  name
                )
              )
            )
          )
        )
      `)
      .order('paid_at', { ascending: false }),

    supabase
      .from('billings')
      .select(`
        id,
        type,
        utility_type,
        amount,
        paid_amount,
        balance,
        status,
        due_date,
        lease:leases(
          id,
          name,
          rental_unit:rental_unit(
            id,
            rental_unit_number,
            floor:floors(
              floor_number,
              wing,
              property:properties(
                name
              )
            )
          )
        )
      `)
      .in('status', ['PENDING', 'PARTIAL', 'OVERDUE'])
      .order('due_date')
  ]);

  const form = await superValidate(zod(paymentSchema));
  const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
  const isAccountant = userRole?.role === 'property_accountant';
  const isUtility = userRole?.role === 'property_utility';
  const isFrontdesk = userRole?.role === 'property_frontdesk';
  const isResident = userRole?.role === 'property_resident';

  return {
    form,
    payments,
    billings,
    userRole: userRole?.role || 'user',
    isAdminLevel,
    isAccountant,
    isUtility,
    isFrontdesk,
    isResident
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { 
        form: null,
        error: 'You must be logged in to create payments' 
      });
    }

    const form = await superValidate(request, zod(paymentSchema));
    if (!form.valid) {
      return fail(400, { 
        form,
        error: 'Invalid form data. Please check your input.' 
      });
    }

    // Get billing details first
    const { data: billing, error: billingError } = await supabase
      .from('billings')
      .select('*, lease:leases(name, rental_unit:rental_unit(rental_unit_number, floor:floors(floor_number, wing)))')
      .eq('id', form.data.billing_id)
      .single();

    if (billingError || !billing) {
      console.error('Failed to fetch billing:', billingError);
      return fail(404, { 
        form,
        error: `Billing #${form.data.billing_id} not found or has been deleted` 
      });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    const canCreate = ['super_admin', 'property_admin', 'property_accountant', 'property_frontdesk'] as UserRole[];
    if (!canCreate.includes(userRole?.role as UserRole)) {
      await logAuditEvent(supabase, {
        action: 'payment_create_denied',
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          billing_id: billing.id,
          amount: form.data.amount,
          method: form.data.method
        }
      });
      return fail(403, { 
        form,
        error: 'You do not have permission to create payments' 
      });
    }

    if (!['PENDING', 'PARTIAL', 'OVERDUE'].includes(billing.status)) {
      await logAuditEvent(supabase, {
        action: 'payment_create_invalid_status',
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          billing_id: billing.id,
          billing_status: billing.status,
          amount: form.data.amount
        }
      });
      return fail(400, { 
        form,
        error: `Cannot process payment for billing in ${billing.status} status. Only PENDING, PARTIAL, or OVERDUE billings can receive payments.` 
      });
    }

    if (form.data.amount > billing.balance) {
      await logAuditEvent(supabase, {
        action: 'payment_create_amount_exceeded',
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          billing_id: billing.id,
          attempted_amount: form.data.amount,
          billing_balance: billing.balance
        }
      });
      return fail(400, { 
        form,
        error: `Payment amount (${form.data.amount}) exceeds billing balance (${billing.balance}). Please enter an amount less than or equal to the balance.` 
      });
    }

    // Check for late payment and calculate penalty
    const penaltyConfig = await getPenaltyConfig(supabase, billing.type);
    let penaltyAmount = 0;
    
    if (penaltyConfig && new Date(form.data.paid_at) > new Date(billing.due_date)) {
      penaltyAmount = await calculatePenalty(billing, penaltyConfig, new Date(form.data.paid_at));
    }

    let createdPayment;
    try {
      const timestamp = getUTCTimestamp();
      const { data, error: paymentError } = await supabase
        .from('payments')
        .insert({
          ...form.data,
          created_by: session.user.id,
          updated_by: session.user.id,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select(`
          *,
          billing:billings!inner(
            id,
            type,
            utility_type,
            lease:leases(
              name,
              rental_unit:rental_unit(
                rental_unit_number,
                floor:floors(
                  floor_number,
                  wing
                )
              )
            )
          )
        `)
        .single();

      if (paymentError) {
        console.error('Failed to create payment:', paymentError);
        await logAuditEvent(supabase, {
          action: 'payment_create_failed',
          user_id: session.user.id,
          user_role: userRole?.role,
          details: {
            billing_id: billing.id,
            error: paymentError.message,
            amount: form.data.amount
          }
        });
        throw new Error('Failed to create payment record');
      }

      createdPayment = data;

      // Log successful payment creation
      await logAuditEvent(supabase, {
        action: 'payment_created',
        user_id: session.user.id,
        user_role: userRole?.role,
        details: {
          payment_id: createdPayment.id,
          billing_id: billing.id,
          amount: form.data.amount,
          method: form.data.method,
          location: `${billing.lease.rental_unit.floor.wing} - Floor ${billing.lease.rental_unit.floor.floor_number} - Rental_unit ${billing.lease.rental_unit.rental_unit_number}`
        }
      });

      // Update billing status
      await updateBillingStatus(supabase, billing, billing.paid_amount + form.data.amount);

      // Create penalty billing if needed
      if (penaltyAmount > 0) {
        await createPenaltyBilling(supabase, billing, penaltyAmount);
      }

      return { 
        form,
        success: true,
        message: `Payment of ${form.data.amount} successfully processed for ${billing.lease.name}`
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      
      // Attempt to rollback payment if it was created
      try {
        if (createdPayment?.id) {
          await supabase
            .from('payments')
            .delete()
            .eq('id', createdPayment.id);
        }
      } catch (rollbackError) {
        console.error('Failed to rollback payment:', rollbackError);
      }

      return fail(500, { 
        form,
        error: 'Failed to process payment. Please try again or contact support if the issue persists.' 
      });
    }
  },

  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { 
        form: null,
        error: 'You must be logged in to update payments' 
      });
    }

    const form = await superValidate(request, zod(paymentSchema));
    if (!form.valid) {
      return fail(400, { 
        form,
        error: 'Invalid form data. Please check your input.' 
      });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const canUpdate = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
    if (!canUpdate.includes(userRole?.role as UserRole)) {
      return fail(403, { 
        form,
        error: 'You do not have permission to update payments' 
      });
    }

    // Get existing payment
    const { data: existingPayment, error: existingError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', form.data.id)
      .single();

    if (existingError || !existingPayment) {
      console.error('Failed to fetch existing payment:', existingError);
      return fail(404, { 
        form,
        error: 'Payment not found or has been deleted' 
      });
    }

    // Update payment with tracking fields
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        ...form.data,
        updated_by: session.user.id,
        updated_at: getUTCTimestamp()
      })
      .eq('id', form.data.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      return fail(500, { 
        form,
        error: 'Failed to update payment record' 
      });
    }

    return { form };
  }
};
