<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import PaymentModal from './PaymentModal.svelte';
  import RentManagerModal from './RentManagerModal.svelte';
  import { invalidateAll } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';
  import { Input } from '$lib/components/ui/input';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { leaseStatusEnum } from './formSchema';
  import * as AccordionPrimitive from '$lib/components/ui/accordion';
  import { Pencil, Trash2 } from 'lucide-svelte';
  import type { Lease, Billing } from '$lib/types/lease';

  interface BillingBreakdown {
    type: string;
    total: number;
    unpaidAmount: number;
  }

  interface Props {
    lease: Lease;
    onLeaseClick: (lease: Lease) => void;
    onDelete: (event: Event, lease: Lease) => void;
    onStatusChange: (id: string, status: string) => void;
  }

  let { lease, onLeaseClick, onDelete, onStatusChange }: Props = $props();

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  }

  function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'TERMINATED':
        return 'destructive';
      case 'EXPIRED':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  function getBillingStatusColor(status: string) {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      PENALIZED: 'bg-red-200 text-red-900',
      'OVERDUE-PARTIAL': 'bg-orange-200 text-orange-900'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getDisplayStatus(billing: Billing): string {
    if (billing.balance <= 0) {
      return 'PAID';
    }
    if (billing.penalty_amount > 0) {
      return 'PENALIZED';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = new Date(billing.due_date) < today;

    if (isOverdue) {
      if (billing.status === 'PARTIAL') {
        return 'OVERDUE-PARTIAL';
      }
      return 'OVERDUE';
    }

    return billing.status; // PENDING or PARTIAL
  }

  let selectedBillingType = $state<'RENT' | 'UTILITY' | 'PENALTY' | 'Other'>('RENT');

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

  async function handlePaymentModalClose() {
    showPaymentModal = false;
    await invalidateAll();
  }
  async function handleRentManagerClose() {
    showRentManager = false;
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
      // Optionally show a toast notification here
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
    <Card.Root class="hover:bg-gray-50 w-full border-0">
      <AccordionPrimitive.Trigger class="w-full py-4 px-4 border-t">
        <!-- Main Row -->
        <div class="flex items-center w-full">
          <!-- Left: Name and Status -->
          <div class="flex items-center gap-2 flex-[2]">
            {#if isEditing}
              <Input
                type="text"
                bind:value={editedName}
                class="w-48"
                onblur={handleNameSubmit}
                onkeydown={handleKeyDown}
                autofocus
              />
            {:else}
              <div class="flex items-center gap-1 group">
                <span 
                  class="text-lg font-semibold cursor-pointer hover:text-primary truncate"
                  ondblclick={handleLeaseNameDoubleClick}
                  role="button"
                  tabindex="0"
                >
                  {lease.name || `Lease #${lease.id}`}
                </span>
                <button 
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                  onclick={(e) => {
                    e.stopPropagation();
                    handleLeaseNameDoubleClick();
                  }}
                >
                  <Pencil class="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            {/if}

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Badge 
                  variant={getStatusVariant(lease.status?.toString() || 'INACTIVE')} 
                  class="text-xs cursor-pointer hover:opacity-80"
                >
                  {lease.status?.toString() || 'INACTIVE'}
                </Badge>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content class="w-40">
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

          <!-- Middle: Details -->
          <div class="flex flex-col flex-1">
            <div class="text-sm text-gray-600">
              Unit • Floor {lease.rental_unit?.floor?.floor_number} • bedspacer
            </div>
            {#if lease.lease_tenants?.length}
              <div class="text-sm text-gray-600">
                Tenant: {lease.lease_tenants[0]?.name || 'Unnamed Tenant'}
              </div>
            {/if}
          </div>

          <!-- Right: Balance and Actions -->
          <div class="flex items-end gap-4 flex-1 justify-end">
            <div class="flex flex-col items-end gap-2">
              <div class="w-full flex justify-between items-center py-1.5 border-b">
                <span class="text-gray-500">
                  Overall Balance
     
                </span>
                <span class={`font-medium ${lease.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(lease.balance)}
                </span>
              </div>

          
                 <div class="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onclick={(e) => {
                    e.stopPropagation();
                    showPaymentModal = true;
                  }}
                  class="h-8"
                >
                  Make Payment
                </Button>
                  <Button variant="outline" class="h-8" 
                  onclick={(e) => {
                    e.stopPropagation(); 
                    showRentManager = true;
                  }}>
                    Modify Rents
                  </Button>
              </div>
            </div>
            <Button 
              size="icon"
              variant="ghost"
              onclick={(e) => {
                e.stopPropagation();
                onDelete(e, lease);
              }}
              class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </AccordionPrimitive.Trigger>

      <AccordionPrimitive.Content>
        <Card.Content>
          <div class="grid grid-cols-3 gap-4">
            <!-- Column 1: Lease Details -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold pb-1 border-b">Lease Details</h3>
              <div class="space-y-2 text-sm">
                {#if lease.rental_unit?.property?.name}
                  <div>
                    <p class="text-gray-500">Property</p>
                    <p class="font-medium">{lease.rental_unit.property.name}</p>
                  </div>
                {/if}
                <div>
                  <p class="text-gray-500">Type</p>
                  <p class="font-medium">{lease.type || 'STANDARD'}</p>
                </div>
                <div>
                  <p class="text-gray-500">Period</p>
                  <p class="font-medium">{formatDate(lease.start_date)} - {formatDate(lease.end_date)}</p>
                </div>
                {#if lease.notes}
                  <div class="pt-2">
                    <p class="text-gray-500">Notes</p>
                    <p class="font-medium">{lease.notes}</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Column 2: Billing Summary -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold pb-1 border-b">Billing Summary</h3>
              <div class="space-y-2">
                <div class="text-sm">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-500">Security Deposit</span>
                    <span class="font-medium">{formatCurrency(lease.security_deposit)}</span>
                  </div>
                  
                  <!-- Overall Balance -->
                  <div class="w-full flex justify-between items-center py-1.5 border-b">
                    <span class="text-gray-500">
                      Overall Balance
                      {#if totalPenalty > 0}
                        <span class="text-xs text-muted-foreground">(penalty-adjusted)</span>
                      {/if}
                    </span>
                    <span class={`font-medium ${lease.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(lease.balance)}
                    </span>
                  </div>

                  {#if totalPenalty > 0}
                    <div class="w-full flex justify-between items-center py-1.5 border-b text-red-500">
                      <span class="text-sm">Total Penalty</span>
                      <span class="font-medium">{formatCurrency(totalPenalty)}</span>
                    </div>
                  {/if}

                  <!-- Billing Type Summaries -->
                  {#each Object.entries(getBillingSummary(lease.billings)) as [type, amounts] (type)}
                    <button
                      type="button"
                      class="w-full flex justify-between items-center py-1 cursor-pointer hover:bg-gray-100 rounded px-2"
                      onclick={() => (selectedBillingType = type as any)}
                      onkeydown={(e) => e.key === 'Enter' && (selectedBillingType = type as any)}
                      aria-label={`View ${type} billing details`}
                    >
                      <span class="text-gray-500">{type}</span>
                      <div class="text-right">
                        <div>{formatCurrency(amounts.total)}</div>
                        {#if amounts.unpaid > 0}
                          <div class="text-xs text-red-500">Unpaid: {formatCurrency(amounts.unpaid)}</div>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Column 3: Billing Details -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold pb-1 border-b">{selectedBillingType} Billings</h3>
              <div class="space-y-2 max-h-[200px] overflow-y-auto">
                {#if lease.billings?.filter((b) => b.type === selectedBillingType).length}
                  <div class="text-sm">
                    {#each sortedBillings.filter((b) => b.type === selectedBillingType) as billing}
                      {@const displayStatus = getDisplayStatus(billing)}
                      <div class="flex flex-col py-1 border-b last:border-0">
                        <div class="flex-1">
                          <div class="flex justify-between items-center">
                            <span class="font-medium">
                              {#if billing.status === 'PAID'}
                                Paid
                              {:else}
                                {formatCurrency((billing.amount + (billing.penalty_amount || 0)) - billing.paid_amount)}
                              {/if}
                            </span>
                            <span class={`px-2 py-0.5 rounded-full text-xs ${getBillingStatusColor(displayStatus)}`}>
                              {displayStatus}
                            </span>
                          </div>
                          <div class="text-xs text-gray-500 mt-1">
                            <span>Due: {formatDate(billing.due_date)}</span>
                          </div>
                          <div class="text-xs text-gray-500">
                            Total: {formatCurrency(billing.amount)}
                            {#if billing.penalty_amount > 0}
                              <span class="text-red-500">(+ {formatCurrency(billing.penalty_amount)} penalty)</span>
                            {/if}
                          </div>

                          <!-- Payment History -->
                          {#if billing.allocations && billing.allocations.length > 0}
                            <div class="mt-2 pt-1 border-t border-dashed">
                              {#each billing.allocations as allocation}
                                <div class="text-xs text-gray-600 flex justify-between">
                                  <span>Paid: {formatCurrency(allocation.amount)}</span>
                                  <span>{formatDate(allocation.payment.paid_at)}</span>
                                </div>
                              {/each}
                            </div>
                          {/if}
                          {#if billing.type === 'UTILITY' && billing.notes}
                            <div class="text-xs text-gray-500 pt-1">
                              Notes: {billing.notes}
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/each}


                  </div>
                {:else}
                  <p class="text-sm text-gray-500">No {selectedBillingType.toLowerCase()} billings available</p>
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
<style>
  :global(.accordion-trigger) {
    width: 100%;
    text-align: left;
    border-bottom: none;
    border-top: 1px solid hsl(var(--border));
  }

  :global(.accordion-content) {
    overflow: hidden;
  }

  :global(.accordion-trigger:focus-visible) {
    outline: none;
  }

  :global(.accordion-trigger:hover) {
    background-color: hsl(var(--muted));
  }

  :global(.card) {
    border: none !important;
    margin-bottom: 0 !important;
  }
</style>