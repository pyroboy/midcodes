<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';
  import { Edit, Trash2, Receipt, Wallet, Plus } from 'lucide-svelte';
  import type { Expense } from './types';
  import type { Property } from './types';
  import type { PageData } from './$types';
  import { months } from './schema';
  import CapitalExpensesList from './CapitalExpensesList.svelte';
  import OperationalExpensesList from './OperationalExpensesList.svelte';

  // Type for months
  type Month = typeof months[number];

  // Helper function to check if a string is a valid month
  function isValidMonth(value: string): value is Month {
    return months.includes(value as Month);
  }

  // Helper function to determine if an expense type is operational or capital
  function isOperationalExpenseType(type: string): boolean {
    const operationalTypes = ['OPERATIONAL', 'MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'SALARY', 'OTHERS'];
    return type !== 'CAPITAL' && operationalTypes.includes(type);
  }

  // Props
  interface Props {
    expenses: Expense[] | null;
    properties: Property[]
  }
  
  let { expenses = [], properties }: Props = $props() ;

  // Debug logging for properties data
  console.log('ExpenseList received data:', expenses);
  console.log('ExpenseList properties:', properties);
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    edit: Expense;
    delete: number;
    add: any;
    refresh: any;
  }>();

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  // Format date
  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Status badge color
  function getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get property name from property_id
  function getPropertyName(property_id: number) {
    if (!properties) return 'Unknown';
    const property = properties.find((p) => p.id === property_id);
    return property ? property.name : 'Unknown';
  }

  // Define the MonthGroup interface for better typing
  interface MonthGroup {
    date: Date;
    operational: Expense[];
    capital: Expense[];
  }

  // State for filters and new expenses
  const currentYear = new Date().getFullYear();
  let years = $state(Array.from({ length: 5 }, (_, i) => currentYear - 2 + i));
  let selectedYear = $state(currentYear.toString());
  let selectedMonth = $state<Month>(months[new Date().getMonth()]);
  let selectedProperty = $state<number | null>(null);
  
  // New expense inputs
  let newOperationalDesc = $state('');
  let newOperationalAmount = $state('');
  let newCapitalDesc = $state('');
  let newCapitalAmount = $state('');

  // Group expenses by month and type
  function groupExpensesByMonthAndType(): MonthGroup[] {
    const grouped: Record<string, MonthGroup> = {};
    
    // Initialize with the selected year/month regardless of whether there are expenses
    const monthIndex = months.indexOf(selectedMonth);
    const key = `${selectedYear}-${monthIndex}`;
    grouped[key] = {
      date: new Date(parseInt(selectedYear), monthIndex, 1),
      operational: [],
      capital: []
    };
    
    if (!expenses || expenses.length === 0) {
      // Return just the empty group for the selected month if no expenses
      return Object.values(grouped);
    }
    
    // Filter expenses based on current selections
    const filteredExpenses = expenses.filter(expense => {
      if (!expense.expense_date) return false;
      
      const expenseDate = new Date(expense.expense_date);
      const expenseYear = expenseDate.getFullYear().toString();
      const expenseMonth = months[expenseDate.getMonth()];
      
      // Filter by selected property if one is selected
      const propertyMatch = !selectedProperty || expense.property_id === selectedProperty;
      
      // If we're filtering by both year and month
      if (selectedYear && selectedMonth) {
        return expenseYear === selectedYear && 
               expenseMonth === selectedMonth && 
               propertyMatch;
      }
      
      // If we're only filtering by year
      if (selectedYear) {
        return expenseYear === selectedYear && propertyMatch;
      }
      
      // If no year/month filters, just filter by property if selected
      return propertyMatch;
    });
    
    // Group the filtered expenses
    filteredExpenses.forEach(expense => {
      if (!expense.expense_date) return;
      
      const expenseDate = new Date(expense.expense_date);
      const year = expenseDate.getFullYear();
      const month = expenseDate.getMonth();
      const expenseKey = `${year}-${month}`;
      
      if (!grouped[expenseKey]) {
        grouped[expenseKey] = { 
          date: new Date(year, month, 1), 
          operational: [], 
          capital: [] 
        };
      }
      
      // Sort expenses into their respective categories
      console.log('Processing expense:', expense.id, 'Type:', expense.type, 'Description:', expense.description);
      if (isOperationalExpenseType(expense.type)) {
        console.log('-> Categorized as OPERATIONAL');
        grouped[expenseKey].operational.push(expense);
      } else if (expense.type === 'CAPITAL') {
        console.log('-> Categorized as CAPITAL');
        grouped[expenseKey].capital.push(expense);
      }
    });
    
    // Sort groups by date (newest first)
    return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  const groupedExpenses = $derived.by(() => groupExpensesByMonthAndType());

  // Event handler for add expense event from expense list components
  function handleAddExpense(event: CustomEvent<any>) {
    const newExpense = event.detail;
    
    console.log('Received new expense:', newExpense);
    
    // Create new expense data based on the type
    const completeExpense = {
      property_id: selectedProperty,
      amount: newExpense.amount,
      description: newExpense.description,
      type: newExpense.type,
      expense_status: 'PENDING',
      expense_date: new Date(parseInt(selectedYear), months.indexOf(selectedMonth), 15).toISOString().split('T')[0]
    };
    
    console.log('Complete expense to be dispatched:', completeExpense);
    
    // Dispatch to parent component
    dispatch('add', completeExpense);
  }
</script>

<div class="space-y-6">
  <!-- Filters -->
  <Card class="bg-white shadow-md">
    <CardHeader class="pb-2">
      <CardTitle>Expense Filters</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label for="property">Property</Label>
          <Select.Root
            type="single"
            value={selectedProperty?.toString() || ''}
            onValueChange={(value) => selectedProperty = value ? parseInt(value) : null}
          >
            <Select.Trigger class="w-full">
              <span>{selectedProperty ? getPropertyName(selectedProperty) : 'All Properties'}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">All Properties</Select.Item>
              {#if properties && properties.length > 0}
                {#each properties as property}
                  <Select.Item value={property.id.toString()}>{property.name}</Select.Item>
                {/each}
              {:else}
                <Select.Item value="" disabled>No properties available</Select.Item>
              {/if}
            </Select.Content>
          </Select.Root>
        </div>
        
        <div>
          <Label for="year">Year</Label>
          <Select.Root
            type="single"
            value={selectedYear}
            onValueChange={(value) => selectedYear = value || currentYear.toString()}
          >
            <Select.Trigger class="w-full">
              <span>{selectedYear}</span>
            </Select.Trigger>
            <Select.Content>
              {#each years as year}
                <Select.Item value={year.toString()}>{year}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        
        <div>
          <Label for="month">Month</Label>
          <Select.Root
            type="single"
            value={selectedMonth}
            onValueChange={(value) => {
              if (isValidMonth(value)) {
                selectedMonth = value;
              } else {
                selectedMonth = months[new Date().getMonth()];
              }
            }}
          >
            <Select.Trigger class="w-full">
              <span>{selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)}</span>
            </Select.Trigger>
            <Select.Content>
              {#each months as month}
                <Select.Item value={month}>{month.charAt(0).toUpperCase() + month.slice(1)}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        
        <div class="flex items-end">
          <Button 
            variant="outline" 
            size="sm" 
            class="w-full"
            onclick={() => {
              // Reset filters to defaults
              selectedProperty = null;
              selectedYear = currentYear.toString();
              selectedMonth = months[new Date().getMonth()];
              
              // Dispatch an event to refresh expenses with the current filters
              dispatch('refresh', {
                property_id: selectedProperty,
                year: selectedYear,
                month: selectedMonth
              });
            }}
          >
            Reset & Refresh
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Expenses List -->
  <div class="space-y-8">
    {#each Object.values(groupedExpenses) as monthGroup (monthGroup.date.toISOString())}
      <div class="space-y-4 mb-8">
        <h3 class="text-xl font-semibold border-b pb-2">
          {months[monthGroup.date.getMonth()].charAt(0).toUpperCase() + months[monthGroup.date.getMonth()].slice(1)} {monthGroup.date.getFullYear()}
        </h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OperationalExpensesList 
            expenses={monthGroup.operational} 
            properties={properties}
            selectedPropertyId={selectedProperty}
            on:add={(e) => handleAddExpense(e)}
            on:delete={(e) => {
              console.log('ExpenseList received delete event from OperationalExpensesList:', e.detail);
              dispatch('delete', e.detail);
            }} 
          />

          <CapitalExpensesList 
            expenses={monthGroup.capital} 
            properties={properties}
            selectedPropertyId={selectedProperty}
            on:add={(e) => handleAddExpense(e)}
            on:delete={(e) => {
              console.log('ExpenseList received delete event from CapitalExpensesList:', e.detail);
              dispatch('delete', e.detail);
            }} 
          />
        </div>
      </div>
    {/each}
  </div>
</div>
