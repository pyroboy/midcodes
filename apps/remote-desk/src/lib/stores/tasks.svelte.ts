import { writable } from 'svelte/store';
import type { Task } from '$lib/types';

export interface TaskState {
	tasks: Task[];
	selectedTask: Task | null;
	filter: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
	sortBy: 'priority' | 'created' | 'status';
	loading: boolean;
	error: string | null;
}

const initialState: TaskState = {
	tasks: [],
	selectedTask: null,
	filter: 'all',
	sortBy: 'priority',
	loading: false,
	error: null
};

function createTaskStore() {
	const { subscribe, set, update } = writable<TaskState>(initialState);

	return {
		subscribe,
		loadTasks: (tasks: Task[]) =>
			update((state) => ({
				...state,
				tasks
			})),
		addTask: (task: Task) =>
			update((state) => ({
				...state,
				tasks: [...state.tasks, task]
			})),
		updateTask: (task: Task) =>
			update((state) => ({
				...state,
				tasks: state.tasks.map((t) => (t.id === task.id ? task : t))
			})),
		removeTask: (taskId: string) =>
			update((state) => ({
				...state,
				tasks: state.tasks.filter((t) => t.id !== taskId)
			})),
		selectTask: (task: Task | null) =>
			update((state) => ({
				...state,
				selectedTask: task
			})),
		setFilter: (filter: TaskState['filter']) =>
			update((state) => ({
				...state,
				filter
			})),
		setSortBy: (sortBy: TaskState['sortBy']) =>
			update((state) => ({
				...state,
				sortBy
			})),
		setLoading: (loading: boolean) =>
			update((state) => ({
				...state,
				loading
			})),
		setError: (error: string | null) =>
			update((state) => ({
				...state,
				error
			})),
		reset: () => set(initialState)
	};
}

export const tasks = createTaskStore();
