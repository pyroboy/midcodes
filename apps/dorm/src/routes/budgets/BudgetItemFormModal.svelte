<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import type { BudgetItem } from './types';
  import { budgetItemTypes } from './schema';

  // Props using Svelte 5 $props rune
  let { 
    item,
    editMode = false
  } = $props<{
    item: BudgetItem | null;
    editMode: boolean;
  }>();

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    close: void;
    submit: BudgetItem;
  }>();

  // Handle close
  function handleClose() {
    dispatch('close');
  }

  // Form data
  let formData = $state<BudgetItem>({
    id: item?.id,
    name: item?.name || '',
    type: item?.type || 'MATERIALS',
    cost: item?.cost || 0,
    quantity: item?.quantity || 1,
  });

  // Handle form submission
  function handleSubmit() {
    dispatch('submit', formData);
  }

  // Handle input changes
  function handleChange(field: keyof BudgetItem, value: any) {
    formData = {
      ...formData,
      [field]: value
    };
  }
</script>

<Dialog.Root open={true} onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
      <Dialog.Header>
        <Dialog.Title class="text-xl font-semibold text-blue-700">
          {editMode ? 'Edit Budget Item' : 'Add Budget Item'}
        </Dialog.Title>
        <Dialog.Description class="text-gray-600">
          {editMode
            ? 'Update the details of this budget item.'
            : 'Add a new item to the budget.'}
        </Dialog.Description>
      </Dialog.Header>
      
      <div class="space-y-5">
        <!-- Item Name -->
        <div class="space-y-2">
          <Label for="item_name" class="font-medium">Item Name</Label>
          <Input 
            id="item_name" 
            value={formData.name}
            onchange={(e) => handleChange('name', e.currentTarget.value)}
            placeholder="Enter item name" 
            class="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            required 
          />
        </div>
        
        <!-- Item Type -->
        <div class="space-y-2">
          <Label for="item_type" class="font-medium">Item Type</Label>
          <Select.Root
            type="single"
            value={formData.type}
            onValueChange={(value: string) => handleChange('type', value)}
          >
            <Select.Trigger class="w-full">
              <span>{formData.type || 'Select item type'}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each budgetItemTypes as type}
                  <Select.Item value={type}>
                    {type.replace('_', ' ').replace(/\w\S*/g, (txt) => {
                      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                    })}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        
        <!-- Cost -->
        <div class="space-y-2">
          <Label for="cost" class="font-medium">Cost</Label>
          <Input 
            id="cost" 
            type="number"
            value={formData.cost}
            onchange={(e) => handleChange('cost', parseFloat(e.currentTarget.value))}
            min="0"
            step="0.01"
            placeholder="0.00" 
            class="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            required 
          />
        </div>
        
        <!-- Quantity -->
        <div class="space-y-2">
          <Label for="quantity" class="font-medium">Quantity</Label>
          <Input 
            id="quantity" 
            type="number"
            value={formData.quantity}
            onchange={(e) => handleChange('quantity', parseFloat(e.currentTarget.value))}
            min="1"
            step="1"
            placeholder="1" 
            class="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            required 
          />
        </div>
        
        <!-- Total (calculated) -->
        <div class="space-y-2">
          <Label class="font-medium">Total</Label>
          <div class="bg-muted p-2 rounded-md text-right font-semibold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2
            }).format(formData.cost * formData.quantity)}
          </div>
        </div>
      </div>
      
      <Dialog.Footer class="flex justify-end gap-2 mt-2">
        <Button 
          variant="outline" 
          onclick={handleClose}
          class="border-gray-300 text-gray-700">
          Cancel
        </Button>
        <Button 
          onclick={handleSubmit}
          class="bg-blue-600 hover:bg-blue-700 text-white">
          {editMode ? 'Update Item' : 'Add Item'}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
