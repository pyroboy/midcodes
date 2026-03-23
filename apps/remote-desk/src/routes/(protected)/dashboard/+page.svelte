<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import { format } from 'date-fns';
	import {
		Clock,
		ClipboardCheck,
		AlertTriangle,
		Receipt,
		Bell,
		MapPin,
		Plus,
		Package,
		Calendar,
		MessageSquare,
		TrendingUp,
		TrendingDown,
		Users,
		Activity,
		ArrowRight,
		Play,
		CheckCircle2
	} from 'lucide-svelte';

	const now = new Date();
	const hour = now.getHours();
	const greetingPrefix = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
	const greetingName = $derived(
		roleStore.role === 'admin' ? 'Admin' :
		roleStore.role === 'manager' ? 'Manager' : 'there'
	);
	const dateStr = format(now, 'EEEE, MMMM d');

	const statCards = [
		{
			label: 'Active Shifts',
			value: '12',
			trend: '+2 today',
			trendUp: true,
			icon: Clock,
			href: '/shifts',
			color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
			colorHover: 'group-hover:bg-primary group-hover:text-primary-foreground'
		},
		{
			label: 'Pending Tasks',
			value: '24',
			trend: '-3 completed',
			trendUp: false,
			icon: ClipboardCheck,
			href: '/tasks',
			color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
			colorHover: 'group-hover:bg-primary group-hover:text-primary-foreground'
		},
		{
			label: 'Low Stock',
			value: '5',
			trend: '2 critical',
			trendUp: false,
			icon: AlertTriangle,
			href: '/inventory',
			color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
			colorHover: 'group-hover:bg-primary group-hover:text-primary-foreground'
		},
		{
			label: 'Pending Expenses',
			value: '₱2,400',
			trend: '3 awaiting',
			trendUp: true,
			icon: Receipt,
			href: '/expenses',
			color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
			colorHover: 'group-hover:bg-primary group-hover:text-primary-foreground'
		}
	];

	// Improvement 2: Avatar colors based on initials hash
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

	const activityFeed = [
		{ initials: 'MR', name: 'Maria R.', action: 'clocked in at Tagbilaran', time: '2 min ago' },
		{ initials: 'JD', name: 'John D.', action: 'completed "Restock frozen goods"', time: '15 min ago' },
		{ initials: 'AS', name: 'Ana S.', action: 'submitted expense of ₱850', time: '32 min ago' },
		{ initials: 'RC', name: 'Rico C.', action: 'clocked out from Panglao', time: '1 hr ago' },
		{ initials: 'LP', name: 'Liza P.', action: 'updated inventory for "Pork Belly"', time: '1.5 hrs ago' },
		{ initials: 'KM', name: 'Ken M.', action: 'approved 2 pending expenses', time: '2 hrs ago' },
		{ initials: 'DT', name: 'Diana T.', action: 'created task "Deep clean VIP area"', time: '3 hrs ago' },
		{ initials: 'BG', name: 'Ben G.', action: 'clocked in at Panglao', time: '4 hrs ago' }
	];

	const allQuickActions = [
		{ href: '/shifts', icon: MapPin, label: 'Clock In', roles: ['admin', 'manager', 'staff'] as const },
		{ href: '/tasks', icon: Plus, label: 'New Task', roles: ['admin', 'manager'] as const },
		{ href: '/expenses', icon: Receipt, label: 'Expense', roles: ['admin', 'manager', 'staff'] as const },
		{ href: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'manager'] as const },
		{ href: '/schedules', icon: Calendar, label: 'Schedule', roles: ['admin', 'manager', 'staff'] as const },
		{ href: '/messages', icon: MessageSquare, label: 'Message', roles: ['admin', 'manager', 'staff'] as const }
	];

	let quickActions = $derived(
		allQuickActions.filter(a => (a.roles as readonly string[]).includes(roleStore.role))
	);

	// Staff personal data
	const staffShiftsToday = [
		{ time: '6:00 AM - 2:00 PM', status: 'Completed' as const, branch: 'Tagbilaran' },
		{ time: '6:00 PM - 10:00 PM', status: 'Upcoming' as const, branch: 'Tagbilaran' }
	];

	const staffTasks = [
		{ title: 'Restock frozen goods section', status: 'in_progress' as const, dueDate: 'Today' },
		{ title: 'Clean storage room B', status: 'pending' as const, dueDate: 'Today' },
		{ title: 'Submit weekly expense report', status: 'completed' as const, dueDate: 'Yesterday' }
	];

	const staffRecentActivity = [
		{ action: 'Clocked in at Tagbilaran', time: '6:02 AM' },
		{ action: 'Completed "Inventory count - beverages"', time: 'Yesterday 4:30 PM' },
		{ action: 'Submitted expense of ₱280', time: 'Yesterday 2:15 PM' }
	];

	const todaySchedule = [
		{ name: 'Maria R.', time: '6:00 AM - 2:00 PM', status: 'Completed' as const },
		{ name: 'John D.', time: '8:00 AM - 4:00 PM', status: 'In Progress' as const },
		{ name: 'Ana S.', time: '10:00 AM - 6:00 PM', status: 'In Progress' as const },
		{ name: 'Rico C.', time: '2:00 PM - 10:00 PM', status: 'Upcoming' as const },
		{ name: 'Liza P.', time: '4:00 PM - 12:00 AM', status: 'Upcoming' as const }
	];

	const statusColors: Record<string, string> = {
		Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
		'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
		Upcoming: 'bg-muted text-muted-foreground'
	};

	// Improvement 3: Daily summary stats
	const dailySummary = {
		shiftsCompleted: 3,
		shiftsTotal: 5,
		tasksCompleted: 8,
		tasksTotal: 12,
		onlineNow: 7
	};
