<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Switch from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import type { ShareData, MeterData } from './types';

	type Group = {
		reading: MeterData;
		data: ShareData[];
	};

	let {
		open = $bindable(false),
		groups = $bindable([] as Group[]),
		close
	}: { open: boolean; groups: Group[]; close: () => void } = $props();

	let roundNumbers = $state(false);
	let previewFrame = $state<HTMLIFrameElement | null>(null);
	let lastHtml = '';

	function handleClose() {
		close();
	}

	function formatDate(date: string | null | undefined) {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-PH');
	}

	function getMonthName(date: string | null | undefined) {
		if (!date) return 'Unknown';
		return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
	}

	function formatAmount(val: number | null | undefined) {
		if (val == null) return '0';
		return roundNumbers ? (Math.round(val / 10) * 10).toString() : val.toString();
	}

	function formatKWH(val: number | null | undefined) {
		if (val == null) return '0';
		const rounded = parseFloat(val.toString()).toFixed(1);
		// Remove .0 if it's a whole number
		return rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
	}

	function formatCurrency(val: number | null | undefined) {
		if (val == null) return '₱0';
		return roundNumbers ? `₱${Math.round(val / 10) * 10}` : `₱${val.toFixed(2)}`;
	}

	function escapeHtml(value: string | null | undefined) {
		if (value == null) return '';
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function htmlForGroups(items: Group[]) {
		// Get the billing month from the first item's current reading date
		const billingMonth = items.length > 0 ? getMonthName(items[0].reading.currentReadingDate) : 'Unknown Month';

		// Calculate total collectible for all selected billing periods
		const totalCollectible = items.reduce((sum, g) => {
			const sectionTotal = g.data.reduce((s, d) => s + d.share, 0);
			return sum + sectionTotal;
		}, 0);

		const sections = items
			.map((g) => {
				const total = g.data.reduce((s, d) => s + d.share, 0);
				return `
        <section style="margin: 0 0 12px 0; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 3px; overflow: hidden;">
          <!-- Meter Information Single Row -->
          <div style="background: #ffffff; color: #000000; padding: 8px 12px;">
            <div style="display: flex; flex-direction: column; gap: 0;">
              <div style="display: flex; align-items: center; padding: 4px 8px; background: #f5f5f5; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 18px; font-weight: 700; color: #000000;">${escapeHtml(g.reading.meterName)}</div>
                <div style="font-size: 12px; color: #666666; font-weight: 500; margin-left: auto;">${g.reading.meterType || 'Utility'} Meter</div>
              </div>

              <div style="display: flex; width: 100%;">
                <div style="flex: 1; display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-right: 1px solid #e2e8f0; background: #ffffff;">
                  <span style="font-size: 12px; font-weight: 600; color: #666666; text-transform: uppercase;">Consumption</span>
                  <div style="display: flex; align-items: center; gap: 2px;">
                    <span style="font-size: 14px; font-weight: 700; color: #000000; font-family: 'Courier New', monospace;">${formatKWH(g.reading.consumption)}</span>
                    <span style="font-size: 12px; font-weight: 600; color: #666666;">kWH</span>
                  </div>
                </div>
                <div style="flex: 1; display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #ffffff;">
                  <span style="font-size: 12px; font-weight: 600; color: #666666; text-transform: uppercase;">Total Cost</span>
                  <span style="font-size: 14px; font-weight: 700; color: #000000;">${formatCurrency(g.reading.totalCost)}</span>
                </div>
              </div>
            </div>
          </div>

            <!-- Tenants Table -->
            <div style="background: white; border-radius: 3px; overflow: hidden; border: 1px solid #e2e8f0;">

              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="text-align: left; padding: 6px 8px; font-weight: 600; color: #000000; border-bottom: 1px solid #e2e8f0; font-size: 11px;">Tenant Name</th>
                    <th style="text-align: right; padding: 6px 8px; font-weight: 600; color: #000000; border-bottom: 1px solid #e2e8f0; font-size: 11px;">Share Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${g.data
						.map(
							(r, index) => `
                    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-weight: 500; color: #000000; font-size: 11px;">${escapeHtml(r.tenant.full_name)}</td>
                      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #000000; font-size: 12px;">${formatCurrency(r.share)}</td>
                    </tr>`
						)
						.join('')}
                </tbody>
              </table>
            </div>
          </div>
        </section>`;
			})
			.join('');

		return `<!DOCTYPE html>
    <html>
      <head>
        <title>Utility Billing - ${billingMonth}</title>
        <style>
          @page { margin: 1cm; size: portrait; }
          body {
            font-family: "Arial", "Helvetica", sans-serif;
            font-size: 12px;
            color: #000000;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            column-count: 2;
            column-gap: 20px;
            column-fill: auto;
          }
          .header {
            text-align: center;
            margin-bottom: 16px;
            padding: 12px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            column-span: all;
          }
          .header h1 {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 700;
            color: #000000;
          }
          .header .subtitle {
            font-size: 12px;
            color: #666666;
            margin: 0;
            font-weight: 500;
          }
          @media print {
            body { font-size: 11px; }
            .header { margin-bottom: 12px; padding: 8px; }
            .header h1 { font-size: 18px; }
            .header .subtitle { font-size: 11px; }
            .header div:last-child div:first-child { font-size: 12px; }
            .header div:last-child div:last-child { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1>Utility Billing Statement</h1>
              <p class="subtitle">For the month of ${billingMonth}</p>
            </div>
            <div style="text-align: right; padding-left: 20px;">
              <div style="font-size: 14px; font-weight: 600; color: #666666; margin-bottom: 4px;">Total Collectible</div>
              <div style="font-size: 20px; font-weight: 700; color: #000000;">${formatCurrency(totalCollectible)}</div>
            </div>
          </div>
        </div>
        ${sections}
      </body>
    </html>`;
	}

	$effect(() => {
		if (!open) {
			lastHtml = '';
			return;
		}

		if (previewFrame) {
			const html = htmlForGroups(groups);
			if (html !== lastHtml) {
				lastHtml = html;
				previewFrame.srcdoc = html;
			}
		}
	});

	function handlePrint() {
		previewFrame?.contentWindow?.print();
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Content class="sm:max-w-[900px]">
		<Dialog.Header>
			<Dialog.Title>Consolidated Print Preview</Dialog.Title>
		</Dialog.Header>

		<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
			<div class="flex items-center space-x-2">
				<Switch.Root bind:checked={roundNumbers} id="round-all" />
				<Label for="round-all" class="text-sm">Round numbers to nearest 10s</Label>
			</div>
		</div>

		{#if open}
			<div class="border rounded overflow-hidden mb-4">
				<iframe bind:this={previewFrame} class="w-full h-[70vh]" title="Consolidated utility billing preview"></iframe>
			</div>
		{:else}
			<div class="text-sm text-muted-foreground mb-4">Preview will appear when opened.</div>
		{/if}

		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={handleClose}>Close</Button>
			<Button onclick={handlePrint} disabled={!open}>Print</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>



