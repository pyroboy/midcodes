<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		Calendar,
		ChevronLeft,
		ChevronRight,
		Clock,
		Sun,
		Sunset,
		Moon,
		Users,
		Plus,
		MapPin,
		Copy
	} from 'lucide-svelte';

	const employees = [
		{ name: 'Maria R.', initials: 'MR', role: 'Manager', branch: 'Tagbilaran' },
		{ name: 'John D.', initials: 'JD', role: 'Staff', branch: 'Tagbilaran' },
		{ name: 'Ana S.', initials: 'AS', role: 'Staff', branch: 'Panglao' },
		{ name: 'Rico C.', initials: 'RC', role: 'Staff', branch: 'Tagbilaran' },
		{ name: 'Liza P.', initials: 'LP', role: 'Staff', branch: 'Panglao' }
	];

	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const dates = ['Mar 24', 'Mar 25', 'Mar 26', 'Mar 27', 'Mar 28', 'Mar 29', 'Mar 30'];

	type ShiftType = 'morning' | 'afternoon' | 'evening';

	interface ShiftSlot {
		time: string;
		type: ShiftType;
		hours: number;
	}

	const schedule: Record<string, Record<string, ShiftSlot | null>> = {
		'Maria R.': {
			Mon: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 },
			Tue: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 },
			Wed: null,
			Thu: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 },
			Fri: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 },
			Sat: { time: '8:00 AM - 4:00 PM', type: 'morning', hours: 8 },
			Sun: null
		},
		'John D.': {
			Mon: { time: '2:00 PM - 10:00 PM', type: 'afternoon', hours: 8 },
			Tue: { time: '2:00 PM - 10:00 PM', type: 'afternoon', hours: 8 },
			Wed: { time: '2:00 PM - 10:00 PM', type: 'afternoon', hours: 8 },
			Thu: null,
			Fri: { time: '2:00 PM - 10:00 PM', type: 'afternoon', hours: 8 },
			Sat: null,
			Sun: { time: '10:00 AM - 6:00 PM', type: 'afternoon', hours: 8 }
		},
		'Ana S.': {
			Mon: { time: '8:00 AM - 4:00 PM', type: 'morning', hours: 8 },
			Tue: null,
			Wed: { time: '8:00 AM - 4:00 PM', type: 'morning', hours: 8 },
			Thu: { time: '8:00 AM - 4:00 PM', type: 'morning', hours: 8 },
			Fri: null,
			Sat: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 },
			Sun: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 }
		},
		'Rico C.': {
			Mon: null,
			Tue: { time: '10:00 PM - 6:00 AM', type: 'evening', hours: 8 },
			Wed: { time: '10:00 PM - 6:00 AM', type: 'evening', hours: 8 },
			Thu: { time: '10:00 PM - 6:00 AM', type: 'evening', hours: 8 },
			Fri: { time: '10:00 PM - 6:00 AM', type: 'evening', hours: 8 },
			Sat: null,
			Sun: null
		},
		'Liza P.': {
			Mon: { time: '2:00 PM - 10:00 PM', type: 'afternoon', hours: 8 },
			Tue: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 },
			Wed: { time: '2:00 PM - 10:00 PM', type: 'afternoon', hours: 8 },
			Thu: { time: '2:00 PM - 10:00 PM', type: 'afternoon', hours: 8 },
			Fri: { time: '6:00 AM - 2:00 PM', type: 'morning', hours: 8 },
			Sat: null,
			Sun: null
		}
	};

	const shiftColors: Record<ShiftType, string> = {
		morning: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',
		afternoon: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
		evening: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50'
	};

	const shiftDotColors: Record<ShiftType, string> = {
		morning: 'bg-blue-500',
		afternoon: 'bg-amber-500',
		evening: 'bg-purple-500'
	};

	const shiftLabels: Record<ShiftType, string> = {
		morning: 'Morning',
		afternoon: 'Afternoon',
		evening: 'Night'
	};

	const avatarColors = [
		'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500'
	];

	// Mobile: day selector
	let selectedDayIndex = $state(0); // Monday = 0
	const today = 0; // Mock: Monday is "today"

	// Stats
	let dayStats = $derived.by(() => {
		const day = days[selectedDayIndex];
		let scheduled = 0;
		let totalHours = 0;
		for (const emp of visibleEmployees) {
			const slot = schedule[emp.name]?.[day];
			if (slot) {
				scheduled++;
				totalHours += slot.hours;
			}
		}
		return { scheduled, off: visibleEmployees.length - scheduled, totalHours };
	});

	// Weekly hours per employee
	function getWeeklyHours(name: string): number {
		return days.reduce((sum, day) => sum + (schedule[name]?.[day]?.hours ?? 0), 0);
	}

	function getWeeklyShiftCount(name: string): number {
		return days.reduce((count, day) => count + (schedule[name]?.[day] ? 1 : 0), 0);
	}

	// Staff only sees their own schedule (mock: Maria R.)
	let visibleEmployees = $derived(
		roleStore.role === 'staff' ? employees.filter(e => e.name === 'Maria R.') : employees
	);
