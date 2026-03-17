import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
	// baseURL is removed to default to the current window origin
	// This fixes CORS issues when accessing via 127.0.0.1 vs localhost
});
