<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { toast } from 'svelte-sonner';
  import type { Lease } from '$lib/types/lease';
  import { getMonthName, getDaysInMonth } from '$lib/utils/date';
  import { invalidate } from '$app/navigation';

  let { lease, open, onOpenChange } = $props<{
    lease: Lease;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>();

  type MonthlyRent = {
    month: number;
    isActive: boolean;
    amount: number;
    dueDate: string;
    billingId: number | null;
  };

  let selectedYear = $state(new Date().getFullYear());
  let monthlyRents = $state<MonthlyRent[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  const initializeRents = (year: number, existingBillings: any[]) => {
    const billingsMap = new Map(existingBillings.map(b => [new Date(b.billing_date).getUTCMonth() + 1, b]));
    
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const existing = billingsMap.get(month);
      const dueDate = new Date(year, i, lease.rent_due_day || 1);

      return {
        month,
        isActive: !!existing,
        amount: existing ? existing.amount : lease.rent_amount,
        dueDate: existing ? existing.due_date.split('T')[0] : dueDate.toISOString().split('T')[0],
        billingId: existing ? existing.id : null
      };
    });
  };

  const fetchBillingsForYear = async (year: number) => {
    isLoading = true;
    error = null;
    try {
      const response = await fetch(`/leases/${lease.id}/billings?year=${year}&type=RENT`);
      if (!response.ok) throw new Error('Failed to fetch rent data.');
      const existingBillings = await response.json();
      monthlyRents = initializeRents(year, existingBillings);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error('Error', { description: error });
    } finally {
      isLoading = false;
    }
  };

  $effect(() => {
    if (open) {
      fetchBillingsForYear(selectedYear);
    }
  });

  const handleSaveChanges = async () => {
    // Validate data before submission
    const validationErrors: string[] = [];
    
    monthlyRents.forEach((rent, index) => {
      if (rent.isActive) {
        if (!rent.amount || rent.amount <= 0) {
          validationErrors.push(`Month ${rent.month}: Amount must be greater than 0`);
        }
        if (!rent.dueDate) {
          validationErrors.push(`Month ${rent.month}: Due date is required`);
        }
        // Validate due date format
        const dueDate = new Date(rent.dueDate);
        if (isNaN(dueDate.getTime())) {
          validationErrors.push(`Month ${rent.month}: Invalid due date format`);
        }
      }
    });
    
    if (validationErrors.length > 0) {
      toast.error('Validation Error', {
        description: validationErrors.join(', ')
      });
      return;
    }
    
    isLoading = true;
    try {
      const formData = new FormData();
      formData.append('leaseId', lease.id.toString());
      formData.append('year', selectedYear.toString());
      formData.append('monthlyRents', JSON.stringify(monthlyRents));

      const response = await fetch('?/manageRentBillings', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to save changes.');
      }

      toast.success('Success', { description: 'Rent billings have been updated.' });
      await invalidate('app:leases');
      onOpenChange(false);

    } catch (err) {
      toast.error('Save Failed', { description: err instanceof Error ? err.message : 'An unknown error occurred.' });
    } finally {
      isLoading = false;
    }
  };

  const changeYear = (offset: number) => {
    selectedYear += offset;
    fetchBillingsForYear(selectedYear);
  };

</script>

<Dialog {open} onOpenChange={onOpenChange}>
  <DialogContent class="max-w-2xl">
    <DialogHeader class="pb-3">
      <DialogTitle class="text-lg">Rent Manager - {lease.name}</DialogTitle>
      <DialogDescription class="text-sm">
        Manage monthly rent billings. Select year and enable/disable or modify rent for each month.
      </DialogDescription>
    </DialogHeader>

    <div class="flex items-center justify-center space-x-3 py-2">
      <Button variant="outline" size="sm" onclick={() => changeYear(-1)}>&lt;</Button>
      <span class="text-lg font-semibold w-20 text-center">{selectedYear}</span>
      <Button variant="outline" size="sm" onclick={() => changeYear(1)}>&gt;</Button>
    </div>

    {#if isLoading}
      <div class="text-center py-4 text-sm text-muted-foreground">Loading...</div>
    {:else if error}
      <div class="text-center py-4 text-sm text-red-500">{error}</div>
    {:else}
      <div class="max-h-[50vh] overflow-y-auto px-1">
        {#each monthlyRents as rent, i (rent.month)}
          <div class="border-b last:border-b-0 p-2 flex items-center gap-3" class:opacity-50={!rent.isActive}>
            <Checkbox bind:checked={rent.isActive} />
            <div class="min-w-[80px]">
              <Label class="font-medium text-sm">{getMonthName(rent.month)}</Label>
            </div>
            <div class="flex items-center gap-1">
              <Label for={`amount-${i}`} class="text-xs text-muted-foreground">₱</Label>
              <Input 
                id={`amount-${i}`} 
                type="number" 
                bind:value={rent.amount} 
                disabled={!rent.isActive}
                class="h-7 w-20 text-sm {!rent.isActive ? 'cursor-default' : ''}"
                placeholder="0"
              />
            </div>
            <div class="flex items-center gap-1">
              <Label for={`due-date-${i}`} class="text-xs text-muted-foreground">Due:</Label>
              <Input 
                type="date"
                id={`due-date-${i}`} 
                name={`due-date-${i}`}
                bind:value={rent.dueDate} 
                disabled={!rent.isActive}
                class="h-7 w-32 text-sm {!rent.isActive ? 'cursor-default' : ''}"
              />
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <DialogFooter class="pt-3">
      <Button variant="outline" size="sm" onclick={() => onOpenChange(false)}>Cancel</Button>
      <Button size="sm" onclick={handleSaveChanges} disabled={isLoading}>
        {#if isLoading}Saving...{:else}Save Changes{/if}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>