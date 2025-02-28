<script lang="ts">
  import { browser } from '$app/environment';
  import { budgetSchema } from './schema';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';
  import { superForm } from 'sveltekit-superforms/client';
  import type { PageData } from './$types';
  import type { Budget } from './types';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { invalidate, invalidateAll } from '$app/navigation';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import BudgetList from './BudgetList.svelte';
  import BudgetStats from './BudgetStats.svelte';

  // Page data using Svelte 5 $props rune
  let { data } = $props<{data: PageData}>();

  // Debug logging
  console.log('Page data:', data);

  // Form for adding/editing budgets
  const { form, errors, enhance, constraints, submitting, reset } = superForm(
    data.form,
    {
      validators: zodClient(budgetSchema),
      resetForm: true,
      onUpdate: ({ form }) => {
        console.log('Form updated', form);
      },
      onError: ({ result }) => {
        console.error('Form error', result.error);
        toast.error('Error saving budget');
      },
      onResult: ({ result }) => {
        if (result.type === 'success') {
          toast.success(selectedBudget ? 'Budget updated' : 'Budget added');
          selectedBudget = null;
          invalidateAll();
        }
      }
    }
  );

  // State for managing the selected budget for editing
  let selectedBudget = $state<Budget | null>(null);

  // Handle edit budget
  function handleEditBudget(event: CustomEvent<Budget>) {
    const budget = event.detail;
    selectedBudget = budget;
    
    // Reset the form with the budget data
    reset({
      data: {
        id: budget.id,
        property_id: budget.property_id,
        project_name: budget.project_name,
        project_description: budget.project_description,
        project_category: budget.project_category,
        planned_amount: budget.planned_amount,
        pending_amount: budget.pending_amount,
        actual_amount: budget.actual_amount,
        budget_items: budget.budget_items || [],
        status: budget.status,
        start_date: budget.start_date,
        end_date: budget.end_date
      }
    });
  }

  // Handle delete budget
  async function handleDeleteBudget(event: CustomEvent<number>) {
    const budgetId = event.detail;
    console.log('Delete budget request for ID:', budgetId);
    
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      console.log('Sending delete request for budget ID:', budgetId);
      
      // Use FormData instead of JSON
      const formData = new FormData();
      formData.append('id', budgetId.toString());
      
      const response = await fetch(`?/delete`, {
        method: 'POST',
        body: formData
      });

      console.log('Delete response status:', response.status);
      
      // Carefully parse the response - it might not always be JSON
      let responseData;
      try {
        const text = await response.text();
        console.log('Delete response raw text:', text);
        responseData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        responseData = {};
      }
      
      console.log('Delete response data:', responseData);

      if (response.ok) {
        toast.success('Budget deleted');
        invalidateAll();
      } else {
        toast.error(`Error deleting budget: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting budget', error);
      toast.error('Error deleting budget');
    }
  }
  
  // Handle add new budget
  function handleAddBudget(event: CustomEvent<Partial<Budget>>) {
    const newBudget = event.detail;
    console.log('Page received new budget:', newBudget);
    
    // Set form data based on the new budget
    reset({
      data: {
        property_id: newBudget.property_id,
        project_name: newBudget.project_name,
        project_description: newBudget.project_description,
        project_category: newBudget.project_category,
        planned_amount: newBudget.planned_amount,
        pending_amount: newBudget.pending_amount,
        actual_amount: newBudget.actual_amount,
        budget_items: newBudget.budget_items || [],
        status: newBudget.status,
        start_date: newBudget.start_date,
        end_date: newBudget.end_date
      }
    });
    
    // Submit the form
    setTimeout(() => {
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.style.display = 'none';
      document.getElementById('budget-form')?.appendChild(submitButton);
      submitButton.click();
      submitButton.remove();
    }, 0);
  }

  // Handle refresh event
  async function handleRefresh() {
    // For SvelteKit, simply invalidate the parent data to trigger a reload
    await invalidate('budgets:refresh');
  }
</script>

<div class="container mx-auto py-6">
  <!-- Page Header -->
  <div class="flex justify-between items-center mb-6 border-b pb-4">
    <h1 class="text-3xl font-bold">Budget Planner</h1>
  </div>

  <!-- Statistics Summary -->
  <BudgetStats statistics={data.statistics} />

  <form id="budget-form" method="POST" action="?/upsert" use:enhance>
    <input type="hidden" name="id" value={$form.id} />
    <input type="hidden" name="property_id" value={$form.property_id} />
    <input type="hidden" name="project_name" value={$form.project_name} />
    <input type="hidden" name="project_description" value={$form.project_description} />
    <input type="hidden" name="project_category" value={$form.project_category} />
    <input type="hidden" name="planned_amount" value={$form.planned_amount} />
    <input type="hidden" name="pending_amount" value={$form.pending_amount} />
    <input type="hidden" name="actual_amount" value={$form.actual_amount} />
    <input type="hidden" name="status" value={$form.status} />
    <input type="hidden" name="start_date" value={$form.start_date} />
    <input type="hidden" name="end_date" value={$form.end_date} />
    <input type="hidden" name="budget_items" value={JSON.stringify($form.budget_items)} />
  </form>

  <BudgetList
    budgets={data.budgets}
    properties={data.properties}
    on:edit={handleEditBudget}
    on:delete={handleDeleteBudget}
    on:add={handleAddBudget}
    on:refresh={handleRefresh}
  />
</div>

{#if browser && import.meta.env.DEV}
  <SuperDebug data={$form} />
{/if}
