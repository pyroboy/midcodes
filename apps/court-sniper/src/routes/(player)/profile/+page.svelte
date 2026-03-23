<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { User, Mail, Phone, MapPin, Trophy, Heart, Star, Edit3, Save, X, LogOut, Building2 } from 'lucide-svelte';

	let isEditing = $state(false);
	let success = $state(false);

	// Pre-filled mock data
	let name = $state(authStore.user?.name ?? 'Juan Dela Cruz');
	let email = $state(authStore.user?.email ?? 'juan@courtsniper.ph');
	let phone = $state(authStore.user?.phone ?? '+63 917 123 4567');
	let skillLevel = $state<string>(authStore.user?.skillLevel ?? 'intermediate');
	let playStyle = $state<'competitive' | 'recreational'>('recreational');
	let homeArea = $state('Bohol');
	let preferredVenues = $state<string[]>(['Bohol Pickle Hub', 'Tagbilaran Sports Center']);

	const skillLevels = [
		{ value: 'beginner', label: 'Beginner', desc: 'Learning rules, basic strokes' },
		{ value: 'intermediate', label: 'Intermediate', desc: 'Consistent play, understands positioning' },
		{ value: 'advanced', label: 'Advanced', desc: 'Competitive, tournament-level' }
	];

	const areas = ['Bohol', 'Cebu', 'Davao'];

	const allVenues = [
		'Bohol Pickle Hub', 'Tagbilaran Sports Center', 'Panglao Beach Courts',
		'Cebu Pickle Arena', 'IT Park Sports Club', 'Mandaue Paddle Center',
		'Davao Pickle Station', 'Abreeza Sports Hub', 'Samal Island Courts'
	];

	let areaVenues = $derived(
		allVenues.filter(v => {
			if (homeArea === 'Bohol') return v.includes('Bohol') || v.includes('Tagbilaran') || v.includes('Panglao');
			if (homeArea === 'Cebu') return v.includes('Cebu') || v.includes('IT Park') || v.includes('Mandaue');
			return v.includes('Davao') || v.includes('Abreeza') || v.includes('Samal');
		})
	);

	function toggleVenue(venue: string) {
		if (preferredVenues.includes(venue)) {
			preferredVenues = preferredVenues.filter(v => v !== venue);
		} else {
			preferredVenues = [...preferredVenues, venue];
		}
	}

	function handleSave() {
		// Mock save
		if (authStore.user) {
			authStore.setUser({
				...authStore.user,
				name,
				phone,
				skillLevel: skillLevel as 'beginner' | 'intermediate' | 'advanced'
			});
		}
		isEditing = false;
		success = true;
		setTimeout(() => { success = false; }, 3000);
	}

	function handleCancel() {
		isEditing = false;
		// Reset to current values
		name = authStore.user?.name ?? 'Juan Dela Cruz';
		phone = authStore.user?.phone ?? '+63 917 123 4567';
	}

	async function handleLogout() {
		authStore.setUser(null);
		await goto('/login');
	}

	function skillColor(level: string): string {
		if (level === 'beginner') return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
		if (level === 'intermediate') return 'bg-amber-500/10 text-amber-700 border-amber-200';
		return 'bg-red-500/10 text-red-700 border-red-200';
	}
</script>

