<script lang="ts">
    import { Building2, Receipt, PiggyBank, Wallet, Loader2 } from 'lucide-svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    interface FloorData {
        income: number;
        note: string;
    }

    type FloorName = 'secondFloor' | 'thirdFloor';

    interface FloorDataMap {
        secondFloor: FloorData;
        thirdFloor: FloorData;
    }

    interface Expense {
        id: number;
        amount: number;
        description: string;
        type: string;
        status: string;
        created_at: string;
    }

    interface MonthData {
        floorData: FloorDataMap;
        expenses: Expense[];
        profitSharing: {
            forty: number;
            sixty: number;
        };
        totals: {
            grossIncome: number;
            totalExpenses: number;
            netIncome: number;
        };
    }

    interface Property {
        id: number;
        name: string;
    }

    type Month = 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';

    // Props
    let { reportData, year, month, propertyId, properties } = $props<{
        reportData?: MonthData;
        year: string;
        month: string;
        propertyId: string | null;
        properties: Property[];
    }>();

    // Format currency
    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }

    // Format date
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Available months for selection
    const months: Month[] = [
        'january', 'february', 'march', 'april',
        'may', 'june', 'july', 'august',
        'september', 'october', 'november', 'december'
    ];

    // Available years for selection (current year and 5 years back)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

    // Filter expenses by type
    function getExpensesByType(expenses: Expense[], type: string): Expense[] {
        return expenses.filter(expense => expense.type === type);
    }

    // Calculate total for a specific expense type
    function calculateTotalByType(expenses: Expense[], type: string): number {
        return getExpensesByType(expenses, type).reduce((sum, expense) => sum + Number(expense.amount), 0);
    }

    // Calculate total expenses from all categories
    function calculateTotalExpenses(expenses: Expense[]): number {
        return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    }

    // Calculate profit sharing
    function calculateProfitSharing(grossIncome: number, expenses: Expense[], percentage: number): number {
        const netIncome = grossIncome - calculateTotalExpenses(expenses);
        return netIncome * (percentage / 100);
    }

    // Handle filter changes
    function updateFilters(newPropertyId: string | null = null, newYear: string | null = null, newMonth: string | null = null): void {
        const params = new URLSearchParams();
        
        if (newPropertyId !== null) {
            if (newPropertyId) params.set('propertyId', newPropertyId);
        } else if (propertyId) {
            params.set('propertyId', propertyId);
        }
        
        if (newYear !== null) {
            params.set('year', newYear);
        } else {
            params.set('year', year);
        }
        
        if (newMonth !== null) {
            params.set('month', newMonth);
        } else {
            params.set('month', month);
        }
        
        goto(`?${params.toString()}`);
    }
</script>

