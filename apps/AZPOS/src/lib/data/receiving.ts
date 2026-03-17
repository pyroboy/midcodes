// src/lib/data/receiving.ts
import { derived } from 'svelte/store';
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import type {
	ReceivingSession,
	ReceivingItem,
	CreateReceivingSession,
	UpdateReceivingSession,
	UpdateReceivingItem,
	CompleteReceivingSession
} from '$lib/types/receiving.schema';

// Telefunc helper (following canonical pattern)
async function callTelefunc<T = unknown>(
	functionName: string,
	args: unknown[] = []
): Promise<T> {
	const res = await fetch('/api/telefunc', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ telefuncName: functionName, telefuncArgs: args })
	});
	if (!res.ok) {
		throw new Error(`Telefunc call failed: ${res.status} ${res.statusText}`);
	}
	const { ret } = await res.json();
	return ret;
}

// Telefunc function wrappers (following inventory.ts pattern)
const onGetReceivingSessions = async (): Promise<ReceivingSession[]> => {
	return callTelefunc<ReceivingSession[]>('onGetReceivingSessions');
};

const onGetReceivingSession = async (sessionId: string): Promise<ReceivingSession | null> => {
	return callTelefunc<ReceivingSession | null>('onGetReceivingSession', [sessionId]);
};

const onGetReceivingItems = async (sessionId: string): Promise<ReceivingItem[]> => {
	return callTelefunc<ReceivingItem[]>('onGetReceivingItems', [sessionId]);
};

const onCreateReceivingSession = async (sessionData: CreateReceivingSession): Promise<ReceivingSession> => {
	return callTelefunc<ReceivingSession>('onCreateReceivingSession', [sessionData]);
};

const onUpdateReceivingSession = async (sessionId: string, sessionData: UpdateReceivingSession): Promise<ReceivingSession> => {
	return callTelefunc<ReceivingSession>('onUpdateReceivingSession', [sessionId, sessionData]);
};

const onUpdateReceivingItem = async (itemId: string, itemData: UpdateReceivingItem): Promise<ReceivingItem> => {
	return callTelefunc<ReceivingItem>('onUpdateReceivingItem', [itemId, itemData]);
};

const onCompleteReceivingSession = async (receiveData: CompleteReceivingSession): Promise<ReceivingSession> => {
	return callTelefunc<ReceivingSession>('onCompleteReceivingSession', [receiveData]);
};

// Query keys for consistent cache management
const receivingQueryKeys = {
	all: ['receiving'] as const,
	lists: () => [...receivingQueryKeys.all, 'list'] as const,
	list: (filters?: Record<string, string>) => [...receivingQueryKeys.lists(), filters] as const,
	details: () => [...receivingQueryKeys.all, 'detail'] as const,
	detail: (id: string) => [...receivingQueryKeys.details(), id] as const,
	items: () => [...receivingQueryKeys.all, 'items'] as const,
	itemsForSession: (sessionId: string) => [...receivingQueryKeys.items(), sessionId] as const
};