<svelte:head>
	<title>Profile - Court Sniper</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 max-w-2xl">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Profile</h1>
			<p class="mt-1 text-sm text-muted-foreground">Your pickleball identity.</p>
		</div>
		{#if !isEditing}
			<button
				onclick={() => { isEditing = true; }}
				class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
			>
				<Edit3 class="h-4 w-4" />
				Edit Profile
			</button>
		{/if}
	</div>

	{#if success}
		<div class="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Profile updated successfully.</div>
	{/if}

	{#if !isEditing}
		<!-- PROFILE CARD VIEW -->
		<div class="rounded-2xl border border-border bg-background overflow-hidden">
			<!-- Profile header -->
			<div class="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
				<div class="flex items-center gap-4">
					<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
						{name.charAt(0).toUpperCase()}
					</div>
					<div>
						<h2 class="text-xl font-bold">{name}</h2>
						<p class="text-sm text-muted-foreground">{email}</p>
						<div class="mt-1.5 flex items-center gap-2">
							<span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold {skillColor(skillLevel)}">
								{skillLevels.find(s => s.value === skillLevel)?.label ?? skillLevel}
							</span>
							<span class="inline-flex items-center rounded-md bg-violet-500/10 border border-violet-200 px-2 py-0.5 text-xs font-bold text-violet-700 capitalize">
								{playStyle}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Profile details -->
			<div class="divide-y divide-border">
				<div class="flex items-center gap-3 px-6 py-4">
					<Phone class="h-4 w-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Phone</p>
						<p class="text-sm font-medium">{phone || 'Not set'}</p>
					</div>
				</div>
				<div class="flex items-center gap-3 px-6 py-4">
					<MapPin class="h-4 w-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Home Area</p>
						<p class="text-sm font-medium">{homeArea}</p>
					</div>
				</div>
				<div class="flex items-center gap-3 px-6 py-4">
					<Trophy class="h-4 w-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Skill Level</p>
						<p class="text-sm font-medium capitalize">{skillLevels.find(s => s.value === skillLevel)?.label} -- {skillLevels.find(s => s.value === skillLevel)?.desc}</p>
					</div>
				</div>
				<div class="flex items-center gap-3 px-6 py-4">
					<Heart class="h-4 w-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Play Style</p>
						<p class="text-sm font-medium capitalize">{playStyle}</p>
					</div>
				</div>
				<div class="flex items-start gap-3 px-6 py-4">
					<Star class="mt-0.5 h-4 w-4 text-muted-foreground" />
					<div>
						<p class="text-xs text-muted-foreground">Preferred Venues</p>
						{#if preferredVenues.length > 0}
							<div class="mt-1 flex flex-wrap gap-1.5">
								{#each preferredVenues as venue}
									<span class="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{venue}</span>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">None selected</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="mt-4 grid grid-cols-3 gap-3">
			<div class="rounded-xl border border-border bg-background p-4 text-center">
				<p class="text-2xl font-bold">12</p>
				<p class="text-xs text-muted-foreground">Sessions</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-4 text-center">
				<p class="text-2xl font-bold">3</p>
				<p class="text-xs text-muted-foreground">Venues</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-4 text-center">
				<p class="text-2xl font-bold">8</p>
				<p class="text-xs text-muted-foreground">Barkada Games</p>
			</div>
		</div>

		<!-- Actions -->
		<div class="mt-6 space-y-2">
			<a
				href="/venue/dashboard"
				class="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
			>
				<span class="flex items-center gap-2">
					<Building2 class="h-4 w-4 text-muted-foreground" />
					Venue Dashboard
				</span>
				<span class="text-xs text-muted-foreground">List or manage your venue</span>
			</a>
			<button
				onclick={handleLogout}
				class="flex w-full items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
			>
				<LogOut class="h-4 w-4" />
				Sign out
			</button>
		</div>

	{:else}
		<!-- EDIT MODE -->
		<div class="space-y-5">
			<div class="rounded-xl border border-border bg-background p-6 space-y-5">
				<h2 class="text-sm font-semibold">Personal Information</h2>

				<div>
					<label for="name" class="block text-sm font-medium mb-1.5">Full Name</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						required
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium mb-1.5">Email</label>
					<input
						id="email"
						type="email"
						value={email}
						disabled
						class="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm text-muted-foreground"
					/>
					<p class="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
				</div>

				<div>
					<label for="phone" class="block text-sm font-medium mb-1.5">Phone Number</label>
					<input
						id="phone"
						type="tel"
						bind:value={phone}
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						placeholder="+63..."
					/>
				</div>
			</div>

			<div class="rounded-xl border border-border bg-background p-6 space-y-5">
				<h2 class="text-sm font-semibold">Pickleball Info</h2>

				<div>
					<label class="block text-sm font-medium mb-2">Skill Level</label>
					<div class="space-y-2">
						{#each skillLevels as level}
							<button
								type="button"
								onclick={() => { skillLevel = level.value; }}
								class="flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all {skillLevel === level.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}"
							>
								<div class="flex h-8 w-8 items-center justify-center rounded-lg {skillLevel === level.value ? 'bg-primary/20' : 'bg-muted'}">
									<Trophy class="h-4 w-4 {skillLevel === level.value ? 'text-primary' : 'text-muted-foreground'}" />
								</div>
								<div>
									<p class="text-sm font-bold">{level.label}</p>
									<p class="text-xs text-muted-foreground">{level.desc}</p>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium mb-2">Play Style</label>
					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							onclick={() => { playStyle = 'competitive'; }}
							class="rounded-xl border-2 p-3 text-center text-sm font-bold transition-all {playStyle === 'competitive' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}"
						>
							Competitive
						</button>
						<button
							type="button"
							onclick={() => { playStyle = 'recreational'; }}
							class="rounded-xl border-2 p-3 text-center text-sm font-bold transition-all {playStyle === 'recreational' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}"
						>
							Recreational
						</button>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-border bg-background p-6 space-y-5">
				<h2 class="text-sm font-semibold">Location & Venues</h2>

				<div>
					<label for="homeArea" class="block text-sm font-medium mb-1.5">Home Area</label>
					<select
						id="homeArea"
						bind:value={homeArea}
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					>
						{#each areas as area}
							<option value={area}>{area}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium mb-2">Preferred Venues</label>
					<div class="flex flex-wrap gap-2">
						{#each areaVenues as venue}
							<button
								type="button"
								onclick={() => toggleVenue(venue)}
								class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors {preferredVenues.includes(venue) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted text-muted-foreground'}"
							>
								{venue}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex gap-3">
				<button
					onclick={handleSave}
					class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98]"
				>
					<Save class="h-4 w-4" />
					Save Profile
				</button>
				<button
					onclick={handleCancel}
					class="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
				>
					<X class="h-4 w-4" />
					Cancel
				</button>
			</div>
		</div>
	{/if}
</div>
