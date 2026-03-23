<script lang="ts">
	import { ChevronLeft, ChevronRight, Clock } from 'lucide-svelte';

	let currentMonth = $state(new Date());

	let monthName = $derived(currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));
	let daysInMonth = $derived(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate());
	let firstDay = $derived(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay());
	let days = $derived(Array.from({ length: daysInMonth }, (_, i) => i + 1));
	let empty = $derived(Array.from({ length: firstDay }, (_, i) => i));

	const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Demo sessions
	const sessions = [
		{ id: '1', summary: 'Dragon Sleeve - Marco', day: 15, time: '10:00 AM' },
		{ id: '2', summary: 'Wolf Forearm - Jessa', day: 18, time: '2:00 PM' },
		{ id: '3', summary: 'Mandala - Carlo', day: 22, time: '11:00 AM' }
	];

	function getSessionsForDay(day: number) {
		return sessions.filter((s) => s.day === day);
	}

	function previousMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
	}

	let today = $derived(new Date().getDate());
	let isCurrentMonth = $derived(
		currentMonth.getMonth() === new Date().getMonth() &&
		currentMonth.getFullYear() === new Date().getFullYear()
	);
</script>

<div class="p-6 lg:p-8">
	<div class="mb-8">
		<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Calendar</h1>
		<p class="text-muted-foreground mt-1">Scheduled tattoo sessions</p>
	</div>

	<div class="bg-card border border-border rounded-xl p-4 lg:p-6">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-display font-semibold text-foreground uppercase tracking-wide">{monthName}</h2>
			<div class="flex gap-1">
				<button
					onclick={previousMonth}
					class="p-2 hover:bg-muted rounded-lg transition"
				>
					<ChevronLeft class="w-5 h-5 text-foreground" />
				</button>
				<button
					onclick={nextMonth}
					class="p-2 hover:bg-muted rounded-lg transition"
				>
					<ChevronRight class="w-5 h-5 text-foreground" />
				</button>
			</div>
		</div>

		<!-- Weekday Headers -->
		<div class="grid grid-cols-7 gap-1 lg:gap-2 mb-2">
			{#each weekDays as day (day)}
				<div class="text-center font-mono text-muted-foreground text-xs py-2 uppercase">
					{day}
				</div>
			{/each}
		</div>

		<!-- Days Grid -->
		<div class="grid grid-cols-7 gap-1 lg:gap-2">
			{#each empty as _, i (i)}
				<div class="aspect-square"></div>
			{/each}

			{#each days as day (day)}
				{@const daySessions = getSessionsForDay(day)}
				{@const isToday = isCurrentMonth && day === today}
				<div
					class="aspect-square p-1 lg:p-2 border rounded-lg transition relative
						{isToday ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/60'}"
				>
					<p class="text-xs lg:text-sm font-mono {isToday ? 'text-primary font-bold' : 'text-foreground'}">{day}</p>
					{#each daySessions as session (session.id)}
						<div class="hidden lg:block mt-1 text-[10px] bg-primary/20 text-primary px-1 py-0.5 rounded truncate font-mono">
							{session.summary.split(' - ')[0]}
						</div>
					{/each}
					{#if daySessions.length > 0}
						<div class="lg:hidden absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-primary"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Upcoming Sessions -->
	<div class="mt-8">
		<h3 class="text-lg font-display font-semibold text-foreground mb-4 uppercase tracking-wide">Upcoming Sessions</h3>
		<div class="space-y-3">
			{#each sessions as session (session.id)}
				<div class="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition">
					<div class="bg-primary/10 p-3 rounded-lg">
						<Clock class="w-5 h-5 text-primary" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-foreground text-sm">{session.summary}</p>
						<p class="text-xs text-muted-foreground font-mono mt-1">
							{monthName} {session.day} at {session.time}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
