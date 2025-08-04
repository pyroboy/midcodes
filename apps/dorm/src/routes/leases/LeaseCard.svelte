<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import PaymentModal from './PaymentModal.svelte';
  import RentManagerModal from './RentManagerModal.svelte';
  import SecurityDepositModal from './SecurityDepositModal.svelte';
  import LeaseFormModal from './LeaseFormModal.svelte';
  import { invalidateAll } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';
  import { Input } from '$lib/components/ui/input';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { leaseStatusEnum } from './formSchema';
  import * as AccordionPrimitive from '$lib/components/ui/accordion';
  import { 
    Pencil, 
    Trash2, 
    CreditCard, 
    Home, 
    Shield,
    ChevronDown,
    Calendar,
    MapPin,
    Users,
    FileText,
    DollarSign,
    AlertTriangle,
    Printer
  } from 'lucide-svelte';
  import type { Lease, Billing } from '$lib/types/lease';
  import { printLeaseInvoice } from '$lib/utils/print';

  interface Props {
    lease: Lease;
    tenants?: any[];
    rentalUnits?: any[];
    onLeaseClick: (lease: Lease) => void;
    onDelete: (event: Event, lease: Lease) => void;
    onStatusChange: (id: string, status: string) => void;
  }

  let { lease, tenants = [], rentalUnits = [], onLeaseClick, onDelete, onStatusChange }: Props = $props();

  import {
    formatDate,
    formatCurrency,
    getStatusVariant,
    getBillingStatusColor,
    getDisplayStatus
  } from '$lib/utils/format';

  let selectedBillingType = $state<'RENT' | 'UTILITY' | 'PENALTY' | 'SECURITY_DEPOST'>('RENT');

  function getBillingSummary(billings: Billing[] = []): Record<string, { total: number; unpaid: number }> {
    return billings.reduce(
      (acc, billing) => {
        const type = billing.type || 'Other';
        if (!acc[type]) {
          acc[type] = { total: 0, unpaid: 0 };
        }
        const totalAmount = billing.amount + (billing.penalty_amount || 0);
        acc[type].total += totalAmount;
        acc[type].unpaid += totalAmount - billing.paid_amount;
        return acc;
      },
      {} as Record<string, { total: number; unpaid: number }>
    );
  }

  function sortBillingsByDueDate(billings: Billing[]): Billing[] {
    if (!billings) return [];
    return [...billings].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }

  let sortedBillings = $derived(sortBillingsByDueDate(lease.billings || []));
  let totalPenalty = $derived(lease.billings?.reduce((acc, b) => acc + (b.penalty_amount || 0), 0) || 0);

  let showPaymentModal = $state(false);
  let showRentManager = $state(false);
  let showSecurityDepositManager = $state(false);
  let showEditModal = $state(false);
  async function handlePaymentModalClose() {
    showPaymentModal = false;
    await invalidateAll();
  }
  async function handleRentManagerClose() {
    showRentManager = false;
    await invalidateAll();
  }
  async function handleSecurityDepositManagerClose() {
    showSecurityDepositManager = false;
    await invalidateAll();
  }

  async function handleEditModalClose() {
    showEditModal = false;
    await invalidateAll();
  }

  const dispatch = createEventDispatcher<{
    delete: { id: string };
    statusChange: { id: string; status: string };
  }>();

  let isEditing = $state(false);
  let editedName = $state('');

  function handleLeaseNameDoubleClick() {
    isEditing = true;
    editedName = lease.name || `Lease #${lease.id}`;
  }

  async function handleNameSubmit() {
    try {
      const formData = new FormData();
      formData.append('id', lease.id.toString());
      formData.append('name', editedName);

      const response = await fetch('?/updateName', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update lease name');
      }
      lease.name = editedName;
      isEditing = false;
      await invalidateAll();
    } catch (error) {
      console.error('Error updating lease name:', error);
      isEditing = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleNameSubmit();
    } else if (event.key === 'Escape') {
      isEditing = false;
    }
  }

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

