declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				name: string;
				email: string;
				role?: string;
			} | null;
			session: { id: string; expiresAt: Date } | null;
		}
	}
}

export {};
