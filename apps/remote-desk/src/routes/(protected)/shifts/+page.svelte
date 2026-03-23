<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		Clock,
		MapPin,
		Play,
		Square,
		CheckCircle2,
		XCircle,
		Timer,
		Navigation,
		Wifi
	} from 'lucide-svelte';

	let isClockedIn = $state(false);
	let gpsStatus = $state<'idle' | 'locating' | 'locked'>('idle');
	let clockInTime = $state<Date | null>(null);
	let elapsedSeconds = $state(0);
	let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);

	function formatDuration(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	function handleClockIn() {
		gpsStatus = 'locating';
		setTimeout(() => {
			gpsStatus = 'locked';
			isClockedIn = true;
			clockInTime = new Date();
			elapsedSeconds = 0;
			timerInterval = setInterval(() => {
				elapsedSeconds++;
			}, 1000);
		}, 1200);
	}

	function handleClockOut() {
		isClockedIn = false;
		gpsStatus = 'idle';
		clockInTime = null;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		elapsedSeconds = 0;
	}

	type ShiftStatus = 'active' | 'completed' | 'missed';

	const recentShifts: {
		employee: string;
		initials: string;
		location: string;
		clockIn: string;
		clockOut: string;
		duration: string;
		status: ShiftStatus;
	}[] = [
		{ employee: 'Maria R.', initials: 'MR', location: 'Tagbilaran Branch', clockIn: '6:00 AM', clockOut: '--', duration: '6h 24m', status: 'active' },
		{ employee: 'John D.', initials: 'JD', location: 'Panglao Branch', clockIn: '7:30 AM', clockOut: '--', duration: '4h 54m', status: 'active' },
		{ employee: 'Ana S.', initials: 'AS', location: 'Tagbilaran Branch', clockIn: '6:00 AM', clockOut: '2:15 PM', duration: '8h 15m', status: 'completed' },
		{ employee: 'Rico C.', initials: 'RC', location: 'Panglao Branch', clockIn: '6:00 AM', clockOut: '2:00 PM', duration: '8h 00m', status: 'completed' },
		{ employee: 'Liza P.', initials: 'LP', location: 'Tagbilaran Branch', clockIn: '8:00 AM', clockOut: '4:30 PM', duration: '8h 30m', status: 'completed' },
		{ employee: 'Ken M.', initials: 'KM', location: 'Panglao Branch', clockIn: '10:00 AM', clockOut: '6:00 PM', duration: '8h 00m', status: 'completed' },
		{ employee: 'Diana T.', initials: 'DT', location: 'Tagbilaran Branch', clockIn: '6:00 AM', clockOut: '2:00 PM', duration: '8h 00m', status: 'completed' },
		{ employee: 'Ben G.', initials: 'BG', location: 'Panglao Branch', clockIn: '--', clockOut: '--', duration: '--', status: 'missed' }
	];

	const statusBadge: Record<ShiftStatus, string> = {
		active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
		completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
		missed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
	};

	const gpsLabels: Record<string, string> = {
		idle: 'GPS Ready',
		locating: 'Acquiring location...',
		locked: 'Location Locked'
	};

	const gpsColors: Record<string, string> = {
		idle: 'text-muted-foreground',
		locating: 'text-amber-500',
		locked: 'text-emerald-500'
	};
</script>

<div class="min-h-full">
	<div class="mx-auto max-w-dashboard p-5 sm:p-8 lg:p-10">
		<!-- Page Header -->
		<div class="mb-6">
			<h2 class="text-page-title">Shifts</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				{roleStore.role === 'staff' ? 'Track your shifts and clock in/out' : 'Clock in/out with GPS location tracking'}
			</p>
		</div>

		<!-- Hero: Clock In/Out -->
		<Card class="mb-8 overflow-hidden">
			<div class="relative">
				<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
				<CardContent class="relative p-6 sm:p-8">
					<div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
						<!-- Left: Status & Timer -->
						<div class="text-center sm:text-left">
							<div class="flex items-center justify-center gap-2 sm:justify-start {gpsColors[gpsStatus]}">
								{#if gpsStatus === 'locating'}
									<Wifi class="h-4 w-4 animate-pulse" />
								{:else if gpsStatus === 'locked'}
									<Navigation class="h-4 w-4" />
								{:else}
									<MapPin class="h-4 w-4" />
								{/if}
								<span class="text-sm font-medium">{gpsLabels[gpsStatus]}</span>
							</div>

							{#if isClockedIn}
								<p class="mt-4 font-mono text-4xl font-bold tabular-nums sm:text-5xl">
									{formatDuration(elapsedSeconds)}
								</p>
								<p class="mt-2 text-sm text-muted-foreground">
									Clocked in at {clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</p>
								<div class="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
									<MapPin class="h-3.5 w-3.5" />
									Tagbilaran Branch
								</div>
							{:else}
								<p class="mt-4 text-2xl font-bold sm:text-3xl">Not Clocked In</p>
								<p class="mt-2 text-sm text-muted-foreground">Tap the button to start your shift</p>
							{/if}
						</div>

						<!-- Right: Clock Button -->
						<div class="flex flex-col items-center gap-3">
							{#if isClockedIn}
								<button
									onclick={handleClockOut}
									class="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl active:scale-95 sm:h-32 sm:w-32"
								>
									<Square class="h-7 w-7" />
									<span class="mt-1.5 text-sm font-bold">Clock Out</span>
								</button>
							{:else}
								<button
									onclick={handleClockIn}
									disabled={gpsStatus === 'locating'}
									class="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:opacity-90 hover:shadow-xl active:scale-95 disabled:opacity-50 sm:h-32 sm:w-32"
								>
									{#if gpsStatus === 'locating'}
										<Wifi class="h-7 w-7 animate-pulse" />
										<span class="mt-1.5 text-xs font-medium">Locating...</span>
									{:else}
										<Play class="h-7 w-7" />
										<span class="mt-1.5 text-sm font-bold">Clock In</span>
									{/if}
								</button>
							{/if}
						</div>
					</div>
				</CardContent>
			</div>
		</Card>

		<!-- Stats Row -->
		{#if roleStore.role !== 'staff'}
		<div class="mb-8 grid grid-cols-3 gap-4">
			<Card>
				<CardContent class="p-4 sm:p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
							<Timer class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Active</p>
							<p class="text-stat font-mono">2</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-4 sm:p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
							<CheckCircle2 class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Completed</p>
							<p class="text-stat font-mono">5</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-4 sm:p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
							<XCircle class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Missed</p>
							<p class="text-stat font-mono">1</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
		{/if}

		<!-- Recent Shifts Table -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<CardTitle class="text-section-title">{roleStore.role === 'staff' ? 'My Recent Shifts' : 'Recent Shifts'}</CardTitle>
				<Clock class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b">
								{#if roleStore.role !== 'staff'}
									<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee</th>
								{/if}
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
								<th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Clock In</th>
								<th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Clock Out</th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each roleStore.role === 'staff' ? recentShifts.filter(s => s.employee === 'Maria R.') : recentShifts as shift}
								<tr class="border-b last:border-0 hover:bg-muted/50">
									{#if roleStore.role !== 'staff'}
										<td class="px-4 py-3">
											<div class="flex items-center gap-2.5">
												<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
													{shift.initials}
												</div>
												<span class="font-medium">{shift.employee}</span>
											</div>
										</td>
									{/if}
									<td class="px-4 py-3 text-muted-foreground">
										<div class="flex items-center gap-1.5">
											<MapPin class="h-3.5 w-3.5" />
											{shift.location}
										</div>
									</td>
									<td class="hidden px-4 py-3 font-mono text-xs sm:table-cell">{shift.clockIn}</td>
									<td class="hidden px-4 py-3 font-mono text-xs sm:table-cell">{shift.clockOut}</td>
									<td class="px-4 py-3 font-mono text-xs font-semibold">{shift.duration}</td>
									<td class="px-4 py-3">
										<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {statusBadge[shift.status]}">
											{shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
