<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		BarChart3,
		Clock,
		ClipboardCheck,
		Receipt,
		UserCheck,
		TrendingUp,
		TrendingDown,
		Calendar,
		Users,
		Zap,
		Star,
		Target,
		Activity,
		Bus,
		UtensilsCrossed,
		Wrench,
		Building2,
		MoreHorizontal,
		ChevronRight,
		Award,
		ShieldAlert
	} from 'lucide-svelte';

	type TimeRange = 'today' | 'week' | 'month' | 'custom';

	let selectedRange: TimeRange = $state('week');

	const rangeLabels: Record<TimeRange, string> = {
		today: 'Today',
		week: 'This Week',
		month: 'This Month',
		custom: 'Custom'
	};

	// --- Mock data sets per time range ---

	const revenueByRange: Record<TimeRange, { amount: number; change: number }> = {
		today: { amount: 18450, change: 12.3 },
		week: { amount: 127800, change: 8.5 },
		month: { amount: 482350, change: 5.2 },
		custom: { amount: 482350, change: 5.2 }
	};

	const hoursWorkedByRange: Record<TimeRange, { total: number; avgPerEmployee: number; change: number }> = {
		today: { total: 86, avgPerEmployee: 7.2, change: 3.1 },
		week: { total: 584, avgPerEmployee: 7.8, change: 5.4 },
		month: { total: 2248, avgPerEmployee: 7.5, change: 2.8 },
		custom: { total: 2248, avgPerEmployee: 7.5, change: 2.8 }
	};

	const taskRateByRange: Record<TimeRange, { rate: number; change: number }> = {
		today: { rate: 91, change: 4.2 },
		week: { rate: 87, change: 3.1 },
		month: { rate: 84, change: 1.8 },
		custom: { rate: 84, change: 1.8 }
	};

	const attendanceByRange: Record<TimeRange, { rate: number; change: number }> = {
		today: { rate: 98, change: 2.0 },
		week: { rate: 96, change: 1.5 },
		month: { rate: 94, change: 0.8 },
		custom: { rate: 94, change: 0.8 }
	};

	const dailyRevenueByRange: Record<TimeRange, { day: string; value: number }[]> = {
		today: [
			{ day: 'Morning', value: 8200 },
			{ day: 'Midday', value: 5600 },
			{ day: 'Afternoon', value: 3100 },
			{ day: 'Evening', value: 1550 }
		],
		week: [
			{ day: 'Mon', value: 18200 },
			{ day: 'Tue', value: 22400 },
			{ day: 'Wed', value: 19800 },
			{ day: 'Thu', value: 16500 },
			{ day: 'Fri', value: 24100 },
			{ day: 'Sat', value: 15800 },
			{ day: 'Sun', value: 11000 }
		],
		month: [
			{ day: 'Wk 1', value: 112000 },
			{ day: 'Wk 2', value: 128500 },
			{ day: 'Wk 3', value: 119800 },
			{ day: 'Wk 4', value: 122050 }
		],
		custom: [
			{ day: 'Wk 1', value: 112000 },
			{ day: 'Wk 2', value: 128500 },
			{ day: 'Wk 3', value: 119800 },
			{ day: 'Wk 4', value: 122050 }
		]
	};

	const topEmployeesByRange: Record<TimeRange, { name: string; tasks: number; maxTasks: number }[]> = {
		today: [
			{ name: 'Maria R.', tasks: 8, maxTasks: 8 },
			{ name: 'Carlos D.', tasks: 7, maxTasks: 8 },
			{ name: 'Ana S.', tasks: 6, maxTasks: 8 },
			{ name: 'Luis M.', tasks: 5, maxTasks: 8 },
			{ name: 'Rosa T.', tasks: 4, maxTasks: 8 }
		],
		week: [
			{ name: 'Maria R.', tasks: 42, maxTasks: 42 },
			{ name: 'Carlos D.', tasks: 38, maxTasks: 42 },
			{ name: 'Ana S.', tasks: 35, maxTasks: 42 },
			{ name: 'Luis M.', tasks: 31, maxTasks: 42 },
			{ name: 'Rosa T.', tasks: 28, maxTasks: 42 }
		],
		month: [
			{ name: 'Maria R.', tasks: 156, maxTasks: 156 },
			{ name: 'Carlos D.', tasks: 142, maxTasks: 156 },
			{ name: 'Ana S.', tasks: 128, maxTasks: 156 },
			{ name: 'Luis M.', tasks: 115, maxTasks: 156 },
			{ name: 'Rosa T.', tasks: 102, maxTasks: 156 }
		],
		custom: [
			{ name: 'Maria R.', tasks: 156, maxTasks: 156 },
			{ name: 'Carlos D.', tasks: 142, maxTasks: 156 },
			{ name: 'Ana S.', tasks: 128, maxTasks: 156 },
			{ name: 'Luis M.', tasks: 115, maxTasks: 156 },
			{ name: 'Rosa T.', tasks: 102, maxTasks: 156 }
		]
	};

	const branchDataByRange: Record<TimeRange, { tagbilaran: { shifts: number; tasks: number; expenses: number }; panglao: { shifts: number; tasks: number; expenses: number } }> = {
		today: {
			tagbilaran: { shifts: 6, tasks: 18, expenses: 2400 },
			panglao: { shifts: 5, tasks: 14, expenses: 1800 }
		},
		week: {
			tagbilaran: { shifts: 42, tasks: 124, expenses: 16800 },
			panglao: { shifts: 36, tasks: 98, expenses: 12400 }
		},
		month: {
			tagbilaran: { shifts: 168, tasks: 480, expenses: 68500 },
			panglao: { shifts: 144, tasks: 390, expenses: 52300 }
		},
		custom: {
			tagbilaran: { shifts: 168, tasks: 480, expenses: 68500 },
			panglao: { shifts: 144, tasks: 390, expenses: 52300 }
		}
	};

	const expenseCategories = [
		{ category: 'Transport', icon: Bus, amount: 8200, color: 'bg-blue-500' },
		{ category: 'Meals', icon: UtensilsCrossed, amount: 12400, color: 'bg-amber-500' },
		{ category: 'Equipment', icon: Wrench, amount: 5600, color: 'bg-emerald-500' },
		{ category: 'Office', icon: Building2, amount: 3200, color: 'bg-purple-500' },
		{ category: 'Other', icon: MoreHorizontal, amount: 1450, color: 'bg-slate-400' }
	];

	const expenseTotal = expenseCategories.reduce((sum, c) => sum + c.amount, 0);

	// Attendance heatmap: 4 weeks x 7 days, value = attendance %
	const heatmapData: number[][] = [
		[100, 95, 100, 88, 100, 92, 78],
		[96, 100, 100, 100, 85, 100, 72],
		[100, 100, 92, 100, 100, 88, 80],
		[88, 100, 100, 96, 100, 100, 75]
	];
	const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

	const insightsByRange: Record<TimeRange, { icon: typeof Star; label: string; value: string; description: string }[]> = {
		today: [
			{ icon: Star, label: 'Best Hour', value: '10 AM', description: '14 tasks completed' },
			{ icon: Award, label: 'Top Performer', value: 'Maria R.', description: '8 tasks, 0 late' },
			{ icon: Target, label: 'On-Time Rate', value: '98%', description: '2% above average' },
			{ icon: Activity, label: 'Peak Revenue', value: '₱8,200', description: 'Morning shift' },
			{ icon: Users, label: 'Full Attendance', value: '11/12', description: '1 on approved leave' },
			{ icon: Zap, label: 'Fastest Task', value: '4 min', description: 'Inventory restock' }
		],
		week: [
			{ icon: Star, label: 'Best Day', value: 'Tuesday', description: '98% attendance, 34 tasks' },
			{ icon: Award, label: 'Most Active', value: 'Maria R.', description: '42 tasks completed' },
			{ icon: Target, label: 'Task Streak', value: '5 days', description: 'All targets met' },
			{ icon: Activity, label: 'Peak Revenue', value: '₱24,100', description: 'Friday sales' },
			{ icon: Users, label: 'Team Size', value: '15 active', description: '2 on leave' },
			{ icon: Zap, label: 'Efficiency', value: '+12%', description: 'vs previous week' }
		],
		month: [
			{ icon: Star, label: 'Best Week', value: 'Week 2', description: '₱128,500 revenue' },
			{ icon: Award, label: 'Employee of Month', value: 'Maria R.', description: '156 tasks, 99% on-time' },
			{ icon: Target, label: 'Goal Progress', value: '87%', description: 'Monthly target' },
			{ icon: Activity, label: 'Avg Daily Rev', value: '₱16,078', description: '30-day average' },
			{ icon: Users, label: 'Retention', value: '100%', description: 'No turnover' },
			{ icon: Zap, label: 'Cost Savings', value: '₱8,200', description: 'vs last month' }
		],
		custom: [
			{ icon: Star, label: 'Best Week', value: 'Week 2', description: '₱128,500 revenue' },
			{ icon: Award, label: 'Employee of Month', value: 'Maria R.', description: '156 tasks, 99% on-time' },
			{ icon: Target, label: 'Goal Progress', value: '87%', description: 'Monthly target' },
			{ icon: Activity, label: 'Avg Daily Rev', value: '₱16,078', description: '30-day average' },
			{ icon: Users, label: 'Retention', value: '100%', description: 'No turnover' },
			{ icon: Zap, label: 'Cost Savings', value: '₱8,200', description: 'vs last month' }
		]
	};

	// --- Derived state ---

	let revenue = $derived(revenueByRange[selectedRange]);
	let hoursWorked = $derived(hoursWorkedByRange[selectedRange]);
	let taskRate = $derived(taskRateByRange[selectedRange]);
	let attendance = $derived(attendanceByRange[selectedRange]);
	let dailyRevenue = $derived(dailyRevenueByRange[selectedRange]);
	let maxRevenue = $derived(Math.max(...dailyRevenue.map((d) => d.value)));
	let topEmployees = $derived(topEmployeesByRange[selectedRange]);
	let branchData = $derived(branchDataByRange[selectedRange]);
	let insights = $derived(insightsByRange[selectedRange]);

	function formatPeso(amount: number): string {
		return '₱' + amount.toLocaleString('en-PH');
	}

	function heatColor(value: number): string {
		if (value >= 100) return 'bg-emerald-500';
		if (value >= 90) return 'bg-emerald-400';
		if (value >= 80) return 'bg-amber-400';
		return 'bg-red-400';
	}

	// Progress ring: circumference for r=18 (2*PI*18 ~= 113.1)
	const ringCircumference = 113.1;
