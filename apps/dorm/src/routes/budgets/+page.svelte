<script lang="ts">
	import { budgetSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import {
		budgetsStore,
		propertiesStore
	} from '$lib/stores/collections.svelte';
	import { optimisticUpsertBudget, optimisticDeleteBudget } from '$lib/db/optimistic-budgets';
	import { bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Input } from '$lib/components/ui/input';
	import {
		DollarSign,
		CheckCircle,
		Clock,
		Plus,
		Edit,
		Trash2,
		RefreshCw,
		Info,
		CalendarRange,
		Loader2,
		Search
	} from 'lucide-svelte';
	const ITEMS_PER_PAGE = 24;
	import type { Budget, BudgetWithStats, BudgetItem } from './types';
	import BudgetFormModal from './BudgetFormModal.svelte';
	import BudgetItemFormModal from './BudgetItemFormModal.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { cn } from '$lib/utils';
	import { formatDate, formatCurrency, getStatusClasses } from '$lib/utils/format';
	import BudgetProjectCard from './BudgetProjectCard.svelte';
	import { PieChart } from 'lucide-svelte';
	// RxDB stores (singletons from collections.svelte.ts)
	let properties = $derived(
		[...propertiesStore.value]
			.sort((a: any, b: any) => a.name.localeCompare(b.name))
			.map((p: any) => ({ id: Number(p.id), name: p.name }))
	);

	// Process budgets with enrichment (sorted by updated_at desc)
	let budgets = $derived.by(() => {
		const sortedBudgets = [...budgetsStore.value].sort((a: any, b: any) => {
			const aMs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
			const bMs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
			return bMs - aMs;
		});
		// [P1-8] Map for O(1) property lookup
		const propMap = new Map<string, any>();
		for (const p of propertiesStore.value) propMap.set(String(p.id), p);

		return sortedBudgets.map((budget: any) => {
			const property = propMap.get(String(budget.property_id));

			let budgetItems: any[];
			try {
				if (typeof budget.budget_items === 'string') {
					budgetItems = JSON.parse(budget.budget_items);
				} else {
					budgetItems = Array.isArray(budget.budget_items) ? budget.budget_items : [];
				}
			} catch {
				budgetItems = [];
			}

			const allocatedAmount = budgetItems.reduce((total: number, item: any) => {
				const cost = typeof item.cost === 'number' && !isNaN(item.cost) ? item.cost : 0;
				const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
				return total + cost * quantity;
			}, 0);

			const plannedAmount = parseFloat(budget.planned_amount) || 0;

			return {
				...budget,
				id: Number(budget.id),
				property_id: budget.property_id ? Number(budget.property_id) : null,
				property: property ? { id: Number(property.id), name: property.name } : null,
				planned_amount: plannedAmount,
				pending_amount: parseFloat(budget.pending_amount) || 0,
				actual_amount: parseFloat(budget.actual_amount) || 0,
				allocatedAmount,
				remainingAmount: plannedAmount - allocatedAmount,
				isExpanded: false,
				budget_items: budgetItems.map((item: any) => ({
					id: item.id || null,
					name: item.name || '',
					type: item.type || 'OTHER',
					cost: typeof item.cost === 'number' && !isNaN(item.cost) ? item.cost : 0,
					quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0
				})),
				start_date: budget.start_date ? formatDate(budget.start_date) : null,
				end_date: budget.end_date ? formatDate(budget.end_date) : null
			};
		});
	});

	// Compute statistics client-side
	let statistics = $derived.by(() => {
		const stats = budgets.reduce((acc: any, budget: any) => {
			acc.totalPlannedBudget += budget.planned_amount;
			acc.totalAllocatedBudget += budget.allocatedAmount;
			if (budget.status === 'COMPLETED') acc.completedProjects += 1;
			else if (budget.status === 'ONGOING') acc.ongoingProjects += 1;
			return acc;
		}, {
			totalPlannedBudget: 0,
			totalAllocatedBudget: 0,
			totalRemainingBudget: 0,
			completedProjects: 0,
			ongoingProjects: 0
		});
		stats.totalRemainingBudget = stats.totalPlannedBudget - stats.totalAllocatedBudget;
		return stats;
	});

	let isLoading = $derived(!budgetsStore.initialized);

	// Search and pagination
	let searchInput = $state('');
	let searchQuery = $state('');
	let searchTimer: ReturnType<typeof setTimeout>;
	let currentPage = $state(1);

	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchInput = val;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => { searchQuery = val; }, 300);
	}

	let filteredBudgets = $derived.by(() => {
		if (!searchQuery.trim()) return budgets;
		const q = searchQuery.trim().toLowerCase();
		return budgets.filter((b: any) =>
			b.project_name?.toLowerCase().includes(q) ||
			b.property?.name?.toLowerCase().includes(q) ||
			b.project_category?.toLowerCase().includes(q)
		);
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filteredBudgets.length / ITEMS_PER_PAGE)));
	let pagedBudgets = $derived(filteredBudgets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE));

	$effect(() => {
		searchQuery;
		currentPage = 1;
	});

	// State management for modals and UI
	let savedFormData = $state<any>(null);
	let submitSeq = 0;
	let isSubmitting = $state(false);
	let rollback: (() => Promise<void>) | null = null;
	let showDeleteDialog = $state(false);
	let budgetToDeleteId = $state<number | null>(null);
	let showBudgetFormModal = $state(false);
	let showItemFormModal = $state(false);
	let editingBudget = $state(false);
	let selectedBudget = $state<Budget | null>(null);
	let selectedBudgetItem = $state<BudgetItem | null>(null);
	let itemBudgetId = $state<number | null>(null);

	// Add this function to sanitize budget items
	function sanitizeBudgetItems(items: any[]): any[] {
		if (!Array.isArray(items)) return [];

		return items.map((item) => {
			// Make sure each item has a string ID
			if (!item.id || item.id === null) {
				return {
					...item,
					id: String(Date.now() + Math.random())
				};
			} else if (typeof item.id !== 'string') {
				return {
					...item,
					id: String(item.id)
				};
			}
			return item;
		});
	}

	// Setup superForm without the problematic transform property
	const { form, errors, enhance, constraints, submitting, reset } = superForm(defaults(zod(budgetSchema)), {
		validators: zodClient(budgetSchema),
		resetForm: true,
		dataType: 'json',
		onUpdate: ({ form }) => {
			},
		onSubmit: async () => {
			submitSeq++;
			savedFormData = { ...$form, _seq: submitSeq };
			const isEdit = editingBudget;
			isSubmitting = true;
			showBudgetFormModal = false;
			// For updates: optimistic write to RxDB now (ID is already known)
			if (isEdit && savedFormData?.id) {
				rollback = await optimisticUpsertBudget({
					id: savedFormData.id,
					project_name: savedFormData.project_name,
					project_description: savedFormData.project_description,
					project_category: savedFormData.project_category,
					planned_amount: String(savedFormData.planned_amount),
					pending_amount: savedFormData.pending_amount != null ? String(savedFormData.pending_amount) : null,
					actual_amount: savedFormData.actual_amount != null ? String(savedFormData.actual_amount) : null,
					budget_items: savedFormData.budget_items,
					status: savedFormData.status,
					start_date: savedFormData.start_date,
					end_date: savedFormData.end_date,
					property_id: savedFormData.property_id
				});
			}
		},
		onError: async ({ result }) => {
			console.error('Form error', result.error);
			isSubmitting = false;
			toast.error('Error saving budget');
			// Instant rollback, then confirm with resync
			if (rollback) { await rollback(); rollback = null; }
			import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('budgets'));
		},
		onResult: async ({ result }) => {
			// Ignore if a newer submission has already overwritten
			if (!savedFormData || savedFormData._seq !== submitSeq) return;

			if (result.type === 'success') {
				const resultData = (result as any).data;
				const isEdit = editingBudget;
				isSubmitting = false;
				selectedBudget = null;
				editingBudget = false;
				rollback = null;
				const budgetLabel = savedFormData?.project_name || 'Budget';
				const amt = formatCurrency(parseFloat(savedFormData?.planned_amount) || 0);
				toast.success(isEdit ? `${budgetLabel} updated (${amt})` : `${budgetLabel} created (${amt})`);
				if (resultData?.budget) {
					await optimisticUpsertBudget(resultData.budget);
				}
			} else if (result.type === 'failure') {
				isSubmitting = false;
				if ((result.data as any)?.conflict) {
					toast.error(CONFLICT_MESSAGE, { duration: 6000 });
				} else {
					toast.error('Failed to save budget');
				}
				// Instant rollback, then confirm with resync
				if (rollback) { await rollback(); rollback = null; }
				import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('budgets'));
			}
		}
	});

	// Handle add budget
	function handleAddBudget() {
		selectedBudget = null;
		editingBudget = false;
		showBudgetFormModal = true;
	}

	let editUpdatedAt = $state<string | null>(null);

	// Handle edit budget
	function handleEditBudget(budget: BudgetWithStats) {
		selectedBudget = budget;
		editingBudget = true;
		editUpdatedAt = (budget as any).updated_at ?? null;
		showBudgetFormModal = true;
	}

	// Handle add item
	function handleAddItem(budgetId: number) {
		itemBudgetId = budgetId;
		selectedBudgetItem = null;
		showItemFormModal = true;
	}

	// Duplicate guard
	let lastBudgetSubmitKey = '';
	let lastBudgetSubmitTime = 0;

	// Handle budget form submission
	function handleBudgetSubmit(event: CustomEvent<Budget>) {
		const budget = event.detail;

		// Duplicate guard — block same name+amount within 2s
		const submitKey = `${budget.project_name}|${budget.planned_amount}`;
		const now = Date.now();
		if (submitKey === lastBudgetSubmitKey && now - lastBudgetSubmitTime < 2000) {
			toast.warning('Duplicate submission blocked');
			return;
		}
		lastBudgetSubmitKey = submitKey;
		lastBudgetSubmitTime = now;

		// Ensure all budget items have string ids
		const sanitizedBudgetItems = sanitizeBudgetItems(budget.budget_items || []);

		// Reset the form with the sanitized budget data
		reset({
			data: {
				id: budget.id,
				property_id: budget.property_id,
				project_name: budget.project_name,
				project_description: budget.project_description,
				project_category: budget.project_category,
				planned_amount: budget.planned_amount,
				pending_amount: budget.pending_amount || 0,
				actual_amount: budget.actual_amount || 0,
				budget_items: sanitizedBudgetItems, // Use sanitized items
				status: budget.status,
				start_date: budget.start_date,
				end_date: budget.end_date
			}
		});

		// Submit the form
		setTimeout(() => {
			const submitButton = document.getElementById('submit-budget-form');
			if (submitButton) submitButton.click();
		}, 0);

		showBudgetFormModal = false;
	}

	// Handle item form submission
	function handleItemSubmit(event: CustomEvent<BudgetItem>) {
		const newItem = event.detail;

		if (!itemBudgetId) return;

		// Find the budget from local RxDB data
		const budget = budgets.find((b: any) => b.id === itemBudgetId);
		if (!budget) return;

		// Ensure the new item has a string ID
		const sanitizedItem = {
			...newItem,
			id: newItem.id ? String(newItem.id) : String(Date.now() + Math.random())
		};

		// Create a copy of the budget items array
		const existingItems = Array.isArray(budget.budget_items) ? budget.budget_items : [];
		// Sanitize existing items too
		const sanitizedExistingItems = sanitizeBudgetItems(existingItems);
		const updatedItems = [...sanitizedExistingItems, sanitizedItem];

		// Reset the form with the updated budget data
		reset({
			data: {
				id: budget.id,
				property_id: budget.property_id,
				project_name: budget.project_name,
				project_description: budget.project_description,
				project_category: budget.project_category,
				planned_amount: budget.planned_amount,
				pending_amount: budget.pending_amount || 0,
				actual_amount: budget.actual_amount || 0,
				budget_items: updatedItems,
				status: budget.status,
				start_date: budget.start_date,
				end_date: budget.end_date
			}
		});

		// Submit the form
		setTimeout(() => {
			const submitButton = document.getElementById('submit-budget-form');
			if (submitButton) submitButton.click();
		}, 0);

		showItemFormModal = false;
	}

	// Handle delete budget
	function handleDeleteBudget(budgetId: number) {
		budgetToDeleteId = budgetId;
		showDeleteDialog = true;
	}

	async function confirmDeleteBudget() {
		if (budgetToDeleteId === null) return;
		const budgetId = budgetToDeleteId;
		showDeleteDialog = false;
		budgetToDeleteId = null;

		const deleteFormData = new FormData();
		deleteFormData.append('id', String(budgetId));

		const budgetName = budgets.find((b: any) => b.id === budgetId)?.project_name ?? 'Budget';

		await bufferedMutation({
			label: `Delete Budget #${budgetId}`,
			collection: 'budgets',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteBudget(budgetId);
			},
			serverAction: async () => {
				const response = await fetch('?/delete', { method: 'POST', body: deleteFormData });
				if (!response.ok) throw new Error('Server rejected delete');
				return response;
			},
			onSuccess: async () => {
				toast.success(`${budgetName} deleted`);
			}
		});
	}

	// Refresh data
	async function refreshData() {
		const { resyncCollection } = await import('$lib/db/replication');
		await Promise.all([resyncCollection('budgets'), resyncCollection('properties')]);
		toast.success('Data refreshed');
	}
