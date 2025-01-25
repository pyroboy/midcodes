<script lang="ts">
  export let referenceNumber: string;
  export let documentType: string;
  export let copies: number;
  export let amount: number;
  export let paymentDate: string;
  export let studentName: string;
  export let studentId: string;
  export let purpose: string;
  export let status: string;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };
</script>

<div class="border rounded-lg bg-white p-4">
  <div class="space-y-4">
    <div class="grid grid-cols-3 gap-4 pb-4 border-b">
      <div class="col-span-2">
        <div class="text-2xl font-medium">{referenceNumber}</div>
        <div class="text-gray-600">{documentType} • {copies} copies</div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-medium">{formatAmount(amount)}</div>
        <div class="text-sm text-gray-600">Paid on {formatDate(paymentDate)}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      {#each [
        ['Student', studentName],
        ['ID', studentId],
        ['Purpose', purpose],
        ['Status', status]
      ] as [label, value]}
        <div class="border rounded p-3">
          <div class="text-sm text-gray-600">{label}</div>
          <div class="font-medium">{value}</div>
        </div>
      {/each}
    </div>
  </div>
</div>