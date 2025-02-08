// src/routes/dorm/accounts/+page.server.ts
import { supabase } from '$lib/supabaseClient';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from "sveltekit-superforms/adapters";
import { billingSchema } from './formSchema';

export const load = async ({ locals: { supabase } }) => {
  const [billingsResult, leasesResult] = await Promise.all([
    supabase
      .from('billings')
      .select(`
        *,
        lease:leases (
          id,
          name,
          start_date,
          end_date,
          rent_amount,
          rental_unit:rental_unit (
            name,
            property:properties(name)
          ),
          lease_tenants (
            tenant:tenants (
              name,
              email,
              contact_number
            )
          )
        )
      `)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('leases')
      .select(`
        id,
        name,
        rent_amount,
        rental_unit:rental_unit (
          name,
          property:properties(name)
        ),
        lease_tenants (
          tenant:tenants (
            name
          )
        )
      `)
      .eq('status', 'ACTIVE')
  ]);

  const form = await superValidate(zod(billingSchema));

  return {
    form,
    billings: billingsResult.data || [],
    leases: leasesResult.data || []
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