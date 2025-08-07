<script lang="ts">
	import { browser } from '$app/environment';
	import { expenseSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';
	import type { Expense } from './types';
	import ExpenseList from './ExpenseList.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { invalidate, invalidateAll } from '$app/navigation';
	import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

	let { data } = $props<{ data: PageData }>();

	// Debug logging
	console.log('Page data:', data);
	console.log('Properties from page data:', data.properties);

	// Form for adding/editing expenses
	const { form, errors, enhance, constraints, submitting, reset } = superForm(data.form, {
		validators: zodClient(expenseSchema),
		resetForm: true,
		onUpdate: ({ form }) => {
			console.log('Form updated', form);
		},
		onError: ({ result }) => {
			console.error('Form error', result.error);
			toast.error('Error saving expense');
		},
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success(selectedExpense ? 'Expense updated' : 'Expense added');
				selectedExpense = null;
				invalidateAll();
			}
		}
	});

	// State for managing the selected expense for editing
	let selectedExpense = $state<Expense | null>(null);

	// Handle edit expense
	function handleEditExpense(event: CustomEvent<Expense>) {
		const expense = event.detail;
		selectedExpense = expense;

		// Reset the form with the expense data
		reset({
			data: {
				id: expense.id,
				property_id: expense.property_id,
				amount: expense.amount,
				description: expense.description,
				type: expense.type,
				expense_status: expense.expense_status,
				expense_date: expense.expense_date
			}
		});

		// Instead of showing modal, we'll submit the form when we finish editing
		// This would be handled by the direct editing in the list
	}

	// Handle delete expense
	async function handleDeleteExpense(event: CustomEvent<number>) {
		const expenseId = event.detail;
		console.log('Delete expense request for ID:', expenseId);

		if (!confirm('Are you sure you want to delete this expense?')) {
			return;
		}

		try {
			console.log('Sending delete request for expense ID:', expenseId);

			// Use FormData instead of JSON
			const formData = new FormData();
			formData.append('id', expenseId.toString());

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
				toast.success('Expense deleted');
				invalidateAll();
			} else {
				toast.error(`Error deleting expense: ${responseData.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting expense', error);
			toast.error('Error deleting expense');
		}
	}

	// Handle add new expense
	function handleAddExpense(event: CustomEvent<Partial<Expense>>) {
		const newExpense = event.detail;
		console.log('Page received new expense:', newExpense);

		// Set form data based on the new expense
		reset({
			data: {
				property_id: newExpense.property_id,
				amount: newExpense.amount,
				description: newExpense.description,
				type: newExpense.type,
				expense_status: newExpense.expense_status,
				expense_date: newExpense.expense_date
			}
		});

		console.log('Form reset with data:', {
			property_id: newExpense.property_id,
			amount: newExpense.amount,
			description: newExpense.description,
			type: newExpense.type,
			expense_status: newExpense.expense_status,
			expense_date: newExpense.expense_date
		});

		// Submit the form
		setTimeout(() => {
			const submitButton = document.createElement('button');
			submitButton.type = 'submit';
			submitButton.style.display = 'none';
			document.getElementById('expense-form')?.appendChild(submitButton);
			submitButton.click();
			submitButton.remove();
		}, 0);
	}

	// Handle refresh event
	async function handleRefresh() {
		// For SvelteKit, simply invalidate the parent data to trigger a reload
		await invalidate('expenses:refresh');
	}
</script>

<div class="container mx-auto py-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center mb-6 border-b pb-4">
		<h1 class="text-3xl font-bold">Expenses Management</h1>
	</div>

	<form id="expense-form" method="POST" action="?/upsert" use:enhance>
		<input type="hidden" name="id" value={$form.id} />
		<input type="hidden" name="property_id" value={$form.property_id} />
		<input type="hidden" name="amount" value={$form.amount} />
		<input type="hidden" name="description" value={$form.description} />
		<input type="hidden" name="type" value={$form.type} />
		<input type="hidden" name="expense_status" value={$form.expense_status} />
		<input type="hidden" name="expense_date" value={$form.expense_date} />
	</form>

	<ExpenseList
		expenses={data.expenses}
		properties={data.properties}
		on:edit={handleEditExpense}
		on:delete={handleDeleteExpense}
		on:add={handleAddExpense}
		on:refresh={handleRefresh}
	/>
</div>

{#if browser}
	<SuperDebug data={$form} />
{/if}
