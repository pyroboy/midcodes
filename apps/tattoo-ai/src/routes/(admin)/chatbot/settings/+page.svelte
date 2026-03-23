<script lang="ts">
	import { Settings, Clock, Sparkles, CalendarDays, Bell, Save } from 'lucide-svelte';

	type Tab = 'general' | 'hours' | 'personality' | 'booking' | 'notifications';

	let activeTab = $state<Tab>('general');

	const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
		{ id: 'general', label: 'General', icon: Settings },
		{ id: 'hours', label: 'Hours', icon: Clock },
		{ id: 'personality', label: 'Personality', icon: Sparkles },
		{ id: 'booking', label: 'Booking', icon: CalendarDays },
		{ id: 'notifications', label: 'Notifications', icon: Bell }
	];

	// General
	let botName = $state('Ink Bot');
	let studioName = $state('Studio X Tattoo');
	let greetingMessage = $state("Hey there! Welcome to Studio X. I'm your booking assistant. How can I help you today?");
	let fallbackMessage = $state("I'm not sure how to help with that. Let me connect you with one of our artists!");

	// Hours
	interface DaySchedule {
		day: string;
		open: boolean;
		openTime: string;
		closeTime: string;
	}

	let schedule = $state<DaySchedule[]>([
		{ day: 'Monday', open: false, openTime: '11:00', closeTime: '21:00' },
		{ day: 'Tuesday', open: true, openTime: '11:00', closeTime: '21:00' },
		{ day: 'Wednesday', open: true, openTime: '11:00', closeTime: '21:00' },
		{ day: 'Thursday', open: true, openTime: '11:00', closeTime: '21:00' },
		{ day: 'Friday', open: true, openTime: '11:00', closeTime: '21:00' },
		{ day: 'Saturday', open: true, openTime: '10:00', closeTime: '22:00' },
		{ day: 'Sunday', open: true, openTime: '10:00', closeTime: '20:00' }
	]);
	let outsideHoursMessage = $state("We're currently closed. Our hours are Tuesday-Sunday, 11AM-9PM. Leave a message and we'll get back to you when we open!");

	// Personality
	let personalityPreset = $state<'professional' | 'friendly' | 'edgy'>('friendly');
	let customInstructions = $state('Be warm and approachable. Use casual language but remain helpful. Mention specific tattoo styles when relevant.');
	let useEmojis = $state(false);

	// Booking
	let minimumDeposit = $state(2000);
	let leadTimeDays = $state(3);
	let cancellationPolicy = $state("48+ hours notice: Full refund\n24-48 hours: 50% retained\nLess than 24 hours or no-show: Deposit forfeited");
	let autoConfirm = $state(false);

	// Notifications
	let emailNotifications = $state(true);
	let emailAddress = $state('studio@example.com');
	let smsReminders = $state(true);

	const personalityOptions = [
		{ id: 'professional' as const, label: 'Professional', desc: 'Formal tone, detailed responses, business-like' },
		{ id: 'friendly' as const, label: 'Friendly', desc: 'Warm, casual, conversational' },
		{ id: 'edgy' as const, label: 'Edgy', desc: 'Bold, direct, tattoo culture vibes' }
	];
