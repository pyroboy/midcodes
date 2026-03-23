/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				name: string;
				email: string;
				role: string;
				businessId: string | null;
			} | null;
		}
	}
}

export {};
