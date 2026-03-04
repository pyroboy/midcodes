<script lang="ts">
	import { 
		Printer, 
		Receipt, 
		HardDrive, 
		TriangleAlert, 
		CheckCircle2,
		XCircle
	} from 'lucide-svelte';
	import { hardwareState, simulateHardwareError, resolveHardwareError, type PrinterStatus } from '$lib/stores/hardware.svelte';

	let isOpen = $state(false);

	function toggleOpen() {
		isOpen = !isOpen;
	}

	function handleOutsideClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.hw-status-container')) {
			isOpen = false;
		}
	}

	const STATUS_COLORS: Record<PrinterStatus, string> = {
		online: 'text-green-600 bg-green-50 outline-green-200',
		offline: 'text-red-600 bg-red-50 outline-red-200',
		paper_out: 'text-amber-600 bg-amber-50 outline-amber-200',
		jammed: 'text-orange-600 bg-orange-50 outline-orange-200',
	};

	const STATUS_LABELS: Record<PrinterStatus, string> = {
		online: 'Online',
		offline: 'Offline',
		paper_out: 'Paper Out',
		jammed: 'Paper Jam',
	};

	function setPrinterStatus(device: 'receiptPrinter' | 'kitchenPrinter', status: PrinterStatus) {
		if (status === 'online') {
			resolveHardwareError(device);
		} else {
			simulateHardwareError(device, status);
		}
	}
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="relative hw-status-container">
	<button 
		onclick={toggleOpen}
		class="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
		title="Hardware Status Simulation"
	>
		<HardDrive class="w-5 h-5 text-gray-700" />
		
		<!-- Indicator Dot if anything is wrong -->
		{#if hardwareState.receiptPrinter !== 'online' || hardwareState.kitchenPrinter !== 'online'}
			<span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
		{/if}
	</button>

	{#if isOpen}
		<div class="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col">
			
			<!-- Header -->
			<div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
				<h3 class="font-semibold text-gray-800 text-sm">Simulated Hardware</h3>
				<p class="text-xs text-gray-500 mt-0.5">Test device error states for UI handling.</p>
			</div>

			<!-- Devices -->
			<div class="p-2 flex flex-col gap-1">
				
				<!-- Receipt Printer -->
				<div class="p-3 rounded-lg flex flex-col gap-2 hover:bg-gray-50 transition-colors">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Receipt class="w-4 h-4 text-gray-500" />
							<span class="text-sm font-medium text-gray-700">Receipt Printer</span>
						</div>
						<div class="flex items-center gap-1">
							{#if hardwareState.receiptPrinter === 'online'}
								<CheckCircle2 class="w-3.5 h-3.5 text-green-500" />
							{:else}
								<TriangleAlert class="w-3.5 h-3.5 text-amber-500" />
							{/if}
						</div>
					</div>
					<select 
						class="text-xs p-1.5 rounded-md border-gray-200 outline-1 -outline-offset-1 {STATUS_COLORS[hardwareState.receiptPrinter]}"
						value={hardwareState.receiptPrinter}
						onchange={(e) => setPrinterStatus('receiptPrinter', e.currentTarget.value as PrinterStatus)}
					>
						<option value="online">Online</option>
						<option value="offline">Offline</option>
						<option value="paper_out">Paper Out</option>
						<option value="jammed">Jammed</option>
					</select>
				</div>

				<!-- Kitchen Printer -->
				<div class="p-3 rounded-lg flex flex-col gap-2 hover:bg-gray-50 transition-colors">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Printer class="w-4 h-4 text-gray-500" />
							<span class="text-sm font-medium text-gray-700">KDS Printer</span>
						</div>
						<div class="flex items-center gap-1">
							{#if hardwareState.kitchenPrinter === 'online'}
								<CheckCircle2 class="w-3.5 h-3.5 text-green-500" />
							{:else}
								<TriangleAlert class="w-3.5 h-3.5 text-amber-500" />
							{/if}
						</div>
					</div>
					<select 
						class="text-xs p-1.5 rounded-md border-gray-200 outline-1 -outline-offset-1 {STATUS_COLORS[hardwareState.kitchenPrinter]}"
						value={hardwareState.kitchenPrinter}
						onchange={(e) => setPrinterStatus('kitchenPrinter', e.currentTarget.value as PrinterStatus)}
					>
						<option value="online">Online</option>
						<option value="offline">Offline</option>
						<option value="paper_out">Paper Out</option>
						<option value="jammed">Jammed</option>
					</select>
				</div>

				<!-- Cash Drawer -->
				<div class="p-3 rounded-lg flex flex-col gap-2 hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1 pt-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<HardDrive class="w-4 h-4 text-gray-500" />
							<span class="text-sm font-medium text-gray-700">Cash Drawer</span>
						</div>
						<div class="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider {hardwareState.cashDrawer === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}">
							{hardwareState.cashDrawer}
						</div>
					</div>
					<p class="text-[10px] text-gray-400 mt-1 leading-relaxed">
						Drawer physically pops automatically when an order is cashed out, or via the 'No Sale' top bar button. 
						It simulates a physical close after 3 seconds.
					</p>
				</div>

			</div>
		</div>
	{/if}
</div>
