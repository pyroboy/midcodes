import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { expenseSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  try {
    // Fetch expenses and properties in parallel
    const [{ data: expensesData, error: expensesError }, { data: propertiesData, error: propertiesError }] = await Promise.all([
      supabase
        .from('expenses')
        .select(`
          *,
          property:properties(id, name)
        `)
        .order('expense_date', { ascending: false }),
      
      supabase
        .from('properties')
        .select('id, name')
        // .eq('is_active', true)
        .order('name')
    ]);

    // Handle errors
    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      throw error(500, `Error fetching expenses: ${expensesError.message}`);
    }

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw error(500, `Error fetching properties: ${propertiesError.message}`);
    }

    // Create a mutable copy of properties data
    let properties = propertiesData || [];

    // Format dates for expenses
    const expenses = expensesData?.map(expense => ({
      ...expense,
      expense_date: new Date(expense.expense_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    })) || [];

    // Debug logging
    console.log(`Loaded ${expenses?.length || 0} expenses and ${properties.length || 0} properties`);
    console.log('Properties data:', properties);

    // If no properties found with is_active=true, try without the filter
    if (properties.length === 0) {
      console.log('No properties found with is_active=true, trying with status=ACTIVE');
      
      // Try with status=ACTIVE
      const { data: activeProperties, error: activePropertiesError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (activePropertiesError) {
        console.error('Error fetching properties with status=ACTIVE:', activePropertiesError);
      } else if (activeProperties && activeProperties.length > 0) {
        console.log(`Found ${activeProperties.length} properties with status=ACTIVE:`, activeProperties);
        properties = activeProperties;
      } else {
        console.log('No properties found with status=ACTIVE, trying without any filter');
        
        // Try without any filter
        const { data: allProperties, error: allPropertiesError } = await supabase
          .from('properties')
          .select('id, name')
          .order('name');
        
        if (allPropertiesError) {
          console.error('Error fetching all properties:', allPropertiesError);
        } else {
          console.log(`Found ${allProperties?.length || 0} properties without filter:`, allProperties);
          properties = allProperties;
        }
      }
    }

    // Create form for superForm
    const form = await superValidate(zod(expenseSchema));

    return {
      form,
      expenses,
      properties,
      user: session.user
    };
  } catch (err) {
    console.error('Error in load function:', err);
    throw error(500, 'Failed to load data');
  }
};

export const actions: Actions = {
  upsert: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod(expenseSchema));

    if (!form.valid) {
      console.error('Form validation error:', form.errors);
      return fail(400, { form });
    }

    try {
      const { id, ...expenseData } = form.data;
      
      // Determine if we're creating or updating
      if (id) {
        // This is an update
        const { data, error: updateError } = await supabase
          .from('expenses')
          .update({
            property_id: expenseData.property_id,
            amount: expenseData.amount,
            description: expenseData.description,
            type: expenseData.type,
            status: expenseData.expense_status,
            expense_date: expenseData.expense_date
          })
          .eq('id', id)
          .select();

        if (updateError) {
          console.error('Error updating expense:', updateError);
          return fail(500, { form, message: 'Failed to update expense' });
        }

        return { form, success: true, operation: 'update', expense: data?.[0] };
      } else {
        // This is a creation
        const { data, error: insertError } = await supabase
          .from('expenses')
          .insert({
            property_id: expenseData.property_id,
            amount: expenseData.amount,
            description: expenseData.description,
            type: expenseData.type,
            status: expenseData.expense_status,
            expense_date: expenseData.expense_date,
            created_by: session.user.id
          })
          .select();

        console.log('Creating expense with data:', {
          inputData: expenseData,
          dbData: data,
          type: expenseData.type
        });

        if (insertError) {
          console.error('Error creating expense:', insertError);
          return fail(500, { form, message: 'Failed to create expense' });
        }

        return { form, success: true, operation: 'create', expense: data?.[0] };
      }
    } catch (err) {
      console.error('Error in upsert operation:', err);
      return fail(500, { form, message: 'An unexpected error occurred' });
    }
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    let id;
    
    try {
      // Parse the request body as form data
      const formData = await request.formData();
      id = formData.get('id');
      
      console.log('Received delete request with ID:', id);

      if (!id) {
        console.error('Error: Expense ID is required but was not provided');
        return fail(400, { message: 'Expense ID is required' });
      }

      console.log('Attempting to delete expense with ID:', id);
      const { data, error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .select();

      console.log('Delete result:', { data, error: deleteError });

      if (deleteError) {
        console.error('Error deleting expense:', deleteError);
        return fail(500, { message: 'Failed to delete expense' });
      }

      return { success: true };
    } catch (err) {
      console.error('Error processing delete request:', err);
      return fail(500, { message: 'An error occurred while processing the delete request' });
    }
  }
};