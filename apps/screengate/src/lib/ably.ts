import * as Ably from 'ably';
import { upsertRxDoc } from '$lib/db';

let _realtime: Ably.Realtime | null = null;

function getRealtime(): Ably.Realtime {
	if (_realtime) return _realtime;
	_realtime = new Ably.Realtime({
		authUrl: '/api/ably-token',
		authMethod: 'GET'
	});
	return _realtime;
}

export function subscribeToScans(onEvent?: (data: any) => void) {
	const channel = getRealtime().channels.get('scans');
	channel.subscribe('scan:new', (msg) => {
		const data = msg.data;
		// Patch local RxDB cache
		upsertRxDoc('scans', {
			id: data.id,
			personId: data.personId,
			fullName: data.fullName,
			idNumber: data.idNumber,
			anomalyData: data.anomalyData ?? null,
			scannedAt: data.scannedAt
		});
		onEvent?.(data);
	});
	return () => channel.unsubscribe();
}

export function subscribeToNotifications(onEvent: (data: any) => void) {
	const channel = getRealtime().channels.get('notifications');
	channel.subscribe((msg) => onEvent(msg.data));
	return () => channel.unsubscribe();
}
