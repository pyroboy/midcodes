<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import type { Lease } from '$lib/types/lease';
  import { Pencil, Users, Calendar, Search, AlertCircle, Plus } from 'lucide-svelte';
  import { format } from 'date-fns';
  import { leaseStatusEnum } from './formSchema';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import DatePicker from '$lib/components/ui/date-picker.svelte';

  let { 
    lease = null, 
    open, 
    onOpenChange, 
    tenants = [], 
    rentalUnits = [],
    editMode = false 
  } = $props<{
    lease?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenants: any[];
    rentalUnits: any[];
    editMode: boolean;
  }>();

  // Format dates for input fields
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (e) {
      return '';
    }
  };

  // Get tenant IDs by matching names from lease_tenants array
  function getTenantIds(lease: any): number[] {
    if (!lease?.lease_tenants || !Array.isArray(lease.lease_tenants) || lease.lease_tenants.length === 0) {
      return [];
    }
    
    // Extract tenant names from lease_tenants
    const leaseTenantNames = lease.lease_tenants.filter((lt: any) => lt.name).map((lt: any) => lt.name);
    
    // Find matching tenants by name
    const matchingTenantIds = tenants
      .filter((tenant: any) => leaseTenantNames.includes(tenant.name))
      .map((tenant: any) => tenant.id);
    
    return matchingTenantIds;
  }

  // Form data with optional end_date
  let formData = $state({
    name: lease?.name || '',
    start_date: formatDate(lease?.start_date || ''),
    end_date: formatDate(lease?.end_date || '') || '', // Make optional
    terms_month: lease?.terms_month || 1,
    status: lease?.status || 'ACTIVE',
    notes: lease?.notes || '',
    rental_unit_id: lease?.rental_unit?.id || 0,
    rent_amount: lease?.rent_amount || 0,
    selectedTenants: getTenantIds(lease)
  });

  // Auto-calculate end_date when start_date or terms change
  $effect(() => {
    if (formData.start_date && Number(formData.terms_month) > 0) {
      try {
        const start = new Date(formData.start_date);
        if (isNaN(start.getTime())) return;

        const end = new Date(start);
        end.setMonth(end.getMonth() + Number(formData.terms_month) );
        formData.end_date = format(end, 'yyyy-MM-dd');
      } catch (error) {
        console.error('Error calculating end date:', error);
      }
    } else if (Number(formData.terms_month) === 0) {
      formData.end_date = '';
    }
  });

  // Search functionality
  let searchTerm = $state('');
  let filteredTenants = $derived.by(() => {
    let filtered = tenants;
    
    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = tenants.filter((tenant: any) => 
        tenant.name.toLowerCase().includes(term) ||
        (tenant.email && tenant.email.toLowerCase().includes(term)) ||
        (tenant.contact_number && tenant.contact_number.toLowerCase().includes(term))
      );
    }
    
    // Sort: selected tenants first, then unselected tenants
    return filtered.sort((a: any, b: any) => {
      const aSelected = formData.selectedTenants.includes(a.id);
      const bSelected = formData.selectedTenants.includes(b.id);
      
      // Selected tenants go to the top
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // If both have same selection status, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  });

  // Validation
  let validationErrors = $state<Record<string, string>>({});
  let isFormValid = $state(false);
  
  // Updated validation
  $effect(() => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Lease name is required';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!formData.rental_unit_id || formData.rental_unit_id === 0) {
      errors.rental_unit = 'A rental unit must be selected';
    }
    
    if (formData.selectedTenants.length === 0) {
      errors.tenants = 'At least one tenant must be selected';
    }
    
    // Make end_date validation optional
    if (formData.end_date) {
      if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        
        if (startDate >= endDate) {
          errors.end_date = 'End date must be after start date';
        }
      }
    }
    
    validationErrors = errors;
    isFormValid = Object.keys(errors).length === 0;
  });

  // Get rental unit display name
  let selectedRentalUnit = $derived.by(() => {
    const unit = rentalUnits?.find((r: any) => r.id === formData.rental_unit_id);
    if (!unit) return "Select a unit";
    const unitName = unit.name ?? "Unnamed Unit";
    const propertyName = unit.property?.name ?? "No property";
    return `${unitName} - ${propertyName}`;
  });

  // Handle tenant selection
  function toggleTenant(tenantId: number) {
    const index = formData.selectedTenants.indexOf(tenantId);
    if (index > -1) {
      formData.selectedTenants = formData.selectedTenants.filter((id: number) => id !== tenantId);
    } else {
      formData.selectedTenants = [...formData.selectedTenants, tenantId];
    }
  }

  // Check if tenant is selected
  function isTenantSelected(tenantId: number) {
    return formData.selectedTenants.includes(tenantId);
  }

  // Form submission with use:enhance
  const handleFormSubmit = () => {
    if (!isFormValid) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }
  };

  // Reset form when modal opens/closes - FIXED: Use untrack to prevent infinite loop
  $effect(() => {
    if (open) {
      // Use untrack to prevent the effect from re-running when we modify formData
      const tenantIds = getTenantIds(lease);
      
      // Reset form data when modal opens
      formData = {
        name: lease?.name || '',
        start_date: formatDate(lease?.start_date || ''),
        end_date: formatDate(lease?.end_date || '') || '', // Make optional
        terms_month: lease?.terms_month || 1,
        status: lease?.status || 'ACTIVE',
        notes: lease?.notes || '',
        rental_unit_id: lease?.rental_unit?.id || 0,
        rent_amount: lease?.rent_amount || 0,
        selectedTenants: tenantIds
      };
      searchTerm = '';
    }
  });
