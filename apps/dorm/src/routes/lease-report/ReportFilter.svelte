<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import * as Card from '$lib/components/ui/card';
  import Button from '$lib/components/ui/button/button.svelte';
  import { leaseReportFilterSchema } from './reportSchema';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import * as Checkbox from '$lib/components/ui/checkbox';
  import { goto } from '$app/navigation';
  import type { Property } from './types';

  let { formData, properties } = $props<{
    formData: any;  // SuperForm data
    properties: Property[];
  }>();

  const { form, enhance, errors, constraints } = superForm(formData, {
    id: 'filter-form',
    dataType: 'form',
    taintedMessage: null,
    onUpdated: ({ form }) => {
      // Update URL with new filter parameters
      const params = new URLSearchParams();
      
      if (form.data.startMonth) {
        params.set('startMonth', form.data.startMonth);
      }
      
      if (form.data.monthCount) {
        params.set('monthCount', form.data.monthCount.toString());
      }
      
      if (form.data.floorId) {
        params.set('floorId', form.data.floorId.toString());
      }
      
      if (form.data.propertyId) {
        params.set('propertyId', form.data.propertyId.toString());
      }
      
      if (form.data.showInactiveLeases) {
        params.set('showInactiveLeases', 'true');
      }
      
      goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
    }
  });

  // Generate month count options
  const monthCountOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} month${i > 0 ? 's' : ''}`
  }));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Report Filters</Card.Title>
    <Card.Description>Customize your monthly payment report</Card.Description>
  </Card.Header>
  <Card.Content>
    <form method="GET" use:enhance class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Start Month -->
        <div class="space-y-2">
          <Label for="startMonth">Start Month</Label>
          <Input 
            type="month" 
            id="startMonth"
            name="startMonth"
            bind:value={$form.startMonth} 
            aria-invalid={!!$errors.startMonth}
            data-error={!!$errors.startMonth}
            {...$constraints.startMonth}
          />
          {#if $errors.startMonth}
            <p class="text-sm font-medium text-destructive">{$errors.startMonth}</p>
          {/if}
        </div>

        <!-- Month Count -->
        <div class="space-y-2">
          <Label for="monthCount">Number of Months</Label>
          <Select.Root 
            type="single"
            name="monthCount"
            bind:value={$form.monthCount}
          >
            <Select.Trigger class="w-full" data-error={!!$errors.monthCount}>
              {$form.monthCount ? `${$form.monthCount} month${Number($form.monthCount) > 1 ? 's' : ''}` : 'Select month count'}
            </Select.Trigger>
            <Select.Content>
              {#each monthCountOptions as option}
                <Select.Item value={option.value}>{option.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.monthCount}
            <p class="text-sm font-medium text-destructive">{$errors.monthCount}</p>
          {/if}
        </div>

        <!-- Property Filter -->
        <div class="space-y-2">
          <Label for="propertyId">Property</Label>
          <Select.Root 
            type="single"
            name="propertyId"
            bind:value={$form.propertyId}
          >
            <Select.Trigger class="w-full" data-error={!!$errors.propertyId}>
              {$form.propertyId 
                ? properties.find((p: Property) => p.id.toString() === $form.propertyId)?.name ?? 'All Properties'
                : 'All Properties'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">All Properties</Select.Item>
              {#each properties as property}
                <Select.Item value={property.id.toString()}>
                  {property.name}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.propertyId}
            <p class="text-sm font-medium text-destructive">{$errors.propertyId}</p>
          {/if}
        </div>

        <!-- Show Inactive Leases -->
        <div class="flex items-center space-x-2 pt-6">
          <Checkbox.Root 
            id="showInactiveLeases" 
            name="showInactiveLeases"
            bind:checked={$form.showInactiveLeases}
          />
          <label
            for="showInactiveLeases"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Include inactive leases
          </label>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit">Apply Filters</Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
