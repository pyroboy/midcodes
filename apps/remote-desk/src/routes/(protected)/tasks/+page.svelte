<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		ClipboardCheck,
		Search,
		Filter,
		Circle,
		Loader2,
		CheckCircle2,
		XCircle,
		Clock,
		Plus,
		CalendarDays,
		AlertCircle,
		ArrowUpRight,
		MoreHorizontal,
		ListFilter,
		LayoutGrid,
		List,
		ChevronDown
	} from 'lucide-svelte';

	type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
	type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

	interface Task {
		id: string;
		title: string;
		description: string;
		assignedTo: string;
		initials: string;
		priority: TaskPriority;
		status: TaskStatus;
		dueDate: string;
		isOverdue?: boolean;
		subtasks?: { done: number; total: number };
	}

	const mockTasks: Task[] = [
		{ id: '1', title: 'Restock frozen goods section', description: 'Check and restock all frozen items at Tagbilaran branch. Verify expiry dates and rotate stock according to FIFO.', assignedTo: 'Maria R.', initials: 'MR', priority: 'high', status: 'in_progress', dueDate: 'Today', subtasks: { done: 2, total: 5 } },
		{ id: '2', title: 'Deep clean VIP area', description: 'Full sanitation of VIP dining area including tables, seats, and floors. Use approved cleaning agents only.', assignedTo: 'John D.', initials: 'JD', priority: 'urgent', status: 'pending', dueDate: 'Today', isOverdue: true },
		{ id: '3', title: 'Equipment safety inspection', description: 'Monthly safety check for all kitchen equipment and fire extinguishers. Document findings in the inspection log.', assignedTo: 'Rico C.', initials: 'RC', priority: 'high', status: 'pending', dueDate: 'Tomorrow', subtasks: { done: 0, total: 8 } },
		{ id: '4', title: 'Update menu pricing', description: 'Apply new pricing to 12 items as per manager memo from March 18. Update both POS and printed menus.', assignedTo: 'Ana S.', initials: 'AS', priority: 'medium', status: 'in_progress', dueDate: 'Mar 23', subtasks: { done: 7, total: 12 } },
		{ id: '5', title: 'Inventory count - beverages', description: 'Complete beverage inventory count for Panglao branch. Reconcile with system records.', assignedTo: 'Liza P.', initials: 'LP', priority: 'medium', status: 'completed', dueDate: 'Mar 20', subtasks: { done: 4, total: 4 } },
		{ id: '6', title: 'Train new cashier on POS', description: 'Onboard Diana on the POS system, covering all standard transactions, refunds, and shift closing.', assignedTo: 'Ken M.', initials: 'KM', priority: 'low', status: 'completed', dueDate: 'Mar 19', subtasks: { done: 6, total: 6 } },
		{ id: '7', title: 'Fix leaking faucet in kitchen', description: 'Coordinate with maintenance to repair the kitchen faucet at Tagbilaran. Get quote first.', assignedTo: 'Ben G.', initials: 'BG', priority: 'medium', status: 'pending', dueDate: 'Mar 24' },
		{ id: '8', title: 'Submit weekly expense report', description: 'Compile and submit all receipts for this week to accounting department.', assignedTo: 'Diana T.', initials: 'DT', priority: 'low', status: 'cancelled', dueDate: 'Mar 18', isOverdue: true },
		{ id: '9', title: 'Repaint parking lot lines', description: 'Coordinate repainting of faded parking lot markings at Panglao branch. Use weather-resistant paint.', assignedTo: 'Rico C.', initials: 'RC', priority: 'low', status: 'completed', dueDate: 'Mar 17', subtasks: { done: 3, total: 3 } },
		{ id: '10', title: 'Prepare monthly attendance report', description: 'Generate and review attendance data for all employees for March. Flag anomalies.', assignedTo: 'Ana S.', initials: 'AS', priority: 'high', status: 'in_progress', dueDate: 'Mar 25', subtasks: { done: 1, total: 3 } }
	];

	const statusTabs: { label: string; value: TaskStatus | 'all' }[] = [
		{ label: 'All', value: 'all' },
		{ label: 'Pending', value: 'pending' },
		{ label: 'In Progress', value: 'in_progress' },
		{ label: 'Completed', value: 'completed' },
		{ label: 'Cancelled', value: 'cancelled' }
	];

	const priorityOptions: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

	let activeTab = $state<TaskStatus | 'all'>('all');
	let searchQuery = $state('');
	let priorityFilter = $state<TaskPriority | 'all'>('all');
	let viewMode = $state<'grid' | 'list'>('grid');

	// Staff only sees their own tasks (mock: filter to 'Maria R.')
	let baseTasks = $derived(
		roleStore.role === 'staff' ? mockTasks.filter(t => t.assignedTo === 'Maria R.') : mockTasks
	);

	let filteredTasks = $derived(
		baseTasks.filter((t) => {
			if (activeTab !== 'all' && t.status !== activeTab) return false;
			if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
			if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);

	const priorityBadge: Record<TaskPriority, string> = {
		low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
		medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
		high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
		urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
	};

	const priorityDot: Record<TaskPriority, string> = {
		low: 'bg-slate-400',
		medium: 'bg-blue-500',
		high: 'bg-amber-500',
		urgent: 'bg-red-500'
	};

	const statusBadge: Record<TaskStatus, string> = {
		pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
		in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
		completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
		cancelled: 'bg-red-100/60 text-red-600 dark:bg-red-900/30 dark:text-red-400'
	};

	const statusLabels: Record<TaskStatus, string> = {
		pending: 'Pending',
		in_progress: 'In Progress',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};

	const statusIcons: Record<TaskStatus, typeof Circle> = {
		pending: Circle,
		in_progress: Loader2,
		completed: CheckCircle2,
		cancelled: XCircle
	};

	const avatarColors = [
		'bg-blue-200 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300',
		'bg-purple-200 text-purple-800 dark:bg-purple-800/50 dark:text-purple-300',
		'bg-pink-200 text-pink-800 dark:bg-pink-800/50 dark:text-pink-300',
		'bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-300',
		'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-300',
		'bg-cyan-200 text-cyan-800 dark:bg-cyan-800/50 dark:text-cyan-300',
		'bg-rose-200 text-rose-800 dark:bg-rose-800/50 dark:text-rose-300',
		'bg-indigo-200 text-indigo-800 dark:bg-indigo-800/50 dark:text-indigo-300'
	];

	function getAvatarColor(initials: string): string {
		const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
		return avatarColors[hash % avatarColors.length];
	}

	const taskCounts = $derived({
		all: baseTasks.length,
		pending: baseTasks.filter((t) => t.status === 'pending').length,
		in_progress: baseTasks.filter((t) => t.status === 'in_progress').length,
		completed: baseTasks.filter((t) => t.status === 'completed').length,
		cancelled: baseTasks.filter((t) => t.status === 'cancelled').length
	});

	// Summary stats
	const overdueCount = $derived(baseTasks.filter(t => t.isOverdue && t.status !== 'completed' && t.status !== 'cancelled').length);
	const completionRate = $derived(Math.round((taskCounts.completed / (taskCounts.all || 1)) * 100));
</script>

<div class="min-h-full">
	<div class="mx-auto max-w-dashboard p-5 sm:p-8 lg:p-10">
		<!-- Page Header -->
		<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h2 class="text-page-title">{roleStore.role === 'staff' ? 'My Tasks' : 'Tasks'}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{roleStore.role === 'staff' ? 'View and update your assigned tasks' : 'Manage and track work assignments across all branches'}
				</p>
			</div>
			{#if roleStore.role !== 'staff'}
				<button class="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95">
					<Plus class="h-4 w-4" />
					New Task
				</button>
			{/if}
		</div>

		<!-- Summary Stats Row -->
		<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
			<div class="rounded-xl border bg-card p-4">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
						<Loader2 class="h-5 w-5" />
					</div>
					<div>
						<p class="text-stat font-mono">{taskCounts.in_progress}</p>
						<p class="text-caption text-muted-foreground">In Progress</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl border bg-card p-4">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
						<Circle class="h-5 w-5" />
					</div>
					<div>
						<p class="text-stat font-mono">{taskCounts.pending}</p>
						<p class="text-caption text-muted-foreground">Pending</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl border bg-card p-4">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg {overdueCount > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}">
						<AlertCircle class="h-5 w-5" />
					</div>
					<div>
						<p class="text-stat font-mono">{overdueCount}</p>
						<p class="text-caption text-muted-foreground">Overdue</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl border bg-card p-4">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
						<CheckCircle2 class="h-5 w-5" />
					</div>
					<div>
						<p class="text-stat font-mono">{completionRate}%</p>
						<p class="text-caption text-muted-foreground">Completion</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Filter Bar -->
		<div class="mb-6 rounded-xl border bg-card p-4">
			<div class="flex flex-col gap-4">
				<!-- Top row: Status Tabs + View Toggle -->
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-wrap gap-1">
						{#each statusTabs as tab}
							{@const count = taskCounts[tab.value === 'all' ? 'all' : tab.value] ?? 0}
							<button
								onclick={() => (activeTab = tab.value)}
								class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all
									{activeTab === tab.value
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
							>
								{tab.label}
								<span class="min-w-[1.25rem] rounded-md px-1 py-0.5 text-center text-xs font-bold
									{activeTab === tab.value
										? 'bg-primary-foreground/20'
										: 'bg-muted-foreground/10'}">
									{count}
								</span>
							</button>
						{/each}
					</div>

					<!-- View Toggle -->
					<div class="flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5">
						<button
							onclick={() => (viewMode = 'grid')}
							class="flex h-8 w-8 items-center justify-center rounded-md transition-colors {viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
							aria-label="Grid view"
						>
							<LayoutGrid class="h-4 w-4" />
						</button>
						<button
							onclick={() => (viewMode = 'list')}
							class="flex h-8 w-8 items-center justify-center rounded-md transition-colors {viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
							aria-label="List view"
						>
							<List class="h-4 w-4" />
						</button>
					</div>
				</div>

				<!-- Bottom row: Search + Priority -->
				<div class="flex flex-col gap-3 sm:flex-row">
					<div class="relative flex-1">
						<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search tasks or assignee..."
							class="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						/>
					</div>
					<div class="relative">
						<ListFilter class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<select
							bind:value={priorityFilter}
							class="w-full appearance-none rounded-lg border border-input bg-background py-2 pl-10 pr-10 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
						>
							<option value="all">All Priorities</option>
							{#each priorityOptions as p}
								<option value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
							{/each}
						</select>
						<ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					</div>
				</div>
			</div>
		</div>

		<!-- Results count -->
		<div class="mb-4 flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Showing <span class="font-semibold text-foreground">{filteredTasks.length}</span> of {baseTasks.length} tasks
			</p>
		</div>

		<!-- Task Cards -->
		{#if filteredTasks.length === 0}
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-20">
					<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
						<ClipboardCheck class="h-8 w-8 text-muted-foreground/50" />
					</div>
					<p class="mt-5 text-base font-medium">No tasks found</p>
					<p class="mt-1 text-sm text-muted-foreground">Try adjusting your filters or create a new task</p>
					<button class="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
						<Plus class="h-4 w-4" />
						New Task
					</button>
				</CardContent>
			</Card>
		{:else if viewMode === 'grid'}
			<!-- Grid View -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each filteredTasks as task (task.id)}
					{@const StatusIcon = statusIcons[task.status]}
					<Card class="group relative overflow-hidden transition-all hover:border-primary/20 hover:shadow-card-hover {task.isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'border-red-200 dark:border-red-900/50' : ''}">
						<!-- Priority stripe -->
						<div class="absolute left-0 top-0 h-full w-1 {priorityDot[task.priority]}"></div>

						<CardContent class="p-5 pl-6">
							<!-- Top: Status + Priority + Menu -->
							<div class="mb-3 flex items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<StatusIcon class="h-4 w-4 flex-shrink-0 {task.status === 'in_progress' ? 'animate-spin text-blue-500' : task.status === 'completed' ? 'text-emerald-500' : task.status === 'cancelled' ? 'text-red-400' : 'text-muted-foreground'}" />
									<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {statusBadge[task.status]}">
										{statusLabels[task.status]}
									</span>
									{#if task.isOverdue && task.status !== 'completed' && task.status !== 'cancelled'}
										<span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
											<AlertCircle class="h-3 w-3" />
											Overdue
										</span>
									{/if}
								</div>
								<div class="flex items-center gap-1.5">
									<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {priorityBadge[task.priority]}">
										{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
									</span>
									<button class="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-muted group-hover:opacity-100">
										<MoreHorizontal class="h-4 w-4" />
									</button>
								</div>
							</div>

							<!-- Title + Description -->
							<h3 class="text-sm font-semibold leading-snug">{task.title}</h3>
							<p class="mt-1.5 line-clamp-2 text-caption leading-relaxed text-muted-foreground">{task.description}</p>

							<!-- Subtask Progress -->
							{#if task.subtasks}
								<div class="mt-3 flex items-center gap-2">
									<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full transition-all {task.subtasks.done === task.subtasks.total ? 'bg-emerald-500' : 'bg-primary'}"
											style="width: {(task.subtasks.done / task.subtasks.total) * 100}%"
										></div>
									</div>
									<span class="text-caption font-medium text-muted-foreground">{task.subtasks.done}/{task.subtasks.total}</span>
								</div>
							{/if}

							<!-- Footer: Assignee + Due Date -->
							<div class="mt-4 flex items-center justify-between border-t border-border pt-3">
								<div class="flex items-center gap-2">
									<div class="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold {getAvatarColor(task.initials)}">
										{task.initials}
									</div>
									<span class="text-caption font-medium">{task.assignedTo}</span>
								</div>
								<div class="flex items-center gap-1 text-caption {task.isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted-foreground'}">
									<CalendarDays class="h-3 w-3" />
									{task.dueDate}
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{:else}
			<!-- List View -->
			<Card>
				<div class="divide-y divide-border">
					{#each filteredTasks as task (task.id)}
						{@const StatusIcon = statusIcons[task.status]}
						<div class="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
							<!-- Priority dot -->
							<div class="flex h-3 w-3 flex-shrink-0 rounded-full {priorityDot[task.priority]}"></div>

							<!-- Status icon -->
							<StatusIcon class="h-4 w-4 flex-shrink-0 {task.status === 'in_progress' ? 'animate-spin text-blue-500' : task.status === 'completed' ? 'text-emerald-500' : task.status === 'cancelled' ? 'text-red-400' : 'text-muted-foreground'}" />

							<!-- Title + Description -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h3 class="truncate text-sm font-semibold {task.status === 'completed' ? 'line-through opacity-60' : ''}">{task.title}</h3>
									{#if task.isOverdue && task.status !== 'completed' && task.status !== 'cancelled'}
										<span class="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
											Overdue
										</span>
									{/if}
								</div>
								{#if task.subtasks}
									<div class="mt-1 flex items-center gap-2">
										<div class="h-1 w-16 overflow-hidden rounded-full bg-muted">
											<div class="h-full rounded-full {task.subtasks.done === task.subtasks.total ? 'bg-emerald-500' : 'bg-primary'}" style="width: {(task.subtasks.done / task.subtasks.total) * 100}%"></div>
										</div>
										<span class="text-[10px] text-muted-foreground">{task.subtasks.done}/{task.subtasks.total}</span>
									</div>
								{/if}
							</div>

							<!-- Badges -->
							<span class="hidden flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex {priorityBadge[task.priority]}">
								{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
							</span>
							<span class="hidden flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex {statusBadge[task.status]}">
								{statusLabels[task.status]}
							</span>

							<!-- Assignee -->
							<div class="flex flex-shrink-0 items-center gap-1.5">
								<div class="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold {getAvatarColor(task.initials)}">
									{task.initials}
								</div>
								<span class="hidden text-caption text-muted-foreground lg:inline">{task.assignedTo}</span>
							</div>

							<!-- Due Date -->
							<span class="flex-shrink-0 text-caption {task.isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted-foreground'}">
								{task.dueDate}
							</span>

							<!-- Action -->
							<button class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-muted group-hover:opacity-100">
								<MoreHorizontal class="h-4 w-4" />
							</button>
						</div>
					{/each}
				</div>
			</Card>
		{/if}
	</div>
</div>
