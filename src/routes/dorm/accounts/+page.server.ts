// src/routes/dorm/accounts/+page.server.ts
import { supabase } from '$lib/supabaseClient';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from "sveltekit-superforms/adapters";
import { billingSchema } from './formSchema';
import type { Database } from '$lib/types/database';

export const load = async () => {
  // RLS will automatically filter based on user's role:
  // - Admin/Accountant: Full access
  // - Manager: View and update
  // - Frontdesk: View and create
  // - Tenant: View own billings
  const { data: billings, error: billingsError } = await supabase
    .from('billings')
    .select(`
      *,
      lease:leases (
        *,
        room:rooms (*),
        lease_tenants (
          tenant:tenants (*)
        )
      ),
      payments (*)
    `);

  if (billingsError) {
    console.error('Error fetching billings:', billingsError);
    throw new Error('Failed to load billings');
  }

  // Only admin, accountant, manager, and frontdesk can see all leases
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select(`
      *,
      room:rooms (*),
      lease_tenants (
        tenant:tenants (*)
      )
    `);

  if (leasesError) {
    console.error('Error fetching leases:', leasesError);
    throw new Error('Failed to load leases');
  }

  const form = await superValidate(zod(billingSchema));

  return {
    form,
    billings,
    leases
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(billingSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const { data, error } = await supabase
      .from('billings')
      .insert({
        leaseId: form.data.leaseId,
        type: form.data.type,
        utilityType: form.data.utilityType,
        amount: form.data.amount,
        paidAmount: form.data.paidAmount,
        balance: form.data.amount - form.data.paidAmount,
        status: form.data.status,
        dueDate: form.data.dueDate,
        billingDate: form.data.billingDate,
        penaltyAmount: form.data.penaltyAmount,
        notes: form.data.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating billing:', error);
      return fail(500, { form });
    }

    return { form };
  },

  update: async ({ request }) => {
    const form = await superValidate(request, zod(billingSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const { error } = await supabase
      .from('billings')
      .update({
        leaseId: form.data.leaseId,
        type: form.data.type,
        utilityType: form.data.utilityType,
        amount: form.data.amount,
        paidAmount: form.data.paidAmount,
        balance: form.data.amount - form.data.paidAmount,
        status: form.data.status,
        dueDate: form.data.dueDate,
        billingDate: form.data.billingDate,
        penaltyAmount: form.data.penaltyAmount,
        notes: form.data.notes,
      })
      .eq('id', form.data.id);

    if (error) {
      console.error('Error updating billing:', error);
      return fail(500, { form });
    }

    return { form };
  }
};