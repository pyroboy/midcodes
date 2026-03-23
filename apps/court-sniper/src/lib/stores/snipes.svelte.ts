import type { Snipe } from '$lib/types';

let snipes = $state<Snipe[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const snipesStore = {
	get snipes() { return snipes; },
	get isLoading() { return isLoading; },
	get error() { return error; },

	async loadSnipes(playerId: string) {
		isLoading = true;
		try {
			const response = await fetch(`/api/snipes?playerId=${playerId}`);
			if (!response.ok) throw new Error('Failed to load snipes');
			const data = await response.json();
			snipes = data.snipes ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error loading snipes';
		} finally {
			isLoading = false;
		}
	},

	async createSnipe(snipe: Omit<Snipe, 'id' | 'createdAt'>) {
		const response = await fetch('/api/snipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(snipe)
		});
		if (!response.ok) throw new Error('Failed to create snipe');
		const newSnipe = await response.json();
		snipes = [...snipes, newSnipe];
		return newSnipe;
	},

	async updateSnipe(snipeId: string, updates: Partial<Snipe>) {
		const response = await fetch(`/api/snipes/${snipeId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates)
		});
		if (!response.ok) throw new Error('Failed to update snipe');
		const updated = await response.json();
		snipes = snipes.map((s) => (s.id === snipeId ? updated : s));
		return updated;
	},

	async deleteSnipe(snipeId: string) {
		const response = await fetch(`/api/snipes/${snipeId}`, { method: 'DELETE' });
		if (!response.ok) throw new Error('Failed to delete snipe');
		snipes = snipes.filter((s) => s.id !== snipeId);
	}
};
