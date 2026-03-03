<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';

	type Role = 'staff' | 'manager' | 'kitchen';

	const roles: { id: Role; icon: string; label: string; desc: string }[] = [
		{ id: 'staff',   icon: '👤', label: 'Staff',         desc: 'Servers & Cashiers' },
		{ id: 'manager', icon: '👑', label: 'Manager',       desc: 'Admin Access' },
		{ id: 'kitchen', icon: '🍳', label: 'Kitchen Staff', desc: 'BOH Team' }
	];

	let name = $state('');
	let selectedRole = $state<Role | null>(null);
	let showPin = $state(false);

	// PIN modal state
	let pin = $state('');
	const MANAGER_PIN = '1234';

	function selectRole(role: Role) {
		selectedRole = role;
		if (role === 'manager') showPin = true;
	}

	function startShift() {
		if (!name.trim() || !selectedRole) return;
		if (selectedRole === 'manager') {
			showPin = true;
		} else {
			navigate();
		}
	}

	function navigate() {
		if (selectedRole === 'kitchen') goto('/kds');
		else goto('/floor');
	}

	function handlePinKey(key: string) {
		if (pin.length < 4) pin += key;
	}

	function handleBackspace() {
		pin = pin.slice(0, -1);
	}

	function verifyPin() {
		if (pin === MANAGER_PIN) {
			showPin = false;
			navigate();
		} else {
			pin = '';
		}
	}

	const canStart = $derived(name.trim().length > 0 && selectedRole !== null);
</script>

<div class="flex min-h-screen items-center justify-center bg-surface-secondary p-4">
	<div class="pos-card w-full max-w-[500px] gap-8 flex flex-col p-12">
		<!-- Header -->
		<div class="flex flex-col items-center gap-2 text-center">
			<span class="text-5xl leading-none">🔥</span>
			<h1 class="text-3xl font-extrabold tracking-tight text-gray-900">WTF! SAMGYUP</h1>
			<p class="text-sm font-medium tracking-[3px] text-gray-500 uppercase">Restaurant POS</p>
			<div class="mt-1 h-[3px] w-14 rounded-full bg-accent"></div>
		</div>

		<!-- Form -->
		<div class="flex flex-col gap-5">
			<!-- Name input -->
			<div class="flex flex-col gap-1.5">
				<label for="name" class="text-xs font-semibold tracking-wide text-gray-700 uppercase">
					Your Name
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					placeholder="Enter your name..."
					class="pos-input text-base"
				/>
			</div>

			<!-- Role selection -->
			<div class="flex flex-col gap-2">
				<p class="text-xs font-semibold tracking-wide text-gray-700 uppercase">Role</p>
				<div class="flex flex-col gap-2.5">
					{#each roles as role}
						<button
							onclick={() => selectRole(role.id)}
							class={cn(
								'flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all active:scale-[0.98]',
								selectedRole === role.id
									? 'border-accent bg-accent-light'
									: 'border-border bg-surface hover:border-gray-300'
							)}
						>
							<span class="text-2xl leading-none">{role.icon}</span>
							<div>
								<div class={cn('font-semibold', selectedRole === role.id ? 'text-accent' : 'text-gray-900')}>
									{role.label}
								</div>
								<div class="text-sm text-gray-500">{role.desc}</div>
							</div>
							{#if selectedRole === role.id}
								<span class="ml-auto text-accent">✓</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-col gap-3">
			<button onclick={startShift} disabled={!canStart} class="btn-primary w-full disabled:opacity-40">
				START SHIFT
			</button>
			<button
				onclick={() => canStart && navigate()}
				disabled={!canStart}
				class="btn-secondary w-full disabled:opacity-40"
			>
				CONTINUE →
			</button>
		</div>

		<p class="text-center text-xs text-gray-400">hint: manager pin is 1234</p>
	</div>
</div>

<!-- PIN Modal -->
{#if showPin}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<div class="pos-card w-[380px] flex flex-col items-center gap-6 py-10 px-10">
			<!-- Header -->
			<div class="flex flex-col items-center gap-1">
				<h2 class="text-xl font-bold text-gray-900">Manager PIN</h2>
				<p class="text-sm text-gray-500">Manager PIN Required</p>
			</div>

			<!-- Dots -->
			<div class="flex gap-4">
				{#each Array(4) as _, i}
					<span
						class={cn(
							'h-3.5 w-3.5 rounded-full transition-all',
							i < pin.length ? 'bg-accent scale-110' : 'bg-gray-200'
						)}
					></span>
				{/each}
			</div>

			<!-- Numpad -->
			<div class="grid grid-cols-3 gap-2.5">
				{#each ['1','2','3','4','5','6','7','8','9'] as key}
					<button
						onclick={() => handlePinKey(key)}
						class="flex h-14 w-16 items-center justify-center rounded-xl bg-surface-secondary text-xl font-semibold text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
					>
						{key}
					</button>
				{/each}
				<!-- Empty, 0, Backspace -->
				<span></span>
				<button
					onclick={() => handlePinKey('0')}
					class="flex h-14 w-16 items-center justify-center rounded-xl bg-surface-secondary text-xl font-semibold text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
				>
					0
				</button>
				<button
					onclick={handleBackspace}
					class="flex h-14 w-16 items-center justify-center rounded-xl bg-surface-secondary text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
				>
					⌫
				</button>
			</div>

			<button onclick={verifyPin} disabled={pin.length < 4} class="btn-primary w-[220px] disabled:opacity-40">
				VERIFY PIN
			</button>

			<div class="flex flex-col items-center gap-0.5">
				<button onclick={() => { showPin = false; pin = ''; }} class="text-sm font-medium text-accent hover:text-accent-dark" style="min-height: unset">
					← Back
				</button>
				<span class="text-xs text-gray-400">or Cancel</span>
			</div>
		</div>
	</div>
{/if}
