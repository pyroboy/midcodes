<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { toast } from 'svelte-sonner';
  import type { Lease, Billing } from '$lib/types/lease';
  import { invalidate } from '$app/navigation';
  import { Trash2, Plus } from 'lucide-svelte';

  let { lease, open, onOpenChange } = $props<{
    lease: Lease;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>();

  let securityDeposits = $state<Billing[]>([]);
  let isLoading = $state(false);
  let editingDeposit = $state<Partial<Billing> | null>(null);
  let showAddForm = $state(false);

  // Form state for new/edit deposit
  let formData = $state({
    amount: 0,
    due_date: '',
    billing_date: '',
    notes: ''
  });

  const resetForm = () => {
    formData = {
      amount: 0,
      due_date: '',
      billing_date: '',
      notes: ''
    };
    editingDeposit = null;
    showAddForm = false;
  };

  const loadSecurityDeposits = () => {
    // Filter existing billings for security deposits (type 'OTHER' with security deposit context)
      securityDeposits = lease.billings?.filter((b: Billing) =>
    b.type === 'SECURITY_DEPOSIT' && (b.notes?.toLowerCase().includes('security') || b.notes?.toLowerCase().includes('deposit'))
    ) || [];
  };

  const startEdit = (deposit: Billing) => {
    editingDeposit = deposit;
    formData = {
      amount: deposit.amount,
      due_date: deposit.due_date.split('T')[0],
      billing_date: deposit.billing_date.split('T')[0],
      notes: deposit.notes || ''
    };
    showAddForm = true;
  };

  const startAdd = () => {
    editingDeposit = null;
    resetForm();
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    formData.billing_date = today;
    formData.due_date = today;
    formData.notes = 'Security Deposit';
    showAddForm = true;
  };

  const saveBilling = async () => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.due_date || !formData.billing_date) {
      toast.error('Please enter both billing date and due date');
      return;
    }

    isLoading = true;
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('lease_id', lease.id);
      formDataToSubmit.append('action', editingDeposit ? 'update' : 'create');
      if (editingDeposit) {
        formDataToSubmit.append('billing_id', editingDeposit?.id?.toString() || '');
      }
      formDataToSubmit.append('type', 'SECURITY_DEPOSIT');
      formDataToSubmit.append('amount', formData.amount.toString());
      formDataToSubmit.append('due_date', formData.due_date);
      formDataToSubmit.append('billing_date', formData.billing_date);
      formDataToSubmit.append('notes', formData.notes || 'Security Deposit');

      const response = await fetch('?/manageSecurityDepositBillings', {
        method: 'POST',
        body: formDataToSubmit
      });

      if (!response.ok) {
        throw new Error('Failed to save security deposit billing');
      }

      toast.success(editingDeposit ? 'Security deposit updated successfully' : 'Security deposit added successfully');
      await invalidate('leases:all');
      resetForm();
      
      // Reload deposits after save
      setTimeout(() => {
        loadSecurityDeposits();
      }, 100);
    } catch (error) {
      console.error('Error saving security deposit:', error);
      toast.error('Failed to save security deposit');
    } finally {
      isLoading = false;
    }
  };

  const deleteBilling = async (billingId: number) => {
    if (!confirm('Are you sure you want to delete this security deposit billing?')) {
      return;
    }

    isLoading = true;
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('action', 'delete');
      formDataToSubmit.append('billing_id', billingId.toString());

      const response = await fetch('?/manageSecurityDepositBillings', {
        method: 'POST',
        body: formDataToSubmit
      });

      if (!response.ok) {
        throw new Error('Failed to delete security deposit billing');
      }

      toast.success('Security deposit deleted successfully');
      await invalidate('leases:all');
      
      // Reload deposits after delete
      setTimeout(() => {
        loadSecurityDeposits();
      }, 100);
    } catch (error) {
      console.error('Error deleting security deposit:', error);
      toast.error('Failed to delete security deposit');
    } finally {
      isLoading = false;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate security deposit usage (when security deposit money is used for other billings)
  let securityDepositUsage = $derived(() => {
    const usage: any[] = [];
    const allBillings = lease.billings || [];
    
    allBillings.forEach((billing: any) => {
      if (billing.type !== 'SECURITY_DEPOSIT' && billing.allocations) {
        billing.allocations.forEach((allocation: any) => {
          if (allocation.payment.method === 'SECURITY_DEPOSIT') {
            usage.push({
              billing: billing,
              amount: allocation.amount,
              date: allocation.payment.paid_at,
              method: allocation.payment.method,
              billingType: billing.type
            });
          }
        });
      }
    });
    
    return usage;
  });

  // Calculate security deposit totals
  let totalBilledSecurityDeposit = $derived(() => {
    return securityDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
  });

  let availableDeposit = $derived(() => {
    return securityDeposits.reduce((sum, deposit) => sum + deposit.paid_amount, 0);
  });

  let unpaidSecurityDeposit = $derived(() => {
    return securityDeposits.reduce((sum, deposit) => sum + deposit.balance, 0);
  });

  // Calculate amount used from security deposit for other billings
  let amountUsed = $derived(() => {
    // Calculate from all billings that have security deposit payments
    const allBillings = lease.billings || [];
    let totalUsed = 0;
    
    allBillings.forEach((billing: any) => {
      if (billing.type !== 'SECURITY_DEPOSIT' && billing.allocations) {
        billing.allocations.forEach((allocation: any) => {
          if (allocation.payment.method === 'SECURITY_DEPOSIT') {
            totalUsed += allocation.amount;
          }
        });
      }
    });
    
    return totalUsed;
  });

  // Load deposits when modal opens
  $effect(() => {
    if (open) {
      loadSecurityDeposits();
      resetForm();
    }
  });
</script>

<Dialog {open} onOpenChange={onOpenChange}>
  <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
    <DialogHeader class="pb-3">
      <DialogTitle class="text-lg">Security Deposit Manager - {lease.name}</DialogTitle>
      <DialogDescription class="text-sm">
        Manage security deposit billings for this lease
      </DialogDescription>
    </DialogHeader>

    <div class="space-y-4">
      <!-- Add New Button -->
      <div class="flex justify-between items-center">
        <h3 class="text-sm font-medium">Security Deposit Billings</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onclick={startAdd}
          disabled={isLoading}
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Security Deposit
        </Button>
      </div>

      <!-- Security Deposit Summary -->
      {#if securityDeposits.length > 0}
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <h4 class="font-medium text-blue-900 mb-2">Security Deposit Summary</h4>
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-blue-700">Total Billed Security Deposit:</span>
              <div class="font-medium">{formatCurrency(totalBilledSecurityDeposit())}</div>
            </div>
            <div>
              <span class="text-blue-700">Available Deposit:</span>
              <div class="font-medium">{formatCurrency(availableDeposit() - amountUsed())}</div>
            </div>
            <div>
              <span class="text-blue-700">Unpaid Security Deposit:</span>
              <div class="font-medium">{formatCurrency(unpaidSecurityDeposit())}</div>
            </div>
            <div>
              <span class="text-blue-700">Amount Used:</span>
              <div class="font-medium">{formatCurrency(amountUsed())}</div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Security Deposit Usage History -->
      {#if securityDepositUsage().length > 0}
        <div class="mb-4">
          <h4 class="font-medium mb-2">Usage History</h4>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            {#each securityDepositUsage() as usage}
              <div class="p-2 border rounded bg-white">
                <div class="flex items-center justify-between text-sm">
                  <div>
                    <span class="font-medium">{formatCurrency(usage.amount)}</span>
                    <span class="text-gray-600">for {usage.billingType}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Security Deposit</span>
                    <span class="text-gray-500">{formatDate(usage.date)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Existing Security Deposits List -->
      <div class="space-y-2 max-h-60 overflow-y-auto">
        {#if securityDeposits.length === 0}
          <div class="text-center py-8 text-gray-500">
            <p>No security deposit billings found</p>
            <p class="text-xs">Click "Add Security Deposit" to create one</p>
          </div>
        {:else}
          {#each securityDeposits as deposit}
            <div class="border rounded-lg p-3 bg-gray-50">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium">{formatCurrency(deposit.amount)}</span>
                    <span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(deposit.status)}`}>
                      {deposit.status}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600 space-y-1">
                    <div>Billing Date: {formatDate(deposit.billing_date)}</div>
                    <div>Due Date: {formatDate(deposit.due_date)}</div>
                    {#if deposit.notes}
                      <div>Notes: {deposit.notes}</div>
                    {/if}
                    <div>Balance: {formatCurrency(deposit.balance)}</div>
                    {#if deposit.paid_amount > 0}
                      <div class="text-green-600">Paid: {formatCurrency(deposit.paid_amount)}</div>
                    {/if}
                    {#if deposit.balance > 0}
                      <div class="text-red-600">Unpaid: {formatCurrency(deposit.balance)}</div>
                    {/if}
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onclick={() => startEdit(deposit)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onclick={() => deleteBilling(deposit.id)}
                    disabled={isLoading}
                    class="text-red-600 hover:text-red-700"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Add/Edit Form -->
      {#if showAddForm}
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium mb-3">
            {editingDeposit ? 'Edit Security Deposit' : 'Add New Security Deposit'}
          </h4>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="amount">Amount</Label>
              <Input 
                id="amount"
                type="number" 
                step="0.01"
                bind:value={formData.amount}
                placeholder="Enter amount"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label for="billing_date">Billing Date</Label>
              <Input 
                id="billing_date"
                type="date" 
                bind:value={formData.billing_date}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label for="due_date">Due Date</Label>
              <Input 
                id="due_date"
                type="date" 
                bind:value={formData.due_date}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label for="notes">Notes</Label>
              <Input 
                id="notes"
                bind:value={formData.notes}
                placeholder="Security Deposit"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onclick={resetForm}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onclick={saveBilling}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (editingDeposit ? 'Update' : 'Add')}
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </DialogContent>
</Dialog>
