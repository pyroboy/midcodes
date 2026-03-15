<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { setSession, MANAGER_PIN } from '$lib/stores/session.svelte';
	import type { Role, KitchenFocus } from '$lib/stores/session.svelte';
	import { writeLog } from '$lib/stores/audit.svelte';
	import { resolveDataMode } from '$lib/stores/data-mode.svelte';
	import { devices } from '$lib/stores/device.svelte';
	import { differenceInSeconds, parseISO } from 'date-fns';
	import { AlertTriangle, Trash2, Download, Share } from 'lucide-svelte';
	import ModalWrapper from '$lib/components/ModalWrapper.svelte';
	import { pinpadKeyboard } from '$lib/actions/pinpad-keyboard';
	import { browser } from '$app/environment';

	// ─── Accounts ─────────────────────────────────────────────────────────────
	import type { LocationId } from '$lib/stores/session.svelte';
	import { LOCATIONS } from '$lib/stores/session.svelte';

	type Account = { password: string; role: Role; displayName: string; dest: string; requiresPin?: boolean; locationId: LocationId; kitchenFocus?: KitchenFocus };

	const ACCOUNTS: Record<string, Account> = {
		// ── Alta Citta · Tagbilaran ─────────────────────────────────────────
		'maria':   { password: 'maria',   role: 'staff',   displayName: 'Maria Santos',       dest: '/pos',                     locationId: 'tag'    },
		'juan':    { password: 'juan',    role: 'manager', displayName: 'Juan Reyes',          dest: '/pos',    requiresPin: true, locationId: 'tag'    },
		'lito':    { password: 'lito',    role: 'kitchen', displayName: 'Lito Paglinawan',     dest: '/kitchen/stove',            locationId: 'tag',   kitchenFocus: 'stove'    },
		'benny':   { password: 'benny',   role: 'kitchen', displayName: 'Benny Flores',        dest: '/kitchen/weigh-station',    locationId: 'tag',   kitchenFocus: 'butcher'  },
		'corazon': { password: 'corazon', role: 'kitchen', displayName: 'Corazon Dela Cruz',   dest: '/kitchen/dispatch',         locationId: 'tag',   kitchenFocus: 'dispatch' },
		// ── Alona Beach · Panglao ───────────────────────────────────────────
		'ana':     { password: 'ana',     role: 'staff',   displayName: 'Ana Lim',             dest: '/pos',                     locationId: 'pgl'   },
		'carlo':   { password: 'carlo',   role: 'manager', displayName: 'Carlo Ramos',         dest: '/pos',    requiresPin: true, locationId: 'pgl'   },
		'romy':    { password: 'romy',    role: 'kitchen', displayName: 'Romy Dalisay',        dest: '/kitchen/stove',            locationId: 'pgl',   kitchenFocus: 'stove'    },
		'dante':   { password: 'dante',   role: 'kitchen', displayName: 'Dante Villanueva',    dest: '/kitchen/weigh-station',    locationId: 'pgl',   kitchenFocus: 'butcher'  },
		'nena':    { password: 'nena',    role: 'kitchen', displayName: 'Nena Ocampo',         dest: '/kitchen/dispatch',         locationId: 'pgl',   kitchenFocus: 'dispatch' },
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

	// Branch columns for 2-column layout
	const BRANCH_COLUMNS: { branch: string; emoji: string; groups: { heading: string; usernames: string[] }[] }[] = [
		{
			branch: 'Alta Citta · Tagbilaran',
			emoji: '🏢',
			groups: [
				{ heading: 'POS / Management', usernames: ['maria', 'juan'] },
				{ heading: 'Kitchen',          usernames: ['lito', 'benny', 'corazon'] },
			]
		},
		{
			branch: 'Alona Beach · Panglao',
			emoji: '🏖️',
			groups: [
				{ heading: 'POS / Management', usernames: ['ana', 'carlo'] },
				{ heading: 'Kitchen',          usernames: ['romy', 'dante', 'nena'] },
			]
		}
	];

	const GLOBAL_GROUPS: { heading: string; usernames: string[] }[] = [
		{ heading: '🏭 Warehouse',  usernames: ['noel']  },
		{ heading: '💼 Management', usernames: ['chris'] },
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

	// ─── P1: Duplicate session warning ────────────────────────────────────────
	let showDuplicateWarning = $state(false);
	let duplicateDeviceName  = $state('');
	let pendingAccount       = $state<Account | null>(null);
	let pendingUsername       = $state('');

	function checkDuplicateSession(displayName: string): { isDuplicate: boolean; deviceName: string } {
		const deviceList = devices.value || [];
		const now = new Date();
		for (const dev of deviceList) {
			if (!dev.lastSeenAt || !dev.userName) continue;
			const diff = differenceInSeconds(now, parseISO(dev.lastSeenAt));
			if (diff < 120 && dev.userName === displayName) {
				return { isDuplicate: true, deviceName: dev.name || dev.deviceType || 'another device' };
			}
		}
		return { isDuplicate: false, deviceName: '' };
	}

	async function proceedWithLogin(account: Account) {
		setSession(account.displayName, account.role, account.locationId, account.kitchenFocus ?? null);
		await resolveDataMode();
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

	// ─── Login logic ──────────────────────────────────────────────────────────
	function login() {
		error = '';
		const u = username.trim().toLowerCase();
		const account = ACCOUNTS[u];

		if (!account) { error = 'Username not found.'; return; }
		if (account.password !== password) { error = 'Incorrect password.'; return; }

		// P1: Check if this user is already logged in on another device
		const { isDuplicate, deviceName } = checkDuplicateSession(account.displayName);
		if (isDuplicate) {
			pendingAccount = account;
			pendingUsername = u;
			duplicateDeviceName = deviceName;
			showDuplicateWarning = true;
			return;
		}

		proceedWithLogin(account);
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
		// Goes through the same duplicate-check flow via login()
		login();
	}

	const canLogin = $derived(username.trim().length > 0 && password.length > 0);

	// ─── PWA Install Prompt ───────────────────────────────────────────────────
	let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let showIosInstructions = $state(false);
	let isStandalone = $state(false);

	// Detect platform
	const isIos = $derived(browser && /iPad|iPhone|iPod/.test(navigator.userAgent));
	const isSafari = $derived(browser && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent));
	const canShowInstall = $derived(!isStandalone && (!!deferredPrompt || (isIos && isSafari)));

	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	$effect(() => {
		if (!browser) return;

		// Already running as installed PWA?
		isStandalone = window.matchMedia('(display-mode: standalone)').matches
			|| (navigator as any).standalone === true;

		const handler = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
		};
		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	});

	async function installPwa() {
		if (deferredPrompt) {
			await deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			if (outcome === 'accepted') deferredPrompt = null;
		} else if (isIos) {
			showIosInstructions = !showIosInstructions;
		}
	}

	let resetting = $state(false);
	async function resetDb() {
		if (!import.meta.env.DEV) { alert('Database reset is only available in dev mode.'); return; }
		if (!confirm('Clear local database and reload? Data will re-sync from server.')) return;
		resetting = true;
		try { sessionStorage.clear(); } catch { /* noop */ }
		try { localStorage.removeItem('wtfpos-sync-gen'); } catch { /* noop */ }
		try { localStorage.removeItem('wtfpos-sync-epoch'); } catch { /* noop */ }
		// Log to server console
		fetch('/api/replication/client-log', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ level: 'error', message: '🧹 RESET-DB button pressed on login page' }),
			keepalive: true,
		}).catch(() => {});
		await new Promise<void>((resolve) => {
			const req = window.indexedDB.deleteDatabase('wtfpos_db');
			req.onsuccess = () => resolve();
			req.onerror = () => resolve();
			req.onblocked = () => resolve();
			setTimeout(resolve, 3000);
		});
		window.location.reload();
	}
