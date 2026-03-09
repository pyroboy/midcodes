<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { setSession, MANAGER_PIN } from '$lib/stores/session.svelte';
	import type { Role, KitchenFocus } from '$lib/stores/session.svelte';
	import { writeLog } from '$lib/stores/audit.svelte';

	// ─── Accounts ─────────────────────────────────────────────────────────────
	import type { LocationId } from '$lib/stores/session.svelte';
	import { LOCATIONS } from '$lib/stores/session.svelte';

	type Account = { password: string; role: Role; displayName: string; dest: string; requiresPin?: boolean; locationId: LocationId; kitchenFocus?: KitchenFocus };

	const ACCOUNTS: Record<string, Account> = {
		// ── Alta Citta · Tagbilaran ─────────────────────────────────────────
		'maria':   { password: 'maria',   role: 'staff',   displayName: 'Maria Santos',       dest: '/pos',                     locationId: 'tag'    },
		'juan':    { password: 'juan',    role: 'manager', displayName: 'Juan Reyes',          dest: '/pos',    requiresPin: true, locationId: 'tag'    },
		'pedro':   { password: 'pedro',   role: 'kitchen', displayName: 'Pedro Cruz',          dest: '/kitchen',                  locationId: 'tag'    },
		'lito':    { password: 'lito',    role: 'kitchen', displayName: 'Lito Paglinawan',     dest: '/kitchen/orders',           locationId: 'tag',   kitchenFocus: 'grill'   },
		'benny':   { password: 'benny',   role: 'kitchen', displayName: 'Benny Flores',        dest: '/kitchen/weigh-station',    locationId: 'tag',   kitchenFocus: 'butcher' },
		'corazon': { password: 'corazon', role: 'kitchen', displayName: 'Corazon Dela Cruz',   dest: '/kitchen/orders',           locationId: 'tag',   kitchenFocus: 'sides'   },
		// ── Alona Beach · Panglao ───────────────────────────────────────────
		'ana':     { password: 'ana',     role: 'staff',   displayName: 'Ana Lim',             dest: '/pos',                     locationId: 'pgl'   },
		'carlo':   { password: 'carlo',   role: 'manager', displayName: 'Carlo Ramos',         dest: '/pos',    requiresPin: true, locationId: 'pgl'   },
		'jose':    { password: 'jose',    role: 'kitchen', displayName: 'Jose Santos',         dest: '/kitchen',                  locationId: 'pgl'   },
		'romy':    { password: 'romy',    role: 'kitchen', displayName: 'Romy Dalisay',        dest: '/kitchen/orders',           locationId: 'pgl',   kitchenFocus: 'grill'   },
		'dante':   { password: 'dante',   role: 'kitchen', displayName: 'Dante Villanueva',    dest: '/kitchen/weigh-station',    locationId: 'pgl',   kitchenFocus: 'butcher' },
		'nena':    { password: 'nena',    role: 'kitchen', displayName: 'Nena Ocampo',         dest: '/kitchen/orders',           locationId: 'pgl',   kitchenFocus: 'sides'   },
		// ── Tagbilaran Warehouse ─────────────────────────────────────────────
		'noel':    { password: 'noel',    role: 'staff',   displayName: 'Noel Garcia',         dest: '/stock',                   locationId: 'wh-tag' },
		// ── Management (all-locations) ───────────────────────────────────────
		'chris':   { password: 'chris',   role: 'owner',   displayName: 'Christopher S',       dest: '/pos',                     locationId: 'all'   },
		// ── System Admin ─────────────────────────────────────────────────────────
		'sysadmin': { password: 'sysadmin', role: 'admin', displayName: 'System Admin', dest: '/admin/devices', locationId: 'all' },
	};

	const roleBadge: Record<Role, { label: string; cls: string }> = {
		staff:   { label: 'Staff',   cls: 'bg-blue-50 text-blue-700 border-blue-200'          },
		manager: { label: 'Manager', cls: 'bg-accent-light text-accent border-accent/30'       },
		kitchen: { label: 'Kitchen', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
		owner:   { label: 'Owner',   cls: 'bg-purple-50 text-purple-700 border-purple-200'    },
		admin:   { label: 'Admin',   cls: 'bg-gray-100 text-gray-700 border-gray-300'         },
	};

	const locationBadge: Record<LocationId, { label: string; cls: string }> = {
		'tag':    { label: 'Alta Citta',   cls: 'bg-sky-50 text-sky-700 border-sky-200'          },
		'pgl':    { label: 'Alona Beach',  cls: 'bg-teal-50 text-teal-700 border-teal-200'       },
		'wh-tag': { label: 'Warehouse',    cls: 'bg-amber-50 text-amber-700 border-amber-200'    },
		'all':    { label: 'All',          cls: 'bg-purple-50 text-purple-700 border-purple-200' },
	};

	const TEST_GROUPS: { heading: string; usernames: string[] }[] = [
		{ heading: '🏠 Alta Citta · POS / Management', usernames: ['maria', 'juan']                  },
		{ heading: '🔥 Alta Citta · Kitchen',          usernames: ['pedro', 'lito', 'benny', 'corazon'] },
		{ heading: '🏠 Alona Beach · POS / Management',usernames: ['ana', 'carlo']                   },
		{ heading: '🔥 Alona Beach · Kitchen',         usernames: ['jose', 'romy', 'dante', 'nena']  },
		{ heading: '🏭 Tagbilaran Warehouse',          usernames: ['noel']                           },
		{ heading: '💼 Management',                    usernames: ['chris']                          },
	];

	// ─── Form state ───────────────────────────────────────────────────────────
	let username  = $state('');
	let password  = $state('');
	let showPass  = $state(false);
	let error     = $state('');

	// ─── PIN modal ────────────────────────────────────────────────────────────
	let showPin     = $state(false);
	let pin         = $state('');
	let pinError    = $state(false);
	let pendingDest = $state('');

	// ─── Login logic ──────────────────────────────────────────────────────────
	function login() {
		error = '';
		const u = username.trim().toLowerCase();
		const account = ACCOUNTS[u];

		if (!account) { error = 'Username not found.'; return; }
		if (account.password !== password) { error = 'Incorrect password.'; return; }

		setSession(account.displayName, account.role, account.locationId, account.kitchenFocus ?? null);

		// Collapse sidebar on login
		document.cookie = 'sidebar:state=false; path=/; max-age=604800';

		if (account.requiresPin) {
			pendingDest = account.dest;
			pin = '';
			pinError = false;
			showPin = true;
		} else {
			writeLog('auth', `Login: ${account.displayName} (${account.role})`);
			goto(account.dest);
		}
	}

	function handlePinKey(key: string) {
		if (pin.length < 4) { pin += key; pinError = false; }
	}

	function verifyPin() {
		if (pin === MANAGER_PIN) {
			const acct = ACCOUNTS[username.trim().toLowerCase()];
			if (acct) {
				// Ensure session is set with correct role before navigating (P0-6)
				setSession(acct.displayName, acct.role, acct.locationId, acct.kitchenFocus ?? null);
				writeLog('auth', `Login: ${acct.displayName} (${acct.role}) — PIN verified`);
			}
			showPin = false;
			goto(pendingDest);
		} else { pin = ''; pinError = true; }
	}

	// Auto-fill from test card click
	function useAccount(u: string) {
		username = u;
		password = ACCOUNTS[u].password;
		error = '';
	}

	// One-click login (fill + submit)
	function quickLogin(u: string) {
		username = u;
		password = ACCOUNTS[u].password;
		error = '';
		login();
	}

	const canLogin = $derived(username.trim().length > 0 && password.length > 0);
</script>

<!-- Full page: login card + test credentials side panel -->
<div class="flex min-h-screen items-center justify-center gap-8 bg-surface-secondary p-6">

	<!-- ─── Login Card ───────────────────────────────────────────────────── -->
	<div class="pos-card w-full max-w-[440px] flex flex-col gap-7 p-10">
		<!-- Brand header -->
		<div class="flex flex-col items-center gap-2 text-center">
			<span class="text-5xl leading-none">🔥</span>
			<h1 class="text-3xl font-extrabold tracking-tight text-gray-900">WTF! SAMGYUP</h1>
			<p class="text-sm font-medium tracking-[3px] text-gray-400 uppercase">Restaurant POS</p>
			<div class="h-[3px] w-12 rounded-full bg-accent"></div>
		</div>

		<!-- Inputs -->
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<label for="username" class="text-xs font-semibold uppercase tracking-wide text-gray-600">
					Username
				</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="e.g. staff"
					class="pos-input"
					autocomplete="username"
					onkeydown={(e) => e.key === 'Enter' && login()}
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="password" class="text-xs font-semibold uppercase tracking-wide text-gray-600">
					Password
				</label>
				<div class="relative">
					<input
						id="password"
						type={showPass ? 'text' : 'password'}
						bind:value={password}
						placeholder="Enter password"
						class="pos-input pr-10"
						autocomplete="current-password"
						onkeydown={(e) => e.key === 'Enter' && login()}
					/>
					<button
						onclick={() => (showPass = !showPass)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						style="min-height: unset"
						tabindex={-1}
					>
						{showPass ? '🙈' : '👁'}
					</button>
				</div>
			</div>

			<!-- Error message -->
			{#if error}
				<p class="rounded-md bg-status-red-light px-3 py-2 text-sm font-medium text-status-red">
					{error}
				</p>
			{/if}
		</div>

		<!-- Submit -->
		<button onclick={login} disabled={!canLogin} class="btn-primary w-full text-base disabled:opacity-40">
			LOGIN →
		</button>

		<div class="flex flex-col items-center gap-1.5 mt-1">
			<p class="text-xs text-gray-400">
				WTF! Samgyupsal POS · v0.1-alpha
			</p>
			<button
				onclick={() => quickLogin('sysadmin')}
				class="text-[10px] font-semibold tracking-wide text-gray-300 hover:text-gray-500 uppercase transition-colors"
				style="min-height: unset"
				tabindex={-1}
			>
				System Admin
			</button>
		</div>
	</div>

	<!-- ─── Test Credentials Panel ───────────────────────────────────────── -->
	<div class="w-[300px] flex flex-col gap-3">
		<!-- Dev badge header -->
		<div class="flex items-center gap-2 px-1">
			<span class="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
				🧪 Dev — Test Accounts
			</span>
			<span class="text-xs text-gray-400">click to login</span>
		</div>

		{#each TEST_GROUPS as group}
			<div class="rounded-xl border border-border bg-surface overflow-hidden">
				<!-- Group heading -->
				<div class="bg-gray-50 border-b border-border px-3 py-2">
					<p class="text-xs font-semibold text-gray-500">{group.heading}</p>
				</div>

				<!-- User rows -->
				<div class="divide-y divide-border">
					{#each group.usernames as u (u)}
						{@const acct = ACCOUNTS[u]}
						{@const rb = roleBadge[acct.role]}
						{@const lb = locationBadge[acct.locationId]}
						<button
							onclick={() => quickLogin(u)}
							class={cn(
								'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary active:scale-[0.99]',
								username === u && 'bg-accent-light'
							)}
							style="min-height: unset"
						>
							<!-- Avatar initial -->
							<div class="h-8 w-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 select-none">
								{acct.displayName[0]}
							</div>

							<!-- Name + badges -->
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold text-gray-900 truncate leading-tight">{acct.displayName}</p>
								<div class="flex items-center gap-1 mt-0.5 flex-wrap">
									<span class={cn('rounded border px-1.5 py-0 text-[10px] font-semibold leading-4', rb.cls)}>
										{rb.label}
									</span>
									<span class={cn('rounded border px-1.5 py-0 text-[10px] font-semibold leading-4', lb.cls)}>
										{lb.label}
									</span>
									{#if acct.requiresPin}
										<span class="rounded border border-orange-200 bg-orange-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-orange-700">
											PIN
										</span>
									{/if}
									{#if acct.kitchenFocus === 'grill'}
										<span class="rounded border border-red-200 bg-red-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-red-700">🔥 Grill</span>
									{:else if acct.kitchenFocus === 'butcher'}
										<span class="rounded border border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-amber-700">⚖️ Butcher</span>
									{:else if acct.kitchenFocus === 'sides'}
										<span class="rounded border border-green-200 bg-green-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-green-700">🥗 Sides</span>
									{/if}
								</div>
							</div>

							<!-- Arrow -->
							<span class="text-gray-300 text-sm flex-shrink-0">›</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- ─── PIN Modal ─────────────────────────────────────────────────────────── -->
{#if showPin}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<div class="pos-card w-[380px] flex flex-col items-center gap-6 py-10 px-10">
			<div class="flex flex-col items-center gap-1">
				<span class="text-3xl">👑</span>
				<h2 class="text-xl font-bold text-gray-900">Manager PIN</h2>
				<p class="text-sm text-gray-500">Enter your 4-digit PIN to continue</p>
			</div>

			<!-- Dots -->
			<div class="flex gap-4">
				{#each Array(4) as _, i}
					<span class={cn(
						'h-3.5 w-3.5 rounded-full transition-all',
						i < pin.length
							? pinError ? 'bg-status-red scale-110' : 'bg-accent scale-110'
							: 'bg-gray-200'
					)}></span>
				{/each}
			</div>
			{#if pinError}
				<p class="text-sm font-medium text-status-red -mt-2">Incorrect PIN. Try again.</p>
			{/if}

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
				<span></span>
				<button
					onclick={() => handlePinKey('0')}
					class="flex h-14 w-16 items-center justify-center rounded-xl bg-surface-secondary text-xl font-semibold text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
				>
					0
				</button>
				<button
					onclick={() => { pin = pin.slice(0, -1); pinError = false; }}
					class="flex h-14 w-16 items-center justify-center rounded-xl bg-surface-secondary text-xl text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
				>
					⌫
				</button>
			</div>

			<button onclick={verifyPin} disabled={pin.length < 4} class="btn-primary w-[220px] disabled:opacity-40">
				VERIFY PIN
			</button>

			<div class="flex flex-col items-center gap-0.5">
				<button onclick={() => { showPin = false; pin = ''; pinError = false; }} class="text-sm font-medium text-accent hover:text-accent-dark" style="min-height: unset">
					← Back
				</button>
				<span class="text-xs text-gray-400">or Cancel</span>
			</div>
		</div>
	</div>
{/if}
