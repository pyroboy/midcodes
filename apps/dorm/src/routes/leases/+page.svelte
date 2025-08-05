<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import LeaseFormModal from './LeaseFormModal.svelte';
  import LeaseList from './LeaseList.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus } from 'lucide-svelte';
  import type { z } from 'zod';
  import { leaseSchema } from './formSchema';
  import { calculateLeaseBalanceStatus } from '$lib/utils/lease-status';
  import { formatCurrency } from '$lib/utils/format';

  type FormType = z.infer<typeof leaseSchema>;
  
  let { data } = $props();
  let leases = $state(data.leases);
  let showModal = $state(false);
  let selectedLease: FormType | undefined = $state();
  let editMode = $state(false);

  $effect(() => {
    leases = data.leases;
  });

  // Svelte 5 runes for reactive calculations
  let leasesWithStatus = $derived.by(() => 
    leases.map(lease => ({
      ...lease,
      balanceStatus: calculateLeaseBalanceStatus(lease)
    }))
  );

  // Calculate summary metrics using $derived
  let summaryMetrics = $derived.by(() => ({
    totalLeases: leasesWithStatus.length,
    paidInFull: leasesWithStatus.filter(l => 
      !l.balanceStatus.hasOverdue && 
      !l.balanceStatus.hasPending && 
      !l.balanceStatus.hasPartial
    ).length,
    pendingCount: leasesWithStatus.filter(l => l.balanceStatus.hasPending).length,
    partialCount: leasesWithStatus.filter(l => l.balanceStatus.hasPartial).length,
    overdueCount: leasesWithStatus.filter(l => l.balanceStatus.hasOverdue).length,
    totalPending: leasesWithStatus.reduce((sum, l) => sum + l.balanceStatus.pendingBalance, 0),
    totalPartial: leasesWithStatus.reduce((sum, l) => sum + l.balanceStatus.partialBalance, 0),
    totalOverdue: leasesWithStatus.reduce((sum, l) => sum + l.balanceStatus.overdueBalance, 0),
    totalBalance: leasesWithStatus.reduce((sum, l) => sum + (l.balance || 0), 0)
  }));

  function handleAddLease() {
    selectedLease = undefined;
    editMode = false;
    showModal = true;
  }

  function handleEdit(lease: FormType) {
    selectedLease = lease;
    editMode = true;
    showModal = true;
  }

  async function handleDeleteLease(lease: FormType & { billings?: { paid_amount: number }[]; balance?: number; name?: string; id?: number }) {
    // Enhanced confirmation dialog with detailed warning
    const hasPayments = lease.billings?.some((b: { paid_amount: number }) => b.paid_amount > 0);
    const totalBalance = lease.balance || 0;
    
    let confirmMessage = `Are you sure you want to archive lease "${lease.name}"?\n\n`;
    if (hasPayments) {
      confirmMessage += `⚠️  WARNING: This lease has payment history that will be preserved for audit purposes.\n\n`;
    }
    
    if (totalBalance > 0) {
      confirmMessage += `💰 Outstanding Balance: ₱${totalBalance.toLocaleString()}\n`;
    }
    
    confirmMessage += `\nThis action will:\n`;
    confirmMessage += `• Archive the lease (soft delete)\n`;
    confirmMessage += `• Preserve all payment and billing history\n`;
    confirmMessage += `• Maintain audit compliance\n`;
    confirmMessage += `• Remove from active lease list\n\n`;
    confirmMessage += `This action cannot be undone. Continue?`;

    if (!confirm(confirmMessage)) return;

    const formData = new FormData();
    formData.append('id', String(lease.id));
    formData.append('reason', 'User initiated deletion');
    
    try {
      const result = await fetch('?/delete', {
        method: 'POST',
        body: formData
      });
      const response = await result.json();

      if (result.ok) {
        leases = leases.filter(l => l.id !== lease.id);
        // No need to invalidateAll since we're already updating the local state
        // await invalidateAll();
        // Show success message
        alert(`Lease "${lease.name}" has been successfully archived. Payment history has been preserved.`);
      } else {
        console.error('Delete failed:', response);
        alert(response.error || response.message || 'Failed to delete lease');
      }
    } catch (error) {
      console.error('Error deleting lease:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleModalClose() {
    showModal = false;
    selectedLease = undefined;
    editMode = false;
  }

  function handleStatusChange(id: string, status: string) {
    leases = leases.map(lease => 
      lease.id === id 
        ? { ...lease, status } 
        : lease
    );
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
            Leases Dashboard
          </h1>
          <p class="text-slate-600 text-sm mt-1">
            Manage rental agreements and track payments
          </p>
        </div>
      </div>
      
      <!-- Enhanced Stats Overview -->
      <div class="flex items-center gap-3 text-xs sm:text-sm">
        <div class="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
          <span class="text-blue-600 font-medium">{summaryMetrics.totalLeases}</span>
          <span class="text-slate-600">Total</span>
        </div>
        <div class="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
          <span class="text-green-600 font-medium">{summaryMetrics.paidInFull}</span>
          <span class="text-slate-600">Paid</span>
        </div>
        <div class="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg">
          <div class="flex flex-col">
            <span class="text-orange-600 font-medium">{summaryMetrics.pendingCount}</span>
            <span class="text-orange-600 text-xs">{formatCurrency(summaryMetrics.totalPending)}</span>
          </div>
          <span class="text-slate-600">Pending</span>
        </div>
        <div class="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
          <div class="flex flex-col">
            <span class="text-amber-600 font-medium">{summaryMetrics.partialCount}</span>
            <span class="text-amber-600 text-xs">{formatCurrency(summaryMetrics.totalPartial)}</span>
          </div>
          <span class="text-slate-600">Partial</span>
        </div>
        <div class="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg">
          <div class="flex flex-col">
            <span class="text-red-600 font-medium">{summaryMetrics.overdueCount}</span>
            <span class="text-red-600 text-xs">{formatCurrency(summaryMetrics.totalOverdue)}</span>
          </div>
          <span class="text-slate-600">Overdue</span>
        </div>
      </div>
      
      <Button 
        onclick={handleAddLease} 
        class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Plus class="w-4 h-4" />
        Add Lease
      </Button>
    </div>
  </div>
</div>

  <!-- Main Content Area -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <!-- Stats Overview -->
   

    <!-- Lease List Section -->
    <div class="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">

      
        <LeaseList
          leases={leasesWithStatus}
          tenants={data.tenants}
          rentalUnits={data.rental_units}
          on:edit={event => handleEdit(event.detail)}
          on:delete={event => handleDeleteLease(event.detail)}
          onStatusChange={handleStatusChange}
        />
    </div>
  </div>
</div>

<!-- Modal for Create/Edit -->
<LeaseFormModal
  open={showModal}
  lease={selectedLease}
  {editMode}
  tenants={data.tenants}
  rentalUnits={data.rental_units}
  onOpenChange={handleModalClose}
/>
