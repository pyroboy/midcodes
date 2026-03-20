<script lang="ts">
	import TenantFormModal from './TenantFormModal.svelte';
	import TenantCard from './TenantCard.svelte';
	import TenantTable from './TenantTable.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Plus,
		Users,
		UserCheck,
		UserX,
		AlertTriangle,
		Search,
		LayoutGrid,
		List,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';
	import type { TenantResponse } from '$lib/types/tenant';
	import { defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { tenantFormSchema } from './formSchema';

	import { Input } from '$lib/components/ui/input';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import {
		tenantsStore,
		leaseTenantsStore,
		leasesStore,
		rentalUnitsStore,
		propertiesStore
	} from '$lib/stores/collections.svelte';
	import { optimisticUpsertTenant, optimisticDeleteTenant } from '$lib/db/optimistic';
	import { bufferedMutation } from '$lib/db/optimistic-utils';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Enrich tenants with lease relationships using Map lookups (O(1) per join)
	let tenants = $derived.by(() => {
		// Build lookup maps once — O(n) total instead of O(n*m) per tenant
		const leaseMap = new Map<string, any>();
		for (const l of leasesStore.value) leaseMap.set(String(l.id), l);

		const unitMap = new Map<string, any>();
		for (const u of rentalUnitsStore.value) unitMap.set(String(u.id), u);

		const propMap = new Map<string, any>();
		for (const p of propertiesStore.value) propMap.set(String(p.id), p);

		// Group lease_tenants by tenant_id
		const ltByTenant = new Map<string, any[]>();
		for (const lt of leaseTenantsStore.value) {
			const tid = String(lt.tenant_id);
			const arr = ltByTenant.get(tid);
			if (arr) arr.push(lt);
			else ltByTenant.set(tid, [lt]);
		}

		return [...tenantsStore.value].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((t: any) => {
			const ltDocs = ltByTenant.get(String(t.id)) || [];
			const tenantLeases: any[] = [];
			for (const lt of ltDocs) {
				const lease = leaseMap.get(String(lt.lease_id));
				if (!lease) continue;
				const unit = unitMap.get(String(lease.rental_unit_id));
				const property = unit ? propMap.get(String(unit.property_id)) : null;
				tenantLeases.push({
					id: Number(lease.id),
					name: lease.name,
					start_date: lease.start_date,
					end_date: lease.end_date,
					status: lease.status,
					rental_unit: unit
						? {
								id: unit.id,
								name: unit.name,
								number: unit.number,
								property: property ? { id: property.id, name: property.name } : null
							}
						: null
				});
			}
			const primaryLease = tenantLeases.find((l: any) => l.status === 'ACTIVE') ?? tenantLeases[0] ?? null;
			return {
				...t,
				id: Number(t.id),
				leases: tenantLeases,
				lease: primaryLease
			} as TenantResponse;
		});
	});

	let isLoading = $derived(!tenantsStore.initialized);

	let showModal = $state(false);
	let selectedTenant: TenantResponse | undefined = $state();
	let editMode = $state(false);
	let searchTerm = $state('');
	let debouncedSearch = $state('');
	let selectedStatus = $state('');
	let viewMode = $state<'card' | 'list'>(
		typeof window !== 'undefined'
			? ((localStorage.getItem('tenants-view-mode') as 'card' | 'list') ?? 'card')
			: 'card'
	);
	// Read initial filter from URL params for persistence
	const initialFilter = $page.url.searchParams.get('filter') as 'all' | 'active' | 'inactive' | 'pending' | 'blacklisted' | null;
	let activeFilter = $state<'all' | 'active' | 'inactive' | 'pending' | 'blacklisted'>(initialFilter ?? 'active');
	let currentPage = $state(1);
	const PAGE_SIZE = 24;

	// Debounce search input (300ms)
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const term = searchTerm;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => { debouncedSearch = term; }, 300);
		return () => clearTimeout(searchTimer);
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('tenants-view-mode', viewMode);
		}
	});

	$effect(() => {
		if (selectedStatus) {
			activeFilter = 'all';
		}
	});

	// Reset page when filters change
	$effect(() => {
		void debouncedSearch;
		void selectedStatus;
		void activeFilter;
		currentPage = 1;
	});

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let tenantToDelete = $state<TenantResponse | null>(null);

	// Single-pass: compute stats + filtered list together
	let { stats, filteredTenants } = $derived.by(() => {
		let active = 0, inactive = 0, pending = 0, blacklisted = 0;
		const searchLower = debouncedSearch.toLowerCase();
		const filterUpper = activeFilter !== 'all' ? activeFilter.toUpperCase() : '';
		const filtered: TenantResponse[] = [];

		for (const tenant of tenants) {
			// Count stats (always, regardless of filters)
			switch (tenant.tenant_status) {
				case 'ACTIVE': active++; break;
				case 'INACTIVE': inactive++; break;
				case 'PENDING': pending++; break;
				case 'BLACKLISTED': blacklisted++; break;
			}

			// Apply filters
			if (searchLower && !tenant.name.toLowerCase().includes(searchLower)) continue;
			if (selectedStatus && tenant.tenant_status !== selectedStatus) continue;
			if (filterUpper && tenant.tenant_status !== filterUpper) continue;

			filtered.push(tenant);
		}

		const total = tenants.length;
		return {
			stats: { total, active, inactive, pending, blacklisted },
			filteredTenants: filtered
		};
	});

	// Pagination
	let totalPages = $derived(Math.max(1, Math.ceil(filteredTenants.length / PAGE_SIZE)));
	let paginatedTenants = $derived(
		filteredTenants.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	function handleAddTenant() {
		selectedTenant = undefined;
		editMode = false;
		showModal = true;
	}

	function handleEdit(tenant: TenantResponse) {
		selectedTenant = tenant;
		editMode = true;
		showModal = true;
	}

	function handleFilterClick(filter: 'all' | 'active' | 'inactive' | 'pending' | 'blacklisted') {
		activeFilter = filter;
		selectedStatus = '';
		// Persist filter to URL for back-button support and bookmarking
		const url = new URL($page.url);
		if (filter === 'active') {
			url.searchParams.delete('filter');
		} else {
			url.searchParams.set('filter', filter);
		}
		goto(url.toString(), { replaceState: true, keepFocus: true });
	}

	// Called by TenantFormModal after successful create/update.
	// Optimistic write already happened in the modal — this is a no-op now.
	function updateTenantInState(_updatedTenant: TenantResponse) {
		// Optimistic upsert already fired in TenantFormModal
	}

	function handleDeleteTenant(tenant: TenantResponse) {
		tenantToDelete = tenant;
		showDeleteDialog = true;
	}

	async function confirmDeleteTenant() {
		if (!tenantToDelete) return;
		const tenant = tenantToDelete;
		showDeleteDialog = false;
		tenantToDelete = null;

		const formData = new FormData();
		formData.append('id', String(tenant.id));
		formData.append('reason', 'User initiated deletion');

		await bufferedMutation({
			label: `Delete Tenant: ${tenant.name}`,
			collection: 'tenants',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteTenant(tenant.id);
			},
			serverAction: async () => {
				const result = await fetch('?/delete', {
					method: 'POST',
					body: formData
				});
				if (!result.ok) {
					const response = await result.json();
					throw new Error(response.error || response.message || 'Failed to delete tenant');
				}
				return result;
			},
			onSuccess: async () => {
				toast.success(`Tenant "${tenant.name}" has been archived.`);
			}
		});
	}

	function handleModalClose(open: boolean) {
		showModal = open;
		if (!open) {
			selectedTenant = undefined;
			editMode = false;
		}
	}
