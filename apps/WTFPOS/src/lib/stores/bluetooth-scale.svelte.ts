export type ConnectionStatus = 'disconnected' | 'scanning' | 'pairing' | 'connected';
export type WeightStability = 'idle' | 'unstable' | 'stable';

export interface SimulatedDevice {
	id: string;
	name: string;
	signal: number; // 0-100
}

const SIMULATED_DEVICES: SimulatedDevice[] = [
	{ id: 'bt-scale-001', name: 'WTF Scale A (Kitchen)', signal: 92 },
	{ id: 'bt-scale-002', name: 'WTF Scale B (Floor)', signal: 78 },
];

// ─── State ──────────────────────────────────────────────────────────────────

export const btScale = $state({
	connectionStatus: 'disconnected' as ConnectionStatus,
	deviceName: null as string | null,
	deviceId: null as string | null,
	batteryLevel: null as number | null,
	currentWeight: 0,
	stability: 'idle' as WeightStability,
	lastStableWeight: null as number | null,
	activeReceiverId: null as string | null,
	discoveredDevices: [] as SimulatedDevice[],
});

// Track simulation intervals for cleanup
let weightSimInterval: ReturnType<typeof setInterval> | null = null;

// ─── Connection Functions ───────────────────────────────────────────────────

export function startScan(): Promise<SimulatedDevice[]> {
	btScale.connectionStatus = 'scanning';
	btScale.discoveredDevices = [];

	return new Promise((resolve) => {
		setTimeout(() => {
			btScale.discoveredDevices = [...SIMULATED_DEVICES];
			if (btScale.connectionStatus === 'scanning') {
				// Stay in scanning — user picks a device
			}
			resolve(btScale.discoveredDevices);
		}, 2000);
	});
}

export function pairDevice(deviceId: string): Promise<boolean> {
	const device = SIMULATED_DEVICES.find((d) => d.id === deviceId);
	if (!device) return Promise.resolve(false);

	btScale.connectionStatus = 'pairing';
	btScale.deviceName = device.name;
	btScale.deviceId = device.id;

	return new Promise((resolve) => {
		setTimeout(() => {
			btScale.connectionStatus = 'connected';
			btScale.batteryLevel = 85 + Math.floor(Math.random() * 15); // 85-99%
			btScale.currentWeight = 0;
			btScale.stability = 'idle';
			btScale.lastStableWeight = null;
			resolve(true);
		}, 1500);
	});
}

export function disconnect() {
	clearWeightSim();
	btScale.connectionStatus = 'disconnected';
	btScale.deviceName = null;
	btScale.deviceId = null;
	btScale.batteryLevel = null;
	btScale.currentWeight = 0;
	btScale.stability = 'idle';
	btScale.lastStableWeight = null;
	btScale.activeReceiverId = null;
	btScale.discoveredDevices = [];
}

// ─── Receiver Tracking ─────────────────────────────────────────────────────

export function registerReceiver(id: string) {
	btScale.activeReceiverId = id;
}

export function unregisterReceiver(id: string) {
	if (btScale.activeReceiverId === id) {
		btScale.activeReceiverId = null;
	}
}

// ─── Weight Simulation ──────────────────────────────────────────────────────

function clearWeightSim() {
	if (weightSimInterval) {
		clearInterval(weightSimInterval);
		weightSimInterval = null;
	}
}

export function simulateWeightPlacement(targetGrams: number) {
	if (btScale.connectionStatus !== 'connected') return;

	clearWeightSim();
	btScale.stability = 'unstable';
	btScale.lastStableWeight = null;

	let ticks = 0;
	const totalTicks = 8; // ~1.6s at 200ms intervals

	weightSimInterval = setInterval(() => {
		ticks++;
		// Fluctuate around target, converging
		const variance = Math.max(1, Math.round((totalTicks - ticks) * targetGrams * 0.03));
		const offset = Math.round((Math.random() - 0.5) * 2 * variance);
		btScale.currentWeight = Math.max(0, targetGrams + offset);

		if (ticks >= totalTicks) {
			clearWeightSim();
			btScale.currentWeight = targetGrams;
			btScale.stability = 'stable';
			btScale.lastStableWeight = targetGrams;
		}
	}, 200);
}

export function simulateWeightRemoval() {
	if (btScale.connectionStatus !== 'connected') return;

	clearWeightSim();
	btScale.currentWeight = 0;
	btScale.stability = 'idle';
	btScale.lastStableWeight = null;
}

// ─── Interactive Simulation (hold-to-weigh) ─────────────────────────────────

let holdInterval: ReturnType<typeof setInterval> | null = null;
let stabilizeTimeout: ReturnType<typeof setTimeout> | null = null;

function clearHold() {
	if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
	if (stabilizeTimeout) { clearTimeout(stabilizeTimeout); stabilizeTimeout = null; }
}

/** Start ramping weight up while held. Call on pointerdown. */
export function startHoldWeight(ratePerTick = 25) {
	if (btScale.connectionStatus !== 'connected') return;
	clearHold();
	clearWeightSim();
	btScale.stability = 'unstable';
	btScale.lastStableWeight = null;

	holdInterval = setInterval(() => {
		const jitter = Math.round((Math.random() - 0.5) * 8);
		btScale.currentWeight = Math.max(0, btScale.currentWeight + ratePerTick + jitter);
	}, 80);
}

/** Stop ramping — weight stabilizes at current value. Call on pointerup. */
export function stopHoldWeight() {
	if (holdInterval) {
		clearInterval(holdInterval);
		holdInterval = null;
	}
	if (btScale.currentWeight <= 0) {
		btScale.stability = 'idle';
		return;
	}
	// Briefly fluctuate then stabilize
	const target = btScale.currentWeight;
	let ticks = 0;
	stabilizeTimeout = setTimeout(() => {
		const settleInterval = setInterval(() => {
			ticks++;
			const jitter = Math.round((Math.random() - 0.5) * Math.max(2, 10 - ticks * 2));
			btScale.currentWeight = target + jitter;
			if (ticks >= 4) {
				clearInterval(settleInterval);
				btScale.currentWeight = target;
				btScale.stability = 'stable';
				btScale.lastStableWeight = target;
			}
		}, 150);
	}, 200);
}

/** Simulate removing item from scale — weight drains to 0. */
export function drainWeight() {
	if (btScale.connectionStatus !== 'connected') return;
	clearHold();
	clearWeightSim();

	if (btScale.currentWeight <= 0) {
		btScale.stability = 'idle';
		btScale.lastStableWeight = null;
		return;
	}

	btScale.stability = 'unstable';
	btScale.lastStableWeight = null;
	const drainInterval = setInterval(() => {
		btScale.currentWeight = Math.max(0, btScale.currentWeight - 40);
		if (btScale.currentWeight <= 0) {
			clearInterval(drainInterval);
			btScale.currentWeight = 0;
			btScale.stability = 'idle';
			btScale.lastStableWeight = null;
		}
	}, 60);
}
