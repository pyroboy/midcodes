<script lang="ts">
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Printer, ArrowDownToLine } from 'lucide-svelte';
  import PaymentReportTable from './PaymentReportTable.svelte';
  import ReportFilter from './ReportFilter.svelte';
  import type { LeaseReportData } from './reportSchema';
  
  let { data } = $props();
  let reportData = $state<LeaseReportData>(data.reportData);
  
  $effect(() => {
    reportData = data.reportData;
  });
  
  function handlePrint() {
    window.print();
  }
  
  // TODO: Implement this function to export as Excel/CSV
  async function handleExport() {
    alert('Export functionality not yet implemented.');
  }
  
  function formatMonth(monthStr: string) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Monthly Payment Report | Dorm Management</title>
  <style>
    @media print {
      .no-print {
        display: none;
      }
      
      .print-container {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      /* Ensure table fits on printed page */
      table {
        font-size: 10px;
        width: 100%;
        table-layout: fixed;
      }
      
      th, td {
        padding: 4px;
      }
    }
  </style>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Monthly Payment Report</h1>
        <p class="text-muted-foreground">
          {#if reportData.reportPeriod.startMonth === reportData.reportPeriod.endMonth}
            For {formatMonth(reportData.reportPeriod.startMonth)}
          {:else}
            {formatMonth(reportData.reportPeriod.startMonth)} to {formatMonth(reportData.reportPeriod.endMonth)}
          {/if}
        </p>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex space-x-2 no-print">
        <Button variant="outline" size="sm" onclick={handlePrint}>
          <Printer class="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" size="sm" onclick={handleExport}>
          <ArrowDownToLine class="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
    
    <!-- Filter Section -->
    <div class="no-print">
      <ReportFilter formData={data.filterForm} properties={data.properties} />
    </div>
    
    <!-- Report Table -->
    <div class="print-container">
      <Card.Root>
        <Card.Header>
          <Card.Title>Payment Status Report</Card.Title>
          <Card.Description>
            Active leases grouped by floor and rental unit
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <PaymentReportTable {reportData} />
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
