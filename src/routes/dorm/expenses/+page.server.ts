// src/routes/dorm/expenses/+page.server.ts

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { expenseSchema } from './formSchema';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
  const [{ data: expenses }, { data: properties }] = await Promise.all([
    supabase
      .from('expenses')
      .select(`
        *,
        property:properties(name),
        created_by_user:profiles!created_by(full_name),
        approved_by_user:profiles!approved_by(full_name)
      `)
      .order('expense_date', { ascending: false }),
    
    supabase
      .from('properties')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name')
  ]);

  const form = await superValidate(zod(expenseSchema));

  return {
    form,
    expenses,
    properties,
    user: locals.user
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(request, zod(expenseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...form.data,
          created_by: locals.user.id,
          expense_status: 'PENDING'
        });

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  update: async ({ request, locals }) => {
    const form = await superValidate(request, zod(expenseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          property_id: form.data.property_id,
          expense_type: form.data.expense_type,
          expense_status: form.data.expense_status,
          amount: form.data.amount,
          description: form.data.description,
          expense_date: form.data.expense_date,
          receipt_url: form.data.receipt_url,
          notes: form.data.notes,
          approved_by: form.data.expense_status === 'APPROVED' ? locals.user.id : null
        })
        .eq('id', form.data.id);

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  delete: async ({ request }) => {
    const form = await superValidate(request, zod(expenseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('expenses')
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