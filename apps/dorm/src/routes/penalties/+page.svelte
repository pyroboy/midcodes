<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { invalidate } from '$app/navigation';
	import { updatePenaltySchema } from './formSchema';
	import type { PenaltyBilling, PenaltyFilter } from './types';
	import type { AnyZodObject } from 'zod';
	import type { PageData } from './$types';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	// UI Components
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
		CardFooter
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import {
		AlertTriangle,
		DollarSign,
		Clock,
		Search,
		LayoutGrid,
		List,
		Settings,
		Filter,
		RefreshCw
	} from 'lucide-svelte';

	// Custom components
	import PenaltyTable from './PenaltyTable.svelte';
	import PenaltyCard from './PenaltyCard.svelte';
	import PenaltyModal from './PenaltyModal.svelte';
	import PenaltyRulesModal from './PenaltyRulesModal.svelte';
	import PenaltySkeleton from './PenaltySkeleton.svelte';

	// Utilities
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props<{ data: PageData }>();
	let penaltyBillings = $state<PenaltyBilling[]>(data.penaltyBillings);
	let selectedPenalty: PenaltyBilling | undefined = $state();
	let showPenaltyDetails = $state(false);
	let showPenaltyModal = $state(false);
	let isFilterOpen = $state(false); // Changed to false by default for cleaner UI
	let showRulesModal = $state(false);
	let isLoading = $state(data.lazy === true); // Loading state for skeletons
	let viewMode = $state<'card' | 'list'>('list'); // Toggle between card and list view
	let activeFilter = $state<'all' | 'pending' | 'overdue' | 'penalized'>('all'); // Filter for stats

	// Load data lazily on mount
	onMount(async () => {
		if (data.lazy && data.penaltyBillingsPromise) {
			try {
				const loadedBillings = await data.penaltyBillingsPromise;
				penaltyBillings = loadedBillings;
				isLoading = false;
			} catch (error) {
				console.error('Error loading penalty data:', error);
				toast.error('Failed to load penalty data');
				isLoading = false;
			}
		}
	});

	// Update local state when data changes (after invalidateAll())
	$effect(() => {
		if (!isLoading && !data.lazy) {
			penaltyBillings = data.penaltyBillings;
		}
	});

	// Filter state
	let filter: PenaltyFilter = $state({
		dateRange: {
			start: '',
			end: ''
		},
		status: null,
		searchTerm: ''
	});

	let fromDate = $state('');
	let toDate = $state('');
	let statusFilter = $state('');
	let searchTerm = $state('');

	// Status options for the select
	const statusOptions = [
		{ value: '', label: 'All Statuses' },
		{ value: 'PENDING', label: 'Pending' },
		{ value: 'PARTIAL', label: 'Partial' },
		{ value: 'PAID', label: 'Paid' },
		{ value: 'OVERDUE', label: 'Overdue' },
		{ value: 'PENALIZED', label: 'Penalized' }
	];

	// Calculate statistics
	let totalPenaltyAmount = $derived(
		penaltyBillings.reduce((sum, billing) => sum + billing.penalty_amount, 0)
	);

	let overdueCount = $derived(
		penaltyBillings.filter(
			(billing) => new Date(billing.due_date) < new Date() && billing.balance > 0
		).length
	);

	let pendingCount = $derived(
		penaltyBillings.filter((billing) => billing.status === 'PENDING').length
	);

	let penalizedCount = $derived(
		penaltyBillings.filter((billing) => billing.penalty_amount > 0).length
	);

	// Filtered billings based on active filter and search
	let filteredBillings = $derived.by(() => {
		return penaltyBillings.filter((billing: PenaltyBilling) => {
			const searchMatch =
				!searchTerm ||
				billing.lease?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				billing.lease?.lease_tenants?.some((lt) =>
					lt.tenants?.name?.toLowerCase().includes(searchTerm.toLowerCase())
				) ||
				billing.lease?.rental_unit?.name?.toLowerCase().includes(searchTerm.toLowerCase());

			const statusMatch = !statusFilter || billing.status === statusFilter;

			// Apply activeFilter
			let filterMatch = true;
			if (activeFilter === 'pending') {
				filterMatch = billing.status === 'PENDING';
			} else if (activeFilter === 'overdue') {
				filterMatch = new Date(billing.due_date) < new Date() && billing.balance > 0;
			} else if (activeFilter === 'penalized') {
				filterMatch = billing.penalty_amount > 0;
			}

			return searchMatch && statusMatch && filterMatch;
		});
	});

	const { form, enhance, errors, constraints, submitting, reset } = superForm(data.form, {
		id: 'penalty-form',
		validators: zodClient(updatePenaltySchema as AnyZodObject),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onError: ({ result }) => {
			toast.error('Update Failed', {
				description: result.error.message || 'An unexpected error occurred.'
			});
		},
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				toast.success('Penalty Updated', {
					description: `The penalty for ${selectedPenalty?.lease?.name} has been successfully updated.`
				});
				await invalidate('app:penalties');
				reset();
			}
			if (result.type === 'failure') {
				toast.error('Update Failed', {
					description: result.data?.message || 'A validation error occurred.'
				});
			}
		}
	});

	function handlePenaltyClick(penalty: PenaltyBilling) {
		selectedPenalty = penalty;
		showPenaltyDetails = true;
	}

	function handleUpdatePenalty(penalty: PenaltyBilling) {
		selectedPenalty = penalty;
		if (selectedPenalty) {
			form.update(($form) => {
				$form.id = selectedPenalty!.id;
				$form.penalty_amount = selectedPenalty!.penalty_amount;
				$form.notes = selectedPenalty!.notes;
				return $form;
			});
		}
		showPenaltyModal = true;
	}

	function handleCloseDetails() {
		showPenaltyDetails = false;
		selectedPenalty = undefined;
	}

	function toggleFilter() {
		isFilterOpen = !isFilterOpen;
	}

	function handleStatusChange(value: string) {
		statusFilter = value;
	}

	function applyFilter() {
		filter = {
			dateRange: {
				start: fromDate,
				end: toDate
			},
			status: (statusFilter as any) || null,
			searchTerm: searchTerm
		};

		// In a real implementation, you'd fetch from server with these filters
		// For now, we'll simulate filtering client-side

		// This will trigger a notification to the user that filtering is working
		const successMessage = document.getElementById('filter-success');
		if (successMessage) {
			successMessage.classList.remove('hidden');
			setTimeout(() => {
				successMessage.classList.add('hidden');
			}, 3000);
		}
	}

	function resetFilter() {
		fromDate = '';
		toDate = '';
		statusFilter = '';
		searchTerm = '';
		filter = {};

		// This would typically refresh all data from the server
		// For now, just show the success message
		const successMessage = document.getElementById('filter-success');
		if (successMessage) {
			successMessage.classList.remove('hidden');
			setTimeout(() => {
				successMessage.classList.add('hidden');
			}, 3000);
		}
	}

	function handleSaveRules(rules: any) {
		// Here you would typically save the rules to your backend
		showRulesModal = false;

		// For demo purposes, show a success message
		toast.success('Penalty Rules Saved', {
			description: 'Penalty rules have been saved successfully.'
		});
	}

	function handleFilterClick(filter: 'all' | 'pending' | 'overdue' | 'penalized') {
		activeFilter = filter;
		// Clear the select dropdown when using the mini stats filters
		if (filter !== 'all') {
			statusFilter = '';
		}
	}

	async function handleRefresh() {
		isLoading = true;
		try {
			await invalidate('app:penalties');
			toast.success('Data Refreshed', {
				description: 'Penalty data has been refreshed successfully.'
			});
		} catch (error) {
			toast.error('Refresh Failed', {
				description: 'Failed to refresh penalty data.'
			});
		} finally {
			isLoading = false;
		}
	}
