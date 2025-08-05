<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Input } from '$lib/components/ui/input';
  import { 
    Pencil, 
    Home, 
    DollarSign,
    Clock,
    Copy
  } from 'lucide-svelte';
  import type { Lease } from '$lib/types/lease';
  import { invalidateAll } from '$app/navigation';
  import { getStatusVariant, formatCurrency } from '$lib/utils/format';
  import LeaseOverviewTab from './LeaseOverviewTab.svelte';
  import LeaseBillingTab from './LeaseBillingTab.svelte';
  import LeaseHistoryTab from './LeaseHistoryTab.svelte';

  interface Props {
    lease: Lease;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }

  let { lease, open, onOpenChange }: Props = $props();

  let isEditingName = $state(false);
  let editedName = $state('');
  let activeTab = $state<'overview' | 'billing' | 'history'>('overview');

  // Computed values for header stats - only calculate when modal is open
  let overdueBillings = $derived.by(() => {
    if (!open) return [];
    const today = new Date();
    return (lease.billings || []).filter(billing => {
      const dueDate = new Date(billing.due_date);
      const totalDue = billing.amount + (billing.penalty_amount || 0);
      const isFullyPaid = billing.paid_amount >= totalDue;
      return !isFullyPaid && dueDate < today;
    });
  });

  let paymentStats = $derived.by(() => {
    if (!open) return { totalBillings: 0, paidBillings: 0 };
    const billings = lease.billings || [];
    const totalBillings = billings.length;
    const paidBillings = billings.filter(b => {
      const totalDue = b.amount + (b.penalty_amount || 0);
      return b.paid_amount >= totalDue;
    }).length;
    
    return {
      totalBillings,
      paidBillings,
    };
  });

  function handleLeaseNameDoubleClick() {
    isEditingName = true;
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
      isEditingName = false;
      await invalidateAll();
    } catch (error) {
      console.error('Error updating lease name:', error);
      isEditingName = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleNameSubmit();
    } else if (event.key === 'Escape') {
      isEditingName = false;
    }
  }

  async function handleModalClose() {
    onOpenChange(false);
    // Remove the invalidateAll call here as it's not necessary for just closing the modal
    // and can cause performance issues
  }

  function copyLeaseId() {
    navigator.clipboard.writeText(lease.id.toString());
  }
</script>

<Dialog.Root {open} onOpenChange={onOpenChange}>
  <Dialog.Content class="max-w-5xl max-h-[95vh] overflow-hidden p-0">
    <!-- Header -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          {#if isEditingName}
            <Input
              type="text"
              bind:value={editedName}
              class="text-2xl font-bold bg-white/10 border-white/20 text-white placeholder:text-white/60"
              onblur={handleNameSubmit}
              onkeydown={handleKeyDown}
              autofocus
            />
          {:else}
            <div class="group flex items-center gap-3">
              <button 
                class="text-2xl font-bold cursor-pointer hover:text-blue-200 transition-colors bg-transparent border-none p-0 text-left"
                ondblclick={handleLeaseNameDoubleClick}
              >
                {lease.name || `Lease #${lease.id}`}
              </button>
              <button 
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
                onclick={(e) => {
                  e.stopPropagation();
                  handleLeaseNameDoubleClick();
                }}
              >
                <Pencil class="w-4 h-4" />
              </button>
            </div>
          {/if}
          
          <div class="flex items-center gap-4 mt-3">
            <button 
              onclick={copyLeaseId}
              class="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <span>ID: {lease.id}</span>
              <Copy class="w-3 h-3" />
            </button>
            <Badge variant={getStatusVariant(lease.status?.toString() || 'INACTIVE')} class="text-sm">
              {lease.status?.toString() || 'INACTIVE'}
            </Badge>
          </div>
        </div>

        
      </div>

      <!-- Navigation Tabs -->
      <div class="flex gap-1 mt-6 bg-white/10 p-1 rounded-lg">
        <button
          class={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'overview' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          onclick={() => activeTab = 'overview'}
        >
          <Home class="w-4 h-4" />
          Overview
        </button>
        <button
          class={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'billing' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          onclick={() => activeTab = 'billing'}
        >
          <DollarSign class="w-4 h-4" />
          Billing
          {#if overdueBillings.length > 0}
            <span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {overdueBillings.length}
            </span>
          {/if}
        </button>
        <button
          class={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'history' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          onclick={() => activeTab = 'history'}
        >
          <Clock class="w-4 h-4" />
          History
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="overflow-y-auto h-[calc(95vh-280px)]">
      {#if open}
        {#if activeTab === 'overview'}
          <LeaseOverviewTab {lease} />
        {:else if activeTab === 'billing'}
          <LeaseBillingTab {lease} />
        {:else if activeTab === 'history'}
          <LeaseHistoryTab {lease} />
        {/if}
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>