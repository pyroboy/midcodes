<script lang="ts">
	import { browser } from '$app/environment';
	import { budgetSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { invalidate, invalidateAll } from '$app/navigation';
	import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import {
		DollarSign,
		CheckCircle,
		Clock,
		Plus,
		Edit,
		Trash2,
		RefreshCw,
		Info,
		CalendarRange
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Budget, BudgetWithStats, BudgetItem } from './types';
	import BudgetFormModal from './BudgetFormModal.svelte';
	import BudgetItemFormModal from './BudgetItemFormModal.svelte';
	import BudgetDistributionCard from './BudgetDistributionCard.svelte';
	import { cn } from '$lib/utils';
	import BudgetProjectCard from './BudgetProjectCard.svelte';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';

	import { ChartBar, PieChart, AlertTriangle } from 'lucide-svelte';
	// Page data using Svelte 5 $props rune
	let { data } = $props<{ data: PageData }>();

	// State management for modals and UI
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
	const { form, errors, enhance, constraints, submitting, reset } = superForm(data.form, {
		validators: zodClient(budgetSchema),
		resetForm: true,
		dataType: 'json',
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
	});

	// Format currency with Peso sign
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		}).format(amount);
	}

	// Get status badge color
	function getStatusColor(status: string): string {
		switch (status) {
			case 'PLANNED':
				return 'bg-blue-100 text-blue-800';
			case 'ONGOING':
				return 'bg-yellow-100 text-yellow-800';
			case 'COMPLETED':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Handle add budget
	function handleAddBudget() {
		selectedBudget = null;
		editingBudget = false;
		showBudgetFormModal = true;
	}

	// Handle edit budget
	function handleEditBudget(budget: BudgetWithStats) {
		selectedBudget = budget;
		editingBudget = true;
		showBudgetFormModal = true;
	}

	// Handle add item
	function handleAddItem(budgetId: number) {
		itemBudgetId = budgetId;
		selectedBudgetItem = null;
		showItemFormModal = true;
	}

	// Handle budget form submission
	function handleBudgetSubmit(event: CustomEvent<Budget>) {
		const budget = event.detail;

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

		// Find the budget
		const budget = data.budgets.find((b: Budget) => b.id === itemBudgetId);
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
	async function handleDeleteBudget(budgetId: number) {
		if (!confirm('Are you sure you want to delete this budget?')) {
			return;
		}

		try {
			const formData = new FormData();
			formData.append('id', budgetId.toString());

			const response = await fetch(`?/delete`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				toast.success('Budget deleted');
				invalidateAll();
			} else {
				toast.error('Error deleting budget');
			}
		} catch (error) {
			console.error('Error deleting budget', error);
			toast.error('Error deleting budget');
		}
	}

	// Refresh data
	async function refreshData() {
		await invalidate('budgets:refresh');
		toast.success('Data refreshed');
	}
</script>

<div class="container mx-auto py-8 px-4">
	<!-- Page Header -->
	<div class="flex justify-between items-center mb-8 border-b pb-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Budget Planner</h1>
			<p class="text-gray-600 mt-1">Manage and track your property renovation budgets</p>
		</div>
		<div class="flex items-center gap-2">
			<Button onclick={refreshData} variant="outline" size="sm" class="flex items-center gap-1">
				<RefreshCw class="h-4 w-4" />
				Refresh
			</Button>
			<Button onclick={handleAddBudget} variant="default" size="sm" class="flex items-center gap-1">
				<Plus class="h-4 w-4" />
				Add Project
			</Button>
		</div>
	</div>

	<!-- Compact Statistics Summary -->
	<Card class="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden mb-8">
		<div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
			<!-- Total Budget Column -->
			<div class="p-4 flex items-center flex-1">
				<div class="rounded-full bg-emerald-100 p-2 mr-3 flex-shrink-0">
					<DollarSign class="h-5 w-5 text-emerald-600" />
				</div>
				<div>
					<div class="text-sm font-medium text-gray-500 mb-0.5">Total Budget</div>
					<div class="text-xl font-bold">{formatCurrency(data.statistics.totalPlannedBudget)}</div>
				</div>
			</div>

			<!-- Budget Distribution Column -->
			<div class="p-4 flex-1">
				<div class="flex justify-between items-center mb-1">
					<div class="flex items-center">
						<PieChart class="h-4 w-4 text-blue-600 mr-1.5" />
						<span class="text-sm font-medium text-gray-500">Distribution</span>
					</div>
					{#if data.statistics.totalPlannedBudget > 0}
						{@const allocatedPercentage = Math.min(
							Math.round(
								(data.statistics.totalAllocatedBudget / data.statistics.totalPlannedBudget) * 100
							),
							100
						)}
						<span class="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
							{allocatedPercentage}% Used
						</span>
					{/if}
				</div>

				{#if data.statistics.totalPlannedBudget > 0}
					{@const allocatedPercentage = Math.min(
						Math.round(
							(data.statistics.totalAllocatedBudget / data.statistics.totalPlannedBudget) * 100
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

					<div class="flex justify-between items-center text-xs">
						<span>{formatCurrency(data.statistics.totalAllocatedBudget)}</span>
						<span
							class={cn(
								'font-medium',
								data.statistics.totalRemainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
							)}
						>
							{data.statistics.totalRemainingBudget >= 0
								? formatCurrency(data.statistics.totalRemainingBudget) + ' left'
								: 'Over by ' + formatCurrency(Math.abs(data.statistics.totalRemainingBudget))}
						</span>
					</div>
				{:else}
					<div class="text-xs text-gray-500">No planned budget</div>
				{/if}
			</div>

			<!-- Project Status Column -->
			<div class="p-4 flex-1">
				<div class="flex items-center mb-1.5">
					<CalendarRange class="h-4 w-4 text-purple-600 mr-1.5" />
					<span class="text-sm font-medium text-gray-500">Project Status</span>
				</div>

				<div class="flex gap-3 mb-1.5">
					<div class="flex items-center">
						<span class="h-5 w-5 rounded-full bg-green-100 mr-1.5 flex items-center justify-center">
							<CheckCircle class="h-3 w-3 text-green-600" />
						</span>
						<span class="text-sm font-semibold">{data.statistics.completedProjects}</span>
					</div>
					<div class="flex items-center">
						<span
							class="h-5 w-5 rounded-full bg-yellow-100 mr-1.5 flex items-center justify-center"
						>
							<Clock class="h-3 w-3 text-yellow-600" />
						</span>
						<span class="text-sm font-semibold">{data.statistics.ongoingProjects}</span>
					</div>
				</div>

				{#if data.statistics.completedProjects + data.statistics.ongoingProjects > 0}
					{@const completionPercentage = Math.round(
						(data.statistics.completedProjects /
							(data.statistics.completedProjects + data.statistics.ongoingProjects)) *
							100
					)}
					<div class="flex items-center gap-2">
						<Progress value={completionPercentage} class="h-1.5 flex-1" />
						<span class="text-xs text-gray-500">{completionPercentage}%</span>
					</div>
				{:else}
					<div class="text-xs text-gray-500">No active projects</div>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Hidden form for submitting budget data -->
	<form id="budget-form" method="POST" action="?/upsert" use:enhance>
		<input type="hidden" name="id" value={$form.id} />
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
		{#if data.budgets.length === 0}
			<div class="bg-white rounded-lg shadow-sm p-8 text-center border">
				<DollarSign class="h-12 w-12 mx-auto text-gray-400" />
				<h3 class="mt-2 text-lg font-medium text-gray-900">No budget projects</h3>
				<p class="mt-1 text-sm text-gray-500">Get started by creating your first budget project.</p>
				<div class="mt-6">
					<Button onclick={handleAddBudget} class="flex items-center gap-1 mx-auto">
						<Plus class="h-4 w-4" />
						Add Project
					</Button>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6">
				{#each data.budgets as budget (budget.id)}
					<BudgetProjectCard
						{budget}
						{formatCurrency}
						{getStatusColor}
						onEdit={() => handleEditBudget(budget)}
						onDelete={() => handleDeleteBudget(budget.id)}
						onAddItem={() => handleAddItem(budget.id)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Budget Form Modal -->
{#if showBudgetFormModal}
	<BudgetFormModal
		budget={selectedBudget}
		properties={data.properties}
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

{#if browser && import.meta.env.DEV}
	<SuperDebug data={$form} />
{/if}
