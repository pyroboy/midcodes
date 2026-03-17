<script lang="ts">
	import { Building2 } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-center p-8">
	<div class="max-w-lg w-full text-center space-y-6">
		<div class="flex items-center justify-center gap-2 text-muted-foreground">
			<Building2 class="h-6 w-6" />
			<span class="text-lg font-bold tracking-tight">DormAdmin Suite</span>
		</div>

		<h1 class="text-3xl font-bold tracking-tight">Terms of Service</h1>
		<p class="text-muted-foreground">
			Our Terms of Service are currently being prepared and will be available soon.
		</p>

		<a href="/auth" class="inline-block text-sm font-medium text-primary hover:underline">
			&larr; Back to sign in
		</a>
	</div>
</div>
