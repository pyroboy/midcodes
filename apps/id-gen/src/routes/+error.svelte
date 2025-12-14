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
				return "You don't have permission to access this page.";
			case 404:
				return "The page you're looking for doesn't exist.";
			case 500:
				return 'An internal server error occurred.';
			default:
				return 'An unexpected error occurred.';
		}
	}

	function getErrorIcon(status: number) {
		switch (status) {
			case 403:
				return '🔒';
			case 404:
				return '🔍';
			case 500:
				return '⚠️';
			default:
				return '❌';
		}
	}
</script>

<!-- Error content within the layout (navbar will still be visible) -->
<div class="flex items-center justify-center min-h-[70vh] px-4">
	<div class="max-w-md w-full text-center space-y-6">
		<!-- Error Icon -->
		<div class="text-6xl mb-4">
			{getErrorIcon(statusCode)}
		</div>

		<!-- Status Code -->
		<div class="text-6xl font-bold text-muted-foreground">
			{statusCode}
		</div>

		<!-- Error Title -->
		<h1 class="text-2xl font-bold text-foreground">
			{getErrorTitle(statusCode)}
		</h1>

		<!-- Error Message -->
		<p class="text-muted-foreground">
			{error?.message || getErrorDescription(statusCode)}
		</p>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
			<Button href="/" variant="default">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
				Go Home
			</Button>
			<Button onclick={() => history.back()} variant="outline">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Go Back
			</Button>
		</div>

		<!-- Help for 403 -->
		{#if statusCode === 403}
			<p class="text-sm text-muted-foreground pt-4 border-t border-border mt-6">
				If you believe you should have access, contact your administrator.
			</p>
		{/if}
	</div>
</div>