</script>

<!-- Modern Penalties Page -->
<div class="min-h-screen bg-gray-50/50">
	<!-- Modern Header -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 py-6">
			<div class="flex flex-col gap-4">
				<!-- Breadcrumb -->
				<nav class="flex items-center text-sm text-muted-foreground">
					<a
						href="/"
						class="hover:text-foreground transition-colors"
						data-sveltekit-preload-data="hover"
					>
						Dashboard
					</a>
					<span class="mx-2">/</span>
					<span class="text-foreground font-medium">Penalties</span>
				</nav>

				<!-- Header with Actions -->
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 class="text-3xl font-bold tracking-tight">Penalty Management</h1>
						<p class="text-muted-foreground mt-1">
							Track and manage billing penalties across all properties
						</p>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm" onclick={handleRefresh} disabled={isLoading}>
							<RefreshCw class="w-4 h-4 mr-2 {isLoading ? 'animate-spin' : ''}" />
							Refresh
						</Button>
						<Button variant="outline" size="sm" onclick={toggleFilter}>
							<Filter class="w-4 h-4 mr-2" />
							{isFilterOpen ? 'Hide Filters' : 'Filters'}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => (viewMode = viewMode === 'list' ? 'card' : 'list')}
						>
							{#if viewMode === 'list'}
								<LayoutGrid class="w-4 h-4 mr-2" />
								Card View
							{:else}
								<List class="w-4 h-4 mr-2" />
								List View
							{/if}
						</Button>
						<Button variant="outline" size="sm" onclick={() => (showRulesModal = true)}>
							<Settings class="w-4 h-4 mr-2" />
							Rules
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
		{#if isLoading}
			<!-- Skeleton Loading -->
			<PenaltySkeleton />
		{:else}
			<!-- Interactive Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<!-- Total Penalties -->
				<Card
					class="cursor-pointer transition-all hover:shadow-md {activeFilter === 'all'
						? 'ring-2 ring-primary'
						: ''}"
					onclick={() => handleFilterClick('all')}
				>
					<CardContent class="p-6">
						<div class="flex items-center space-x-2">
							<DollarSign class="w-8 h-8 text-emerald-600" />
							<div>
								<p class="text-sm font-medium text-muted-foreground">Total Penalties</p>
								<p class="text-2xl font-bold">{formatCurrency(totalPenaltyAmount)}</p>
								<p class="text-xs text-muted-foreground">{penaltyBillings.length} billings</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Overdue Billings -->
				<Card
					class="cursor-pointer transition-all hover:shadow-md {activeFilter === 'overdue'
						? 'ring-2 ring-destructive'
						: ''}"
					onclick={() => handleFilterClick('overdue')}
				>
					<CardContent class="p-6">
						<div class="flex items-center space-x-2">
							<AlertTriangle class="w-8 h-8 text-red-600" />
							<div>
								<p class="text-sm font-medium text-muted-foreground">Overdue</p>
								<p class="text-2xl font-bold text-red-600">{overdueCount}</p>
								<p class="text-xs text-muted-foreground">requiring attention</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Pending Payments -->
				<Card
					class="cursor-pointer transition-all hover:shadow-md {activeFilter === 'pending'
						? 'ring-2 ring-orange-500'
						: ''}"
					onclick={() => handleFilterClick('pending')}
				>
					<CardContent class="p-6">
						<div class="flex items-center space-x-2">
							<Clock class="w-8 h-8 text-orange-600" />
							<div>
								<p class="text-sm font-medium text-muted-foreground">Pending</p>
								<p class="text-2xl font-bold text-orange-600">{pendingCount}</p>
								<p class="text-xs text-muted-foreground">awaiting payment</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Penalized Billings -->
				<Card
					class="cursor-pointer transition-all hover:shadow-md {activeFilter === 'penalized'
						? 'ring-2 ring-yellow-500'
						: ''}"
					onclick={() => handleFilterClick('penalized')}
				>
					<CardContent class="p-6">
						<div class="flex items-center space-x-2">
							<DollarSign class="w-8 h-8 text-yellow-600" />
							<div>
								<p class="text-sm font-medium text-muted-foreground">With Penalties</p>
								<p class="text-2xl font-bold text-yellow-600">{penalizedCount}</p>
								<p class="text-xs text-muted-foreground">have penalties</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Enhanced Search and Filters -->
			{#if isFilterOpen}
				<Card>
					<CardContent class="pt-6">
						<div class="flex flex-col gap-4">
							<!-- Search Bar -->
							<div class="relative">
								<Search
									class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									placeholder="Search by lease name, tenant, or unit..."
									class="pl-10"
									bind:value={searchTerm}
								/>
							</div>

							<!-- Filter Controls -->
							<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div>
									<Label for="date-from" class="text-sm font-medium">From Date</Label>
									<Input id="date-from" type="date" bind:value={fromDate} />
								</div>

								<div>
									<Label for="date-to" class="text-sm font-medium">To Date</Label>
									<Input id="date-to" type="date" bind:value={toDate} />
								</div>

								<div>
									<Label for="status" class="text-sm font-medium">Status</Label>
									<Select.Root
										type="single"
										value={statusFilter}
										onValueChange={handleStatusChange}
										items={statusOptions}
									>
										<Select.Trigger>
											{#snippet children()}
												{statusOptions.find((option) => option.value === statusFilter)?.label ||
													'All Statuses'}
											{/snippet}
										</Select.Trigger>
										<Select.Content>
											{#snippet children()}
												<Select.Group>
													{#each statusOptions as option}
														<Select.Item value={option.value}>
															{#snippet children()}
																{option.label}
															{/snippet}
														</Select.Item>
													{/each}
												</Select.Group>
											{/snippet}
										</Select.Content>
									</Select.Root>
								</div>

								<div class="flex items-end gap-2">
									<Button variant="default" onclick={applyFilter} class="flex-1">
										Apply Filters
									</Button>
									<Button variant="outline" onclick={resetFilter}>Reset</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Main Content Area -->
			{#if showPenaltyDetails && selectedPenalty}
				<!-- Detail View -->
				<Card>
					<CardContent class="p-0">
						<PenaltyCard
							penalty={selectedPenalty}
							onClose={handleCloseDetails}
							onUpdate={handleUpdatePenalty}
						/>
					</CardContent>
				</Card>
			{:else}
				<!-- List/Card View Toggle -->
				<Card>
					<CardHeader class="pb-4">
						<div class="flex items-center justify-between">
							<div>
								<CardTitle class="text-xl">
									{activeFilter === 'all'
										? 'All Penalties'
										: activeFilter === 'pending'
											? 'Pending Penalties'
											: activeFilter === 'overdue'
												? 'Overdue Penalties'
												: activeFilter === 'penalized'
													? 'Penalized Billings'
													: 'Penalties'}
								</CardTitle>
								<CardDescription>
									{filteredBillings.length} of {penaltyBillings.length} penalties shown
								</CardDescription>
							</div>
							<Badge variant="secondary" class="px-3 py-1">
								{filteredBillings.length} records
							</Badge>
						</div>
					</CardHeader>
					<CardContent class="p-0">
						{#if viewMode === 'list'}
							<!-- Table View -->
							<div class="overflow-x-auto">
								<PenaltyTable penalties={filteredBillings} onPenaltyClick={handlePenaltyClick} />
							</div>
						{:else}
							<!-- Card Grid View -->
							<div class="p-6">
								{#if filteredBillings.length === 0}
									<div class="text-center py-12">
										<AlertTriangle class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
										<h3 class="text-lg font-semibold mb-2">No penalties found</h3>
										<p class="text-muted-foreground">
											{activeFilter === 'all'
												? 'No penalty records available.'
												: `No ${activeFilter} penalty records found.`}
										</p>
									</div>
								{:else}
									<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{#each filteredBillings as penalty (penalty.id)}
											<Card
												class="cursor-pointer hover:shadow-md transition-all"
												onclick={() => handlePenaltyClick(penalty)}
											>
												<CardContent class="p-4">
													<div class="space-y-3">
														<div class="flex items-start justify-between">
															<div class="min-w-0 flex-1">
																<p class="text-sm font-medium truncate">
																	{penalty.lease?.name || 'Unknown Lease'}
																</p>
																<p class="text-xs text-muted-foreground">
																	{penalty.lease?.rental_unit?.name || 'No Unit'}
																</p>
															</div>
															<Badge
																variant={penalty.status === 'PENDING'
																	? 'default'
																	: penalty.status === 'OVERDUE'
																		? 'destructive'
																		: penalty.status === 'PAID'
																			? 'secondary'
																			: 'outline'}
																class="text-xs"
															>
																{penalty.status}
															</Badge>
														</div>

														<div class="space-y-1">
															<div class="flex justify-between text-sm">
																<span>Balance:</span>
																<span class="font-medium">{formatCurrency(penalty.balance)}</span>
															</div>
															<div class="flex justify-between text-sm">
																<span>Penalty:</span>
																<span class="font-medium text-red-600">
																	{formatCurrency(penalty.penalty_amount)}
																</span>
															</div>
														</div>

														<div class="text-xs text-muted-foreground">
															Due: {new Date(penalty.due_date).toLocaleDateString()}
														</div>
													</div>
												</CardContent>
											</Card>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}
		{/if}
	</div>
</div>

<!-- Modals -->
{#if showPenaltyModal && selectedPenalty}
	<PenaltyModal
		penalty={selectedPenalty}
		open={showPenaltyModal}
		onOpenChange={(open: boolean) => (showPenaltyModal = open)}
		bind:form={$form}
		{enhance}
		{errors}
		submitting={$submitting}
	/>
{/if}

<PenaltyRulesModal
	open={showRulesModal}
	onOpenChange={(open: boolean) => (showRulesModal = open)}
	onSave={handleSaveRules}
/>
