<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import * as Card from '$lib/components/ui/card';
  import type { LeaseReportData, PaymentStatus } from './reportSchema';
  
  let { reportData } = $props<{
    reportData: LeaseReportData;
  }>();

  // Helper function to format dates
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Helper function to get status color class for cell backgrounds
  function getCellBackgroundColor(status: PaymentStatus): string {
    switch (status) {
      case 'PAID':
        return 'bg-green-50 border-green-200';
      case 'PARTIAL':
        return 'bg-yellow-50 border-yellow-200';
      case 'PENDING':
        return 'bg-orange-50 border-orange-200';
      case 'OVERDUE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }
  
  // Helper function to get status color for the symbols
  function getStatusSymbolColor(payment: any, type: 'rent' | 'utilities' | 'penalty'): string {
    const status = payment[type];
    const amountField = type === 'rent' ? 'rentAmount' : type === 'utilities' ? 'utilitiesAmount' : 'penaltyAmount';
    const amount = payment[amountField] || 0;
    
    // No amount (0 Amount)
    if (amount === 0) {
      return 'text-gray-300';
    }
    
    // Different statuses have different colors
    switch (status) {
      case 'PAID':
        return 'text-green-600';      // Fully Paid: Green
      case 'PARTIAL':
        return 'text-yellow-600';     // Partial: Yellow
      case 'PENDING':
        return 'text-orange-500';     // Pending: Orange
      case 'OVERDUE':
        return 'text-red-600';        // Overdue: Red
      default:
        return 'text-gray-400';
    }
  }
  
  // Format month for display (e.g., "2023-01" to "Jan 2023")
  function formatMonth(monthStr: string) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  
  // Format currency
  function formatCurrency(amount?: number): string {
    if (amount === undefined || amount === 0) return '₱0';
    return `₱${amount.toLocaleString()}`;
  }
  
  // Get a descriptive payment status based on the amounts
  function getPaymentStatus(paid: number, pending: number): string {
    const total = paid + pending;
    if (total === 0) return "No payments recorded";
    
    const paymentPercentage = (paid / total) * 100;
    
    if (paymentPercentage === 0) return "No payments made";
    else if (paymentPercentage < 25) return "Few payments made";
    else if (paymentPercentage < 50) return "Some payments made";
    else if (paymentPercentage < 75) return "Most payments made";
    else if (paymentPercentage < 100) return "Almost all payments made";
    else return "All payments completed";
  }
  
  // Get overall status for a month (combines rent, utilities, and penalty)
  function getOverallStatus(payment: any): PaymentStatus {
    if (payment.rent === 'OVERDUE' || payment.utilities === 'OVERDUE' || payment.penalty === 'OVERDUE') {
      return 'OVERDUE';
    } else if (payment.rent === 'PENDING' || payment.utilities === 'PENDING' || payment.penalty === 'PENDING') {
      return 'PENDING';
    } else if (payment.rent === 'PARTIAL' || payment.utilities === 'PARTIAL' || payment.penalty === 'PARTIAL') {
      return 'PARTIAL';
    } else {
      return 'PAID';
    }
  }

  // Check if any billing exists for a payment type
  function hasBilling(payment: any, type: 'rent' | 'utilities' | 'penalty'): boolean {
    const amountField = type === 'rent' ? 'rentAmount' : type === 'utilities' ? 'utilitiesAmount' : 'penaltyAmount';
    return (payment[amountField] && payment[amountField] > 0);
  }
  
  // Get symbol for payment type based on status
  function getPaymentSymbol(payment: any, type: 'rent' | 'utilities' | 'penalty'): string {
    const status = payment[type];
    const amountField = type === 'rent' ? 'rentAmount' : type === 'utilities' ? 'utilitiesAmount' : 'penaltyAmount';
    const amount = payment[amountField] || 0;
    
    // No billing or 0 amount: empty symbol
    if (amount === 0) {
      if (type === 'rent') return '○'; // Empty circle
      if (type === 'utilities') return '□'; // Empty square
      return '✕'; // X
    }
    
    // Filled symbol for payment made (PAID and PARTIAL)
    if (status === 'PAID' || status === 'PARTIAL') {
      if (type === 'rent') return '●'; // Filled circle
      if (type === 'utilities') return '■'; // Filled square
      return '✕'; // X
    }
    
    // Empty symbol for no payment (PENDING or OVERDUE)
    if (type === 'rent') return '○'; // Empty circle
    if (type === 'utilities') return '□'; // Empty square
    return '✕'; // X
  }

  // Get status label but return "No Billing" for zero amounts
  function getStatusLabel(payment: any, type: string): string {
    const status = payment[type];
    const amountField = type === 'rent' ? 'rentAmount' : type === 'utilities' ? 'utilitiesAmount' : 'penaltyAmount';
    const amount = payment[amountField] || 0;
    
    if (amount === 0) {
      return "No Billing";
    }
    
    return status.charAt(0) + status.slice(1).toLowerCase();
  }
</script>

<div class="overflow-x-auto">
  <Table.Root class="min-w-[800px]">
    <Table.Header class="bg-slate-50">
      <Table.Row>
        <Table.Head class="w-[200px]">Floor / Room</Table.Head>
        <Table.Head class="w-[180px]">Tenant</Table.Head>
        
        <!-- Generate month columns -->
        {#each reportData.reportPeriod.months as month}
          <Table.Head class="w-[100px] text-center">
            {formatMonth(month)}
          </Table.Head>
        {/each}
      </Table.Row>
    </Table.Header>
    
    <Table.Body>
      {#if reportData.floors.length === 0}
        <Table.Row>
          <Table.Cell colspan={2 + reportData.reportPeriod.months.length} class="text-center py-8">
            No data available for the selected filters.
          </Table.Cell>
        </Table.Row>
      {/if}
      
      {#each reportData.floors as floor}
        <!-- Floor Header Row -->
        <Table.Row class="bg-slate-100">
          <Table.Cell colspan={2 + reportData.reportPeriod.months.length} class="font-semibold">
            {floor.floorNumber} {floor.wing ? `(${floor.wing})` : ''}
          </Table.Cell>
        </Table.Row>
        
        {#each floor.rentalUnits as unit}
          {#each unit.tenantRecords as tenantRecord, tenantIndex}
            <Table.Row>
              <!-- Floor/Room cell - only show on first tenant in a unit -->
              <Table.Cell class="align-top">
                {#if tenantIndex === 0}
                  <div class="font-medium">{unit.roomName}</div>
                  <div class="text-xs text-gray-500">Capacity: {unit.capacity} {unit.capacity === 1 ? 'Person' : 'People'}</div>
                {/if}
              </Table.Cell>
              
              <!-- Tenant Name -->
              <Table.Cell class="align-top">
                <Tooltip.Root>
                  <Tooltip.Trigger>
                    <div class="font-medium cursor-help underline decoration-dotted">{tenantRecord.tenantName}</div>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <Card.Root class="w-64">
                      <Card.Header class="p-3">
                        <Card.Title class="text-sm">{tenantRecord.leaseName}</Card.Title>
                        <Card.Description class="text-xs">
                          Security Deposit: {formatCurrency(tenantRecord.securityDeposit)}<br/>
                          Started: {formatDate(tenantRecord.startDate)}
                        </Card.Description>
                      </Card.Header>
                      <Card.Content class="p-3 space-y-2">
                        <div class="space-y-1">
                          <div class="text-xs font-medium">Payment Summary</div>
                          <div class="text-xs flex justify-between">
                            <span>Total Paid:</span>
                            <span>{formatCurrency(tenantRecord.totalPaid)}</span>
                          </div>
                          <div class="text-xs flex justify-between">
                            <span>Rent Paid:</span>
                            <span>{formatCurrency(tenantRecord.totalRentPaid)}</span>
                          </div>
                          <div class="text-xs flex justify-between">
                            <span>Utilities Paid:</span>
                            <span>{formatCurrency(tenantRecord.totalUtilitiesPaid)}</span>
                          </div>
                          <div class="text-xs flex justify-between">
                            <span>Penalties Paid:</span>
                            <span>{formatCurrency(tenantRecord.totalPenaltyPaid)}</span>
                          </div>
                          <div class="text-xs flex justify-between">
                            <span>Pending:</span>
                            <span>{formatCurrency(tenantRecord.totalPending)}</span>
                          </div>
                        </div>
                        <div class="text-xs font-medium pt-1">
                          {getPaymentStatus(tenantRecord.totalPaid, tenantRecord.totalPending)}
                        </div>
                      </Card.Content>
                    </Card.Root>
                  </Tooltip.Content>
                </Tooltip.Root>
              </Table.Cell>
              
              <!-- Payment Status Cells -->
              {#each tenantRecord.monthlyPayments as payment}
                <Table.Cell class="text-center py-2 px-1">
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <div class={`inline-flex items-center border rounded px-3 py-2 ${getCellBackgroundColor(getOverallStatus(payment))}`}>
                        <!-- Rent symbol (always show) -->
                        <span 
                          class={`text-xl mr-2 ${getStatusSymbolColor(payment, 'rent')}`}
                          title="Rent"
                        >
                          {getPaymentSymbol(payment, 'rent')}
                        </span>
                        
                        <!-- Utilities symbol (always show) -->
                        <span 
                          class={`text-xl mr-2 ${getStatusSymbolColor(payment, 'utilities')}`}
                          title="Utilities"
                        >
                          {getPaymentSymbol(payment, 'utilities')}
                        </span>
                        
                        <!-- Penalty symbol (always show) -->
                        <span 
                          class={`text-xl ${getStatusSymbolColor(payment, 'penalty')}`}
                          title="Penalty"
                        >
                          {getPaymentSymbol(payment, 'penalty')}
                        </span>
                      </div>
                    </Tooltip.Trigger>
                    
                    <Tooltip.Content>
                      <Card.Root class="w-64">
                        <Card.Header class="p-3">
                          <Card.Title class="text-sm">{formatMonth(payment.month)} Payment Summary</Card.Title>
                        </Card.Header>
                        <Card.Content class="p-3 space-y-3">
                          <div class="flex items-center justify-between mb-2">
                            <div class="text-xs font-medium">Legend</div>
                            <div class="flex gap-2">
                              <span class="text-xs flex items-center">
                                <span class="inline-block mr-1 text-green-600">●</span> Rent
                              </span>
                              <span class="text-xs flex items-center">
                                <span class="inline-block mr-1 text-yellow-600">■</span> Utilities
                              </span>
                              <span class="text-xs flex items-center">
                                <span class="inline-block mr-1 text-red-600">✕</span> Penalty
                              </span>
                            </div>
                          </div>
                          
                          <!-- Status explanation -->
                          <div class="bg-gray-50 p-2 rounded text-xs mb-2 space-y-1">
                            <div class="font-medium">Symbol Legend:</div>
                            <div class="flex flex-col gap-1">
                              <span>
                                <span class="text-green-600 font-medium">Filled symbol (●,■)</span>: Paid or Partial
                              </span>
                              <span>
                                <span class="text-orange-500 font-medium">Empty symbol (○,□)</span>: Pending or Overdue
                              </span>
                              <span>
                                <span class="text-gray-400 font-medium">Light symbol</span>: No amount/billing
                              </span>
                            </div>
                          </div>
                          
                          <!-- Rent info -->
                          <div class="space-y-1">
                            <div class="flex justify-between items-center">
                              <span class="text-xs font-medium flex items-center">
                                <span class={`inline-block mr-1 text-sm ${getStatusSymbolColor(payment, 'rent')}`}>
                                  {getPaymentSymbol(payment, 'rent')}
                                </span> 
                                Rent:
                              </span>
                              <span class={`text-xs px-2 rounded ${(payment.rentAmount || 0) === 0 ? 'bg-gray-50 text-gray-500' : getCellBackgroundColor(payment.rent)}`}>
                                {getStatusLabel(payment, 'rent')}
                              </span>
                            </div>
                            <div class="text-xs flex justify-between">
                              <span>Amount:</span>
                              <span>{formatCurrency(payment.rentAmount)}</span>
                            </div>
                            {#if payment.rentPaidAmount}
                              <div class="text-xs flex justify-between">
                                <span>Paid:</span>
                                <span>{formatCurrency(payment.rentPaidAmount)}</span>
                              </div>
                            {/if}
                          </div>
                          
                          <!-- Utilities info -->
                          <div class="space-y-1">
                            <div class="flex justify-between items-center">
                              <span class="text-xs font-medium flex items-center">
                                <span class={`inline-block mr-1 text-sm ${getStatusSymbolColor(payment, 'utilities')}`}>
                                  {getPaymentSymbol(payment, 'utilities')}
                                </span> 
                                Utilities:
                              </span>
                              <span class={`text-xs px-2 rounded ${(payment.utilitiesAmount || 0) === 0 ? 'bg-gray-50 text-gray-500' : getCellBackgroundColor(payment.utilities)}`}>
                                {getStatusLabel(payment, 'utilities')}
                              </span>
                            </div>
                            <div class="text-xs flex justify-between">
                              <span>Amount:</span>
                              <span>{formatCurrency(payment.utilitiesAmount)}</span>
                            </div>
                            {#if payment.utilitiesPaidAmount}
                              <div class="text-xs flex justify-between">
                                <span>Paid:</span>
                                <span>{formatCurrency(payment.utilitiesPaidAmount)}</span>
                              </div>
                            {/if}
                          </div>
                          
                          <!-- Penalty info -->
                          <div class="space-y-1">
                            <div class="flex justify-between items-center">
                              <span class="text-xs font-medium flex items-center">
                                <span class={`inline-block mr-1 text-sm ${getStatusSymbolColor(payment, 'penalty')}`}>
                                  {getPaymentSymbol(payment, 'penalty')}
                                </span> 
                                Penalty:
                              </span>
                              <span class={`text-xs px-2 rounded ${(payment.penaltyAmount || 0) === 0 ? 'bg-gray-50 text-gray-500' : getCellBackgroundColor(payment.penalty)}`}>
                                {getStatusLabel(payment, 'penalty')}
                              </span>
                            </div>
                            <div class="text-xs flex justify-between">
                              <span>Amount:</span>
                              <span>{formatCurrency(payment.penaltyAmount)}</span>
                            </div>
                            {#if payment.penaltyPaidAmount}
                              <div class="text-xs flex justify-between">
                                <span>Paid:</span>
                                <span>{formatCurrency(payment.penaltyPaidAmount)}</span>
                              </div>
                            {/if}
                          </div>
                          
                          <div class="pt-2 mt-1 border-t border-gray-200">
                            <div class="text-xs flex justify-between font-medium">
                              <span>Total Due:</span>
                              <span>{formatCurrency((payment.rentAmount || 0) + (payment.utilitiesAmount || 0) + (payment.penaltyAmount || 0))}</span>
                            </div>
                            <div class="text-xs flex justify-between font-medium">
                              <span>Total Paid:</span>
                              <span>{formatCurrency((payment.rentPaidAmount || 0) + (payment.utilitiesPaidAmount || 0) + (payment.penaltyPaidAmount || 0))}</span>
                            </div>
                          </div>
                        </Card.Content>
                      </Card.Root>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {/each}
      {/each}
    </Table.Body>
  </Table.Root>
</div>