<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Tag, CircleDollarSign, Hash, Settings2, AlertCircle } from 'lucide-svelte';
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

  // Form validation
  let errors = $state({
    name: '',
    cost: '',
    quantity: ''
  });

  // Validate form fields
  function validateForm(): boolean {
    let isValid = true;
    
    // Reset errors
    errors = {
      name: '',
      cost: '',
      quantity: ''
    };

    // Validate name
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Item name is required';
      isValid = false;
    }

    // Validate cost
    if (formData.cost === null || formData.cost === undefined || isNaN(formData.cost)) {
      errors.cost = 'Cost must be a valid number';
      isValid = false;
    } else if (formData.cost < 0) {
      errors.cost = 'Cost cannot be negative';
      isValid = false;
    }

    // Validate quantity
    if (formData.quantity === null || formData.quantity === undefined || isNaN(formData.quantity)) {
      errors.quantity = 'Quantity must be a valid number';
      isValid = false;
    } else if (formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than zero';
      isValid = false;
    }

    return isValid;
  }

  // Handle form submission
  function handleSubmit() {
    if (validateForm()) {
      // Ensure we're passing properly formatted numbers
      const validatedItem: BudgetItem = {
        ...formData,
        cost: typeof formData.cost === 'number' ? formData.cost : parseFloat(formData.cost as unknown as string) || 0,
        quantity: typeof formData.quantity === 'number' ? formData.quantity : parseFloat(formData.quantity as unknown as string) || 1
      };
      
      dispatch('submit', validatedItem);
    }
  }

  // Handle input changes with validation
  function handleChange(field: keyof BudgetItem, value: any) {
    formData = {
      ...formData,
      [field]: value
    };
    
    // Clear error when user makes changes
    if (field in errors) {
      errors[field as keyof typeof errors] = '';
    }
  }

  // Format currency
  function formatCurrency(amount: number): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₱0.00';
    }
    
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // Calculate total
  let total = $derived(
    (typeof formData.cost === 'number' && !isNaN(formData.cost)) && 
    (typeof formData.quantity === 'number' && !isNaN(formData.quantity))
      ? formData.cost * formData.quantity
      : 0
  );
</script>

<Dialog.Root open={true} onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
      <Dialog.Header class="border-b pb-3">
        <Dialog.Title class="text-xl font-semibold text-blue-700">
          {editMode ? 'Edit Budget Item' : 'Add Budget Item'}
        </Dialog.Title>
        <Dialog.Description class="text-gray-600">
          {editMode
            ? 'Update the details of this budget item.'
            : 'Add a new item to your budget.'}
        </Dialog.Description>
      </Dialog.Header>
      
      <div class="space-y-5">
        <!-- Item Name -->
        <div class="space-y-2">
          <Label for="item_name" class="flex items-center gap-2 font-medium text-gray-700">
            <Tag class="h-4 w-4 text-gray-500" />
            Item Name
          </Label>
          <Input 
            id="item_name" 
            value={formData.name}
            onchange={(e) => handleChange('name', e.currentTarget.value)}
            placeholder="Enter item name" 
            class={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            required 
          />
          {#if errors.name}
            <p class="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle class="h-3 w-3" />
              {errors.name}
            </p>
          {/if}
        </div>
        
        <!-- Item Type -->
        <div class="space-y-2">
          <Label for="item_type" class="flex items-center gap-2 font-medium text-gray-700">
            <Settings2 class="h-4 w-4 text-gray-500" />
            Item Type
          </Label>
          <Select.Root
            type="single"
            value={formData.type}
            onValueChange={(value: string) => handleChange('type', value)}
          >
            <Select.Trigger class="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Cost -->
          <div class="space-y-2">
            <Label for="cost" class="flex items-center gap-2 font-medium text-gray-700">
              <CircleDollarSign class="h-4 w-4 text-gray-500" />
              Cost
            </Label>
            <Input 
              id="cost" 
              type="number"
              value={formData.cost}
              onchange={(e) => handleChange('cost', parseFloat(e.currentTarget.value))}
              min="0"
              step="0.01"
              placeholder="0.00" 
              class={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.cost ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required 
            />
            {#if errors.cost}
              <p class="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle class="h-3 w-3" />
                {errors.cost}
              </p>
            {/if}
          </div>
          
          <!-- Quantity -->
          <div class="space-y-2">
            <Label for="quantity" class="flex items-center gap-2 font-medium text-gray-700">
              <Hash class="h-4 w-4 text-gray-500" />
              Quantity
            </Label>
            <Input 
              id="quantity" 
              type="number"
              value={formData.quantity}
              onchange={(e) => handleChange('quantity', parseFloat(e.currentTarget.value))}
              min="1"
              step="1"
              placeholder="1" 
              class={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.quantity ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required 
            />
            {#if errors.quantity}
              <p class="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle class="h-3 w-3" />
                {errors.quantity}
              </p>
            {/if}
          </div>
        </div>
        
        <!-- Total (calculated) -->
        <div class="p-4 rounded-lg bg-blue-50 border border-blue-100">
          <div class="text-sm font-medium text-blue-800 mb-1">Total Cost</div>
          <div class="text-2xl font-bold text-gray-800">
            {formatCurrency(total)}
          </div>
        </div>
      </div>
      
      <Dialog.Footer class="flex justify-end gap-2 pt-4 border-t mt-2">
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

export default BudgetItemFormModal;