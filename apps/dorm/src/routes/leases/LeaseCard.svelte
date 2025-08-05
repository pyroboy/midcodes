<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
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
              <Badge 
                variant={getStatusVariant(lease.status?.toString() || 'INACTIVE')} 
                class="text-sm px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity font-medium"
              >
                {lease.status?.toString() || 'INACTIVE'}
                <ChevronDown class="w-3 h-3 ml-1" />
              </Badge>
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

      <!-- Middle: Enhanced Balance Card - 1/3 width on desktop, full on mobile -->
      <div class="w-full lg:w-1/3 flex items-center justify-center">
        <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/60 shadow-sm w-full max-w-sm">
          <div class="flex flex-col gap-2">
            <!-- Status Badge -->
            {#if lease.balanceStatus}
              {@const displayStatus = getLeaseDisplayStatus(lease.balanceStatus)}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  {#if displayStatus.icon === 'AlertCircle'}
                    <AlertCircle class="w-4 h-4 text-red-500" />
                  {:else if displayStatus.icon === 'AlertTriangle'}
                    <AlertTriangle class="w-4 h-4 text-amber-500" />
                  {:else if displayStatus.icon === 'Clock'}
                    <Clock class="w-4 h-4 text-orange-500" />
                  {:else}
                    <CheckCircle class="w-4 h-4 text-green-500" />
                  {/if}
                  <span class="text-sm font-medium text-slate-600">{displayStatus.label.toUpperCase()}</span>
                </div>
                <Badge variant={displayStatus.variant} class="text-xs">
                  {#if lease.balanceStatus.hasOverdue}
                    {formatCurrency(lease.balanceStatus.overdueBalance)}
                  {:else if lease.balanceStatus.hasPartial}
                    {formatCurrency(lease.balanceStatus.partialBalance)}
                  {:else if lease.balanceStatus.hasPending}
                    {formatCurrency(lease.balanceStatus.pendingBalance)}
                  {:else}
                    Paid
                  {/if}
                </Badge>
              </div>
            {/if}
            
            <!-- Total Balance -->
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <DollarSign class="w-4 h-4 text-slate-500" />
                <span class="text-sm font-medium text-slate-600">TOTAL BALANCE</span>
              </div>
              <div class="text-right">
                <span class={`text-2xl font-bold transition-colors ${
                  lease.balance > 0 
                    ? 'text-red-600' 
                    : lease.balance < 0 
                      ? 'text-green-600' 
                      : 'text-slate-600'
                }`}>
                  {formatCurrency(lease.balance)}
                </span>
                {#if totalPenalty > 0}
                  <div class="flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertTriangle class="w-3 h-3" />
                    <span>+{formatCurrency(totalPenalty)} penalty</span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Due Date Context -->
            {#if lease.balanceStatus}
              {#if lease.balanceStatus.hasOverdue}
                <p class="text-sm text-red-600">
                  {lease.balanceStatus.daysOverdue} days overdue
                </p>
              {:else if lease.balanceStatus.hasPending && lease.balanceStatus.nextDueDate}
                <p class="text-sm text-orange-600">
                  Due: {formatDate(lease.balanceStatus.nextDueDate)}
                </p>
              {/if}
            {/if}

            <!-- Balance Breakdown Tooltip -->
            {#if lease.balanceStatus && (lease.balanceStatus.overdueBalance > 0 || lease.balanceStatus.partialBalance > 0 || lease.balanceStatus.pendingBalance > 0)}
              <div class="mt-2 group relative">
                <button 
                  class="text-xs text-slate-500 hover:text-slate-700 underline"
                  type="button"
                  onclick={(e) => e.stopPropagation()}
                >
                  View Balance Details
                </button>
                <div class="absolute hidden group-hover:block bg-white border rounded-lg shadow-lg p-3 z-10 w-64 bottom-full mb-2 left-0">
                  <div class="space-y-2">
                    {#if lease.balanceStatus.overdueBalance > 0}
                      <div class="flex justify-between text-red-600">
                        <span>Overdue:</span>
                        <span>{formatCurrency(lease.balanceStatus.overdueBalance)}</span>
                      </div>
                    {/if}
                    {#if lease.balanceStatus.partialBalance > 0}
                      <div class="flex justify-between text-amber-600">
                        <span>Partial:</span>
                        <span>{formatCurrency(lease.balanceStatus.partialBalance)}</span>
                      </div>
                    {/if}
                    {#if lease.balanceStatus.pendingBalance > 0}
                      <div class="flex justify-between text-orange-600">
                        <span>Pending:</span>
                        <span>{formatCurrency(lease.balanceStatus.pendingBalance)}</span>
                      </div>
                    {/if}
                    <div class="border-t pt-2 flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(lease.balance || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
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