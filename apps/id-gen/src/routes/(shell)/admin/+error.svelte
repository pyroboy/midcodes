<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { getBypassUrl } from '$lib/utils/adminPermissions';

	// Get error info from the page store
	const error = $derived($page.error);
	const statusCode = $derived($page.status);

	// Check if user is super admin from layout data
	const pageData = $derived($page.data);
	const isSuperAdmin = $derived((pageData as any)?.isSuperAdmin as boolean | undefined);
	const roleEmulation = $derived(
		(pageData as any)?.roleEmulation as
			| { active: boolean; emulatedRole?: string; originalRole?: string }
			| undefined
	);

	// Generate bypass URL for super admins
	const bypassUrl = $derived(getBypassUrl($page.url));

	function getErrorTitle(status: number) {
		switch (status) {
			case 403:
				return 'Access Denied';
			case 404:
				return 'Page Not Found';
			case 500:
				return 'Server Error';
			default:
				return 'Something Went Wrong';
		}
	}

	function getErrorDescription(status: number) {
		switch (status) {
			case 403:
				return "You don't have the required permissions to access this admin page.";
			case 404:
				return "The admin page you're looking for doesn't exist.";
			case 500:
				return 'An internal server error occurred.';
			default:
				return 'An unexpected error occurred.';
		}
	}

	function formatRoleName(role: string) {
		return role
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<!-- Admin Error content (admin navbar will still be visible) -->
<div class="flex items-center justify-center min-h-[60vh] px-4">
	<div
		class="max-w-md w-full text-center space-y-6 bg-gray-800/50 rounded-lg p-8 border {statusCode ===
			403 && isSuperAdmin
			? 'border-amber-700/50'
			: 'border-gray-700'}"
	>
		<!-- Status Code -->
		<div class="text-5xl font-bold text-gray-400">
			{statusCode}
		</div>

		<!-- Error Title -->
		<h1 class="text-xl font-bold text-white">
			{getErrorTitle(statusCode)}
		</h1>

		<!-- Error Message -->
		<p class="text-gray-400 text-sm">
			{error?.message || getErrorDescription(statusCode)}
		</p>

		<!-- Super Admin Bypass Section for 403 -->
		{#if statusCode === 403 && isSuperAdmin}
			<!-- Role Info for Super Admins -->
			{#if roleEmulation?.active}
				<div class="bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-500">Currently Emulating:</span>
						<span class="text-blue-400">{formatRoleName(roleEmulation.emulatedRole || '')}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">Original Role:</span>
						<span class="text-green-400"
							>{formatRoleName(roleEmulation.originalRole || 'Super Admin')}</span
						>
					</div>
				</div>
			{/if}

			<!-- Super Admin Notice -->
			<div class="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
				<div class="flex items-center justify-center gap-2 mb-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-purple-400"
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
					<span class="text-purple-300 font-semibold text-sm">Super Admin Detected</span>
				</div>
				<p class="text-purple-200/70 text-xs">
					You can bypass this restriction for debugging purposes.
				</p>
			</div>

			<!-- Bypass Action -->
			<div class="flex flex-col sm:flex-row gap-3 justify-center pt-2">
				<Button href={bypassUrl} variant="default" class="bg-amber-600 hover:bg-amber-700">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
						/>
					</svg>
					Proceed Anyway
				</Button>
				<Button
					onclick={() => history.back()}
					variant="outline"
					class="border-gray-600 text-gray-300 hover:bg-gray-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-2"
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
					Go Back
				</Button>
			</div>
		{:else}
			<!-- Regular Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
				<Button href="/admin" variant="default" class="bg-blue-600 hover:bg-blue-700">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-2"
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
					Admin Dashboard
				</Button>
				<Button
					onclick={() => history.back()}
					variant="outline"
					class="border-gray-600 text-gray-300 hover:bg-gray-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-2"
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
					Go Back
				</Button>
			</div>

			<!-- Help for 403 -->
			{#if statusCode === 403}
				<div class="text-sm text-gray-500 pt-4 border-t border-gray-700 mt-6">
					<p>Your current role may not have access to this feature.</p>
					<p class="mt-1">Contact a super admin if you need access.</p>
				</div>
			{/if}
		{/if}
	</div>
</div>
