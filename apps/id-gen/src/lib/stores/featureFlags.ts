import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getBillingSettings } from '../../routes/admin/billing.remote';

interface PaymentFlags {
  paymentsEnabled: boolean;
  paymentsBypass: boolean;
  loaded: boolean;
}

const { subscribe, set, update } = writable<PaymentFlags>({
  paymentsEnabled: true,
  paymentsBypass: false,
  loaded: false
});

async function refreshFromServer() {
  try {
    const s = await getBillingSettings();
    set({ paymentsEnabled: s.payments_enabled, paymentsBypass: s.payments_bypass, loaded: true });
  } catch (e) {
    // Fail-open to avoid blocking UI, but mark loaded
    update((prev) => ({ ...prev, loaded: true }));
  }
}

if (browser) {
  // Load on startup; caller can also call refresh explicitly
  refreshFromServer();
}

export const paymentFlags = { subscribe, refreshFromServer };
