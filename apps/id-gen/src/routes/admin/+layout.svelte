<script lang="ts">
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData & { organization?: any };
		children: any;
	}

	let { data, children }: Props = $props();

	// Check if user has admin permissions
	$effect(() => {
		if (!data.user) {
			// Will be handled by server-side redirect
			return;
		}

		// If explicitly blocked by emulation, we don't warn, we just show the UI
		if (data.blockedByEmulation) return;

		const hasAdminRole =
			data.user.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(data.user.role);
		if (!hasAdminRole) {
			console.warn('User does not have admin permissions');
		}
	});

	async function stopEmulation() {
		try {
			const res = await fetch('/api/admin/stop-emulation', { method: 'POST' });
			if (res.ok) {
				window.location.reload();
			} else {
				console.error('Failed to stop emulation');
				alert('Failed to stop emulation. Please try again.');
			}
		} catch (e) {
			console.error('Error stopping emulation:', e);
			alert('Error stopping emulation.');
		}
	}

	let dismissedWarning = $state(false);
</script>

<div class="min-h-screen bg-background">
	{#if data.blockedByEmulation}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 p-4 text-center"
		>
			<div class="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
				<div class="mb-6">
					<div
						class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-900 mb-4"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8 text-blue-300"
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
					</div>
					<h2 class="text-2xl font-bold text-white mb-2">
						Viewing as {data.roleEmulation?.emulatedRole}
					</h2>
					<p class="text-gray-400">
						You are currently emulating a role that does not have access to the Admin Dashboard.
					</p>
				</div>
				<div class="flex flex-col space-y-3">
					<button
						onclick={stopEmulation}
						class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
					>
						Stop Emulating & Return to Admin
					</button>
					<a
						href="/"
						class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md font-medium transition-colors text-center"
					>
						Go to Dashboard
					</a>
				</div>
			</div>
		</div>
	{:else}
		{#if data.warningEmulationIgnored && !dismissedWarning}
			<div
				class="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-3 flex items-center justify-between"
			>
				<div class="flex items-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 mr-2 text-amber-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<span class="text-sm font-medium">
						Emulation Active: You are viewing this page as your original role ({data.roleEmulation
							?.originalRole}) because your emulated role ({data.roleEmulation?.emulatedRole}) does
						not have access.
					</span>
				</div>
				<div class="flex items-center space-x-3">
					<button onclick={stopEmulation} class="text-sm font-bold underline hover:text-amber-700"
						>Stop Emulating</button
					>
					<button
						onclick={() => (dismissedWarning = true)}
						class="text-amber-500 hover:text-amber-700"
						aria-label="Dismiss warning"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
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
					</button>
				</div>
			</div>
		{/if}
		<!-- Admin-specific header -->
		<header class="bg-gray-900 text-white shadow-lg">
			<div class="container mx-auto px-4">
				<div class="flex justify-between items-center h-16">
					<div class="flex items-center space-x-4">
						<a href="/" class="text-white hover:text-gray-300" aria-label="Back to home">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
						</a>
						<h1 class="text-xl font-bold">Admin Dashboard</h1>
					</div>
					<div class="flex items-center space-x-4">
						{#if data.roleEmulation?.active}
							<div
								class="hidden md:flex items-center bg-blue-900 bg-opacity-50 text-blue-200 px-3 py-1 rounded-full text-xs border border-blue-800 mr-2"
							>
								<span class="mr-2">Viewing as {data.roleEmulation.emulatedRole}</span>
								<button onclick={stopEmulation} class="hover:text-white font-bold underline"
									>Exit</button
								>
							</div>
						{/if}
						<span class="text-sm text-gray-300">
							{data.user?.role} • {data.organization?.name || 'Unknown Org'}
						</span>
						<a href="/profile" class="px-3 py-2 rounded hover:bg-gray-700 text-sm"> Profile </a>
					</div>
				</div>
			</div>
		</header>

		<!-- Admin navigation -->
		<nav class="bg-gray-800 text-white">
			<div class="container mx-auto px-4">
				<div class="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide">
					<a
						href="/admin"
						class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1 sm:mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<span class="hidden sm:inline">Overview</span>
						<span class="sm:hidden">Home</span>
					</a>
					<a
						href="/admin/users"
						class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1 sm:mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
							/>
						</svg>
						Users
					</a>
					<a
						href="/admin/roles"
						class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1 sm:mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
						Roles
					</a>
					<a
						href="/admin/organization"
						class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1 sm:mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
						<span class="hidden sm:inline">Organization</span>
						<span class="sm:hidden">Org</span>
					</a>
					<a
						href="/admin/analytics"
						class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1 sm:mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<span class="hidden sm:inline">Analytics</span>
						<span class="sm:hidden">Stats</span>
					</a>
					<a
						href="/admin/invoices"
						class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1 sm:mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						Invoices
					</a>
					<a
						href="/admin/credits"
						class="flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium hover:text-blue-300 border-b-2 border-transparent hover:border-blue-300 whitespace-nowrap"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-1 sm:mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Credits
					</a>
				</div>
			</div>
		</nav>

		<!-- Main content area -->
		<main class="container mx-auto px-4 py-8">
			{@render children()}
		</main>
	{/if}
</div>