</script>

<div class="min-h-full">
	<div class="mx-auto max-w-dashboard p-5 sm:p-8 lg:p-10">
		<!-- Page Header -->
		<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h2 class="text-page-title">{roleStore.role === 'staff' ? 'My Schedule' : 'Schedule'}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{roleStore.role === 'staff' ? 'Your weekly shift schedule' : 'Weekly shift schedule for all employees'}
				</p>
			</div>
			{#if roleStore.role !== 'staff'}
				<div class="flex gap-2 self-start">
					<button class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
						<Copy class="h-4 w-4" />
						Copy Week
					</button>
					<button class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95">
						<Plus class="h-4 w-4" />
						Add Shift
					</button>
				</div>
			{/if}
		</div>

		<!-- Week Navigation -->
		<div class="mb-6 flex items-center justify-between rounded-xl border bg-card p-4">
			<button class="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
				<ChevronLeft class="h-4 w-4" />
			</button>
			<div class="text-center">
				<div class="flex items-center justify-center gap-2 text-sm font-bold">
					<Calendar class="h-4 w-4 text-primary" />
					March 24 - 30, 2026
				</div>
				<p class="mt-0.5 text-caption text-muted-foreground">Week 13</p>
			</div>
			<button class="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>

		<!-- MOBILE VIEW: Day-by-day cards -->
		<div class="lg:hidden">
			<!-- Day Tabs (horizontal scroll) -->
			<div class="mb-4 flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
				{#each days as day, i}
					<button
						onclick={() => (selectedDayIndex = i)}
						class="flex flex-shrink-0 flex-col items-center rounded-xl px-4 py-2.5 transition-all
							{selectedDayIndex === i
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'border bg-card text-muted-foreground hover:bg-muted'}"
					>
						<span class="text-[10px] font-bold uppercase">{day}</span>
						<span class="text-lg font-bold">{dates[i].split(' ')[1]}</span>
					</button>
				{/each}
			</div>

			<!-- Day Summary Stats -->
			<div class="mb-4 grid grid-cols-3 gap-3">
				<div class="rounded-xl border bg-card p-3 text-center">
					<p class="text-stat font-mono text-lg">{dayStats.scheduled}</p>
					<p class="text-caption text-muted-foreground">Scheduled</p>
				</div>
				<div class="rounded-xl border bg-card p-3 text-center">
					<p class="text-stat font-mono text-lg">{dayStats.off}</p>
					<p class="text-caption text-muted-foreground">Day Off</p>
				</div>
				<div class="rounded-xl border bg-card p-3 text-center">
					<p class="text-stat font-mono text-lg">{dayStats.totalHours}h</p>
					<p class="text-caption text-muted-foreground">Total Hours</p>
				</div>
			</div>

			<!-- Employee Cards for Selected Day -->
			<div class="space-y-3">
				{#each visibleEmployees as emp, idx}
					{@const slot = schedule[emp.name]?.[days[selectedDayIndex]]}
					<div class="rounded-xl border bg-card p-4 transition-all {slot ? '' : 'opacity-50'}">
						<div class="flex items-center gap-3">
							<!-- Avatar -->
							<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white {avatarColors[idx]}">
								{emp.initials}
							</div>

							<!-- Info -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<p class="text-sm font-semibold">{emp.name}</p>
									<span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{emp.role}</span>
								</div>
								<div class="mt-0.5 flex items-center gap-1 text-caption text-muted-foreground">
									<MapPin class="h-3 w-3" />
									{emp.branch}
								</div>
							</div>

							<!-- Shift Info -->
							{#if slot}
								<div class="flex flex-col items-end gap-1">
									<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium {shiftColors[slot.type]}">
										<span class="h-2 w-2 rounded-full {shiftDotColors[slot.type]}"></span>
										{shiftLabels[slot.type]}
									</span>
									<span class="font-mono text-caption font-medium">{slot.time}</span>
								</div>
							{:else}
								<span class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Day Off</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- DESKTOP VIEW: Full week grid -->
		<div class="hidden lg:block">
			<!-- Legend -->
			<div class="mb-4 flex items-center gap-5">
				{#each (['morning', 'afternoon', 'evening'] as const) as type}
					<div class="flex items-center gap-2 text-xs">
						<span class="h-3 w-3 rounded-full {shiftDotColors[type]}"></span>
						<span class="font-medium text-muted-foreground">{shiftLabels[type]}</span>
					</div>
				{/each}
			</div>

			<Card class="overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b bg-muted/30">
								<th class="sticky left-0 z-10 bg-muted/30 px-5 py-3.5 text-left">
									<div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
										<Users class="h-3.5 w-3.5" />
										Employee
									</div>
								</th>
								{#each days as day, i}
									<th class="min-w-[120px] px-3 py-3.5 text-center {i === today ? 'bg-primary/5' : ''}">
										<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{day}</div>
										<div class="mt-0.5 text-sm font-semibold {i === today ? 'text-primary' : 'text-foreground'}">{dates[i].split(' ')[1]}</div>
										{#if i === today}
											<div class="mx-auto mt-1 h-1 w-6 rounded-full bg-primary"></div>
										{/if}
									</th>
								{/each}
								<th class="px-4 py-3.5 text-center">
									<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Weekly</div>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each visibleEmployees as emp, idx}
								<tr class="group border-b last:border-0 transition-colors hover:bg-muted/20">
									<td class="sticky left-0 z-10 bg-card px-5 py-3.5 group-hover:bg-muted/20">
										<div class="flex items-center gap-3">
											<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white {avatarColors[idx]}">
												{emp.initials}
											</div>
											<div>
												<p class="whitespace-nowrap text-sm font-semibold">{emp.name}</p>
												<p class="text-[10px] text-muted-foreground">{emp.branch}</p>
											</div>
										</div>
									</td>
									{#each days as day, i}
										{@const slot = schedule[emp.name]?.[day]}
										<td class="px-2 py-3.5 text-center {i === today ? 'bg-primary/5' : ''}">
											{#if slot}
												<div class="mx-auto inline-flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-2 transition-all hover:shadow-sm {shiftColors[slot.type]}">
													<div class="flex items-center gap-1">
														<span class="h-1.5 w-1.5 rounded-full {shiftDotColors[slot.type]}"></span>
														<span class="text-[10px] font-bold uppercase">{shiftLabels[slot.type]}</span>
													</div>
													<span class="whitespace-nowrap font-mono text-[11px] font-medium">{slot.time.replace(/ AM/g, 'a').replace(/ PM/g, 'p').replace(' - ', '-')}</span>
												</div>
											{:else}
												<span class="text-xs text-muted-foreground/30">—</span>
											{/if}
										</td>
									{/each}
									<!-- Weekly Summary -->
									<td class="px-4 py-3.5 text-center">
										<p class="font-mono text-sm font-bold">{getWeeklyHours(emp.name)}h</p>
										<p class="text-[10px] text-muted-foreground">{getWeeklyShiftCount(emp.name)} shifts</p>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>

			<!-- Weekly Summary Bar -->
			<div class="mt-6 grid grid-cols-4 gap-4">
				<div class="rounded-xl border bg-card p-4 text-center">
					<div class="flex items-center justify-center gap-2">
						<span class="h-3 w-3 rounded-full bg-blue-500"></span>
						<p class="text-caption font-medium text-muted-foreground">Morning Shifts</p>
					</div>
					<p class="mt-1 text-xl font-bold font-mono">{Object.values(schedule).reduce((sum, emp) => sum + Object.values(emp).filter(s => s?.type === 'morning').length, 0)}</p>
				</div>
				<div class="rounded-xl border bg-card p-4 text-center">
					<div class="flex items-center justify-center gap-2">
						<span class="h-3 w-3 rounded-full bg-amber-500"></span>
						<p class="text-caption font-medium text-muted-foreground">Afternoon Shifts</p>
					</div>
					<p class="mt-1 text-xl font-bold font-mono">{Object.values(schedule).reduce((sum, emp) => sum + Object.values(emp).filter(s => s?.type === 'afternoon').length, 0)}</p>
				</div>
				<div class="rounded-xl border bg-card p-4 text-center">
					<div class="flex items-center justify-center gap-2">
						<span class="h-3 w-3 rounded-full bg-purple-500"></span>
						<p class="text-caption font-medium text-muted-foreground">Night Shifts</p>
					</div>
					<p class="mt-1 text-xl font-bold font-mono">{Object.values(schedule).reduce((sum, emp) => sum + Object.values(emp).filter(s => s?.type === 'evening').length, 0)}</p>
				</div>
				<div class="rounded-xl border bg-card p-4 text-center">
					<div class="flex items-center justify-center gap-2">
						<Clock class="h-3 w-3 text-muted-foreground" />
						<p class="text-caption font-medium text-muted-foreground">Total Hours</p>
					</div>
					<p class="mt-1 text-xl font-bold font-mono">{visibleEmployees.reduce((sum, emp) => sum + getWeeklyHours(emp.name), 0)}h</p>
				</div>
			</div>
		</div>
	</div>
</div>
