<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { getBypassUrl } from '$lib/utils/adminPermissions';
	import { page } from '$app/stores';

	interface Props {
		requiredRole: string;
		currentRole?: string;
		emulatedRole?: string;
	}

	let { requiredRole, currentRole, emulatedRole }: Props = $props();

	const bypassUrl = $derived(getBypassUrl($page.url));

	function formatRoleName(role: string) {
		return role
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="flex items-center justify-center min-h-[60vh] px-4">
	<div
		class="max-w-lg w-full text-center space-y-6 bg-gray-800/50 rounded-lg p-8 border border-amber-700/50"
	>
		<!-- Warning Icon -->
		<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-900/50">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8 text-amber-400"
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
		</div>

		<!-- Title -->
		<div>
			<h2 class="text-xl font-bold text-white mb-2">Access Restricted</h2>
			<p class="text-gray-400 text-sm">
				This page requires <span class="text-amber-400 font-semibold"
					>{formatRoleName(requiredRole)}</span
				> privileges.
			</p>
		</div>

		<!-- Role Info -->
		<div class="bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm">
			{#if emulatedRole}
				<div class="flex justify-between">
					<span class="text-gray-500">Currently Emulating:</span>
					<span class="text-blue-400">{formatRoleName(emulatedRole)}</span>
				</div>
			{/if}
			{#if currentRole}
				<div class="flex justify-between">
					<span class="text-gray-500">Original Role:</span>
					<span class="text-green-400">{formatRoleName(currentRole)}</span>
				</div>
			{/if}
			<div class="flex justify-between">
				<span class="text-gray-500">Required:</span>
				<span class="text-amber-400">{formatRoleName(requiredRole)}</span>
			</div>
		</div>

		<!-- Super Admin Notice -->
		<div class="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
			<div class="flex items-center gap-2 mb-2">
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
				As a super admin, you can bypass this restriction for debugging purposes. The page will be
				fully functional.
			</p>
		</div>

		<!-- Actions -->
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
				class="border-gray-600 text-gray-300"
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

		<!-- Route Info -->
		<p class="text-xs text-gray-600">Route: {$page.url.pathname}</p>
	</div>
</div>
