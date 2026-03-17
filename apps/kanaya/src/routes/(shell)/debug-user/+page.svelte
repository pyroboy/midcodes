<script lang="ts">
	let { data } = $props();
</script>

<div class="container mx-auto p-8">
	<h1 class="text-2xl font-bold mb-6 text-foreground">User Debug Information</h1>

	<div class="bg-muted p-4 rounded-lg">
		<h2 class="text-lg font-semibold mb-4 text-foreground">Debug Data:</h2>
		<pre
			class="whitespace-pre-wrap text-sm bg-card text-card-foreground p-4 rounded border border-border overflow-auto">
{JSON.stringify(data.debug, null, 2)}
        </pre>
	</div>
</div>
