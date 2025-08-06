<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import TenantFormModal from './TenantFormModal.svelte';
  import TenantCard from './TenantCard.svelte';
  import TenantTable from './TenantTable.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus, Users, UserCheck, UserX, AlertTriangle, Search, LayoutGrid, List } from 'lucide-svelte';
  import type { TenantResponse } from '$lib/types/tenant';
  import type { PageData } from './$types';

  import { Input } from '$lib/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { toast } from 'svelte-sonner';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { onMount } from 'svelte';

  let { data } = $props<{ data: PageData }>();
  let tenants = $state<TenantResponse[]>(data.tenants);
  let properties = $state(data.properties);

  // Update local state when data changes (after invalidateAll())
  $effect(() => {
    // Always update when data changes, unless we're currently lazy loading
    if (!isLoading && !data.lazy) {
      tenants = data.tenants;
      properties = data.properties;
    }
  });
  let showModal = $state(false);
  let selectedTenant: TenantResponse | undefined = $state();
  let editMode = $state(false);
  let searchTerm = $state('');
  let selectedStatus = $state('');
  let isLoading = $state(data.lazy === true); // Loading state for skeletons
  let viewMode = $state<'card' | 'list'>('card'); // Toggle between card and list view

  // Load data lazily if needed
  onMount(async () => {
    if (data.lazy && data.tenantsPromise && data.propertiesPromise) {
      try {
        // Load data in background
        const [loadedTenants, loadedProperties] = await Promise.all([
          data.tenantsPromise,
          data.propertiesPromise
        ]);
        
        // Update state
        tenants = loadedTenants;
        properties = loadedProperties;
        isLoading = false;
      } catch (error) {
        console.error('Error loading tenant data:', error);
        toast.error('Failed to load tenant data');
        isLoading = false;
      }
    }
  });

  $effect(() => {
    if (!data.lazy) {
      tenants = data.tenants;
      properties = data.properties;
    }
  });

  // Filtered tenants
  let filteredTenants = $derived.by(() => {
    return tenants.filter((tenant: TenantResponse) => {
      const searchMatch = !searchTerm || tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = !selectedStatus || tenant.tenant_status === selectedStatus;
      return searchMatch && statusMatch;
    });
  });

  // Stats calculations
  let stats = $derived.by(() => {
    const total = tenants.length;
    const active = tenants.filter((t: TenantResponse) => t.tenant_status === 'ACTIVE').length;
    const pending = tenants.filter((t: TenantResponse) => t.tenant_status === 'PENDING').length;
    const blacklisted = tenants.filter((t: TenantResponse) => t.tenant_status === 'BLACKLISTED').length;
    
    return { total, active, pending, blacklisted };
  });

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

  // Function to update tenant in local state immediately
  function updateTenantInState(updatedTenant: TenantResponse) {
    const index = tenants.findIndex(t => t.id === updatedTenant.id);
    if (index !== -1) {
      tenants[index] = updatedTenant;
      tenants = [...tenants]; // Trigger reactivity
    }
  }

  async function handleDeleteTenant(tenant: TenantResponse) {
    // Enhanced confirmation dialog with detailed warning
    let confirmMessage = `Are you sure you want to archive tenant "${tenant.name}"?\n\n`;
    
    if (tenant.lease) {
      confirmMessage += `⚠️  WARNING: This tenant has an active lease that will be preserved.\n\n`;
    }
    
    confirmMessage += `This action will:\n`;
    confirmMessage += `• Archive the tenant (soft delete)\n`;
    confirmMessage += `• Preserve all lease and payment history\n`;
    confirmMessage += `• Maintain audit compliance\n`;
    confirmMessage += `• Remove from active tenant list\n\n`;
    confirmMessage += `This action cannot be undone. Continue?`;

    if (!confirm(confirmMessage)) return;

    const formData = new FormData();
    formData.append('id', String(tenant.id));
    formData.append('reason', 'User initiated deletion');
    
    try {
      const result = await fetch('?/delete', {
        method: 'POST',
        body: formData
      });
      const response = await result.json();

      if (result.ok) {
        tenants = tenants.filter((t: TenantResponse) => t.id !== tenant.id);
        await invalidateAll();
        toast.success(`Tenant "${tenant.name}" has been successfully archived. All data has been preserved for audit purposes.`);
      } else {
        console.error('Delete failed:', response);
        toast.error(response.error || response.message || 'Failed to delete tenant');
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
  <!-- Header Section with Integrated Stats -->
  <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div class="flex items-center gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Tenants Dashboard
            </h1>
            <p class="text-slate-600 text-sm mt-1">
              Manage tenant information and contact details
            </p>
          </div>
        </div>
        
        <!-- Minimized Stats Overview -->
        <div class="flex items-center gap-3 text-xs sm:text-sm">
          {#if isLoading}
            <!-- Skeleton stats -->
            <div class="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
              <Skeleton class="h-4 w-6" />
              <span class="text-slate-600">Total</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
              <Skeleton class="h-4 w-6" />
              <span class="text-slate-600">Active</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg">
              <Skeleton class="h-4 w-6" />
              <span class="text-slate-600">Pending</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg">
              <Skeleton class="h-4 w-6" />
              <span class="text-slate-600">Blacklisted</span>
            </div>
          {:else}
            <div class="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
              <span class="text-blue-600 font-medium">{stats.total}</span>
              <span class="text-slate-600">Total</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
              <span class="text-green-600 font-medium">{stats.active}</span>
              <span class="text-slate-600">Active</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg">
              <span class="text-yellow-600 font-medium">{stats.pending}</span>
              <span class="text-slate-600">Pending</span>
            </div>
            <div class="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg">
              <span class="text-red-600 font-medium">{stats.blacklisted}</span>
              <span class="text-slate-600">Blacklisted</span>
            </div>
          {/if}
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
    <div class="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search tenants by name..." 
            bind:value={searchTerm} 
            class="pl-10 w-full" 
          />
        </div>
        <div class="flex gap-2">
          <Select type="single" bind:value={selectedStatus}>
            <SelectTrigger class="w-[180px]">
              {selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).toLowerCase() : 'Filter by status'}
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
              onclick={() => viewMode = 'card'}
              class="rounded-r-none px-3"
            >
              <LayoutGrid class="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onclick={() => viewMode = 'list'}
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
                    <!-- Avatar skeleton -->
                    <Skeleton class="w-10 h-10 rounded-full" />
                    <div class="space-y-2">
                      <!-- Name skeleton -->
                      <Skeleton class="h-4 w-32" />
                      <!-- Contact info skeleton -->
                      <Skeleton class="h-3 w-48" />
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Status badge skeleton -->
                    <Skeleton class="h-6 w-16 rounded-full" />
                    <!-- Edit button skeleton -->
                    <Skeleton class="h-9 w-9 rounded-md" />
                    <!-- Delete button skeleton -->
                    <Skeleton class="h-9 w-9 rounded-md" />
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else if filteredTenants.length === 0}
          <div class="text-center py-12">
            <Users class="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p class="text-gray-500 text-lg font-medium">
              {searchTerm || selectedStatus ? 'No tenants found matching your criteria' : 'No tenants found'}
            </p>
            <p class="text-gray-400 text-sm mt-2">
              {searchTerm || selectedStatus ? 'Try adjusting your search or filter criteria' : 'Get started by adding your first tenant'}
            </p>
            {#if !searchTerm && !selectedStatus}
              <Button onclick={handleAddTenant} class="mt-4">
                <Plus class="w-4 h-4 mr-2" />
                Add First Tenant
              </Button>
            {/if}
          </div>
        {:else if viewMode === 'card'}
          <!-- Card View (Grid) -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {#each filteredTenants as tenant (tenant.id)}
              <TenantCard 
                {tenant} 
                onEdit={handleEdit} 
                onDelete={handleDeleteTenant} 
              />
            {/each}
          </div>
        {:else}
          <!-- List View (Table) -->
          <TenantTable 
            tenants={filteredTenants}
            on:edit={(e) => handleEdit(e.detail)}
            on:delete={(e) => handleDeleteTenant(e.detail)}
          />
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
  form={data.form}
  onOpenChange={handleModalClose}
  onTenantUpdate={updateTenantInState}
/>
