<script lang="ts">
	// Define our own LayoutProps interface since the $types import is missing
	interface LayoutProps {
		data: any;
		children: any;
	}

	import '$lib/utils/setup-logging';
	import '../app.css';
	import { onMount } from 'svelte';
	import { loadGoogleFonts } from '$lib/config/fonts';
	import { setupGlobalErrorHandlers } from '$lib/utils/errorHandling';
	import { theme } from '$lib/stores/theme';
	import MobileHeader from '$lib/components/MobileHeader.svelte';
	import DesktopHeader from '$lib/components/DesktopHeader.svelte';
	import BottomNavigation from '$lib/components/BottomNavigation.svelte';
	import HamburgerMenu from '$lib/components/HamburgerMenu.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { updateCurrentPath, initPreloadService } from '$lib/services/preloadService';

	import NavigationLoader from '$lib/components/NavigationLoader.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	// Check if current route is a public profile page (no layout needed)
	const isPublicProfilePage = $derived($page.url.pathname.startsWith('/id/'));

	// Path access checking for emulation banner
	import {
		checkPathAccess,
		getAccessStatusColor,
		getAccessStatusLabel,
		getAccessStatusIcon,
		getAllRolesAccessForPath,
		getPathConfig,
		getResourceTypeForPath
	} from '$lib/utils/pathAccessMatrix';

	// Remote-function + route snapshot caches should be scoped per (user+org)
	// and cleared when those change (sign-out / org switch).
	import { clearRemoteFunctionCacheForScope } from '$lib/remote/remoteFunctionCache';
	import { clearAllIdsCache } from './all-ids/allIdsCache';

	let { data, children }: LayoutProps = $props();

	// State for mobile menu
	let isMenuOpen = $state(false);

	// Compute path access status for emulation banner
	// Pass the bypass param to correctly determine if we're bypassing or blocked
	let pathAccessResult = $derived(
		data.roleEmulation?.active
			? checkPathAccess(
					$page.url.pathname,
					data.roleEmulation.emulatedRole,
					data.roleEmulation.originalRole,
					true,
					$page.url.searchParams.get('superadmin_bypass') === 'true'
				)
			: null
	);

	// Get all roles access for the permission matrix
	let allRolesAccess = $derived(
		data.roleEmulation?.active
			? getAllRolesAccessForPath(
					$page.url.pathname,
					data.roleEmulation.emulatedRole,
					data.roleEmulation.originalRole
				)
			: []
	);

	// Get current path config for displaying page name
	let currentPathConfig = $derived(
		data.roleEmulation?.active ? getPathConfig($page.url.pathname) : null
	);

	// State for showing/hiding the permission matrix (shown by default)
	let showPermissionMatrix = $state(true);

	// Get the resource type for current path (for CRUD display)
	let currentResourceType = $derived(
		data.roleEmulation?.active ? getResourceTypeForPath($page.url.pathname) : ''
	);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	/**
	 * Force a session refresh to get updated app_metadata after emulation changes.
	 * The JWT contains stale data until explicitly refreshed.
	 */
	async function refreshSessionAndReload() {
		try {
			// Force session refresh to get new JWT with updated app_metadata
			const refreshRes = await fetch('/api/auth/refresh-session', { method: 'POST' });
			if (!refreshRes.ok) {
				console.warn('Session refresh failed, reloading anyway');
			}
		} catch (e) {
			console.warn('Session refresh error, reloading anyway:', e);
		}
		// Reload the page to apply the new session
		window.location.reload();
	}

	// Stop role emulation
	async function stopEmulation() {
		try {
			const res = await fetch('/api/admin/stop-emulation', { method: 'POST' });
			if (res.ok) {
				// Must refresh session before reload to get updated app_metadata
				await refreshSessionAndReload();
			} else {
				console.error('Failed to stop emulation');
				alert('Failed to stop emulation. Please try again.');
			}
		} catch (e) {
			console.error('Error stopping emulation:', e);
			alert('Error stopping emulation.');
		}
	}

	// Check if currently in bypass mode (via URL param)
	let isBypassingViaUrl = $derived($page.url.searchParams.get('superadmin_bypass') === 'true');

	// Toggle between bypassing (super admin access) and assuming role (get blocked)
	function toggleAssumeRole() {
		const url = new URL($page.url);

		if (isBypassingViaUrl) {
			// Currently bypassing -> switch to assuming role (remove bypass param)
			url.searchParams.delete('superadmin_bypass');
		} else {
			// Currently assuming role or auto-bypassing -> switch to explicit bypass
			url.searchParams.set('superadmin_bypass', 'true');
		}

		// Navigate to the new URL
		window.location.href = url.toString();
	}

	// Navigate to current page without bypass to experience being blocked
	function assumeRole() {
		const url = new URL($page.url);
		url.searchParams.delete('superadmin_bypass');
		window.location.href = url.toString();
	}

	// Navigate to current page with bypass to use super admin access
	function useBypass() {
		const url = new URL($page.url);
		url.searchParams.set('superadmin_bypass', 'true');
		window.location.href = url.toString();
	}

	function formatRoleName(role: string) {
		return role
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Initialize services
	$effect(() => {
		if (browser) {
			// initAnalytics(); // Not in original, not adding
			// initLogging(); // Not in original, not adding

			// Initialize smart preloading
			const cleanupPreload = initPreloadService();

			return () => {
				cleanupPreload?.();
			};
		}
	});

	// Track current path for preload service
	$effect(() => {
		if (browser) {
			updateCurrentPath($page.url.pathname);
		}
	});

	// Clear caches on (user+org) change to avoid cross-tenant leakage and stale state.
	let lastScopeKey: string | null = null;

	$effect(() => {
		if (!browser) return;

		const d = $page.data as any;
		const userId = d?.user?.id ?? null;
		const orgId = d?.org_id ?? null;

		// No scope when unauthenticated or missing org.
		const scopeKey = userId && orgId ? `${userId}:${orgId}` : null;

		// On any change, clear previous scope's caches.
		if (lastScopeKey && lastScopeKey !== scopeKey) {
			clearRemoteFunctionCacheForScope(lastScopeKey);
			clearAllIdsCache(lastScopeKey);
		}

		lastScopeKey = scopeKey;
	});

	// Initialize theme on mount
	onMount(async () => {
		try {
			setupGlobalErrorHandlers();
			await loadGoogleFonts();

			// Initialize theme store (this will apply stored theme or default)
			// The theme store already handles DOM application in its initialization
			const currentTheme = theme.getCurrentTheme();
			console.log('Theme initialized:', currentTheme);
		} catch (error) {
			console.error('Failed to initialize app:', error);
		}
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com" rel="preconnect" />
	<link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Playfair+Display:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-background text-foreground theme-transition">
	{#if isPublicProfilePage}
		<!-- Public profile pages: minimal layout, no navigation -->
		{@render children()}
	{:else}
		<!-- Navigation Loading Overlay -->
		<NavigationLoader />

		{#if data.user}
		<!-- Mobile Header -->
		<MobileHeader user={data.user} onMenuToggle={toggleMenu} class="lg:hidden" />

		<!-- Desktop Header (hidden on mobile) -->
		<DesktopHeader user={data.user} class="hidden lg:block" />

		<!-- Hamburger Menu -->
		<HamburgerMenu isOpen={isMenuOpen} user={data.user} onClose={closeMenu} />

		<!-- Role Emulation Banner (Global) -->
		{#if data.roleEmulation?.active}
			<div
				class="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg lg:ml-64"
			>
				<div class="px-4 py-2 flex items-center justify-between gap-2">
					<div class="flex items-center gap-3 flex-wrap min-w-0">
						<!-- Eye icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
						<!-- Role transition -->
						<span class="text-sm font-medium whitespace-nowrap">
							<span class="opacity-75"
								>{formatRoleName(data.roleEmulation.originalRole || 'Admin')}</span
							>
							<span class="mx-1">→</span>
							<span class="font-bold">{formatRoleName(data.roleEmulation.emulatedRole || '')}</span>
						</span>
						<!-- Separator -->
						<span class="text-white/40 hidden sm:inline">|</span>
						<!-- Page with access status -->
						{#if pathAccessResult}
							<div class="hidden sm:flex items-center gap-2 text-xs">
								<!-- Page path -->
								<span
									class="font-mono bg-white/10 px-2 py-0.5 rounded truncate max-w-[200px]"
									title={$page.url.pathname}
								>
									{$page.url.pathname}
								</span>
								<!-- Access status badge -->
								<span
									class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold {getAccessStatusColor(
										pathAccessResult.status
									)}"
									title={pathAccessResult.reason}
								>
									<span>{getAccessStatusIcon(pathAccessResult.status)}</span>
									<span class="hidden md:inline"
										>{getAccessStatusLabel(pathAccessResult.status)}</span
									>
								</span>
							</div>
						{/if}
					</div>
					<!-- Action buttons -->
					<div class="flex items-center gap-2 flex-shrink-0">
						<!-- Assume Role / Use Bypass toggle button -->
						{#if pathAccessResult && (pathAccessResult.status === 'bypassing' || pathAccessResult.status === 'blocked')}
							{#if isBypassingViaUrl}
								<!-- Currently explicitly bypassing - offer to assume role -->
								<button
									onclick={assumeRole}
									class="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500/30 hover:bg-amber-500/50 rounded-full transition-colors border border-amber-400/50"
									title="Experience this page as {data.roleEmulation.emulatedRole} (get blocked)"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3 w-3"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
										/>
									</svg>
									<span>Assume Role</span>
								</button>
							{:else if pathAccessResult.status === 'bypassing'}
								<!-- Currently auto-bypassing - offer to assume role -->
								<button
									onclick={assumeRole}
									class="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500/30 hover:bg-amber-500/50 rounded-full transition-colors border border-amber-400/50"
									title="Experience this page as {data.roleEmulation.emulatedRole} (get blocked)"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3 w-3"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
										/>
									</svg>
									<span>Assume Role</span>
								</button>
							{:else}
								<!-- Currently blocked - offer to use bypass -->
								<button
									onclick={useBypass}
									class="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-500/30 hover:bg-green-500/50 rounded-full transition-colors border border-green-400/50"
									title="Bypass restriction using {data.roleEmulation.originalRole} privileges"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3 w-3"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
										/>
									</svg>
									<span>Use Bypass</span>
								</button>
							{/if}
						{/if}
						<!-- Stop Emulating button -->
						<button
							onclick={stopEmulation}
							class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-full transition-colors border border-white/30"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3 w-3"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
							<span class="hidden sm:inline">Stop Emulating</span>
							<span class="sm:hidden">Stop</span>
						</button>
					</div>
				</div>
				<!-- Mobile: show access status and actions on second row -->
				<div class="sm:hidden px-4 pb-2 flex items-center gap-2 text-xs">
					{#if pathAccessResult}
						<span
							class="font-mono bg-white/10 px-2 py-0.5 rounded truncate flex-1"
							title={$page.url.pathname}
						>
							{$page.url.pathname}
						</span>
						<span
							class="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold {getAccessStatusColor(
								pathAccessResult.status
							)}"
							title={pathAccessResult.reason}
						>
							<span>{getAccessStatusIcon(pathAccessResult.status)}</span>
							<span>{getAccessStatusLabel(pathAccessResult.status)}</span>
						</span>
						<!-- Mobile assume/bypass button -->
						{#if pathAccessResult.status === 'bypassing'}
							<button
								onclick={assumeRole}
								class="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50"
								title="Assume role"
							>
								Block
							</button>
						{:else if pathAccessResult.status === 'blocked'}
							<button
								onclick={useBypass}
								class="px-2 py-0.5 rounded-full bg-green-500/30 border border-green-400/50"
								title="Use bypass"
							>
								Bypass
							</button>
						{/if}
					{/if}
				</div>
				<!-- Permission Matrix Toggle Button -->
				<div class="px-4 pb-2 border-t border-white/10">
					<button
						onclick={() => (showPermissionMatrix = !showPermissionMatrix)}
						class="w-full flex items-center justify-center gap-2 py-1 text-xs text-white/70 hover:text-white transition-colors"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3 transition-transform {showPermissionMatrix ? 'rotate-180' : ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
						<span>{showPermissionMatrix ? 'Hide' : 'Show'} Permission Matrix</span>
					</button>
				</div>
				<!-- Permission Matrix (Collapsible) -->
				{#if showPermissionMatrix && allRolesAccess.length > 0}
					<div class="bg-gray-900/50 border-t border-white/10">
						<!-- Page Info Header -->
						{#if currentPathConfig}
							<div
								class="px-4 py-2 text-xs text-white/60 border-b border-white/10 flex items-center justify-between"
							>
								<div>
									<span class="font-medium text-white/80">{currentPathConfig.name}</span>
									<span class="mx-2">—</span>
									<span>{currentPathConfig.description}</span>
								</div>
								<div class="text-[10px] bg-gray-700/50 px-2 py-0.5 rounded">
									Resource: <span class="font-medium text-white/80 capitalize"
										>{currentResourceType}</span
									>
								</div>
							</div>
						{/if}
						<!-- Horizontal Scrollable Roles List -->
						<div class="overflow-x-auto">
							<div class="flex gap-0 min-w-max">
								{#each allRolesAccess as roleInfo}
									<div
										class="flex flex-col items-center px-3 py-2 border-r border-white/10 last:border-r-0 min-w-[90px]
											{roleInfo.isEmulatedRole ? 'bg-purple-600/30' : ''}
											{roleInfo.isCurrentRole && !roleInfo.isEmulatedRole ? 'bg-blue-600/30' : ''}"
									>
										<!-- Access Icon -->
										<div class="mb-1">
											{#if roleInfo.hasAccess}
												<span class="text-green-400 text-lg">✓</span>
											{:else}
												<span class="text-red-400 text-lg">✕</span>
											{/if}
										</div>
										<!-- Role Name -->
										<div
											class="text-[10px] text-center leading-tight font-medium mb-1.5
												{roleInfo.isEmulatedRole ? 'text-purple-200' : ''}
												{roleInfo.isCurrentRole && !roleInfo.isEmulatedRole ? 'text-blue-200' : 'text-white/70'}"
										>
											{roleInfo.displayName}
										</div>
										<!-- CRUD Indicators -->
										<div class="flex gap-0.5 text-[9px] font-mono">
											<span
												class="w-4 h-4 flex items-center justify-center rounded {roleInfo.crud
													.create
													? 'bg-green-500/30 text-green-300'
													: 'bg-red-500/20 text-red-400/50'}"
												title="Create">C</span
											>
											<span
												class="w-4 h-4 flex items-center justify-center rounded {roleInfo.crud.read
													? 'bg-green-500/30 text-green-300'
													: 'bg-red-500/20 text-red-400/50'}"
												title="Read">R</span
											>
											<span
												class="w-4 h-4 flex items-center justify-center rounded {roleInfo.crud
													.update
													? 'bg-green-500/30 text-green-300'
													: 'bg-red-500/20 text-red-400/50'}"
												title="Update">U</span
											>
											<span
												class="w-4 h-4 flex items-center justify-center rounded {roleInfo.crud
													.delete
													? 'bg-green-500/30 text-green-300'
													: 'bg-red-500/20 text-red-400/50'}"
												title="Delete">D</span
											>
										</div>
										<!-- Current/Emulated Badge -->
										{#if roleInfo.isEmulatedRole}
											<span
												class="mt-1.5 text-[8px] px-1 py-0.5 rounded bg-purple-500/50 text-purple-200"
												>EMULATED</span
											>
										{:else if roleInfo.isCurrentRole}
											<span
												class="mt-1.5 text-[8px] px-1 py-0.5 rounded bg-blue-500/50 text-blue-200"
												>ORIGINAL</span
											>
										{/if}
									</div>
								{/each}
							</div>
						</div>
						<!-- Legend -->
						<div
							class="px-4 py-1.5 border-t border-white/10 flex flex-wrap items-center gap-3 text-[10px] text-white/50"
						>
							<span class="flex items-center gap-1">
								<span class="text-green-400">✓</span> Has Access
							</span>
							<span class="flex items-center gap-1">
								<span class="text-red-400">✕</span> No Access
							</span>
							<span class="text-white/30">|</span>
							<span class="flex items-center gap-1">
								<span class="bg-green-500/30 text-green-300 px-1 rounded text-[9px] font-mono"
									>C</span
								> Create
							</span>
							<span class="flex items-center gap-1">
								<span class="bg-green-500/30 text-green-300 px-1 rounded text-[9px] font-mono"
									>R</span
								> Read
							</span>
							<span class="flex items-center gap-1">
								<span class="bg-green-500/30 text-green-300 px-1 rounded text-[9px] font-mono"
									>U</span
								> Update
							</span>
							<span class="flex items-center gap-1">
								<span class="bg-green-500/30 text-green-300 px-1 rounded text-[9px] font-mono"
									>D</span
								> Delete
							</span>
							<span class="text-white/30">|</span>
							<span class="flex items-center gap-1">
								<span class="w-3 h-2 bg-purple-600/50 rounded"></span> Emulated
							</span>
							<span class="flex items-center gap-1">
								<span class="w-3 h-2 bg-blue-600/50 rounded"></span> Original
							</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Main Content with proper spacing -->
		<main class="lg:ml-64 lg:pt-16">
			<!-- Content padding to account for fixed header and bottom nav -->
			<div class="pt-0 pb-20 lg:pb-4 min-h-screen">
				{@render children()}
			</div>
		</main>

		<!-- Sidebar integration for desktop -->
		<div
			class="hidden lg:flex lg:fixed lg:top-16 lg:left-0 lg:w-64 lg:h-[calc(100vh-4rem)] border-r border-border bg-background"
		>
			<BottomNavigation
				user={data.user}
				class="lg:flex lg:flex-col lg:w-full lg:relative lg:top-0"
			/>
		</div>

		<!-- Bottom Navigation -->
		<BottomNavigation user={data.user} />
	{:else}
		<!-- Unauthenticated layout - simple header -->
		<header class="bg-background border-b border-border sticky top-0 z-50">
			<div class="container mx-auto px-4">
				<div class="flex justify-between items-center h-16">
					<a href="/" class="flex items-center gap-2">
						<span class="text-2xl font-normal text-foreground/80">ᜃ</span>
						<span class="text-xl font-black tracking-tight text-foreground">Kanaya</span>
					</a>

					<div class="flex items-center gap-6">
						<a
							href="/how-it-works"
							class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
						>
							How It Works
						</a>
						<a
							href="/pricing"
							class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
						>
							Rates
						</a>
						<ThemeToggle variant="ghost" />
						<a
							href="/auth"
							class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
						>
							> Sign In
						</a>
					</div>
				</div>
			</div>
		</header>

		<main class="min-h-screen bg-background">
			{@render children()}
		</main>
		{/if}
	{/if}
</div>

<!-- Toast notifications -->
<Toaster richColors closeButton theme={$theme} />

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
</style>
