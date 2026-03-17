// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AuthUser } from '$lib/types/auth.schema';

interface TelefuncContext {
	user: AuthUser | undefined;
	request: Request;
}

declare global {
	namespace App {
		interface Locals {
			user?: AuthUser;
		}
		// interface Error {}
		// interface PageData {}
		// interface Platform {}
	}
	var telefuncContext: TelefuncContext | undefined;
}

export {};
