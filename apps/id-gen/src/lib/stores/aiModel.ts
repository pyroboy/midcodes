import { writable } from 'svelte/store';

export type AIModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AIModelState {
	status: AIModelStatus;
	progress: number; // 0-100
}

export const aiModelStore = writable<AIModelState>({
	status: 'idle',
	progress: 0
});
