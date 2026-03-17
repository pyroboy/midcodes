<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	const statusCode = $derived($page.status);
	const error = $derived($page.error);
</script>

<div class="flex items-center justify-center min-h-[60vh] px-4">
	<div class="max-w-md w-full text-center space-y-6">
		<div class="text-5xl font-bold text-muted-foreground">{statusCode}</div>
		<h1 class="text-xl font-bold">Credits Error</h1>
		<p class="text-muted-foreground">{error?.message || 'An error occurred loading your credits.'}</p>
		<div class="flex gap-3 justify-center pt-4">
			<Button href="/credits">Try Again</Button>
			<Button variant="outline" href="/dashboard">Dashboard</Button>
		</div>
	</div>
</div>
