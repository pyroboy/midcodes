<!-- RentCollectionDashboard.svelte -->
<script lang="ts">
    import { Building2, Receipt, PiggyBank, Wallet } from 'lucide-svelte';
    
    interface FloorData {
        income: number;
        note: string;
    }

    type FloorName = 'secondFloor' | 'thirdFloor';

    interface FloorDataMap {
        secondFloor: FloorData;
        thirdFloor: FloorData;
    }

    interface MonthData {
        floorData: FloorDataMap;
        operationalExpenses: {
            electricity: number;
            water: number;
            janitorialSupplies: number;
            internet: number;
            janitorialService: number;
        };
        capitalExpenses: {
            repairs: number;
            cctvInstallation: number;
            airconDownpayment: number;
        };
        profitSharing: {
            forty: number;
            sixty: number;
        };
        totals: {
            grossIncome: number;
            operationalExpenses: number;
            netBeforeCapEx: number;
            capitalExpenses: number;
            finalNet: number;
        };
    }

    type Month = 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';

    type RentData = {
        [key in Month]?: MonthData;
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);
    let selectedYear = currentYear.toString();
    let selectedMonth: Month = 'january';

    const rentData: RentData = {
      january: {
        floorData: {
          secondFloor: {
            income: 36000,
            note: ''
          },
          thirdFloor: {
            income: 48500,
            note: 'Room 2 - ₱29,500 (6 months full payment)'
          }
        },
        operationalExpenses: {
          electricity: 3000,
          water: 3000,
          janitorialSupplies: 1000,
          internet: 1700,
          janitorialService: 4000
        },
        capitalExpenses: {
          repairs: 5000,
          cctvInstallation: 5000,
          airconDownpayment: 5000
        },
        profitSharing: {
          forty: 28720,
          sixty: 43080
        },
        totals: {
          grossIncome: 84500,
          operationalExpenses: 12700,
          netBeforeCapEx: 71800,
          capitalExpenses: 15000,
          finalNet: 28080
        }
      }
    };

    const months = [
      'january', 'february', 'march', 'april',
      'may', 'june', 'july', 'august',
      'september', 'october', 'november', 'december'
    ];

    const isNumber = (value: unknown): value is number => {
        return typeof value === 'number';
    };

    const formatCurrency = (amount: unknown): string => {
        const numAmount = isNumber(amount) ? amount : 0;
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            maximumFractionDigits: 0
        }).format(numAmount);
    };

    $: currentData = rentData[selectedMonth as Month] || rentData.january as MonthData;
  </script>
  
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-6xl mx-auto space-y-8">
      <div class="text-center space-y-4">
        <h1 class="text-4xl font-bold text-gray-900">Monthly Rent Collection</h1>
        <div class="flex gap-4 justify-center items-center">
          <div class="w-32">
            <select 
              bind:value={selectedYear}
              class="w-full text-lg bg-white border-2 hover:bg-gray-50 rounded p-2"
            >
              {#each years as year}
                <option value={year.toString()}>{year}</option>
              {/each}
            </select>
          </div>
          <div class="w-48">
            <select 
              bind:value={selectedMonth}
              class="w-full text-lg bg-white border-2 hover:bg-gray-50 rounded p-2"
            >
              {#each months as month}
                <option value={month}>
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </option>
              {/each}
            </select>
          </div>
        </div>
      </div>
  
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Gross Income Section -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Building2 class="h-5 w-5" />
              Gross Monthly Income
            </h2>
          </div>
          <div class="p-6">
            <div class="space-y-6">
              {#each ['secondFloor', 'thirdFloor'] as floor}
                {@const floorKey = floor as FloorName}
                <div class="bg-white rounded-lg p-4 shadow-sm">
                  <h3 class="font-semibold text-lg text-gray-800 mb-3">
                    {floorKey === 'secondFloor' ? '2nd Floor' : '3rd Floor'} Rent
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold text-lg text-gray-900">
                        {formatCurrency(currentData.floorData[floorKey].income)}
                      </span>
                    </div>
                    {#if currentData.floorData[floorKey].note}
                      <div class="text-sm text-gray-600 italic">
                        Note: {currentData.floorData[floorKey].note}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
              <div class="pt-4 border-t-2 flex justify-between items-center">
                <span class="font-semibold text-lg">Total Gross Income</span>
                <span class="font-bold text-xl text-gray-900">
                  {formatCurrency(currentData.totals.grossIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Operational Expenses -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Receipt class="h-5 w-5" />
              Operational Expenses
            </h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              {#each Object.entries(currentData.operationalExpenses) as [key, amount]}
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">
                    {key.replace(/([A-Z])/g, ' $1').split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </span>
                  <span class="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                </div>
              {/each}
              <div class="pt-4 mt-4 border-t-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-800 font-medium">Total Operational Expenses</span>
                  <span class="font-bold text-gray-900">
                    {formatCurrency(currentData.totals.operationalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Capital Expenses -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <Wallet class="h-5 w-5" />
              Capital Expenses
            </h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              {#each Object.entries(currentData.capitalExpenses) as [key, amount]}
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">
                    {key.replace(/([A-Z])/g, ' $1').split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </span>
                  <span class="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                </div>
              {/each}
              <div class="pt-4 mt-4 border-t-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-800 font-medium">Total Capital Expenses</span>
                  <span class="font-bold text-gray-900">
                    {formatCurrency(currentData.totals.capitalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Final Summary -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div class="border-b bg-gray-50 p-4">
            <h2 class="flex items-center gap-2 text-gray-700 font-semibold text-xl">
              <PiggyBank class="h-5 w-5" />
              Profit Distribution
            </h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Net Before Capital Expenses</span>
                <span class="font-semibold text-gray-900">
                  {formatCurrency(currentData.totals.netBeforeCapEx)}
                </span>
              </div>
              <div class="pl-4 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">40% Share</span>
                  <span class="font-semibold text-gray-900">
                    {formatCurrency(currentData.profitSharing.forty)}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">60% Share</span>
                  <span class="font-semibold text-gray-900">
                    {formatCurrency(currentData.profitSharing.sixty)}
                  </span>
                </div>
              </div>
              <div class="pt-4 mt-4 border-t-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-800 font-medium">Final Net (After CapEx)</span>
                  <span class="font-bold text-xl text-green-600">
                    {formatCurrency(currentData.totals.finalNet)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <style>
  </style>