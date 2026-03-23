import Ably from 'ably';
import { env } from './env';

let _client: Ably.Rest | null = null;

function getClient() {
	if (!_client) _client = new Ably.Rest({ key: env.ABLY_API_KEY });
	return _client;
}

export interface ScanEvent {
	type: 'scan:new';
	data: {
		id: string;
		personId: string;
		fullName: string;
		idNumber: string;
		anomalyData?: string | null;
		scannedAt: string;
	};
}

export async function publishScanEvent(event: ScanEvent) {
	const channel = getClient().channels.get('scans');
	await channel.publish(event.type, event.data);
}

export async function createAblyTokenRequest(userId: string) {
	return new Promise<Ably.TokenRequest>((resolve, reject) => {
		getClient().auth.createTokenRequest(
			{
				clientId: userId,
				capability: {
					scans: ['subscribe'],
					notifications: ['subscribe']
				}
			},
			(err, tokenRequest) => {
				if (err || !tokenRequest) reject(err ?? new Error('No token'));
				else resolve(tokenRequest);
			}
		);
	});
}
