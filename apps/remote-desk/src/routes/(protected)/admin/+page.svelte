<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		Shield,
		Users,
		Settings,
		UserPlus,
		Download,
		FileText,
		Server,
		Database,
		Wifi,
		HardDrive,
		CheckCircle2,
		AlertTriangle,
		ShieldAlert
	} from 'lucide-svelte';

	type EmployeeRole = 'admin' | 'manager' | 'staff';
	type EmployeeStatus = 'active' | 'inactive';

	interface Employee {
		id: string;
		name: string;
		initials: string;
		role: EmployeeRole;
		email: string;
		status: EmployeeStatus;
		lastActive: string;
	}

	const employees: Employee[] = [
		{ id: '1', name: 'Admin User', initials: 'AU', role: 'admin', email: 'admin@flowwork.ph', status: 'active', lastActive: 'Online' },
		{ id: '2', name: 'Manager John', initials: 'MJ', role: 'manager', email: 'john@flowwork.ph', status: 'active', lastActive: '5 min ago' },
		{ id: '3', name: 'Maria R.', initials: 'MR', role: 'staff', email: 'maria@flowwork.ph', status: 'active', lastActive: '2 hrs ago' },
		{ id: '4', name: 'Rico C.', initials: 'RC', role: 'staff', email: 'rico@flowwork.ph', status: 'active', lastActive: '1 hr ago' },
		{ id: '5', name: 'Ana S.', initials: 'AS', role: 'staff', email: 'ana@flowwork.ph', status: 'inactive', lastActive: '3 days ago' },
		{ id: '6', name: 'Ben G.', initials: 'BG', role: 'staff', email: 'ben@flowwork.ph', status: 'active', lastActive: '30 min ago' }
	];

	const roleBadge: Record<EmployeeRole, string> = {
		admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
		manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
		staff: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
	};

	const statusDot: Record<EmployeeStatus, string> = {
		active: 'bg-emerald-500',
		inactive: 'bg-muted-foreground/40'
	};

	const avatarColors = [
		'bg-red-200 text-red-800 dark:bg-red-800/50 dark:text-red-300',
		'bg-blue-200 text-blue-800 dark:bg-blue-800/50 dark:text-blue-300',
		'bg-pink-200 text-pink-800 dark:bg-pink-800/50 dark:text-pink-300',
		'bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-300',
		'bg-purple-200 text-purple-800 dark:bg-purple-800/50 dark:text-purple-300',
		'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-300'
	];

	const systemSettings = [
		{ label: 'App Name', value: 'FlowWork' },
		{ label: 'Default Location', value: 'Tagbilaran Branch' },
		{ label: 'Sync Interval', value: '30 seconds' },
		{ label: 'Session Timeout', value: '8 hours' },
		{ label: 'GPS Accuracy', value: 'High (10m)' }
	];

	const systemHealth = [
		{ label: 'Database', status: 'connected' as const, icon: Database },
		{ label: 'Sync Service', status: 'connected' as const, icon: Wifi },
		{ label: 'Storage', status: 'warning' as const, icon: HardDrive, detail: '7.2 GB / 10 GB' }
	];

	const quickActions = [
		{ label: 'Add Employee', icon: UserPlus, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
		{ label: 'Export Data', icon: Download, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
		{ label: 'System Logs', icon: FileText, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' }
	];
</script>

<div class="min-h-full">
	{#if roleStore.role !== 'admin'}
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
		<div class="mb-6">
			<h2 class="text-page-title">Administration</h2>
			<p class="mt-1 text-sm text-muted-foreground">System settings and employee management</p>
		</div>

		<!-- Admin Notice -->
		<div class="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
			<Shield class="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
			<p class="text-sm text-amber-800 dark:text-amber-300">Admin access. Changes here affect all users in the system.</p>
		</div>

		<!-- Quick Actions -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each quickActions as action}
				<button class="group flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-all hover:border-primary/30 hover:shadow-card-hover active:scale-[0.98]">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl transition-colors {action.color}">
						<action.icon class="h-5 w-5" />
					</div>
					<span class="text-sm font-semibold">{action.label}</span>
				</button>
			{/each}
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
			<!-- Employee Management (wider) -->
			<div class="lg:col-span-3">
				<Card>
					<CardHeader class="flex flex-row items-center justify-between pb-4">
						<CardTitle class="text-section-title">Employees</CardTitle>
						<Users class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each employees as emp, idx}
								<div class="flex items-center gap-4 rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/30">
									<!-- Avatar -->
									<div class="relative flex-shrink-0">
										<div class="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold {avatarColors[idx]}">
											{emp.initials}
										</div>
										<div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card {statusDot[emp.status]}"></div>
									</div>

									<!-- Info -->
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium">{emp.name}</span>
											<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {roleBadge[emp.role]}">
												{emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
											</span>
										</div>
										<p class="mt-0.5 truncate text-xs text-muted-foreground">{emp.email}</p>
									</div>

									<!-- Last Active -->
									<span class="hidden text-xs text-muted-foreground sm:block">{emp.lastActive}</span>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Right Column -->
			<div class="flex flex-col gap-6 lg:col-span-2">
				<!-- System Settings -->
				<Card>
					<CardHeader class="flex flex-row items-center justify-between pb-4">
						<CardTitle class="text-section-title">Settings</CardTitle>
						<Settings class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each systemSettings as setting}
								<div class="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
									<span class="text-sm text-muted-foreground">{setting.label}</span>
									<span class="text-sm font-medium">{setting.value}</span>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<!-- System Health -->
				<Card>
					<CardHeader class="flex flex-row items-center justify-between pb-4">
						<CardTitle class="text-section-title">System Health</CardTitle>
						<Server class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each systemHealth as item}
								<div class="flex items-center justify-between rounded-lg border border-border p-3">
									<div class="flex items-center gap-2.5">
										<item.icon class="h-4 w-4 text-muted-foreground" />
										<span class="text-sm font-medium">{item.label}</span>
									</div>
									{#if item.status === 'connected'}
										<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
											<CheckCircle2 class="h-3 w-3" />
											Connected
										</span>
									{:else}
										<div class="text-right">
											<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
												<AlertTriangle class="h-3 w-3" />
												{item.detail}
											</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
	{/if}
</div>
