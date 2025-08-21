// Billing remote functions for credits management
import { query, command } from '$app/server';

type UserWithCredits = {
	id: string;
	email: string;
	role: string;
	credits_balance: number;
	card_generation_count: number;
};

export const getUsersWithCredits = query(async () => {
	// Placeholder implementation
	return [] as UserWithCredits[];
});

export const adjustUserCredits = command('unchecked', async ({
	userId,
	delta,
	reason
}: {
	userId: string;
	delta: number;
	reason?: string;
}) => {
	// Placeholder implementation
	return { success: false, error: 'Not implemented' } as const;
});

export const getBillingSettings = query(async () => {
	// Placeholder implementation
	return { payments_enabled: false } as { payments_enabled: boolean };
});
