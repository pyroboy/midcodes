<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import TenantFormModal from './TenantFormModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus, Users, UserCheck, UserX, AlertTriangle, Search } from 'lucide-svelte';
  import type { TenantResponse } from '$lib/types/tenant';
  import type { PageData } from './$types';
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion';
  import { Pencil, Trash2 } from 'lucide-svelte';
  import { Input } from '$lib/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import { toast } from 'svelte-sonner';

  let { data } = $props<{ data: PageData }>();
  let tenants = $state(data.tenants);
  let showModal = $state(false);
  let selectedTenant: TenantResponse | undefined = $state();
  let editMode = $state(false);
  let searchTerm = $state('');
  let selectedStatus = $state('');

  $effect(() => {
    tenants = data.tenants;
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

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'BLACKLISTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
  <!-- Header Section -->
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
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div class="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-600 text-xs sm:text-sm font-medium">Total Tenants</p>
            <p class="text-xl sm:text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div class="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-600 text-xs sm:text-sm font-medium">Active Tenants</p>
            <p class="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <UserCheck class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div class="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-600 text-xs sm:text-sm font-medium">Pending</p>
            <p class="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div class="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-600 text-xs sm:text-sm font-medium">Blacklisted</p>
            <p class="text-xl sm:text-2xl font-bold text-red-600">{stats.blacklisted}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <UserX class="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>

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
      </div>
    </div>

    <!-- Tenants List Section -->
    <div class="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Tenant List ({filteredTenants.length})</h2>
        
        {#if filteredTenants.length === 0}
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
        {:else}
          <Accordion type="single" class="w-full space-y-2">
            {#each filteredTenants as tenant (tenant.id)}
              <AccordionItem value={tenant.id.toString()} class="border border-slate-200 rounded-lg">
                <div class="flex justify-between items-center w-full p-4">
                  <AccordionTrigger class="flex-1 text-left">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <span class="text-slate-600 font-medium text-sm">
                          {tenant.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div class="font-medium text-slate-900">{tenant.name}</div>
                        <div class="text-sm text-slate-500">
                          {tenant.email || tenant.contact_number || 'No contact info'}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <div class="flex items-center gap-2">
                    <Badge class={getStatusColor(tenant.tenant_status)}>
                      {tenant.tenant_status}
                    </Badge>
                    <Button variant="outline" size="icon" onclick={() => handleEdit(tenant)}>
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onclick={() => handleDeleteTenant(tenant)}>
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <AccordionContent class="px-4 pb-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-slate-600"><strong>Email:</strong> {tenant.email || 'N/A'}</p>
                      <p class="text-slate-600"><strong>Contact:</strong> {tenant.contact_number || 'N/A'}</p>
                      <p class="text-slate-600"><strong>Status:</strong> 
                        <Badge class={`ml-2 ${getStatusColor(tenant.tenant_status)}`}>
                          {tenant.tenant_status}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      {#if tenant.lease}
                        <p class="text-slate-600"><strong>Current Lease:</strong> {tenant.lease.name || 'N/A'}</p>
                        <p class="text-slate-600"><strong>Property:</strong> {tenant.lease.location?.property?.name || 'N/A'}</p>
                        <p class="text-slate-600"><strong>Unit:</strong> {tenant.lease.location?.number || 'N/A'}</p>
                      {:else}
                        <p class="text-slate-600"><strong>Current Lease:</strong> <span class="text-orange-600">No active lease</span></p>
                      {/if}
                    </div>
                    {#if tenant.emergency_contact?.name}
                      <div class="md:col-span-2">
                        <p class="text-slate-600 font-medium mb-2">Emergency Contact:</p>
                        <div class="bg-slate-50 rounded-lg p-3">
                          <p class="text-slate-600"><strong>Name:</strong> {tenant.emergency_contact.name}</p>
                          <p class="text-slate-600"><strong>Relationship:</strong> {tenant.emergency_contact.relationship || 'N/A'}</p>
                          <p class="text-slate-600"><strong>Phone:</strong> {tenant.emergency_contact.phone || 'N/A'}</p>
                          <p class="text-slate-600"><strong>Email:</strong> {tenant.emergency_contact.email || 'N/A'}</p>
                        </div>
                      </div>
                    {/if}
                  </div>
                </AccordionContent>
              </AccordionItem>
            {/each}
          </Accordion>
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
/>