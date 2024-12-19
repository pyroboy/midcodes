import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { paymentSchema } from './formSchema';
import { supabase } from '$lib/supabase';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const [{ data: userRole }, { data: payments }, { data: billings }, { data: properties }, { data: tenants }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),

    supabase
      .from('payments')
      .select(`
        *,
        property:properties(name),
        tenant:tenants(
          user:profiles(full_name),
          room:rooms(room_number, floor:floors(floor_number, wing))
        ),
        created_by_user:profiles!created_by(full_name)
      `)
      .order('payment_date', { ascending: false }),

    supabase
      .from('billings')
      .select(`
        id,
        type,
        utility_type,
        amount,
        balance,
        status,
        due_date,
        lease:leases(
          id,
          name,
          room:rooms(
            id,
            room_number,
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
      .eq('status', 'PENDING')
      .order('due_date'),

    supabase
      .from('properties')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),

    supabase
      .from('tenants')
      .select(`
        id,
        user:profiles(full_name),
        room:rooms(room_number),
        property_id
      `)
      .eq('tenant_status', 'ACTIVE')
      .order('property_id')
  ]);

  const form = await superValidate(zod(paymentSchema));
  const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
  const isAccountant = userRole?.role === 'property_accountant';
  const isFrontdesk = userRole?.role === 'property_frontdesk';

  return {
    form,
    payments,
    billings,
    properties,
    tenants,
    userRole: userRole?.role || 'user',
    isAdminLevel,
    isAccountant,
    isFrontdesk
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_accountant', 'property_frontdesk'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(paymentSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const { data: billing } = await supabase
      .from('billings')
      .select('amount, balance, status')
      .eq('id', form.data.billing_id)
      .single();

    if (!billing) {
      return fail(404, { form, message: 'Billing not found' });
    }

    if (billing.status !== 'PENDING') {
      return fail(400, { form, message: 'Cannot add payment to a non-pending billing' });
    }

    if (form.data.amount > billing.balance) {
      return fail(400, { form, message: 'Payment amount cannot exceed billing balance' });
    }

    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          ...form.data,
          created_by: session.user.id
        });

      if (paymentError) throw paymentError;

      const newBalance = billing.balance - form.data.amount;
      const newStatus = newBalance === 0 ? 'PAID' : 'PENDING';

      const { error: billingError } = await supabase
        .from('billings')
        .update({
          balance: newBalance,
          status: newStatus,
          paid_amount: billing.amount - newBalance
        })
        .eq('id', form.data.billing_id);

      if (billingError) throw billingError;

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_accountant'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(paymentSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_method: form.data.payment_method,
          reference_number: form.data.reference_number,
          receipt_url: form.data.receipt_url,
          notes: form.data.notes,
          status: form.data.status
        })
        .eq('id', form.data.id);

      if (error) throw error;

      // If payment is cancelled or refunded, update billing
      if (['CANCELLED', 'REFUNDED'].includes(form.data.status)) {
        const { data: payment } = await supabase
          .from('payments')
          .select('amount, billing:billings!inner(balance, amount)')
          .eq('id', form.data.id)
          .single();

        if (payment) {
          const newBalance = payment.billing.balance + payment.amount;
          const { error: billingError } = await supabase
            .from('billings')
            .update({
              balance: newBalance,
              status: 'PENDING',
              paid_amount: payment.billing.amount - newBalance
            })
            .eq('id', form.data.billing_id);

          if (billingError) throw billingError;
        }
      }

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_accountant'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(paymentSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', form.data.id);

      if (error) throw error;

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  }
};
