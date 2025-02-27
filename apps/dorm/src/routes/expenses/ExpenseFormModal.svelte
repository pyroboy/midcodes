<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { Receipt, Wallet, Plus, X } from 'lucide-svelte';
  import type { PageData } from './$types';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { expenseSchema, expenseTypeEnum, expenseStatusEnum, months } from './schema';
  import type { Expense } from './types';

  // Define expense item type
  interface ExpenseItem {
    label: string;
    amount: string;
  }

  // Props using Svelte 5 runes
  let { 
    open = false,
    data,
    editMode = false,
    form,
    errors,
    enhance,
    constraints,
    submitting
  } = $props<{
    open?: boolean;
    data: PageData;
    editMode?: boolean;
    form: any;
    errors: any;
    enhance: any;
    constraints: any;
    submitting: any;
  }>();

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    close: void;
    cancel: void;
  }>();

  // Handle close
  function handleClose() {
    dispatch('close');
  }

  // Handle cancel
  function handleCancel() {
    dispatch('cancel');
  }

  // Year and month handling
  const currentYear = new Date().getFullYear();
  let years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  let selectedYear = form.expense_date ? new Date(form.expense_date).getFullYear().toString() : currentYear.toString();
  let selectedMonth = form.expense_date ? months[new Date(form.expense_date).getMonth()] : months[new Date().getMonth()];

  // Expense lists
  let operationalExpenses: ExpenseItem[] = $state([
    { label: form.description || 'Expense', amount: form.amount?.toString() || '' }
  ]);

  let capitalExpenses: ExpenseItem[] = $state([]);

  // If editing an existing expense, initialize the lists accordingly
  if (editMode && form.expense_type) {
    if (form.expense_type === 'OPERATIONAL') {
      operationalExpenses = [{ label: form.description || 'Expense', amount: form.amount?.toString() || '' }];
      capitalExpenses = [];
    } else if (form.expense_type === 'CAPITAL') {
      operationalExpenses = [];
      capitalExpenses = [{ label: form.description || 'Expense', amount: form.amount?.toString() || '' }];
    }
  }

  function handleExpenseChange(index: number, field: keyof ExpenseItem, value: string, type: string) {
    if (type === 'OPERATIONAL') {
      operationalExpenses = operationalExpenses.map((expense, i) =>
        i === index ? { ...expense, [field]: value } : expense
      );
    } else {
      capitalExpenses = capitalExpenses.map((expense, i) =>
        i === index ? { ...expense, [field]: value } : expense
      );
    }
  }

  function addExpense(type: string) {
    if (type === 'OPERATIONAL') {
      operationalExpenses = [...operationalExpenses, { label: '', amount: '' }];
    } else {
      capitalExpenses = [...capitalExpenses, { label: '', amount: '' }];
    }
  }

  function removeExpense(index: number, type: string) {
    if (type === 'OPERATIONAL') {
      operationalExpenses = operationalExpenses.filter((_, i) => i !== index);
    } else {
      capitalExpenses = capitalExpenses.filter((_, i) => i !== index);
    }
  }

  // Before form submission, update the main form values
  function prepareSubmission() {
    // Determine which expense type to use based on which list has entries
    let expenseType = 'OPERATIONAL';
    let description = '';
    let amount = '';

    if (operationalExpenses.length > 0 && operationalExpenses[0].label) {
      expenseType = 'OPERATIONAL';
      description = operationalExpenses[0].label;
      amount = operationalExpenses[0].amount;
    } else if (capitalExpenses.length > 0 && capitalExpenses[0].label) {
      expenseType = 'CAPITAL';
      description = capitalExpenses[0].label;
      amount = capitalExpenses[0].amount;
    }

    // Set the date based on selected year and month
    const monthIndex = months.indexOf(selectedMonth);
    const expenseDate = new Date(parseInt(selectedYear), monthIndex, 1);

    // Update form values
    form.description = description;
    form.amount = amount ? parseFloat(amount) : 0;
    form.expense_type = expenseType;
    form.expense_date = expenseDate.toISOString().split('T')[0];
    
    // If we support multiple expenses in the future, we could handle them differently
    // For now, just use the first entry from the appropriate list
  }
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[94%] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto">
      <Dialog.Header class="flex flex-col gap-2">
        <Dialog.Title class="text-2xl font-bold">
          {editMode ? 'Edit Expense' : 'Add New Expense'}
        </Dialog.Title>
      </Dialog.Header>

      <div class="mt-4">
        <form 
          method="POST" 
          action={editMode ? "?/update" : "?/create"} 
          use:enhance={(e: any) => {
            prepareSubmission();
            return enhance(e);
          }} 
          class="space-y-6"
        >
          {#if editMode && form.id}
            <input type="hidden" name="id" bind:value={form.id} />
          {/if}

          <!-- Property Selection -->
          <div class="space-y-2">
            <Label for="property_id">Property</Label>
            <Select.Root
              type="single"
              name="property_id"
              value={form.property_id?.toString() || ''}
            >
              <Select.Trigger class="w-full">
                <span>{data.properties?.find((p: any) => p.id === form.property_id)?.name || 'Select a property'}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.Item value="">None</Select.Item>
                  {#if data.properties}
                    {#each data.properties as property}
                      <Select.Item value={property.id.toString()}>{property.name}</Select.Item>
                    {/each}
                  {/if}
                </Select.Group>
              </Select.Content>
            </Select.Root>
            {#if errors.property_id}
              <p class="text-sm text-red-500">{errors.property_id}</p>
            {/if}
          </div>

          <!-- Date Selection -->
          <div class="flex gap-4 justify-start items-center">
            <div class="w-32">
              <Label for="year">Year</Label>
              <Select.Root
                type="single"
                name="year"
                value={selectedYear}
              >
                <Select.Trigger class="text-lg bg-white border-2 hover:bg-gray-50">
                  <span>{selectedYear}</span>
                </Select.Trigger>
                <Select.Content>
                  {#each years as year}
                    <Select.Item value={year.toString()} class="text-lg">
                      {year}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
            <div class="w-48">
              <Label for="month">Month</Label>
              <Select.Root
                type="single"
                name="month"
                value={selectedMonth}
              >
                <Select.Trigger class="text-lg bg-white border-2 hover:bg-gray-50">
                  <span>{selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)}</span>
                </Select.Trigger>
                <Select.Content>
                  {#each months as month}
                    <Select.Item value={month} class="text-lg">
                      {month.charAt(0).toUpperCase() + month.slice(1)}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <!-- Expense Categories -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Operational Expenses -->
            <Card class="shadow-lg">
              <CardHeader class="border-b bg-gray-50">
                <CardTitle class="flex items-center gap-2 text-gray-700">
                  <Receipt class="h-5 w-5" />
                  Operational Expenses
                </CardTitle>
              </CardHeader>
              <CardContent class="p-6 pt-4">
                <div class="space-y-6">
                  {#each operationalExpenses as expense, index}
                    <div class="flex gap-4 items-center">
                      <Input
                        value={expense.label}
                        placeholder="Expense Label"
                        class="bg-white w-64"
                        oninput={(e: Event) => handleExpenseChange(index, 'label', (e.target as HTMLInputElement).value, 'OPERATIONAL')}
                      />
                      <div class="relative w-48">
                        <span class="absolute left-3 top-2 text-gray-500">₱</span>
                        <Input
                          type="number"
                          value={expense.amount}
                          placeholder="0.00"
                          class="pl-8 bg-white"
                          oninput={(e: Event) => handleExpenseChange(index, 'amount', (e.target as HTMLInputElement).value, 'OPERATIONAL')}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onclick={() => removeExpense(index, 'OPERATIONAL')}
                      >
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                  {/each}
                  <Button
                    type="button"
                    variant="outline"
                    class="w-full"
                    onclick={() => addExpense('OPERATIONAL')}
                  >
                    <Plus class="h-4 w-4 mr-2" />
                    Add Operational Expense
                  </Button>
                </div>
              </CardContent>
            </Card>

            <!-- Capital Expenses -->
            <Card class="shadow-lg">
              <CardHeader class="border-b bg-gray-50">
                <CardTitle class="flex items-center gap-2 text-gray-700">
                  <Wallet class="h-5 w-5" />
                  Capital Expenses
                </CardTitle>
              </CardHeader>
              <CardContent class="p-6 pt-4">
                <div class="space-y-6">
                  {#each capitalExpenses as expense, index}
                    <div class="flex gap-4 items-center">
                      <Input
                        value={expense.label}
                        placeholder="Expense Label"
                        class="bg-white w-64"
                        oninput={(e: Event) => handleExpenseChange(index, 'label', (e.target as HTMLInputElement).value, 'CAPITAL')}
                      />
                      <div class="relative w-48">
                        <span class="absolute left-3 top-2 text-gray-500">₱</span>
                        <Input
                          type="number"
                          value={expense.amount}
                          placeholder="0.00"
                          class="pl-8 bg-white"
                          oninput={(e: Event) => handleExpenseChange(index, 'amount', (e.target as HTMLInputElement).value, 'CAPITAL')}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onclick={() => removeExpense(index, 'CAPITAL')}
                      >
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                  {/each}
                  <Button
                    type="button"
                    variant="outline"
                    class="w-full"
                    onclick={() => addExpense('CAPITAL')}
                  >
                    <Plus class="h-4 w-4 mr-2" />
                    Add Capital Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <!-- Notes -->
          <div class="space-y-2">
            <Label for="notes">Notes</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              placeholder="Add any additional notes here..."
              class="min-h-[100px]"
              bind:value={form.notes}
            />
          </div>

          <!-- Receipt URL -->
          <div class="space-y-2">
            <Label for="receipt_url">Receipt URL (Optional)</Label>
            <Input
              type="text"
              id="receipt_url"
              name="receipt_url"
              placeholder="https://example.com/receipt.pdf"
              bind:value={form.receipt_url}
            />
          </div>

          {#if errors.form?._errors}
            <div class="text-red-500">
              {#each errors.form._errors as error}
                <p>{error}</p>
              {/each}
            </div>
          {/if}

          <div class="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onclick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              class="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