</script>

<div class="container mx-auto py-8 px-4">
	<SyncErrorBanner collections={['budgets', 'properties']} />
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b pb-4 gap-3">
		<div>
			<h1 class="text-2xl sm:text-3xl font-bold text-foreground">Budget Planner</h1>
			<p class="text-muted-foreground mt-1">Manage and track your property renovation budgets</p>
		</div>
		<div class="flex items-center gap-2">
			<Button onclick={refreshData} variant="outline" size="sm" class="flex items-center gap-1 min-h-[44px]">
				<RefreshCw class="h-4 w-4" />
				Refresh
			</Button>
			<Button onclick={handleAddBudget} variant="default" size="sm" class="flex items-center gap-1 min-h-[44px]" disabled={isSubmitting}>
				{#if isSubmitting}
					<Loader2 class="h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Plus class="h-4 w-4" />
					Add Project
				{/if}
			</Button>
		</div>
	</div>

	<!-- Search -->
	<div class="relative max-w-md mb-6">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			type="text"
			placeholder="Search budgets..."
			class="pl-9 min-h-[44px]"
			value={searchInput}
			oninput={handleSearchInput}
		/>
	</div>

	<!-- Compact Statistics Summary -->
	<Card class="bg-white shadow-md border border-border rounded-lg overflow-hidden mb-8">
		<div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
			<!-- Total Budget Column -->
			<div class="p-4 flex items-center flex-1">
				<div class="rounded-full bg-emerald-100 p-2 mr-3 flex-shrink-0">
					<DollarSign class="h-5 w-5 text-emerald-600" />
				</div>
				<div>
					<div class="text-sm font-medium text-muted-foreground mb-0.5">Total Budget</div>
					<div class="text-xl font-bold tabular-nums">{formatCurrency(statistics.totalPlannedBudget)}</div>
				</div>
			</div>

			<!-- Budget Distribution Column -->
			<div class="p-4 flex-1">
				<div class="flex justify-between items-center mb-1">
					<div class="flex items-center">
						<PieChart class="h-4 w-4 text-blue-600 mr-1.5" />
						<span class="text-sm font-medium text-muted-foreground">Distribution</span>
					</div>
					{#if statistics.totalPlannedBudget > 0}
						{@const allocatedPercentage = Math.min(
							Math.round(
								(statistics.totalAllocatedBudget / statistics.totalPlannedBudget) * 100
							),
							100
						)}
						<span class="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
							{allocatedPercentage}% Used
						</span>
					{/if}
				</div>

				{#if statistics.totalPlannedBudget > 0}
					{@const allocatedPercentage = Math.min(
						Math.round(
							(statistics.totalAllocatedBudget / statistics.totalPlannedBudget) * 100
						),
						100
					)}
					<Progress
						value={allocatedPercentage}
						class={cn(
							'h-1.5 mb-1.5',
							allocatedPercentage < 85
								? 'bg-green-100'
								: allocatedPercentage >= 85 && allocatedPercentage < 100
									? 'bg-yellow-100'
									: 'bg-red-100'
						)}
					/>

					<div class="flex justify-between items-center text-xs tabular-nums">
						<span>{formatCurrency(statistics.totalAllocatedBudget)}</span>
						<span
							class={cn(
								'font-medium',
								statistics.totalRemainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
							)}
						>
							{statistics.totalRemainingBudget >= 0
								? formatCurrency(statistics.totalRemainingBudget) + ' left'
								: 'Over by ' + formatCurrency(Math.abs(statistics.totalRemainingBudget))}
						</span>
					</div>
				{:else}
					<div class="text-xs text-muted-foreground">No planned budget</div>
				{/if}
			</div>

			<!-- Project Status Column -->
			<div class="p-4 flex-1">
				<div class="flex items-center mb-1.5">
					<CalendarRange class="h-4 w-4 text-purple-600 mr-1.5" />
					<span class="text-sm font-medium text-muted-foreground">Project Status</span>
				</div>

				<div class="flex gap-3 mb-1.5">
					<div class="flex items-center">
						<span class="h-5 w-5 rounded-full bg-green-100 mr-1.5 flex items-center justify-center">
							<CheckCircle class="h-3 w-3 text-green-600" />
						</span>
						<span class="text-sm font-semibold tabular-nums">{statistics.completedProjects}</span>
					</div>
					<div class="flex items-center">
						<span
							class="h-5 w-5 rounded-full bg-yellow-100 mr-1.5 flex items-center justify-center"
						>
							<Clock class="h-3 w-3 text-yellow-600" />
						</span>
						<span class="text-sm font-semibold tabular-nums">{statistics.ongoingProjects}</span>
					</div>
				</div>

				{#if statistics.completedProjects + statistics.ongoingProjects > 0}
					{@const completionPercentage = Math.round(
						(statistics.completedProjects /
							(statistics.completedProjects + statistics.ongoingProjects)) *
							100
					)}
					<div class="flex items-center gap-2">
						<Progress value={completionPercentage} class="h-1.5 flex-1" />
						<span class="text-xs text-muted-foreground">{completionPercentage}%</span>
					</div>
				{:else}
					<div class="text-xs text-muted-foreground">No active projects</div>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Hidden form for submitting budget data -->
	<form id="budget-form" method="POST" action="?/upsert" use:enhance>
		<input type="hidden" name="id" value={$form.id} />
		<input type="hidden" name="_updated_at" value={editUpdatedAt ?? ''} />
		<input type="hidden" name="property_id" value={$form.property_id} />
		<input type="hidden" name="project_name" value={$form.project_name} />
		<input type="hidden" name="project_description" value={$form.project_description} />
		<input type="hidden" name="project_category" value={$form.project_category} />
		<input type="hidden" name="planned_amount" value={$form.planned_amount} />
		<input type="hidden" name="pending_amount" value={$form.pending_amount} />
		<input type="hidden" name="actual_amount" value={$form.actual_amount} />
		<input
			type="hidden"
			name="budget_items"
			value={JSON.stringify(sanitizeBudgetItems($form.budget_items || []))}
		/>
		<input type="hidden" name="status" value={$form.status} />
		<input type="hidden" name="start_date" value={$form.start_date} />
		<input type="hidden" name="end_date" value={$form.end_date} />
		<button id="submit-budget-form" type="submit" class="hidden" aria-label="Submit budget form"
		></button>
	</form>

	<!-- Projects List -->
	<div class="mb-6">
		{#if isLoading}
			<div class="bg-white rounded-lg shadow-sm p-8 text-center border">
				<RefreshCw class="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
				<h3 class="mt-2 text-lg font-medium text-foreground">Loading budgets...</h3>
			</div>
		{:else if budgets.length === 0}
			<div class="bg-white rounded-lg shadow-sm p-8 text-center border">
				<DollarSign class="h-12 w-12 mx-auto text-muted-foreground" />
				<h3 class="mt-2 text-lg font-medium text-foreground">No budget projects</h3>
				<p class="mt-1 text-sm text-muted-foreground">Get started by creating your first budget project.</p>
				<div class="mt-6">
					<Button onclick={handleAddBudget} class="flex items-center gap-1 mx-auto">
						<Plus class="h-4 w-4" />
						Add Project
					</Button>
				</div>
			</div>
		{:else if filteredBudgets.length === 0}
			<div class="bg-white rounded-lg shadow-sm p-8 text-center border">
				<Search class="h-12 w-12 mx-auto text-muted-foreground" />
				<h3 class="mt-2 text-lg font-medium text-foreground">No matching budgets</h3>
				<p class="mt-1 text-sm text-muted-foreground">Try adjusting your search terms.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6">
				{#each pagedBudgets as budget (budget.id)}
					<BudgetProjectCard
						{budget}
						{formatCurrency}
						onEdit={() => handleEditBudget(budget)}
						onDelete={() => handleDeleteBudget(budget.id)}
						onAddItem={() => handleAddItem(budget.id)}
					/>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between mt-6">
					<span class="text-sm text-muted-foreground tabular-nums">
						{filteredBudgets.length} budget{filteredBudgets.length !== 1 ? 's' : ''} · Page {currentPage} of {totalPages}
					</span>
					<div class="flex gap-2">
						<Button variant="outline" size="sm" class="min-h-[44px]" disabled={currentPage <= 1} onclick={() => currentPage--}>Previous</Button>
						<Button variant="outline" size="sm" class="min-h-[44px]" disabled={currentPage >= totalPages} onclick={() => currentPage++}>Next</Button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Budget Form Modal -->
{#if showBudgetFormModal}
	<BudgetFormModal
		budget={selectedBudget}
		{properties}
		editMode={editingBudget}
		on:close={() => (showBudgetFormModal = false)}
		on:submit={handleBudgetSubmit}
	/>
{/if}

<!-- Budget Item Form Modal -->
{#if showItemFormModal}
	<BudgetItemFormModal
		item={selectedBudgetItem}
		editMode={false}
		on:close={() => (showItemFormModal = false)}
		on:submit={handleItemSubmit}
	/>
{/if}

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Budget</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete this budget? It will be archived and removed from your active list.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; budgetToDeleteId = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteBudget} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
