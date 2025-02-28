import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { budgetSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  try {
    // Fetch budgets and properties in parallel
    const [{ data: budgetsData, error: budgetsError }, { data: propertiesData, error: propertiesError }] = await Promise.all([
      supabase
        .from('budgets')
        .select(`
          *,
          property:properties(id, name)
        `)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('properties')
        .select('id, name')
        .order('name')
    ]);

    // Handle errors
    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
      throw error(500, `Error fetching budgets: ${budgetsError.message}`);
    }

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      throw error(500, `Error fetching properties: ${propertiesError.message}`);
    }

    // Create a mutable copy of properties data
    let properties = propertiesData || [];

    // Process budget data to include additional stats
    const budgets = budgetsData?.map(budget => {
      // Ensure budget_items is properly parsed from JSON if needed
      let budgetItems;
      try {
        // Check if budget_items is a string (JSON) and parse it
        if (typeof budget.budget_items === 'string') {
          budgetItems = JSON.parse(budget.budget_items);
        } 
        // Ensure it's an array
        budgetItems = Array.isArray(budget.budget_items) ? budget.budget_items : 
                     Array.isArray(budgetItems) ? budgetItems : [];
      } catch (e) {
        console.error('Error parsing budget_items:', e);
        budgetItems = [];
      }

      const allocatedAmount = budgetItems.reduce((total: number, item: any) => 
        total + (parseFloat(item.cost) * parseFloat(item.quantity)), 0);
      
      return {
        ...budget,
        allocatedAmount,
        remainingAmount: budget.planned_amount - allocatedAmount,
        isExpanded: false,
        start_date: budget.start_date ? new Date(budget.start_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : null,
        end_date: budget.end_date ? new Date(budget.end_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : null
      };
    }) || [];

    // If no properties found, try without any filter
    if (properties.length === 0) {
      console.log('No properties found, trying without any filter');
      
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

    // Calculate overall budget statistics
    const statistics = budgets.reduce((stats: any, budget) => {
      // Add planned amount to total
      stats.totalPlannedBudget += parseFloat(budget.planned_amount) || 0;
      
      // Add allocated amount
      stats.totalAllocatedBudget += budget.allocatedAmount || 0;
      
      // Count by status
      if (budget.status === 'COMPLETED') {
        stats.completedProjects += 1;
      } else if (budget.status === 'ONGOING') {
        stats.ongoingProjects += 1;
      }
      
      return stats;
    }, {
      totalPlannedBudget: 0,
      totalAllocatedBudget: 0,
      totalRemainingBudget: 0,
      completedProjects: 0,
      ongoingProjects: 0
    });
    
    // Calculate remaining budget
    statistics.totalRemainingBudget = statistics.totalPlannedBudget - statistics.totalAllocatedBudget;

    // Create form for superForm
    const form = await superValidate(zod(budgetSchema));

    return {
      form,
      budgets,
      properties,
      statistics,
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

    const form = await superValidate(request, zod(budgetSchema));

    if (!form.valid) {
      console.error('Form validation error:', form.errors);
      return fail(400, { form });
    }

    try {
      const { id, ...budgetData } = form.data;
      
      // Ensure budget_items is properly formatted as JSONB
      const formattedData = {
        ...budgetData,
        budget_items: JSON.stringify(budgetData.budget_items || [])
      };
      
      // Determine if we're creating or updating
      if (id) {
        // This is an update
        const { data, error: updateError } = await supabase
          .from('budgets')
          .update({
            property_id: formattedData.property_id,
            project_name: formattedData.project_name,
            project_description: formattedData.project_description,
            project_category: formattedData.project_category,
            planned_amount: formattedData.planned_amount,
            pending_amount: formattedData.pending_amount,
            actual_amount: formattedData.actual_amount,
            budget_items: formattedData.budget_items,
            status: formattedData.status,
            start_date: formattedData.start_date,
            end_date: formattedData.end_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();

        if (updateError) {
          console.error('Error updating budget:', updateError);
          return fail(500, { form, message: 'Failed to update budget' });
        }

        return { form, success: true, operation: 'update', budget: data?.[0] };
      } else {
        // This is a creation
        const { data, error: insertError } = await supabase
          .from('budgets')
          .insert({
            property_id: formattedData.property_id,
            project_name: formattedData.project_name,
            project_description: formattedData.project_description,
            project_category: formattedData.project_category,
            planned_amount: formattedData.planned_amount,
            pending_amount: formattedData.pending_amount || 0,
            actual_amount: formattedData.actual_amount || 0,
            budget_items: formattedData.budget_items,
            status: formattedData.status,
            start_date: formattedData.start_date,
            end_date: formattedData.end_date,
            created_by: session.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (insertError) {
          console.error('Error creating budget:', insertError);
          return fail(500, { form, message: 'Failed to create budget' });
        }

        return { form, success: true, operation: 'create', budget: data?.[0] };
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
        console.error('Error: Budget ID is required but was not provided');
        return fail(400, { message: 'Budget ID is required' });
      }

      console.log('Attempting to delete budget with ID:', id);
      const { data, error: deleteError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .select();

      console.log('Delete result:', { data, error: deleteError });

      if (deleteError) {
        console.error('Error deleting budget:', deleteError);
        return fail(500, { message: 'Failed to delete budget' });
      }

      return { success: true };
    } catch (err) {
      console.error('Error processing delete request:', err);
      return fail(500, { message: 'An error occurred while processing the delete request' });
    }
  }
};