</script>

{#snippet userRow(u: string)}
	{@const acct = ACCOUNTS[u]}
	{@const rb = roleBadge[acct.role]}
	<button
		onclick={() => quickLogin(u)}
		class={cn(
			'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:bg-gray-50 active:scale-[0.98]',
			username === u && 'bg-accent/5'
		)}
		style="min-height: unset"
	>
		<div class={cn(
			'h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold select-none',
			acct.role === 'staff' ? 'bg-blue-100 text-blue-700' :
			acct.role === 'manager' ? 'bg-orange-100 text-accent' :
			acct.role === 'kitchen' ? 'bg-emerald-100 text-emerald-700' :
			acct.role === 'owner' ? 'bg-purple-100 text-purple-700' :
			'bg-gray-100 text-gray-600'
		)}>
			{acct.displayName[0]}
		</div>
		<div class="flex-1 min-w-0">
			<p class="text-sm font-semibold text-gray-900 truncate leading-tight">{acct.displayName}</p>
			<div class="flex items-center gap-1 mt-0.5 flex-wrap">
				<span class={cn('rounded border px-1.5 py-0 text-[10px] font-semibold leading-4', rb.cls)}>
					{rb.label}
				</span>
				{#if acct.requiresPin}
					<span class="rounded border border-orange-200 bg-orange-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-orange-700">PIN</span>
				{/if}
				{#if acct.kitchenFocus === 'butcher'}
					<span class="rounded border border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-amber-700">⚖️ Butcher</span>
				{:else if acct.kitchenFocus === 'dispatch'}
					<span class="rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-cyan-700">📋 Dispatch</span>
				{:else if acct.kitchenFocus === 'stove'}
					<span class="rounded border border-orange-200 bg-orange-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-orange-700">🍳 Stove</span>
				{:else if acct.kitchenFocus === 'sides'}
					<span class="rounded border border-green-200 bg-green-50 px-1.5 py-0 text-[10px] font-semibold leading-4 text-green-700">🥗 Sides</span>
				{/if}
			</div>
		</div>
		<span class="text-gray-300 text-xs flex-shrink-0">›</span>
	</button>
{/snippet}

<!-- Full-page login -->
<div class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-orange-50/40 p-4 sm:p-6 safe-all">

	<!-- ─── Login Card ───────────────────────────────────────────────────── -->
	<div class="pos-card w-full max-w-[420px] flex flex-col gap-6 p-8 sm:p-10 shadow-xl shadow-gray-200/60">
		<!-- Brand header -->
		<div class="flex flex-col items-center gap-2 text-center">
			<span class="text-5xl leading-none drop-shadow-sm">🔥</span>
			<h1 class="text-3xl font-extrabold tracking-tight text-gray-900">WTF! SAMGYUP</h1>
			<p class="text-sm font-medium tracking-[3px] text-gray-400 uppercase">Restaurant POS</p>
			<div class="h-[3px] w-12 rounded-full bg-accent"></div>
		</div>

		<!-- Inputs -->
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<label for="username" class="text-xs font-semibold uppercase tracking-wide text-gray-600">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="e.g. maria"
					class="pos-input"
					autocomplete="username"
					onkeydown={(e) => e.key === 'Enter' && login()}
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="password" class="text-xs font-semibold uppercase tracking-wide text-gray-600">Password</label>
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

			{#if error}
				<p class="rounded-md bg-status-red-light px-3 py-2 text-sm font-medium text-status-red">{error}</p>
			{/if}
		</div>

		<!-- Submit -->
		<button onclick={login} disabled={!canLogin} class="btn-primary w-full text-base disabled:opacity-40">LOGIN</button>

		<div class="flex flex-col items-center gap-1.5">
			<p class="text-xs text-gray-400">WTF! Samgyupsal POS · v0.1-alpha</p>

			{#if canShowInstall}
				<button
					onclick={installPwa}
					class="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/10 active:scale-[0.97] transition-all"
					style="min-height: unset"
				>
					{#if isIos}
						<Share size={14} />
						Install App
					{:else}
						<Download size={14} />
						Install App
					{/if}
				</button>
				{#if showIosInstructions}
					<div class="rounded-lg border border-border bg-surface p-3 text-xs text-gray-600 max-w-[280px] text-center leading-relaxed shadow-sm">
						<p class="font-semibold text-gray-900 mb-1">Install on iPhone/iPad</p>
						<p>1. Tap the <span class="font-semibold">Share</span> button <span class="text-base leading-none align-middle">⬆</span> in Safari</p>
						<p>2. Scroll down and tap <span class="font-semibold">"Add to Home Screen"</span></p>
						<p>3. Tap <span class="font-semibold">"Add"</span></p>
						<p class="text-gray-400 mt-1.5">Must use Safari — other browsers don't support this on iOS.</p>
					</div>
				{/if}
			{/if}

			<div class="flex items-center gap-3">
				<button
					onclick={() => quickLogin('sysadmin')}
					class="text-[10px] font-semibold tracking-wide text-gray-300 hover:text-gray-500 uppercase transition-colors"
					style="min-height: unset"
					tabindex={-1}
				>
					System Admin
				</button>
				{#if import.meta.env.DEV}
					<span class="text-gray-200">·</span>
					<button
						onclick={resetDb}
						disabled={resetting}
						class="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-gray-300 hover:text-status-red uppercase transition-colors disabled:opacity-50"
						style="min-height: unset"
						tabindex={-1}
					>
						<Trash2 size={10} />
						{resetting ? 'Resetting...' : 'Reset Local DB'}
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- ─── Test Accounts — 2-Column Grid ────────────────────────────────── -->
	<div class="w-full max-w-[700px] mt-6 flex flex-col gap-3">
		<!-- Header -->
		<div class="flex items-center justify-center gap-2">
			<div class="h-px flex-1 bg-gray-200"></div>
			<span class="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
				🧪 Dev — Quick Login
			</span>
			<div class="h-px flex-1 bg-gray-200"></div>
		</div>

		<!-- Branch columns -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{#each BRANCH_COLUMNS as col}
				<div class="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
					<!-- Branch header -->
					<div class="bg-gray-50 border-b border-border px-3 py-2 flex items-center gap-2">
						<span class="text-base leading-none">{col.emoji}</span>
						<p class="text-xs font-bold text-gray-700 uppercase tracking-wide">{col.branch}</p>
					</div>

					{#each col.groups as group, gi}
						{#if gi > 0}
							<div class="border-t border-border"></div>
						{/if}
						<div class="px-3 pt-2 pb-0.5">
							<p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.heading}</p>
						</div>
						<div class="divide-y divide-border/60">
							{#each group.usernames as u (u)}
								{@render userRow(u)}
							{/each}
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<!-- Global accounts row -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{#each GLOBAL_GROUPS as group}
				<div class="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
					<div class="bg-gray-50 border-b border-border px-3 py-2">
						<p class="text-xs font-bold text-gray-700 uppercase tracking-wide">{group.heading}</p>
					</div>
					<div class="divide-y divide-border/60">
						{#each group.usernames as u (u)}
							{@render userRow(u)}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- ─── PIN Modal ─────────────────────────────────────────────────────────── -->
<ModalWrapper open={showPin} onclose={() => { showPin = false; pin = ''; pinError = false; }} zIndex={50} ariaLabel="Manager PIN verification" class="mx-4">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="pos-card w-full max-w-[380px] mx-4 flex flex-col items-center gap-6 py-10 px-10" use:pinpadKeyboard={{ onDigit: handlePinKey, onBackspace: () => { pin = pin.slice(0, -1); pinError = false; }, onClear: () => { pin = ''; pinError = false; }, onSubmit: verifyPin, canSubmit: () => pin.length >= 4 }}>
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
</ModalWrapper>

<!-- ─── P1: Duplicate Session Warning Modal ────────────────────────────────── -->
<ModalWrapper open={showDuplicateWarning && !!pendingAccount} onclose={() => { showDuplicateWarning = false; pendingAccount = null; error = ''; }} zIndex={50} ariaLabel="Duplicate session warning" class="mx-4">
	{#if pendingAccount}
		<div class="pos-card w-full max-w-[420px] mx-4 flex flex-col items-center gap-5 py-8 px-8">
			<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
				<AlertTriangle class="h-7 w-7 text-amber-600" />
			</div>

			<div class="flex flex-col items-center gap-1 text-center">
				<h2 class="text-lg font-bold text-gray-900">Already logged in</h2>
				<p class="text-sm text-gray-600 leading-relaxed max-w-xs">
					<span class="font-semibold text-gray-900">{pendingAccount.displayName}</span> is already active on
					<span class="font-semibold text-gray-900">{duplicateDeviceName}</span>.
				</p>
				<p class="text-xs text-gray-400 mt-1">
					Logging in here may cause data conflicts if both devices edit the same order.
				</p>
			</div>

			<div class="flex w-full flex-col gap-2">
				<button
					onclick={() => {
						showDuplicateWarning = false;
						if (pendingAccount) proceedWithLogin(pendingAccount);
						pendingAccount = null;
					}}
					class="btn-primary w-full"
				>
					Continue anyway
				</button>
				<button
					onclick={() => {
						showDuplicateWarning = false;
						pendingAccount = null;
						error = '';
					}}
					class="btn-secondary w-full"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}
</ModalWrapper>
