<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		Receipt,
		Plus,
		Clock,
		CheckCircle2,
		XCircle,
		Car,
		UtensilsCrossed,
		Wrench,
		Briefcase,
		MoreHorizontal,
		Calendar
	} from 'lucide-svelte';

	type ExpenseStatus = 'pending' | 'approved' | 'rejected';
	type ExpenseCategory = 'Transport' | 'Meals' | 'Equipment' | 'Office' | 'Other';

	interface Expense {
		id: string;
		description: string;
		amount: number;
		category: ExpenseCategory;
		status: ExpenseStatus;
		date: string;
		submittedBy: string;
		initials: string;
	}

	const mockExpenses: Expense[] = [
		{ id: '1', description: 'Taxi to Tagbilaran branch for morning shift', amount: 450, category: 'Transport', status: 'pending', date: 'Mar 21', submittedBy: 'Maria R.', initials: 'MR' },
		{ id: '2', description: 'Team lunch for inventory meeting', amount: 1200, category: 'Meals', status: 'approved', date: 'Mar 20', submittedBy: 'John D.', initials: 'JD' },
		{ id: '3', description: 'Grill replacement parts', amount: 3500, category: 'Equipment', status: 'pending', date: 'Mar 20', submittedBy: 'Rico C.', initials: 'RC' },
		{ id: '4', description: 'Printer ink cartridges', amount: 650, category: 'Office', status: 'rejected', date: 'Mar 19', submittedBy: 'Ana S.', initials: 'AS' },
		{ id: '5', description: 'Grab ride to Panglao branch', amount: 280, category: 'Transport', status: 'approved', date: 'Mar 19', submittedBy: 'Liza P.', initials: 'LP' },
		{ id: '6', description: 'Staff dinner - overtime meal', amount: 850, category: 'Meals', status: 'approved', date: 'Mar 18', submittedBy: 'Ken M.', initials: 'KM' },
		{ id: '7', description: 'Cleaning supplies and mop heads', amount: 420, category: 'Other', status: 'pending', date: 'Mar 18', submittedBy: 'Diana T.', initials: 'DT' },
		{ id: '8', description: 'Office chair replacement', amount: 2800, category: 'Office', status: 'approved', date: 'Mar 17', submittedBy: 'Ben G.', initials: 'BG' }
	];

	const totalPending = mockExpenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
	const totalApproved = mockExpenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
	const totalRejected = mockExpenses.filter((e) => e.status === 'rejected').reduce((s, e) => s + e.amount, 0);

	function formatPeso(amount: number): string {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount);
	}

	const statusBadge: Record<ExpenseStatus, string> = {
		pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
		approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
		rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
	};

	const categoryBadge: Record<ExpenseCategory, string> = {
		Transport: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
		Meals: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
		Equipment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
		Office: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
		Other: 'bg-muted text-muted-foreground'
	};

	const categoryIcons: Record<ExpenseCategory, typeof Car> = {
		Transport: Car,
		Meals: UtensilsCrossed,
		Equipment: Wrench,
		Office: Briefcase,
		Other: MoreHorizontal
	};

	// Staff only sees their own expenses (mock: Maria R.)
	let visibleExpenses = $derived(
		roleStore.role === 'staff' ? mockExpenses.filter(e => e.submittedBy === 'Maria R.') : mockExpenses
	);

	let visiblePending = $derived(visibleExpenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0));
	let visibleApproved = $derived(visibleExpenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0));
	let visibleRejected = $derived(visibleExpenses.filter(e => e.status === 'rejected').reduce((s, e) => s + e.amount, 0));
</script>

<div class="min-h-full">
	<div class="mx-auto max-w-dashboard p-5 sm:p-8 lg:p-10">
		<!-- Page Header -->
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-page-title">{roleStore.role === 'staff' ? 'My Expenses' : 'Expenses'}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{roleStore.role === 'staff' ? 'Submit and track your expenses' : 'Submit and manage work-related expenses'}
				</p>
			</div>
			<button class="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 active:scale-95">
				<Plus class="h-4 w-4" />
				{roleStore.role === 'staff' ? 'Submit Expense' : 'New Expense'}
			</button>
		</div>

		<!-- Summary Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Card>
				<CardContent class="p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
							<Clock class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Pending</p>
							<p class="text-stat font-mono">{formatPeso(visiblePending)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
							<CheckCircle2 class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Approved</p>
							<p class="text-stat font-mono">{formatPeso(visibleApproved)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
							<XCircle class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Rejected</p>
							<p class="text-stat font-mono">{formatPeso(visibleRejected)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Expense List -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<CardTitle class="text-section-title">{roleStore.role === 'staff' ? 'My Expenses' : 'All Expenses'}</CardTitle>
				<Receipt class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each visibleExpenses as expense}
						{@const CategoryIcon = categoryIcons[expense.category]}
						<div class="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30">
							<!-- Category Icon -->
							<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg {categoryBadge[expense.category]}">
								<CategoryIcon class="h-5 w-5" />
							</div>

							<!-- Details -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h3 class="text-sm font-medium">{expense.description}</h3>
								</div>
								<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
									<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {categoryBadge[expense.category]}">
										{expense.category}
									</span>
									<span class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{expense.date}
									</span>
									<span class="flex items-center gap-1">
										<div class="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-semibold text-accent-foreground">
											{expense.initials}
										</div>
										{expense.submittedBy}
									</span>
								</div>
							</div>

							<!-- Amount & Status -->
							<div class="flex flex-shrink-0 flex-col items-end gap-1.5">
								<span class="font-mono text-sm font-bold">{formatPeso(expense.amount)}</span>
								<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {statusBadge[expense.status]}">
									{expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>
</div>
