<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { 
    AlertTriangle,
    TrendingUp,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Receipt
  } from 'lucide-svelte';
  import type { Lease, Billing } from '$lib/types/lease';
  import {
    formatCurrency,
    formatDate,
    getBillingStatusColor,
    getDisplayStatus
  } from '$lib/utils/format';

  interface Props {
    lease: Lease;
  }

  let { lease }: Props = $props();

  let selectedBillingType = $state<'RENT' | 'UTILITY' | 'PENALTY' | 'SECURITY_DEPOSIT'>('RENT');

  function getBillingSummary(billings: Billing[] = []): Record<string, { total: number; unpaid: number; count: number }> {
    return billings.reduce(
      (acc, billing) => {
        const type = billing.type || 'Other';
        if (!acc[type]) {
          acc[type] = { total: 0, unpaid: 0, count: 0 };
        }
        const totalAmount = billing.amount + (billing.penalty_amount || 0);
        acc[type].total += totalAmount;
        acc[type].unpaid += totalAmount - billing.paid_amount;
        acc[type].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; unpaid: number; count: number }>
    );
  }

  function sortBillingsByDueDate(billings: Billing[]): Billing[] {
    if (!billings) return [];
    return [...billings].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }

  function getOverdueBillings(billings: Billing[] = []): Billing[] {
    const today = new Date();
    return billings.filter(billing => {
      const dueDate = new Date(billing.due_date);
      const totalDue = billing.amount + (billing.penalty_amount || 0);
      const isFullyPaid = billing.paid_amount >= totalDue;
      return !isFullyPaid && dueDate < today;
    });
  }

  let sortedBillings = $derived(sortBillingsByDueDate(lease.billings || []));
  let overdueBillings = $derived(getOverdueBillings(lease.billings || []));
  
  let totalPenalty = $derived.by(() => {
    return lease.billings?.reduce((acc, b) => {
      const totalDue = b.amount + (b.penalty_amount || 0);
      const isFullyPaid = b.paid_amount >= totalDue;
      return acc + (isFullyPaid ? 0 : (b.penalty_amount || 0));
    }, 0) || 0;
  });

  let paymentStats = $derived.by(() => {
    const billings = lease.billings || [];
    const totalBillings = billings.length;
    const paidBillings = billings.filter(b => {
      const totalDue = b.amount + (b.penalty_amount || 0);
      return b.paid_amount >= totalDue;
    }).length;
    
    return {
      totalBillings,
      paidBillings,
      paymentRate: totalBillings > 0 ? (paidBillings / totalBillings) * 100 : 0
    };
  });

  function isBillingFullyPaid(billing: Billing): boolean {
    const totalDue = billing.amount + (billing.penalty_amount || 0);
    return billing.paid_amount >= totalDue;
  }

  function getBillingStatusIcon(billing: Billing) {
    if (isBillingFullyPaid(billing)) return CheckCircle;
    
    const dueDate = new Date(billing.due_date);
    const today = new Date();
    
    if (dueDate < today) return XCircle;
    return AlertCircle;
  }
</script>