</script>

<div class="min-h-full">
	{#if roleStore.role === 'staff'}
		<div class="flex min-h-[60vh] flex-col items-center justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
				<ShieldAlert class="h-8 w-8 text-red-500" />
			</div>
			<h3 class="mt-5 text-lg font-semibold">Access Restricted</h3>
			<p class="mt-1 text-sm text-muted-foreground">You don't have permission to view this page.</p>
			<a href="/dashboard" class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Back to Dashboard</a>
		</div>
	{:else}
	<div class="mx-auto max-w-dashboard p-5 sm:p-8 lg:p-10">
		<!-- Page Header -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h2 class="text-page-title">Reports</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{roleStore.role === 'manager' ? 'Branch-level performance metrics — Tagbilaran Branch' : 'Performance metrics and analytics overview'}
				</p>
			</div>

			<!-- Time Range Selector -->
			<div class="flex rounded-lg border border-border bg-muted/50 p-1">
				{#each (['today', 'week', 'month', 'custom'] as const) as range}
					<button
						class="rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm {selectedRange === range
							? 'bg-primary text-primary-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (selectedRange = range)}
					>
						{rangeLabels[range]}
					</button>
				{/each}
			</div>
		</div>

		<!-- KPI Cards -->
		<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
			<!-- Total Revenue -->
			<Card class="transition-all hover:shadow-card-hover">
				<CardContent class="p-4 sm:p-5">
					<div class="flex items-center justify-between">
						<p class="text-[11px] sm:text-card-label text-muted-foreground">Total Revenue</p>
						<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
							<Receipt class="h-5 w-5" />
						</div>
					</div>
					<div class="mt-3">
						<span class="text-lg font-bold sm:text-xl lg:text-2xl font-mono">{formatPeso(revenue.amount)}</span>
					</div>
					<div class="mt-1.5 flex items-center gap-1 text-caption">
						{#if revenue.change >= 0}
							<TrendingUp class="h-3 w-3 text-emerald-500" />
							<span class="text-emerald-600 dark:text-emerald-400">+{revenue.change}%</span>
						{:else}
							<TrendingDown class="h-3 w-3 text-red-500" />
							<span class="text-red-600 dark:text-red-400">{revenue.change}%</span>
						{/if}
						<span class="text-muted-foreground">vs prior</span>
					</div>
				</CardContent>
			</Card>

			<!-- Hours Worked -->
			<Card class="transition-all hover:shadow-card-hover">
				<CardContent class="p-4 sm:p-5">
					<div class="flex items-center justify-between">
						<p class="text-[11px] sm:text-card-label text-muted-foreground">Hours Worked</p>
						<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
							<Clock class="h-5 w-5" />
						</div>
					</div>
					<div class="mt-3 flex items-baseline gap-1">
						<span class="text-lg font-bold sm:text-xl lg:text-2xl font-mono">{hoursWorked.total.toLocaleString()}</span>
						<span class="text-caption text-muted-foreground">hrs</span>
					</div>
					<div class="mt-1.5 flex items-center gap-1 text-caption text-muted-foreground">
						<span class="font-mono">{hoursWorked.avgPerEmployee}</span> avg/employee
					</div>
				</CardContent>
			</Card>

			<!-- Task Completion Rate (with ring) -->
			<Card class="transition-all hover:shadow-card-hover">
				<CardContent class="p-4 sm:p-5">
					<div class="flex items-center justify-between">
						<p class="text-[11px] sm:text-card-label text-muted-foreground">Task Completion</p>
						<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
							<ClipboardCheck class="h-5 w-5" />
						</div>
					</div>
					<div class="mt-3 flex items-center gap-3">
						<!-- CSS progress ring — hidden on small mobile -->
						<div class="relative hidden h-12 w-12 flex-shrink-0 sm:block">
							<svg class="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
								<circle cx="22" cy="22" r="18" fill="none" stroke-width="4" class="stroke-muted" />
								<circle
									cx="22"
									cy="22"
									r="18"
									fill="none"
									stroke-width="4"
									class="stroke-primary"
									stroke-linecap="round"
									stroke-dasharray={ringCircumference}
									stroke-dashoffset={ringCircumference - (ringCircumference * taskRate.rate) / 100}
								/>
							</svg>
							<span class="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">
								{taskRate.rate}
							</span>
						</div>
						<div>
							<span class="text-lg font-bold sm:text-xl lg:text-2xl font-mono">{taskRate.rate}%</span>
							<div class="flex items-center gap-1 text-caption">
								<TrendingUp class="h-3 w-3 text-emerald-500" />
								<span class="text-emerald-600 dark:text-emerald-400">+{taskRate.change}%</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Attendance Rate -->
			<Card class="transition-all hover:shadow-card-hover">
				<CardContent class="p-4 sm:p-5">
					<div class="flex items-center justify-between">
						<p class="text-[11px] sm:text-card-label text-muted-foreground">Attendance Rate</p>
						<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
							<UserCheck class="h-5 w-5" />
						</div>
					</div>
					<div class="mt-3 flex items-baseline gap-1">
						<span class="text-lg font-bold sm:text-xl lg:text-2xl font-mono">{attendance.rate}</span>
						<span class="text-caption text-muted-foreground">%</span>
					</div>
					<div class="mt-1.5 flex items-center gap-1 text-caption">
						{#if attendance.change >= 0}
							<TrendingUp class="h-3 w-3 text-emerald-500" />
							<span class="text-emerald-600 dark:text-emerald-400">+{attendance.change}%</span>
						{:else}
							<TrendingDown class="h-3 w-3 text-red-500" />
							<span class="text-red-600 dark:text-red-400">{attendance.change}%</span>
						{/if}
						<span class="text-muted-foreground">trend</span>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Revenue Chart + Employee Performance -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Revenue Bar Chart (horizontal bars for mobile) -->
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-4">
					<CardTitle class="text-section-title">Revenue Breakdown</CardTitle>
					<BarChart3 class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each dailyRevenue as item}
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium">{item.day}</span>
									<span class="font-mono font-semibold">{formatPeso(item.value)}</span>
								</div>
								<div class="h-2.5 overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-primary transition-all"
										style="width: {(item.value / maxRevenue) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Employee Performance -->
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-4">
					<CardTitle class="text-section-title">Top Performers</CardTitle>
					<Award class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						{#each topEmployees as emp, i}
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold {i === 0
									? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
									: i === 1
										? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
										: i === 2
											? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
											: 'bg-muted text-muted-foreground'}">
									{i + 1}
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center justify-between">
										<span class="truncate text-sm font-medium">{emp.name}</span>
										<span class="font-mono text-sm font-bold">{emp.tasks}</span>
									</div>
									<div class="h-1.5 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full transition-all {i === 0
												? 'bg-amber-500'
												: i === 1
													? 'bg-slate-400'
													: i === 2
														? 'bg-orange-400'
														: 'bg-primary/60'}"
											style="width: {(emp.tasks / emp.maxTasks) * 100}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Branch Comparison + Expense Breakdown -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Branch Comparison -->
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-4">
					<CardTitle class="text-section-title">Branch Comparison</CardTitle>
					<Building2 class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						<!-- Tagbilaran -->
						<div class="rounded-xl border border-border p-4">
							<p class="mb-3 text-sm font-semibold">Tagbilaran</p>
							<div class="space-y-3">
								<div>
									<p class="text-caption text-muted-foreground">Shifts</p>
									<p class="font-mono text-lg font-bold">{branchData.tagbilaran.shifts}</p>
								</div>
								<div>
									<p class="text-caption text-muted-foreground">Tasks</p>
									<p class="font-mono text-lg font-bold">{branchData.tagbilaran.tasks}</p>
								</div>
								<div>
									<p class="text-caption text-muted-foreground">Expenses</p>
									<p class="font-mono text-lg font-bold">{formatPeso(branchData.tagbilaran.expenses)}</p>
								</div>
							</div>
						</div>
						<!-- Panglao -->
						<div class="rounded-xl border border-border p-4">
							<p class="mb-3 text-sm font-semibold">Panglao</p>
							<div class="space-y-3">
								<div>
									<p class="text-caption text-muted-foreground">Shifts</p>
									<p class="font-mono text-lg font-bold">{branchData.panglao.shifts}</p>
								</div>
								<div>
									<p class="text-caption text-muted-foreground">Tasks</p>
									<p class="font-mono text-lg font-bold">{branchData.panglao.tasks}</p>
								</div>
								<div>
									<p class="text-caption text-muted-foreground">Expenses</p>
									<p class="font-mono text-lg font-bold">{formatPeso(branchData.panglao.expenses)}</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Expense Breakdown -->
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-4">
					<CardTitle class="text-section-title">Expense Breakdown</CardTitle>
					<Receipt class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<!-- Stacked bar -->
					<div class="mb-5 flex h-5 overflow-hidden rounded-full">
						{#each expenseCategories as cat}
							<div
								class="transition-all {cat.color}"
								style="width: {(cat.amount / expenseTotal) * 100}%"
							></div>
						{/each}
					</div>

					<div class="space-y-3">
						{#each expenseCategories as cat}
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
									<cat.icon class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center justify-between">
										<span class="text-sm font-medium">{cat.category}</span>
										<div class="flex items-center gap-2">
											<span class="font-mono text-sm font-bold">{formatPeso(cat.amount)}</span>
											<span class="text-caption text-muted-foreground">({Math.round((cat.amount / expenseTotal) * 100)}%)</span>
										</div>
									</div>
									<div class="h-1.5 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full transition-all {cat.color}"
											style="width: {(cat.amount / expenseTotal) * 100}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Attendance Heatmap -->
		<div class="mb-8">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-4">
					<CardTitle class="text-section-title">Attendance Heatmap</CardTitle>
					<Calendar class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<!-- Desktop: Grid heatmap -->
					<div class="hidden sm:block">
						<div class="mb-2 grid grid-cols-7 gap-2">
							{#each dayLabels as label}
								<div class="text-center text-caption font-medium text-muted-foreground">{label}</div>
							{/each}
						</div>
						{#each heatmapData as week, weekIdx}
							<div class="mb-2 grid grid-cols-7 gap-2">
								{#each week as value}
									<div class="group relative flex aspect-square items-center justify-center rounded-lg {heatColor(value)} transition-all hover:scale-110">
										<span class="font-mono text-xs font-bold text-white">{value}</span>
									</div>
								{/each}
							</div>
						{/each}
						<div class="mt-3 flex items-center justify-end gap-3 text-caption text-muted-foreground">
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded bg-emerald-500"></div>
								<span>100%</span>
							</div>
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded bg-emerald-400"></div>
								<span>90-99%</span>
							</div>
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded bg-amber-400"></div>
								<span>80-89%</span>
							</div>
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded bg-red-400"></div>
								<span>&lt;80%</span>
							</div>
						</div>
					</div>

					<!-- Mobile: List view -->
					<div class="sm:hidden">
						<div class="space-y-2">
							{#each heatmapData as week, weekIdx}
								<div class="rounded-lg border border-border p-3">
									<p class="mb-2 text-sm font-medium">Week {weekIdx + 1}</p>
									<div class="flex items-center gap-1.5">
										{#each week as value, dayIdx}
											<div class="flex flex-1 flex-col items-center gap-1">
												<span class="text-caption text-muted-foreground">{dayLabels[dayIdx]}</span>
												<div class="h-6 w-6 rounded-md {heatColor(value)} flex items-center justify-center">
													<span class="font-mono text-[10px] font-bold text-white">{value}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Quick Insights -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<CardTitle class="text-section-title">Quick Insights</CardTitle>
				<Zap class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each insights as insight}
						<div class="flex items-start gap-3 rounded-xl border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm">
							<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<insight.icon class="h-5 w-5" />
							</div>
							<div class="min-w-0">
								<p class="text-caption text-muted-foreground">{insight.label}</p>
								<p class="font-mono text-lg font-bold">{insight.value}</p>
								<p class="text-caption text-muted-foreground">{insight.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>
	{/if}
</div>
