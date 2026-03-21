<script lang="ts">
	import { expenseSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Card from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import type { Expense } from './types';
	import ExpenseList from './ExpenseList.svelte';
	import ExpenseFormModal from './ExpenseFormModal.svelte';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';
	import {
		expensesStore,
		propertiesStore
	} from '$lib/stores/collections.svelte';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import { optimisticUpsertExpense, optimisticDeleteExpense } from '$lib/db/optimistic-expenses';
	import { bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import { formatDate, formatCurrency, humanizeExpenseType } from '$lib/utils/format';
	import { DollarSign, Briefcase, Wrench, Plus } from 'lucide-svelte';

	// Duplicate guard — prevent double submit within 2s
	let lastSubmitKey = $state('');
	let lastSubmitTime = $state(0);

	// [P1-6] Client-side join with Map lookup for O(1) property resolution
	let expenses = $derived.by(() => {
		const propMap = new Map<string, any>();
		for (const p of propertiesStore.value) propMap.set(String(p.id), p);

		return [...expensesStore.value]
			.sort((a: any, b: any) => {
				const aMs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
				const bMs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
				return bMs - aMs;
			})
			.map((e: any) => {
				const property = propMap.get(String(e.property_id));
				return {
					...e,
					id: Number(e.id),
					property_id: e.property_id ? Number(e.property_id) : null,
					property: property ? { id: Number(property.id), name: property.name } : null,
					expense_date: e.expense_date ? formatDate(e.expense_date) : null
				};
			});
	});

	let properties = $derived(propertiesStore.value.map((p: any) => ({ id: Number(p.id), name: p.name })));
	let isLoading = $derived(!expensesStore.initialized);

	// Summary stats — show amounts, not just counts
	let stats = $derived.by(() => {
		let totalAmount = 0;
		let capitalAmount = 0;
		let operationalAmount = 0;
		let capitalCount = 0;
		let operationalCount = 0;
		for (const e of expenses) {
			const amt = parseFloat(e.amount) || 0;
			totalAmount += amt;
			if (e.type === 'CAPITAL') {
				capitalAmount += amt;
				capitalCount++;
			} else {
				operationalAmount += amt;
				operationalCount++;
			}
		}
		return { totalAmount, capitalAmount, operationalAmount, capitalCount, operationalCount };
	});

	// ── Form setup ────────────────────────────────────────────────────────
	let savedFormData: any = null;
	let submitSeq = 0;
	let rollback: (() => Promise<void>) | null = null;

	const { form, errors, enhance, constraints, submitting, reset } = superForm(defaults(zod(expenseSchema)), {
		validators: zodClient(expenseSchema),
		validationMethod: 'onsubmit',
		resetForm: true,
		onSubmit: async ({ cancel }) => {
			// Duplicate guard — block same description+amount within 2s
			const submitKey = `${$form.description}|${$form.amount}|${$form.type}`;
			const now = Date.now();
			if (submitKey === lastSubmitKey && now - lastSubmitTime < 2000) {
				toast.warning('Duplicate submission blocked');
				cancel();
				return;
			}
			lastSubmitKey = submitKey;
			lastSubmitTime = now;

			submitSeq++;
			savedFormData = { ...$form, _seq: submitSeq };
			const isEdit = !!(selectedExpense);
			// Close modal immediately for instant feel
			showFormModal = false;
			selectedExpense = null;
			toast.info(isEdit ? 'Saving expense...' : 'Creating expense...');
			if (isEdit && savedFormData.id) {
				rollback = await optimisticUpsertExpense({
					id: savedFormData.id,
					property_id: savedFormData.property_id ?? null,
					amount: String(savedFormData.amount),
					description: savedFormData.description,
					type: savedFormData.type,
					status: savedFormData.expense_status,
					expense_date: savedFormData.expense_date ?? null
				});
			}
		},
		onError: async ({ result }) => {
			console.error('Form error', result.error);
			toast.error('Error saving expense');
			if (rollback) { await rollback(); rollback = null; }
			import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('expenses'));
		},
		onResult: async ({ result }) => {
			if (!savedFormData || savedFormData._seq !== submitSeq) return;

			if (result.type === 'success') {
				const resultData = (result as any).data;
				const isEdit = !!(savedFormData?.id);
				rollback = null;
				const amt = formatCurrency(parseFloat(savedFormData.amount) || 0);
				const typeName = humanizeExpenseType(savedFormData.type);
				toast.success(isEdit ? `Expense updated: ${amt} ${typeName}` : `Expense added: ${amt} ${typeName}`);

				if (resultData?.expense) {
					const exp = resultData.expense;
					await optimisticUpsertExpense({
						id: exp.id,
						property_id: exp.propertyId ?? exp.property_id ?? null,
						amount: String(exp.amount),
						description: exp.description,
						type: exp.type,
						status: exp.status ?? exp.expense_status,
						expense_date: exp.expenseDate ?? exp.expense_date ?? null,
						created_by: exp.createdBy ?? exp.created_by ?? null
					});
				}
			} else if (result.type === 'failure') {
				if ((result.data as any)?.conflict) {
					toast.error(CONFLICT_MESSAGE, { duration: 6000 });
				} else {
					toast.error('Failed to save expense');
				}
				if (rollback) { await rollback(); rollback = null; }
				import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('expenses'));
			}
		}
	});

	// Modal state
	let showFormModal = $state(false);
	let selectedExpense = $state<Expense | null>(null);
	let editUpdatedAt = $state<string | null>(null);

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let expenseToDeleteId = $state<number | null>(null);

	// Open modal for adding a new expense
	function openAddModal() {
		selectedExpense = null;
		editUpdatedAt = null;
		reset();
		showFormModal = true;
	}

	// Handle edit expense
	function handleEditExpense(event: CustomEvent<Expense>) {
		const expense = event.detail;
		selectedExpense = expense;
		editUpdatedAt = (expense as any).updated_at ?? null;

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
		showFormModal = true;
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

		const deleteFormData = new FormData();
		deleteFormData.append('id', expenseId.toString());

		await bufferedMutation({
			label: `Delete Expense #${expenseId}`,
			collection: 'expenses',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteExpense(expenseId);
			},
			serverAction: async () => {
				const response = await fetch('?/delete', { method: 'POST', body: deleteFormData });
				if (!response.ok) throw new Error('Server rejected delete');
				return response;
			},
			onSuccess: async () => {
				toast.success('Expense deleted');
			}
		});
	}

	// Handle modal close/cancel
	function handleModalClose() {
		showFormModal = false;
		selectedExpense = null;
	}

	// Handle refresh event — resync from Neon
	async function handleRefresh() {
		const { resyncCollection } = await import('$lib/db/replication');
		await resyncCollection('expenses');
	}
