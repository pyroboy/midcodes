<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { Badge } from "$lib/components/ui/badge";
  import { invalidateAll, invalidate } from "$app/navigation";

  interface Billing {
    id: number;
    amount: number;
    paid_amount: number;
    status: string;
    type: string;
    utility_type?: string;
    due_date: string;
  }

  const { lease, isOpen = false, onOpenChange } = $props<{
    lease: {
      id: string;
      name?: string;
      balance: number;
      billings?: Billing[];
    };
    isOpen?: boolean;
    onOpenChange: (open: boolean) => void;
  }>();

  type PaymentMethod = {
    value: 'CASH' | 'GCASH' | 'BANK_TRANSFER';
    label: string;
  };

  // Payment types with proper typing
  const paymentTypes: PaymentMethod[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'GCASH', label: 'GCash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
  ];

  let selectedPaymentType = $state<PaymentMethod['value']>('CASH');
  let paymentAmount = $state(0); // User input amount
  let selectedAmount = $state(0); // Total of selected billings
  let selectedBillings = $state<Set<number>>(new Set());
  let referenceNumber = $state('');

  function toggleBilling(billingId: number) {
    const newSelected = new Set(selectedBillings);
    if (newSelected.has(billingId)) {
      newSelected.delete(billingId);
    } else {
      newSelected.add(billingId);
    }
    selectedBillings = newSelected;
    updateSelectedAmount(); // Update selected amount when billings change
  }

  function updateSelectedAmount() {
    selectedAmount = lease.billings
      ?.filter((b: Billing) => selectedBillings.has(b.id) && b.status !== 'PAID')
      .reduce((sum: number, b: Billing) => sum + (b.amount - (b.paid_amount || 0)), 0) || 0;
      setExactAmount()
    // Initialize payment amount to match selected amount
    if (paymentAmount === 0) {
      paymentAmount = selectedAmount;
    }
  }

  // Fix the payment type selection
  function handlePaymentTypeChange(value: string) {
    selectedPaymentType = value as PaymentMethod['value'];
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    try {
      // Validate inputs
      if (!paymentAmount) throw new Error('Payment amount is required');
      if (!selectedPaymentType) throw new Error('Payment method is required');
      if (!selectedBillings.size) throw new Error('No billings selected');

      const paymentDetails = {
        amount: paymentAmount,
        method: selectedPaymentType,
        reference_number: referenceNumber,
        paid_by: lease.lease_tenants?.[0]?.tenant?.name || 'Unknown',
        paid_at: new Date().toISOString(),
        notes: `Payment for ${paymentAllocation.length} billing(s)`,
        billing_ids: paymentAllocation.map(({ billing }) => billing.id),
        billing_changes: paymentAllocation.reduce((acc, { billing, allocatedAmount }) => {
          acc[billing.id] = {
            previous_amount: billing.paid_amount || 0,
            new_amount: (billing.paid_amount || 0) + allocatedAmount,
            allocated_amount: allocatedAmount,
            previous_status: billing.status,
            new_status: allocatedAmount + (billing.paid_amount || 0) >= billing.amount ? 'PAID' : 'PARTIAL'
          };
          return acc;
        }, {} as Record<number, any>)
      };

      console.log('Submitting payment:', paymentDetails);

      // Create FormData and append the payment details
      const formData = new FormData();
      formData.append('paymentDetails', JSON.stringify(paymentDetails));

      const response = await fetch('?/submitPayment', {
        method: 'POST',
        body: formData  // Use our formData with paymentDetails
      });

      const result = await response.json();
      console.log('Server response details:', {
        status: response.status,
        ok: response.ok,
        result
      });

      // Check for success based on the actual response structure
      if (response.ok && result.type === 'success') {
        console.log('Payment processed successfully');
        await Promise.all([
          invalidate('app:leases'),
          invalidate('app:billings'),
          invalidateAll()
        ]);
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error) {
      console.error('Payment submission error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process payment');
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getBillingStatusColor(status: string) {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Add function to calculate payment allocation
  function calculatePaymentAllocation(amount: number, selectedBillings: Set<number>): Array<{
    billing: Billing;
    allocatedAmount: number;
    remainingBalance: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING';
  }> {
    let remainingPayment = amount;
    return lease.billings
      ?.filter((b: Billing) => selectedBillings.has(b.id) && b.status !== 'PAID')
      .map((billing: Billing) => {
        const unpaidAmount = billing.amount - (billing.paid_amount || 0);
        let allocatedAmount = Math.min(remainingPayment, unpaidAmount);
        remainingPayment -= allocatedAmount;

        return {
          billing,
          allocatedAmount,
          remainingBalance: unpaidAmount - allocatedAmount,
          status: allocatedAmount >= unpaidAmount ? 'PAID' 
                 : allocatedAmount > 0 ? 'PARTIAL' 
                 : 'PENDING'
        };
      }) || [];
  }

  // Add function to calculate total allocations needed
  function getTotalAllocationsNeeded(): number {
    return lease.billings
      ?.filter((b: Billing) => selectedBillings.has(b.id) && b.status !== 'PAID')
      .reduce((sum: number, b: Billing) => sum + (b.amount - (b.paid_amount || 0)), 0) || 0;
  }

  // Add function to get payment status styling
  function getPaymentAmountStyle(amount: number, totalNeeded: number): string {
    if (amount === 0) return '';
    if (amount >= totalNeeded) return 'text-green-600 dark:text-green-400';
    return 'text-yellow-600 dark:text-yellow-400';
  }

  // Add sorting function for billings
  function sortBillingsByDueDate(billings: Billing[]): Billing[] {
    return [...billings].sort((a, b) => 
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );
  }

  // Use in the template where we filter billings
  let sortedBillings = $derived(lease.billings ? sortBillingsByDueDate(lease.billings) : []);

  $effect(() => {
    // Update payment summary whenever amount or selection changes
    paymentAllocation = calculatePaymentAllocation(paymentAmount, selectedBillings);
  });

  let paymentAllocation = $state<ReturnType<typeof calculatePaymentAllocation>>([]);

  function handleAmountChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    paymentAmount = Number(value) || 0;
    // Recalculate allocation with user input amount
    paymentAllocation = calculatePaymentAllocation(paymentAmount, selectedBillings);
  }

  function setExactAmount() {
    paymentAmount = selectedAmount;
    // Recalculate allocation
    paymentAllocation = calculatePaymentAllocation(paymentAmount, selectedBillings);
  }

  function getBillingStatusText(billing: Billing): string {
    if (billing.status === 'PARTIAL') {
      return `${formatCurrency(billing.paid_amount)} of ${formatCurrency(billing.amount)}`;
    }
    return billing.status;
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
  <Dialog.Content class="sm:max-w-[1000px]">
    <Dialog.Header>
      <Dialog.Title>Make Payment</Dialog.Title>
      <Dialog.Description>
        Enter payment details for lease {lease?.name || `#${lease?.id}`}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={handleSubmit} class="space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <!-- Billings List -->
        <div class="border-r pr-4">
          <h3 class="font-medium mb-2">Outstanding Billings</h3>
          <div class="space-y-2 max-h-[400px] overflow-y-auto">
            {#if sortedBillings?.length}
              {#each sortedBillings.filter((b: Billing) => b.status !== 'PAID') as billing}
                <div class="p-2 border rounded hover:bg-muted/50">
                  <div class="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBillings.has(billing.id)}
                      onchange={() => toggleBilling(billing.id)}
                      class="mt-1"
                    />
                    <div class="flex-1">
                      <div class="flex justify-between items-start">
                        <div>
                          <div class="font-medium">{billing.type}</div>
                          <div class="text-sm text-muted-foreground">
                            Due: {formatDate(billing.due_date)}
                          </div>
                          <!-- {#if billing.status === 'PARTIAL'}
                            <div class="text-xs text-muted-foreground">
                              Paid Partial: {formatCurrency(billing.paid_amount)}
                            </div>
                          {/if} -->
                        </div>
                        <div class="text-right">
                          <div class="font-medium">Balance: {formatCurrency(billing.amount - (billing.paid_amount || 0))}</div>
                          <Badge class={getBillingStatusColor(billing.status)}>
                            {billing.status}
                          </Badge>
                        </div>
                      </div>
                      {#if billing.utility_type}
                        <div class="text-sm text-muted-foreground mt-1">
                          {billing.utility_type}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-center text-muted-foreground p-4">
                No outstanding billings
              </div>
            {/if}
          </div>
        </div>

        <!-- Payment Form -->
        <div class="space-y-4">
          <div class="space-y-4">
            <!-- Balance Display -->
            <div class="flex justify-between items-center py-2 px-3 bg-muted rounded-md">
              <span>Current Balance:</span>
              <span class="font-semibold text-lg">
                {new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: 'PHP'
                }).format(lease?.balance || 0)}
              </span>
            </div>
            <div class="flex justify-between items-center py-2 px-3 bg-muted rounded-md">
                <span>Selected Amount:</span>
                <span class="font-semibold text-lg">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>
            <!-- Fixed Payment Type Select -->
            <div class="grid gap-2">
              <Label for="payment-type">Payment Method</Label>
              <Select.Root 
                type="single"
                value={selectedPaymentType}
                onValueChange={handlePaymentTypeChange}
              >
                <Select.Trigger class="w-full">
                  {paymentTypes.find(t => t.value === selectedPaymentType)?.label || "Select payment method"}
                </Select.Trigger>
                <Select.Content>
                  {#each paymentTypes as type}
                    <Select.Item value={type.value}>{type.label}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <div class="grid gap-2">
                <Label for="reference">Reference Number</Label>
                <Input 
                  id="reference"
                  bind:value={referenceNumber}
                  placeholder="Enter reference number"
                />
              </div>
            </div>
            
            <!-- Make Amount Input Read-only since it's calculated -->
            <div class="grid gap-2">
              <Label for="amount">Amount</Label>
              <div class="flex gap-2">
                <Input 
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  oninput={handleAmountChange}
                  min="0"
                  max={lease?.balance || 0}
                  step="0.01"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onclick={setExactAmount}
                  disabled={!selectedAmount}
                >
                  Exact Amount
                </Button>
              </div>
            </div>

            <!-- Reference Number -->
   

        

        </div>

        <!-- Payment Summary -->
        <div class="border-l pl-4">
          <h3 class="font-medium mb-2">Payment Summary</h3>
          <div class="space-y-4">
            <!-- Total Amount -->
            <div class="p-3 bg-muted rounded-lg space-y-2">
              <div class="flex justify-between items-center">
                <span>Payment Amount:</span>
                <span class="font-semibold text-lg {getPaymentAmountStyle(paymentAmount, getTotalAllocationsNeeded())}">
                  {formatCurrency(paymentAmount)}
                </span>
              </div>
              {#if paymentAmount > 0}
                <div class="flex justify-between items-center text-sm">
                  <span>Total Selected:</span>
                  <span class="font-medium">{formatCurrency(getTotalAllocationsNeeded())}</span>
                </div>
                {#if paymentAmount >= getTotalAllocationsNeeded()}
                  <div class="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                    <span>Change:</span>
                    <span class="font-medium">{formatCurrency(paymentAmount - getTotalAllocationsNeeded())}</span>
                  </div>
                {:else}
                  <div class="flex justify-between items-center text-sm text-yellow-600 dark:text-yellow-400">
                    <span>Remaining Unpaid:</span>
                    <span class="font-medium">{formatCurrency(getTotalAllocationsNeeded() - paymentAmount)}</span>
                  </div>
                {/if}
              {/if}
            </div>

            <!-- Allocation Preview -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium">Payment Allocation:</h4>
              {#if paymentAllocation.length > 0}
                {#each paymentAllocation as { billing, allocatedAmount, remainingBalance, status }}
                  <div class="p-2 border rounded">
                    <div class="flex justify-between items-start">
                      <div>
                        <div class="font-medium">{billing.type}</div>
                        <div class="text-sm text-muted-foreground">
                          Due: {formatDate(billing.due_date)}
                        </div>
                      </div>
                      <div class="text-right">
                        <div>{formatCurrency(allocatedAmount)}</div>
                        <Badge variant={status === 'PAID' ? 'default' : 'secondary'}>
                          {status}
                        </Badge>
                      </div>
                    </div>
                    {#if remainingBalance > 0}
                      <div class="text-xs text-muted-foreground mt-1">
                        Remaining: {formatCurrency(remainingBalance)}
                      </div>
                    {/if}
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-muted-foreground">
                  No billings selected
                </p>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Button Row -->
      <div class="border-t pt-4 flex justify-end gap-2">
        <Button type="submit" disabled={!paymentAmount || !selectedBillings.size}>
          Submit Payment
        </Button>
      </div>
    </form>

  </Dialog.Content>
</Dialog.Root>
