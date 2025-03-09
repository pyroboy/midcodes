<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { format } from 'date-fns';
  import { CalendarIcon, Building, DollarSign, Tag, Clock } from 'lucide-svelte';
  import { cn } from '$lib/utils';
  import type { Budget, Property } from './types';
  import { budgetCategoryEnum, budgetStatusEnum } from './schema';

  // Get enum values as arrays
  const budgetCategories = Object.values(budgetCategoryEnum.enum);
  const budgetStatuses = Object.values(budgetStatusEnum.enum);

  // Props using Svelte 5 $props rune
  let { 
    budget,
    properties = [],
    editMode = false
  } = $props<{
    budget: Budget | null;
    properties: Property[];
    editMode: boolean;
  }>();

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    close: void;
    submit: Budget;
  }>();

  // Handle close
  function handleClose() {
    dispatch('close');
  }

  // Form data
  let formData = $state<Budget>({
    id: budget?.id || undefined,
    project_name: budget?.project_name || '',
    project_description: budget?.project_description || '',
    project_category: budget?.project_category || 'RENOVATION',
    planned_amount: budget?.planned_amount || 0,
    pending_amount: budget?.pending_amount || 0,
    actual_amount: budget?.actual_amount || 0,
    budget_items: budget?.budget_items || [],
    status: budget?.status || 'PLANNED',
    start_date: budget?.start_date || null,
    end_date: budget?.end_date || null,
    property_id: budget?.property_id || null,
    created_by: budget?.created_by || null,
    created_at: budget?.created_at || new Date().toISOString(),
    updated_at: budget?.updated_at || new Date().toISOString()
  });

  // Handle form submission
  function handleSubmit() {
    dispatch('submit', formData);
  }

  // Handle input changes
  function handleChange(field: keyof Budget, value: any) {
    formData = {
      ...formData,
      [field]: value
    };
  }
</script>

<Dialog.Root open={true} onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto">
      <Dialog.Header class="border-b pb-3">
        <Dialog.Title class="text-xl font-semibold text-blue-700">
          {editMode ? 'Edit Budget Project' : 'Add Budget Project'}
        </Dialog.Title>
        <Dialog.Description class="text-gray-600">
          {editMode 
            ? 'Update the details of this budget project.' 
            : 'Create a new budget project for property renovations or maintenance.'}
        </Dialog.Description>
      </Dialog.Header>
      
      <div class="space-y-5">
        <!-- Property Selection -->
        <div class="space-y-2">
          <Label for="property" class="flex items-center gap-2 font-medium text-gray-700">
            <Building class="h-4 w-4 text-gray-500" />
            Property
          </Label>
          <Select.Root
            type="single"
            value={formData.property_id?.toString() || ''}
            onValueChange={(value: string) => handleChange('property_id', parseInt(value, 10))}
          >
            <Select.Trigger class="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <span>{properties.find((p: Property) => p.id === formData.property_id)?.name || 'Select a property'}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each properties as property}
                  <Select.Item value={property.id.toString()}>{property.name}</Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        
        <!-- Project Name -->
        <div class="space-y-2">
          <Label for="project_name" class="font-medium text-gray-700">Project Name</Label>
          <Input 
            id="project_name" 
            value={formData.project_name}
            onchange={(e) => handleChange('project_name', e.currentTarget.value)}
            placeholder="Enter project name" 
            class="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            required 
          />
        </div>
        
        <!-- Project Description -->
        <div class="space-y-2">
          <Label for="project_description" class="font-medium text-gray-700">Description</Label>
          <Textarea 
            id="project_description" 
            value={formData.project_description || ''}
            onchange={(e) => handleChange('project_description', e.currentTarget.value)}
            placeholder="Enter project description" 
            class="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Project Category -->
          <div class="space-y-2">
            <Label for="project_category" class="flex items-center gap-2 font-medium text-gray-700">
              <Tag class="h-4 w-4 text-gray-500" />
              Category
            </Label>
            <Select.Root
              type="single"
              value={formData.project_category}
              onValueChange={(value: string) => handleChange('project_category', value)}
            >
              <Select.Trigger class="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <span>{formData.project_category || 'Select a category'}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {#each budgetCategories as category}
                    <Select.Item value={category}>{category}</Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
          
          <!-- Status -->
          <div class="space-y-2">
            <Label for="status" class="flex items-center gap-2 font-medium text-gray-700">
              <Clock class="h-4 w-4 text-gray-500" />
              Status
            </Label>
            <Select.Root
              type="single"
              value={formData.status}
              onValueChange={(value: string) => handleChange('status', value)}
            >
              <Select.Trigger class="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <span>{formData.status || 'Select a status'}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {#each budgetStatuses as status}
                    <Select.Item value={status}>{status}</Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
        </div>
        
        <!-- Planned Amount -->
        <div class="space-y-2">
          <Label for="planned_amount" class="flex items-center gap-2 font-medium text-gray-700">
            <DollarSign class="h-4 w-4 text-gray-500" />
            Planned Budget
          </Label>
          <Input 
            id="planned_amount" 
            type="number"
            value={formData.planned_amount}
            onchange={(e) => handleChange('planned_amount', parseFloat(e.currentTarget.value))}
            min="0"
            step="0.01"
            placeholder="0.00"
            class="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            required 
          />
        </div>
        
        <!-- Date Range -->
        <div class="grid grid-cols-2 gap-4 pt-1 border-t border-gray-200">
          <div class="space-y-2">
            <Label for="start_date" class="font-medium text-gray-700">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  class="w-full pl-3 text-left font-normal border-gray-300"
                >
                  {formData.start_date ? format(new Date(formData.start_date), 'PPP') : 'Select start date'}
                  <CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <div class="p-4">
                  <Input 
                    type="date" 
                    value={formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : ''}
                    onchange={(e) => {
                      const date: string = e.currentTarget.value;
                      if (date) {
                        handleChange('start_date', new Date(date).toISOString());
                      }
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div class="space-y-2">
            <Label for="end_date" class="font-medium text-gray-700">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  class="w-full pl-3 text-left font-normal border-gray-300"
                >
                  {formData.end_date ? format(new Date(formData.end_date), 'PPP') : 'Select end date'}
                  <CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <div class="p-4">
                  <Input 
                    type="date" 
                    value={formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : ''}
                    onchange={(e) => {
                      const date: string = e.currentTarget.value;
                      if (date) {
                        handleChange('end_date', new Date(date).toISOString());
                      }
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      <Dialog.Footer class="flex justify-end gap-2 pt-4 border-t mt-2">
        <Button 
          variant="outline" 
          onclick={handleClose}
          class="border-gray-300">
          Cancel
        </Button>
        <Button 
          onclick={handleSubmit}
          class="bg-blue-600 hover:bg-blue-700 text-white">
          {editMode ? 'Update Project' : 'Create Project'}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>