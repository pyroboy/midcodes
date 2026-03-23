import { serve } from 'inngest/sveltekit';
import { inngest, processMessengerWebhook, sendBookingConfirmation } from '$lib/server/inngest';

export const { GET, POST } = serve({
	client: inngest,
	functions: [processMessengerWebhook, sendBookingConfirmation]
});
