import Ably from 'ably';
import { env } from './env';

let _ably: Ably.Rest | null = null;

function getAbly(): Ably.Rest {
	if (!_ably) {
		_ably = new Ably.Rest({ key: env.ABLY_API_KEY });
	}
	return _ably;
}

export async function publishEvent(channel: string, event: string, data: unknown) {
	const ch = getAbly().channels.get(channel);
	await ch.publish(event, data);
}

export async function publishIngredientEvent(event: string, data: unknown) {
	await publishEvent('ingredients', event, data);
}

export async function publishRecipeEvent(event: string, data: unknown) {
	await publishEvent('recipes', event, data);
}

export async function publishBatchEvent(event: string, data: unknown) {
	await publishEvent('batches', event, data);
}

export async function publishPriceEvent(event: string, data: unknown) {
	await publishEvent('prices', event, data);
}

export async function createAblyTokenRequest() {
	return new Promise((resolve, reject) => {
		getAbly().auth.createTokenRequest({}, (err, tokenRequest) => {
			if (err) reject(err);
			else resolve(tokenRequest);
		});
	});
}