</script>

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<h1 class="text-3xl lg:text-4xl font-display font-bold text-foreground uppercase tracking-wider">Bot Settings</h1>
			<p class="text-muted-foreground mt-1">Configure your chatbot behavior and preferences</p>
		</div>
		<button class="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20">
			<Save class="w-4 h-4" />
			Save Changes
		</button>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 mb-8 overflow-x-auto pb-1 -mx-2 px-2">
		{#each tabs as tab (tab.id)}
			<button
				onclick={() => (activeTab = tab.id)}
				class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition {activeTab === tab.id
					? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
					: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
			>
				<tab.icon class="w-4 h-4" />
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="max-w-2xl">
		<!-- General Tab -->
		{#if activeTab === 'general'}
			<div class="space-y-6">
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Bot Name</label>
					<input
						type="text"
						bind:value={botName}
						class="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono"
					/>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Studio Name</label>
					<input
						type="text"
						bind:value={studioName}
						class="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono"
					/>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Greeting Message</label>
					<textarea
						bind:value={greetingMessage}
						rows={3}
						class="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono resize-none"
					></textarea>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Fallback Message</label>
					<textarea
						bind:value={fallbackMessage}
						rows={3}
						class="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono resize-none"
					></textarea>
				</div>
			</div>
		{/if}

		<!-- Hours Tab -->
		{#if activeTab === 'hours'}
			<div class="space-y-6">
				<div class="space-y-2">
					{#each schedule as day, i (day.day)}
						<div class="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
							<label class="flex items-center gap-2 cursor-pointer w-28 shrink-0">
								<input
									type="checkbox"
									bind:checked={schedule[i].open}
									class="w-4 h-4 rounded border-border bg-muted accent-primary"
								/>
								<span class="text-sm font-medium {day.open ? 'text-foreground' : 'text-muted-foreground'}">{day.day}</span>
							</label>
							{#if day.open}
								<div class="flex items-center gap-2 flex-1">
									<input
										type="time"
										bind:value={schedule[i].openTime}
										class="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
									/>
									<span class="text-xs text-muted-foreground">to</span>
									<input
										type="time"
										bind:value={schedule[i].closeTime}
										class="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
									/>
								</div>
							{:else}
								<span class="text-xs text-muted-foreground font-mono">Closed</span>
							{/if}
						</div>
					{/each}
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Outside Hours Message</label>
					<textarea
						bind:value={outsideHoursMessage}
						rows={3}
						class="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono resize-none"
					></textarea>
				</div>
			</div>
		{/if}

		<!-- Personality Tab -->
		{#if activeTab === 'personality'}
			<div class="space-y-6">
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personality Preset</label>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{#each personalityOptions as option (option.id)}
							<button
								onclick={() => (personalityPreset = option.id)}
								class="text-left p-4 bg-card border rounded-xl transition {personalityPreset === option.id
									? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10'
									: 'border-border hover:border-primary/30'}"
							>
								<p class="text-sm font-medium text-foreground mb-1">{option.label}</p>
								<p class="text-[10px] text-muted-foreground">{option.desc}</p>
							</button>
						{/each}
					</div>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Custom Instructions</label>
					<textarea
						bind:value={customInstructions}
						rows={4}
						class="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono resize-none"
					></textarea>
				</div>
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={useEmojis}
						class="w-4 h-4 rounded border-border bg-muted accent-primary"
					/>
					<div>
						<span class="text-sm font-medium text-foreground">Use emojis in responses</span>
						<p class="text-[10px] text-muted-foreground">Allow the bot to include emojis in messages</p>
					</div>
				</label>
			</div>
		{/if}

		<!-- Booking Tab -->
		{#if activeTab === 'booking'}
			<div class="space-y-6">
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Minimum Deposit (PHP)</label>
					<div class="relative">
						<span class="absolute left-4 top-2.5 text-sm text-muted-foreground font-mono">P</span>
						<input
							type="number"
							bind:value={minimumDeposit}
							min={0}
							class="w-full pl-8 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono"
						/>
					</div>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Lead Time (days)</label>
					<input
						type="number"
						bind:value={leadTimeDays}
						min={0}
						max={30}
						class="w-48 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono"
					/>
					<p class="text-[10px] text-muted-foreground mt-1">Minimum days in advance for booking</p>
				</div>
				<div>
					<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cancellation Policy</label>
					<textarea
						bind:value={cancellationPolicy}
						rows={4}
						class="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono resize-none"
					></textarea>
				</div>
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={autoConfirm}
						class="w-4 h-4 rounded border-border bg-muted accent-primary"
					/>
					<div>
						<span class="text-sm font-medium text-foreground">Auto-confirm bookings</span>
						<p class="text-[10px] text-muted-foreground">Automatically confirm slots without manual review</p>
					</div>
				</label>
			</div>
		{/if}

		<!-- Notifications Tab -->
		{#if activeTab === 'notifications'}
			<div class="space-y-6">
				<div class="bg-card border border-border rounded-xl p-5">
					<label class="flex items-center gap-3 cursor-pointer mb-4">
						<input
							type="checkbox"
							bind:checked={emailNotifications}
							class="w-4 h-4 rounded border-border bg-muted accent-primary"
						/>
						<div>
							<span class="text-sm font-medium text-foreground">Email Notifications</span>
							<p class="text-[10px] text-muted-foreground">Receive email alerts for new bookings and inquiries</p>
						</div>
					</label>
					{#if emailNotifications}
						<div class="ml-7">
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label>
							<input
								type="email"
								bind:value={emailAddress}
								class="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
							/>
						</div>
					{/if}
				</div>
				<div class="bg-card border border-border rounded-xl p-5">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={smsReminders}
							class="w-4 h-4 rounded border-border bg-muted accent-primary"
						/>
						<div>
							<span class="text-sm font-medium text-foreground">SMS Reminders</span>
							<p class="text-[10px] text-muted-foreground">Send SMS reminders to clients 24 hours before their appointment</p>
						</div>
					</label>
				</div>
			</div>
		{/if}
	</div>
</div>