// Hook for receiving functionality
export function useReceiving() {
	const queryClient = useQueryClient();

	// Query to fetch all receiving sessions
	const sessionsQuery = createQuery<ReceivingSession[]>({
		queryKey: receivingQueryKeys.lists(),
		queryFn: onGetReceivingSessions,
		staleTime: 1000 * 60 * 2, // 2 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
		enabled: browser // Only run on client-side
	});

	// Mutation to create a new receiving session
	const createReceivingSessionMutation = createMutation({
		mutationFn: (sessionData: CreateReceivingSession) => onCreateReceivingSession(sessionData),
		onSuccess: (newSession) => {
			// Invalidate and refetch sessions list
			queryClient.invalidateQueries({ queryKey: receivingQueryKeys.lists() });
			// Add the new session to cache
			queryClient.setQueryData(
				receivingQueryKeys.detail(newSession.id),
				newSession
			);
		},
		onError: (error) => {
			console.error('Failed to create receiving session:', error);
		}
	});

	// Mutation to update a receiving session
	const updateReceivingSessionMutation = createMutation({
		mutationFn: ({
			sessionId,
			sessionData
		}: {
			sessionId: string;
			sessionData: UpdateReceivingSession;
		}) => onUpdateReceivingSession(sessionId, sessionData),
		onSuccess: (updatedSession) => {
			// Update the session in cache
			queryClient.setQueryData(
				receivingQueryKeys.detail(updatedSession.id),
				updatedSession
			);
			// Invalidate sessions list
			queryClient.invalidateQueries({ queryKey: receivingQueryKeys.lists() });
		},
		onError: (error) => {
			console.error('Failed to update receiving session:', error);
		}
	});

	// Mutation to update a receiving item
	const updateReceivingItemMutation = createMutation({
		mutationFn: ({
			itemId,
			itemData
		}: {
			itemId: string;
			itemData: UpdateReceivingItem;
		}) => onUpdateReceivingItem(itemId, itemData),
		onSuccess: (updatedItem: ReceivingItem) => {
			// Invalidate items for the session
			queryClient.invalidateQueries({
				queryKey: receivingQueryKeys.itemsForSession(updatedItem.receiving_session_id)
			});
		},
		onError: (error) => {
			console.error('Failed to update receiving item:', error);
		}
	});

	// Mutation to complete a receiving session
	const completeReceivingSessionMutation = createMutation({
		mutationFn: (receiveData: CompleteReceivingSession) => onCompleteReceivingSession(receiveData),
		onSuccess: (completedSession: ReceivingSession) => {
			// Update the session in cache
			queryClient.setQueryData(
				receivingQueryKeys.detail(completedSession.id),
				completedSession
			);
			// Invalidate sessions list
			queryClient.invalidateQueries({ queryKey: receivingQueryKeys.lists() });
			// Invalidate items for the session
			queryClient.invalidateQueries({
				queryKey: receivingQueryKeys.itemsForSession(completedSession.id)
			});
		},
		onError: (error) => {
			console.error('Failed to complete receiving session:', error);
		}
	});

	// Derived stores (following inventory.ts pattern)
	const sessions = derived(sessionsQuery, ($q) => $q.data ?? []);
	const isLoading = derived(sessionsQuery, ($q) => $q.isPending);
	const isError = derived(sessionsQuery, ($q) => $q.isError);
	const error = derived(sessionsQuery, ($q) => $q.error);

	return {
		// Svelte stores (access with $ prefix in components)
		sessions,
		isLoading,
		isError,
		error,

		// Raw query objects (for advanced use cases)
		sessionsQuery,

		// Mutations
		createReceivingSession: createReceivingSessionMutation.mutate,
		updateReceivingSession: updateReceivingSessionMutation.mutate,
		updateReceivingItem: updateReceivingItemMutation.mutate,
		completeReceivingSession: completeReceivingSessionMutation.mutate,

		// Mutation state getters
		isCreatingSession: () => createReceivingSessionMutation.isPending,
		isUpdatingSession: () => updateReceivingSessionMutation.isPending,
		isUpdatingItem: () => updateReceivingItemMutation.isPending,
		isCompletingSession: () => completeReceivingSessionMutation.isPending,

		createSessionError: () => createReceivingSessionMutation.error,
		updateSessionError: () => updateReceivingSessionMutation.error,
		updateItemError: () => updateReceivingItemMutation.error,
		completeSessionError: () => completeReceivingSessionMutation.error,

		// Utility functions
		refetch: () => queryClient.invalidateQueries({ queryKey: receivingQueryKeys.lists() })
	};
}

// Hook for fetching a receiving session by ID
export function useReceivingSession(sessionId: string) {
	const sessionQuery = createQuery<ReceivingSession | null>({
		queryKey: receivingQueryKeys.detail(sessionId),
		queryFn: () => onGetReceivingSession(sessionId),
		enabled: !!sessionId && browser,
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
		retry: 3,
		retryDelay: 1000
	});

	// Return Svelte stores
	const session = derived(sessionQuery, ($q) => $q.data ?? null);
	const isLoading = derived(sessionQuery, ($q) => $q.isPending);
	const isError = derived(sessionQuery, ($q) => $q.isError);
	const error = derived(sessionQuery, ($q) => $q.error);

	return {
		session,
		isLoading,
		isError,
		error,
		sessionQuery
	};
}

// Hook for fetching receiving items for a session
export function useReceivingItems(sessionId: string) {
	const itemsQuery = createQuery<ReceivingItem[]>({
		queryKey: receivingQueryKeys.itemsForSession(sessionId),
		queryFn: () => onGetReceivingItems(sessionId),
		enabled: !!sessionId && browser,
		staleTime: 1000 * 60 * 2, // 2 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
		retry: 3,
		retryDelay: 1000
	});

	// Return Svelte stores
	const items = derived(itemsQuery, ($q) => $q.data ?? []);
	const isLoading = derived(itemsQuery, ($q) => $q.isPending);
	const isError = derived(itemsQuery, ($q) => $q.isError);
	const error = derived(itemsQuery, ($q) => $q.error);

	return {
		items,
		isLoading,
		isError,
		error,
		itemsQuery
	};
}