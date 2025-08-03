import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { updatePenaltySchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import type { PostgrestError } from '@supabase/postgrest-js';
import type { PenaltyBilling } from './types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  if (!session.user) throw error(401, 'Unauthorized');

  try {
    // Get current date
    const currentDate = new Date();
    
    // Fetch all billings that are:
    // 1. Already have penalties (penalty_amount > 0)
    // 2. Are overdue (due_date < current date and not fully paid)
    // 3. Are approaching due date (due within 3 days)
    const { data: penaltyBillings, error: penaltyError } = await supabase
      .from('billings')
      .select(`
        *,
        lease:lease_id (
          id,
          name,
          rental_unit (
            name,
            number,
            floors (
              floor_number,
              wing
            ),
            properties (
              name
            )
          ),
          lease_tenants (
            tenants (
              id,
              name,
              email,
              contact_number
            )
          )
        )
      `)
      .or('penalty_amount.gt.0, and(due_date.lt.' + currentDate.toISOString() + ',balance.gt.0), and(due_date.gt.' + currentDate.toISOString() + ',due_date.lt.' + new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() + ')')
      .order('due_date', { ascending: false });

    if (penaltyError) {
      console.error('Error fetching penalty billings:', penaltyError);
      throw error(500, 'Failed to load penalty billings');
    }

    // Initialize the form for penalty updates
    const form = await superValidate(zod(updatePenaltySchema));

    return {
      penaltyBillings: penaltyBillings as PenaltyBilling[],
      form
    };
  } catch (err) {
    console.error('Error in penalties load function:', err);
    throw error(500, 'An unexpected error occurred');
  }
};

export const actions: Actions = {
  // Update a penalty amount
  updatePenalty: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session.user) return fail(401, { message: 'Unauthorized' });

    const form = await superValidate(request, zod(updatePenaltySchema));
    
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { id, penalty_amount, notes } = form.data;
      
      // Fetch the current billing record
      const { data: currentBilling, error: fetchError } = await supabase
        .from('billings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching billing:', fetchError);
        return fail(500, {
          form,
          message: 'Failed to fetch billing record'
        });
      }
      
      // Update the billing record with the new penalty amount
      const { error: updateError } = await supabase
        .from('billings')
        .update({
          penalty_amount,
          status: 'PENALIZED',
          notes: notes || currentBilling.notes,
          balance: currentBilling.balance - currentBilling.penalty_amount + penalty_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating penalty:', updateError);
        return fail(500, {
          form,
          message: 'Failed to update penalty amount'
        });
      }
      
      return { form };
    } catch (err) {
      console.error('Error in updatePenalty action:', err);
      return fail(500, {
        form,
        message: 'An unexpected error occurred'
      });
    }
  }
};
