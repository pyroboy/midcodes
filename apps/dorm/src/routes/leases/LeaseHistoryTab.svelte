<script lang="ts">
  import { 
    Clock,
    Receipt
  } from 'lucide-svelte';
  import type { Lease, Billing } from '$lib/types/lease';
  import { formatCurrency, formatDate } from '$lib/utils/format';

  interface Props {
    lease: Lease;
  }

  let { lease }: Props = $props();

  function sortBillingsByDueDate(billings: Billing[]): Billing[] {
    if (!billings) return [];
    return [...billings].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }

  let sortedBillings = $derived(sortBillingsByDueDate(lease.billings || []));
</script>

<div class="p-6">
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
      <h3 class="text-lg font-semibold text-slate-800">Payment History</h3>
    </div>
    
    <div class="p-6">
      {#if lease.billings && lease.billings.some(b => b.allocations && b.allocations.length > 0)}
        <div class="space-y-4 max-h-[500px] overflow-y-auto">
          {#each sortedBillings.filter(b => b.allocations && b.allocations.length > 0) as billing}
            {#each (billing.allocations || []) as allocation}
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex items-center gap-4">
                  <div class="p-2 bg-green-100 rounded-full">
                    <Receipt class="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800">
                      {formatCurrency(allocation.amount)}
                    </div>
                    <div class="text-sm text-slate-600">
                      Payment for {billing.type} • {formatDate(allocation.payment.paid_at)}
                    </div>
                    {#if allocation.payment.method === 'SECURITY_DEPOSIT'}
                      <span class="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        Security Deposit
                      </span>
                    {/if}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-slate-800">
                    {billing.type}
                  </div>
                  <div class="text-xs text-slate-600">
                    Due: {formatDate(billing.due_date)}
                  </div>
                </div>
              </div>
            {/each}
          {/each}
        </div>
      {:else}
        <div class="text-center py-12 text-slate-500">
          <Clock class="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p class="text-lg font-medium mb-2">No payment history</p>
          <p class="text-sm">No payments have been recorded for this lease</p>
        </div>
      {/if}
    </div>
  </div>
</div> 