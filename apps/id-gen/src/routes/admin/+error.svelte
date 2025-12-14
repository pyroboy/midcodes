<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	// Get error info from the page store
	const error = $derived($page.error);
	const statusCode = $derived($page.status);

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
</script>

<!-- Admin Error content (admin navbar will still be visible) -->
<div class="flex items-center justify-center min-h-[60vh] px-4">
	<div class="max-w-md w-full text-center space-y-6 bg-gray-800/50 rounded-lg p-8 border border-gray-700">
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

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
			<Button href="/admin" variant="default" class="bg-blue-600 hover:bg-blue-700">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				Admin Dashboard
			</Button>
			<Button onclick={() => history.back()} variant="outline" class="border-gray-600 text-gray-300 hover:bg-gray-700">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
	</div>
</div>
