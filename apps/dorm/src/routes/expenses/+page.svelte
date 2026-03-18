<script lang="ts">
	import { expenseSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import type { Expense } from './types';
	import ExpenseList from './ExpenseList.svelte';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';
	import {
		expensesStore,
		propertiesStore
	} from '$lib/stores/collections.svelte';
	import { optimisticUpsertExpense, optimisticDeleteExpense } from '$lib/db/optimistic-expenses';

	// Client-side join: enrich expenses with property name (sorted by updated_at desc)
	let expenses = $derived(
		[...expensesStore.value]
			.sort((a: any, b: any) => {
				const aMs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
				const bMs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
				return bMs - aMs;
			})
			.map((e: any) => {
			const property = propertiesStore.value.find((p: any) => String(p.id) === String(e.property_id));
			return {
				...e,
				id: Number(e.id),
				property_id: e.property_id ? Number(e.property_id) : null,
				property: property ? { id: Number(property.id), name: property.name } : null,
				expense_date: e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-US', {
					year: 'numeric', month: '2-digit', day: '2-digit'
				}) : null
			};
		})
	);

	let properties = $derived(propertiesStore.value.map((p: any) => ({ id: Number(p.id), name: p.name })));
	let isLoading = $derived(!expensesStore.initialized);

	// ── Form setup ────────────────────────────────────────────────────────
	const { form, errors, enhance, constraints, submitting, reset } = superForm(defaults(zod(expenseSchema)), {
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
				const resultData = (result as any).data;
				toast.success(selectedExpense ? 'Expense updated' : 'Expense added');
				selectedExpense = null;

				// Optimistic upsert into RxDB then background resync
				if (resultData?.expense) {
					const exp = resultData.expense;
					optimisticUpsertExpense({
						id: exp.id,
						property_id: exp.propertyId ?? null,
						amount: String(exp.amount),
						description: exp.description,
						type: exp.type,
						status: exp.status,
						expense_date: exp.expenseDate ?? null,
						created_by: exp.createdBy ?? null
					});
				}
			}
		}
	});

	// State for managing the selected expense for editing
	let selectedExpense = $state<Expense | null>(null);

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let expenseToDeleteId = $state<number | null>(null);

	// Handle edit expense
	function handleEditExpense(event: CustomEvent<Expense>) {
		const expense = event.detail;
		selectedExpense = expense;

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
	}

	// Handle delete expense
	function handleDeleteExpense(event: CustomEvent<number>) {
		expenseToDeleteId = event.detail;
		showDeleteDialog = true;
	}

	async function confirmDeleteExpense() {
		if (expenseToDeleteId === null) return;
		const expenseId = expenseToDeleteId;
		showDeleteDialog = false;
		expenseToDeleteId = null;

		// Optimistic delete from RxDB first
		optimisticDeleteExpense(expenseId);

		try {
			const formData = new FormData();
			formData.append('id', expenseId.toString());

			const response = await fetch(`?/delete`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				toast.success('Expense deleted');
			} else {
				let responseData: any = {};
				try {
					const text = await response.text();
					responseData = text ? JSON.parse(text) : {};
				} catch { /* ignore parse errors */ }
				toast.error(`Error deleting expense: ${responseData.message || 'Unknown error'}`);
				// Resync to restore state on error
				const { resyncCollection } = await import('$lib/db/replication');
				resyncCollection('expenses').catch(() => {});
			}
		} catch (error) {
			console.error('Error deleting expense', error);
			toast.error('Error deleting expense');
			// Resync to restore state on error
			const { resyncCollection } = await import('$lib/db/replication');
			resyncCollection('expenses').catch(() => {});
		}
	}

	// Handle add new expense
	function handleAddExpense(event: CustomEvent<Partial<Expense>>) {
		const newExpense = event.detail;

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

	// Handle refresh event — resync from Neon
	async function handleRefresh() {
		const { resyncCollection } = await import('$lib/db/replication');
		await resyncCollection('expenses');
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

	{#if isLoading}
		<div class="space-y-2">
			{#each Array(5) as _, i (i)}
				<div class="border border-slate-200 rounded-lg p-4 animate-pulse">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3 flex-1">
							<div class="w-10 h-10 rounded-full bg-slate-200"></div>
							<div class="space-y-2">
								<div class="h-4 w-32 bg-slate-200 rounded"></div>
								<div class="h-3 w-48 bg-slate-200 rounded"></div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<ExpenseList
			expenses={expenses}
			properties={properties}
			on:edit={handleEditExpense}
			on:delete={handleDeleteExpense}
			on:add={handleAddExpense}
			on:refresh={handleRefresh}
		/>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Expense</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete this expense? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; expenseToDeleteId = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteExpense}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
