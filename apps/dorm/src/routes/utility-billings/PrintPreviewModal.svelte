<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import type { MeterData, ShareData } from './types';
	import { Button } from '$lib/components/ui/button';
	type Props = {
		open: boolean;
		reading: MeterData | null;
		data: ShareData[];
		onBack: () => void;
	};

	let {
		open = $bindable(),
		reading,
		data,
		onBack,
		close
	}: Props & { close: () => void } = $props();

	let loading = $state(true);

	function handleClose() {
		close();
	}

	/* === In-place print utility === */
	let iframe = $state<HTMLIFrameElement | null>(null);

	function formatDate(date: string | null) {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString();
	}

	function getHtml(meter: MeterData, data: ShareData[]) {
		return `
 <html>
  <head>
    <title>Utility Share Breakdown</title>
    <style>
      @page { margin: 1cm; size: portrait; }
      body   { margin: 0; padding: 0; font-family: "Segoe UI", Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
      .wrapper { max-width: 720px; margin: 0 auto; }
      .header   { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
      .header h1 { margin: 0; font-size: 1.4rem; font-weight: 700; }
      .meta     { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 0.75rem; }
      .meta dt  { font-weight: 600; }
      .meta dd  { margin: 0; }
      .total-row { background: #f7fafc; font-weight: 700; }

      table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
      thead th { background: #f1f5f9; color: #334155; font-weight: 600; text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #cbd5e1; }
      tbody td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; }
      tbody tr:last-child td { border-bottom: none; }

    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>Utility Share Breakdown</h1>
        <div class="meta">
          <dt>Meter</dt><dd>${meter.meterName}</dd>
          <dt>Period</dt><dd>${formatDate(meter.lastReadingDate)} – ${formatDate(meter.currentReadingDate)}</dd>
          ${meter.daysDiff ? `<dt>Days Gap</dt><dd>${meter.daysDiff} days</dd>` : ''}
          <dt>Consumption</dt><dd>${meter.consumption?.toFixed(2)}</dd>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Lease</th>
            <th style="text-align:right">Share Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data
						.map(
							(r) => `
            <tr>
              <td>${r.tenant.full_name}</td>
              <td>${r.lease.name}</td>
              <td style="text-align:right">₱${r.share.toFixed(2)}</td>
            </tr>`
						)
						.join('')}
          <tr class="total-row">
            <td colspan="2"><strong>Total</strong></td>
            <td style="text-align:right"><strong>₱${data.reduce((s, d) => s + d.share, 0).toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

    
    </div>
  </body>
</html>`;
	}

	$effect(() => {
		if (open && reading) {
			loading = true;
			// Defer the expensive work to prevent blocking the UI
			const timer = setTimeout(() => {
				// Create and append iframe
				iframe = document.createElement('iframe');
				iframe.style.position = 'absolute';
				iframe.style.width = '0';
				iframe.style.height = '0';
				iframe.style.border = 'none';
				document.body.appendChild(iframe);

				const html = getHtml(reading, data);

				iframe.contentDocument?.open();
				iframe.contentDocument?.write(html);
				iframe.contentDocument?.close();

				iframe.onload = () => {
					iframe?.contentWindow?.focus();
					loading = false; // Preview is ready
				};
			}, 50); // A small delay is enough to allow the UI to update

			return () => clearTimeout(timer);
		}

		// Cleanup function: runs when `open` becomes false or component unmounts
		return () => {
			if (iframe) {
				iframe.remove();
				iframe = null;
			}
		};
	});

	function handlePrint() {
		if (iframe) {
			iframe.contentWindow?.print();
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Content class="sm:max-w-[800px]">
		<Dialog.Header>
			<Dialog.Title>Print Preview</Dialog.Title>
			<Dialog.Description>Review the billing statement before printing.</Dialog.Description>
		</Dialog.Header>

		{#if loading}
			<div class="flex items-center justify-center p-8">
				<p class="text-muted-foreground">Generating preview...</p>
			</div>
		{:else if reading && data.length}
			<div class="space-y-4">
				<div>
					<p><strong>Meter:</strong> {reading.meterName}</p>
					<p>
						<strong>Period:</strong>
						{formatDate(reading.lastReadingDate)} – {formatDate(reading.currentReadingDate)}
					</p>
					{#if reading.daysDiff}
						<p><strong>Days Gap:</strong> {reading.daysDiff} days</p>
					{/if}
					<p><strong>Consumption:</strong> {reading.consumption?.toFixed(2)}</p>
					<p><strong>Total Cost:</strong> ₱{data.reduce((s, d) => s + d.share, 0).toFixed(2)}</p>
				</div>

				<table class="w-full text-sm text-left">
					<thead class="bg-gray-50">
						<tr>
							<th class="p-2">Tenant</th>
							<th class="p-2">Lease</th>
							<th class="p-2 text-right">Share</th>
						</tr>
					</thead>
					<tbody>
						{#each data as row}
							<tr class="border-b">
								<td class="p-2">{row.tenant.full_name}</td>
								<td class="p-2">{row.lease.name}</td>
								<td class="p-2 text-right">₱{row.share.toFixed(2)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="flex items-center justify-center p-8">
				<p class="text-muted-foreground">No data available for preview.</p>
			</div>
		{/if}

		<!-- Print button inside the modal footer -->
		<div class="flex justify-end gap-3 mt-4">
			<Button variant="outline" onclick={handleClose}>Back</Button>
			<Button onclick={handlePrint}>Print</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