</script>

<div class="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
		<SyncErrorBanner collections={['tenants', 'leases', 'lease_tenants']} />
	</div>
	<!-- Header Section with Integrated Stats -->
	<div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
			<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div class="flex items-center gap-4">
					<div>
						<h1
							class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
						>
							Tenants Dashboard
						</h1>
						<p class="text-slate-600 text-sm mt-1">Manage tenant information and contact details</p>
					</div>
				</div>

				<!-- Enhanced Stats Overview - Now Clickable -->
				<div class="flex items-center gap-3 text-xs sm:text-sm overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
					<button
						onclick={() => handleFilterClick('active')}
						aria-pressed={activeFilter === 'active'}
						class="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 {activeFilter ===
						'active'
							? 'bg-green-100 ring-2 ring-green-500'
							: 'bg-green-50 hover:bg-green-100'} {stats.active === 0 && activeFilter !== 'active' ? 'opacity-50' : ''}"
					>
						{#if isLoading}
							<Skeleton class="h-4 w-6" />
						{:else}
							<span class="text-green-600 font-medium">{stats.active}</span>
						{/if}
						<span class="text-slate-600">Active</span>
					</button>

					<button
						onclick={() => handleFilterClick('all')}
						aria-pressed={activeFilter === 'all'}
						class="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {activeFilter ===
						'all'
							? 'bg-blue-100 ring-2 ring-blue-500'
							: 'bg-blue-50 hover:bg-blue-100'} {stats.total === 0 && activeFilter !== 'all' ? 'opacity-50' : ''}"
					>
						{#if isLoading}
							<Skeleton class="h-4 w-6" />
						{:else}
							<span class="text-blue-600 font-medium">{stats.total}</span>
						{/if}
						<span class="text-slate-600">Total</span>
					</button>

					<button
						onclick={() => handleFilterClick('inactive')}
						aria-pressed={activeFilter === 'inactive'}
						class="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 {activeFilter ===
						'inactive'
							? 'bg-gray-100 ring-2 ring-gray-500'
							: 'bg-gray-50 hover:bg-gray-100'} {stats.inactive === 0 && activeFilter !== 'inactive' ? 'opacity-50' : ''}"
					>
						{#if isLoading}
							<Skeleton class="h-4 w-6" />
						{:else}
							<span class="text-gray-600 font-medium">{stats.inactive}</span>
						{/if}
						<span class="text-slate-600">Inactive</span>
					</button>

					<button
						onclick={() => handleFilterClick('pending')}
						aria-pressed={activeFilter === 'pending'}
						class="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 {activeFilter ===
						'pending'
							? 'bg-yellow-100 ring-2 ring-yellow-500'
							: 'bg-yellow-50 hover:bg-yellow-100'} {stats.pending === 0 && activeFilter !== 'pending' ? 'opacity-50' : ''}"
					>
						{#if isLoading}
							<Skeleton class="h-4 w-6" />
						{:else}
							<span class="text-yellow-600 font-medium">{stats.pending}</span>
						{/if}
						<span class="text-slate-600">Pending</span>
					</button>

					<button
						onclick={() => handleFilterClick('blacklisted')}
						aria-pressed={activeFilter === 'blacklisted'}
						class="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 {activeFilter ===
						'blacklisted'
							? 'bg-red-100 ring-2 ring-red-500'
							: 'bg-red-50 hover:bg-red-100'} {stats.blacklisted === 0 && activeFilter !== 'blacklisted' ? 'opacity-50' : ''}"
					>
						{#if isLoading}
							<Skeleton class="h-4 w-6" />
						{:else}
							<span class="text-red-600 font-medium">{stats.blacklisted}</span>
						{/if}
						<span class="text-slate-600">Blacklisted</span>
					</button>
				</div>

				<Button
					onclick={handleAddTenant}
					class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
				>
					<Plus class="w-4 h-4" />
					Add Tenant
				</Button>
			</div>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		<!-- Search and Filter Section -->
		<div
			class="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6"
		>
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="relative flex-1">
					<Search
						class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
					/>
					<Input
						placeholder="Search tenants by name..."
						bind:value={searchTerm}
						class="pl-10 w-full"
					/>
				</div>
				<div class="flex gap-2">
					<Select type="single" bind:value={selectedStatus}>
						<SelectTrigger class="w-[180px]">
							{selectedStatus
								? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).toLowerCase()
								: 'Filter by status'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Statuses</SelectItem>
							<SelectItem value="ACTIVE">Active</SelectItem>
							<SelectItem value="INACTIVE">Inactive</SelectItem>
							<SelectItem value="PENDING">Pending</SelectItem>
							<SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
						</SelectContent>
					</Select>

					<!-- View Toggle Buttons -->
					<div class="flex border border-slate-200 rounded-md bg-white">
						<Button
							variant={viewMode === 'card' ? 'default' : 'ghost'}
							size="sm"
							onclick={() => (viewMode = 'card')}
							class="rounded-r-none px-3"
						>
							<LayoutGrid class="w-4 h-4" />
						</Button>
						<Button
							variant={viewMode === 'list' ? 'default' : 'ghost'}
							size="sm"
							onclick={() => (viewMode = 'list')}
							class="rounded-l-none px-3 border-l border-slate-200"
						>
							<List class="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>

		<!-- Tenants List Section -->
		<div class="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
			<div class="p-6">
				<h2 class="text-lg font-semibold text-slate-800 mb-4">
					Tenant List {isLoading ? '' : `(${filteredTenants.length})`}
				</h2>

				{#if isLoading}
					<!-- Skeleton tenant cards -->
					<div class="space-y-2">
						{#each Array(5) as _, i (i)}
							<div class="border border-slate-200 rounded-lg p-4">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3 flex-1">
										<Skeleton class="w-10 h-10 rounded-full" />
										<div class="space-y-2">
											<Skeleton class="h-4 w-32" />
											<Skeleton class="h-3 w-48" />
										</div>
									</div>
									<div class="flex items-center gap-2">
										<Skeleton class="h-6 w-16 rounded-full" />
										<Skeleton class="h-9 w-9 rounded-md" />
										<Skeleton class="h-9 w-9 rounded-md" />
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else if filteredTenants.length === 0}
					<div class="flex flex-col items-center justify-center py-16 px-4">
						{#if searchTerm || selectedStatus || activeFilter !== 'all'}
							<UserX class="w-12 h-12 mb-4 text-muted-foreground" />
							<p class="text-muted-foreground text-lg font-medium">
								{#if debouncedSearch}
									No tenants found
								{:else if activeFilter !== 'all'}
									No {activeFilter} tenants
								{:else}
									No tenants found
								{/if}
							</p>
							<p class="text-muted-foreground/60 text-sm mt-2">
								Try adjusting your filters or search terms
							</p>
						{:else}
							<Users class="w-12 h-12 mb-4 text-muted-foreground" />
							<p class="text-muted-foreground text-lg font-medium">No tenants found</p>
							<p class="text-muted-foreground/60 text-sm mt-2">Get started by adding your first tenant</p>
							<Button onclick={handleAddTenant} class="mt-4">
								<Plus class="w-4 h-4 mr-2" />
								Add First Tenant
							</Button>
						{/if}
					</div>
				{:else if viewMode === 'card'}
					<!-- Card View (Grid) -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{#each paginatedTenants as tenant (tenant.id)}
							<TenantCard {tenant} onEdit={handleEdit} onDelete={handleDeleteTenant} />
						{/each}
					</div>
				{:else}
					<!-- List View (Table) -->
					<TenantTable
						tenants={paginatedTenants}
						onEdit={(tenant) => handleEdit(tenant)}
						onDelete={(tenant) => handleDeleteTenant(tenant)}
					/>
				{/if}

				<!-- Pagination Controls -->
				{#if totalPages > 1}
					<div class="flex items-center justify-between pt-6 border-t border-slate-200/60 mt-6">
						<p class="text-sm text-slate-500">
							Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTenants.length)} of {filteredTenants.length}
						</p>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage <= 1}
								onclick={() => currentPage--}
							>
								<ChevronLeft class="w-4 h-4" />
							</Button>
							{#each Array(totalPages) as _, i (i)}
								{#if totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1}
									<Button
										variant={currentPage === i + 1 ? 'default' : 'outline'}
										size="sm"
										onclick={() => currentPage = i + 1}
										class="w-9"
									>
										{i + 1}
									</Button>
								{:else if i === 1 && currentPage > 3}
									<span class="text-slate-400 px-1">...</span>
								{:else if i === totalPages - 2 && currentPage < totalPages - 2}
									<span class="text-slate-400 px-1">...</span>
								{/if}
							{/each}
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage >= totalPages}
								onclick={() => currentPage++}
							>
								<ChevronRight class="w-4 h-4" />
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Modal for Create/Edit -->
<TenantFormModal
	open={showModal}
	tenant={selectedTenant}
	{editMode}
	form={defaults(zod(tenantFormSchema))}
	onOpenChange={handleModalClose}
	onTenantUpdate={updateTenantInState}
/>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Archive Tenant</AlertDialog.Title>
			<AlertDialog.Description>
				{#if tenantToDelete}
					Are you sure you want to archive tenant "{tenantToDelete.name}"?

					{#if tenantToDelete.leases && tenantToDelete.leases.length > 0}
						{@const activeLeases = tenantToDelete.leases.filter(l => l.status === 'ACTIVE')}
						{#if activeLeases.length > 0}
							Warning: This tenant has {activeLeases.length} active lease{activeLeases.length > 1 ? 's' : ''} that will be preserved.
						{:else}
							Warning: This tenant has {tenantToDelete.leases.length} lease{tenantToDelete.leases.length > 1 ? 's' : ''} that will be preserved.
						{/if}
					{/if}

					This will archive the tenant (soft delete), preserve all lease and payment history, maintain audit compliance, and remove from active tenant list. This action cannot be undone.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; tenantToDelete = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteTenant}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
