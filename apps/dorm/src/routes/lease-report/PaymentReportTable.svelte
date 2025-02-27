<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { Badge } from '$lib/components/ui/badge';
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
  
  // Helper function to get badge color for payment status
  function getStatusBadge(status: PaymentStatus) {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  // Format month for display (e.g., "2023-01" to "Jan 2023")
  function formatMonth(monthStr: string) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
</script>

<div class="overflow-x-auto">
  <Table.Root class="min-w-[1200px]">
    <Table.Header class="bg-slate-50">
      <Table.Row>
        <Table.Head class="w-[200px]">Floor / Room</Table.Head>
        <Table.Head class="w-[150px]">Tenant</Table.Head>
        
        <!-- Generate month columns for rent -->
        {#each reportData.reportPeriod.months as month}
          <Table.Head class="w-[100px] text-center">
            Rent<br>{formatMonth(month)}
          </Table.Head>
        {/each}
        
        <!-- Generate month columns for utilities -->
        {#each reportData.reportPeriod.months as month}
          <Table.Head class="w-[100px] text-center">
            Utilities<br>{formatMonth(month)}
          </Table.Head>
        {/each}
      </Table.Row>
    </Table.Header>
    
    <Table.Body>
      {#if reportData.floors.length === 0}
        <Table.Row>
          <Table.Cell colspan={2 + reportData.reportPeriod.months.length * 2} class="text-center py-8">
            No data available for the selected filters.
          </Table.Cell>
        </Table.Row>
      {/if}
      
      {#each reportData.floors as floor}
        <!-- Floor Header Row -->
        <Table.Row class="bg-slate-100">
          <Table.Cell colspan={2 + reportData.reportPeriod.months.length * 2} class="font-semibold">
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
                    <div class="text-xs space-y-1 p-1">
                      <div class="font-medium">{tenantRecord.leaseName}</div>
                      <div>Security Deposit: ₱{tenantRecord.securityDeposit.toLocaleString()}</div>
                      <div>Started: {formatDate(tenantRecord.startDate)}</div>
                      <div class="mt-2 pt-1 border-t border-gray-200">
                        <div class="font-medium">Payment Summary</div>
                        <div>Total Paid: ₱{tenantRecord.totalPaid.toLocaleString()}</div>
                        <div>- Rent: ₱{tenantRecord.totalRentPaid.toLocaleString()}</div>
                        <div>- Utilities: ₱{tenantRecord.totalUtilitiesPaid.toLocaleString()}</div>
                        <div>Pending: ₱{tenantRecord.totalPending.toLocaleString()}</div>
                        <div class="font-medium mt-1">{getPaymentStatus(tenantRecord.totalPaid, tenantRecord.totalPending)}</div>
                      </div>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Root>
              </Table.Cell>
              
              <!-- Rent Payment Status Cells -->
              {#each tenantRecord.monthlyPayments as payment}
                <Table.Cell class="text-center">
                  {#if payment.rent !== 'PENDING' || (payment.rentAmount && payment.rentAmount > 0)}
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        <span class={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.rent)}`}>
                          {payment.rent}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        <div class="text-xs p-1">
                          <div class="font-medium">Rent Payment for {payment.month}</div>
                          <div>Amount: ₱{payment.rentAmount?.toLocaleString() ?? '0'}</div>
                          {#if payment.rentPaidAmount && payment.rentPaidAmount > 0}
                            <div>Paid: ₱{payment.rentPaidAmount.toLocaleString()}</div>
                          {/if}
                          <div>Status: {payment.rent}</div>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Root>
                  {/if}
                </Table.Cell>
              {/each}
              
              <!-- Utilities Payment Status Cells -->
              {#each tenantRecord.monthlyPayments as payment}
                <Table.Cell class="text-center">
                  {#if payment.utilities !== 'PENDING' || (payment.utilitiesAmount && payment.utilitiesAmount > 0)}
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        <span class={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.utilities)}`}>
                          {payment.utilities}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        <div class="text-xs p-1">
                          <div class="font-medium">Utilities Payment for {payment.month}</div>
                          <div>Amount: ₱{payment.utilitiesAmount?.toLocaleString() ?? '0'}</div>
                          {#if payment.utilitiesPaidAmount && payment.utilitiesPaidAmount > 0}
                            <div>Paid: ₱{payment.utilitiesPaidAmount.toLocaleString()}</div>
                          {/if}
                          <div>Status: {payment.utilities}</div>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Root>
                  {/if}
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {/each}
      {/each}
    </Table.Body>
  </Table.Root>
</div>