<div class="min-h-screen bg-gray-50 p-8">
  <div class="max-w-6xl mx-auto space-y-8">
    <div class="text-center space-y-4">
      <h1 class="text-4xl font-bold text-gray-900">Monthly Rent Collection</h1>
      <div class="flex flex-wrap gap-4 justify-center items-center">
        <!-- Property Selector -->
        <div class="flex items-center gap-2">
          <label for="property" class="font-medium text-gray-700">Property:</label>
          <select 
            id="property"
            class="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={propertyId || ''}
            onchange={(e: Event) => {
              const select = e.target as HTMLSelectElement;
              updateFilters(select.value || null, null, null);
            }}
          >
            <option value="">Select a property</option>
            {#each properties as property}
              <option value={property.id}>{property.name}</option>
            {/each}
          </select>
        </div>

        <!-- Year Selector -->
        <div class="flex items-center gap-2">
          <label for="year" class="font-medium text-gray-700">Year:</label>
          <select 
            id="year"
            class="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={year}
            onchange={(e: Event) => {
              const select = e.target as HTMLSelectElement;
              updateFilters(null, select.value, null);
            }}
          >
            {#each years as yearOption}
              <option value={yearOption}>{yearOption}</option>
            {/each}
          </select>
        </div>

        <!-- Month Selector -->
        <div class="flex items-center gap-2">
          <label for="month" class="font-medium text-gray-700">Month:</label>
          <select 
            id="month"
            class="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={month}
            onchange={(e: Event) => {
              const select = e.target as HTMLSelectElement;
              updateFilters(null, null, select.value);
            }}
          >
            {#each months as monthOption}
              <option value={monthOption}>{monthOption.charAt(0).toUpperCase() + monthOption.slice(1)}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    {#if !propertyId}
      <div class="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Please Select a Property</h2>
        <p class="text-gray-600">Select a property from the dropdown above to view the financial report.</p>
      </div>
    {:else if !reportData}
      <div class="flex justify-center items-center h-64">
        <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Gross Income Section -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Building2 class="h-5 w-5" />
              Rental Income
            </h2>
          </div>
          <div class="p-4">
            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="font-medium">Second Floor</span>
                <span class="text-green-600 font-semibold">{formatCurrency(reportData.floorData.secondFloor.income)}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="font-medium">Third Floor</span>
                <span class="text-green-600 font-semibold">{formatCurrency(reportData.floorData.thirdFloor.income)}</span>
              </div>
              <div class="flex justify-between items-center py-2 pt-4 font-bold">
                <span>Total Gross Income</span>
                <span class="text-green-700">{formatCurrency(reportData.totals.grossIncome)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Operational Expenses Section -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Receipt class="h-5 w-5" />
              Operational Expenses
            </h2>
          </div>
          <div class="p-4">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {#if getExpensesByType(reportData.expenses, 'OPERATIONAL').length === 0}
                    <tr>
                      <td colspan="3" class="px-4 py-4 text-center text-sm text-gray-500">No operational expenses recorded for this period</td>
                    </tr>
                  {:else}
                    {#each getExpensesByType(reportData.expenses, 'OPERATIONAL') as expense}
                      <tr>
                        <td class="px-4 py-2 text-sm text-gray-500">{formatDate(expense.created_at)}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">{expense.description}</td>
                        <td class="px-4 py-2 text-sm text-red-600 font-medium">{formatCurrency(expense.amount)}</td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" class="px-4 py-3 text-right font-bold">Total Operational Expenses</td>
                    <td class="px-4 py-3 text-red-600 font-bold">{formatCurrency(calculateTotalByType(reportData.expenses, 'OPERATIONAL'))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Capital Expenses Section -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Wallet class="h-5 w-5" />
              Capital Expenses
            </h2>
          </div>
          <div class="p-4">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {#if getExpensesByType(reportData.expenses, 'CAPITAL').length === 0}
                    <tr>
                      <td colspan="3" class="px-4 py-4 text-center text-sm text-gray-500">No capital expenses recorded for this period</td>
                    </tr>
                  {:else}
                    {#each getExpensesByType(reportData.expenses, 'CAPITAL') as expense}
                      <tr>
                        <td class="px-4 py-2 text-sm text-gray-500">{formatDate(expense.created_at)}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">{expense.description}</td>
                        <td class="px-4 py-2 text-sm text-red-600 font-medium">{formatCurrency(expense.amount)}</td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" class="px-4 py-3 text-right font-bold">Total Capital Expenses</td>
                    <td class="px-4 py-3 text-red-600 font-bold">{formatCurrency(calculateTotalByType(reportData.expenses, 'CAPITAL'))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Other Expenses Section -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Receipt class="h-5 w-5" />
              Other Expenses
            </h2>
          </div>
          <div class="p-4">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {#if reportData.expenses.filter((e: Expense) => e.type !== 'OPERATIONAL' && e.type !== 'CAPITAL').length === 0}
                    <tr>
                      <td colspan="4" class="px-4 py-4 text-center text-sm text-gray-500">No other expenses recorded for this period</td>
                    </tr>
                  {:else}
                    {#each reportData.expenses.filter((e: Expense) => e.type !== 'OPERATIONAL' && e.type !== 'CAPITAL') as expense}
                      <tr>
                        <td class="px-4 py-2 text-sm text-gray-500">{formatDate(expense.created_at)}</td>
                        <td class="px-4 py-2 text-sm text-gray-500">
                          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            {expense.type === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' : 
                             expense.type === 'UTILITIES' ? 'bg-green-100 text-green-800' : 
                             expense.type === 'SUPPLIES' ? 'bg-indigo-100 text-indigo-800' : 
                             expense.type === 'SALARY' ? 'bg-pink-100 text-pink-800' : 
                             'bg-gray-100 text-gray-800'}">
                            {expense.type}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-900">{expense.description}</td>
                        <td class="px-4 py-2 text-sm text-red-600 font-medium">{formatCurrency(expense.amount)}</td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="px-4 py-3 text-right font-bold">Total Other Expenses</td>
                    <td class="px-4 py-3 text-red-600 font-bold">{formatCurrency(reportData.expenses
                      .filter((e: Expense) => e.type !== 'OPERATIONAL' && e.type !== 'CAPITAL')
                      .reduce((sum: number, expense: Expense) => sum + Number(expense.amount), 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Net Income Section -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 md:col-span-2">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Wallet class="h-5 w-5" />
              Net Income
            </h2>
          </div>
          <div class="p-4">
            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="font-medium">Gross Income</span>
                <span class="text-green-600 font-semibold">{formatCurrency(reportData.totals.grossIncome)}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="font-medium">Total Expenses</span>
                <span class="text-red-600 font-semibold">- {formatCurrency(calculateTotalExpenses(reportData.expenses))}</span>
              </div>
              <div class="flex justify-between items-center py-2 pt-4 font-bold text-lg">
                <span>Net Income</span>
                <span class={reportData.totals.grossIncome - calculateTotalExpenses(reportData.expenses) >= 0 ? "text-green-700" : "text-red-700"}>
                  {formatCurrency(reportData.totals.grossIncome - calculateTotalExpenses(reportData.expenses))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profit Sharing Section -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 md:col-span-2">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <PiggyBank class="h-5 w-5" />
              Profit Sharing
            </h2>
          </div>
          <div class="p-4">
            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="font-medium">40% Share</span>
                <span class={calculateProfitSharing(reportData.totals.grossIncome, reportData.expenses, 40) >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {formatCurrency(calculateProfitSharing(reportData.totals.grossIncome, reportData.expenses, 40))}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="font-medium">60% Share</span>
                <span class={calculateProfitSharing(reportData.totals.grossIncome, reportData.expenses, 60) >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {formatCurrency(calculateProfitSharing(reportData.totals.grossIncome, reportData.expenses, 60))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
  
<style>
</style>