<AccordionPrimitive.Root type="single" class="border-none">
  <AccordionPrimitive.Item value="item-1" class="w-full border-none">
    <Card.Root class="group hover:shadow-lg transition-all duration-300 w-full border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl overflow-hidden">
      <AccordionPrimitive.Trigger class="lease-trigger w-full py-6 px-6 border-t border-slate-200/40 hover:bg-slate-50/50 transition-colors duration-200">
        <!-- Main Row -->
        <div class="flex flex-col lg:flex-row lg:items-center w-full gap-4 lg:gap-6">
          <!-- Left: Name and Status - 1/3 width on desktop, full on mobile -->
          <div class="w-full lg:w-1/3 flex flex-col gap-2">
            {#if isEditing}
              <Input
                type="text"
                bind:value={editedName}
                class="w-full h-9 text-lg font-semibold"
                onblur={handleNameSubmit}
                onkeydown={handleKeyDown}
                autofocus
              />
            {:else}
              <div class="flex items-center gap-2 group/name min-w-0">
                <span 
                  class="text-xl font-bold cursor-pointer hover:text-primary truncate text-slate-800 transition-colors"
                  ondblclick={handleLeaseNameDoubleClick}
                  role="button"
                  tabindex="0"
                >
                  {lease.name || `Lease #${lease.id}`}
                </span>
                <button 
                  class="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
                  onclick={(e) => {
                    e.stopPropagation();
                    handleLeaseNameDoubleClick();
                  }}
                >
                  <Pencil class="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              </div>
            {/if}

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

          <!-- Middle: Balance Card - 1/3 width on desktop, full on mobile -->
          <div class="w-full lg:w-1/3 flex items-center justify-center">
            <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/60 shadow-sm w-full max-w-sm">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <DollarSign class="w-4 h-4 text-slate-500" />
                  <span class="text-sm font-medium text-slate-600">BALANCE</span>
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
      </AccordionPrimitive.Trigger>

      <AccordionPrimitive.Content class="accordion-content">
        <Card.Content class="px-4 sm:px-6 pb-6 bg-gradient-to-b from-slate-50/30 to-white/50">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <!-- Column 1: Lease Details -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-200">
                <FileText class="w-4 h-4 text-slate-500" />
                <h3 class="text-sm font-semibold text-slate-700">Lease Details</h3>
              </div>
              <div class="space-y-4 text-sm">
                <div class="bg-slate-50/50 rounded-lg p-4 space-y-3">
                  <div class="flex items-start gap-3">
                    <MapPin class="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-slate-800">
                        Unit • Floor {lease.rental_unit?.floor?.floor_number} • Bedspacer
                      </div>
                      {#if lease.rental_unit?.property?.name}
                        <div class="text-slate-600 text-xs mt-1">
                          {lease.rental_unit.property.name}
                        </div>
                      {/if}
                    </div>
                  </div>

                  {#if lease.lease_tenants?.length}
                    <div class="flex items-start gap-3">
                      <Users class="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-800">
                          {lease.lease_tenants.length === 1 ? 'Tenant' : 'Tenants'}
                        </div>
                        <div class="text-slate-600 text-xs mt-1">
                          {lease.lease_tenants.map(lt => lt.name).filter(Boolean).join(', ') || 'No tenant names available'}
                        </div>
                      </div>
                    </div>
                  {/if}

                  <div class="flex items-start gap-3">
                    <Calendar class="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-slate-800">Lease Period</div>
                      <div class="text-slate-600 text-xs mt-1">
                        {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <FileText class="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-slate-800">Type</div>
                      <div class="text-slate-600 text-xs mt-1">
                        {lease.type || 'STANDARD'}
                      </div>
                    </div>
                  </div>

                  {#if lease.notes}
                    <div class="pt-2 border-t border-slate-200">
                      <div class="font-medium text-slate-800 text-xs mb-1">Notes</div>
                      <div class="text-slate-600 text-xs">{lease.notes}</div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Column 2: Billing Summary -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-200">
                <DollarSign class="w-4 h-4 text-slate-500" />
                <h3 class="text-sm font-semibold text-slate-700">Billing Summary</h3>
              </div>
              <div class="space-y-3">
                <!-- Overall Balance Card -->
                <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/60 shadow-sm">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-slate-600">
                      Overall Balance
                      {#if totalPenalty > 0}
                        <span class="text-xs text-muted-foreground block">(penalty-adjusted)</span>
                      {/if}
                    </span>
                    <span class={`text-lg font-bold ${
                      lease.balance > 0 
                        ? 'text-red-600' 
                        : lease.balance < 0 
                          ? 'text-green-600' 
                          : 'text-slate-600'
                    }`}>
                      {formatCurrency(lease.balance)}
                    </span>
                  </div>

                  {#if totalPenalty > 0}
                    <div class="flex justify-between items-center pt-2 border-t border-slate-200">
                      <div class="flex items-center gap-1">
                        <AlertTriangle class="w-3 h-3 text-red-500" />
                        <span class="text-sm text-red-600">Total Penalty</span>
                      </div>
                      <span class="font-medium text-red-600">{formatCurrency(totalPenalty)}</span>
                    </div>
                  {/if}
                </div>

                <!-- Billing Type Summaries -->
                <div class="space-y-2">
                  {#each Object.entries(getBillingSummary(lease.billings)) as [type, amounts] (type)}
                    <button
                      type="button"
                      class={`w-full flex justify-between items-center p-3 rounded-xl border transition-all duration-200 ${
                        selectedBillingType === type 
                          ? 'bg-primary/5 border-primary/20 shadow-sm' 
                          : 'bg-white/50 border-slate-200/60 hover:bg-slate-50/80 hover:border-slate-300/60'
                      }`}
                      onclick={() => (selectedBillingType = type as any)}
                      onkeydown={(e) => e.key === 'Enter' && (selectedBillingType = type as any)}
                      aria-label={`View ${type} billing details`}
                    >
                      <span class="font-medium text-slate-700">{type}</span>
                      <div class="text-right">
                        <div class="font-semibold text-slate-800">{formatCurrency(amounts.total)}</div>
                        {#if amounts.unpaid > 0}
                          <div class="text-xs text-red-500 font-medium">
                            Unpaid: {formatCurrency(amounts.unpaid)}
                          </div>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Column 3: Billing Details -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-200">
                <FileText class="w-4 h-4 text-slate-500" />
                <h3 class="text-sm font-semibold text-slate-700">{selectedBillingType} Details</h3>
              </div>
              <div class="space-y-3 max-h-[300px] overflow-y-auto">
                {#if lease.billings?.filter((b) => b.type === selectedBillingType).length}
                  <div class="space-y-3">
                    {#each sortedBillings.filter((b) => b.type === selectedBillingType) as billing}
                      {@const displayStatus = getDisplayStatus(billing)}
                      <div class="bg-white/60 rounded-xl p-4 border border-slate-200/60 hover:shadow-sm transition-shadow">
                        <div class="flex justify-between items-start mb-3">
                          <div class="font-semibold text-slate-800">
                            {#if billing.status === 'PAID'}
                              Paid in Full
                            {:else}
                              {formatCurrency((billing.amount + (billing.penalty_amount || 0)) - billing.paid_amount)}
                            {/if}
                          </div>
                          <span class={`px-2 py-1 rounded-full text-xs font-medium ${getBillingStatusColor(displayStatus)}`}>
                            {displayStatus}
                          </span>
                        </div>
                        
                        <div class="space-y-2 text-xs text-slate-600">
                          <div class="flex items-center gap-2">
                            <Calendar class="w-3 h-3" />
                            <span>Due: {formatDate(billing.due_date)}</span>
                          </div>
                          
                          <div class="flex justify-between">
                            <span>Total Amount:</span>
                            <span class="font-medium">{formatCurrency(billing.amount)}</span>
                          </div>
                          
                          {#if billing.penalty_amount > 0}
                            <div class="flex justify-between text-red-600">
                              <span>Penalty:</span>
                              <span class="font-medium">+{formatCurrency(billing.penalty_amount)}</span>
                            </div>
                          {/if}
                        </div>

                        <!-- Payment History -->
                        {#if billing.allocations && billing.allocations.length > 0}
                          <div class="mt-3 pt-3 border-t border-slate-200">
                            <div class="text-xs font-medium text-slate-700 mb-2">Payment History</div>
                            {#each billing.allocations as allocation}
                              <div class="flex justify-between items-center text-xs text-slate-600 py-1">
                                <div class="flex items-center gap-2">
                                  <span>Paid: {formatCurrency(allocation.amount)}</span>
                                  {#if allocation.payment.method === 'SECURITY_DEPOSIT'}
                                    <span class="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Security Deposit</span>
                                  {/if}
                                </div>
                                <span>{formatDate(allocation.payment.paid_at)}</span>
                              </div>
                            {/each}
                          </div>
                        {/if}
                        
                        {#if billing.type === 'UTILITY' && billing.notes}
                          <div class="mt-3 pt-3 border-t border-slate-200">
                            <div class="text-xs font-medium text-slate-700 mb-1">Notes</div>
                            <div class="text-xs text-slate-600">{billing.notes}</div>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="text-center py-8 text-slate-500">
                    <FileText class="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p class="text-sm">No {selectedBillingType.toLowerCase()} billings available</p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </Card.Content>
      </AccordionPrimitive.Content>
    </Card.Root>
  </AccordionPrimitive.Item>
</AccordionPrimitive.Root>

<PaymentModal 
  lease={{...lease, id: lease.id.toString()}}
  isOpen={showPaymentModal}
  onOpenChange={handlePaymentModalClose}
/>

<RentManagerModal
  lease={lease}
  open={showRentManager}
  onOpenChange={handleRentManagerClose}
/>

<SecurityDepositModal
  lease={{...lease, id: lease.id.toString()}}
  open={showSecurityDepositManager}
  onOpenChange={handleSecurityDepositManagerClose}
/>

<LeaseFormModal
editMode
  lease={lease}
  tenants={tenants}
  rentalUnits={rentalUnits}
  open={showEditModal}
  onOpenChange={handleEditModalClose}
/>



<style>
  :global(.lease-trigger) {
    width: 100%;
    text-align: left;
    border-bottom: none;
    border-top: 1px solid hsl(var(--border) / 0.4);
    transition: all 0.3s ease;
  }

  :global(.lease-trigger:hover) {
    background: linear-gradient(135deg, hsl(var(--muted) / 0.2), hsl(var(--muted) / 0.05));
  }

  :global(.accordion-content) {
    overflow: hidden;
    background: linear-gradient(135deg, hsl(var(--background) / 0.9), hsl(var(--muted) / 0.05));
  }

  :global(.lease-trigger:focus-visible) {
    outline: 2px solid hsl(var(--primary));
    outline-offset: -2px;
    border-radius: 0.75rem;
  }

  :global(.card) {
    border: none !important;
    margin-bottom: 0 !important;
    backdrop-filter: blur(10px);
  }

  /* Custom scrollbar for billing details */
  :global(.max-h-\[300px\]::-webkit-scrollbar) {
    width: 4px;
  }

  :global(.max-h-\[300px\]::-webkit-scrollbar-track) {
    background: hsl(var(--muted) / 0.3);
    border-radius: 2px;
  }

  :global(.max-h-\[300px\]::-webkit-scrollbar-thumb) {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 2px;
  }

  :global(.max-h-\[300px\]::-webkit-scrollbar-thumb:hover) {
    background: hsl(var(--muted-foreground) / 0.5);
  }
</style>