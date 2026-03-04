import { log } from '$lib/stores/audit.svelte';

export type PrinterStatus = 'online' | 'offline' | 'paper_out' | 'jammed';
export type DrawerStatus = 'closed' | 'open';

// Simulated Hardware State
export const hardwareState = $state({
	receiptPrinter: 'online' as PrinterStatus,
	kitchenPrinter: 'online' as PrinterStatus,
	cashDrawer: 'closed' as DrawerStatus,
});

// Helper to manually trigger connection errors for UI testing
export function simulateHardwareError(device: 'receiptPrinter' | 'kitchenPrinter', error: PrinterStatus) {
	hardwareState[device] = error;
}

// Helper to clear errors
export function resolveHardwareError(device: 'receiptPrinter' | 'kitchenPrinter') {
	hardwareState[device] = 'online';
}

// ─── Hardware Actions ────────────────────────────────────────────────────────

export async function printReceipt(orderId: string): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		// Simulate network latency to hardware
		setTimeout(() => {
			if (hardwareState.receiptPrinter === 'paper_out') {
				resolve({ success: false, error: 'Receipt Printer is out of paper.' });
			} else if (hardwareState.receiptPrinter === 'offline') {
				resolve({ success: false, error: 'Receipt Printer is offline or disconnected.' });
			} else if (hardwareState.receiptPrinter === 'jammed') {
				resolve({ success: false, error: 'Receipt Printer paper jam detected.' });
			} else {
				// Hardware logs are not strictly needed in audit unless requested, 
				// but let's assume actual print success is silent
				resolve({ success: true });
			}
		}, 1200); // 1.2s simulated delay
	});
}

export async function printKitchenOrder(ticketId: string): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		setTimeout(() => {
			if (hardwareState.kitchenPrinter !== 'online') {
				resolve({ success: false, error: `Kitchen Printer is ${hardwareState.kitchenPrinter.replace('_', ' ')}.` });
			} else {
				resolve({ success: true });
			}
		}, 800); // KDS prints are usually faster
	});
}

export async function openCashDrawer(reason: string, requestedBy: string = 'Staff'): Promise<{ success: boolean; error?: string }> {
	// In the real world, this sends an open signal to the hardware
	return new Promise((resolve) => {
		hardwareState.cashDrawer = 'open';
		
		// Log this critical action immediately
		log.cashDrawerOpened(reason, requestedBy);
		
		setTimeout(() => {
			resolve({ success: true });
			
			// Simulate the drawer being physically closed after 3 seconds
			setTimeout(() => {
				hardwareState.cashDrawer = 'closed';
			}, 3000);
			
		}, 300); // 300ms to pop drawer
	});
}