</script>

<Dialog open={open} onOpenChange={(open) => !open && onOpenChange()}>
  <DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <div class="flex items-center gap-2">
        {#if editMode}
          <Pencil class="w-5 h-5 text-primary" />
        {:else}
          <Plus class="w-5 h-5 text-primary" />
        {/if}
        <DialogTitle>{editMode ? 'Edit' : 'Create'} Lease</DialogTitle>
      </div>
      <DialogDescription>
        {editMode ? 'Update the lease information and manage tenants.' : 'Create a new lease and assign tenants.'} Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    
    <form 
      method="POST" 
      action={editMode ? "?/updateLease" : "?/create"}
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            toast.success(editMode ? 'Lease updated successfully' : 'Lease created successfully');
            onOpenChange(false);
            await invalidateAll();
          } else if (result.type === 'failure') {
            toast.error(editMode ? 'Failed to update lease' : 'Failed to create lease');
          }
        };
      }}
      class="space-y-6"
    >
      <!-- Hidden form fields for server action -->
      {#if editMode}
        <input type="hidden" name="id" value={lease?.id} />
      {/if}
      <input type="hidden" name="name" bind:value={formData.name} />
      <input type="hidden" name="start_date" bind:value={formData.start_date} />
      <input type="hidden" name="end_date" bind:value={formData.end_date} />
      <input type="hidden" name="terms_month" bind:value={formData.terms_month} />
      <input type="hidden" name="status" bind:value={formData.status} />
      <input type="hidden" name="notes" bind:value={formData.notes} />
      <input type="hidden" name="rental_unit_id" bind:value={formData.rental_unit_id} />
      <input type="hidden" name="rent_amount" bind:value={formData.rent_amount} />
      <input type="hidden" name="tenantIds" value={JSON.stringify(formData.selectedTenants)} />
      
      <!-- Basic Information -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Calendar class="w-4 h-4 text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-700">Basic Information</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label for="name">Lease Name</Label>
            <Input 
              id="name" 
              name="name" 
              type="text" 
              bind:value={formData.name}
              class={validationErrors.name ? 'border-red-500' : ''}
              required
            />
            {#if validationErrors.name}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {validationErrors.name}
              </p>
            {/if}
          </div>
          
          <div class="space-y-2">
            <Label for="rental_unit">Rental Unit</Label>
            <Select.Root
              type="single"
              bind:value={formData.rental_unit_id}
            >
              <Select.Trigger class={validationErrors.rental_unit ? 'border-red-500' : ''}>
                {selectedRentalUnit}
              </Select.Trigger>
              <Select.Content>
                {#each rentalUnits as unit}
                  <Select.Item value={unit.id}>
                    {unit.name} - {unit.property?.name || 'No property'}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if validationErrors.rental_unit}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {validationErrors.rental_unit}
              </p>
            {/if}
          </div>

          <div class="space-y-2">
            <Label for="rent_amount">Monthly Rent Amount</Label>
            <Input 
              id="rent_amount" 
              name="rent_amount" 
              type="number" 
              bind:value={formData.rent_amount}
              min="0"
              step="0.01"
              placeholder="0.00"
              class={validationErrors.rent_amount ? 'border-red-500' : ''}
            />
            {#if validationErrors.rent_amount}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {validationErrors.rent_amount}
              </p>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="space-y-2">
            <DatePicker
              bind:value={formData.start_date}
              label="Start Date"
              placeholder="Select start date"
              required={true}
              id="start_date"
              name="start_date"
            />
            {#if validationErrors.start_date}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {validationErrors.start_date}
              </p>
            {/if}
          </div>
          
          <div class="space-y-2">
            <Label for="terms_month">Terms (Months)</Label>
            <Input 
              id="terms_month" 
              name="terms_month" 
              type="number" 
              bind:value={formData.terms_month}
              min="1"
              max="60"
              class={validationErrors.terms_month ? 'border-red-500' : ''}
            />
            {#if validationErrors.terms_month}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {validationErrors.terms_month}
              </p>
            {/if}
          </div>
          
          <div class="space-y-2">
            <DatePicker
              bind:value={formData.end_date}
              label="End Date (Auto-calculated)"
              placeholder="Select end date"
              id="end_date"
              name="end_date"
            />
            <p class="text-xs text-gray-500">
              Automatically calculated from start date and terms
            </p>
            {#if validationErrors.end_date}
              <p class="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle class="w-4 h-4" />
                {validationErrors.end_date}
              </p>
            {/if}
          </div>

          <div class="space-y-2">
            <Label for="status">Status</Label>
            <Select.Root
              type="single"
              bind:value={formData.status}
            >
              <Select.Trigger>
                {formData.status}
              </Select.Trigger>
              <Select.Content>
                {#each leaseStatusEnum.options as status}
                  <Select.Item value={status}>
                    {status}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>


      </div>

      <!-- Tenant Management -->
      <div class="space-y-2">
        <div class="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Users class="w-4 h-4 text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-700">Tenant Management - selected ({formData.selectedTenants.length})</h3>
        </div>
        
        <!-- Search Bar -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              id="tenant-search"
              type="text"
              placeholder="Search by name, email, or contact number..."
              bind:value={searchTerm}
              class="pl-10"
            />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
            {#if filteredTenants.length === 0}
              <div class="col-span-2 text-center py-8 text-gray-500">
                <Users class="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p class="text-sm">
                  {searchTerm ? 'No tenants found matching your search' : 'No tenants available'}
                </p>
              </div>
            {:else}
                             {#each filteredTenants as tenant}
                 {@const isSelected = isTenantSelected(tenant.id)}
                 <label class="flex items-center space-x-2 cursor-pointer p-2 rounded border transition-all duration-200"
                   class:bg-blue-50={isSelected}
                   class:border-blue-300={isSelected}
                   class:hover:bg-gray-50={!isSelected}
                   class:border-gray-200={!isSelected}
                 >
                   <input 
                     type="checkbox" 
                     checked={isSelected}
                     onchange={() => toggleTenant(tenant.id)}
                     class="rounded"
                   />
                   <span class="text-sm flex-1">
                     <div class="font-medium" class:text-blue-700={isSelected}>
                       {tenant.name}
                     </div>
                     <div class="text-xs" class:text-blue-500={isSelected} class:text-gray-500={!isSelected}>
                       {tenant.email || tenant.contact_number || 'No contact info'}
                     </div>
                   </span>
                 </label>
               {/each}
            {/if}
          </div>
          {#if validationErrors.tenants}
            <p class="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle class="w-4 h-4" />
              {validationErrors.tenants}
            </p>
          {/if}
 
        </div>
        



      <!-- Notes -->
      <div class="space-y-2">
        <Label for="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          class="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          bind:value={formData.notes}
          placeholder="Additional notes about the lease..."
        ></textarea>
      </div>
      
      <div class="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onclick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid}>
          {editMode ? 'Save Changes' : 'Create Lease'}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
