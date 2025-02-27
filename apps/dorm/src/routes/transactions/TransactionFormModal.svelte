<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { Receipt, Wallet, DollarSign, X } from 'lucide-svelte';
  import type { PageData } from './$types';
  import type { SuperForm } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import { transactionSchema, paymentMethodEnum } from './schema';
  import type { Transaction } from './types';

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

  // Format date for input fields
  function formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  }

  // Form field helpers
  let formattedPaidAt = $state(formatDateForInput(form.paid_at));

  // Update hidden form values
  $effect(() => {
    form.paid_at = formattedPaidAt;
  });

  // Create select items from paymentMethodEnum
  const paymentMethodItems = Object.values(paymentMethodEnum.enum).map(method => ({
    value: method,
    label: method.replace('_', ' ')
  }));
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[94%] md:max-w-[600px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto">
      <Dialog.Header class="flex flex-col gap-2">
        <Dialog.Title class="text-2xl font-bold">
          {editMode ? 'Edit Transaction' : 'New Transaction'}
        </Dialog.Title>
        <Dialog.Description class="text-sm text-gray-500">
          {editMode ? 'Update transaction details' : 'Enter transaction details below'}
        </Dialog.Description>
      </Dialog.Header>
      <div class="mt-4">
        <form 
          method="POST" 
          action="?/upsert" 
          use:enhance={(e: any) => {
            return enhance(e, {
              onSubmit: () => handleClose()
            });
          }}
        >
          {#if editMode && form.id}
            <input type="hidden" name="id" bind:value={form.id} />
          {/if}
          
          <!-- Hidden input for method value -->
          <input type="hidden" name="method" bind:value={form.method} />

          <div class="space-y-6">
            <!-- Basic Transaction Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="amount">Amount*</Label>
                <div class="relative">
                  <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <DollarSign class="h-4 w-4" />
                  </div>
                  <Input
                    type="number"
                    id="amount"
                    name="amount"
                    value={form.amount}
                    placeholder="0.00"
                    class="pl-10"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                {#if errors.amount}
                  <p class="text-xs text-red-500 mt-1">{errors.amount}</p>
                {/if}
              </div>

              <div class="space-y-2">
                <Label for="paid_by">Paid By*</Label>
                <Input
                  type="text"
                  id="paid_by"
                  name="paid_by"
                  value={form.paid_by || ''}
                  placeholder="Enter name"
                  required
                />
                {#if errors.paid_by}
                  <p class="text-xs text-red-500 mt-1">{errors.paid_by}</p>
                {/if}
              </div>
              
              <div class="space-y-2">
                <Label for="method">Payment Method*</Label>
                <Select.Root
                  type="single"
                  value={form.method || ''}
                  onValueChange={(value) => form.method = value}
                >
                  <Select.Trigger class="w-full" id="method">
                    <span>{form.method ? form.method.replace('_', ' ') : 'Select method'}</span>
                  </Select.Trigger>
                  <Select.Content>
                    {#each Object.values(paymentMethodEnum.enum) as method}
                      <Select.Item value={method}>{method.replace('_', ' ')}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
                {#if errors.method}
                  <p class="text-xs text-red-500 mt-1">{errors.method}</p>
                {/if}
              </div>

              <div class="space-y-2">
                <Label for="paid_at">Payment Date*</Label>
                <Input
                  type="date"
                  id="paid_at"
                  bind:value={formattedPaidAt}
                  name="paid_at"
                  required
                />
                {#if errors.paid_at}
                  <p class="text-xs text-red-500 mt-1">{errors.paid_at}</p>
                {/if}
              </div>
            </div>

            <!-- Additional Details -->
            <div class="space-y-2">
              <Label for="reference_number">Reference Number</Label>
              <Input
                type="text"
                id="reference_number"
                name="reference_number"
                value={form.reference_number || ''}
                placeholder="e.g. receipt number, transaction ID..."
              />
              {#if errors.reference_number}
                <p class="text-xs text-red-500 mt-1">{errors.reference_number}</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={form.notes || ''}
                placeholder="Additional information about the transaction..."
                rows={3}
              />
              {#if errors.notes}
                <p class="text-xs text-red-500 mt-1">{errors.notes}</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="receipt_url">Receipt URL</Label>
              <Input
                type="text"
                id="receipt_url"
                name="receipt_url"
                value={form.receipt_url || ''}
                placeholder="URL to receipt image or document"
              />
              {#if errors.receipt_url}
                <p class="text-xs text-red-500 mt-1">{errors.receipt_url}</p>
              {/if}
            </div>
            
            <div class="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onclick={handleCancel}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : (editMode ? 'Update' : 'Save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
