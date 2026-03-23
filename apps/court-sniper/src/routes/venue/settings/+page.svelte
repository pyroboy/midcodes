<script lang="ts">
	import { Save, Building2 } from 'lucide-svelte';

	let venueName = $state('Bohol Pickle Hub');
	let address = $state('Island City Mall, Tagbilaran City, Bohol 6300');
	let phone = $state('+63 38 501 1234');
	let description = $state('Premier indoor pickleball facility in Bohol with 4 courts, professional lighting, and a welcoming community for all skill levels.');
	let cancellationPolicy = $state('24hr');
	let gcashNumber = $state('0917 123 4567');
	let bankName = $state('BDO');
	let bankAccount = $state('001234567890');

	let success = $state(false);

	// Operating hours
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	let operatingHours = $state(
		days.map(day => ({
			day,
			open: day === 'Wednesday' ? '' : '6:00 AM',
			close: day === 'Wednesday' ? '' : '9:00 PM',
			closed: day === 'Wednesday'
		}))
	);

	function toggleClosed(index: number) {
		operatingHours[index].closed = !operatingHours[index].closed;
		if (operatingHours[index].closed) {
			operatingHours[index].open = '';
			operatingHours[index].close = '';
		} else {
			operatingHours[index].open = '6:00 AM';
			operatingHours[index].close = '9:00 PM';
		}
	}

	function handleSave() {
		success = true;
		setTimeout(() => { success = false; }, 3000);
	}
</script>

<svelte:head>
	<title>Settings - Bohol Pickle Hub</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 max-w-3xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold tracking-tight">Settings</h1>
		<p class="mt-1 text-sm text-muted-foreground">Manage your venue information and preferences.</p>
	</div>

	{#if success}
		<div class="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Settings saved successfully.</div>
	{/if}

	<div class="space-y-6">
		<!-- Venue Info -->
		<div class="rounded-xl border border-border bg-background p-5 sm:p-6 space-y-5">
			<div class="flex items-center gap-2">
				<Building2 class="h-4 w-4 text-muted-foreground" />
				<h2 class="text-sm font-bold">Venue Information</h2>
			</div>

			<div>
				<label for="venueName" class="block text-sm font-medium mb-1.5">Venue Name</label>
				<input
					id="venueName"
					type="text"
					bind:value={venueName}
					class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div>
				<label for="address" class="block text-sm font-medium mb-1.5">Address</label>
				<input
					id="address"
					type="text"
					bind:value={address}
					class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div>
				<label for="phone" class="block text-sm font-medium mb-1.5">Phone</label>
				<input
					id="phone"
					type="tel"
					bind:value={phone}
					class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div>
				<label for="description" class="block text-sm font-medium mb-1.5">Description</label>
				<textarea
					id="description"
					bind:value={description}
					rows="3"
					class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
				></textarea>
			</div>
		</div>

		<!-- Operating Hours -->
		<div class="rounded-xl border border-border bg-background p-5 sm:p-6 space-y-4">
			<h2 class="text-sm font-bold">Operating Hours</h2>

			<div class="space-y-2">
				{#each operatingHours as hours, i}
					<div class="flex items-center gap-3 py-1">
						<span class="w-24 text-sm font-medium">{hours.day.slice(0, 3)}</span>
						{#if hours.closed}
							<span class="flex-1 text-sm text-muted-foreground">Closed</span>
						{:else}
							<input
								type="text"
								bind:value={hours.open}
								class="w-24 rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-ring"
							/>
							<span class="text-xs text-muted-foreground">to</span>
							<input
								type="text"
								bind:value={hours.close}
								class="w-24 rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						{/if}
						<button
							onclick={() => toggleClosed(i)}
							class="rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors {hours.closed ? 'border-red-200 bg-red-50 text-red-600' : 'border-border text-muted-foreground hover:bg-muted'}"
						>
							{hours.closed ? 'Closed' : 'Open'}
						</button>
					</div>
				{/each}
			</div>
		</div>

		<!-- Cancellation Policy -->
		<div class="rounded-xl border border-border bg-background p-5 sm:p-6 space-y-4">
			<h2 class="text-sm font-bold">Cancellation Policy</h2>
			<select
				bind:value={cancellationPolicy}
				class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			>
				<option value="24hr">Full refund if cancelled 24+ hours before</option>
				<option value="12hr">Full refund if cancelled 12+ hours before</option>
				<option value="none">No refunds</option>
				<option value="custom">Custom policy</option>
			</select>
		</div>

		<!-- Payment -->
		<div class="rounded-xl border border-border bg-background p-5 sm:p-6 space-y-5">
			<h2 class="text-sm font-bold">Payment Details</h2>

			<div class="rounded-lg bg-primary/5 border border-primary/20 p-3">
				<p class="text-xs font-bold text-primary">Commission Rate: 10%</p>
				<p class="text-xs text-muted-foreground mt-0.5">Court Sniper takes a 10% commission on all bookings processed through the platform.</p>
			</div>

			<div>
				<label for="gcash" class="block text-sm font-medium mb-1.5">GCash Number</label>
				<input
					id="gcash"
					type="text"
					bind:value={gcashNumber}
					class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="bankName" class="block text-sm font-medium mb-1.5">Bank Name</label>
					<input
						id="bankName"
						type="text"
						bind:value={bankName}
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div>
					<label for="bankAccount" class="block text-sm font-medium mb-1.5">Account Number</label>
					<input
						id="bankAccount"
						type="text"
						bind:value={bankAccount}
						class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
			</div>
		</div>

		<!-- Save button -->
		<button
			onclick={handleSave}
			class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98]"
		>
			<Save class="h-4 w-4" />
			Save Settings
		</button>
	</div>
</div>