<div class="p-6 space-y-6">
  <!-- Balance Overview -->
  <div class="bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="text-center">
        <div class={`text-3xl font-bold mb-2 ${
          lease.balance > 0 
            ? 'text-red-600' 
            : lease.balance < 0 
              ? 'text-green-600' 
              : 'text-slate-600'
        }`}>
          {formatCurrency(lease.balance)}
        </div>
        <div class="text-sm text-slate-600">Current Balance</div>
      </div>
      
      <div class="text-center">
        <div class="text-3xl font-bold text-red-600 mb-2">
          {formatCurrency(totalPenalty)}
        </div>
        <div class="text-sm text-slate-600 flex items-center justify-center gap-1">
          <AlertTriangle class="w-4 h-4 text-red-500" />
          Total Penalties
        </div>
      </div>
  
      <div class="text-center">
        <div class="text-3xl font-bold text-blue-600 mb-2">
          {paymentStats.paymentRate.toFixed(0)}%
        </div>
        <div class="text-sm text-slate-600 flex items-center justify-center gap-1">
          <TrendingUp class="w-4 h-4 text-blue-500" />
          Payment Rate
        </div>
      </div>
  
      <div class="text-center">
        <div class="text-3xl font-bold text-red-600 mb-2">
          {overdueBillings.length}
        </div>
        <div class="text-sm text-slate-600 flex items-center justify-center gap-1">
          <AlertTriangle class="w-4 h-4 text-red-500" />
          Overdue Payments
        </div>
        <div class="text-xs text-red-700 mt-1">
          Total: {formatCurrency(overdueBillings.reduce((sum, b) => sum + (b.amount + (b.penalty_amount || 0) - b.paid_amount), 0))}
        </div>
      </div>
    </div>
  </div>

  <!-- Billing Type Summary -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each Object.entries(getBillingSummary(lease.billings)) as [type, amounts] (type)}
    <button
      type="button"
      class="p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg"
      class:bg-blue-50={selectedBillingType === type}
      class:border-blue-300={selectedBillingType === type}
      class:shadow-md={selectedBillingType === type}
      class:bg-white={selectedBillingType !== type}
      class:border-slate-200={selectedBillingType !== type}
      class:hover:border-slate-300={selectedBillingType !== type}
      onclick={() => (selectedBillingType = type as 'RENT' | 'UTILITY' | 'PENALTY' | 'SECURITY_DEPOSIT')}
    >
      <div class="mb-1 font-semibold text-slate-800">{type}</div>
      <div class="mb-1 text-2xl font-bold text-slate-900">
        {formatCurrency(amounts.total)}
      </div>
      <div class="mb-2 text-xs text-slate-600">
        {amounts.count} billing{amounts.count !== 1 ? 's' : ''}
      </div>

      {#if amounts.unpaid > 0}
        <div class="text-sm font-medium text-red-600">
          Outstanding: {formatCurrency(amounts.unpaid)}
        </div>
      {:else}
        <div class="text-sm font-medium text-green-600">All paid</div>
      {/if}
    </button>
  {/each}
</div>

  <!-- Billing Details -->
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
      <h3 class="text-lg font-semibold text-slate-800">{selectedBillingType} Details</h3>
    </div>
    
    <div class="p-6">
      {#if lease.billings?.filter((b) => b.type === selectedBillingType).length}
        <div class="space-y-4 max-h-[400px] overflow-y-auto">
          {#each sortedBillings.filter((b) => b.type === selectedBillingType) as billing}
            {@const displayStatus = getDisplayStatus(billing)}
            {@const StatusIcon = getBillingStatusIcon(billing)}
            
            <div class="bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:shadow-sm transition-all">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <StatusIcon class={`w-5 h-5 ${
                    isBillingFullyPaid(billing) 
                      ? 'text-green-500' 
                      : new Date(billing.due_date) < new Date() 
                        ? 'text-red-500' 
                        : 'text-amber-500'
                  }`} />
                  <div>
                    <div class="font-semibold text-slate-800">
                      {formatCurrency((billing.amount + (billing.penalty_amount || 0)) - billing.paid_amount)}
                    </div>
                    <div class="text-sm text-slate-600">
                      Due: {formatDate(billing.due_date)}
                    </div>
                  </div>
                </div>
                <span class={`px-3 py-1 rounded-full text-xs font-medium ${getBillingStatusColor(displayStatus)}`}>
                  {displayStatus}
                </span>
              </div>
              
              <!-- Amount Breakdown -->
              <div class="bg-white rounded-lg p-3 mb-3">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div class="flex justify-between">
                    <span class="text-slate-600">Base Amount:</span>
                    <span class="font-medium">{formatCurrency(billing.amount)}</span>
                  </div>
                  {#if billing.penalty_amount > 0}
                    <div class="flex justify-between text-red-600">
                      <span>Penalty:</span>
                      <span class="font-medium">+{formatCurrency(billing.penalty_amount)}</span>
                    </div>
                  {/if}
                  <div class="flex justify-between">
                    <span class="text-slate-600">Paid:</span>
                    <span class="font-medium text-green-600">{formatCurrency(billing.paid_amount)}</span>
                  </div>
                  <div class="flex justify-between font-semibold border-t pt-2">
                    <span>Balance:</span>
                    <span class={billing.paid_amount >= (billing.amount + (billing.penalty_amount || 0)) ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency((billing.amount + (billing.penalty_amount || 0)) - billing.paid_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Payment History -->
              {#if billing.allocations && billing.allocations.length > 0}
                <div class="border-t border-slate-200 pt-3">
                  <div class="text-sm font-medium text-slate-700 mb-2">Payment History</div>
                  <div class="space-y-1">
                    {#each billing.allocations as allocation}
                      <div class="flex justify-between items-center text-sm bg-green-50 p-2 rounded">
                        <div class="flex items-center gap-2">
                          <Receipt class="w-3 h-3 text-green-600" />
                          <span>{formatCurrency(allocation.amount)}</span>
                          {#if allocation.payment?.method === 'SECURITY_DEPOSIT'}
                            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                              Security Deposit
                            </span>
                          {/if}
                        </div>
                        <span class="text-slate-600">{formatDate(allocation.payment?.paid_at || '')}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              {#if billing.notes}
                <div class="border-t border-slate-200 pt-3 mt-3">
                  <div class="text-sm font-medium text-slate-700 mb-1">Notes</div>
                  <div class="text-sm text-slate-600 bg-amber-50 p-2 rounded">{billing.notes}</div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-12 text-slate-500">
          <FileText class="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p class="text-lg font-medium mb-2">No {selectedBillingType.toLowerCase()} billings</p>
          <p class="text-sm">No billing records found for this category</p>
        </div>
      {/if}
    </div>
  </div>
</div> 