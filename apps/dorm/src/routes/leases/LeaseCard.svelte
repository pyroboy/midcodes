<script lang="ts">
  // Keep all the existing script code unchanged
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Accordion from '$lib/components/ui/accordion';
  
  // Keep all interfaces and functions from before
  interface BillingBreakdown {
      type: string;
      total: number;
      unpaidAmount: number;
  }
  
interface LeasePaymentSchedule {
    due_date: string;
    expected_amount: number;
}

interface LeaseBilling {
    type: string;
    amount: number;
    paid_amount: number;
    status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING';
}

interface Lease {
    id: string;
    name?: string;
    status: string;
    rental_unit?: {
        rental_unit_number: string;
        floor?: {
            floor_number: string;
            wing?: string;
        };
        property?: {
            name: string;
        }
    };
    type: string;
    start_date: string;
    end_date: string;
    rent_amount: number;
    security_deposit: number;
    lease_tenants?: Array<{
            name: string;
            contact_number?: string;
            email?: string;
    }>;
    notes?: string;
    balance: number;
    billings?: LeaseBilling[];
    payment_schedules?: LeasePaymentSchedule[];
}


  
  interface Props {
      lease: Lease;
      onLeaseClick: (lease: Lease) => void;
      onDelete: (event: Event, lease: Lease) => void;
  }
  
  let { lease, onLeaseClick, onDelete }: Props = $props();
console.log('LeaseCard.svelte', JSON.parse(JSON.stringify({lease})));
  // Keep all utility functions from before
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

  function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
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

  function getBillingBreakdown(billings: any[] = []): BillingBreakdown[] {
    const breakdown: { [key: string]: BillingBreakdown } = {};
    
    billings.forEach(billing => {
      const type = billing.type || 'Other';
      if (!breakdown[type]) {
        breakdown[type] = {
          type,
          total: 0,
          unpaidAmount: 0
        };
      }
      
      const amount = Number(billing.amount) || 0;
      const paidAmount = Number(billing.paid_amount) || 0;
      
      breakdown[type].total += amount;
      breakdown[type].unpaidAmount += (amount - paidAmount);
    });
    
    return Object.values(breakdown);
  }
  
  function formatScheduleDate(date: string) {
      return new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
      });
  }
  
  function getPaymentStatusColor(status: string) {
      switch (status) {
          case 'PAID': return 'bg-green-100 text-green-800';
          case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
          case 'OVERDUE': return 'bg-red-100 text-red-800';
          case 'PENDING':
          default: return 'bg-gray-100 text-gray-800';
      }
  }
  
  function getBillingStatusColor(status: string) {
      return getPaymentStatusColor(status);
  }
  
  function formatUtilityType(type: string | null) {
      if (!type) return '';
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
  
  function calculateBalanceBreakdown(billings: any[]): BillingBreakdown[] {
      if (!billings?.length) return [];
      
      const breakdown = billings.reduce((acc: Record<string, BillingBreakdown>, billing: any) => {
          const type = billing.type;
          if (!acc[type]) {
              acc[type] = {
                  type,
                  total: 0,
                  unpaidAmount: 0
              };
          }
          acc[type].total += billing.amount;
          if (billing.status !== 'PAID') {
              acc[type].unpaidAmount += billing.amount;
          }
          return acc;
      }, {});
  
      return Object.values(breakdown);
  }

  // Add selected billing type state
  let selectedBillingType = $state<'RENT' | 'UTILITY' | 'PENALTY'>('RENT');

  // Add billing summary calculation
  function getBillingSummary(billings: LeaseBilling[] = []) {
    return billings.reduce((acc, billing) => {
      const type = billing.type;
      if (!acc[type]) {
        acc[type] = { total: 0, unpaid: 0 };
      }
      acc[type].total += billing.amount;
      acc[type].unpaid += billing.amount - (billing.paid_amount || 0);
      return acc;
    }, {} as Record<string, { total: number; unpaid: number }>);
  }
  </script>
  
  <Card.Root class="hover:bg-gray-50">
      <Card.Header class="pb-2">
          <div class="flex justify-between items-center mb-2">
              <Card.Title class="text-lg font-semibold flex items-center gap-2">
                  {lease.name || `Lease #${lease.id}`}
                  <Badge variant={getStatusVariant(lease.status)} class="text-xs">
                      {lease.status || 'INACTIVE'}
                  </Badge>
              </Card.Title>
              <Button 
                  size="sm" 
                  variant="destructive" 
                  onclick={(e) => onDelete(e, lease)}
                  class="h-8"
              >
                  Delete
              </Button>
          </div>
          <div class="text-sm text-gray-600">
            {#if lease.rental_unit?.rental_unit_number}
              <p>
                Unit {lease.rental_unit.rental_unit_number}
                {#if lease.rental_unit.floor?.floor_number}
                  • Floor {lease.rental_unit.floor.floor_number}
                  {#if lease.rental_unit.floor.wing}
                    • Wing {lease.rental_unit.floor.wing}
                  {/if}
                {/if}
              </p>
            {/if}
            {#if lease.lease_tenants?.length}
              <p class="mt-1">
                Tenant{lease.lease_tenants.length > 1 ? 's' : ''}: 
                {lease.lease_tenants
                  .map(lt => lt?.name || 'Unnamed Tenant')
                  .join(', ')}
              </p>
            {/if}
          </div>
      </Card.Header>

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
                    <div class="flex justify-between items-center border-t border-b py-1 my-1">
                      <span class="text-gray-500">Overall Balance</span>
                      <span class={`font-medium ${lease.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(lease.balance)}
                      </span>
                    </div>

                    <!-- Billing Type Summaries -->
                    {#each Object.entries(getBillingSummary(lease.billings)) as [type, amounts]}
                      <div 
                        class="flex justify-between items-center py-1 cursor-pointer hover:bg-gray-100 rounded px-2"
                        onclick={() => selectedBillingType = type as any}
                      >
                        <span class="text-gray-500">{type}</span>
                        <div class="text-right">
                          <div>{formatCurrency(amounts.total)}</div>
                          {#if amounts.unpaid > 0}
                            <div class="text-xs text-red-500">Unpaid: {formatCurrency(amounts.unpaid)}</div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Column 3: Billing Details -->
              <div class="space-y-3">
                <h3 class="text-sm font-semibold pb-1 border-b">{selectedBillingType} Billings</h3>
                <div class="space-y-2 max-h-[200px] overflow-y-auto">
                  {#if lease.billings?.filter(b => b.type === selectedBillingType).length}
                    <div class="text-sm">
                      {#each lease.billings.filter(b => b.type === selectedBillingType) as billing}
                        <div class="flex justify-between items-center py-1">
                          <span class="text-gray-500">{formatCurrency(billing.amount)}</span>
                          <span class={`px-2 py-0.5 rounded-full text-xs ${getBillingStatusColor(billing.status)}`}>
                            {billing.status}
                          </span>
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
  </Card.Root>