<script lang="ts">
	let { data } = $props();
</script>

<div class="container mx-auto p-8">
	<h1 class="text-2xl font-bold mb-6">User Debug Information</h1>

	<div class="bg-gray-100 p-4 rounded-lg">
		<h2 class="text-lg font-semibold mb-4">Debug Data:</h2>
		<pre class="whitespace-pre-wrap text-sm bg-white p-4 rounded border overflow-auto">
{JSON.stringify(data.debug, null, 2)}
        </pre>
	</div>
</div>