</script>

<div class="container mx-auto py-6">
	<SyncErrorBanner collections={['expenses', 'properties']} />
	<!-- Page Header with Add button -->
	<div class="flex justify-between items-center mb-6 border-b pb-4">
		<h1 class="text-3xl font-bold">Expenses Management</h1>
		<Button onclick={openAddModal} class="hidden sm:inline-flex shadow-sm">
			<Plus class="w-4 h-4 mr-2" />
			Add Expense
		</Button>
	</div>

	<!-- Summary Stats — amounts, not counts -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
		<Card.Root>
			<Card.Content class="flex items-center gap-3 p-4">
				<div class="rounded-lg bg-emerald-50 p-2">
					<DollarSign class="h-5 w-5 text-emerald-600" />
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Total Expenses</p>
					<p class="text-lg font-bold tabular-nums">{formatCurrency(stats.totalAmount)}</p>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-3 p-4">
				<div class="rounded-lg bg-blue-50 p-2">
					<Briefcase class="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Capital</p>
					<p class="text-lg font-bold tabular-nums">{formatCurrency(stats.capitalAmount)}</p>
					<p class="text-xs text-muted-foreground">{stats.capitalCount} expense{stats.capitalCount !== 1 ? 's' : ''}</p>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-3 p-4">
				<div class="rounded-lg bg-orange-50 p-2">
					<Wrench class="h-5 w-5 text-orange-600" />
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Operational</p>
					<p class="text-lg font-bold tabular-nums">{formatCurrency(stats.operationalAmount)}</p>
					<p class="text-xs text-muted-foreground">{stats.operationalCount} expense{stats.operationalCount !== 1 ? 's' : ''}</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

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
			on:refresh={handleRefresh}
		/>
	{/if}
</div>

<!-- Mobile FAB — fixed bottom-right, only visible on small screens -->
{#if !isLoading}
	<button
		class="sm:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
		onclick={openAddModal}
		aria-label="Add Expense"
	>
		<Plus class="w-6 h-6" />
	</button>
{/if}

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
			<AlertDialog.Action onclick={confirmDeleteExpense} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Expense Form Modal -->
<ExpenseFormModal
	open={showFormModal}
	properties={properties}
	editMode={!!selectedExpense}
	updatedAt={editUpdatedAt}
	form={$form}
	errors={$errors}
	enhance={enhance}
	constraints={$constraints}
	submitting={$submitting}
	on:close={handleModalClose}
	on:cancel={handleModalClose}
/>