</script>

<div class="min-h-full">
	<div class="mx-auto max-w-dashboard p-5 sm:p-8 lg:p-10">
		<!-- Zone A: Greeting Bar -->
		<div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-page-title">{greetingPrefix}, {greetingName}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{dateStr}
					{#if roleStore.role === 'manager'}
						&middot; Tagbilaran Branch
					{/if}
				</p>
			</div>
			<button class="relative flex h-10 w-10 items-center justify-center self-start rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:self-auto">
				<Bell class="h-5 w-5" />
				<span class="absolute right-1.5 top-1.5 flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
				</span>
			</button>
		</div>

		{#if roleStore.role === 'staff'}
			<!-- STAFF DASHBOARD: Personal view -->
			<!-- Prominent Clock In -->
			<Card class="mb-8 overflow-hidden">
				<div class="relative">
					<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
					<CardContent class="relative flex items-center justify-between p-6">
						<div>
							<p class="text-sm text-muted-foreground">You are not clocked in</p>
							<p class="mt-1 text-lg font-bold">Ready to start your shift?</p>
						</div>
						<a href="/shifts" class="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95">
							<Play class="h-5 w-5" />
							Clock In
						</a>
					</CardContent>
				</div>
			</Card>

			<!-- Staff Stats -->
			<div class="mb-8 grid grid-cols-3 gap-4">
				<Card>
					<CardContent class="p-5">
						<p class="text-card-label text-muted-foreground">My Shifts Today</p>
						<p class="mt-2 text-stat font-mono">{staffShiftsToday.length}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent class="p-5">
						<p class="text-card-label text-muted-foreground">My Tasks</p>
						<p class="mt-2 text-stat font-mono">{staffTasks.filter(t => t.status !== 'completed').length}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent class="p-5">
						<p class="text-card-label text-muted-foreground">Tasks Done</p>
						<p class="mt-2 text-stat font-mono">{staffTasks.filter(t => t.status === 'completed').length}</p>
					</CardContent>
				</Card>
			</div>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
				<!-- Your Shifts Today -->
				<div class="lg:col-span-3">
					<Card class="mb-6">
						<CardHeader class="flex flex-row items-center justify-between pb-4">
							<CardTitle class="text-section-title">Your Shifts Today</CardTitle>
							<Clock class="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each staffShiftsToday as shift}
									<div class="flex items-center justify-between rounded-lg border border-border p-3">
										<div class="flex items-center gap-3">
											<MapPin class="h-4 w-4 text-muted-foreground" />
											<div>
												<p class="font-mono text-sm font-medium">{shift.time}</p>
												<p class="text-caption text-muted-foreground">{shift.branch}</p>
											</div>
										</div>
										<span class="rounded-full px-2.5 py-0.5 text-caption font-medium {statusColors[shift.status]}">
											{shift.status}
										</span>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>

					<!-- Your Tasks -->
					<Card>
						<CardHeader class="flex flex-row items-center justify-between pb-4">
							<CardTitle class="text-section-title">Your Tasks</CardTitle>
							<a href="/tasks" class="text-caption font-medium text-primary hover:underline">View all</a>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each staffTasks as task}
									<div class="flex items-center justify-between rounded-lg border border-border p-3">
										<div class="flex items-center gap-3">
											{#if task.status === 'completed'}
												<CheckCircle2 class="h-4 w-4 text-emerald-500" />
											{:else}
												<ClipboardCheck class="h-4 w-4 text-muted-foreground" />
											{/if}
											<div>
												<p class="text-sm font-medium {task.status === 'completed' ? 'line-through opacity-60' : ''}">{task.title}</p>
												<p class="text-caption text-muted-foreground">Due: {task.dueDate}</p>
											</div>
										</div>
										<span class="rounded-full px-2 py-0.5 text-caption font-medium {task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-muted text-muted-foreground'}">
											{task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
										</span>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				</div>

				<!-- Right Column -->
				<div class="flex flex-col gap-6 lg:col-span-2">
					<!-- Quick Actions -->
					<Card>
						<CardHeader class="pb-4">
							<CardTitle class="text-section-title">Quick Actions</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-3 gap-3">
								{#each quickActions as action}
									<a
										href={action.href}
										class="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center transition-all hover:border-primary/30 hover:bg-accent hover:shadow-sm active:scale-95"
									>
										<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
											<action.icon class="h-5 w-5" />
										</div>
										<span class="text-caption font-medium">{action.label}</span>
									</a>
								{/each}
							</div>
						</CardContent>
					</Card>

					<!-- Your Recent Activity -->
					<Card>
						<CardHeader class="flex flex-row items-center justify-between pb-4">
							<CardTitle class="text-section-title">Your Recent Activity</CardTitle>
							<Activity class="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each staffRecentActivity as entry}
									<div class="flex items-start gap-3 rounded-lg border border-border p-3">
										<div class="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
										<div>
											<p class="text-sm">{entry.action}</p>
											<p class="text-caption text-muted-foreground">{entry.time}</p>
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		{:else}
			<!-- ADMIN / MANAGER DASHBOARD -->
			<!-- Daily Progress Summary -->
			<div class="mb-8 rounded-xl border bg-card p-5">
				<div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
							<Clock class="h-5 w-5" />
						</div>
						<div class="flex-1">
							<p class="text-card-label text-muted-foreground">Shifts Today</p>
							<div class="mt-1 flex items-center gap-2">
								<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full bg-blue-500 transition-all" style="width: {(dailySummary.shiftsCompleted / dailySummary.shiftsTotal) * 100}%"></div>
								</div>
								<span class="text-caption font-semibold">{dailySummary.shiftsCompleted}/{dailySummary.shiftsTotal}</span>
							</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
							<ClipboardCheck class="h-5 w-5" />
						</div>
						<div class="flex-1">
							<p class="text-card-label text-muted-foreground">Tasks Done</p>
							<div class="mt-1 flex items-center gap-2">
								<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full bg-amber-500 transition-all" style="width: {(dailySummary.tasksCompleted / dailySummary.tasksTotal) * 100}%"></div>
								</div>
								<span class="text-caption font-semibold">{dailySummary.tasksCompleted}/{dailySummary.tasksTotal}</span>
							</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
							<Users class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Online Now</p>
							<p class="text-lg font-bold">{dailySummary.onlineNow} <span class="text-caption font-normal text-muted-foreground">employees</span></p>
						</div>
					</div>
				</div>
			</div>

			<!-- Zone B: Stat Cards — clickable, navigate to pages -->
			<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
				{#each statCards as stat}
					<a href={stat.href} class="group block">
						<Card class="h-full transition-all hover:border-primary/20 hover:shadow-card-hover">
							<CardContent class="p-5">
								<div class="flex items-center justify-between">
									<p class="text-card-label text-muted-foreground">{stat.label}</p>
									<div class="flex h-10 w-10 items-center justify-center rounded-xl transition-colors {stat.color} {stat.colorHover}">
										<stat.icon class="h-5 w-5" />
									</div>
								</div>
								<p class="mt-3 text-stat font-mono">{stat.value}</p>
								<div class="mt-1.5 flex items-center justify-between">
									<div class="flex items-center gap-1 text-caption text-muted-foreground">
										{#if stat.trendUp}
											<TrendingUp class="h-3 w-3 text-emerald-500" />
										{:else}
											<TrendingDown class="h-3 w-3 text-amber-500" />
										{/if}
										{stat.trend}
									</div>
									<ArrowRight class="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
								</div>
							</CardContent>
						</Card>
					</a>
				{/each}
			</div>

			<!-- Zone C: Two-Column -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
				<!-- Activity Feed -->
				<div class="lg:col-span-3">
					<Card>
						<CardHeader class="flex flex-row items-center justify-between pb-4">
							<CardTitle class="text-section-title">Activity Feed</CardTitle>
							<Activity class="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div class="relative space-y-4 pl-6">
								<!-- Vertical line -->
								<div class="absolute bottom-0 left-[9px] top-0 w-px bg-border"></div>

								{#each activityFeed as entry}
									<div class="relative flex items-start gap-3">
										<!-- Dot marker -->
										<div class="absolute -left-6 top-1.5 h-[7px] w-[7px] rounded-full bg-primary ring-2 ring-card"></div>

										<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold {getAvatarColor(entry.initials)}">
											{entry.initials}
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm">
												<span class="font-medium">{entry.name}</span>
												<span class="text-muted-foreground"> {entry.action}</span>
											</p>
											<p class="text-caption text-muted-foreground">{entry.time}</p>
										</div>
									</div>
								{/each}
							</div>

							{#if roleStore.role === 'admin'}
								<a href="/reports" class="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
									View all activity
									<ArrowRight class="h-3.5 w-3.5" />
								</a>
							{/if}
						</CardContent>
					</Card>
				</div>

				<!-- Right Column -->
				<div class="flex flex-col gap-6 lg:col-span-2">
					<!-- Quick Actions -->
					<Card>
						<CardHeader class="pb-4">
							<CardTitle class="text-section-title">Quick Actions</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-3 gap-3">
								{#each quickActions as action}
									<a
										href={action.href}
										class="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center transition-all hover:border-primary/30 hover:bg-accent hover:shadow-sm active:scale-95"
									>
										<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
											<action.icon class="h-5 w-5" />
										</div>
										<span class="text-caption font-medium">{action.label}</span>
									</a>
								{/each}
							</div>
						</CardContent>
					</Card>

					<!-- Today's Schedule -->
					<Card>
						<CardHeader class="flex flex-row items-center justify-between pb-4">
							<CardTitle class="text-section-title">Today's Schedule</CardTitle>
							<a href="/schedules" class="text-caption font-medium text-primary hover:underline">View all</a>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each todaySchedule as shift}
									<div class="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
										<div class="min-w-0">
											<p class="text-sm font-medium">{shift.name}</p>
											<p class="font-mono text-caption text-muted-foreground">{shift.time}</p>
										</div>
										<span class="flex-shrink-0 rounded-full px-2.5 py-0.5 text-caption font-medium {statusColors[shift.status]}">
											{shift.status}
										</span>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		{/if}
	</div>
</div>
