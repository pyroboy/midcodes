import { writable } from 'svelte/store';
import { browser } from '$app/environment';
// import { getBillingSettings } from '$lib/remote/billing.remote';

interface PaymentFlags {
	paymentsEnabled: boolean;
	paymentsBypass: boolean;
	loaded: boolean;
}

// Default to enabled/false/loaded to avoid blocking UI
const { subscribe, set, update } = writable<PaymentFlags>({
	paymentsEnabled: true,
	paymentsBypass: false,
	loaded: true
});

/*
 * Placeholder for future feature flags.
 * Currently disabled to optimize load time.
 */
async function refreshFromServer() {
	// Placeholder: future logic here
	/*
	try {
		const s = await getBillingSettings();
		set({ paymentsEnabled: s.payments_enabled, paymentsBypass: s.payments_bypass, loaded: true });
	} catch (e) {
		update((prev) => ({ ...prev, loaded: true }));
	}
	*/
}

if (browser) {
	// Placeholder init
	// refreshFromServer();
}

export const paymentFlags = { subscribe, refreshFromServer };
