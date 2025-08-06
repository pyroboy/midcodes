<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import Button from '$lib/components/ui/button/button.svelte';
  import PaymentModal from './PaymentModal.svelte';
  import RentManagerModal from './RentManagerModal.svelte';
  import SecurityDepositModal from './SecurityDepositModal.svelte';
  import LeaseFormModal from './LeaseFormModal.svelte';
  import LeaseDetailsModal from './LeaseDetailsModal.svelte';
  import { invalidateAll } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { leaseStatusEnum } from './formSchema';
  import { 
    Pencil,
    Trash2, 
    CreditCard, 
    Home, 
    Shield,
    ChevronDown,
    DollarSign,
    AlertTriangle,
    Printer,
    AlertCircle,
    Clock,
    CheckCircle
  } from 'lucide-svelte';
  import type { Lease, Billing } from '$lib/types/lease';
  import { printLeaseInvoice } from '$lib/utils/print';
  import { getLeaseDisplayStatus } from '$lib/utils/lease-status';
  import { formatCurrency, formatDate } from '$lib/utils/format';

  interface Props {
    lease: Lease & { balanceStatus?: any };
    tenants?: any[];
    rentalUnits?: any[];
    onLeaseClick: (lease: Lease) => void;
    onDelete: (event: Event, lease: Lease) => void;
    onStatusChange: (id: string, status: string) => void;
  }

  let { lease, tenants = [], rentalUnits = [], onLeaseClick, onDelete, onStatusChange }: Props = $props();

  import {
    getStatusVariant,
  } from '$lib/utils/format';

  let showPaymentModal = $state(false);
  let showRentManager = $state(false);
  let showSecurityDepositManager = $state(false);
  let showEditModal = $state(false);
  let showDetailsModal = $state(false);

  async function handlePaymentModalClose() {
    showPaymentModal = false;
    // Only invalidate if payment was actually made
    // await invalidateAll();
  }
  async function handleRentManagerClose() {
    showRentManager = false;
    // Only invalidate if changes were actually made
    // await invalidateAll();
  }
  async function handleSecurityDepositManagerClose() {
    showSecurityDepositManager = false;
    // Only invalidate if changes were actually made
    // await invalidateAll();
  }

  async function handleEditModalClose() {
    showEditModal = false;
    // Only invalidate if changes were actually made
    // await invalidateAll();
  }

  async function handleDetailsModalClose() {
    showDetailsModal = false;
    // No need to invalidate for just viewing details
    // await invalidateAll();
  }

  const dispatch = createEventDispatcher<{
    delete: { id: string };
    statusChange: { id: string; status: string };
  }>();

  // Calculate total penalty only for unpaid billings
  let totalPenalty = $derived.by(() => {
    return lease.billings?.reduce((acc, b) => {
      const totalDue = b.amount + (b.penalty_amount || 0);
      const isFullyPaid = b.paid_amount >= totalDue;
      // Only include penalty if billing is not fully paid
      return acc + (isFullyPaid ? 0 : (b.penalty_amount || 0));
    }, 0) || 0;
  });

  // Get the most recent billing date when all billings are paid
  let lastPaidDate = $derived.by(() => {
    if (!lease.billings || lease.billings.length === 0) return null;
    
    // Check if all billings are fully paid
    const allPaid = lease.billings.every(b => {
      const totalDue = b.amount + (b.penalty_amount || 0);
      return b.paid_amount >= totalDue;
    });
    
    if (!allPaid) return null;
    
    // Find the most recent billing date from fully paid billings
    const paidBillings = lease.billings
      .filter(b => {
        const totalDue = b.amount + (b.penalty_amount || 0);
        return b.paid_amount >= totalDue;
      })
      .map(b => new Date(b.billing_date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    return paidBillings.length > 0 ? paidBillings[0] : null;
  });

  async function handleStatusChange(newStatus: string) {
    try {
      const formData = new FormData();
      formData.append('id', lease.id.toString());
      formData.append('status', newStatus);

      const response = await fetch('?/updateStatus', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.status === 200) {
        onStatusChange(lease.id.toString(), newStatus);
        await invalidateAll();
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating lease status:', error);
      alert('Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
</script>

<Card.Root class="group hover:shadow-lg transition-all duration-300 w-full border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl overflow-hidden cursor-pointer" onclick={() => showDetailsModal = true}>
  <Card.Content class="py-6 px-6 border-t border-slate-200/40 hover:bg-slate-50/50 transition-colors duration-200">
    <!-- Main Row -->
    <div class="flex flex-col lg:flex-row lg:items-center w-full gap-4 lg:gap-6">
      <!-- Left: Name and Status - 1/3 width on desktop, full on mobile -->
      <div class="w-full lg:w-1/3 flex flex-col gap-2">
        <div class="flex items-center gap-2 group/name min-w-0">
          <span class="text-xl font-bold truncate text-slate-800 transition-colors">
            {lease.name || `Lease #${lease.id}`}
          </span>
        </div>

        <div class="flex items-center">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <div class="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-sm cursor-pointer hover:bg-slate-200 transition-colors font-medium">
                {lease.status?.toString() || 'INACTIVE'}
                <ChevronDown class="w-3 h-3" />
              </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="w-44">
              <DropdownMenu.Group>
                <DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-semibold">
                  Change Status
                </DropdownMenu.GroupHeading>
                <DropdownMenu.Separator />
                <DropdownMenu.RadioGroup value={lease.status}>
                  {#each leaseStatusEnum.options as status}
                    <DropdownMenu.RadioItem 
                      value={status}
                      onSelect={() => handleStatusChange(status)}
                    >
                      {status}
                    </DropdownMenu.RadioItem>
                  {/each}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      <!-- Middle Left: Tenant Profile Pictures -->
      <div class="w-full lg:w-auto flex items-center justify-start">
        {#if lease.lease_tenants && lease.lease_tenants.length > 0}
          <div class="flex items-center">
            {#each lease.lease_tenants.slice(0, 3) as leaseTenant, index}
              {@const tenantData = leaseTenant.tenant || leaseTenant}
              {@const matchedTenant = tenants.find(t => t.name === tenantData.name)}
              {@const profileUrl = tenantData.profile_picture_url || matchedTenant?.profile_picture_url}
              <div 
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-white shadow-lg flex-shrink-0"
                class:-ml-4={index > 0}
                style="z-index: {lease.lease_tenants.length - index}"
              >
                {#if profileUrl}
                  <img 
                    src={profileUrl} 
                    alt="{tenantData.name}'s profile picture"
                    class="w-full h-full rounded-full object-cover"
                  />
                {:else}
                  <div class="w-full h-full bg-slate-100 rounded-full flex items-center justify-center">
                    <span class="text-slate-600 font-medium text-sm sm:text-base">
                      {tenantData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                {/if}
              </div>
            {/each}
            {#if lease.lease_tenants.length > 3}
              <div 
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-white shadow-lg flex-shrink-0 bg-slate-200 flex items-center justify-center -ml-4"
                style="z-index: 0"
              >
                <span class="text-slate-600 font-medium text-sm sm:text-base">
                  +{lease.lease_tenants.length - 3}
                </span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Middle Right: Simplified Balance Display - 1/3 width on desktop, full on mobile -->
      <div class="w-full lg:w-1/3 flex items-center justify-center">
        <div class="text-center">
          {#if !lease.billings || lease.billings.length === 0}
            <!-- No Billings Yet Message -->
            <div class="text-lg italic text-slate-400 font-light">
              No Billings Yet
            </div>
          {:else}
            <!-- Balance Breakdown -->
            {#if lease.balanceStatus}
              <div class="text-2xl text-slate-600">
                {#if lease.balanceStatus.overdueBalance > 0}
                  <span class="text-red-600">₱{lease.balanceStatus.overdueBalance.toLocaleString()} overdue</span>
                {/if}
                {#if lease.balanceStatus.partialBalance > 0}
                  {#if lease.balanceStatus.overdueBalance > 0} • {/if}
                  <span class="text-amber-600">₱{lease.balanceStatus.partialBalance.toLocaleString()} partial</span>
                {/if}
                {#if lease.balanceStatus.pendingBalance > 0}
                  {#if lease.balanceStatus.overdueBalance > 0 || lease.balanceStatus.partialBalance > 0} • {/if}
                  <span class="text-orange-600">₱{lease.balanceStatus.pendingBalance.toLocaleString()} pending</span>
                {/if}
                
                <!-- Show "Paid" if all balances are zero -->
                {#if lease.balanceStatus.overdueBalance === 0 && lease.balanceStatus.partialBalance === 0 && lease.balanceStatus.pendingBalance === 0}
                  <span class="text-green-600">Paid</span>
                  {#if lastPaidDate}
                    <div class="text-xs text-slate-500 mt-1">
                      Last billing: {formatDate(lastPaidDate.toISOString())}
                    </div>
                  {/if}
                {/if}
              </div>
              
              <!-- Status Context -->
              {#if lease.balanceStatus.hasOverdue}
                <div class="text-xs text-red-600 mt-1">
                  {lease.balanceStatus.daysOverdue} days overdue
                </div>
              {:else if lease.balanceStatus.hasPending && lease.balanceStatus.nextDueDate}
                <div class="text-xs text-orange-600 mt-1">
                  Due: {formatDate(lease.balanceStatus.nextDueDate)}
                </div>
              {/if}
            {/if}
            
            {#if totalPenalty > 0}
              <div class="text-xs text-red-500 mt-1">
                +{formatCurrency(totalPenalty)} penalty
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Right: Action Icons - 1/3 width on desktop, compressed on mobile -->
      <div class="flex items-center justify-center lg:justify-end gap-1 sm:gap-2 flex-wrap w-full lg:w-1/3">
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button 
                size="icon"
                variant="ghost"
                onclick={(e) => {
                  e.stopPropagation();
                  showPaymentModal = true;
                }}
                class="h-8 w-8 sm:h-10 sm:w-10 hover:bg-green-50 hover:text-green-600 transition-colors group/payment"
              >
                <CreditCard class="w-4 h-4 sm:w-5 sm:h-5 group-hover/payment:scale-110 transition-transform" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p class="text-sm font-medium">Make Payment</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button 
                size="icon"
                variant="ghost"
                onclick={(e) => {
                  e.stopPropagation(); 
                  showEditModal = true;
                }}
                class="h-8 w-8 sm:h-10 sm:w-10 hover:bg-blue-50 hover:text-blue-600 transition-colors group/edit"
              >
                <Pencil class="w-4 h-4 sm:w-5 sm:h-5 group-hover/edit:scale-110 transition-transform" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p class="text-sm font-medium">Edit Lease</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button 
                size="icon"
                variant="ghost"
                onclick={(e) => {
                  e.stopPropagation(); 
                  showRentManager = true;
                }}
                class="h-8 w-8 sm:h-10 sm:w-10 hover:bg-purple-50 hover:text-purple-600 transition-colors group/rent"
              >
                <Home class="w-4 h-4 sm:w-5 sm:h-5 group-hover/rent:scale-110 transition-transform" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p class="text-sm font-medium">Modify Rents</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button 
                size="icon"
                variant="ghost"
                onclick={(e) => {
                  e.stopPropagation(); 
                  showSecurityDepositManager = true;
                }}
                class="h-8 w-8 sm:h-10 sm:w-10 hover:bg-orange-50 hover:text-orange-600 transition-colors group/security"
              >
                <Shield class="w-4 h-4 sm:w-5 sm:h-5 group-hover/security:scale-110 transition-transform" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p class="text-sm font-medium">Modify Security Deposit</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button 
                size="icon"
                variant="ghost"
                onclick={(e) => {
                  e.stopPropagation(); 
                  printLeaseInvoice(lease);
                }}
                class="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-50 hover:text-gray-600 transition-colors group/print"
              >
                <Printer class="w-4 h-4 sm:w-5 sm:h-5 group-hover/print:scale-110 transition-transform" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p class="text-sm font-medium">Print Statement</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button 
                size="icon"
                variant="ghost"
                onclick={(e) => {
                  e.stopPropagation();
                  onDelete(e, lease);
                }}
                class="h-8 w-8 sm:h-10 sm:w-10 hover:bg-red-50 hover:text-red-600 transition-colors group/delete"
              >
                <Trash2 class="w-4 h-4 sm:w-5 sm:h-5 group-hover/delete:scale-110 transition-transform" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p class="text-sm font-medium">Delete Lease</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </div>
  </Card.Content>
</Card.Root>

<PaymentModal 
  lease={{...lease, id: lease.id.toString()}}
  isOpen={showPaymentModal}
  onOpenChange={handlePaymentModalClose}
/>

{#if showRentManager}
<RentManagerModal
  lease={lease}
  open={showRentManager}
  onOpenChange={handleRentManagerClose}
/>
{/if}

{#if showSecurityDepositManager}
<SecurityDepositModal
  lease={lease}
  open={showSecurityDepositManager}
  onOpenChange={handleSecurityDepositManagerClose}
/>
{/if}

{#if showEditModal}
<LeaseFormModal
  editMode
  lease={lease}
  tenants={tenants}
  rentalUnits={rentalUnits}
  open={showEditModal}
  onOpenChange={handleEditModalClose}
/>
{/if}

{#if showDetailsModal}
<LeaseDetailsModal
  {lease}
  {tenants}
  open={showDetailsModal}
  onOpenChange={handleDetailsModalClose}
/>
{/if}

<style>
  :global(.card) {
    border: none !important;
    margin-bottom: 0 !important;
    backdrop-filter: blur(10px);
  }
</style>