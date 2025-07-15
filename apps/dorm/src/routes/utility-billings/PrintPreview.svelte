<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  let { data, reading, onBack, onPrint }: { data: any[], reading: any, onBack: () => void, onPrint: (data: any) => void } = $props();

  function handlePrint() {
    if (onPrint) {
      onPrint(data);
    }
    window.print();
  }
</script>

<div class="printable-area space-y-4">
  <h3 class="text-xl font-bold text-center">Utility Share Breakdown</h3>

  <div class="grid grid-cols-2 gap-4 text-sm">
    <div>
      <p><strong>Meter:</strong> {reading.meter_name}</p>
      <p><strong>Reading Date:</strong> {new Date(reading.reading_date).toLocaleDateString()}</p>
    </div>
    <div class="text-right">
      <p><strong>Total Consumption:</strong> {reading.consumption.toFixed(2)}</p>
      <p><strong>Total Cost:</strong> ₱{(reading.cost || 0).toFixed(2)}</p>
    </div>
  </div>

  <table class="w-full text-sm text-left">
    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
      <tr>
        <th scope="col" class="px-6 py-3">Tenant</th>
        <th scope="col" class="px-6 py-3">Lease</th>
        <th scope="col" class="px-6 py-3 text-right">Share Amount</th>
      </tr>
    </thead>
    <tbody>
      {#each data as item}
        <tr class="bg-white border-b">
          <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.tenant.full_name}</td>
          <td class="px-6 py-4">{item.lease.name}</td>
          <td class="px-6 py-4 text-right">₱{item.share.toFixed(2)}</td>
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr class="font-semibold text-gray-900">
        <td colspan="2" class="px-6 py-3 text-right">Total Tenants</td>
        <td class="px-6 py-3 text-right">{data.length}</td>
      </tr>
      <tr class="font-semibold text-gray-900">
        <td colspan="2" class="px-6 py-3 text-right">Total Share</td>
        <td class="px-6 py-3 text-right">₱{(reading.cost || 0).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="flex justify-end gap-2 mt-6 print-hidden">
  <Button variant="outline" onclick={onBack}>Back</Button>
  <Button onclick={handlePrint}>Print</Button>
</div>

<style>
  @media print {
    .print-hidden {
      display: none;
    }
    .printable-area {
      margin: 0;
      padding: 0;
    }
  }
</style>
